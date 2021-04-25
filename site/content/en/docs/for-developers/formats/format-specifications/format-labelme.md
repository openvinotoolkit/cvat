---
linkTitle: "LabelMe"
weight: 2
---

### [LabelMe](http://labelme.csail.mit.edu/Release3.0)<a id="labelme" />

#### LabelMe export

Downloaded file: a zip archive of the following structure:

```bash
taskname.zip/
├── img1.jpg
└── img1.xml
```

- supported annotations: Rectangles, Polygons (with attributes)

#### LabelMe import

Uploaded file: a zip archive of the following structure:

```bash
taskname.zip/
├── Masks/
|   ├── img1_mask1.png
|   └── img1_mask2.png
├── img1.xml
├── img2.xml
└── img3.xml
```

- supported annotations: Rectangles, Polygons, Masks (as polygons)
