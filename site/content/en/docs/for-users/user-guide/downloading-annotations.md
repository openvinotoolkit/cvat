---
title: "Downloading annotations"
linkTitle: "Downloading annotations"
weight: 9
---
1.  To download the latest annotations, you have to save all changes first.
    click the `Save` button. There is a `Ctrl+S` shortcut to save annotations quickly.
1.  After that, сlick the `Menu` button.
1.  Press the `Dump Annotation` button.

    ![](../../../../images/image028.jpg)

1.  Choose format dump annotation file. Dump annotation are available in several formats:

    - [CVAT for video](../../../../docs/for-developers/xml_format/#interpolation)
      is highlighted if a task has the interpolation mode.
    - [CVAT for images](../../../../docs/for-developers/xml_format/#annotation)
      is highlighted if a task has the annotation mode.

    ![](../../../../images/image029.jpg 'Example XML format')

    - [PASCAL VOC](http://host.robots.ox.ac.uk/pascal/VOC/)
    - [(VOC) Segmentation mask](http://host.robots.ox.ac.uk/pascal/VOC/) —
      archive contains class and instance masks for each frame in the png
      format and a text file with the value of each color.
    - [YOLO](https://pjreddie.com/darknet/yolo/)
    - [COCO](http://cocodataset.org/#format-data)
    - [TFRecord](https://www.tensorflow.org/tutorials/load_data/tfrecord)
    - [MOT](https://motchallenge.net/)
    - [LabelMe 3.0](http://labelme.csail.mit.edu/Release3.0/)
    - [Datumaro](https://github.com/openvinotoolkit/cvat/tree/develop/cvat/apps/dataset_manager/formats/datumaro)
