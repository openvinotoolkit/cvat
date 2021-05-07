<!--
 Copyright (C) 2021 Intel Corporation

 SPDX-License-Identifier: MIT
-->

# Serverless tutorial

## Introduction

Now computers become our partners. They help us to solve routine tasks,
fix mistakes, find information, etc. It is a natural idea to use their
compute power to annotate datasets. There are multiple DL models for
classification, object detection, semantic segmentation which can do
data annotation for us. And it is relatively simple to integrate your
own ML/DL solution into CVAT.

But the world is not perfect and we don't have a silver bullet which can
solve all our problems. Usually available DL models are trained on public
datasets which cannot cover all specific cases. Very often you want to
detect objects which cannot be recognized by these models. Our annotation
requirements can be so strict that automatically
annotated objects cannot be accepted as is and it is easy to annotate them
from scratch. You always need to keep in mind all these mentioned limitations.
Even if you have a DL solution which can
_perfectly_ annotate 50% of your data, it means that manual work will be
reduced only twice in the best case.

When we know that DL models can help us to annotate data faster, the next
question is how to use them? In CVAT all such DL models are implemented
as serverless functions for [nuclio][nuclio-homepage] serverless platform.
And there are multiple implemented functions which can be
found in [serverless][cvat-builtin-serverless] directory such as `Mask RCNN`,
`Faster RCNN`, `SiamMask`, `Inside Outside Guidance`, `Deep Extreme Cut`, etc.
Follow [the installation guide][cvat-auto-annotation-guide] to build and deploy
these serverless functions. See [the user guide][cvat-ai-tools-user-guide] to
understand how to use these functions in UI to automatically annotate data.

What is a serverless function and why is it used for automatic annotation
in CVAT? Let's assume that you have a DL model and want to use it for
AI assisted annotation. The naive approach is to implement a python
script which uses the DL model to prepare a file with annotations in a
public format like [MS COCO][mscoco-format] or [Pascal VOC][pascal-voc-format].
After that you can upload the annotation file into CVAT. It works but it is
not user-friendly. How to force CVAT to run the script for you?

You can pack the script with your DL model into a container which
provides standard interface to interact with it. One way to do that is to use
[function as a service][faas-wiki] approach. Your script becomes a function
inside cloud infrastructure which can be called over HTTP. The nuclio
serverless platform helps us to implement and manage such functions.

CVAT supports nuclio out of the box if it is built properly. See
[the installation guide][cvat-auto-annotation-guide] for instructions.
Thus if you deploy a serverless function, CVAT server can see it and call
with appropriate arguments. Of course there are some tricks how to create
serverless functions for CVAT and we will discuss them in next sections of
the tutorial.

## Using builtin DL models in practice

Let's see on some examples how to use DL models for different annotation tasks.

In the tutorial it is assumed that you already have the cloned
[CVAT GitHub repo][cvat-github].
To build CVAT with serverless support you need to include corresponding
docker-compose files. In our case it is `docker-comopse.serverless.yml`.
It has necessary instructions how to build and deploy nuclio platform
as a docker container and enable corresponding support in CVAT.

```sh
docker-compose -f docker-compose.yml -f docker-compose.dev.yml -f components/serverless/docker-compose.serverless.yml up -d --build
```

```sh
docker-compose -f docker-compose.yml -f docker-compose.dev.yml -f components/serverless/docker-compose.serverless.yml ps
   Name                 Command                  State                            Ports
-------------------------------------------------------------------------------------------------------------
cvat         /usr/bin/supervisord             Up             8080/tcp
cvat_db      docker-entrypoint.sh postgres    Up             5432/tcp
cvat_proxy   /docker-entrypoint.sh /bin ...   Up             0.0.0.0:8080->80/tcp,:::8080->80/tcp
cvat_redis   docker-entrypoint.sh redis ...   Up             6379/tcp
cvat_ui      /docker-entrypoint.sh ngin ...   Up             80/tcp
nuclio       /docker-entrypoint.sh sh - ...   Up (healthy)   80/tcp, 0.0.0.0:8070->8070/tcp,:::8070->8070/tcp
```

