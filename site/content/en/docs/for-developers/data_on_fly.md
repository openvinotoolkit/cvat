---
title: "Data preparation on the fly"
linkTitle: "Data preparation on the fly"
weight: 9
---

## Description

Data on the fly processing is a way of working with data, the main idea of which is as follows: when creating a task,
the minimum necessary meta information is collected. This meta information allows in the future to create necessary
chunks when receiving a request from a client.

Generated chunks are stored in a cache of the limited size with a policy of evicting less popular items.

When a request is received from a client, the required chunk is searched for in the cache. If the chunk does not exist
yet, it is created using prepared meta information and then put into the cache.

This method of working with data allows:

- reduce the task creation time.
- store data in a cache of the limited size with a policy of evicting less popular items.

Unfortunately, this method will not work for all videos with a valid manifest file. If there are not enough keyframes
in the video for smooth video decoding, the task will be created in another way. Namely, all chunks will be prepared
during task creation, which may take some time.

#### Uploading a manifest with data

When creating a task, you can upload a `manifest.jsonl` file along with the video or dataset with images.
You can see how to prepare it [here](../../../docs/for-developers/dataset_manifest/).
