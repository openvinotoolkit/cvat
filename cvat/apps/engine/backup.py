# Copyright (C) 2021 Intel Corporation
#
# SPDX-License-Identifier: MIT

import io
import os
from enum import Enum
import shutil
from zipfile import ZipFile

from django.conf import settings
from rest_framework.parsers import JSONParser
from rest_framework.renderers import JSONRenderer

import cvat.apps.dataset_manager as dm
from cvat.apps.engine import models
from cvat.apps.engine.log import slogger
from cvat.apps.engine.serializers import (AttributeSerializer, DataSerializer,
    LabeledDataSerializer, SegmentSerializer, SimpleJobSerializer, TaskSerializer)
from cvat.apps.engine.utils import av_scan_paths
from cvat.apps.engine.models import StorageChoice, StorageMethodChoice, DataChoice, Job
from cvat.apps.engine.task import _create_thread


class Version(Enum):
        V1 = '1.0'

class _TaskBackupBase():
    MANIFEST_FILENAME = 'task.json'
    ANNOTATIONS_FILENAME = 'annotations.json'
    DATA_DIRNAME = 'data'
    TASK_DIRNAME = 'task'

    def _prepare_meta(self, allowed_keys, meta):
        keys_to_drop = set(meta.keys()) - allowed_keys
        if keys_to_drop:
            logger = slogger.task[self._db_task.id] if hasattr(self, '_db_task') else slogger.glob

            logger.warning('the following keys are dropped {}'.format(keys_to_drop))
            for key in keys_to_drop:
                del meta[key]

        return meta

    def _prepare_task_meta(self, task):
        allowed_fields = {
            'name',
            'bug_tracker',
            'status',
            'subset',
            'labels',
        }

        return self._prepare_meta(allowed_fields, task)

    def _prepare_data_meta(self, data):
        allowed_fields = {
            'chunk_size',
            'image_quality',
            'start_frame',
            'stop_frame',
            'frame_filter',
            'chunk_type',
            'storage_method',
            'storage',
        }

        self._prepare_meta(allowed_fields, data)
        if 'frame_filter' in data and not data['frame_filter']:
            data.pop('frame_filter')

        return data

    def _prepare_segment_meta(self, segments):
        allowed_fields = {
            'start_frame',
            'stop_frame',
        }
        return self._prepare_meta(allowed_fields, segments)

    def _prepare_job_meta(self, jobs):
        allowed_fields = {
            'id',
            'status',
        }
        return self._prepare_meta(allowed_fields, jobs)

    def _prepare_annotations(self, annotations):
        allowed_fields = {
            'label_id',
            'type',
            'occluded',
            'z_order',
            'points',
            'frame',
            'group',
            'source',
            'attributes',
            'shapes',
        }

        for tag in annotations['tags']:
            self._prepare_meta(allowed_fields, tag)
        for shape in annotations['shapes']:
            self._prepare_meta(allowed_fields, shape)
        for track in annotations['tracks']:
            self._prepare_meta(allowed_fields, track)

        return annotations

