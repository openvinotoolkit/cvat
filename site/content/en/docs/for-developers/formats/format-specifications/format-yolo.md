---
linkTitle: "YOLO"
weight: 7
---

### [YOLO](https://pjreddie.com/darknet/yolo/)<a id="yolo" />

- [Format specification](https://github.com/AlexeyAB/darknet#how-to-train-to-detect-your-custom-objects)
- supported annotations: Rectangles

#### YOLO export

Downloaded file: a zip archive with following structure:

```bash
archive.zip/
├── obj.data
├── obj.names
├── obj_<subset>_data
│   ├── image1.txt
│   └── image2.txt
└── train.txt # list of subset image paths

# the only valid subsets are: train, valid
# train.txt and valid.txt:
obj_<subset>_data/image1.jpg
obj_<subset>_data/image2.jpg

# obj.data:
classes = 3 # optional
names = obj.names
train = train.txt
valid = valid.txt # optional
backup = backup/ # optional

# obj.names:
cat
dog
airplane

# image_name.txt:
# label_id - id from obj.names
# cx, cy - relative coordinates of the bbox center
# rw, rh - relative size of the bbox
# label_id cx cy rw rh
1 0.3 0.8 0.1 0.3
2 0.7 0.2 0.3 0.1
```

Each annotation `*.txt` file has a name that corresponds to the name of
the image file (e. g. `frame_000001.txt` is the annotation
for the `frame_000001.jpg` image).
The `*.txt` file structure: each line describes label and bounding box
in the following format `label_id cx cy w h`.
`obj.names` contains the ordered list of label names.

#### YOLO import

Uploaded file: a zip archive of the same structure as above
It must be possible to match the CVAT frame (image name)
and annotation file name. There are 2 options:

1. full match between image name and name of annotation `*.txt` file
   (in cases when a task was created from images or archive of images).

1. match by frame number (if CVAT cannot match by name). File name
   should be in the following format `<number>.jpg` .
   It should be used when task was created from a video.

#### How to create a task from YOLO formatted dataset (from VOC for example)

1. Follow the official [guide](https://pjreddie.com/darknet/yolo/)(see Training YOLO on VOC section)
   and prepare the YOLO formatted annotation files.

1. Zip train images

```bash
zip images.zip -j -@ < train.txt
```

1. Create a CVAT task with the following labels:

   ```bash
   aeroplane bicycle bird boat bottle bus car cat chair cow diningtable dog
   horse motorbike person pottedplant sheep sofa train tvmonitor
   ```

   Select images. zip as data. Most likely you should use `share`
   functionality because size of images. zip is more than 500Mb.
   See [Creating an annotation task](../../../../docs/for-users/user-guide/creating_an_annotation_task/)
   guide for details.

1. Create `obj.names` with the following content:

   ```bash
   aeroplane
   bicycle
   bird
   boat
   bottle
   bus
   car
   cat
   chair
   cow
   diningtable
   dog
   horse
   motorbike
   person
   pottedplant
   sheep
   sofa
   train
   tvmonitor
   ```

1. Zip all label files together (we need to add only label files that correspond to the train subset)

   ```bash
   cat train.txt | while read p; do echo ${p%/*/*}/labels/${${p##*/}%%.*}.txt; done | zip labels.zip -j -@ obj.names
   ```

1. Click `Upload annotation` button, choose `YOLO 1.1` and select the zip

   file with labels from the previous step.
