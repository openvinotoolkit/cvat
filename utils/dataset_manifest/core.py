# Copyright (C) 2021 Intel Corporation
#
# SPDX-License-Identifier: MIT

import av
import json
import os
from abc import ABC, abstractmethod
from collections import OrderedDict
from contextlib import closing
from PIL import Image
from .utils import md5_hash, rotate_image

class VideoStreamReader:
    def __init__(self, source_path):
        self.source_path = source_path
        self._key_frames = OrderedDict()
        self.frames = 0

        with closing(av.open(self.source_path, mode='r')) as container:
            self.width, self.height = self._get_frame_size(container)

    @staticmethod
    def _get_video_stream(container):
        video_stream = next(stream for stream in container.streams if stream.type == 'video')
        video_stream.thread_type = 'AUTO'
        return video_stream

    @staticmethod
    def _get_frame_size(container):
        video_stream = VideoStreamReader._get_video_stream(container)
        for packet in container.demux(video_stream):
            for frame in packet.decode():
                if video_stream.metadata.get('rotate'):
                    frame = av.VideoFrame().from_ndarray(
                        rotate_image(
                            frame.to_ndarray(format='bgr24'),
                            360 - int(container.streams.video[0].metadata.get('rotate')),
                        ),
                        format ='bgr24',
                    )
                return frame.width, frame.height

    def check_type_first_frame(self):
        with closing(av.open(self.source_path, mode='r')) as container:
            video_stream = self._get_video_stream(container)

            for packet in container.demux(video_stream):
                for frame in packet.decode():
                    if not frame.pict_type.name == 'I':
                        raise Exception('First frame is not key frame')
                    return

    def check_video_timestamps_sequences(self):
        with closing(av.open(self.source_path, mode='r')) as container:
            video_stream = self._get_video_stream(container)

            frame_pts = -1
            frame_dts = -1
            for packet in container.demux(video_stream):
                for frame in packet.decode():

                    if None not in {frame.pts, frame_pts} and frame.pts <= frame_pts:
                        raise Exception('Invalid pts sequences')

                    if None not in {frame.dts, frame_dts} and frame.dts <= frame_dts:
                        raise Exception('Invalid dts sequences')

                    frame_pts, frame_dts = frame.pts, frame.dts

    def rough_estimate_frames_ratio(self, upper_bound):
        analyzed_frames_number, key_frames_number = 0, 0
        _processing_end = False

        with closing(av.open(self.source_path, mode='r')) as container:
            video_stream = self._get_video_stream(container)
            for packet in container.demux(video_stream):
                for frame in packet.decode():
                    if frame.key_frame:
                        key_frames_number += 1
                    analyzed_frames_number += 1
                    if upper_bound == analyzed_frames_number:
                        _processing_end = True
                        break
                if _processing_end:
                    break
        # In our case no videos with non-key first frame, so 1 key frame is guaranteed
        return analyzed_frames_number // key_frames_number

    def validate_frames_ratio(self, chunk_size):
        upper_bound = 3 * chunk_size
        ratio = self.rough_estimate_frames_ratio(upper_bound + 1)
        assert ratio < upper_bound, 'Too few keyframes'

    def get_size(self):
        return self.frames

    @property
    def frame_sizes(self):
        return (self.width, self.height)

    def validate_key_frame(self, container, video_stream, key_frame):
        for packet in container.demux(video_stream):
            for frame in packet.decode():
                if md5_hash(frame) != key_frame[1]['md5'] or frame.pts != key_frame[1]['pts']:
                    self._key_frames.pop(key_frame[0])
                return

    def validate_seek_key_frames(self):
        with closing(av.open(self.source_path, mode='r')) as container:
            video_stream = self._get_video_stream(container)

            key_frames_copy = self._key_frames.copy()

            for key_frame in key_frames_copy.items():
                container.seek(offset=key_frame[1]['pts'], stream=video_stream)
                self.validate_key_frame(container, video_stream, key_frame)

    def save_key_frames(self):
        with closing(av.open(self.source_path, mode='r')) as container:
            video_stream = self._get_video_stream(container)
            frame_number = 0

            for packet in container.demux(video_stream):
                for frame in packet.decode():
                    if frame.key_frame:
                        self._key_frames[frame_number] = {
                            'pts': frame.pts,
                            'md5': md5_hash(frame),
                        }
                    frame_number += 1
            self.frames = frame_number

    @property
    def key_frames(self):
        return self._key_frames

    def __len__(self):
        return len(self._key_frames)

    #TODO: need to change it in future
    def __iter__(self):
        for idx, key_frame in self._key_frames.items():
            yield (idx, key_frame['pts'], key_frame['md5'])


