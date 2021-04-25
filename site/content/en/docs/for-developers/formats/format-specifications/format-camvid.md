---
linkTitle: "CamVid"
weight: 10
---

### [CamVid](http://mi.eng.cam.ac.uk/research/projects/VideoRec/CamVid/)<a id="camvid" />

#### CamVid export

Downloaded file: a zip archive of the following structure:

```bash
taskname.zip/
├── labelmap.txt # optional, required for non-CamVid labels
├── <any_subset_name>/
|   ├── image1.png
|   └── image2.png
├── <any_subset_name>annot/
|   ├── image1.png
|   └── image2.png
└── <any_subset_name>.txt

# labelmap.txt
# color (RGB) label
0 0 0 Void
64 128 64 Animal
192 0 128 Archway
0 128 192 Bicyclist
0 128 64 Bridge
```

Mask is a `png` image with 1 or 3 channels where each pixel
has own color which corresponds to a label.
`(0, 0, 0)` is used for background by default.

- supported annotations: Rectangles, Polygons

#### CamVid import

Uploaded file: a zip archive of the structure above

- supported annotations: Polygons
