---
linkTitle: "Wider Face"
weight: 9
---

### [WIDER Face](http://shuoyang1213.me/WIDERFACE/)<a id="widerface" />

#### WIDER Face export

Downloaded file: a zip archive of the following structure:

```bash
taskname.zip/
├── labels.txt # optional
├── wider_face_split/
│   └── wider_face_<any_subset_name>_bbx_gt.txt
└── WIDER_<any_subset_name>/
    └── images/
        ├── 0--label0/
        │   └── 0_label0_image1.jpg
        └── 1--label1/
            └── 1_label1_image2.jpg
```

- supported annotations: Rectangles (with attributes), Labels
- supported attributes:
  - `blur`, `expression`, `illumination`, `pose`, `invalid`
  - `occluded` (both the annotation property & an attribute)

#### WIDER Face import

Uploaded file: a zip archive of the structure above

- supported annotations: Rectangles (with attributes), Labels
- supported attributes:
  - `blur`, `expression`, `illumination`, `occluded`, `pose`, `invalid`