class DatasetImagesReader:
    def __init__(self, sources, meta=None, is_sorted=True, use_image_hash=False, *args, **kwargs):
        self._sources = sources if is_sorted else sorted(sources)
        self._meta = meta
        self._content = []
        self._data_dir = kwargs.get('data_dir', None)
        self._use_image_hash = use_image_hash

    def __iter__(self):
        for image in self._sources:
            img = Image.open(image, mode='r')
            img_name = os.path.relpath(image, self._data_dir) if self._data_dir \
                else os.path.basename(image)
            name, extension = os.path.splitext(img_name)
            image_properties = {
                'name': name,
                'extension': extension,
                'width': img.width,
                'height': img.height,
            }
            if self._meta and img_name in self._meta:
                image_properties['meta'] = self._meta[img_name]
            if self._use_image_hash:
                image_properties['checksum'] = md5_hash(img)
            yield image_properties

    def create(self):
        for item in self:
            self._content.append(item)

    @property
    def content(self):
        return self._content

class _Manifest:
    FILE_NAME = 'manifest.jsonl'
    VERSION = '1.1'

    def __init__(self, path, is_created=False):
        assert path, 'A path to manifest file not found'
        self._path = os.path.join(path, self.FILE_NAME) if os.path.isdir(path) else path
        self._is_created = is_created

    @property
    def path(self):
        return self._path

    @property
    def is_created(self):
        return self._is_created

    @is_created.setter
    def is_created(self, value):
        assert isinstance(value, bool)
        self._is_created = value

# Needed for faster iteration over the manifest file, will be generated to work inside CVAT
# and will not be generated when manually creating a manifest
class _Index:
    FILE_NAME = 'index.json'

    def __init__(self, path):
        assert path and os.path.isdir(path), 'No index directory path'
        self._path = os.path.join(path, self.FILE_NAME)
        self._index = {}

    @property
    def path(self):
        return self._path

    def dump(self):
        with open(self._path, 'w') as index_file:
            json.dump(self._index, index_file,  separators=(',', ':'))

    def load(self):
        with open(self._path, 'r') as index_file:
            self._index = json.load(index_file,
                object_hook=lambda d: {int(k): v for k, v in d.items()})

    def create(self, manifest, skip):
        assert os.path.exists(manifest), 'A manifest file not exists, index cannot be created'
        with open(manifest, 'r+') as manifest_file:
            while skip:
                manifest_file.readline()
                skip -= 1
            image_number = 0
            position = manifest_file.tell()
            line = manifest_file.readline()
            while line:
                if line.strip():
                    self._index[image_number] = position
                    image_number += 1
                    position = manifest_file.tell()
                line = manifest_file.readline()

    def partial_update(self, manifest, number):
        assert os.path.exists(manifest), 'A manifest file not exists, index cannot be updated'
        with open(manifest, 'r+') as manifest_file:
            manifest_file.seek(self._index[number])
            line = manifest_file.readline()
            while line:
                if line.strip():
                    self._index[number] = manifest_file.tell()
                    number += 1
                line = manifest_file.readline()

    def __getitem__(self, number):
        assert 0 <= number < len(self), \
            'A invalid index number: {}\nMax: {}'.format(number, len(self))
        return self._index[number]

    def __len__(self):
        return len(self._index)

class _ManifestManager(ABC):
    BASE_INFORMATION = {
        'version' : 1,
        'type': 2,
    }
    def __init__(self, path, *args, **kwargs):
        self._manifest = _Manifest(path)

    def _parse_line(self, line):
        """ Getting a random line from the manifest file """
        with open(self._manifest.path, 'r') as manifest_file:
            if isinstance(line, str):
                assert line in self.BASE_INFORMATION.keys(), \
                    'An attempt to get non-existent information from the manifest'
                for _ in range(self.BASE_INFORMATION[line]):
                    fline = manifest_file.readline()
                return json.loads(fline)[line]
            else:
                assert self._index, 'No prepared index'
                offset = self._index[line]
                manifest_file.seek(offset)
                properties = manifest_file.readline()
                return json.loads(properties)

    def init_index(self):
        self._index = _Index(os.path.dirname(self._manifest.path))
        if os.path.exists(self._index.path):
            self._index.load()
        else:
            self._index.create(self._manifest.path, 3 if self._manifest.TYPE == 'video' else 2)
            self._index.dump()

    @abstractmethod
    def create(self, content, **kwargs):
        pass

    @abstractmethod
    def partial_update(self, number, properties):
        pass

    def __iter__(self):
        with open(self._manifest.path, 'r') as manifest_file:
            manifest_file.seek(self._index[0])
            image_number = 0
            line = manifest_file.readline()
            while line:
                if not line.strip():
                    continue
                yield (image_number, json.loads(line))
                image_number += 1
                line = manifest_file.readline()

    @property
    def manifest(self):
        return self._manifest

    def __len__(self):
        if hasattr(self, '_index'):
            return len(self._index)
        else:
            return None

    def __getitem__(self, item):
        return self._parse_line(item)

    @property
    def index(self):
        return self._index

