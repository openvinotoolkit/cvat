# Copyright (C) 2018-2019 Intel Corporation
#
# SPDX-License-Identifier: MIT

import os
import re
from enum import Enum

from django.conf import settings
from django.contrib.auth.models import User
from django.core.files.storage import FileSystemStorage
from django.db import models
from django.utils.translation import gettext_lazy as _


class SafeCharField(models.CharField):
    def get_prep_value(self, value):
        value = super().get_prep_value(value)
        if value:
            return value[:self.max_length]
        return value


class DimensionType(str, Enum):
    DIM_3D = '3d'
    DIM_2D = '2d'

    @classmethod
    def choices(cls):
        return tuple((x.value, x.name) for x in cls)

    def __str__(self):
        return self.value

class StatusChoice(str, Enum):
    ANNOTATION = 'annotation'
    VALIDATION = 'validation'
    COMPLETED = 'completed'

    @classmethod
    def choices(cls):
        return tuple((x.value, x.name) for x in cls)

    def __str__(self):
        return self.value

class DataChoice(str, Enum):
    VIDEO = 'video'
    IMAGESET = 'imageset'
    LIST = 'list'

    @classmethod
    def choices(cls):
        return tuple((x.value, x.name) for x in cls)

    def __str__(self):
        return self.value

class StorageMethodChoice(str, Enum):
    CACHE = 'cache'
    FILE_SYSTEM = 'file_system'

    @classmethod
    def choices(cls):
        return tuple((x.value, x.name) for x in cls)

    def __str__(self):
        return self.value

class StorageChoice(str, Enum):
    #AWS_S3 = 'aws_s3_bucket'
    LOCAL = 'local'
    SHARE = 'share'

    @classmethod
    def choices(cls):
        return tuple((x.value, x.name) for x in cls)

    def __str__(self):
        return self.value

class Data(models.Model):
    chunk_size = models.PositiveIntegerField(null=True)
    size = models.PositiveIntegerField(default=0)
    image_quality = models.PositiveSmallIntegerField(default=50)
    start_frame = models.PositiveIntegerField(default=0)
    stop_frame = models.PositiveIntegerField(default=0)
    frame_filter = models.CharField(max_length=256, default="", blank=True)
    compressed_chunk_type = models.CharField(max_length=32, choices=DataChoice.choices(),
        default=DataChoice.IMAGESET)
    original_chunk_type = models.CharField(max_length=32, choices=DataChoice.choices(),
        default=DataChoice.IMAGESET)
    storage_method = models.CharField(max_length=15, choices=StorageMethodChoice.choices(), default=StorageMethodChoice.FILE_SYSTEM)
    storage = models.CharField(max_length=15, choices=StorageChoice.choices(), default=StorageChoice.LOCAL)
    clowder_api_key = models.CharField(max_length=36, blank=True, default="")

    class Meta:
        default_permissions = ()

    def get_frame_step(self):
        match = re.search("step\s*=\s*([1-9]\d*)", self.frame_filter)
        return int(match.group(1)) if match else 1

    def get_data_dirname(self):
        return os.path.join(settings.MEDIA_DATA_ROOT, str(self.id))

    def get_upload_dirname(self):
        return os.path.join(self.get_data_dirname(), "raw")

    def get_compressed_cache_dirname(self):
        return os.path.join(self.get_data_dirname(), "compressed")

    def get_original_cache_dirname(self):
        return os.path.join(self.get_data_dirname(), "original")

    @staticmethod
    def _get_chunk_name(chunk_number, chunk_type):
        if chunk_type == DataChoice.VIDEO:
            ext = 'mp4'
        elif chunk_type == DataChoice.IMAGESET:
            ext = 'zip'
        else:
            ext = 'list'

        return '{}.{}'.format(chunk_number, ext)

    def _get_compressed_chunk_name(self, chunk_number):
        return self._get_chunk_name(chunk_number, self.compressed_chunk_type)

    def _get_original_chunk_name(self, chunk_number):
        return self._get_chunk_name(chunk_number, self.original_chunk_type)

    def get_original_chunk_path(self, chunk_number):
        return os.path.join(self.get_original_cache_dirname(),
            self._get_original_chunk_name(chunk_number))

    def get_compressed_chunk_path(self, chunk_number):
        return os.path.join(self.get_compressed_cache_dirname(),
            self._get_compressed_chunk_name(chunk_number))

    def get_preview_path(self):
        return os.path.join(self.get_data_dirname(), 'preview.jpeg')

    def get_manifest_path(self):
        return os.path.join(self.get_upload_dirname(), 'manifest.jsonl')
    def get_index_path(self):
        return os.path.join(self.get_upload_dirname(), 'index.json')

