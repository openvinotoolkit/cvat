---
linkTitle: "ImageNet"
weight: 9
---

### [ImageNet](http://www.image-net.org)<a id="imagenet" />

#### ImageNet export

Downloaded file: a zip archive of the following structure:

```bash
# if we save images:
taskname.zip/
├── label1/
|   ├── label1_image1.jpg
|   └── label1_image2.jpg
└── label2/
    ├── label2_image1.jpg
    ├── label2_image3.jpg
    └── label2_image4.jpg

# if we keep only annotation:
taskname.zip/
├── <any_subset_name>.txt
└── synsets.txt

```

- supported annotations: Labels

#### ImageNet import

Uploaded file: a zip archive of the structure above

- supported annotations: Labels