class VideoManifestManager(_ManifestManager):
    def __init__(self, manifest_path):
        super().__init__(manifest_path)
        setattr(self._manifest, 'TYPE', 'video')
        self.BASE_INFORMATION['properties'] = 3

    def create(self, content, **kwargs):
        """ Creating and saving a manifest file """
        with open(self._manifest.path, 'w') as manifest_file:
            base_info = {
                'version': self._manifest.VERSION,
                'type': self._manifest.TYPE,
                'properties': {
                    'name': os.path.basename(content.source_path),
                    'resolution': content.frame_sizes,
                    'length': content.get_size(),
                },
            }
            for key, value in base_info.items():
                json_item = json.dumps({key: value}, separators=(',', ':'))
                manifest_file.write(f'{json_item}\n')

            for item in content:
                json_item = json.dumps({
                    'number': item[0],
                    'pts': item[1],
                    'checksum': item[2]
                }, separators=(',', ':'))
                manifest_file.write(f"{json_item}\n")
        self._manifest.is_created = True

    def partial_update(self, number, properties):
        pass

    @staticmethod
    def prepare_meta(media_file, upload_dir=None, chunk_size=36, force=False):
        source_path = os.path.join(upload_dir, media_file) if upload_dir else media_file
        meta_info = VideoStreamReader(source_path=source_path)
        meta_info.check_type_first_frame()
        try:
            meta_info.validate_frames_ratio(chunk_size)
        except AssertionError:
            if not force:
                raise
        meta_info.check_video_timestamps_sequences()
        meta_info.save_key_frames()
        meta_info.validate_seek_key_frames()
        return meta_info

#TODO: add generic manifest structure file validation
class ManifestValidator:
    def validate_base_info(self):
        with open(self._manifest.path, 'r') as manifest_file:
            assert self._manifest.VERSION != json.loads(manifest_file.readline())['version']
            assert self._manifest.TYPE != json.loads(manifest_file.readline())['type']

class VideoManifestValidator(VideoManifestManager):
    def __init__(self, source_path, manifest_path):
        self.source_path = source_path
        super().__init__(manifest_path)

    @staticmethod
    def _get_video_stream(container):
        video_stream = next(stream for stream in container.streams if stream.type == 'video')
        video_stream.thread_type = 'AUTO'
        return video_stream

    def validate_key_frame(self, container, video_stream, key_frame):
        for packet in container.demux(video_stream):
            for frame in packet.decode():
                assert frame.pts == key_frame['pts'], "The uploaded manifest does not match the video"
                return

    def validate_seek_key_frames(self):
        with closing(av.open(self.source_path, mode='r')) as container:
            video_stream = self._get_video_stream(container)
            last_key_frame = None

            for _, key_frame in self:
                # check that key frames sequence sorted
                if last_key_frame and last_key_frame['number'] >= key_frame['number']:
                    raise AssertionError('Invalid saved key frames sequence in manifest file')
                container.seek(offset=key_frame['pts'], stream=video_stream)
                self.validate_key_frame(container, video_stream, key_frame)
                last_key_frame = key_frame

    def validate_frame_numbers(self):
        with closing(av.open(self.source_path, mode='r')) as container:
            video_stream = self._get_video_stream(container)
            # not all videos contain information about numbers of frames
            frames = video_stream.frames
            if frames:
                assert frames == self['properties']['length'], "The uploaded manifest does not match the video"
                return

class ImageManifestManager(_ManifestManager):
    def __init__(self, manifest_path):
        super().__init__(manifest_path)
        setattr(self._manifest, 'TYPE', 'images')

    def create(self, content, **kwargs):
        """ Creating and saving a manifest file"""
        with open(self._manifest.path, 'w') as manifest_file:
            base_info = {
                'version': self._manifest.VERSION,
                'type': self._manifest.TYPE,
            }
            for key, value in base_info.items():
                json_item = json.dumps({key: value}, separators=(',', ':'))
                manifest_file.write(f'{json_item}\n')

            for item in content:
                json_item = json.dumps({
                    key: value for key, value in item.items()
                }, separators=(',', ':'))
                manifest_file.write(f"{json_item}\n")
        self._manifest.is_created = True

    def partial_update(self, number, properties):
        pass

    @staticmethod
    def prepare_meta(sources, **kwargs):
        meta_info = DatasetImagesReader(sources=sources, **kwargs)
        meta_info.create()
        return meta_info