class TaskExporter(_TaskBackupBase):
    def __init__(self, pk, version=Version.V1):
        self._db_task = models.Task.objects.prefetch_related('data__images').select_related('data__video').get(pk=pk)
        self._db_task.segment_set.all().prefetch_related('job_set')
        self._db_data = self._db_task.data
        self._version = version

    def _write_files(self, source_dir, zip_object, files, target_dir):
        for filename in files:
            arcname = os.path.normpath(
                os.path.join(
                    target_dir,
                    os.path.relpath(filename, source_dir),
                )
            )
            zip_object.write(filename=filename, arcname=arcname)

    def _write_directory(self, source_dir, zip_object, target_dir, recursive=True, exclude_files=None):
        for root, dirs, files in os.walk(source_dir, topdown=True):
            if not recursive:
                dirs.clear()

            if files:
                self._write_files(
                    source_dir=source_dir,
                    zip_object=zip_object,
                    files=(os.path.join(root, f) for f in files if not exclude_files or f not in exclude_files),
                    target_dir=target_dir,
                )

    def _write_data(self, zip_object):
        if self._db_data.storage == StorageChoice.LOCAL:
            self._write_directory(
                source_dir=self._db_data.get_upload_dirname(),
                zip_object=zip_object,
                target_dir=self.DATA_DIRNAME,
            )
        else:
            data_dir = settings.SHARE_ROOT
            if hasattr(self._db_data, 'video'):
                media_files = (os.path.join(data_dir, self._db_data.video.path), )
            else:
                media_files = (os.path.join(data_dir, im.path) for im in self._db_data.images.all().order_by('frame'))

            self._write_files(
                source_dir=data_dir,
                zip_object=zip_object,
                files=media_files,
                target_dir=self.DATA_DIRNAME
            )

            upload_dir = self._db_data.get_upload_dirname()
            self._write_files(
                source_dir=upload_dir,
                zip_object=zip_object,
                files=(os.path.join(upload_dir, f) for f in ('manifest.jsonl', 'index.json')),
                target_dir=self.DATA_DIRNAME
            )

    def _write_task(self, zip_object):
        task_dir = self._db_task.get_task_dirname()
        self._write_directory(
            source_dir=task_dir,
            zip_object=zip_object,
            target_dir=self.TASK_DIRNAME,
            recursive=False,
        )

    def _write_manifest(self, zip_object):
        def serialize_task():
            task_serializer = TaskSerializer(self._db_task)
            task_serializer.fields.pop('url')
            task_serializer.fields.pop('owner')
            task_serializer.fields.pop('assignee')
            task_serializer.fields.pop('segments')

            return self._prepare_task_meta(task_serializer.data)

        def serialize_jobs():
            task_jobs = []
            for db_segment in self._db_task.segment_set.all():
                db_job = db_segment.job_set.first()
                job_serializer = SimpleJobSerializer(db_job)
                job_serializer.fields.pop('url')
                job_data = self._prepare_job_meta(job_serializer.data)
                segment_serailizer = SegmentSerializer(db_segment)
                segment_serailizer.fields.pop('jobs')
                segment = segment_serailizer.data
                segment.update(job_data)
                task_jobs.append(segment)

            return task_jobs

        def serialize_data():
            data_serializer = DataSerializer(self._db_data)
            data = data_serializer.data
            data['chunk_type'] = data.pop('compressed_chunk_type')
            return self._prepare_data_meta(data)

        task = serialize_task()
        task['version'] = self._version.value
        task['data'] = serialize_data()
        task['jobs'] = serialize_jobs()

        zip_object.writestr(self.MANIFEST_FILENAME, data=JSONRenderer().render(task))

    def _write_annotations(self, zip_object):
        def serialize_annotations():
            job_annotations = {}
            for db_segment in self._db_task.segment_set.all():
                for db_job in db_segment.job_set.all():
                    annotations = dm.task.get_job_data(db_job.id)
                    annotations_serializer = LabeledDataSerializer(data=annotations)
                    annotations_serializer.is_valid(raise_exception=True)
                    job_annotations[db_job.id] = self._prepare_annotations(annotations_serializer.data)

            return job_annotations

        annotations = serialize_annotations()
        zip_object.writestr(self.ANNOTATIONS_FILENAME, data=JSONRenderer().render(annotations))

    def export_to(self, filename):
        if self._db_task.data.storage_method == StorageMethodChoice.FILE_SYSTEM and \
           self._db_task.data.storage == StorageChoice.SHARE:
           raise Exception('The task cannot be exported because it does not contain any raw data')
        with ZipFile(filename, 'w') as output_file:
            self._write_data(output_file)
            self._write_task(output_file)
            self._write_manifest(output_file)
            self._write_annotations(output_file)