To deploy builtin serverless functions you need to install nuclio command
line tool (aka `nuctl`) for your operating system. Again it is assumed that
you followed [the installation guide][cvat-auto-annotation-guide] and `nuctl`
is already installed on your system. Run the following command to check that
it works. In the beginning you should not have any deployed serverless
functions.

```sh
nuctl get functions
No functions found
```

Let's look at specific use cases which can help you to annotate data
for different tasks.

### Tracking using SiamMask

In this use case a user needs to annotate all individual objects on a video as
tracks. Basically for every object we need to know its location on every frame.

First step is to deploy [SiamMask][siammask-serverless]. The deployment process
can depend on your operating system. On Linux you can use `serverless/deploy_cpu.sh`
auxiliary script but in the tutorial we are using `nuctl` directly.

```sh
nuctl create project cvat

nuctl deploy --project-name cvat --path "./serverless/pytorch/foolwood/siammask/nuclio" --platform local
21.05.07 13:00:22.233                     nuctl (I) Deploying function {"name": ""}
21.05.07 13:00:22.233                     nuctl (I) Building {"versionInfo": "Label: 1.5.16, Git commit: ae43a6a560c2bec42d7ccfdf6e8e11a1e3cc3774, OS: linux, Arch: amd64, Go version: go1.14.3", "name": ""}
21.05.07 13:00:22.652                     nuctl (I) Cleaning up before deployment {"functionName": "pth-foolwood-siammask"}
21.05.07 13:00:22.705                     nuctl (I) Staging files and preparing base images
21.05.07 13:00:22.706                     nuctl (I) Building processor image {"imageName": "cvat/pth.foolwood.siammask:latest"}
21.05.07 13:00:22.706     nuctl.platform.docker (I) Pulling image {"imageName": "quay.io/nuclio/handler-builder-python-onbuild:1.5.16-amd64"}
21.05.07 13:00:26.351     nuctl.platform.docker (I) Pulling image {"imageName": "quay.io/nuclio/uhttpc:0.0.1-amd64"}
21.05.07 13:00:29.819            nuctl.platform (I) Building docker image {"image": "cvat/pth.foolwood.siammask:latest"}
21.05.07 13:00:30.103            nuctl.platform (I) Pushing docker image into registry {"image": "cvat/pth.foolwood.siammask:latest", "registry": ""}
21.05.07 13:00:30.103            nuctl.platform (I) Docker image was successfully built and pushed into docker registry {"image": "cvat/pth.foolwood.siammask:latest"}
21.05.07 13:00:30.104                     nuctl (I) Build complete {"result": {"Image":"cvat/pth.foolwood.siammask:latest","UpdatedFunctionConfig":{"metadata":{"name":"pth-foolwood-siammask","namespace":"nuclio","labels":{"nuclio.io/project-name":"cvat"},"annotations":{"framework":"pytorch","name":"SiamMask","spec":"","type":"tracker"}},"spec":{"description":"Fast Online Object Tracking and Segmentation","handler":"main:handler","runtime":"python:3.6","env":[{"name":"PYTHONPATH","value":"/opt/nuclio/SiamMask:/opt/nuclio/SiamMask/experiments/siammask_sharp"}],"resources":{},"image":"cvat/pth.foolwood.siammask:latest","targetCPU":75,"triggers":{"myHttpTrigger":{"class":"","kind":"http","name":"myHttpTrigger","maxWorkers":2,"workerAvailabilityTimeoutMilliseconds":10000,"attributes":{"maxRequestBodySize":33554432}}},"build":{"image":"cvat/pth.foolwood.siammask","baseImage":"continuumio/miniconda3","directives":{"preCopy":[{"kind":"WORKDIR","value":"/opt/nuclio"},{"kind":"RUN","value":"conda create -y -n siammask python=3.6"},{"kind":"SHELL","value":"[\"conda\", \"run\", \"-n\", \"siammask\", \"/bin/bash\", \"-c\"]"},{"kind":"RUN","value":"git clone https://github.com/foolwood/SiamMask.git"},{"kind":"RUN","value":"pip install -r SiamMask/requirements.txt jsonpickle"},{"kind":"RUN","value":"conda install -y gcc_linux-64"},{"kind":"RUN","value":"cd SiamMask \u0026\u0026 bash make.sh \u0026\u0026 cd -"},{"kind":"RUN","value":"wget -P SiamMask/experiments/siammask_sharp http://www.robots.ox.ac.uk/~qwang/SiamMask_DAVIS.pth"},{"kind":"ENTRYPOINT","value":"[\"conda\", \"run\", \"-n\", \"siammask\"]"}]},"codeEntryType":"image"},"platform":{"attributes":{"mountMode":"volume","restartPolicy":{"maximumRetryCount":3,"name":"always"}}},"readinessTimeoutSeconds":60,"securityContext":{},"eventTimeout":"30s"}}}}
21.05.07 13:00:31.387            nuctl.platform (I) Waiting for function to be ready {"timeout": 60}
21.05.07 13:00:32.796                     nuctl (I) Function deploy complete {"functionName": "pth-foolwood-siammask", "httpPort": 49155}
```

