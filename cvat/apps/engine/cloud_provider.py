#from dataclasses import dataclass
from abc import ABC, abstractmethod, abstractproperty
from io import BytesIO

import boto3
from boto3.s3.transfer import TransferConfig
from botocore.exceptions import WaiterError
from botocore.handlers import disable_signing

from azure.storage.blob import BlobServiceClient
from azure.core.exceptions import ResourceExistsError
from azure.storage.blob import PublicAccess

from cvat.apps.engine.log import slogger
from cvat.apps.engine.models import CredentialsTypeChoice, CloudProviderChoice

class _CloudStorage(ABC):

    def __init__(self):
        self._files = []

    @abstractproperty
    def name(self):
        pass

    @abstractmethod
    def create(self):
        pass

    @abstractmethod
    def is_exist(self):
        pass

    @abstractmethod
    def initialize_content(self):
        pass

    @abstractmethod
    def download_fileobj(self, key):
        pass

    def download_file(self, key, path):
        file_obj = self.download_fileobj(key)
        if isinstance(file_obj, BytesIO):
            with open(path, 'wb') as f:
                f.write(file_obj.getvalue())
        else:
            raise NotImplementedError("Unsupported type {} was found".format(type(file_obj)))

    @abstractmethod
    def upload_file(self, file_obj, file_name):
        pass

    def __contains__(self, file_name):
        return file_name in (item['name'] for item in self._files)

    def __len__(self):
        return len(self._files)

    @property
    def content(self):
        return list(map(lambda x: x['name'] , self._files))

def get_cloud_storage_instance(cloud_provider, resource, credentials, specific_attributes=None):
    instance = None
    if cloud_provider == CloudProviderChoice.AWS_S3:
        instance = AWS_S3(
            bucket=resource,
            access_key_id=credentials.key,
            secret_key=credentials.secret_key,
            session_token=credentials.session_token,
            region=specific_attributes.get('region', 'us-east-2')
        )
    elif cloud_provider == CloudProviderChoice.AZURE_CONTAINER:
        instance = AzureBlobContainer(
            container=resource,
            account_name=credentials.account_name,
            sas_token=credentials.session_token
        )
    else:
        raise NotImplementedError()
    return instance

class AWS_S3(_CloudStorage):
    waiter_config = {
        'Delay': 5, # The amount of time in seconds to wait between attempts. Default: 5
        'MaxAttempts': 3, # The maximum number of attempts to be made. Default: 20
    }
    transfer_config = {
        'max_io_queue': 10,
    }
    def __init__(self,
                bucket,
                region,
                access_key_id=None,
                secret_key=None,
                session_token=None):
        super().__init__()
        if all([access_key_id, secret_key, session_token]):
            self._client_s3 = boto3.client(
                's3',
                aws_access_key_id=access_key_id,
                aws_secret_access_key=secret_key,
                aws_session_token=session_token,
                region_name=region
            )
        elif any([access_key_id, secret_key, session_token]):
            raise Exception('Insufficient data for authorization')
        self._s3 = boto3.resource('s3')
        # anonymous access
        if not any([access_key_id, secret_key, session_token]):
            self._s3.meta.client.meta.events.register('choose-signer.s3.*', disable_signing)
            self._client_s3 = self._s3.meta.client
        self._bucket = self._s3.Bucket(bucket)
        self.region = region

    @property
    def bucket(self):
        return self._bucket

    @property
    def name(self):
        return self._bucket.name

    def is_exist(self):
        waiter = self._client_s3.get_waiter('bucket_exists')
        try:
            waiter.wait(
                Bucket=self.name,
                WaiterConfig=self.waiter_config
            )
        except WaiterError:
            raise Exception('A resource {} unavailable'.format(self.name))

    def is_object_exist(self, key_object):
        waiter = self._client_s3.get_waiter('object_exists')
        try:
            waiter.wait(
                Bucket=self._bucket,
                Key=key_object,
                WaiterConfig=self.waiter_config
            )
        except WaiterError:
            raise Exception('A file {} unavailable'.format(key_object))

    def upload_file(self, file_obj, file_name):
        self._bucket.upload_fileobj(
            Fileobj=file_obj,
            Key=file_name,
            Config=TransferConfig(max_io_queue=self.transfer_config['max_io_queue'])
        )

    def initialize_content(self):
        files = self._bucket.objects.all()
        self._files = [{
            'name': item.key,
        } for item in files]

    def download_fileobj(self, key):
        buf = BytesIO()
        self.bucket.download_fileobj(
            Key=key,
            Fileobj=buf,
            Config=TransferConfig(max_io_queue=self.transfer_config['max_io_queue'])
        )
        buf.seek(0)
        return buf

    def create(self):
        try:
            responce = self._bucket.create(
                ACL='private',
                CreateBucketConfiguration={
                    'LocationConstraint': self.region,
                },
                ObjectLockEnabledForBucket=False
            )
            slogger.glob.info(
                'Bucket {} has been created on {} region'.format(
                    self.name,
                    responce['Location']
                ))
        except Exception as ex:
            msg = str(ex)
            slogger.glob.info(msg)
            raise Exception(msg)

