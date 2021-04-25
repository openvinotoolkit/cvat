---
title: "Track mode (basics)"
linkTitle: "Track mode"
weight: 4
---
Usage examples:

- Create new annotations for a sequence of frames.
- Add/modify/delete objects for existing annotations.
- Edit tracks, merge several rectangles into one track.

1.  Like in the `Shape mode`, you need to select a `Rectangle` on the sidebar,
    in the appearing form, select the desired `Label` and the `Drawing method`.

    ![](../../../../../images/image083.jpg)

1.  Creating a track for an object (look at the selected car as an example):

    - Create a `Rectangle` in `Track mode` by clicking on `Track`.

      ![](../../../../../images/image014.jpg)

    - In `Track mode` the rectangle will be automatically interpolated on the next frames.
    - The cyclist starts moving on frame #2270. Let's mark the frame as a key frame.
      You can press `K` for that or click the `star` button (see the screenshot below).

      ![](../../../../../images/image016.jpg)

    - If the object starts to change its position, you need to modify the rectangle where it happens.
      It isn't necessary to change the rectangle on each frame, simply update several keyframes
      and the frames between them will be interpolated automatically.
    - Let's jump 30 frames forward and adjust the boundaries of the object. See an example below:

      ![](../../../../../images/image017_detrac.jpg)

    - After that the rectangle of the object will be changed automatically on frames 2270 to 2300:

      ![](../../../../../images/gif019_detrac.gif)

1.  When the annotated object disappears or becomes too small, you need to
    finish the track. You have to choose `Outside Property`, shortcut `O`.

    ![](../../../../../images/image019.jpg)

1.  If the object isn't visible on a couple of frames and then appears again,
    you can use the `Merge` feature to merge several individual tracks
    into one.

    ![](../../../../../images/image020.jpg)

    - Create tracks for moments when the cyclist is visible:

      ![](../../../../../images/gif001_detrac.gif)

    - Click `Merge` button or press key `M` and click on any rectangle of the first track
      and on any rectangle of the second track and so on:

      ![](../../../../../images/image162_detrac.jpg)

    - Click `Merge` button or press `M` to apply changes.

      ![](../../../../../images/image020.jpg)

    - The final annotated sequence of frames in `Interpolation` mode can
      look like the clip below:

      ![](../../../../../images/gif003_detrac.gif)

      Read more in the section [track mode (advanced)](../../../../../docs/for-users/user-guide/advanced/track-mode-advanced/).