class Video(models.Model):
    data = models.OneToOneField(Data, on_delete=models.CASCADE, related_name="video", null=True)
    path = models.CharField(max_length=1024, default='')
    width = models.PositiveIntegerField()
    height = models.PositiveIntegerField()

    class Meta:
        default_permissions = ()


class Image(models.Model):
    data = models.ForeignKey(Data, on_delete=models.CASCADE, related_name="images", null=True)
    path = models.CharField(max_length=1024, default='')
    frame = models.PositiveIntegerField()
    width = models.PositiveIntegerField()
    height = models.PositiveIntegerField()

    class Meta:
        default_permissions = ()


class TrainingProject(models.Model):
    class ProjectClass(models.TextChoices):
        DETECTION = 'OD', _('Object Detection')

    host = models.CharField(max_length=256)
    username = models.CharField(max_length=256)
    password = models.CharField(max_length=256)
    training_id = models.CharField(max_length=64)
    enabled = models.BooleanField(null=True)
    project_class = models.CharField(max_length=2, choices=ProjectClass.choices, null=True, blank=True)


class Project(models.Model):

    name = SafeCharField(max_length=256)
    owner = models.ForeignKey(User, null=True, blank=True,
                              on_delete=models.SET_NULL, related_name="+")
    assignee = models.ForeignKey(User, null=True, blank=True,
                                 on_delete=models.SET_NULL, related_name="+")
    bug_tracker = models.CharField(max_length=2000, blank=True, default="")
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=32, choices=StatusChoice.choices(),
                              default=StatusChoice.ANNOTATION)
    training_project = models.ForeignKey(TrainingProject, null=True, blank=True, on_delete=models.SET_NULL)

    def get_project_dirname(self):
        return os.path.join(settings.PROJECTS_ROOT, str(self.id))

    def get_project_logs_dirname(self):
        return os.path.join(self.get_project_dirname(), 'logs')

    def get_client_log_path(self):
        return os.path.join(self.get_project_logs_dirname(), "client.log")

    def get_log_path(self):
        return os.path.join(self.get_project_logs_dirname(), "project.log")

    # Extend default permission model
    class Meta:
        default_permissions = ()

    def __str__(self):
        return self.name

class Task(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE,
        null=True, blank=True, related_name="tasks",
        related_query_name="task")
    name = SafeCharField(max_length=256)
    mode = models.CharField(max_length=32)
    owner = models.ForeignKey(User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="owners")
    assignee = models.ForeignKey(User, null=True,  blank=True,
        on_delete=models.SET_NULL, related_name="assignees")
    bug_tracker = models.CharField(max_length=2000, blank=True, default="")
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    overlap = models.PositiveIntegerField(null=True)
    # Zero means that there are no limits (default)
    segment_size = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=32, choices=StatusChoice.choices(),
                              default=StatusChoice.ANNOTATION)
    data = models.ForeignKey(Data, on_delete=models.CASCADE, null=True, related_name="tasks")
    dimension = models.CharField(max_length=2, choices=DimensionType.choices(), default=DimensionType.DIM_2D)
    subset = models.CharField(max_length=64, blank=True, default="")

    # Extend default permission model
    class Meta:
        default_permissions = ()

    def get_task_dirname(self):
        return os.path.join(settings.TASKS_ROOT, str(self.id))

    def get_task_logs_dirname(self):
        return os.path.join(self.get_task_dirname(), 'logs')

    def get_client_log_path(self):
        return os.path.join(self.get_task_logs_dirname(), "client.log")

    def get_log_path(self):
        return os.path.join(self.get_task_logs_dirname(), "task.log")

    def get_task_artifacts_dirname(self):
        return os.path.join(self.get_task_dirname(), 'artifacts')

    def __str__(self):
        return self.name


