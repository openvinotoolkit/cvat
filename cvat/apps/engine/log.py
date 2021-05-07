# Copyright (C) 2018 Intel Corporation
#
# SPDX-License-Identifier: MIT

import logging
from cvat.settings.base import LOGGING
from .models import Job, Task, Project, CloudStorage

def _get_project(pid):
    try:
        return Project.objects.get(pk=pid)
    except Exception:
        raise Exception('{} key must be a project identifier'.format(pid))

def _get_task(tid):
    try:
        return Task.objects.get(pk=tid)
    except Exception:
        raise Exception('{} key must be a task identifier'.format(tid))

def _get_job(jid):
    try:
        return Job.objects.select_related("segment__task").get(id=jid)
    except Exception:
        raise Exception('{} key must be a job identifier'.format(jid))

def _get_storage(storage_id):
    try:
        return CloudStorage.objects.get(pk=storage_id)
    except Exception:
        raise Exception('{} key must be a cloud storage identifier'.format(storage_id))

class ProjectLoggerStorage:
    def __init__(self):
        self._storage = dict()

    def __getitem__(self, pid):
        """Get ceratain storage object for some project."""
        if pid not in self._storage:
            self._storage[pid] = self._create_project_logger(pid)
        return self._storage[pid]

    def _create_project_logger(self, pid):
        project = _get_project(pid)

        logger = logging.getLogger('cvat.server.project_{}'.format(pid))
        server_file = logging.FileHandler(filename=project.get_log_path())
        formatter = logging.Formatter(LOGGING['formatters']['standard']['format'])
        server_file.setFormatter(formatter)
        logger.addHandler(server_file)

        return logger


class TaskLoggerStorage:
    def __init__(self):
        self._storage = dict()

    def __getitem__(self, tid):
        if tid not in self._storage:
            self._storage[tid] = self._create_task_logger(tid)
        return self._storage[tid]

    def _create_task_logger(self, tid):
        task = _get_task(tid)

        logger = logging.getLogger('cvat.server.task_{}'.format(tid))
        server_file = logging.FileHandler(filename=task.get_log_path())
        formatter = logging.Formatter(LOGGING['formatters']['standard']['format'])
        server_file.setFormatter(formatter)
        logger.addHandler(server_file)

        return logger

class JobLoggerStorage:
    def __init__(self):
        self._storage = dict()

    def __getitem__(self, jid):
        if jid not in self._storage:
            self._storage[jid] = self._get_task_logger(jid)
        return self._storage[jid]

    def _get_task_logger(self, jid):
        job = _get_job(jid)
        return slogger.task[job.segment.task.id]

class CloudSourceLoggerStorage:
    def __init__(self):
        self._storage = dict()

    def __getitem__(self, sid):
        """Get ceratain storage object for some cloud storage."""
        if sid not in self._storage:
            self._storage[sid] = self._create_cloud_storage_logger(sid)
        return self._storage[sid]

    def _create_cloud_storage_logger(self, sid):
        cloud_storage = _get_storage(sid)

        logger = logging.getLogger('cvat.server.cloud_storage_{}'.format(sid))
        server_file = logging.FileHandler(filename=cloud_storage.get_log_path())
        formatter = logging.Formatter(LOGGING['formatters']['standard']['format'])
        server_file.setFormatter(formatter)
        logger.addHandler(server_file)

        return logger

class ProjectClientLoggerStorage:
    def __init__(self):
        self._storage = dict()

    def __getitem__(self, pid):
        """Get logger for exact task by id."""
        if pid not in self._storage:
            self._storage[pid] = self._create_client_logger(pid)
        return self._storage[pid]

    def _create_client_logger(self, pid):
        project = _get_project(pid)
        logger = logging.getLogger('cvat.client.project_{}'.format(pid))
        client_file = logging.FileHandler(filename=project.get_client_log_path())
        logger.addHandler(client_file)

        return logger

class TaskClientLoggerStorage:
    def __init__(self):
        self._storage = dict()

    def __getitem__(self, tid):
        if tid not in self._storage:
            self._storage[tid] = self._create_client_logger(tid)
        return self._storage[tid]

    def _create_client_logger(self, tid):
        task = _get_task(tid)
        logger = logging.getLogger('cvat.client.task_{}'.format(tid))
        client_file = logging.FileHandler(filename=task.get_client_log_path())
        logger.addHandler(client_file)

        return logger

class JobClientLoggerStorage:
    def __init__(self):
        self._storage = dict()

    def __getitem__(self, jid):
        if jid not in self._storage:
            self._storage[jid] = self._get_task_logger(jid)
        return self._storage[jid]

    def _get_task_logger(self, jid):
        job = _get_job(jid)
        return clogger.task[job.segment.task.id]

class dotdict(dict):
    """dot.notation access to dictionary attributes"""
    __getattr__ = dict.get
    __setattr__ = dict.__setitem__
    __delattr__ = dict.__delitem__

clogger = dotdict({
    'project': ProjectClientLoggerStorage(),
    'task': TaskClientLoggerStorage(),
    'job': JobClientLoggerStorage(),
    'glob': logging.getLogger('cvat.client'),
})

slogger = dotdict({
    'project': ProjectLoggerStorage(),
    'task': TaskLoggerStorage(),
    'job': JobLoggerStorage(),
    'cloud_storage': CloudSourceLoggerStorage(),
    'glob': logging.getLogger('cvat.server'),
})
