---
title: "Top Panel"
linkTitle: "Top Panel"
weight: 14
---

![](../../../../images/image035.jpg)

---

#### Menu button

It is the main menu of the annotation tool. It can be used to download, upload and remove annotations.

![](../../../../images/image051.jpg)

Button assignment:

- `Dump Annotations` — downloads annotations from a task.
- `Upload Annotations` — uploads annotations into a task.
- `Remove Annotations` — removes annotations from the current job.
- `Export as a dataset` — download a data set from a task. Several formats are available:
  - [Datumaro](https://github.com/openvinotoolkit/cvat/tree/develop/cvat/apps/dataset_manager/formats/datumaro)
  - [Pascal VOC 2012](http://host.robots.ox.ac.uk/pascal/VOC/)
  - [MS COCO](http://cocodataset.org/#format-data)
  - [YOLO](https://pjreddie.com/darknet/yolo/)
- `Open the task` — opens a page with details about the task.
- `Request a review` - calls up the form to submit the job for a review, read more in the [review](../../../../docs/for-users/user-guide/advanced/review/) section.
- `Finish the job` - changes the status of the job to `completed` and returns to the task page without review.
- `Submit the review` - (available during the review) calls up the form to submit a review, read more in the [review](../../../../docs/for-users/user-guide/advanced/review/) section.

#### Save Work

Saves annotations for the current job. The button has an indication of the saving process.

![](../../../../images/image141.jpg)

#### Undo-redo buttons

Use buttons to undo actions or redo them.

![](../../../../images/image061.jpg)

---

#### Player

Go to the first /the latest frames.

![](../../../../images/image036.jpg)

Go to the next/previous frame with a predefined step. Shortcuts:
`V` — step backward, `C` — step forward. By default the step is `10` frames
(change at `Account Menu` —> `Settings` —> `Player Step`).

![](../../../../images/image037.jpg)

The button to go to the next / previous frame has the customization possibility. To customize, right-click on the button and select one of three options:

1. The default option - go to the next / previous frame (the step is 1 frame).
2. Go to the next / previous frame that has any objects (in particular filtered). Read the [filter](../../../../docs/for-users/user-guide/advanced/filter/) section to know the details how to use it.
3. Go to the next / previous frame without annotation at all. Use this option in cases when you need to find missed frames quickly.

Shortcuts: `D` - previous, `F` - next.

![](../../../../images/image040.jpg)

Play the sequence of frames or the set of images.
Shortcut: `Space` (change at `Account Menu` —> `Settings` —> `Player Speed`).

![](../../../../images/image041.jpg)

Go to a specific frame. Press `~` to focus on the element.

![](../../../../images/image060.jpg)

---

#### Fullscreen Player

The fullscreen player mode. The keyboard shortcut is `F11`.

![](../../../../images/image143.jpg)

#### Info

Open the job info.

![](../../../../images/image144_detrac.jpg)

_Overview_:

- `Assinger` - the one to whom the job is assigned.
- `Reviewer` – a user assigned to carry out the review, read more in the [review](../../../../docs/for-users/user-guide/advanced/review) section.
- `Start Frame` - the number of the first frame in this job.
- `End Frame` - the number of the last frame in this job.
- `Frames` - the total number of all frames in the job.

_Annotations statistics_:

This is a table number of created shapes, sorted by labels (e.g. vehicle, person)
and type of annotation (shape, track). As well as the number of manual and interpolated frames.

#### UI switcher

Switching between user interface modes.

![](../../../../images/image145.jpg)