```sh
nuctl get functions
  NAMESPACE |         NAME          | PROJECT | STATE | NODE PORT | REPLICAS
  nuclio    | pth-foolwood-siammask | cvat    | ready |     49155 | 1/1
```

Let's see how it works in UI. First of all go to http://localhost:8080/models
and check that you can see SiamMask in the list. If you cannot by a reason it
means that there are some problems. Go to one of our public channels and ask
for help.

![Models list with SiamMask](images/models_list_with_siammask.png)

After that go to http://localhost:8080/tasks/create and create an annotation
task with [the video file][vtest-avi]. You can choose any task name, any
labels, and even another video file if you like. In this case `Remote sources`
option was used to specify the video file. Press submit button at the end to
finish the process.

![Create a video annotation task](images/create_video_task.png)

Open the task and use [AI tools][cvat-ai-tools-user-guide] to start tracking
an object. Draw a bounding box around the object and it will be tracked during
a couple of frames forward.

![Start tracking an object](images/start_tracking.png)

Finally you will get bounding boxes for 10 frames by default.

![SiamMask results](images/siammask_results.gif)

### Object detection using YOLO-v3

### Objects segmentation using Mask-RCNN

## User story

- Architecture of a serverless functions in CVAT (function.yaml, entry point)
- Choose a dataset which you want to annotate

- Choose a custom model which you want to integrate - DONE
- Prepare necessary files (function.yaml, main.py) - DONE

- Automatically annotate data using the prepared model
- Compare results with the ground truth using Datumaro
- Conclusion

## Advanced capabilities

- Optimize using GPU
- Testing
- Logging (docker)
- Debugging
- Troubleshooting

## Choose a DL model

In my case I will choose a popular AI library with a lot of models inside.
In your case it can be your own model. If it is based on detectron2 it
will be easy to integrate. Just follow the tutorial.

[Detectron2][detectron2-github] is Facebook AI Research's next generation
library that provides state-of-the-art detection and segmentation algorithms.
It is the successor of Detectron and maskrcnn-benchmark. It supports a number
of computer vision research projects and production applications in Facebook.

Clone the repository somewhere. I assume that all other experiments will be
run from the cloned `detectron2` directory.

```sh
git clone https://github.com/facebookresearch/detectron2
cd detectron2
```

## Run local experiments

Let's run a detection model locally. First of all need to
[install requirements][detectron2-requirements] for the library.

In my case I have Ubuntu 20.04 with python 3.8.5. I installed
[PyTorch 1.8.1][pytorch-install] for Linux with pip, python, and CPU inside
a virtual environment. Follow [opencv-python][opencv-python-github]
installation guide to get the library for demo and visualization.

```bash
python3 -m venv .detectron2
. .detectron2/bin/activate
pip install torch==1.8.1+cpu torchvision==0.9.1+cpu torchaudio==0.8.1 -f https://download.pytorch.org/whl/torch_stable.html
pip install opencv-python
```

Install the detectron2 library from your local clone.

```sh
python -m pip install -e detectron2 .
```

