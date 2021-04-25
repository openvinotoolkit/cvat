---
title: "Creating masks"
linkTitle: "Creating masks"
weight: 6
---

### Cutting holes in polygons

Currently, CVAT does not support cutting transparent holes in polygons. However,
it is poissble to generate holes in exported instance and class masks.
To do this, one needs to define a background class in the task and draw holes
with it as additional shapes above the shapes needed to have holes:

The editor window:

  ![The editor](../../../../../../images/mask_export_example1_editor.png)

Remember to use z-axis ordering for shapes by \[\-\] and \[\+\, \=\] keys.

Exported masks:

  ![A class mask](../../../../../../images/mask_export_example1_cls_mask.png)  ![An instance mask](../../../../../../images/mask_export_example1_inst_mask.png)

Notice that it is currently impossible to have a single instance number for
internal shapes (they will be merged into the largest one and then covered by
"holes").

### Creating masks

There are several formats in CVAT that can be used to export masks:
- `Segmentation Mask` (PASCAL VOC masks)
- `CamVid`
- `MOTS`
- `ICDAR`
- `COCO` (RLE-encoded instance masks, [guide](../../../../../../docs/for-developers/formats/format-specifications/format-coco))
- `TFRecord` ([over Datumaro](https://github.com/openvinotoolkit/datumaro/blob/develop/docs/user_manual.md), [guide](../../../../../../docs/for-developers/formats/format-specifications/format-tfrecord)):
- `Datumaro`

An example of exported masks (in the `Segmentation Mask` format):

  ![A class mask](../../../../../../images/exported_cls_masks_example.png) ![An instance mask](../../../../../../images/exported_inst_masks_example.png)

Important notices:
- Both boxes and polygons are converted into masks
- Grouped objects are considered as a single instance and exported as a single
  mask (label and attributes are taken from the largest object in the group)

#### Class colors

All the labels have associated colors, which are used in the generated masks.
These colors can be changed in the task label properties:

  ![](../../../../../../images/label_color_picker.jpg)

Label colors are also displayed in the annotation window on the right panel,
where you can show or hide specific labels
(only the presented labels are displayed):

  ![](../../../../../../images/label_panel_anno_window.jpg)

A background class can be:
- A default class, which is implicitly-added, of black color (RGB 0, 0, 0)
- `background` class with any color (has a priority, name is case-insensitive)
- Any class of black color (RGB 0, 0, 0)

To change backgound color in generated masks (default is black),
change `background` class color to the desired one.
