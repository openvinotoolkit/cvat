---
title: "Installation"
linkTitle: "Installation"
weight: 1
description: "CVAT installation guide for different operating systems"
---

# Quick installation guide

Before you can use CVAT, you’ll need to get it installed. The document below
contains instructions for the most popular operating systems. If your system is
not covered by the document it should be relatively straight forward to adapt
the instructions below for other systems.

Probably you need to modify the instructions below in case you are behind a proxy
server. Proxy is an advanced topic and it is not covered by the guide.

## Ubuntu 18.04 (x86_64/amd64)

- Open a terminal window. If you don't know how to open a terminal window on
  Ubuntu please read [the answer](https://askubuntu.com/questions/183775/how-do-i-open-a-terminal).

- Type commands below into the terminal window to install `docker`. More
  instructions can be found [here](https://docs.docker.com/install/linux/docker-ce/ubuntu/).

  ```sh
  sudo apt-get update
  sudo apt-get --no-install-recommends install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
  sudo add-apt-repository \
    "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) \
    stable"
  sudo apt-get update
  sudo apt-get --no-install-recommends install -y docker-ce docker-ce-cli containerd.io
  ```

- Perform [post-installation steps](https://docs.docker.com/install/linux/linux-postinstall/)
  to run docker without root permissions.

  ```sh
  sudo groupadd docker
  sudo usermod -aG docker $USER
  ```

  Log out and log back in (or reboot) so that your group membership is
  re-evaluated. You can type `groups` command in a terminal window after
  that and check if `docker` group is in its output.

- Install docker-compose (1.19.0 or newer). Compose is a tool for
  defining and running multi-container docker applications.

  ```bash
  sudo apt-get --no-install-recommends install -y python3-pip python3-setuptools
  sudo python3 -m pip install setuptools docker-compose
  ```

- Clone _CVAT_ source code from the
  [GitHub repository](https://github.com/opencv/cvat).

  ```bash
  sudo apt-get --no-install-recommends install -y git
  git clone https://github.com/opencv/cvat
  cd cvat
  ```

- Run docker containers. It will take some time to download the latest CVAT
  release and other required images like postgres, redis, etc. from DockerHub and create containers.

  ```sh
  docker-compose up -d
  ```

- Alternative: if you want to build the images locally with unreleased changes
  run the following command. It will take some time to build CVAT images.

  ```bash
  docker-compose -f docker-compose.yml -f docker-compose.dev.yml build
  docker-compose up -d
  ```

- You can register a user but by default it will not have rights even to view
  list of tasks. Thus you should create a superuser. A superuser can use an
  admin panel to assign correct groups to the user. Please use the command
  below:

  ```sh
  docker exec -it cvat bash -ic 'python3 ~/manage.py createsuperuser'
  ```

  Choose a username and a password for your admin account. For more information
  please read [Django documentation](https://docs.djangoproject.com/en/2.2/ref/django-admin/#createsuperuser).

- Google Chrome is the only browser which is supported by CVAT. You need to
  install it as well. Type commands below in a terminal window:

  ```sh
  curl https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
  sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
  sudo apt-get update
  sudo apt-get --no-install-recommends install -y google-chrome-stable
  ```

- Open the installed Google Chrome browser and go to [localhost:8080](http://localhost:8080).
  Type your login/password for the superuser on the login page and press the _Login_
  button. Now you should be able to create a new annotation task. Please read the
  [CVAT user's guide](../../../docs/for-users/user-guide/) for more details.

## Windows 10

- Install WSL2 (Windows subsystem for Linux) refer to [this official guide](https://docs.microsoft.com/windows/wsl/install-win10).
  WSL2 requires Windows 10, version 2004 or higher. Note: You may not have to install a Linux distribution unless
  needed.

- Download and install [Docker Desktop for Windows](https://download.docker.com/win/stable/Docker%20Desktop%20Installer.exe).
  Double-click `Docker for Windows Installer` to run the installer.
  More instructions can be found [here](https://docs.docker.com/docker-for-windows/install/).
  Official guide for docker WSL2 backend can be found
  [here](https://docs.docker.com/docker-for-windows/wsl/). Note: Check that you are specifically using WSL2 backend
  for Docker.

- Download and install
  [Git for Windows](https://github.com/git-for-windows/git/releases/download/v2.21.0.windows.1/Git-2.21.0-64-bit.exe).
  When installing the package please keep all options by default.
  More information about the package can be found [here](https://gitforwindows.org).

- Download and install [Google Chrome](https://www.google.com/chrome/). It is the only browser
  which is supported by CVAT.

- Go to windows menu, find `Git Bash` application and run it. You should see a terminal window.

- Clone _CVAT_ source code from the
  [GitHub repository](https://github.com/opencv/cvat).

  ```sh
  git clone https://github.com/opencv/cvat
  cd cvat
  ```

- Run docker containers. It will take some time to download the latest CVAT
  release and other required images like postgres, redis, etc. from DockerHub and create containers.

  ```sh
  docker-compose up -d
  ```

- Alternative: if you want to build the images locally with unreleased changes
  run the following command. It will take some time to build CVAT images.

  ```sh
  docker-compose -f docker-compose.yml -f docker-compose.dev.yml build
  docker-compose up -d
  ```

- You can register a user but by default it will not have rights even to view
  list of tasks. Thus you should create a superuser. A superuser can use an
  admin panel to assign correct groups to other users. Please use the command
  below:

  ```sh
  winpty docker exec -it cvat bash -ic 'python3 ~/manage.py createsuperuser'
  ```

  Choose a username and a password for your admin account. For more information
  please read [Django documentation](https://docs.djangoproject.com/en/2.2/ref/django-admin/#createsuperuser).

- Open the installed Google Chrome browser and go to [localhost:8080](http://localhost:8080).
  Type your login/password for the superuser on the login page and press the _Login_
  button. Now you should be able to create a new annotation task. Please read the
  [CVAT user's guide](../../../docs/for-users/user-guide) for more details.

## Mac OS Mojave

- Download [Docker for Mac](https://download.docker.com/mac/stable/Docker.dmg).
  Double-click Docker.dmg to open the installer, then drag Moby the whale
  to the Applications folder. Double-click Docker.app in the Applications
  folder to start Docker. More instructions can be found
  [here](https://docs.docker.com/v17.12/docker-for-mac/install/#install-and-run-docker-for-mac).

- There are several ways to install Git on a Mac. The easiest is probably to
  install the Xcode Command Line Tools. On Mavericks (10.9) or above you can
  do this simply by trying to run git from the Terminal the very first time.

  ```bash
  git --version
  ```

  If you don’t have it installed already, it will prompt you to install it.
  More instructions can be found [here](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git).

- Download and install [Google Chrome](https://www.google.com/chrome/). It
  is the only browser which is supported by CVAT.

- Open a terminal window. The terminal app is in the Utilities folder in
  Applications. To open it, either open your Applications folder, then open
  Utilities and double-click on Terminal, or press Command - spacebar to
  launch Spotlight and type "Terminal," then double-click the search result.

- Clone _CVAT_ source code from the
  [GitHub repository](https://github.com/opencv/cvat).

  ```bash
  git clone https://github.com/opencv/cvat
  cd cvat
  ```

- Run docker containers. It will take some time to download the latest CVAT
  release and other required images like postgres, redis, etc. from DockerHub and create containers.

  ```sh
  docker-compose up -d
  ```

- Alternative: if you want to build the images locally with unreleased changes
  run the following command. It will take some time to build CVAT images.

  ```sh
  docker-compose -f docker-compose.yml -f docker-compose.dev.yml build
  docker-compose up -d
  ```

- You can register a user but by default it will not have rights even to view
  list of tasks. Thus you should create a superuser. A superuser can use an
  admin panel to assign correct groups to other users. Please use the command
  below:

  ```sh
  docker exec -it cvat bash -ic 'python3 ~/manage.py createsuperuser'
  ```

  Choose a username and a password for your admin account. For more information
  please read [Django documentation](https://docs.djangoproject.com/en/2.2/ref/django-admin/#createsuperuser).

- Open the installed Google Chrome browser and go to [localhost:8080](http://localhost:8080).
  Type your login/password for the superuser on the login page and press the _Login_
  button. Now you should be able to create a new annotation task. Please read the
  [CVAT user's guide](../../../docs/for-users/user-guide) for more details.

## Advanced Topics

### Deploying CVAT behind a proxy

If you deploy CVAT behind a proxy and do not plan to use any of [serverless functions](#semi-automatic-and-automatic-annotation)
for automatic annotation, the exported environment variables
`http_proxy`, `https_proxy` and `no_proxy` should be enough to build images.
Otherwise please create or edit the file `~/.docker/config.json` in the home directory of the user
which starts containers and add JSON such as the following:

```json
{
  "proxies": {
    "default": {
      "httpProxy": "http://proxy_server:port",
      "httpsProxy": "http://proxy_server:port",
      "noProxy": "*.test.example.com,.example2.com"
    }
  }
}
```

These environment variables are set automatically within any container.
Please see the [Docker documentation](https://docs.docker.com/network/proxy/) for more details.

### Additional components

- [Analytics: management and monitoring of data annotation team](../../../docs/for-developers/analytics/)

```bash
# Build and run containers with Analytics component support:
docker-compose -f docker-compose.yml \
  -f components/analytics/docker-compose.analytics.yml up -d --build
```

### Semi-automatic and automatic annotation

Please follow this [guide](../../../docs/for-users/installation_automatic_annotation/).

### Stop all containers

The command below stops and removes containers, networks, volumes, and images
created by `up`.

```bash
docker-compose down
```

### Advanced settings

If you want to access your instance of CVAT outside of your localhost you should
specify the `CVAT_HOST` environment variable. The best way to do that is to create
[docker-compose.override.yml](https://docs.docker.com/compose/extends/) and put
all your extra settings here.

```yml
version: '3.3'

services:
  cvat_proxy:
    environment:
      CVAT_HOST: .example.com
```

Please don't forget include this file to docker-compose commands using the `-f`
option (in some cases it can be omitted).

### Share path

You can use a share storage for data uploading during you are creating a task.
To do that you can mount it to CVAT docker container. Example of
docker-compose.override.yml for this purpose:

```yml
version: '3.3'

services:
  cvat:
    environment:
      CVAT_SHARE_URL: 'Mounted from /mnt/share host directory'
    volumes:
      - cvat_share:/home/django/share:ro

volumes:
  cvat_share:
    driver_opts:
      type: none
      device: /mnt/share
      o: bind
```

You can change the share device path to your actual share. For user convenience
we have defined the environment variable \$CVAT_SHARE_URL. This variable
contains a text (url for example) which is shown in the client-share browser.

You can [mount](../../../docs/for-developers/mounting_cloud_storages/)
your cloud storage as a FUSE and use it later as a share.

### Email verification

You can enable email verification for newly registered users.
Specify these options in the [settings file](https://github.com/openvinotoolkit/cvat/blob/develop/cvat/settings/base.py) to configure Django allauth
to enable email verification (ACCOUNT_EMAIL_VERIFICATION = 'mandatory').
Access is denied until the user's email address is verified.

```python
ACCOUNT_AUTHENTICATION_METHOD = 'username'
ACCOUNT_CONFIRM_EMAIL_ON_GET = True
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_EMAIL_VERIFICATION = 'mandatory'

# Email backend settings for Django
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
```

Also you need to configure the Django email backend to send emails.
This depends on the email server you are using and is not covered in this tutorial, please see
[Django SMTP backend configuration](https://docs.djangoproject.com/en/3.1/topics/email/#django.core.mail.backends.smtp.EmailBackend)
for details.

### Deploy CVAT on the Scaleway public cloud

Please follow [this tutorial](https://blog.scaleway.com/smart-data-annotation-for-your-computer-vision-projects-cvat-on-scaleway/) to install and set up remote access to CVAT on a Scaleway cloud instance with data in a mounted object storage bucket.

### Deploy secure CVAT instance with HTTPS

Certificates (issued by let's encrypt) to cloud instance.

#### Prerequisites

We assume that:

- you have a virtual instance (machine) in the cloud provider with docker installed;
- there is no root permissions required if user is in docker group;
- there is no services listen 80 and 443 tcp ports on virtual instance.

There are multiple approaches. Our approach suggests:

- easy setup automatic certificate updates;
- leave certificates in safe place on docker host (protect from `docker-compose down` cleanup);
- no unnecessary certificate files copying between container and host.

#### Roadmap

We will go through the following sequence of steps to get CVAT over HTTPS:

- Install [acme.sh](https://github.com/acmesh-official/acme.sh) on the virtual instance (docker host).
- Configure Nginx site template `HOME/cvat/cvat_proxy/conf.d/cvat.conf.template` used in `cvat_proxy` container.
- Deploy CVAT services in the most common way with docker-compose utilizes default HTTP scheme.
- Create the https certificates with `acme.sh` client.
- Reconfigure Nginx to serve over HTTPS.
- Make sure that certificates will be able to automatically update via cron job.

#### Step-by-step instructions

##### 1. Make the proxy listen on 80 and 443 ports

Prepare nginx for the ACME challenge via webroot method

Let's assume the server domain name is `CVAT.example.com`.

Clone repo and point you shell in cvat repository directory, usually `cd $HOME/cvat`:

Install and create the required directories for letsencrypt webroot operation and acme folder passthrough.

```bash
# on the docker host

# this will create ~/.acme.sh directory
curl https://get.acme.sh | sh

# create a subdirs for acme-challenge webroot manually
mkdir -p $HOME/cvat/letsencrypt-webroot/.well-known/acme-challenge
```

Create `docker-compose.override.yml` in repo root like follows:

> modify CVAT_HOST with your own domain name
> (nginx tests the request’s header field “Host” to determine which server the request should be routed to)

```yaml
version: '3.3'

services:
  cvat_proxy:
    environment:
      CVAT_HOST: CVAT.example.com
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./letsencrypt-webroot:/var/tmp/letsencrypt-webroot
      - /etc/ssl/private:/etc/ssl/private

  cvat:
    environment:
      ALLOWED_HOSTS: '*'
```

Update a CVAT site proxy template `$HOME/cvat/cvat_proxy/conf.d/cvat.conf.template` on docker(system) host. Site config updates from this template each time `cvat_proxy` container start.

Add a location to server with `server_name ${CVAT_HOST};` ahead others:

```
    location ^~ /.well-known/acme-challenge/ {
      default_type "text/plain";
      root /var/tmp/letsencrypt-webroot;
    }
```

Make the changes where necessary, e.g. base.py or somewhere else.

Build the containers with new configurations updated in `docker-compose.override.yml`

E.g. including `analytics` module:

```
docker-compose -f docker-compose.yml -f components/analytics/docker-compose.analytics.yml -f docker-compose.override.yml up -d --build
```

Your server should be available (and unsecured) at `http://CVAT.example.com`

Something went wrong ? The most common cause is a containers and images cache which were builded earlier.

This will enable serving `http://CVAT.example.com/.well-known/acme-challenge/`
route from `/var/tmp/letsencrypt-webroot` directory on the container's filesystem which is bind mounted from docker host `$HOME/cvat/letsencrypt-webroot`. That volume needed for issue and renewing certificates only.

Another volume `/etc/ssl/private` should be used within web server according to [acme.sh](https://github.com/acmesh-official/acme.sh#3-install-the-cert-to-apachenginx-etc) documentation

At this point your deployment is up and running, ready for run acme-challenge for issue a new certificate

##### 2. Issue a certificate and run HTTPS versions with `acme.sh` helper

###### Create certificate files using an ACME challenge on docker host

####### Prepare certificates

Point you shell in cvat repository directory, usually `cd $HOME/cvat` on docker host.

Let’s Encrypt provides rate limits to ensure fair usage by as many people as possible. They recommend utilize their staging environment instead of the production API during testing. So first try to get a test certificate.

```
~/.acme.sh/acme.sh --issue --staging -d CVAT.example.com -w $HOME/cvat/letsencrypt-webroot --debug
```

> Debug note: nginx server logs for cvat_proxy are not saved in container. You shall see it at docker host by with: `docker logs cvat_proxy`.

If certificates is issued a successful we can test a renew:

```
~/.acme.sh/acme.sh --renew --force --staging -d CVAT.example.com -w $HOME/cvat/letsencrypt-webroot --debug
```

####### Remove test certificate, if success

```
~/.acme.sh/acme.sh --remove -d CVAT.example.com --debug
rm -r /root/.acme.sh/CVAT.example.com
```

####### Issue a production certificate

```
~/.acme.sh/acme.sh --issue -d CVAT.example.com -w $HOME/cvat/letsencrypt-webroot --debug
```

####### Install production certificate and a user cron job (`crontab -e`) for update it

This will copy necessary certificate files to a permanent directory for serve.
According to acme.sh [documentation](https://github.com/acmesh-official/acme.sh#3-install-the-cert-to-apachenginx-etc)

Additionally, we must create a directory for our domain.
Acme supports a valid install configuration options in domain config file
E.g. `~/.acme.sh/CVAT.example.com/lsoft-cvat.cvisionlab.com.conf`.

```
mkdir /etc/ssl/private/CVAT.example.com

acme.sh --install-cert -d CVAT.example.com \
--cert-file /etc/ssl/private/CVAT.example.com/site.cer  \
--key-file /etc/ssl/private/CVAT.example.com/site.key  \
--fullchain-file /etc/ssl/private/CVAT.example.com/fullchain.cer \
--reloadcmd "/usr/bin/docker restart cvat_proxy"
```

Down the cvat_proxy container for setup https with issued certificate.

```bash
docker stop cvat_proxy
```

####### Reconfigure nginx for use certificates

Bring the configuration file `$HOME/cvat/cvat_proxy/conf.d/cvat.conf.template` to the following form:

- add location with redirect `return 301` from http to https port;
- change main cvat server to listen on 443 port;
- add ssl certificates options.

Final configuration file should look like:

> for a more accurate proxy configuration according to upstream,
> do not neglect the verification with
> this configuration [file](https://github.com/openvinotoolkit/cvat/blob/v1.2.0/cvat_proxy/conf.d/cvat.conf.template).

```
server {
    listen       80;
    server_name  _ default;
    return       404;
}

server {
    listen       80;
    server_name  ${CVAT_HOST};

    location ^~ /.well-known/acme-challenge/ {
      default_type "text/plain";
      root /var/tmp/letsencrypt-webroot;
    }

    location / {
      return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name ${CVAT_HOST};

    ssl_certificate /etc/ssl/private/${CVAT_HOST}/site.cer;
    ssl_certificate_key /etc/ssl/private/${CVAT_HOST}/site.key;
    ssl_trusted_certificate /etc/ssl/private/${CVAT_HOST}/fullchain.cer;

    # security options
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_prefer_server_ciphers on;
    ssl_stapling on;
    ssl_session_timeout 24h;
    ssl_session_cache shared:SSL:2m;
    ssl_ciphers 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:AES:CAMELLIA:DES-CBC3-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!aECDH:!EDH-DSS-DES-CBC3-SHA:!EDH-RSA-DES-CBC3-SHA:!KRB5-DES-CBC3-SHA:!3DES';

    proxy_pass_header       X-CSRFToken;
    proxy_set_header        Host $http_host;
    proxy_pass_header       Set-Cookie;

    location ~* /api/.*|git/.*|analytics/.*|static/.*|admin(?:/(.*))?.*|documentation/.*|django-rq(?:/(.*))? {
        proxy_pass              http://cvat:8080;
    }

    location / {
        proxy_pass              http://cvat_ui;
    }
}

```

Start cvat_proxy container with https enabled.

```bash
docker start cvat_proxy
```
