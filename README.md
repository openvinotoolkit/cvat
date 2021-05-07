# Computer Vision Annotation Tool (CVAT)

[![CI][ci-img]][ci-url]
[![Gitter chat][gitter-img]][gitter-url]
[![Coverage Status][coverage-img]][coverage-url]
[![server pulls][docker-server-pulls-img]][docker-server-image-url]
[![ui pulls][docker-ui-pulls-img]][docker-ui-image-url]
[![DOI][doi-img]][doi-url]

CVAT is free, online, interactive video and image annotation
tool for computer vision. It is being used by our team to
annotate million of objects with different properties. Many UI
and UX decisions are based on feedbacks from professional data
annotation team. Try it online [cvat.org](https://cvat.org).

![CVAT screenshot](cvat/apps/documentation/static/documentation/images/cvat.jpg)

## Documentation

- [Installation guide](cvat/apps/documentation/installation.md)
- [User's guide](cvat/apps/documentation/user_guide.md)
- [Django REST API documentation](#rest-api)
- [Datumaro dataset framework](https://github.com/openvinotoolkit/datumaro/blob/develop/README.md)
- [Command line interface](utils/cli/)
- [XML annotation format](cvat/apps/documentation/xml_format.md)
- [AWS Deployment Guide](cvat/apps/documentation/AWS-Deployment-Guide.md)
- [Frequently asked questions](cvat/apps/documentation/faq.md)
- [Questions](#questions)

## Screencasts

- [Introduction](https://youtu.be/JERohTFp-NI)
- [Annotation mode](https://youtu.be/vH_639N67HI)
- [Interpolation of bounding boxes](https://youtu.be/Hc3oudNuDsY)
- [Interpolation of polygons](https://youtu.be/K4nis9lk92s)
- [Tag annotation video](https://youtu.be/62bI4mF-Xfk)
- [Attribute mode](https://youtu.be/iIkJsOkDzVA)
- [Segmentation mode](https://youtu.be/9Fe_GzMLo3E)
- [Tutorial for polygons](https://youtu.be/C7-r9lZbjBw)
- [Semi-automatic segmentation](https://youtu.be/9HszWP_qsRQ)

## Supported annotation formats

Format selection is possible after clicking on the Upload annotation and Dump
annotation buttons. [Datumaro](https://github.com/openvinotoolkit/datumaro)
dataset framework allows additional dataset transformations via its command
line tool and Python library.

For more information about supported formats look at the
[documentation](cvat/apps/dataset_manager/formats/README.md#formats).

| Annotation format                                                             | Import | Export |
| ----------------------------------------------------------------------------- | ------ | ------ |
| [CVAT for images](cvat/apps/documentation/xml_format.md#annotation)           | X      | X      |
| [CVAT for a video](cvat/apps/documentation/xml_format.md#interpolation)       | X      | X      |
| [Datumaro](https://github.com/openvinotoolkit/datumaro)                       |        | X      |
| [PASCAL VOC](http://host.robots.ox.ac.uk/pascal/VOC/)                         | X      | X      |
| Segmentation masks from [PASCAL VOC](http://host.robots.ox.ac.uk/pascal/VOC/) | X      | X      |
| [YOLO](https://pjreddie.com/darknet/yolo/)                                    | X      | X      |
| [MS COCO Object Detection](http://cocodataset.org/#format-data)               | X      | X      |
| [TFrecord](https://www.tensorflow.org/tutorials/load_data/tfrecord)           | X      | X      |
| [MOT](https://motchallenge.net/)                                              | X      | X      |
| [LabelMe 3.0](http://labelme.csail.mit.edu/Release3.0)                        | X      | X      |
| [ImageNet](http://www.image-net.org)                                          | X      | X      |
| [CamVid](http://mi.eng.cam.ac.uk/research/projects/VideoRec/CamVid/)          | X      | X      |
| [WIDER Face](http://shuoyang1213.me/WIDERFACE/)                               | X      | X      |
| [VGGFace2](https://github.com/ox-vgg/vgg_face2)                               | X      | X      |
| [Market-1501](https://www.aitribune.com/dataset/2018051063)                   | X      | X      |
| [ICDAR13/15](https://rrc.cvc.uab.es/?ch=2)                                    | X      | X      |

## Deep learning serverless functions for automatic labeling

<!--lint disable maximum-line-length-->

| Name                                                                                                    | Type       | Framework  | CPU | GPU |
| ------------------------------------------------------------------------------------------------------- | ---------- | ---------- | --- | --- |
| [Deep Extreme Cut](/serverless/openvino/dextr/nuclio)                                                   | interactor | OpenVINO   | X   |     |
| [Faster RCNN](/serverless/openvino/omz/public/faster_rcnn_inception_v2_coco/nuclio)                     | detector   | OpenVINO   | X   |     |
| [Mask RCNN](/serverless/openvino/omz/public/mask_rcnn_inception_resnet_v2_atrous_coco/nuclio)           | detector   | OpenVINO   | X   |     |
| [YOLO v3](/serverless/openvino/omz/public/yolo-v3-tf/nuclio)                                            | detector   | OpenVINO   | X   |     |
| [Object reidentification](/serverless/openvino/omz/intel/person-reidentification-retail-300/nuclio)     | reid       | OpenVINO   | X   |     |
| [Semantic segmentation for ADAS](/serverless/openvino/omz/intel/semantic-segmentation-adas-0001/nuclio) | detector   | OpenVINO   | X   |     |
| [Text detection v4](/serverless/openvino/omz/intel/text-detection-0004/nuclio)                          | detector   | OpenVINO   | X   |     |
| [SiamMask](/serverless/pytorch/foolwood/siammask/nuclio)                                                | tracker    | PyTorch    | X   |     |
| [f-BRS](/serverless/pytorch/saic-vul/fbrs/nuclio)                                                       | interactor | PyTorch    | X   |     |
| [Inside-Outside Guidance](/serverless/pytorch/shiyinzhang/iog/nuclio)                                   | interactor | PyTorch    | X   |     |
| [Faster RCNN](/serverless/tensorflow/faster_rcnn_inception_v2_coco/nuclio)                              | detector   | TensorFlow | X   | X   |
| [Mask RCNN](/serverless/tensorflow/matterport/mask_rcnn/nuclio)                                         | detector   | TensorFlow | X   | X   |

<!--lint enable maximum-line-length-->

## Online demo: [cvat.org](https://cvat.org)

This is an online demo with the latest version of the annotation tool.
Try it online without local installation. Only own or assigned tasks
are visible to users.

Disabled features:

- [Analytics: management and monitoring of data annotation team](/components/analytics/README.md)

Limitations:

- No more than 10 tasks per user
- Uploaded data is limited to 500Mb

## Prebuilt Docker images

Prebuilt docker images for CVAT releases are available on Docker Hub:

- [cvat_server](https://hub.docker.com/r/openvino/cvat_server)
- [cvat_ui](https://hub.docker.com/r/openvino/cvat_ui)

## REST API

Automatically generated Swagger documentation for Django REST API is available
on `<cvat_origin>/api/swagger`(default: `localhost:8080/api/swagger`).

Swagger documentation is visiable on allowed hostes, Update environement
variable in docker-compose.yml file with cvat hosted machine IP or domain
name. Example - `ALLOWED_HOSTS: 'localhost, 127.0.0.1'`.

## LICENSE

Code released under the [MIT License](https://opensource.org/licenses/MIT).

This software uses LGPL licensed libraries from the [FFmpeg](https://www.ffmpeg.org) project.
The exact steps on how FFmpeg was configured and compiled can be found in the [Dockerfile](Dockerfile).

FFmpeg is an open source framework licensed under LGPL and GPL.
See [https://www.ffmpeg.org/legal.html](https://www.ffmpeg.org/legal.html). You are solely responsible
for determining if your use of FFmpeg requires any
additional licenses. Intel is not responsible for obtaining any
such licenses, nor liable for any licensing fees due in
connection with your use of FFmpeg.

## Questions

CVAT usage related questions or unclear concepts can be posted in our
[Gitter chat](https://gitter.im/opencv-cvat) for **quick replies** from
contributors and other users.

However, if you have a feature request or a bug report that can reproduced,
feel free to open an issue (with steps to reproduce the bug if it's a bug
report) on [GitHub\* issues](https://github.com/opencv/cvat/issues).

If you are not sure or just want to browse other users common questions,
[Gitter chat](https://gitter.im/opencv-cvat) is the way to go.

Other ways to ask questions and get our support:

- [\#cvat](https://stackoverflow.com/search?q=%23cvat) tag on StackOverflow\*
- [Forum on Intel Developer Zone](https://software.intel.com/en-us/forums/computer-vision)

## Links

- [Intel AI blog: New Computer Vision Tool Accelerates Annotation of Digital Images and Video](https://www.intel.ai/introducing-cvat)
- [Intel Software: Computer Vision Annotation Tool: A Universal Approach to Data Annotation](https://software.intel.com/en-us/articles/computer-vision-annotation-tool-a-universal-approach-to-data-annotation)
- [VentureBeat: Intel open-sources CVAT, a toolkit for data labeling](https://venturebeat.com/2019/03/05/intel-open-sources-cvat-a-toolkit-for-data-labeling/)

## Projects using CVAT

- [Onepanel](https://github.com/onepanelio/core) is an open source
  vision AI platform that fully integrates CVAT with scalable data processing
  and parallelized training pipelines.
- [DataIsKey](https://dataiskey.eu/annotation-tool/) uses CVAT as their prime data labeling tool
  to offer annotation services for projects of any size.

<!-- prettier-ignore-start -->
<!-- Badges -->

[docker-server-pulls-img]: https://img.shields.io/docker/pulls/openvino/cvat_server.svg?style=flat-square&label=server%20pulls
[docker-server-image-url]: https://hub.docker.com/r/openvino/cvat_server
[docker-ui-pulls-img]: https://img.shields.io/docker/pulls/openvino/cvat_ui.svg?style=flat-square&label=UI%20pulls
[docker-ui-image-url]: https://hub.docker.com/r/openvino/cvat_ui
[ci-img]: https://github.com/openvinotoolkit/cvat/workflows/CI/badge.svg?branch=develop
[ci-url]: https://github.com/openvinotoolkit/cvat/actions
[gitter-img]: https://badges.gitter.im/opencv-cvat/gitter.png
[gitter-url]: https://gitter.im/opencv-cvat
[coverage-img]: https://coveralls.io/repos/github/openvinotoolkit/cvat/badge.svg?branch=develop
[coverage-url]: https://coveralls.io/github/openvinotoolkit/cvat?branch=develop
[doi-img]: https://zenodo.org/badge/139156354.svg
[doi-url]: https://zenodo.org/badge/latestdoi/139156354
