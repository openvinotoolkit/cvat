# Copyright (C) 2021 Intel Corporation
#
# SPDX-License-Identifier: MIT
import argparse
import os
import sys
import re
from glob import glob

from utils import detect_related_images, is_image, is_video

def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--force', action='store_true',
        help='Use this flag to prepare the manifest file for video data '
             'if by default the video does not meet the requirements and a manifest file is not prepared')
    parser.add_argument('--output-dir',type=str, help='Directory where the manifest file will be saved',
        default=os.getcwd())
    parser.add_argument('source', type=str, help='Source paths')
    return parser.parse_args()

def main():
    args = get_args()

    manifest_directory = os.path.abspath(args.output_dir)
    os.makedirs(manifest_directory, exist_ok=True)
    source = os.path.abspath(os.path.expanduser(args.source))

    sources = []
    if not os.path.isfile(source): # directory/pattern with images
        data_dir = None
        if os.path.isdir(source):
            data_dir = source
            for root, _, files in os.walk(source):
                sources.extend([os.path.join(root, f) for f in files if is_image(f)])
        else:
            items = source.lstrip('/').split('/')
            position = 0
            try:
                for item in items:
                    if set(item) & {'*', '?', '[', ']'}:
                        break
                    position += 1
                else:
                    raise Exception('Wrong positional argument')
                assert position != 0, 'Wrong pattern: there must be a common root'
                data_dir = source.split(items[position])[0]
            except Exception as ex:
                sys.exit(str(ex))
            sources = list(filter(is_image, glob(source, recursive=True)))

        sources = list(filter(lambda x: 'related_images{}'.format(os.sep) not in x, sources))

        # If the source is a glob expression, we need additional processing
        abs_root = source
        while abs_root and re.search('[*?\[\]]', abs_root):
            abs_root = os.path.split(abs_root)[0]

        related_images = detect_related_images(sources, abs_root)
        meta = { k: {'related_images': related_images[k] } for k in related_images }
        try:
            assert len(sources), 'A images was not found'
            manifest = ImageManifestManager(manifest_path=manifest_directory)
            meta_info = manifest.prepare_meta(sources=sources, meta=meta, is_sorted=False,
                use_image_hash=True, data_dir=data_dir)
            manifest.create(meta_info)
        except Exception as ex:
            sys.exit(str(ex))
    else: # video
        try:
            assert is_video(source), 'You can specify a video path or a directory/pattern with images'
            manifest = VideoManifestManager(manifest_path=manifest_directory)
            try:
                meta_info = manifest.prepare_meta(media_file=source, force=args.force)
            except AssertionError as ex:
                if str(ex) == 'Too few keyframes':
                    msg = 'NOTE: prepared manifest file contains too few key frames for smooth decoding.\n' \
                        'Use --force flag if you still want to prepare a manifest file.'
                    print(msg)
                    sys.exit(2)
                else:
                    raise
            manifest.create(meta_info)
        except Exception as ex:
            sys.exit(str(ex))

    print('The manifest file has been prepared')
if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sys.path.append(base_dir)
    from dataset_manifest.core import VideoManifestManager, ImageManifestManager
    main()