---
title: "Task synchronization with a repository"
linkTitle: "Task synchronization"
weight: 10
---
1.  At the end of the annotation process, a task is synchronized by clicking
    ` Synchronize` on the task page. Notice: this feature
    works only if a git repository was specified when the task was created.

    ![](../../../../images/image106.jpg)

1.  After synchronization the button `Sync` is highlighted in green. The
    annotation is now in the repository in a temporary branch.

    ![](../../../../images/image109.jpg)

1.  The next step is to go to the repository and manually create a pull request to the main branch.

1.  After confirming the PR, when the annotation is saved in the main branch, the color of the task changes to blue.

    ![](../../../../images/image110.jpg)
