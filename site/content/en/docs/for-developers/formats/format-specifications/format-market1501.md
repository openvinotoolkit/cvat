---
linkTitle: "Market-1501"
weight: 13
---

### [Market-1501](https://www.aitribune.com/dataset/2018051063)<a id="market1501" />

#### Market-1501 export

Downloaded file: a zip archive of the following structure:

```bash
taskname.zip/
├── bounding_box_<any_subset_name>/
│   └── image_name_1.jpg
└── query
    ├── image_name_2.jpg
    └── image_name_3.jpg
# if we keep only annotation:
taskname.zip/
└── images_<any_subset_name>.txt
# images_<any_subset_name>.txt
query/image_name_1.jpg
bounding_box_<any_subset_name>/image_name_2.jpg
bounding_box_<any_subset_name>/image_name_3.jpg
# image_name = 0001_c1s1_000015_00.jpg
0001 - person id
c1 - camera id (there are totally 6 cameras)
s1 - sequence
000015 - frame number in sequence
00 - means that this bounding box is the first one among the several
```

- supported annotations: Label `market-1501` with atrributes (`query`, `person_id`, `camera_id`)

#### Market-1501 import

Uploaded file: a zip archive of the structure above

- supported annotations: Label `market-1501` with atrributes (`query`, `person_id`, `camera_id`)
