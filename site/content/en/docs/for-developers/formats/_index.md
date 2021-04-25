---
title: "Dataset and annotation formats"
linkTitle: "Formats"
weight: 2
description: This section on [GitHub](https://github.com/openvinotoolkit/cvat/tree/develop/cvat/apps/dataset_manager/formats)
---

## How to add a new annotation format support<a id="how-to-add"></a>

1. Add a python script to `dataset_manager/formats`
1. Add an import statement to [registry.py](https://github.com/openvinotoolkit/cvat/tree/develop/cvat/apps/dataset_manager/formats/registry.py).
1. Implement some importers and exporters as the format requires.

Each format is supported by an importer and exporter.

It can be a function or a class decorated with
`importer` or `exporter` from [registry.py](https://github.com/openvinotoolkit/cvat/tree/develop/cvat/apps/dataset_manager/formats/registry.py). Examples:

```python
@importer(name="MyFormat", version="1.0", ext="ZIP")
def my_importer(file_object, task_data, **options):
  ...

@importer(name="MyFormat", version="2.0", ext="XML")
class my_importer(file_object, task_data, **options):
  def __call__(self, file_object, task_data, **options):
    ...

@exporter(name="MyFormat", version="1.0", ext="ZIP"):
def my_exporter(file_object, task_data, **options):
  ...
```

Each decorator defines format parameters such as:

- _name_

- _version_

- _file extension_. For the `importer` it can be a comma-separated list.
  These parameters are combined to produce a visible name. It can be
  set explicitly by the `display_name` argument.

Importer arguments:

- _file_object_ - a file with annotations or dataset
- _task_data_ - an instance of `TaskData` class.

Exporter arguments:

- _file_object_ - a file for annotations or dataset

- _task_data_ - an instance of `TaskData` class.

- _options_ - format-specific options. `save_images` is the option to
  distinguish if dataset or just annotations are requested.

[`TaskData`](https://github.com/openvinotoolkit/cvat/blob/develop/cvat/apps/dataset_manager/bindings.py) provides many task properties and interfaces
to add and read task annotations.

Public members:

- **TaskData. Attribute** - class, `namedtuple('Attribute', 'name, value')`

- **TaskData. LabeledShape** - class, `namedtuple('LabeledShape', 'type, frame, label, points, occluded, attributes, group, z_order')`

- **TrackedShape** - `namedtuple('TrackedShape', 'type, points, occluded, frame, attributes, outside, keyframe, z_order')`

- **Track** - class, `namedtuple('Track', 'label, group, shapes')`

- **Tag** - class, `namedtuple('Tag', 'frame, label, attributes, group')`

- **Frame** - class, `namedtuple('Frame', 'frame, name, width, height, labeled_shapes, tags')`

- **TaskData. shapes** - property, an iterator over `LabeledShape` objects

- **TaskData. tracks** - property, an iterator over `Track` objects

- **TaskData. tags** - property, an iterator over `Tag` objects

- **TaskData. meta** - property, a dictionary with task information

- **TaskData. group_by_frame()** - method, returns
  an iterator over `Frame` objects, which groups annotation objects by frame.
  Note that `TrackedShape` s will be represented as `LabeledShape` s.

- **TaskData. add_tag(tag)** - method,
  tag should be an instance of the `Tag` class

- **TaskData. add_shape(shape)** - method,
  shape should be an instance of the `Shape` class

- **TaskData. add_track(track)** - method,
  track should be an instance of the `Track` class

Sample exporter code:

```python
...
# dump meta info if necessary
...
# iterate over all frames
for frame_annotation in task_data.group_by_frame():
  # get frame info
  image_name = frame_annotation.name
  image_width = frame_annotation.width
  image_height = frame_annotation.height
  # iterate over all shapes on the frame
  for shape in frame_annotation.labeled_shapes:
    label = shape.label
    xtl = shape.points[0]
    ytl = shape.points[1]
    xbr = shape.points[2]
    ybr = shape.points[3]
    # iterate over shape attributes
    for attr in shape.attributes:
      attr_name = attr.name
      attr_value = attr.value
...
# dump annotation code
file_object.write(...)
...
```

Sample importer code:

```python
...
#read file_object
...
for parsed_shape in parsed_shapes:
  shape = task_data.LabeledShape(
    type="rectangle",
    points=[0, 0, 100, 100],
    occluded=False,
    attributes=[],
    label="car",
    outside=False,
    frame=99,
  )
task_data.add_shape(shape)
```
