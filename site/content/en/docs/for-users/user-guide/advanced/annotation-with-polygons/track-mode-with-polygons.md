---
title: "Track mode with polygons"
linkTitle: "Track mode with polygons"
weight: 5
---

Polygons in the track mode allow you to mark moving objects more accurately other than using a rectangle
([Tracking mode (basic)](../../../../../../docs/for-users/user-guide/basics/track-mode-basics/); [Tracking mode (advanced)](../../../../../../docs/for-users/user-guide/advanced/track-mode-advanced/)).

1. To create a polygon in the track mode, click the `Track` button.

   ![](../../../../../../images/image184.jpg)

1. Create a polygon the same way as in the case of [Annotation with polygons](../../../../../../docs/for-users/user-guide/advanced/annotation-with-polygons/).
   Press `N` to complete the polygon.

1. Pay attention to the fact that the created polygon has a starting point and a direction,
   these elements are important for annotation of the following frames.

1. After going a few frames forward press `Shift+N`, the old polygon will disappear and you can create a new polygon.
   The new starting point should match the starting point of the previously created polygon
   (in this example, the top of the left mirror). The direction must also match (in this example, clockwise).
   After creating the polygon, press `N` and the intermediate frames will be interpolated automatically.

   ![](../../../../../../images/image185_detrac.jpg)

1. If you need to change the starting point, right-click on the desired point and select `Set starting point`.
   To change the direction, right-click on the desired point and select switch orientation.

   ![](../../../../../../images/image186_detrac.jpg)

There is no need to redraw the polygon every time using `Shift+N`,
instead you can simply move the points or edit a part of the polygon by pressing `Shift+Click`.