class TrainingProjectImage(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    idx = models.PositiveIntegerField()
    training_image_id = models.CharField(max_length=64)


# Redefined a couple of operation for FileSystemStorage to avoid renaming
# or other side effects.
class MyFileSystemStorage(FileSystemStorage):
    def get_valid_name(self, name):
        return name

    def get_available_name(self, name, max_length=None):
        if self.exists(name) or (max_length and len(name) > max_length):
            raise IOError('`{}` file already exists or its name is too long'.format(name))
        return name

def upload_path_handler(instance, filename):
    return os.path.join(instance.data.get_upload_dirname(), filename)

# For client files which the user is uploaded
class ClientFile(models.Model):
    data = models.ForeignKey(Data, on_delete=models.CASCADE, null=True, related_name='client_files')
    file = models.FileField(upload_to=upload_path_handler,
        max_length=1024, storage=MyFileSystemStorage())

    class Meta:
        default_permissions = ()
        unique_together = ("data", "file")

# For server files on the mounted share
class ServerFile(models.Model):
    data = models.ForeignKey(Data, on_delete=models.CASCADE, null=True, related_name='server_files')
    file = models.CharField(max_length=1024)

    class Meta:
        default_permissions = ()

# For URLs
class RemoteFile(models.Model):
    data = models.ForeignKey(Data, on_delete=models.CASCADE, null=True, related_name='remote_files')
    file = models.CharField(max_length=1024)

    class Meta:
        default_permissions = ()


class ClowderFile(models.Model):
    data = models.ForeignKey(Data, on_delete=models.CASCADE, null=True, related_name='clowder_files')
    clowderid = models.CharField(max_length=1024)
    name = models.CharField(max_length=2048)
    srcdatasetid = models.CharField(max_length=1024)

    class Meta:
        default_permissions = ()


class RelatedFile(models.Model):
    data = models.ForeignKey(Data, on_delete=models.CASCADE, related_name="related_files", default=1, null=True)
    path = models.FileField(upload_to=upload_path_handler,
                            max_length=1024, storage=MyFileSystemStorage())
    primary_image = models.ForeignKey(Image, on_delete=models.CASCADE, related_name="related_files", null=True)

    class Meta:
        default_permissions = ()
        unique_together = ("data", "path")

class Segment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    start_frame = models.IntegerField()
    stop_frame = models.IntegerField()

    class Meta:
        default_permissions = ()

class Job(models.Model):
    segment = models.ForeignKey(Segment, on_delete=models.CASCADE)
    assignee = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    reviewer = models.ForeignKey(User, null=True, blank=True, related_name='review_job_set', on_delete=models.SET_NULL)
    status = models.CharField(max_length=32, choices=StatusChoice.choices(),
        default=StatusChoice.ANNOTATION)

    class Meta:
        default_permissions = ()

class Label(models.Model):
    task = models.ForeignKey(Task, null=True, blank=True, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, null=True, blank=True, on_delete=models.CASCADE)
    name = SafeCharField(max_length=64)
    color = models.CharField(default='', max_length=8)

    def __str__(self):
        return self.name

    class Meta:
        default_permissions = ()
        unique_together = ('task', 'name')


class TrainingProjectLabel(models.Model):
    cvat_label = models.ForeignKey(Label, on_delete=models.CASCADE, related_name='training_project_label')
    training_label_id = models.CharField(max_length=64)


class AttributeType(str, Enum):
    CHECKBOX = 'checkbox'
    RADIO = 'radio'
    NUMBER = 'number'
    TEXT = 'text'
    SELECT = 'select'

    @classmethod
    def choices(cls):
        return tuple((x.value, x.name) for x in cls)

    def __str__(self):
        return self.value

class AttributeSpec(models.Model):
    label = models.ForeignKey(Label, on_delete=models.CASCADE)
    name = models.CharField(max_length=64)
    mutable = models.BooleanField()
    input_type = models.CharField(max_length=16,
        choices=AttributeType.choices())
    default_value = models.CharField(max_length=128)
    values = models.CharField(max_length=4096)

    class Meta:
        default_permissions = ()
        unique_together = ('label', 'name')

    def __str__(self):
        return self.name

class AttributeVal(models.Model):
    # TODO: add a validator here to be sure that it corresponds to self.label
    id = models.BigAutoField(primary_key=True)
    spec = models.ForeignKey(AttributeSpec, on_delete=models.CASCADE)
    value = SafeCharField(max_length=4096)

    class Meta:
        abstract = True
        default_permissions = ()

class ShapeType(str, Enum):
    RECTANGLE = 'rectangle' # (x0, y0, x1, y1)
    POLYGON = 'polygon'     # (x0, y0, ..., xn, yn)
    POLYLINE = 'polyline'   # (x0, y0, ..., xn, yn)
    POINTS = 'points'       # (x0, y0, ..., xn, yn)
    CUBOID = 'cuboid'       # (x0, y0, ..., x7, y7)

    @classmethod
    def choices(cls):
        return tuple((x.value, x.name) for x in cls)

    def __str__(self):
        return self.value

class SourceType(str, Enum):
    AUTO = 'auto'
    MANUAL = 'manual'

    @classmethod
    def choices(self):
        return tuple((x.value, x.name) for x in self)

    def __str__(self):
        return self.value

class ReviewStatus(str, Enum):
    ACCEPTED = 'accepted'
    REJECTED = 'rejected'
    REVIEW_FURTHER = 'review_further'

    @classmethod
    def choices(self):
        return tuple((x.value, x.name) for x in self)

    def __str__(self):
        return self.value

class Annotation(models.Model):
    id = models.BigAutoField(primary_key=True)
    job = models.ForeignKey(Job, on_delete=models.CASCADE)
    label = models.ForeignKey(Label, on_delete=models.CASCADE)
    frame = models.PositiveIntegerField()
    group = models.PositiveIntegerField(null=True)
    source = models.CharField(max_length=16, choices=SourceType.choices(),
        default=str(SourceType.MANUAL), null=True)

    class Meta:
        abstract = True
        default_permissions = ()

class Commit(models.Model):
    id = models.BigAutoField(primary_key=True)
    author = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    version = models.PositiveIntegerField(default=0)
    timestamp = models.DateTimeField(auto_now=True)
    message = models.CharField(max_length=4096, default="")

    class Meta:
        abstract = True
        default_permissions = ()

class JobCommit(Commit):
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="commits")