After the library from Facebook AI Research is installed, we can run a couple
of experiments. See the [official tutorial][detectron2-tutorial] for more
examples. I decided to experiment with [RetinaNet][retinanet-model-zoo]. First
step is to download model weights.

```sh
curl -O https://dl.fbaipublicfiles.com/detectron2/COCO-Detection/retinanet_R_101_FPN_3x/190397697/model_final_971ab9.pkl
```

To run experiments let's download an image with cats from wikipedia.

```sh
curl -O https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Cat_poster_1.jpg/1920px-Cat_poster_1.jpg
```

Finally let's run the DL model inference on CPU. If all is fine, you will see
a window with cats and bounding boxes around them with scores.

```sh
python demo/demo.py --config-file configs/COCO-Detection/retinanet_R_101_FPN_3x.yaml \
    --input 1920px-Cat_poster_1.jpg --opts MODEL.WEIGHTS model_final_971ab9.pkl MODEL.DEVICE cpu
```

![Cats detected by RetinaNet R101](images/detectron2_detected_cats.jpg)

Next step is to minimize `demo/demo.py` script and keep code which is necessary to load,
run, and interpret output of the model only. Let's hard code parameters and remove
argparse. Keep only code which is responsible for working with an image. There is
no common advice how to minimize some code.

Finally you should get something like the code below which has fixed config, read a
predefined image, initialize predictor, and run inference. As the final step it prints
all detected bounding boxes with scores and labels.

```python
from detectron2.config import get_cfg
from detectron2.data.detection_utils import read_image
from detectron2.engine.defaults import DefaultPredictor
from detectron2.data.datasets.builtin_meta import COCO_CATEGORIES

CONFIG_FILE = "configs/COCO-Detection/retinanet_R_101_FPN_3x.yaml"
CONFIG_OPTS = ["MODEL.WEIGHTS", "model_final_971ab9.pkl", "MODEL.DEVICE", "cpu"]
CONFIDENCE_THRESHOLD = 0.5

def setup_cfg():
    cfg = get_cfg()
    cfg.merge_from_file(CONFIG_FILE)
    cfg.merge_from_list(CONFIG_OPTS)
    cfg.MODEL.RETINANET.SCORE_THRESH_TEST = CONFIDENCE_THRESHOLD
    cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = CONFIDENCE_THRESHOLD
    cfg.MODEL.PANOPTIC_FPN.COMBINE.INSTANCES_CONFIDENCE_THRESH = CONFIDENCE_THRESHOLD
    cfg.freeze()
    return cfg


if __name__ == "__main__":
    cfg = setup_cfg()
    input = "1920px-Cat_poster_1.jpg"
    img = read_image(input, format="BGR")
    predictor = DefaultPredictor(cfg)
    predictions = predictor(img)
    instances = predictions['instances']
    pred_boxes = instances.pred_boxes
    scores = instances.scores
    pred_classes = instances.pred_classes
    for box, score, label in zip(pred_boxes, scores, pred_classes):
        label = COCO_CATEGORIES[int(label)]["name"]
        print(box.tolist(), float(score), label)
```

## DL model as a serverless function

When we know how to run the DL model locally, we can prepare a serverless
function which can be used by CVAT to annotate data. Let's see how function.yaml
will look like...

Let's look at [faster_rcnn_inception_v2_coco][faster-rcnn-function] serverless
function configuration as an example and try adapting it to our case.
First of all let's invent an unique name for the new function:
`pth.facebookresearch.detectron2.retinanet_r101`. Section `annotations`
describes our function for CVAT serverless subsystem:

- `annotations.name` is a display name
- `annotations.type` is a type of the serverless function. It can have
  several different values. Basically it affects input and output of the function.
  In our case it has `detector` type and it means that the integrated DL model can
  generate shapes with labels for an image.
- `annotations.framework` is used for information only and can have arbitrary
  value. Usually it has values like OpenVINO, PyTorch, TensorFlow, etc.
- `annotations.spec` describes the list of labels which the model supports. In
  the case the DL model was trained on MS COCO dataset and the list of labels
  correspond to the dataset.
- `spec.description` is used to provide basic information for the model.

All other parameters are described in [nuclio documentation][nuclio-doc].

