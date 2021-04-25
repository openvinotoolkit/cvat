---
title: "Analytics for Computer Vision Annotation Tool (CVAT)"
linkTitle: "Analytics"
weight: 2
description: This section on [GitHub](https://github.com/openvinotoolkit/cvat/tree/develop/components/analytics)
---

![](../../../images/image097.jpg)

It is possible to proxy annotation logs from client to ELK. To do that run the following command below:

### Build docker image

```bash
# From project root directory
docker-compose -f docker-compose.yml -f components/analytics/docker-compose.analytics.yml build
```

### Run docker container

```bash
# From project root directory
docker-compose -f docker-compose.yml -f components/analytics/docker-compose.analytics.yml up -d
```

At the moment it is not possible to save advanced settings. Below values should be specified manually.

## Time picker default

{
"from": "now/d",
"to": "now/d",
"display": "Today",
"section": 0
}

## Time picker quick ranges

```json
[
  {
    "from": "now/d",
    "to": "now/d",
    "display": "Today",
    "section": 0
  },
  {
    "from": "now/w",
    "to": "now/w",
    "display": "This week",
    "section": 0
  },
  {
    "from": "now/M",
    "to": "now/M",
    "display": "This month",
    "section": 0
  },
  {
    "from": "now/y",
    "to": "now/y",
    "display": "This year",
    "section": 0
  },
  {
    "from": "now/d",
    "to": "now",
    "display": "Today so far",
    "section": 2
  },
  {
    "from": "now/w",
    "to": "now",
    "display": "Week to date",
    "section": 2
  },
  {
    "from": "now/M",
    "to": "now",
    "display": "Month to date",
    "section": 2
  },
  {
    "from": "now/y",
    "to": "now",
    "display": "Year to date",
    "section": 2
  },
  {
    "from": "now-1d/d",
    "to": "now-1d/d",
    "display": "Yesterday",
    "section": 1
  },
  {
    "from": "now-1w/w",
    "to": "now-1w/w",
    "display": "Previous week",
    "section": 1
  },
  {
    "from": "now-1m/m",
    "to": "now-1m/m",
    "display": "Previous month",
    "section": 1
  },
  {
    "from": "now-1y/y",
    "to": "now-1y/y",
    "display": "Previous year",
    "section": 1
  }
]
```
