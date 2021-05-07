import urllib.request, json
import requests
import os.path
from datetime import datetime
from enum import Enum

from cvat.apps.dataset_manager.task import export_task
from cvat.apps.engine.models import Task
from tempfile import TemporaryDirectory
from cvat import __version__ as cvat_version
from django.conf import settings

COCO_FORMAT_NAME = 'COCO 1.0'
ANNOTATIONS_DIR = 'annotations'

class ResourseType(str, Enum):
    COLLECTION = 'collection'
    DATASET = 'dataset'
    FILE = 'file'

    def __str__(self):
        return self.value

class ClowderApi:
    def __init__(self, api_key):
        self.API_KEY = api_key
        self.API_ENDPOINT = settings.CLOWDER_API_ENDPOINT

    def __enter__(self):
        return self

    def __exit__(self, *a):
        del self.API_KEY

    def _clowderrequest(self, path, params=None, headers=None):
        if not hasattr(self, 'API_KEY') or not self.API_KEY: raise PermissionError('Clowder api_key not found')

        if path.startswith('/api/'): path = path[5:]
        # Build URL.
        url_parts = list(urllib.parse.urlparse(self.API_ENDPOINT + path))
        if params and isinstance(params, dict):
            query = urllib.parse.urlencode(params)
            url_parts[4] = query
        url = urllib.parse.urlunparse(url_parts)

        if not headers or not isinstance(headers, dict): headers=dict()
        headers['X-API-Key'] = self.API_KEY

        # Create request including API key in the header.
        return urllib.request.Request(url, headers=headers)

    def _clowderpost(self, path, data, params=None, headers=None):
        req = self._clowderrequest(path, params=params, headers=headers)
        with urllib.request.urlopen(req, data) as response:
            # TODO: try/catch here
            result = response.read().decode()
        return result

    # TODO: make Enum for all possible search params
    def _clowdersearch(self, params):
        with urllib.request.urlopen(self._clowderrequest('search', params=params)) as response:
            if response.code != 200: raise Exception('{}\n{}'.format(response.msg, response.reason))
            search = json.loads(response.read().decode())
            result = search['results']
        # temporary solution - just pull everything
        if search['count'] < search['total_size']:
            params['size'] = search['total_size']
            result = self._clowdersearch(params)
            # !!! Clowder pagination doesn't work properly - batches of files under 2 consequitive search['next'] queries intersect
            # TODO: bug ticket in Clowder
            # result = search['results']
            # while 'next' in search:
            #     with urllib.request.urlopen(self._clowderrequest(search['next'])) as pageresp:
            #         if pageresp.code != 200: raise Exception('{}\n{}'.format(pageresp.msg, pageresp.reason))
            #         search = json.loads(pageresp.read().decode())
            #         result = result + search['results']
        return result

    def _uploadfile(self, filepath, datasetid, contenttype):
        if not hasattr(self, 'API_KEY') or not self.API_KEY: raise PermissionError('Clowder api_key not found')

        url = '{}uploadToDataset/{}'.format(self.API_ENDPOINT, datasetid)
        filename = os.path.basename(filepath)
        payload = {}
        files = [('File', (filename, open(filepath, 'rb'), contenttype))]
        headers = {
            'X-API-Key': self.API_KEY
        }
        response = requests.request('POST', url, headers=headers, data=payload, files=files)
        if response.status_code == 200:
            return json.loads(response.text)
        else:
            raise Exception(response.text)

    def search_datasetbyname(self, name):
        result = self._clowdersearch({'query': name, 'resource_type':ResourseType.DATASET})
        if result and isinstance(result, list):
            return [{'id': x['id'], 'name': x['name']} for x in result]

    def get_all_dataset_folders(self, datasetid):
        with urllib.request.urlopen(self._clowderrequest('datasets/{}/folders'.format(datasetid))) as response:
            # TODO: handle error for nonexisting dataset
            result = json.loads(response.read().decode())
        if result and isinstance(result, list):
            folders = [{'id' : folder['id'], 'path': list(filter(None, folder['name'].split('/')))} for folder in result]
            return folders

    def get_folders(self, datasetid, parentfolderid=None):
        folders = self.get_all_dataset_folders(datasetid)
        if folders:
            if not parentfolderid:
                return [folder for folder in folders if len(folder['path']) == 1]
            else:
                if parentfolderid not in [folder['id'] for folder in folders]:
                    raise ValueError('Folder {} not found in dataset {}.'.format(parentfolderid, datasetid))
                parentpath = list(filter(lambda x: x['id']==parentfolderid, folders))[0]['path']
                return [folder for folder in folders
                    if len(folder['path']) == len(parentpath)+1 and folder['path'][:-1]==parentpath]
        return []

    def make_folder(self, datasetid, foldername, parentfolderid=None):
        if not parentfolderid:
            data = {
                'name': foldername,
                'parentId': datasetid,
                'parentType': 'dataset'
                }
        else:
            data = {
                'name': foldername,
                'parentId': parentfolderid,
                'parentType': 'folder'
                }
        response = self._clowderpost('datasets/{}/newFolder'.format(datasetid),
            headers={'Content-Type': 'application/json; charset=utf-8'},
            data = json.dumps(data).encode("utf-8"))
        # TODO: error handling
        return json.loads(response)['id']

    def move_file(self, fileid, srcdatasetid, dstdatasetid=None, srcfolderid=None, dstfolderid=None):
        # possibly split it to moving between datasets and within dataset
        if not dstdatasetid:
            if dstfolderid:
                if srcfolderid:
                    data = {"folderId": srcfolderid}
                else: data = dict()
                response = self._clowderpost('datasets/{}/moveFile/{}/{}'.format(srcdatasetid, dstfolderid, fileid),
                    headers={'Content-Type': 'application/json; charset=utf-8'},
                    data = json.dumps(data).encode("utf-8"))
                status = json.loads(response)['status']
                if status != 'success': raise Exception(response)
        else:
            # TODO
            pass

    def get_fullcontent(self, data):
        '''
        data contains identifiers of files and/or folders
        return files as is + all files from folder subtrees
        '''
        # TODO: entry['is_file']=='true' is a crutch. Learn how to deserialize incoming data w/o creating ClowderFile instance
        files = [{'clowderid': entry['clowderid'], 'name': entry['name'], 'srcdatasetid': entry['srcdatasetid']}
            for entry in data if entry['is_file']=='true' or isinstance(entry['is_file'], bool) and entry['is_file']]
        folders = [entry for entry in data if entry['is_file']=='false'
            or isinstance(entry['is_file'], bool) and not entry['is_file']]
        datasets = list(set([folder['srcdatasetid'] for folder in folders]))
        for ds_id in datasets:
            remotefolders = self.get_all_dataset_folders(ds_id)
            ds_folders = [folder for folder in folders if folder['srcdatasetid']==ds_id]
            # folders for one dataset
            for folder in ds_folders:
                # find the 1st folder from source data in the list of remote folders
                target_folder = next((rfolder for rfolder in remotefolders if rfolder['id'] == folder['clowderid']), None)
                if not target_folder:
                    raise Exception('Folder {} not found in dataset {}'.format(folder['clowderid'], ds_id))
                target_path = target_folder['path']
                subfolders = [rfolder for rfolder in remotefolders
                    if len(rfolder['path']) >= len(target_path) and rfolder['path'][:len(target_path)]==target_path]
                for subfolder in subfolders:
                    extra_files = self.get_files(ds_id, subfolder['id'])
                    if extra_files:
                        for extra in extra_files:
                            extra['srcdatasetid'] = ds_id
                            del extra['created']
                        files = files + extra_files
        return files

    def get_files(self, datasetid, folderid=None):
        '''
        Get file info from one folder.
        If no folderid provided, get file info from the dataset root
        '''
        # TODO: error handling
        if not folderid:
            with urllib.request.urlopen(self._clowderrequest('datasets/{}/listFiles'.format(datasetid))) as response:
                result = json.loads(response.read().decode())
            if result and isinstance(result, list):
                return [{'clowderid': file['id'], 'name': file['filename'], 'created': file['date-created']}
                    for file in result]
        else:
            result = self._clowdersearch({'resource_type': ResourseType.FILE, 'datasetid': datasetid, 'folderid': folderid})
            if result and isinstance(result, list):
                return [{'clowderid': file['id'], 'name': file['name'], 'created': file['created']}
                    for file in result]
        return []

    def get_fileblob(self, fileid, savepath):
        '''
        Get file by fileid from Clowder and save it on savepath
        '''
        with urllib.request.urlopen(self._clowderrequest('files/' + fileid)) as fp, open(savepath, 'wb') as tfp:
            while True:
                block = fp.read(8192)
                if not block:
                    break
                tfp.write(block)

    def get_clowderuser(self):
        with urllib.request.urlopen(self._clowderrequest('me')) as response:
            if response.code == 200:
                return json.loads(response.read().decode())
            else: raise Exception(response.read().decode())

    def _buildmetadatajson(self, task):
        metadata = dict({'@context': []})
        metadata['@context'].append('https://clowderframework.org/contexts/metadata.jsonld')
        metadata['agent'] = dict({'@type': 'cat:user'})
        user = self.get_clowderuser()
        metadata['agent']['name'] = 'CVAT ({})'.format(user['fullName'])
        metadata['agent']['user_id'] = '{}users/{}'.format(self.API_ENDPOINT, user['id'])

        content = dict()
        content['annotation-format'] = COCO_FORMAT_NAME
        content['annotation-tool'] = 'CVAT {}'.format(cvat_version)
        content['annotation-id'] = task.pk
        content['annotator'] = task.owner.username
        content['timestamp'] = task.created_date.astimezone().replace(microsecond=0).isoformat()

        content['annotated-files'] = []
        for file in task.data.clowder_files.all():
            info = {'annotated-file-id': file.clowderid, 'annotated-file-name': file.name, 'annotated-dataset-id': file.srcdatasetid}
            content['annotated-files'].append(info)

        metadata['content'] = content

        return json.dumps(metadata)

    def update_metadata(self, fileid, metadata):
        headers = {'Content-Type': 'application/json; charset=utf-8', 'Content-Length': len(metadata)}
        metadata = metadata.encode('utf-8')
        response = self._clowderpost('files/{}/metadata.jsonld'.format(fileid), data= metadata, headers=headers)
        if response!='"Metadata successfully added to db"':
            raise Exception(response)

    def load_coco2clowder(self, task_id):
        db_task = Task.objects.get(pk=task_id)
        coconame = 'annotations-coco-cvat-task-{}-{}.zip'.format(task_id, datetime.now().strftime('%Y%m%d%H%M%S'))
        files = [file for file in db_task.data.clowder_files.all()]
        # unique ids
        dataset_ids = list(set([file.srcdatasetid for file in files]))
        with TemporaryDirectory() as tmp_dir:
            dst_path = os.path.join(tmp_dir, coconame)
            export_task(task_id, dst_path, COCO_FORMAT_NAME)
            for ds_id in dataset_ids:
                folders = self.get_folders(ds_id)
                foldernames = [folder['path'][0] for folder in folders]
                if ANNOTATIONS_DIR not in foldernames:
                    annotations_folderid = self.make_folder(ds_id, ANNOTATIONS_DIR)
                else:
                    annotations_folderid = [folder['id'] for folder in (folders)][foldernames.index(ANNOTATIONS_DIR)]
                cocoid = self._uploadfile(dst_path, ds_id, 'application/zip')['id']
                self.move_file(cocoid, srcdatasetid=ds_id, dstfolderid=annotations_folderid)
                self.update_metadata(cocoid, self._buildmetadatajson(db_task))
