---
title: "Mounting cloud storage"
linkTitle: "Mounting cloud storage"
weight: 10
---

## AWS S3 bucket as filesystem
### <a name="aws_s3_ubuntu_2004">Ubuntu 20.04</a>
#### <a name="aws_s3_mount">Mount</a>

1.  Install s3fs:

    ```bash
    sudo apt install s3fs
    ```

1.  Enter your credentials in a file  `${HOME}/.passwd-s3fs`  and set owner-only permissions:

    ```bash
    echo ACCESS_KEY_ID:SECRET_ACCESS_KEY > ${HOME}/.passwd-s3fs
    chmod 600 ${HOME}/.passwd-s3fs
    ```

1.  Uncomment `user_allow_other` in the `/etc/fuse.conf` file: `sudo nano /etc/fuse.conf`
1.  Run s3fs, replace `bucket_name`, `mount_point`:

    ```bash
    s3fs <bucket_name> <mount_point> -o allow_other
    ```

For more details see [here](https://github.com/s3fs-fuse/s3fs-fuse).

#### <a name="aws_s3_automatically_mount">Automatically mount</a>
Follow the first 3 mounting steps above.

##### <a name="aws_s3_using_fstab">Using fstab</a>

1.  Create a bash script named aws_s3_fuse(e.g in /usr/bin, as root) with this content
    (replace `user_name` on whose behalf the disk will be mounted, `backet_name`, `mount_point`, `/path/to/.passwd-s3fs`):

    ```bash
    #!/bin/bash
    sudo -u <user_name> s3fs <backet_name> <mount_point> -o passwd_file=/path/to/.passwd-s3fs -o allow_other
    exit 0
    ```

1.  Give it the execution permission:

    ```bash
    sudo chmod +x /usr/bin/aws_s3_fuse
    ```

1.  Edit `/etc/fstab` adding a line like this, replace `mount_point`):

    ```bash
    /absolute/path/to/aws_s3_fuse  <mount_point>     fuse    allow_other,user,_netdev     0       0
    ```

##### <a name="aws_s3_using_systemd">Using systemd</a>

1.  Create unit file `sudo nano /etc/systemd/system/s3fs.service`
    (replace `user_name`, `bucket_name`, `mount_point`, `/path/to/.passwd-s3fs`):

    ```bash
    [Unit]
    Description=FUSE filesystem over AWS S3 bucket
    After=network.target

    [Service]
    Environment="MOUNT_POINT=<mount_point>"
    User=<user_name>
    Group=<user_name>
    ExecStart=s3fs <bucket_name> ${MOUNT_POINT} -o passwd_file=/path/to/.passwd-s3fs -o allow_other
    ExecStop=fusermount -u ${MOUNT_POINT}
    Restart=always
    Type=forking

    [Install]
    WantedBy=multi-user.target
    ```

1.  Update the system configurations, enable unit autorun when the system boots, mount the bucket:

    ```bash
    sudo systemctl daemon-reload
    sudo systemctl enable s3fs.service
    sudo systemctl start s3fs.service
    ```

#### <a name="aws_s3_check">Check</a>
A file `/etc/mtab` contains records of currently mounted filesystems.
```bash
cat /etc/mtab | grep 's3fs'
```

#### <a name="aws_s3_unmount_filesystem">Unmount filesystem</a>
```bash
fusermount -u <mount_point>
```

