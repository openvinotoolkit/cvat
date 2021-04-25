---
title: "AI Tools"
linkTitle: "AI Tools"
weight: 5
---

The tool is designed for semi-automatic and automatic annotation using DL models.
The tool is available only if there is a corresponding model.
For more details about DL models read the [Models](../../../../../docs/for-users/user-guide/models/) section.

### Interactors

Interactors are used to create a polygon semi-automatically.
Supported DL models are not bound to the label and can be used for any objects.
To create a polygon usually you need to use regular or positive points.
For some kinds of segmentation negative points are available.
Positive points are the points related to the object.
Negative points should be placed outside the boundary of the object.
In most cases specifying positive points alone is enough to build a polygon.

- Before you start, select the magic wand on the controls sidebar and go to the `Interactors` tab.
  Then select a label for the polygon and a required DL model.

  ![](../../../../../images/image114.jpg)

- Click `Interact` to enter the interaction mode. Now you can place positive and/or negative points.
  Left click creates a positive point and right click creates a negative point.
  `Deep extreme cut` model requires a minimum of 4 points. After you set 4 positive points,
  a request will be sent to the server and when the process is complete a polygon will be created.
  If you are not satisfied with the result, you can set additional points or remove points by left-clicking on it.
  If you want to postpone the request and create a few more points, hold down `Ctrl` and continue,
  the request will be sent after the key is released.

  ![](../../../../../images/image188_detrac.jpg)

- To finish interaction, click on the icon on the controls sidebar or press `N` on your keyboard.

- When the object is finished, you can edit it like a polygon.
  You can read about editing polygons in the [Annotation with polygons](../../../../../docs/for-users/user-guide/advanced/annotation-with-polygons/) section.

### Detectors

Detectors are used to automatically annotate one frame. Supported DL models are suitable only for certain labels.

- Before you start, click the magic wand on the controls sidebar and select the Detectors icon tab.
  You need to match the labels of the DL model (left column) with the labels in your task (right column).
  Then click `Annotate`.

  ![](../../../../../images/image187.jpg)

- This action will automatically annotates one frame.
  In the [Automatic annotation](../../../../../docs/for-users/user-guide/advanced/automatic-annotation/) section you can read how to make automatic annotation of all frames.
