---
linkTitle: "MOT"
weight: 3
---

### [MOT sequence](https://arxiv.org/pdf/1906.04567.pdf)<a id="mot" />

#### MOT export

Downloaded file: a zip archive of the following structure:

```bash
taskname.zip/
├── img1/
|   ├── image1.jpg
|   └── image2.jpg
└── gt/
    ├── labels.txt
    └── gt.txt

# labels.txt
cat
dog
person
...

# gt.txt
# frame_id, track_id, x, y, w, h, "not ignored", class_id, visibility, <skipped>
1,1,1363,569,103,241,1,1,0.86014
...

```

- supported annotations: Rectangle shapes and tracks
- supported attributes: `visibility` (number), `ignored` (checkbox)

#### MOT import

Uploaded file: a zip archive of the structure above or:

```bash
taskname.zip/
├── labels.txt # optional, mandatory for non-official labels
└── gt.txt
```

- supported annotations: Rectangle tracks