If you used [systemd](#aws_s3_using_systemd) to mount a bucket:

```bash
sudo systemctl stop s3fs.service
sudo systemctl disable s3fs.service
```

## Microsoft Azure container as filesystem
### <a name="azure_ubuntu_2004">Ubuntu 20.04</a>
#### <a name="azure_mount">Mount</a>
1.  Set up the Microsoft package repository.(More [here](https://docs.microsoft.com/en-us/windows-server/administration/Linux-Package-Repository-for-Microsoft-Software#configuring-the-repositories))

    ```bash
    wget https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb
    sudo dpkg -i packages-microsoft-prod.deb
    sudo apt-get update
    ```

1.  Install `blobfuse` and `fuse`:

    ```bash
    sudo apt-get install blobfuse fuse
    ```
    For more details see [here](https://github.com/Azure/azure-storage-fuse/wiki/1.-Installation)

1.  Create enviroments(replace `account_name`, `account_key`, `mount_point`):

    ```bash
    export AZURE_STORAGE_ACCOUNT=<account_name>
    export AZURE_STORAGE_ACCESS_KEY=<account_key>
    MOUNT_POINT=<mount_point>
    ```

1.  Create a folder for cache:
    ```bash
    sudo mkdir -p /mnt/blobfusetmp
    ```

1.  Make sure the file must be owned by the user who mounts the container:
    ```bash
    sudo chown <user> /mnt/blobfusetmp
    ```

1.  Create the mount point, if it doesn't exists:
    ```bash
    mkdir -p ${MOUNT_POINT}
    ```

1.  Uncomment `user_allow_other` in the `/etc/fuse.conf` file: `sudo nano /etc/fuse.conf`
1.  Mount container(replace `your_container`):

    ```bash
    blobfuse ${MOUNT_POINT} --container-name=<your_container> --tmp-path=/mnt/blobfusetmp -o allow_other
    ```

#### <a name="azure_automatically_mount">Automatically mount</a>
Follow the first 7 mounting steps above.
##### <a name="azure_using_fstab">Using fstab</a>

1.  Create configuration file `connection.cfg` with same content, change accountName,
    select one from accountKey or sasToken and replace with your value:

    ```bash
    accountName <account-name-here>
    # Please provide either an account key or a SAS token, and delete the other line.
    accountKey <account-key-here-delete-next-line>
    #change authType to specify only 1
    sasToken <shared-access-token-here-delete-previous-line>
    authType <MSI/SAS/SPN/Key/empty>
    containerName <insert-container-name-here>
    ```

1.  Create a bash script named `azure_fuse`(e.g in /usr/bin, as root) with content below
    (replace `user_name` on whose behalf the disk will be mounted, `mount_point`, `/path/to/blobfusetmp`,`/path/to/connection.cfg`):

    ```bash
    #!/bin/bash
    sudo -u <user_name> blobfuse <mount_point> --tmp-path=/path/to/blobfusetmp  --config-file=/path/to/connection.cfg -o allow_other
    exit 0
    ```

1.  Give it the execution permission:
    ```bash
    sudo chmod +x /usr/bin/azure_fuse
    ```

1.  Edit `/etc/fstab` with the blobfuse script. Add the following line(replace paths):
```bash
/absolute/path/to/azure_fuse </path/to/desired/mountpoint> fuse allow_other,user,_netdev
```

##### <a name="azure_using_systemd">Using systemd</a>

1.  Create unit file `sudo nano /etc/systemd/system/blobfuse.service`.
    (replace `user_name`, `mount_point`, `container_name`,`/path/to/connection.cfg`):

    ```bash
    [Unit]
    Description=FUSE filesystem over Azure container
    After=network.target

    [Service]
    Environment="MOUNT_POINT=<mount_point>"
    User=<user_name>
    Group=<user_name>
    ExecStart=blobfuse ${MOUNT_POINT} --container-name=<container_name> --tmp-path=/mnt/blobfusetmp --config-file=/path/to/connection.cfg -o allow_other
    ExecStop=fusermount -u ${MOUNT_POINT}
    Restart=always
    Type=forking

    [Install]
    WantedBy=multi-user.target
    ```

1.  Update the system configurations, enable unit autorun when the system boots, mount the container:

    ```bash
    sudo systemctl daemon-reload
    sudo systemctl enable blobfuse.service
    sudo systemctl start blobfuse.service
    ```
    Or for more detail [see here](https://github.com/Azure/azure-storage-fuse/tree/master/systemd)

#### <a name="azure_check">Check</a>
A file `/etc/mtab` contains records of currently mounted filesystems.
```bash
cat /etc/mtab | grep 'blobfuse'
```

#### <a name="azure_unmount_filesystem">Unmount filesystem</a>
```bash
fusermount -u <mount_point>
```

If you used [systemd](#azure_using_systemd) to mount a container:

```bash
sudo systemctl stop blobfuse.service
sudo systemctl disable blobfuse.service
```

If you have any mounting problems, check out the [answers](https://github.com/Azure/azure-storage-fuse/wiki/3.-Troubleshoot-FAQ)
to common problems

## Google Drive as filesystem
### <a name="google_drive_ubuntu_2004">Ubuntu 20.04</a>
#### <a name="google_drive_mount">Mount</a>
To mount a google drive as a filesystem in user space(FUSE)
you can use [google-drive-ocamlfuse](https://github.com/astrada/google-drive-ocamlfuse)
To do this follow the instructions below:

1.  Install google-drive-ocamlfuse:

    ```bash
    sudo add-apt-repository ppa:alessandro-strada/ppa
    sudo apt-get update
    sudo apt-get install google-drive-ocamlfuse
    ```

1.  Run `google-drive-ocamlfuse` without parameters:

    ```bash
    google-drive-ocamlfuse
    ```

    This command will create the default application directory (~/.gdfuse/default),
    containing the configuration file config (see the [wiki](https://github.com/astrada/google-drive-ocamlfuse/wiki)
    page for more details about configuration).
    And it will start a web browser to obtain authorization to access your Google Drive.
    This will let you modify default configuration before mounting the filesystem.

    Then you can choose a local directory to mount your Google Drive (e.g.: ~/GoogleDrive).

1.  Create the mount point, if it doesn't exist(replace mount_point):

    ```bash
    mountpoint="<mount_point>"
    mkdir -p $mountpoint
    ```

1.  Uncomment `user_allow_other` in the `/etc/fuse.conf` file: `sudo nano /etc/fuse.conf`
1.  Mount the filesystem:

    ```bash
    google-drive-ocamlfuse -o allow_other $mountpoint
    ```

#### <a name="google_drive_automatically_mount">Automatically mount</a>
Follow the first 4 mounting steps above.
##### <a name="google_drive_using_fstab">Using fstab</a>

1.  Create a bash script named gdfuse(e.g in /usr/bin, as root) with this content
    (replace `user_name` on whose behalf the disk will be mounted, `label`, `mount_point`):

    ```bash
    #!/bin/bash
    sudo -u <user_name> google-drive-ocamlfuse -o allow_other -label <label> <mount_point>
    exit 0
    ```

1.  Give it the execution permission:

    ```bash
    sudo chmod +x /usr/bin/gdfuse
    ```

1.  Edit `/etc/fstab` adding a line like this, replace `mount_point`):

    ```bash
    /absolute/path/to/gdfuse  <mount_point>     fuse    allow_other,user,_netdev     0       0
    ```

    For more details see [here](https://github.com/astrada/google-drive-ocamlfuse/wiki/Automounting)

##### <a name="google_drive_using_systemd">Using systemd</a>

1.  Create unit file `sudo nano /etc/systemd/system/google-drive-ocamlfuse.service`.
    (replace `user_name`, `label`(default `label=default`), `mount_point`):

    ```bash
    [Unit]
    Description=FUSE filesystem over Google Drive
    After=network.target

    [Service]
    Environment="MOUNT_POINT=<mount_point>"
    User=<user_name>
    Group=<user_name>
    ExecStart=google-drive-ocamlfuse -label <label> ${MOUNT_POINT}
    ExecStop=fusermount -u ${MOUNT_POINT}
    Restart=always
    Type=forking

    [Install]
    WantedBy=multi-user.target
    ```

1.  Update the system configurations, enable unit autorun when the system boots, mount the drive:

    ```bash
    sudo systemctl daemon-reload
    sudo systemctl enable google-drive-ocamlfuse.service
    sudo systemctl start google-drive-ocamlfuse.service
    ```

    For more details see [here](https://github.com/astrada/google-drive-ocamlfuse/wiki/Automounting)

#### <a name="google_drive_check">Check</a>
A file `/etc/mtab` contains records of currently mounted filesystems.
```bash
cat /etc/mtab | grep 'google-drive-ocamlfuse'
```

#### <a name="google_drive_unmount_filesystem">Unmount filesystem</a>
```bash
fusermount -u <mount_point>
```

If you used [systemd](#google_drive_using_systemd) to mount a drive:

```bash
sudo systemctl stop google-drive-ocamlfuse.service
sudo systemctl disable google-drive-ocamlfuse.service
```
