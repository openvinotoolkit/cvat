---
linkTitle: "Pascal VOC"
weight: 6
---

### [Pascal VOC](http://host.robots.ox.ac.uk/pascal/VOC/)<a id="voc" />

- [Format specification](http://host.robots.ox.ac.uk/pascal/VOC/voc2012/devkit_doc.pdf)

- supported annotations:

  - Rectangles (detection and layout tasks)
  - Tags (action- and classification tasks)
  - Polygons (segmentation task)

- supported attributes:

  - `occluded` (both UI option and a separate attribute)
  - `truncated` and `difficult` (should be defined for labels as `checkbox` -es)
  - action attributes (import only, should be defined as `checkbox` -es)
  - arbitrary attributes (in the `attributes` secion of XML files)

#### Pascal VOC export

Downloaded file: a zip archive of the following structure:

```bash
taskname.zip/
├── JPEGImages/
│   ├── <image_name1>.jpg
│   ├── <image_name2>.jpg
│   └── <image_nameN>.jpg
├── Annotations/
│   ├── <image_name1>.xml
│   ├── <image_name2>.xml
│   └── <image_nameN>.xml
├── ImageSets/
│   └── Main/
│       └── default.txt
└── labelmap.txt

# labelmap.txt
# label : color_rgb : 'body' parts : actions
background:::
aeroplane:::
bicycle:::
bird:::
```

#### Pascal VOC import

Uploaded file: a zip archive of the structure declared above or the following:

```bash
taskname.zip/
├── <image_name1>.xml
├── <image_name2>.xml
└── <image_nameN>.xml
```

It must be possible for CVAT to match the frame name and file name
from annotation `.xml` file (the `filename` tag, e. g.
`<filename>2008_004457.jpg</filename>` ).

There are 2 options:

1. full match between frame name and file name from annotation `.xml`
   (in cases when task was created from images or image archive).

1. match by frame number. File name should be `<number>.jpg`
   or `frame_000000.jpg`. It should be used when task was created from video.

#### Segmentation mask export

Downloaded file: a zip archive of the following structure:

```bash
taskname.zip/
├── labelmap.txt # optional, required for non-VOC labels
├── ImageSets/
│   └── Segmentation/
│       └── default.txt # list of image names without extension
├── SegmentationClass/ # merged class masks
│   ├── image1.png
│   └── image2.png
└── SegmentationObject/ # merged instance masks
    ├── image1.png
    └── image2.png

# labelmap.txt
# label : color (RGB) : 'body' parts : actions
background:0,128,0::
aeroplane:10,10,128::
bicycle:10,128,0::
bird:0,108,128::
boat:108,0,100::
bottle:18,0,8::
bus:12,28,0::
```

Mask is a `png` image with 1 or 3 channels where each pixel
has own color which corresponds to a label.
Colors are generated following to Pascal VOC [algorithm](http://host.robots.ox.ac.uk/pascal/VOC/voc2012/htmldoc/devkit_doc.html#sec:voclabelcolormap).
`(0, 0, 0)` is used for background by default.

- supported shapes: Rectangles, Polygons

#### Segmentation mask import

Uploaded file: a zip archive of the following structure:

```bash
  taskname.zip/
  ├── labelmap.txt # optional, required for non-VOC labels
  ├── ImageSets/
  │   └── Segmentation/
  │       └── <any_subset_name>.txt
  ├── SegmentationClass/
  │   ├── image1.png
  │   └── image2.png
  └── SegmentationObject/
      ├── image1.png
      └── image2.png
```

It is also possible to import grayscale (1-channel) PNG masks.
For grayscale masks provide a list of labels with the number of lines equal
to the maximum color index on images. The lines must be in the right order
so that line index is equal to the color index. Lines can have arbitrary,
but different, colors. If there are gaps in the used color
indices in the annotations, they must be filled with arbitrary dummy labels.
Example:

```
q:0,128,0:: # color index 0
aeroplane:10,10,128:: # color index 1
_dummy2:2,2,2:: # filler for color index 2
_dummy3:3,3,3:: # filler for color index 3
boat:108,0,100:: # color index 3
...
_dummy198:198,198,198:: # filler for color index 198
_dummy199:199,199,199:: # filler for color index 199
...
the last label:12,28,0:: # color index 200
```

- supported shapes: Polygons

#### How to create a task from Pascal VOC dataset

1. Download the Pascal Voc dataset (Can be downloaded from the
   [PASCAL VOC website](http://host.robots.ox.ac.uk/pascal/VOC/))

1. Create a CVAT task with the following labels:

   ```bash
   aeroplane bicycle bird boat bottle bus car cat chair cow diningtable
   dog horse motorbike person pottedplant sheep sofa train tvmonitor
   ```

   You can add `~checkbox=difficult:false ~checkbox=truncated:false`
   attributes for each label if you want to use them.

   Select interesting image files (See [Creating an annotation task](../../../../docs/for-users/user-guide/creating_an_annotation_task/) guide for details)

1. zip the corresponding annotation files

1. click `Upload annotation` button, choose `Pascal VOC ZIP 1.1`

   and select the zip file with annotations from previous step.
   It may take some time.
