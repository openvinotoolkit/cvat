---
linkTitle: "TFRecord"
weight: 8
---

### [TFRecord](https://www.tensorflow.org/tutorials/load_data/tfrecord)<a id="tfrecord" />

TFRecord is a very flexible format, but we try to correspond the
format that used in
[TF object detection](https://github.com/tensorflow/models/tree/master/research/object_detection)
with minimal modifications.

Used feature description:

```python
image_feature_description = {
    'image/filename': tf.io.FixedLenFeature([], tf.string),
    'image/source_id': tf.io.FixedLenFeature([], tf.string),
    'image/height': tf.io.FixedLenFeature([], tf.int64),
    'image/width': tf.io.FixedLenFeature([], tf.int64),
    # Object boxes and classes.
    'image/object/bbox/xmin': tf.io.VarLenFeature(tf.float32),
    'image/object/bbox/xmax': tf.io.VarLenFeature(tf.float32),
    'image/object/bbox/ymin': tf.io.VarLenFeature(tf.float32),
    'image/object/bbox/ymax': tf.io.VarLenFeature(tf.float32),
    'image/object/class/label': tf.io.VarLenFeature(tf.int64),
    'image/object/class/text': tf.io.VarLenFeature(tf.string),
}
```

#### TFRecord export

Downloaded file: a zip archive with following structure:

```bash
taskname.zip/
├── default.tfrecord
└── label_map.pbtxt

# label_map.pbtxt
item {
	id: 1
	name: 'label_0'
}
item {
	id: 2
	name: 'label_1'
}
...
```

- supported annotations: Rectangles, Polygons (as masks, manually over [Datumaro](https://github.com/openvinotoolkit/datumaro/blob/develop/docs/user_manual.md))

How to export masks:
1. Export annotations in `Datumaro` format
1. Apply `polygons_to_masks` and `boxes_to_masks` transforms
  ```bash
  datum transform -t polygons_to_masks -p path/to/proj -o ptm
  datum transform -t boxes_to_masks -p ptm -o btm
  ```
1. Export in the `TF Detection API` format
  ```bash
  datum export -f tf_detection_api -p btm [-- --save-images]
  ```

#### TFRecord import

Uploaded file: a zip archive of following structure:

```bash
taskname.zip/
└── <any name>.tfrecord
```

- supported annotations: Rectangles

#### How to create a task from TFRecord dataset (from VOC2007 for example)

1. Create `label_map.pbtxt` file with the following content:

```js
item {
    id: 1
    name: 'aeroplane'
}
item {
    id: 2
    name: 'bicycle'
}
item {
    id: 3
    name: 'bird'
}
item {
    id: 4
    name: 'boat'
}
item {
    id: 5
    name: 'bottle'
}
item {
    id: 6
    name: 'bus'
}
item {
    id: 7
    name: 'car'
}
item {
    id: 8
    name: 'cat'
}
item {
    id: 9
    name: 'chair'
}
item {
    id: 10
    name: 'cow'
}
item {
    id: 11
    name: 'diningtable'
}
item {
    id: 12
    name: 'dog'
}
item {
    id: 13
    name: 'horse'
}
item {
    id: 14
    name: 'motorbike'
}
item {
    id: 15
    name: 'person'
}
item {
    id: 16
    name: 'pottedplant'
}
item {
    id: 17
    name: 'sheep'
}
item {
    id: 18
    name: 'sofa'
}
item {
    id: 19
    name: 'train'
}
item {
    id: 20
    name: 'tvmonitor'
}
```

1. Use [create_pascal_tf_record.py](https://github.com/tensorflow/models/blob/master/research/object_detection/dataset_tools/create_pascal_tf_record.py)

to convert VOC2007 dataset to TFRecord format.
As example:

```bash
python create_pascal_tf_record.py --data_dir <path to VOCdevkit> --set train --year VOC2007 --output_path pascal.tfrecord --label_map_path label_map.pbtxt
```

1. Zip train images

   ```bash
   cat <path to VOCdevkit>/VOC2007/ImageSets/Main/train.txt | while read p; do echo <path to VOCdevkit>/VOC2007/JPEGImages/${p}.jpg  ; done | zip images.zip -j -@
   ```

1. Create a CVAT task with the following labels:

   ```bash
   aeroplane bicycle bird boat bottle bus car cat chair cow diningtable dog horse motorbike person pottedplant sheep sofa train tvmonitor
   ```

   Select images. zip as data.
   See [Creating an annotation task](../../../../docs/for-users/user-guide/creating_an_annotation_task/)
   guide for details.

1. Zip `pascal.tfrecord` and `label_map.pbtxt` files together

   ```bash
   zip anno.zip -j <path to pascal.tfrecord> <path to label_map.pbtxt>
   ```

1. Click `Upload annotation` button, choose `TFRecord 1.0` and select the zip file

   with labels from the previous step. It may take some time.
