---
linkTitle: "VGGFace2"
weight: 12
---

### [VGGFace2](https://github.com/ox-vgg/vgg_face2)<a id="vggface2" />

#### VGGFace2 export

Downloaded file: a zip archive of the following structure:

```bash
taskname.zip/
├── labels.txt # optional
├── <any_subset_name>/
|   ├── label0/
|   |   └── image1.jpg
|   └── label1/
|       └── image2.jpg
└── bb_landmark/
    ├── loose_bb_<any_subset_name>.csv
    └── loose_landmark_<any_subset_name>.csv
# labels.txt
# n000001 car
label0 <class0>
label1 <class1>
```

- supported annotations: Rectangles, Points (landmarks - groups of 5 points)

#### VGGFace2 import

Uploaded file: a zip archive of the structure above

- supported annotations: Rectangles, Points (landmarks - groups of 5 points)