- `spec.handler` is the entry point to your function.
- `spec.runtime` is the name of the language runtime.
- `spec.eventTimeout` is the global event timeout

Next step is to describe how to build our serverless function:

- `spec.build.image` is the name of your docker image
- `spec.build.baseImage` is the name of a base container image from which to build the function
- `spec.build.directives` are commands to build your docker image

In our case we start from Ubuntu 20.04 base image, install `curl` to download
weights for our model, `git` to clone detectron2 project from GitHub, and
`python` together with `pip`. Repeat installation steps which we used to setup
the DL model locally with minor modifications.

For Nuclio platform we have to specify a couple of more parameters:

- `spec.triggers.myHttpTrigger` describes [HTTP trigger][nuclio-http-trigger-doc]
  to handle incoming HTTP requests.
- `spec.platform` describes some important parameters to run your functions like
  `restartPolicy` and `mountMode`. Read nuclio documentation for more details.

```yaml
metadata:
  name: pth.facebookresearch.detectron2.retinanet_r101
  namespace: cvat
  annotations:
    name: RetinaNet R101
    type: detector
    framework: pytorch
    spec: |
      [
        { "id": 1, "name": "person" },
        { "id": 2, "name": "bicycle" },

        ...

        { "id":89, "name": "hair_drier" },
        { "id":90, "name": "toothbrush" }
      ]

spec:
  description: RetinaNet R101 from Detectron2
  runtime: 'python:3.8'
  handler: main:handler
  eventTimeout: 30s

  build:
    image: cvat/pth.facebookresearch.detectron2.retinanet_r101
    baseImage: ubuntu:20.04

    directives:
      preCopy:
        - kind: ENV
          value: DEBIAN_FRONTEND=noninteractive
        - kind: RUN
          value: apt-get update && apt-get -y install curl git python3 python3-pip
        - kind: WORKDIR
          value: /opt/nuclio
        - kind: RUN
          value: pip3 install torch==1.8.1+cpu torchvision==0.9.1+cpu torchaudio==0.8.1 -f https://download.pytorch.org/whl/torch_stable.html
        - kind: RUN
          value: git clone https://github.com/facebookresearch/detectron2
        - kind: RUN
          value: pip3 install -e detectron2
        - kind: RUN
          value: curl -O https://dl.fbaipublicfiles.com/detectron2/COCO-Detection/retinanet_R_101_FPN_3x/190397697/model_final_971ab9.pkl
        - kind: RUN
          value: ln -s /usr/bin/pip3 /usr/local/bin/pip

  triggers:
    myHttpTrigger:
      maxWorkers: 2
      kind: 'http'
      workerAvailabilityTimeoutMilliseconds: 10000
      attributes:
        maxRequestBodySize: 33554432 # 32MB

  platform:
    attributes:
      restartPolicy:
        name: always
        maximumRetryCount: 3
      mountMode: volume
```

Full code can be found here: [detectron2/retinanet/nuclio/function.yaml][retinanet-function-yaml]

Next step is to adapt our source code which we implemented to run the DL model
locally to requirements of nuclio platform. First step is to load the model
into memory using `init_context(context)` function. Read more about the function
in [Best Practices and Common Pitfalls][nuclio-bkms-doc].

After that we need to accept incoming HTTP requests, run inference,
reply with detection results. For the process our entry point is resposible
which we specified in our function specification `handler(context, event)`.
Again in accordance to function specification the entry point should be
located inside `main.py`.

