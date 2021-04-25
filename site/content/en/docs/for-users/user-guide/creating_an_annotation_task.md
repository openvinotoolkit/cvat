---
title: "Creating an annotation task"
linkTitle: "Creating an annotation task"
weight: 2
---

1.  Create an annotation task pressing `Create new task` button on the tasks page or on the project page.
    ![](../../../../images/image004.jpg)

1.  Specify parameters of the task:

    #### Basic configuration

    **Name** The name of the task to be created.

    ![](../../../../images/image005.jpg)

    **Projects** The project that this task will be related with.

    ![](../../../../images/image193.jpg)

    **Labels**. There are two ways of working with labels (available only if the task is not related to the project):

    - The `Constructor` is a simple way to add and adjust labels. To add a new label click the `Add label` button.
      ![](../../../../images/image123.jpg)

      You can set a name of the label in the `Label name` field and choose a color for each label.

      ![](../../../../images/image124.jpg)

      If necessary you can add an attribute and set its properties by clicking `Add an attribute`:

      ![](../../../../images/image125.jpg)

      The following actions are available here:

      1. Set the attribute’s name.
      1. Choose the way to display the attribute:
         - Select — drop down list of value
         - Radio — is used when it is necessary to choose just one option out of few suggested.
         - Checkbox — is used when it is necessary to choose any number of options out of suggested.
         - Text — is used when an attribute is entered as a text.
         - Number — is used when an attribute is entered as a number.
      1. Set values for the attribute. The values could be separated by pressing `Enter`.
         The entered value is displayed as a separate element which could be deleted
         by pressing `Backspace` or clicking the close button (x).
         If the specified way of displaying the attribute is Text or Number,
         the entered value will be displayed as text by default (e.g. you can specify the text format).
      1. Checkbox `Mutable` determines if an attribute would be changed frame to frame.
      1. You can delete the attribute by clicking the close button (x).

      Click the `Continue` button to add more labels.
      If you need to cancel adding a label - press the `Cancel` button.
      After all the necessary labels are added click the `Done` button.
      After clicking `Done` the added labels would be displayed as separate elements of different colour.
      You can edit or delete labels by clicking `Update attributes` or `Delete label`.

    - The `Raw` is a way of working with labels for an advanced user.
      Raw presents label data in _json_ format with an option of editing and copying labels as a text.
      The `Done` button applies the changes and the `Reset` button cancels the changes.
      ![](../../../../images/image126.jpg)

    In `Raw` and `Constructor` mode, you can press the `Copy` button to copy the list of labels.

    **Select files**. Press tab `My computer` to choose some files for annotation from your PC.
    If you select tab `Connected file share` you can choose files for annotation from your network.
    If you select ` Remote source` , you'll see a field where you can enter a list of URLs (one URL per line).
    If you upload a video or dataset with images and select `Use cache` option, you can attach a `manifest.jsonl` file.
    You can find how to prepare it [here](../../../../docs/for-developers/dataset_manifest/).

    ![](../../../../images/image127.jpg)

    #### Advanced configuration

    ![](../../../../images/image128_use_cache.jpg)

    **Use zip chunks**. Force to use zip chunks as compressed data. Actual for videos only.

    **Use cache**. Defines how to work with data. Select the checkbox to switch to the "on-the-fly data processing",
    which will reduce the task creation time (by preparing chunks when requests are received)
    and store data in a cache of limited size with a policy of evicting less popular items.
    See more [here](../../../../docs/for-developers/data_on_fly/).

    **Image Quality**. Use this option to specify quality of uploaded images.
    The option helps to load high resolution datasets faster.
    Use the value from `5` (almost completely compressed images) to `100` (not compressed images).

    **Overlap Size**. Use this option to make overlapped segments.
    The option makes tracks continuous from one segment into another.
    Use it for interpolation mode. There are several options for using the parameter:

    - For an interpolation task (video sequence).
      If you annotate a bounding box on two adjacent segments they will be merged into one bounding box.
      If overlap equals to zero or annotation is poor on adjacent segments inside a dumped annotation file,
      you will have several tracks, one for each segment, which corresponds to the object.
    - For an annotation task (independent images).
      If an object exists on overlapped segments, the overlap is greater than zero
      and the annotation is good enough on adjacent segments, it will be automatically merged into one object.
      If overlap equals to zero or annotation is poor on adjacent segments inside a dumped annotation file,
      you will have several bounding boxes for the same object.
      Thus, you annotate an object on the first segment.
      You annotate the same object on second segment, and if you do it right, you
      will have one track inside the annotations.
      If annotations on different segments (on overlapped frames)
      are very different, you will have two shapes for the same object.
      This functionality works only for bounding boxes.
      Polygons, polylines, points don't support automatic merge on overlapped segments
      even the overlap parameter isn't zero and match between corresponding shapes on adjacent segments is perfect.

    **Segment size**. Use this option to divide a huge dataset into a few smaller segments.
    For example, one job cannot be annotated by several labelers (it isn't supported).
    Thus using "segment size" you can create several jobs for the same annotation task.
    It will help you to parallel data annotation process.

    **Start frame**. Frame from which video in task begins.

    **Stop frame**. Frame on which video in task ends.

    **Frame Step**. Use this option to filter video frames.
    For example, enter `25` to leave every twenty fifth frame in the video or every twenty fifth image.

    **Chunk size**. Defines a number of frames to be packed in a chunk when send from client to server.
    Server defines automatically if empty.

    Recommended values:

    - 1080p or less: 36
    - 2k or less: 8 - 16
    - 4k or less: 4 - 8
    - More: 1 - 4

    **Dataset Repository**. URL link of the repository optionally specifies the path to the repository for storage
    (`default: annotation / <dump_file_name> .zip`).
    The .zip and .xml file extension of annotation are supported.
    Field format: `URL [PATH]` example: `https://github.com/project/repos.git [1/2/3/4/annotation.xml]`

    Supported URL formats :

    - `https://github.com/project/repos[.git]`
    - `github.com/project/repos[.git]`
    - `git@github.com:project/repos[.git]`

    The task will be highlighted in red after creation if annotation isn't synchronized with the repository.

    **Use LFS**. If the annotation file is large, you can create a repository with
    [LFS](https://git-lfs.github.com/) support.

    **Issue tracker**. Specify full issue tracker's URL if it's necessary.

    Push `Submit` button and it will be added into the list of annotation tasks.
    Then, the created task will be displayed on a tasks page:

    ![](../../../../images/image006_detrac.jpg)

1.  The tasks page contains elements and each of them relates to a separate task. They are sorted in creation order.
    Each element contains: task name, preview, progress bar, button `Open`, and menu `Actions`.
    Each button is responsible for a in menu `Actions` specific function:

    - `Dump Annotation` and `Export as a dataset` — download annotations or
      annotations and images in a specific format. The following formats are available:
      - [CVAT for video](../../../../docs/for-developers/xml_format/#interpolation)
        is highlighted if a task has the interpolation mode.
      - [CVAT for images](../../../../docs/for-developers/xml_format/#annotation)
        is highlighted if a task has the annotation mode.
      - [PASCAL VOC](http://host.robots.ox.ac.uk/pascal/VOC/)
      - [(VOC) Segmentation mask](http://host.robots.ox.ac.uk/pascal/VOC/) —
        archive contains class and instance masks for each frame in the png
        format and a text file with the value of each color.
      - [YOLO](https://pjreddie.com/darknet/yolo/)
      - [COCO](http://cocodataset.org/#format-data)
      - [TFRecord](https://www.tensorflow.org/tutorials/load_data/tfrecord)
      - [MOT](https://motchallenge.net/)
      - [LabelMe 3.0](http://labelme.csail.mit.edu/Release3.0/)
      - [Datumaro](https://github.com/openvinotoolkit/cvat/tree/develop/cvat/apps/dataset_manager/formats/datumaro)
    - `Upload annotation` is available in the same formats as in `Dump annotation`.
      - [CVAT](../../../../docs/for-developers/xml_format/) accepts both video and image sub-formats.
    - `Automatic Annotation` — automatic annotation with OpenVINO toolkit.
      Presence depends on how you build CVAT instance.
    - `Delete` — delete task.

    Push `Open` button to go to task details.

1.  Task details is a task page which contains a preview, a progress bar
    and the details of the task (specified when the task was created) and the jobs section.

    ![](../../../../images/image131_detrac.jpg)

    - The next actions are available on this page:
      1. Change the task’s title.
      1. Open `Actions` menu.
      1. Change issue tracker or open issue tracker if it is specified.
      1. Change labels (available only if the task is not related to the project).
         You can add new labels or add attributes for the existing labels in the Raw mode or the Constructor mode.
         By clicking `Copy` you will copy the labels to the clipboard.
      1. Assigned to — is used to assign a task to a person. Start typing an assignee’s name and/or
         choose the right person out of the dropdown list.
    - `Jobs` — is a list of all jobs for a particular task. Here you can find the next data:
      - Jobs name with a hyperlink to it.
      - Frames — the frame interval.
      - A status of the job. The status is specified by the user in the menu inside the job.
        There are three types of status: annotation, validation or completed.
        The status of the job is changes the progress bar of the task.
      - Started on — start date of this job.
      - Duration — is the amount of time the job is being worked.
      - Assignee is the user who is working on the job.
        You can start typing an assignee’s name and/or choose the right person out of the dropdown list.
      - Reviewer – a user assigned to carry out the review, read more in the [review](../../../../docs/for-users/user-guide/advanced/review/) section.
      - `Copy`. By clicking `Copy` you will copy the job list to the clipboard.
        The job list contains direct links to jobs.

      You can filter or sort jobs by status, as well as by assigner or reviewer.

1.  Follow a link inside `Jobs` section to start annotation process.
    In some cases, you can have several links. It depends on size of your
    task and `Overlap Size` and `Segment Size` parameters. To improve
    UX, only the first chunk of several frames will be loaded and you will be able
    to annotate first images. Other frames will be loaded in background.

    ![](../../../../images/image007_detrac.jpg)