class AzureBlobContainer(_CloudStorage):
    MAX_CONCURRENCY = 3
    def __init__(self, container, account_name, sas_token=None):
        super().__init__()
        self._account_name = account_name
        if sas_token:
            self._blob_service_client = BlobServiceClient(account_url=self.account_url, credential=sas_token)
        else:
            self._blob_service_client = BlobServiceClient(account_url=self.account_url)
        self._container_client = self._blob_service_client.get_container_client(container)

    @property
    def container(self):
        return self._container_client

    @property
    def name(self):
        return self._container_client.container_name

    @property
    def account_url(self):
        return "{}.blob.core.windows.net".format(self._account_name)

    def create(self):
        try:
            self._container_client.create_container(
               metadata={
                   'type' : 'created by CVAT',
               },
               public_access=PublicAccess.OFF
            )
        except ResourceExistsError:
            msg = f"{self._container_client.container_name} alredy exists"
            slogger.glob.info(msg)
            raise Exception(msg)

    def is_exist(self):
        try:
            self._container_client.create_container()
            self._container_client.delete_container()
            return False
        except ResourceExistsError:
            return True

    def is_object_exist(self, file_name):
        blob_client = self._container_client.get_blob_client(file_name)
        return blob_client.exists()

    def upload_file(self, file_obj, file_name):
        self._container_client.upload_blob(name=file_name, data=file_obj)


    # TODO:
    # def multipart_upload(self, file_obj):
    #     pass

    def initialize_content(self):
        files = self._container_client.list_blobs()
        self._files = [{
            'name': item.name
        } for item in files]

    def download_fileobj(self, key):
        buf = BytesIO()
        storage_stream_downloader = self._container_client.download_blob(
            blob=key,
            offset=None,
            length=None,
        )
        storage_stream_downloader.download_to_stream(buf, max_concurrency=self.MAX_CONCURRENCY)
        buf.seek(0)
        return buf

class GOOGLE_DRIVE(_CloudStorage):
    pass

class Credentials:
    __slots__ = ('key', 'secret_key', 'session_token', 'account_name', 'credentials_type')

    def __init__(self, **credentials):
        self.key = credentials.get('key', '')
        self.secret_key = credentials.get('secret_key', '')
        self.session_token = credentials.get('session_token', '')
        self.account_name = credentials.get('account_name', '')
        self.credentials_type = credentials.get('credentials_type', None)

    def convert_to_db(self):
        converted_credentials = {
            CredentialsTypeChoice.TEMP_KEY_SECRET_KEY_TOKEN_SET : \
                " ".join([self.key, self.secret_key, self.session_token]),
            CredentialsTypeChoice.ACCOUNT_NAME_TOKEN_PAIR : " ".join([self.account_name, self.session_token]),
            CredentialsTypeChoice.ANONYMOUS_ACCESS: "",
        }
        return converted_credentials[self.credentials_type]

    def convert_from_db(self, credentials):
        self.credentials_type = credentials.get('type')
        if self.credentials_type == CredentialsTypeChoice.TEMP_KEY_SECRET_KEY_TOKEN_SET:
            self.key, self.secret_key, self.session_token = credentials.get('value').split()
        elif self.credentials_type == CredentialsTypeChoice.ACCOUNT_NAME_TOKEN_PAIR:
            self.account_name, self.session_token = credentials.get('value').split()
        else:
            self.account_name, self.session_token, self.key, self.secret_key = ('', '', '', '')
            self.credentials_type = None

    def mapping_with_new_values(self, credentials):
        self.credentials_type = credentials.get('credentials_type', self.credentials_type)
        self.key = credentials.get('key', self.key)
        self.secret_key = credentials.get('secret_key', self.secret_key)
        self.session_token = credentials.get('session_token', self.session_token)
        self.account_name = credentials.get('account_name', self.account_name)

    def values(self):
        return [self.key, self.secret_key, self.session_token, self.account_name]