```python

def init_context(context):
    cfg = get_cfg()
    cfg.merge_from_file(CONFIG_FILE)
    cfg.merge_from_list(CONFIG_OPTS)
    cfg.MODEL.RETINANET.SCORE_THRESH_TEST = CONFIDENCE_THRESHOLD
    cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = CONFIDENCE_THRESHOLD
    cfg.MODEL.PANOPTIC_FPN.COMBINE.INSTANCES_CONFIDENCE_THRESH = CONFIDENCE_THRESHOLD
    cfg.freeze()
    predictor = DefaultPredictor(cfg)

    setattr(context.user_data, 'model_handler', predictor)
    functionconfig = yaml.safe_load(open("/opt/nuclio/function.yaml"))
    labels_spec = functionconfig['metadata']['annotations']['spec']
    labels = {item['id']: item['name'] for item in json.loads(labels_spec)}
    setattr(context.user_data, "labels", labels)

def handler(context, event):
    data = event.body
    buf = io.BytesIO(base64.b64decode(data["image"].encode('utf-8')))
    threshold = float(data.get("threshold", 0.5))
    image = convert_PIL_to_numpy(Image.open(buf), format="BGR")

    predictions = context.user_data.model_handler(image)

    instances = predictions['instances']
    pred_boxes = instances.pred_boxes
    scores = instances.scores
    pred_classes = instances.pred_classes
    results = []
    for box, score, label in zip(pred_boxes, scores, pred_classes):
        label = COCO_CATEGORIES[int(label)]["name"]
        if score >= threshold:
            results.append({
                "confidence": str(float(score)),
                "label": label,
                "points": box.tolist(),
                "type": "rectangle",
            })

    return context.Response(body=json.dumps(results), headers={},
        content_type='application/json', status_code=200)

```

Full code can be found here: [detectron2/retinanet/nuclio/main.py][retinanet-main-py]

## Deploy RetinaNet serverless function

To use the new serverless function you have to deploy it using `nuctl` command.
The actual deployment process is described in
[automatic annotation guide][cvat-auto-annotation-guide]

[detectron2-github]: https://github.com/facebookresearch/detectron2
[detectron2-requirements]: https://detectron2.readthedocs.io/en/latest/tutorials/install.html
[pytorch-install]: https://pytorch.org/get-started/locally/
[opencv-python-github]: https://github.com/opencv/opencv-python
[detectron2-tutorial]: https://detectron2.readthedocs.io/en/latest/tutorials/getting_started.html
[retinanet-model-zoo]: https://github.com/facebookresearch/detectron2/blob/master/MODEL_ZOO.md#retinanet
[faster-rcnn-function]: https://raw.githubusercontent.com/openvinotoolkit/cvat/38b774046d41d604ed85a521587e4bacce61b69c/serverless/tensorflow/faster_rcnn_inception_v2_coco/nuclio/function.yaml
[nuclio-doc]: https://nuclio.io/docs/latest/reference/function-configuration/function-configuration-reference/
[nuclio-http-trigger-doc]: https://nuclio.io/docs/latest/reference/triggers/http/
[nuclio-bkms-doc]: https://nuclio.io/docs/latest/concepts/best-practices-and-common-pitfalls/
[retinanet-function-yaml]: https://github.com/openvinotoolkit/cvat/blob/b2f616859ca64687c385e636b4a25014fbb9d17c/serverless/pytorch/facebookresearch/detectron2/retinanet/nuclio/function.yaml
[retinanet-main-py]: https://github.com/openvinotoolkit/cvat/blob/b2f616859ca64687c385e636b4a25014fbb9d17c/serverless/pytorch/facebookresearch/detectron2/retinanet/nuclio/main.py
[nuclio-homepage]: https://nuclio.io/
[cvat-builtin-serverless]: https://github.com/openvinotoolkit/cvat/tree/develop/serverless
[cvat-auto-annotation-guide]: https://github.com/openvinotoolkit/cvat/blob/develop/cvat/apps/documentation/installation_automatic_annotation.md
[mscoco-format]: https://cocodataset.org/#format-data
[pascal-voc-format]: http://host.robots.ox.ac.uk/pascal/VOC/voc2012/htmldoc/index.html
[faas-wiki]: https://en.wikipedia.org/wiki/Function_as_a_service
[cvat-ai-tools-user-guide]: https://github.com/openvinotoolkit/cvat/blob/develop/cvat/apps/documentation/user_guide.md#ai-tools
[cvat-github]: https://github.com/openvinotoolkit/cvat
[siammask-serverless]: https://github.com/openvinotoolkit/cvat/tree/develop/serverless/pytorch/foolwood/siammask/nuclio
[vtest-avi]: https://github.com/opencv/opencv/blob/master/samples/data/vtest.avi?raw=true