class TaskImporter(_TaskBackupBase):
    def __init__(self, filename, user_id):
        self._filename = filename
        self._user_id = user_id
        self._manifest, self._annotations = self._read_meta()
        self._version = self._read_version()

    def _read_meta(self):
        with ZipFile(self._filename, 'r') as input_file:
            manifest = JSONParser().parse(io.BytesIO(input_file.read(self.MANIFEST_FILENAME)))
            annotations = JSONParser().parse(io.BytesIO(input_file.read(self.ANNOTATIONS_FILENAME)))
            annotations = {int(job_id): job_annotations for job_id, job_annotations in annotations.items()}

            return manifest, annotations

    def _read_version(self):
        version = self._manifest.pop('version')
        try:
            return Version(version)
        except ValueError:
            raise ValueError('{} version is not supported'.format(version))

    @staticmethod
    def _prepare_dirs(filepath):
        target_dir = os.path.dirname(filepath)
        if not os.path.exists(target_dir):
            os.makedirs(target_dir)

    def _create_labels(self, db_task, labels):
        label_mapping = {}
        attribute_mapping = {}

        for label in labels:
            label_id = label.pop('id')
            attributes = label.pop('attributes', [])
            db_label = models.Label.objects.create(task=db_task, **label)
            label_mapping[label_id] = db_label.id

            for attribute in attributes:
                attribute_id = attribute.pop('id')
                attribute_serializer = AttributeSerializer(data=attribute)
                attribute_serializer.is_valid(raise_exception=True)
                db_attribute = attribute_serializer.save(label=db_label)
                attribute_mapping[attribute_id] = db_attribute.id

        return label_mapping, attribute_mapping

    def _update_annotations(self, labels_mapping, attributes_mapping, annotations):
        def update_ids(objects):
            for obj in objects:
                obj['label_id'] = labels_mapping[obj['label_id']]
                for attribute in obj['attributes']:
                    attribute['spec_id'] = attributes_mapping[attribute['spec_id']]

        update_ids(annotations['tags'])
        update_ids(annotations['shapes'])
        update_ids(annotations['tracks'])
        for track in annotations['tracks']:
            for track_shape in track['shapes']:
                track_shape.pop('id')
                for attribute in track_shape['attributes']:
                    attribute['spec_id'] = attributes_mapping[attribute['spec_id']]

    def _create_annotations(self, db_job, labels_mapping, attributes_mapping, annotations):
        self._update_annotations(labels_mapping, attributes_mapping, annotations)
        self._prepare_annotations(annotations)

        serializer = LabeledDataSerializer(data=annotations)
        serializer.is_valid(raise_exception=True)
        dm.task.put_job_data(db_job.id, serializer.data)

    def _create_data(self, data):
        data_serializer = DataSerializer(data=data)
        data_serializer.is_valid(raise_exception=True)
        db_data = data_serializer.save()
        return db_data

    @staticmethod
    def _calculate_segment_size(jobs):
        segment_size = jobs[0]['stop_frame'] - jobs[0]['start_frame'] + 1
        overlap = 0 if len(jobs) == 1 else jobs[0]['stop_frame'] - jobs[1]['start_frame'] + 1

        return segment_size, overlap

    def _import_task(self):
        data = self._manifest.pop('data')
        labels = self._manifest.pop('labels')
        self._jobs = self._manifest.pop('jobs')

        self._prepare_task_meta(self._manifest)
        self._manifest['segment_size'], self._manifest['overlap'] = self._calculate_segment_size(self._jobs)
        self._manifest["owner_id"] = self._user_id

        self._db_task = models.Task.objects.create(**self._manifest)
        task_path = self._db_task.get_task_dirname()
        if os.path.isdir(task_path):
            shutil.rmtree(task_path)

        os.makedirs(self._db_task.get_task_logs_dirname())
        os.makedirs(self._db_task.get_task_artifacts_dirname())

        self._labels_mapping, self._attributes_mapping = self._create_labels(self._db_task, labels)

        self._prepare_data_meta(data)
        data_serializer = DataSerializer(data=data)
        data_serializer.is_valid(raise_exception=True)
        db_data = data_serializer.save()
        self._db_task.data = db_data
        self._db_task.save()

        data_path = self._db_task.data.get_upload_dirname()
        uploaded_files = []
        with ZipFile(self._filename, 'r') as input_file:
            for f in input_file.namelist():
                if f.startswith(self.DATA_DIRNAME + os.path.sep):
                    target_file = os.path.join(data_path, os.path.relpath(f, self.DATA_DIRNAME))
                    self._prepare_dirs(target_file)
                    with open(target_file, "wb") as out:
                        out.write(input_file.read(f))
                    uploaded_files.append(os.path.relpath(f, self.DATA_DIRNAME))
                elif f.startswith(self.TASK_DIRNAME + os.path.sep):
                    target_file = os.path.join(task_path, os.path.relpath(f, self.TASK_DIRNAME))
                    self._prepare_dirs(target_file)
                    with open(target_file, "wb") as out:
                        out.write(input_file.read(f))

        data['use_zip_chunks'] = data.pop('chunk_type') == DataChoice.IMAGESET
        data = data_serializer.data
        data['client_files'] = uploaded_files
        _create_thread(self._db_task.pk, data.copy(), True)
        db_data.start_frame = data['start_frame']
        db_data.stop_frame = data['stop_frame']
        db_data.frame_filter = data['frame_filter']
        db_data.storage = StorageChoice.LOCAL
        db_data.save(update_fields=['start_frame', 'stop_frame', 'frame_filter', 'storage'])

    def _import_annotations(self):
        job_mapping = {}
        for db_segment in self._db_task.segment_set.all():
            for db_job in db_segment.job_set.all():
                for job in self._jobs:
                    if db_segment.start_frame == job['start_frame']:
                        job_mapping[job['id']] = db_job.id

        for job in self._jobs:
            db_job = Job.objects.get(pk=job_mapping[job['id']])
            self._create_annotations(db_job, self._labels_mapping, self._attributes_mapping, self._annotations[job['id']])


    def import_task(self):
        self._import_task()
        self._import_annotations()
        return self._db_task

def import_task(filename, user):
    av_scan_paths(filename)
    task_importer = TaskImporter(filename, user)
    db_task = task_importer.import_task()
    return db_task.id
