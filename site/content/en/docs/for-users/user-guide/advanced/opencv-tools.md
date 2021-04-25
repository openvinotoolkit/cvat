---
title: "OpenCV tools"
linkTitle: "OpenCV tools"
weight: 6
---
The tool based on [Open CV](https://opencv.org/) Computer Vision library which is an open-source product that includes many CV algorithms. Some of these algorithms can be used to simplify the annotation process.

First step to work with OpenCV is to load it into CVAT. Click on the toolbar icon, then click `Load OpenCV`.

![](../../../../../images/image198.jpg)

Once it is loaded, the tool's functionality will be available.

### Intelligent scissors

Intelligent scissors is an CV method of creating a polygon by placing points with automatic drawing of a line between them.
The distance between the adjacent points is limited by the threshold of action,
displayed as a red square which is tied to the cursor.

- First, select the label and then click on the `intelligent scissors` button.

  ![](../../../../../images/image199.jpg)

- Create the first point on the boundary of the allocated object.
  You will see a line repeating the outline of the object.
- Place the second point, so that the previous point is within the restrictive threshold.
  After that a line repeating the object boundary will be automatically created between the points.

  ![](../../../../../images/image200_detrac.jpg)

  To increase or lower the action threshold, hold `Ctrl` and scroll the mouse wheel.
  Increasing action threshold will affect the performance.
  During the drawing process you can remove the last point by clicking on it with the left mouse button.

- Once all the points are placed, you can complete the creation of the object by clicking on the icon or clicking `N`.
  As a result, a polygon will be created (read more about the polygons in the [annoation with polygons](../../../../../docs/for-users/user-guide/advanced/annotation-with-polygons/)).