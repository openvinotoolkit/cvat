## Task and Project Import/Export functionality

This document describes the high-level design for implementing import / export implementation for tasks and projects.

API endpoints:

- Import task

  - endpoint: `/api/v1/tasks?action=import​`
  - method: `POST`
  - Content-Type: `multipart/form-data​`
  - returns: json

- Export task

  - endpoint: `/api/v1/tasks/{id}?action=export​`
  - method: `GET`
  - returns: zip archive

  The zip archive has the following structure:

  ```
   .
   ├── data
   │   ├── {user uploaded data}
   │   ├── manifest.jsonl
   ├── task.json
   └── annotations.json
  ```

- Import project

  - endpoint: `/api/v1/projects?action=import​`
  - method: `POST`
  - Content-Type: `multipart/form-data​`
  - returns: json

- Export project

  - endpoint: `/api/v1/projects/<id>?action=export​`
  - method: `GET`
  - returns: zip archive

  The zip archive has the following structure:

  ```
   .
   ├── tasks
   │   ├── task_1
   │   ├── task_2
   │   ├── ...
   │   └── task_N
   └── project.json
  ```
