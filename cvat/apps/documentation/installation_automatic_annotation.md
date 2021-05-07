### Semi-automatic and Automatic Annotation

> **⚠ WARNING: Do not use `docker-compose up`**
> If you did, make sure all containers are stopped by `docker-compose down`.

- To bring up cvat with auto annotation tool, from cvat root directory, you need to run:

  ```bash
  docker-compose -f docker-compose.yml -f components/serverless/docker-compose.serverless.yml up -d
  ```

  If you did any changes to the docker-compose files, make sure to add `--build` at the end.

  To stop the containers, simply run:

  ```bash
  docker-compose -f docker-compose.yml -f components/serverless/docker-compose.serverless.yml down
  ```

- You have to install `nuctl` command line tool to build and deploy serverless
  functions. Download [version 1.5.16](https://github.com/nuclio/nuclio/releases/tag/1.5.16).
  It is important that the version you download matches the version in
  [docker-compose.serverless.yml](/components/serverless/docker-compose.serverless.yml)
  After downloading the nuclio, give it a proper permission and do a softlink

  ```
  sudo chmod +x nuctl-<version>-linux-amd64
  sudo ln -sf $(pwd)/nuctl-<version>-linux-amd64 /usr/local/bin/nuctl
  ```

- Create `cvat` project inside nuclio dashboard where you will deploy new serverless functions and deploy a couple of DL models. Commands below should be run only after CVAT has been installed using `docker-compose` because it runs nuclio dashboard which manages all serverless functions.

  ```bash
  nuctl create project cvat
  ```

  ```bash
  nuctl deploy --project-name cvat \
    --path serverless/openvino/dextr/nuclio \
    --volume `pwd`/serverless/common:/opt/nuclio/common \
    --platform local
  ```

  ```bash
  nuctl deploy --project-name cvat \
    --path serverless/openvino/omz/public/yolo-v3-tf/nuclio \
    --volume `pwd`/serverless/common:/opt/nuclio/common \
    --platform local
  ```

  **Note:**

  - See [deploy_cpu.sh](/serverless/deploy_cpu.sh) for more examples.

  #### GPU Support

  You will need to install [Nvidia Container Toolkit](https://www.tensorflow.org/install/docker#gpu_support).
  Also you will need to add `--resource-limit nvidia.com/gpu=1 --triggers '{"myHttpTrigger": {"maxWorkers": 1}}'` to
  the nuclio deployment command. You can increase the maxWorker if you have enough GPU memory.
  As an example, below will run on the GPU:

  ```bash
  nuctl deploy --project-name cvat \
    --path serverless/tensorflow/matterport/mask_rcnn/nuclio \
    --platform local --base-image tensorflow/tensorflow:1.15.5-gpu-py3 \
    --desc "GPU based implementation of Mask RCNN on Python 3, Keras, and TensorFlow." \
    --image cvat/tf.matterport.mask_rcnn_gpu \
    --triggers '{"myHttpTrigger": {"maxWorkers": 1}}' \
    --resource-limit nvidia.com/gpu=1
  ```

  **Note:**

  - The number of GPU deployed functions will be limited to your GPU memory.
  - See [deploy_gpu.sh](/serverless/deploy_gpu.sh) script for more examples.

**Troubleshooting Nuclio Functions:**

- You can open nuclio dashboard at [localhost:8070](http://localhost:8070). Make sure status of your functions are up and running without any error.
- Test your deployed DL model as a serverless function. The command below should work on Linux and Mac OS.

  ```bash
  image=$(curl https://upload.wikimedia.org/wikipedia/en/7/7d/Lenna_%28test_image%29.png --output - | base64 | tr -d '\n')
  cat << EOF > /tmp/input.json
  {"image": "$image"}
  EOF
  cat /tmp/input.json | nuctl invoke openvino.omz.public.yolo-v3-tf -c 'application/json'
  ```

  <details>

  ```bash
  20.07.17 12:07:44.519    nuctl.platform.invoker (I) Executing function {"method": "POST", "url": "http://:57308", "headers": {"Content-Type":["application/json"],"X-Nuclio-Log-Level":["info"],"X-Nuclio-Target":["openvino.omz.public.yolo-v3-tf"]}}
  20.07.17 12:07:45.275    nuctl.platform.invoker (I) Got response {"status": "200 OK"}
  20.07.17 12:07:45.275                     nuctl (I) >>> Start of function logs
  20.07.17 12:07:45.275 ino.omz.public.yolo-v3-tf (I) Run yolo-v3-tf model {"worker_id": "0", "time": 1594976864570.9353}
  20.07.17 12:07:45.275                     nuctl (I) <<< End of function logs

  > Response headers:
  Date = Fri, 17 Jul 2020 09:07:45 GMT
  Content-Type = application/json
  Content-Length = 100
  Server = nuclio

  > Response body:
  [
      {
          "confidence": "0.9992254",
          "label": "person",
          "points": [
              39,
              124,
              408,
              512
          ],
          "type": "rectangle"
      }
  ]
  ```

  </details>

- To check for internal server errors, run `docker ps -a` to see the list of containers.
  Find the container that you are interested, e.g., `nuclio-nuclio-tf-faster-rcnn-inception-v2-coco-gpu`.
  Then check its logs by `docker logs <name of your container>`
  e.g.,

  ```bash
  docker logs nuclio-nuclio-tf-faster-rcnn-inception-v2-coco-gpu
  ```

- To debug a code inside a container, you can use vscode to attach to a container [instructions](https://code.visualstudio.com/docs/remote/attach-container).
  To apply your changes, make sure to restart the container.
  ```bash
  docker restart <name_of_the_container>
  ```
