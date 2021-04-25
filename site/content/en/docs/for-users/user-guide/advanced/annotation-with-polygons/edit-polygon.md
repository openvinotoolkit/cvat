---
title: "Edit polygon"
linkTitle: "Edit polygon"
weight: 4
---

To edit a polygon you have to click on it while holding `Shift`, it will open the polygon editor.

- In the editor you can create new points or delete part of a polygon by closing the line on another point.
- When `Intelligent polygon cropping` option is activated in the settings, СVAT considers two criteria to decide which part of a polygon should be cut off during automatic editing.
  - The first criteria is a number of cut points.
  - The second criteria is a length of a cut curve.

  If both criteria recommend to cut the same part, algorithm works automatically, and if not, a user has to make the decision.
  If you want to choose manually which part of a polygon should be cut off, disable `Intelligent polygon cropping` in the settings. In this case after closing the polygon, you can select the part of the polygon you want to leave.

  ![](../../../../../../images/image209.jpg)

- You can press `Esc` to cancel editing.

  ![](../../../../../../images/gif007_mapillary_vistas.gif)
