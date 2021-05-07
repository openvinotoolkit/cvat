# Copyright (C) 2021 Intel Corporation
#
# SPDX-License-Identifier: MIT
import os
import re
import hashlib
import mimetypes
import cv2 as cv
from av import VideoFrame

def rotate_image(image, angle):
    height, width = image.shape[:2]
    image_center = (width/2, height/2)
    matrix = cv.getRotationMatrix2D(image_center, angle, 1.)
    abs_cos = abs(matrix[0,0])
    abs_sin = abs(matrix[0,1])
    bound_w = int(height * abs_sin + width * abs_cos)
    bound_h = int(height * abs_cos + width * abs_sin)
    matrix[0, 2] += bound_w/2 - image_center[0]
    matrix[1, 2] += bound_h/2 - image_center[1]
    matrix = cv.warpAffine(image, matrix, (bound_w, bound_h))
    return matrix

def md5_hash(frame):
    if isinstance(frame, VideoFrame):
        frame = frame.to_image()
    return hashlib.md5(frame.tobytes()).hexdigest() # nosec

def _define_data_type(media):
    media_type, _ = mimetypes.guess_type(media)
    if media_type:
        return media_type.split('/')[0]

def is_video(media_file):
    return _define_data_type(media_file) == 'video'

def is_image(media_file):
    return _define_data_type(media_file) == 'image'


# TODO: Need to update create.py because right now it does not support 3D data at all
def detect_related_images_for(image_path, root_path):
    dirname = os.path.dirname(image_path).rstrip(os.sep)
    dirname_before = os.path.split(dirname)[0]
    dirname_before_before = os.path.split(dirname_before)[0]
    dirname_related_images_exist = os.path.isdir(os.path.join(dirname, 'related_images'))
    dirname_before_related_image_exist = os.path.isdir(os.path.join(dirname_before, 'related_images'))
    relative_image_path = os.path.relpath(image_path, root_path)
    name, ext = os.path.splitext(os.path.basename(image_path))

    # 3D VELODYNE DATA FORMAT
    # velodyne_points/
    #     data/
    #         image_01.bin
    # IMAGE_00 # any number?
    #     data/
    #         image_01.png
    if dirname.endswith('velodyne_points/data'):
        matches = [re.search(r'image_\d.*', directory, re.IGNORECASE)
            for directory in os.listdir(dirname_before_before)
            if os.path.isdir(os.path.join(dirname_before_before, directory))
        ]
        context_dirs = (os.path.join(dirname_before_before, match.group(), 'data') for match in matches if match)
        potentially_related_images = (
            os.path.join(context_dir, context_image) for context_dir in context_dirs for context_image in os.listdir(context_dir)
        )
        potentially_related_images = filter(is_image, potentially_related_images)
        related_images = filter(lambda x: os.path.splitext(os.path.basename(x))[0] == name, potentially_related_images)
        related_images = map(lambda x: os.path.relpath(x, root_path), related_images)
        return relative_image_path, sorted(list(related_images))

    # 3D POINTCLOUD DATA FORMAT
    # pointcloud/
    #     00001.pcd
    # related_images/
    #     00001_pcd/
    #         image_01.png # or other image

    # 2D DATFORMAT
    # data/
    #     00001.png
    #     related_images/
    #         00001_png/
    #             context_image_1.jpeg
    #             context_image_2.png
    elif dirname_related_images_exist or dirname_before_related_image_exist:
        converted_name = '_'.join((name, ext[1:])) if ext else name
        related_images_dir = os.path.join(dirname if dirname_related_images_exist else dirname_before, 'related_images', converted_name)
        if os.path.isdir(related_images_dir):
            relative_related_path = os.path.relpath(related_images_dir, root_path)
            return relative_image_path, sorted(
                list(
                    map(
                        lambda x: os.path.join(relative_related_path, x),
                        filter(lambda x: is_image(os.path.join(related_images_dir, x)), os.listdir(related_images_dir))
                    )
                )
            )

    # 3D, DEFAULT DATAFORMAT
    # Option 1
    # data/
    #     image.pcd
    #     image.png

    # Option 2
    # data/
    #    image_1/
    #        image_1.pcd
    #        context_1.png
    #        context_2.jpg
    else:
        base_path = os.path.relpath(dirname, root_path)
        all_files = filter(lambda x: x != ''.join((name, ext)), os.listdir(dirname))

        if os.path.basename(dirname) != name: # Option 1
            all_files = filter(lambda x: os.path.splitext(x)[0] == name, all_files)

        return relative_image_path, sorted(
            list(
                map(
                    lambda x: os.path.join(base_path, x),
                    filter(lambda x: is_image(os.path.join(dirname, x)), all_files)
                )
            )
        )

    return relative_image_path, []


# image_path is expected to be a list of absolute path to images
# root_path is expected to be a string (dataset root)
def detect_related_images(image_paths, root_path):
    related_images = {k: v for k, v in map(lambda path: detect_related_images_for(path, root_path), image_paths)}
    return related_images
