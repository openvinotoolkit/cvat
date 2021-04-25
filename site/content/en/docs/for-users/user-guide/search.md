---
title: "Search"
linkTitle: "Search"
weight: 6
---
### Search

There are several options how to use the search.

- Search within all fields (owner, assignee, task name, task status, task mode).
  To execute enter a search string in search field.
- Search for specific fields. How to perform:
  - `owner: admin` - all tasks created by the user who has the substring "admin" in his name
  - `assignee: employee` - all tasks which are assigned to a user who has the substring "employee" in his name
  - `name: training` - all tasks with the substring "training" in their names
  - `mode: annotation` or `mode: interpolation` - all tasks with images or videos.
  - `status: annotation` or `status: validation` or `status: completed` - search by status
  - `id: 5` - task with id = 5.
- Multiple filters. Filters can be combined (except for the identifier) ​​using the keyword ` AND`:
  - `mode: interpolation AND owner: admin`
  - `mode: annotation and status: annotation`

The search is case insensitive.

![](../../../../images/image100_detrac.jpg)