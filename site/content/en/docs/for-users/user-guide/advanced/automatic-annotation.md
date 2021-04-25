---
title: "Automatic annotation"
linkTitle: "Automatic annotation"
weight: 14
---

Automatic Annotation is used for creating preliminary annotations.
To use Automatic Annotation you need a DL model. You can use primary models or models uploaded by a user.
You can find the list of available models in the `Models` section.

1.  To launch automatic annotation, you should open the dashboard and find a task which you want to annotate.
    Then click the `Actions` button and choose option `Automatic Annotation` from the dropdown menu.

    ![](../../../../../images/image119_detrac.jpg)

1.  In the dialog window select a model you need. DL models are created for specific labels, e.g.
    the Crossroad model was taught using footage from cameras located above the highway and it is best to
    use this model for the tasks with similar camera angles.
    If it's necessary select the `Clean old annotations` checkbox.
    Adjust the labels so that the task labels will correspond to the labels of the DL model.
    For example, let’s consider a task where you have to annotate labels “car” and “person”.
    You should connect the “person” label from the model to the “person” label in the task.
    As for the “car” label, you should choose the most fitting label available in the model - the “vehicle” label.
    The task requires to annotate cars only and choosing the “vehicle” label implies annotation of all vehicles,
    in this case using auto annotation will help you complete the task faster.
    Click `Submit` to begin the automatic annotation process.

    ![](../../../../../images/image120.jpg)

1.  At runtime - you can see the percentage of completion.
    You can cancel the automatic annotation by clicking on the `Cancel`button.

    ![](../../../../../images/image121_detrac.jpg)

1.  The end result of an automatic annotation is an annotation with separate rectangles (or other shapes)

    ![](../../../../../images/gif014_detrac.gif)

1.  You can combine separate bounding boxes into tracks using the `Person reidentification ` model.
    To do this, click on the automatic annotation item in the action menu again and select the model
    of the `ReID` type (in this case the `Person reidentification` model).
    You can set the following parameters:

    - Model `Threshold` is a maximum cosine distance between objects’ embeddings.
    - `Maximum distance` defines a maximum radius that an object can diverge between adjacent frames.

    ![](../../../../../images/image133.jpg)

1.  You can remove false positives and edit tracks using `Split` and `Merge` functions.

    ![](../../../../../images/gif015_detrac.gif)
