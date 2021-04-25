---
linkTitle: "ICDAR13/15"
weight: 14
---

### [ICDAR13/15](https://rrc.cvc.uab.es/?ch=2)<a id="icdar" />

#### ICDAR13/15 export

Downloaded file: a zip archive of the following structure:

```bash
# word recognition task
taskname.zip/
└── word_recognition/
    └── <any_subset_name>/
        ├── images
        |   ├── word1.png
        |   └── word2.png
        └── gt.txt
# text localization task
taskname.zip/
└── text_localization/
    └── <any_subset_name>/
        ├── images
        |   ├── img_1.png
        |   └── img_2.png
        ├── gt_img_1.txt
        └── gt_img_1.txt
#text segmentation task
taskname.zip/
└── text_localization/
    └── <any_subset_name>/
        ├── images
        |   ├── 1.png
        |   └── 2.png
        ├── 1_GT.bmp
        ├── 1_GT.txt
        ├── 2_GT.bmp
        └── 2_GT.txt
```

**Word recognition task**:

- supported annotations: Label `icdar` with attribute `caption`

**Text localization task**:

- supported annotations: Rectangles and Polygons with label `icdar`
  and attribute `text`

**Text segmentation task**:

- supported annotations: Rectangles and Polygons with label `icdar`
  and attributes `index`, `text`, `color`, `center`

#### ICDAR13/15 import

Uploaded file: a zip archive of the structure above

**Word recognition task**:

- supported annotations: Label `icdar` with attribute `caption`

**Text localization task**:

- supported annotations: Rectangles and Polygons with label `icdar`
  and attribute `text`

**Text segmentation task**:

- supported annotations: Rectangles and Polygons with label `icdar`
  and attributes `index`, `text`, `color`, `center`
