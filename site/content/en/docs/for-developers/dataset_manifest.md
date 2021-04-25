---
title: "Simple command line to prepare dataset manifest file"
linkTitle: "Dataset manifest"
weight: 10
description: This section on [GitHub](https://github.com/openvinotoolkit/cvat/tree/develop/utils/dataset_manifest)
---

### Steps before use

When used separately from Computer Vision Annotation Tool(CVAT), the required dependencies must be installed

#### Ubuntu:20.04

Install dependencies:

```bash
# General
sudo apt-get update && sudo apt-get --no-install-recommends install -y \
    python3-dev python3-pip python3-venv pkg-config
```

```bash
# Library components
sudo apt-get install --no-install-recommends -y \
    libavformat-dev libavcodec-dev libavdevice-dev \
    libavutil-dev libswscale-dev libswresample-dev libavfilter-dev
```

Create an environment and install the necessary python modules:

```bash
python3 -m venv .env
. .env/bin/activate
pip install -U pip
pip install -r requirements.txt
```

### Using

```bash
usage: python create.py [-h] [--force] [--output-dir .] source

positional arguments:
  source                Source paths

optional arguments:
  -h, --help            show this help message and exit
  --force               Use this flag to prepare the manifest file for video data if by default the video does not meet the requirements
                        and a manifest file is not prepared
  --output-dir OUTPUT_DIR
                        Directory where the manifest file will be saved
```

### Alternative way to use with openvino/cvat_server

```bash
docker run -it --entrypoint python3 -v /path/to/host/data/:/path/inside/container/:rw openvino/cvat_server
utils/dataset_manifest/create.py --output-dir /path/to/manifest/directory/ /path/to/data/
```

### Examples of using

Create a dataset manifest in the current directory with video which contains enough keyframes:

```bash
python create.py ~/Documents/video.mp4
```

Create a dataset manifest with video which does not contain enough keyframes:

```bash
python create.py --force --output-dir ~/Documents ~/Documents/video.mp4
```

Create a dataset manifest with images:

```bash
python create.py --output-dir ~/Documents ~/Documents/images/
```

Create a dataset manifest with pattern (may be used `*`, `?`, `[]`):

```bash
python create.py --output-dir ~/Documents "/home/${USER}/Documents/**/image*.jpeg"
```

Create a dataset manifest with `openvino/cvat_server`:

```bash
docker run -it --entrypoint python3 -v ~/Documents/data/:${HOME}/manifest/:rw openvino/cvat_server
utils/dataset_manifest/create.py --output-dir ~/manifest/ ~/manifest/images/
```

### Examples of generated `manifest.jsonl` files

A maifest file contains some intuitive information and some specific like:

`pts` - time at which the frame should be shown to the user
`checksum` - `md5` hash sum for the specific image/frame

#### For a video

```json
{"version":"1.0"}
{"type":"video"}
{"properties":{"name":"video.mp4","resolution":[1280,720],"length":778}}
{"number":0,"pts":0,"checksum":"17bb40d76887b56fe8213c6fded3d540"}
{"number":135,"pts":486000,"checksum":"9da9b4d42c1206d71bf17a7070a05847"}
{"number":270,"pts":972000,"checksum":"a1c3a61814f9b58b00a795fa18bb6d3e"}
{"number":405,"pts":1458000,"checksum":"18c0803b3cc1aa62ac75b112439d2b62"}
{"number":540,"pts":1944000,"checksum":"4551ecea0f80e95a6c32c32e70cac59e"}
{"number":675,"pts":2430000,"checksum":"0e72faf67e5218c70b506445ac91cdd7"}
```

#### For a dataset with images

```json
{"version":"1.0"}
{"type":"images"}
{"name":"image1","extension":".jpg","width":720,"height":405,"checksum":"548918ec4b56132a5cff1d4acabe9947"}
{"name":"image2","extension":".jpg","width":183,"height":275,"checksum":"4b4eefd03cc6a45c1c068b98477fb639"}
{"name":"image3","extension":".jpg","width":301,"height":167,"checksum":"0e454a6f4a13d56c82890c98be063663"}
```