class FloatArrayField(models.TextField):
    separator = ","

    def from_db_value(self, value, expression, connection):
        if not value:
            return value
        return [float(v) for v in value.split(self.separator)]

    def to_python(self, value):
        if isinstance(value, list):
            return value

        return self.from_db_value(value, None, None)

    def get_prep_value(self, value):
        return self.separator.join(map(str, value))

class Shape(models.Model):
    type = models.CharField(max_length=16, choices=ShapeType.choices())
    occluded = models.BooleanField(default=False)
    z_order = models.IntegerField(default=0)
    points = FloatArrayField()

    class Meta:
        abstract = True
        default_permissions = ()

class LabeledImage(Annotation):
    pass

class LabeledImageAttributeVal(AttributeVal):
    image = models.ForeignKey(LabeledImage, on_delete=models.CASCADE)

class LabeledShape(Annotation, Shape):
    pass

class LabeledShapeAttributeVal(AttributeVal):
    shape = models.ForeignKey(LabeledShape, on_delete=models.CASCADE)

class LabeledTrack(Annotation):
    pass

class LabeledTrackAttributeVal(AttributeVal):
    track = models.ForeignKey(LabeledTrack, on_delete=models.CASCADE)

class TrackedShape(Shape):
    id = models.BigAutoField(primary_key=True)
    track = models.ForeignKey(LabeledTrack, on_delete=models.CASCADE)
    frame = models.PositiveIntegerField()
    outside = models.BooleanField(default=False)

class TrackedShapeAttributeVal(AttributeVal):
    shape = models.ForeignKey(TrackedShape, on_delete=models.CASCADE)

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    rating = models.FloatField(default=0.0)

class Review(models.Model):
    job = models.ForeignKey(Job, on_delete=models.CASCADE)
    reviewer = models.ForeignKey(User, null=True, blank=True, related_name='reviews', on_delete=models.SET_NULL)
    assignee = models.ForeignKey(User, null=True, blank=True, related_name='reviewed', on_delete=models.SET_NULL)
    estimated_quality = models.FloatField()
    status = models.CharField(max_length=16, choices=ReviewStatus.choices())

class Issue(models.Model):
    frame = models.PositiveIntegerField()
    position = FloatArrayField()
    job = models.ForeignKey(Job, on_delete=models.CASCADE)
    review = models.ForeignKey(Review, null=True, blank=True, on_delete=models.SET_NULL)
    owner = models.ForeignKey(User, null=True, blank=True, related_name='issues', on_delete=models.SET_NULL)
    resolver = models.ForeignKey(User, null=True, blank=True, related_name='resolved_issues', on_delete=models.SET_NULL)
    created_date = models.DateTimeField(auto_now_add=True)
    resolved_date = models.DateTimeField(null=True, blank=True)

class Comment(models.Model):
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE)
    author = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    message = models.TextField(default='')
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
