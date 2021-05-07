# Copyright (C) 2018-2020 Intel Corporation
#
# SPDX-License-Identifier: MIT

import io
import os
import os.path as osp
import shutil
import traceback
from datetime import datetime
from distutils.util import strtobool
from tempfile import mkstemp

import cv2
import django_rq
from django.apps import apps
from django.conf import settings
from django.contrib.auth.models import User
from django.db import IntegrityError
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.decorators import method_decorator
from django_filters import rest_framework as filters
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg import openapi
from drf_yasg.inspectors import CoreAPICompatInspector, NotHandled
from drf_yasg.utils import swagger_auto_schema
from rest_framework import mixins, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import APIException, NotFound, ValidationError
from rest_framework.permissions import SAFE_METHODS, IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from sendfile import sendfile

import cvat.apps.dataset_manager as dm
import cvat.apps.dataset_manager.views  # pylint: disable=unused-import
from cvat.apps.authentication import auth
from cvat.apps.dataset_manager.bindings import CvatImportError
from cvat.apps.dataset_manager.serializers import DatasetFormatsSerializer
from cvat.apps.engine.frame_provider import FrameProvider
from cvat.apps.engine.models import (
    Job, StatusChoice, Task, Project, Review, Issue,
    Comment, StorageMethodChoice, ReviewStatus, StorageChoice, Image
)
from cvat.apps.engine.serializers import (
    AboutSerializer, AnnotationFileSerializer, BasicUserSerializer,
    DataMetaSerializer, DataSerializer, ExceptionSerializer,
    FileInfoSerializer, JobSerializer, LabeledDataSerializer,
    LogEventSerializer, ProjectSerializer, ProjectSearchSerializer, ProjectWithoutTaskSerializer,
    RqStatusSerializer, TaskSerializer, UserSerializer, PluginsSerializer, ReviewSerializer,
    CombinedReviewSerializer, IssueSerializer, CombinedIssueSerializer, CommentSerializer
)
from cvat.apps.engine.utils import av_scan_paths
from . import models, task
from .log import clogger, slogger


class ServerViewSet(viewsets.ViewSet):
    serializer_class = None

    # To get nice documentation about ServerViewSet actions it is necessary
    # to implement the method. By default, ViewSet doesn't provide it.
    def get_serializer(self, *args, **kwargs):
        pass

    @staticmethod
    @swagger_auto_schema(method='get', operation_summary='Method provides basic CVAT information',
        responses={'200': AboutSerializer})
    @action(detail=False, methods=['GET'], serializer_class=AboutSerializer)
    def about(request):
        from cvat import __version__ as cvat_version
        about = {
            "name": "Computer Vision Annotation Tool",
            "version": cvat_version,
            "description": "CVAT is completely re-designed and re-implemented " +
                "version of Video Annotation Tool from Irvine, California " +
                "tool. It is free, online, interactive video and image annotation " +
                "tool for computer vision. It is being used by our team to " +
                "annotate million of objects with different properties. Many UI " +
                "and UX decisions are based on feedbacks from professional data " +
                "annotation team."
        }
        serializer = AboutSerializer(data=about)
        if serializer.is_valid(raise_exception=True):
            return Response(data=serializer.data)

    @staticmethod
    @swagger_auto_schema(method='post', request_body=ExceptionSerializer)
    @action(detail=False, methods=['POST'], serializer_class=ExceptionSerializer)
    def exception(request):
        """
        Saves an exception from a client on the server

        Sends logs to the ELK if it is connected
        """
        serializer = ExceptionSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            additional_info = {
                "username": request.user.username,
                "name": "Send exception",
            }
            message = JSONRenderer().render({**serializer.data, **additional_info}).decode('UTF-8')
            jid = serializer.data.get("job_id")
            tid = serializer.data.get("task_id")
            if jid:
                clogger.job[jid].error(message)
            elif tid:
                clogger.task[tid].error(message)
            else:
                clogger.glob.error(message)

            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @staticmethod
    @swagger_auto_schema(method='post', request_body=LogEventSerializer(many=True))
    @action(detail=False, methods=['POST'], serializer_class=LogEventSerializer)
    def logs(request):
        """
        Saves logs from a client on the server

        Sends logs to the ELK if it is connected
        """
        serializer = LogEventSerializer(many=True, data=request.data)
        if serializer.is_valid(raise_exception=True):
            user = { "username": request.user.username }
            for event in serializer.data:
                message = JSONRenderer().render({**event, **user}).decode('UTF-8')
                jid = event.get("job_id")
                tid = event.get("task_id")
                if jid:
                    clogger.job[jid].info(message)
                elif tid:
                    clogger.task[tid].info(message)
                else:
                    clogger.glob.info(message)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @staticmethod
    @swagger_auto_schema(
        method='get', operation_summary='Returns all files and folders that are on the server along specified path',
        manual_parameters=[openapi.Parameter('directory', openapi.IN_QUERY, type=openapi.TYPE_STRING, description='Directory to browse')],
        responses={'200' : FileInfoSerializer(many=True)}
    )
    @action(detail=False, methods=['GET'], serializer_class=FileInfoSerializer)
    def share(request):
        param = request.query_params.get('directory', '/')
        if param.startswith("/"):
            param = param[1:]
        directory = os.path.abspath(os.path.join(settings.SHARE_ROOT, param))

        if directory.startswith(settings.SHARE_ROOT) and os.path.isdir(directory):
            data = []
            content = os.scandir(directory)
            for entry in content:
                entry_type = None
                if entry.is_file():
                    entry_type = "REG"
                elif entry.is_dir():
                    entry_type = "DIR"

                if entry_type:
                    data.append({"name": entry.name, "type": entry_type})

            serializer = FileInfoSerializer(many=True, data=data)
            if serializer.is_valid(raise_exception=True):
                return Response(serializer.data)
        else:
            return Response("{} is an invalid directory".format(param),
                status=status.HTTP_400_BAD_REQUEST)

    @staticmethod
    @swagger_auto_schema(method='get', operation_summary='Method provides the list of supported annotations formats',
        responses={'200': DatasetFormatsSerializer()})
    @action(detail=False, methods=['GET'], url_path='annotation/formats')
    def annotation_formats(request):
        data = dm.views.get_all_formats()
        return Response(DatasetFormatsSerializer(data).data)

    @staticmethod
    @swagger_auto_schema(method='get', operation_summary='Method provides allowed plugins.',
        responses={'200': PluginsSerializer()})
    @action(detail=False, methods=['GET'], url_path='plugins', serializer_class=PluginsSerializer)
    def plugins(request):
        response = {
            'GIT_INTEGRATION': apps.is_installed('cvat.apps.dataset_repo'),
            'ANALYTICS':       False,
            'MODELS':          False,
            'PREDICT':         apps.is_installed('cvat.apps.training')
        }
        if strtobool(os.environ.get("CVAT_ANALYTICS", '0')):
            response['ANALYTICS'] = True
        if strtobool(os.environ.get("CVAT_SERVERLESS", '0')):
            response['MODELS'] = True
        return Response(response)


class ProjectFilter(filters.FilterSet):
    name = filters.CharFilter(field_name="name", lookup_expr="icontains")
    owner = filters.CharFilter(field_name="owner__username", lookup_expr="icontains")
    status = filters.CharFilter(field_name="status", lookup_expr="icontains")

    class Meta:
        model = models.Project
        fields = ("id", "name", "owner", "status")

@method_decorator(name='list', decorator=swagger_auto_schema(
    operation_summary='Returns a paginated list of projects according to query parameters (12 projects per page)',
    manual_parameters=[
        openapi.Parameter('id', openapi.IN_QUERY, description="A unique number value identifying this project",
            type=openapi.TYPE_NUMBER),
        openapi.Parameter('name', openapi.IN_QUERY, description="Find all projects where name contains a parameter value",
            type=openapi.TYPE_STRING),
        openapi.Parameter('owner', openapi.IN_QUERY, description="Find all project where owner name contains a parameter value",
            type=openapi.TYPE_STRING),
        openapi.Parameter('status', openapi.IN_QUERY, description="Find all projects with a specific status",
            type=openapi.TYPE_STRING, enum=[str(i) for i in StatusChoice]),
        openapi.Parameter('names_only', openapi.IN_QUERY, description="Returns only names and id's of projects.",
            type=openapi.TYPE_BOOLEAN),
        openapi.Parameter('without_tasks', openapi.IN_QUERY, description="Returns only projects entities without related tasks",
            type=openapi.TYPE_BOOLEAN)],))
@method_decorator(name='create', decorator=swagger_auto_schema(operation_summary='Method creates a new project'))
@method_decorator(name='retrieve', decorator=swagger_auto_schema(operation_summary='Method returns details of a specific project'))
@method_decorator(name='destroy', decorator=swagger_auto_schema(operation_summary='Method deletes a specific project'))
@method_decorator(name='partial_update', decorator=swagger_auto_schema(operation_summary='Methods does a partial update of chosen fields in a project'))
class ProjectViewSet(auth.ProjectGetQuerySetMixin, viewsets.ModelViewSet):
    queryset = models.Project.objects.all().order_by('-id')
    search_fields = ("name", "owner__username", "status")
    filterset_class = ProjectFilter
    ordering_fields = ("id", "name", "owner", "status", "assignee")
    http_method_names = ['get', 'post', 'head', 'patch', 'delete']

    def get_serializer_class(self):
        if self.request.query_params and self.request.query_params.get("names_only") == "true":
            return ProjectSearchSerializer
        if self.request.query_params and self.request.query_params.get("without_tasks") == "true":
            return ProjectWithoutTaskSerializer
        else:
            return ProjectSerializer

    def get_permissions(self):
        http_method = self.request.method
        permissions = [IsAuthenticated]

        if http_method in SAFE_METHODS:
            permissions.append(auth.ProjectAccessPermission)
        elif http_method in ["POST"]:
            permissions.append(auth.ProjectCreatePermission)
        elif http_method in ["PATCH"]:
            permissions.append(auth.ProjectChangePermission)
        elif http_method in ["DELETE"]:
            permissions.append(auth.ProjectDeletePermission)
        else:
            permissions.append(auth.AdminRolePermission)

        return [perm() for perm in permissions]

    def perform_create(self, serializer):
        def validate_project_limit(owner):
            admin_perm = auth.AdminRolePermission()
            is_admin = admin_perm.has_permission(self.request, self)
            if not is_admin and settings.RESTRICTIONS['project_limit'] is not None and \
                Project.objects.filter(owner=owner).count() >= settings.RESTRICTIONS['project_limit']:
                raise serializers.ValidationError('The user has the maximum number of projects')

        owner = self.request.data.get('owner', None)
        if owner:
            validate_project_limit(owner)
            serializer.save()
        else:
            validate_project_limit(self.request.user)
            serializer.save(owner=self.request.user)

    @swagger_auto_schema(method='get', operation_summary='Returns information of the tasks of the project with the selected id',
        responses={'200': TaskSerializer(many=True)})
    @action(detail=True, methods=['GET'], serializer_class=TaskSerializer)
    def tasks(self, request, pk):
        self.get_object() # force to call check_object_permissions
        queryset = Task.objects.filter(project_id=pk).order_by('-id')
        queryset = auth.filter_task_queryset(queryset, request.user)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True,
                context={"request": request})
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True,
            context={"request": request})
        return Response(serializer.data)


class TaskFilter(filters.FilterSet):
    project = filters.CharFilter(field_name="project__name", lookup_expr="icontains")
    name = filters.CharFilter(field_name="name", lookup_expr="icontains")
    owner = filters.CharFilter(field_name="owner__username", lookup_expr="icontains")
    mode = filters.CharFilter(field_name="mode", lookup_expr="icontains")
    status = filters.CharFilter(field_name="status", lookup_expr="icontains")
    assignee = filters.CharFilter(field_name="assignee__username", lookup_expr="icontains")

    class Meta:
        model = Task
        fields = ("id", "project_id", "project", "name", "owner", "mode", "status",
            "assignee")

class DjangoFilterInspector(CoreAPICompatInspector):
    def get_filter_parameters(self, filter_backend):
        if isinstance(filter_backend, DjangoFilterBackend):
            result = super(DjangoFilterInspector, self).get_filter_parameters(filter_backend)
            res = result.copy()

            for param in result:
                if param.get('name') == 'project_id' or param.get('name') == 'project':
                    res.remove(param)
            return res

        return NotHandled

@method_decorator(name='list', decorator=swagger_auto_schema(
    operation_summary='Returns a paginated list of tasks according to query parameters (10 tasks per page)',
    manual_parameters=[
            openapi.Parameter('id',openapi.IN_QUERY,description="A unique number value identifying this task",type=openapi.TYPE_NUMBER),
            openapi.Parameter('name', openapi.IN_QUERY, description="Find all tasks where name contains a parameter value", type=openapi.TYPE_STRING),
            openapi.Parameter('owner', openapi.IN_QUERY, description="Find all tasks where owner name contains a parameter value", type=openapi.TYPE_STRING),
            openapi.Parameter('mode', openapi.IN_QUERY, description="Find all tasks with a specific mode", type=openapi.TYPE_STRING, enum=['annotation', 'interpolation']),
            openapi.Parameter('status', openapi.IN_QUERY, description="Find all tasks with a specific status", type=openapi.TYPE_STRING,enum=['annotation','validation','completed']),
            openapi.Parameter('assignee', openapi.IN_QUERY, description="Find all tasks where assignee name contains a parameter value", type=openapi.TYPE_STRING)
        ],
    filter_inspectors=[DjangoFilterInspector]))
@method_decorator(name='create', decorator=swagger_auto_schema(operation_summary='Method creates a new task in a database without any attached images and videos'))
@method_decorator(name='retrieve', decorator=swagger_auto_schema(operation_summary='Method returns details of a specific task'))
@method_decorator(name='update', decorator=swagger_auto_schema(operation_summary='Method updates a task by id'))
@method_decorator(name='destroy', decorator=swagger_auto_schema(operation_summary='Method deletes a specific task, all attached jobs, annotations, and data'))
@method_decorator(name='partial_update', decorator=swagger_auto_schema(operation_summary='Methods does a partial update of chosen fields in a task'))
class TaskViewSet(auth.TaskGetQuerySetMixin, viewsets.ModelViewSet):
    queryset = Task.objects.all().prefetch_related(
            "label_set__attributespec_set",
            "segment_set__job_set",
        ).order_by('-id')
    serializer_class = TaskSerializer
    search_fields = ("name", "owner__username", "mode", "status")
    filterset_class = TaskFilter
    ordering_fields = ("id", "name", "owner", "status", "assignee")

    def get_permissions(self):
        http_method = self.request.method
        permissions = [IsAuthenticated]

        if http_method in SAFE_METHODS:
            permissions.append(auth.TaskAccessPermission)
        elif http_method in ["POST"]:
            permissions.append(auth.TaskCreatePermission)
        elif self.action == 'annotations' or http_method in ["PATCH", "PUT"]:
            permissions.append(auth.TaskChangePermission)
        elif http_method in ["DELETE"]:
            permissions.append(auth.TaskDeletePermission)
        else:
            permissions.append(auth.AdminRolePermission)

        return [perm() for perm in permissions]

    def perform_create(self, serializer):
        def validate_task_limit(owner):
            admin_perm = auth.AdminRolePermission()
            is_admin = admin_perm.has_permission(self.request, self)
            if not is_admin and settings.RESTRICTIONS['task_limit'] is not None and \
                Task.objects.filter(owner=owner).count() >= settings.RESTRICTIONS['task_limit']:
                raise serializers.ValidationError('The user has the maximum number of tasks')

        owner = self.request.data.get('owner', None)
        if owner:
            validate_task_limit(owner)
            serializer.save()
        else:
            validate_task_limit(self.request.user)
            serializer.save(owner=self.request.user)

    def perform_destroy(self, instance):
        task_dirname = instance.get_task_dirname()
        super().perform_destroy(instance)
        shutil.rmtree(task_dirname, ignore_errors=True)
        if instance.data and not instance.data.tasks.all():
            shutil.rmtree(instance.data.get_data_dirname(), ignore_errors=True)
            instance.data.delete()

    @swagger_auto_schema(method='get', operation_summary='Returns a list of jobs for a specific task',
        responses={'200': JobSerializer(many=True)})
    @action(detail=True, methods=['GET'], serializer_class=JobSerializer)
    def jobs(self, request, pk):
        self.get_object() # force to call check_object_permissions
        queryset = Job.objects.filter(segment__task_id=pk)
        serializer = JobSerializer(queryset, many=True,
            context={"request": request})

        return Response(serializer.data)

    @swagger_auto_schema(method='post', operation_summary='Method permanently attaches images or video to a task',
        request_body=DataSerializer,
    )
    @swagger_auto_schema(method='get', operation_summary='Method returns data for a specific task',
        manual_parameters=[
            openapi.Parameter('type', in_=openapi.IN_QUERY, required=True, type=openapi.TYPE_STRING,
                enum=['chunk', 'frame', 'preview', 'context_image'],
                description="Specifies the type of the requested data"),
            openapi.Parameter('quality', in_=openapi.IN_QUERY, required=True, type=openapi.TYPE_STRING,
                enum=['compressed', 'original'],
                description="Specifies the quality level of the requested data, doesn't matter for 'preview' type"),
            openapi.Parameter('number', in_=openapi.IN_QUERY, required=True, type=openapi.TYPE_NUMBER,
                description="A unique number value identifying chunk or frame, doesn't matter for 'preview' type"),
            ]
    )
    @action(detail=True, methods=['POST', 'GET'])
    def data(self, request, pk):
        if request.method == 'POST':
            db_task = self.get_object() # call check_object_permissions as well
            serializer = DataSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            db_data = serializer.save()
            db_task.data = db_data
            db_task.save()
            data = {k:v for k, v in serializer.data.items()}
            data['use_zip_chunks'] = serializer.validated_data['use_zip_chunks']
            data['use_cache'] = serializer.validated_data['use_cache']
            data['copy_data'] = serializer.validated_data['copy_data']
            if data['use_cache']:
                db_task.data.storage_method = StorageMethodChoice.CACHE
                db_task.data.save(update_fields=['storage_method'])
            if data['server_files'] and data.get('copy_data') == False:
                db_task.data.storage = StorageChoice.SHARE
                db_task.data.save(update_fields=['storage'])
            # if the value of stop_frame is 0, then inside the function we cannot know
            # the value specified by the user or it's default value from the database
            if 'stop_frame' not in serializer.validated_data:
                data['stop_frame'] = None
            task.create(db_task.id, data)
            return Response(serializer.data, status=status.HTTP_202_ACCEPTED)
        else:
            data_type = request.query_params.get('type', None)
            data_id = request.query_params.get('number', None)
            data_quality = request.query_params.get('quality', 'compressed')

            possible_data_type_values = ('chunk', 'frame', 'preview', 'context_image')
            possible_quality_values = ('compressed', 'original')

            try:
                if not data_type or data_type not in possible_data_type_values:
                    raise ValidationError(detail='Data type not specified or has wrong value')
                elif data_type == 'chunk' or data_type == 'frame':
                    if not data_id:
                        raise ValidationError(detail='Number is not specified')
                    elif data_quality not in possible_quality_values:
                        raise ValidationError(detail='Wrong quality value')

                db_task = self.get_object()
                db_data = db_task.data
                if not db_data:
                    raise NotFound(detail='Cannot find requested data for the task')

                frame_provider = FrameProvider(db_task.data, db_task.dimension)

                if data_type == 'chunk':
                    data_id = int(data_id)

                    data_quality = FrameProvider.Quality.COMPRESSED \
                        if data_quality == 'compressed' else FrameProvider.Quality.ORIGINAL

                    #TODO: av.FFmpegError processing
                    if settings.USE_CACHE and db_data.storage_method == StorageMethodChoice.CACHE:
                        buff, mime_type = frame_provider.get_chunk(data_id, data_quality)
                        return HttpResponse(buff.getvalue(), content_type=mime_type)

                    # Follow symbol links if the chunk is a link on a real image otherwise
                    # mimetype detection inside sendfile will work incorrectly.
                    path = os.path.realpath(frame_provider.get_chunk(data_id, data_quality))
                    return sendfile(request, path)

                elif data_type == 'frame':
                    data_id = int(data_id)
                    data_quality = FrameProvider.Quality.COMPRESSED \
                        if data_quality == 'compressed' else FrameProvider.Quality.ORIGINAL
                    buf, mime = frame_provider.get_frame(data_id, data_quality)

                    return HttpResponse(buf.getvalue(), content_type=mime)

                elif data_type == 'preview':
                    return sendfile(request, frame_provider.get_preview())

                elif data_type == 'context_image':
                    data_id = int(data_id)
                    image = Image.objects.get(data_id=db_data.id, frame=data_id)
                    for i in image.related_files.all():
                        path = os.path.realpath(str(i.path))
                        image = cv2.imread(path)
                        success, result = cv2.imencode('.JPEG', image)
                        if not success:
                            raise Exception('Failed to encode image to ".jpeg" format')
                        return HttpResponse(io.BytesIO(result.tobytes()), content_type='image/jpeg')
                    return Response(data='No context image related to the frame',
                                    status=status.HTTP_404_NOT_FOUND)
                else:
                    return Response(data='unknown data type {}.'.format(data_type), status=status.HTTP_400_BAD_REQUEST)
            except APIException as e:
                return Response(data=e.get_full_details(), status=e.status_code)
            except FileNotFoundError as ex:
                msg = f"{ex.strerror} {ex.filename}"
                slogger.task[pk].error(msg, exc_info=True)
                return Response(data=msg, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                msg = 'cannot get requested data type: {}, number: {}, quality: {}'.format(data_type, data_id, data_quality)
                slogger.task[pk].error(msg, exc_info=True)
                return Response(data=msg + '\n' + str(e), status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(method='get', operation_summary='Method allows to download task annotations',
        manual_parameters=[
            openapi.Parameter('format', openapi.IN_QUERY,
                description="Desired output format name\nYou can get the list of supported formats at:\n/server/annotation/formats",
                type=openapi.TYPE_STRING, required=False),
            openapi.Parameter('filename', openapi.IN_QUERY,
                description="Desired output file name",
                type=openapi.TYPE_STRING, required=False),
            openapi.Parameter('action', in_=openapi.IN_QUERY,
                description='Used to start downloading process after annotation file had been created',
                type=openapi.TYPE_STRING, required=False, enum=['download'])
        ],
        responses={
            '202': openapi.Response(description='Dump of annotations has been started'),
            '201': openapi.Response(description='Annotations file is ready to download'),
            '200': openapi.Response(description='Download of file started'),
            '405': openapi.Response(description='Format is not available'),
        }
    )
    @swagger_auto_schema(method='put', operation_summary='Method allows to upload task annotations',
        manual_parameters=[
            openapi.Parameter('format', openapi.IN_QUERY,
                description="Input format name\nYou can get the list of supported formats at:\n/server/annotation/formats",
                type=openapi.TYPE_STRING, required=False),
        ],
        responses={
            '202': openapi.Response(description='Uploading has been started'),
            '201': openapi.Response(description='Uploading has finished'),
            '405': openapi.Response(description='Format is not available'),
        }
    )
    @swagger_auto_schema(method='patch', operation_summary='Method performs a partial update of annotations in a specific task',
        manual_parameters=[openapi.Parameter('action', in_=openapi.IN_QUERY, required=True, type=openapi.TYPE_STRING,
            enum=['create', 'update', 'delete'])])
    @swagger_auto_schema(method='delete', operation_summary='Method deletes all annotations for a specific task')
    @action(detail=True, methods=['GET', 'DELETE', 'PUT', 'PATCH'],
        serializer_class=LabeledDataSerializer)
    def annotations(self, request, pk):
        db_task = self.get_object() # force to call check_object_permissions
        if request.method == 'GET':
            format_name = request.query_params.get('format')
            if format_name:
                return _export_annotations(db_task=db_task,
                    rq_id="/api/v1/tasks/{}/annotations/{}".format(pk, format_name),
                    request=request,
                    action=request.query_params.get("action", "").lower(),
                    callback=dm.views.export_task_annotations,
                    format_name=format_name,
                    filename=request.query_params.get("filename", "").lower(),
                )
            else:
                data = dm.task.get_task_data(pk)
                serializer = LabeledDataSerializer(data=data)
                if serializer.is_valid(raise_exception=True):
                    return Response(serializer.data)
        elif request.method == 'PUT':
            format_name = request.query_params.get('format')
            if format_name:
                return _import_annotations(
                    request=request,
                    rq_id="{}@/api/v1/tasks/{}/annotations/upload".format(request.user, pk),
                    rq_func=dm.task.import_task_annotations,
                    pk=pk,
                    format_name=format_name,
                )
            else:
                serializer = LabeledDataSerializer(data=request.data)
                if serializer.is_valid(raise_exception=True):
                    data = dm.task.put_task_data(pk, serializer.data)
                    return Response(data)
        elif request.method == 'DELETE':
            dm.task.delete_task_data(pk)
            return Response(status=status.HTTP_204_NO_CONTENT)
        elif request.method == 'PATCH':
            action = self.request.query_params.get("action", None)
            if action not in dm.task.PatchAction.values():
                raise serializers.ValidationError(
                    "Please specify a correct 'action' for the request")
            serializer = LabeledDataSerializer(data=request.data)
            if serializer.is_valid(raise_exception=True):
                try:
                    data = dm.task.patch_task_data(pk, serializer.data, action)
                except (AttributeError, IntegrityError) as e:
                    return Response(data=str(e), status=status.HTTP_400_BAD_REQUEST)
                return Response(data)

    @swagger_auto_schema(method='get', operation_summary='When task is being created the method returns information about a status of the creation process')
    @action(detail=True, methods=['GET'], serializer_class=RqStatusSerializer)
    def status(self, request, pk):
        self.get_object() # force to call check_object_permissions
        response = self._get_rq_response(queue="default",
            job_id="/api/{}/tasks/{}".format(request.version, pk))
        serializer = RqStatusSerializer(data=response)

        if serializer.is_valid(raise_exception=True):
            return Response(serializer.data)

    @staticmethod
    def _get_rq_response(queue, job_id):
        queue = django_rq.get_queue(queue)
        job = queue.fetch_job(job_id)
        response = {}
        if job is None or job.is_finished:
            response = { "state": "Finished" }
        elif job.is_queued:
            response = { "state": "Queued" }
        elif job.is_failed:
            response = { "state": "Failed", "message": job.exc_info }
        else:
            response = { "state": "Started" }
            if 'status' in job.meta:
                response['message'] = job.meta['status']

        return response

    @staticmethod
    @swagger_auto_schema(method='get', operation_summary='Method provides a meta information about media files which are related with the task',
        responses={'200': DataMetaSerializer()})
    @action(detail=True, methods=['GET'], serializer_class=DataMetaSerializer,
        url_path='data/meta')
    def data_info(request, pk):
        db_task = models.Task.objects.prefetch_related('data__images__related_files').select_related('data__video').get(pk=pk)

        if hasattr(db_task.data, 'video'):
            media = [db_task.data.video]
        else:
            media = list(db_task.data.images.order_by('frame'))

        frame_meta = [{
            'width': item.width,
            'height': item.height,
            'name': item.path,
            'has_related_context': hasattr(item, 'related_files') and bool(len(item.related_files.all()))
        } for item in media]

        db_data = db_task.data
        db_data.frames = frame_meta

        serializer = DataMetaSerializer(db_data)
        return Response(serializer.data)

    @swagger_auto_schema(method='get', operation_summary='Export task as a dataset in a specific format',
        manual_parameters=[
            openapi.Parameter('format', openapi.IN_QUERY,
                description="Desired output format name\nYou can get the list of supported formats at:\n/server/annotation/formats",
                type=openapi.TYPE_STRING, required=True),
            openapi.Parameter('filename', openapi.IN_QUERY,
                description="Desired output file name",
                type=openapi.TYPE_STRING, required=False),
            openapi.Parameter('action', in_=openapi.IN_QUERY,
                description='Used to start downloading process after annotation file had been created',
                type=openapi.TYPE_STRING, required=False, enum=['download'])
        ],
        responses={'202': openapi.Response(description='Exporting has been started'),
            '201': openapi.Response(description='Output file is ready for downloading'),
            '200': openapi.Response(description='Download of file started'),
            '405': openapi.Response(description='Format is not available'),
        }
    )
    @action(detail=True, methods=['GET'], serializer_class=None,
        url_path='dataset')
    def dataset_export(self, request, pk):
        db_task = self.get_object() # force to call check_object_permissions

        format_name = request.query_params.get("format", "")
        return _export_annotations(db_task=db_task,
            rq_id="/api/v1/tasks/{}/dataset/{}".format(pk, format_name),
            request=request,
            action=request.query_params.get("action", "").lower(),
            callback=dm.views.export_task_as_dataset,
            format_name=format_name,
            filename=request.query_params.get("filename", "").lower(),
        )

@method_decorator(name='retrieve', decorator=swagger_auto_schema(operation_summary='Method returns details of a job'))
@method_decorator(name='update', decorator=swagger_auto_schema(operation_summary='Method updates a job by id'))
@method_decorator(name='partial_update', decorator=swagger_auto_schema(
    operation_summary='Methods does a partial update of chosen fields in a job'))
class JobViewSet(viewsets.GenericViewSet,
    mixins.RetrieveModelMixin, mixins.UpdateModelMixin):
    queryset = Job.objects.all().order_by('id')
    serializer_class = JobSerializer

    def get_permissions(self):
        http_method = self.request.method
        permissions = [IsAuthenticated]

        if http_method in SAFE_METHODS:
            permissions.append(auth.JobAccessPermission)
        elif http_method in ['PATCH', 'PUT', 'DELETE']:
            permissions.append(auth.JobChangePermission)
        else:
            permissions.append(auth.AdminRolePermission)

        return [perm() for perm in permissions]

    @swagger_auto_schema(method='get', operation_summary='Method returns annotations for a specific job')
    @swagger_auto_schema(method='put', operation_summary='Method performs an update of all annotations in a specific job')
    @swagger_auto_schema(method='patch', manual_parameters=[
        openapi.Parameter('action', in_=openapi.IN_QUERY, type=openapi.TYPE_STRING, required=True,
            enum=['create', 'update', 'delete'])],
            operation_summary='Method performs a partial update of annotations in a specific job')
    @swagger_auto_schema(method='delete', operation_summary='Method deletes all annotations for a specific job')
    @action(detail=True, methods=['GET', 'DELETE', 'PUT', 'PATCH'],
        serializer_class=LabeledDataSerializer)
    def annotations(self, request, pk):
        self.get_object() # force to call check_object_permissions
        if request.method == 'GET':
            data = dm.task.get_job_data(pk)
            return Response(data)
        elif request.method == 'PUT':
            format_name = request.query_params.get("format", "")
            if format_name:
                return _import_annotations(
                    request=request,
                    rq_id="{}@/api/v1/jobs/{}/annotations/upload".format(request.user, pk),
                    rq_func=dm.task.import_job_annotations,
                    pk=pk,
                    format_name=format_name
                )
            else:
                serializer = LabeledDataSerializer(data=request.data)
                if serializer.is_valid(raise_exception=True):
                    try:
                        data = dm.task.put_job_data(pk, serializer.data)
                    except (AttributeError, IntegrityError) as e:
                        return Response(data=str(e), status=status.HTTP_400_BAD_REQUEST)
                    return Response(data)
        elif request.method == 'DELETE':
            dm.task.delete_job_data(pk)
            return Response(status=status.HTTP_204_NO_CONTENT)
        elif request.method == 'PATCH':
            action = self.request.query_params.get("action", None)
            if action not in dm.task.PatchAction.values():
                raise serializers.ValidationError(
                    "Please specify a correct 'action' for the request")
            serializer = LabeledDataSerializer(data=request.data)
            if serializer.is_valid(raise_exception=True):
                try:
                    data = dm.task.patch_job_data(pk, serializer.data, action)
                except (AttributeError, IntegrityError) as e:
                    return Response(data=str(e), status=status.HTTP_400_BAD_REQUEST)
                return Response(data)

    @swagger_auto_schema(method='get', operation_summary='Method returns list of reviews for the job',
        responses={'200': ReviewSerializer(many=True)}
    )
    @action(detail=True, methods=['GET'], serializer_class=ReviewSerializer)
    def reviews(self, request, pk):
        db_job = self.get_object()
        queryset = db_job.review_set
        serializer = ReviewSerializer(queryset, context={'request': request}, many=True)
        return Response(serializer.data)

    @swagger_auto_schema(method='get', operation_summary='Method returns list of issues for the job',
        responses={'200': CombinedIssueSerializer(many=True)}
    )
    @action(detail=True, methods=['GET'], serializer_class=CombinedIssueSerializer)
    def issues(self, request, pk):
        db_job = self.get_object()
        queryset = db_job.issue_set
        serializer = CombinedIssueSerializer(queryset, context={'request': request}, many=True)
        return Response(serializer.data)

@method_decorator(name='create', decorator=swagger_auto_schema(operation_summary='Submit a review for a job'))
@method_decorator(name='destroy', decorator=swagger_auto_schema(operation_summary='Method removes a review from a job'))
class ReviewViewSet(viewsets.GenericViewSet, mixins.DestroyModelMixin, mixins.CreateModelMixin):
    queryset = Review.objects.all().order_by('id')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CombinedReviewSerializer
        else:
            return ReviewSerializer

    def get_permissions(self):
        permissions = [IsAuthenticated]
        if self.request.method == 'POST':
            permissions.append(auth.JobReviewPermission)
        else:
            permissions.append(auth.AdminRolePermission)

        return [perm() for perm in permissions]

    def create(self, request, *args, **kwargs):
        job_id = request.data['job']
        db_job = get_object_or_404(Job, pk=job_id)
        self.check_object_permissions(self.request, db_job)

        if request.data['status'] == ReviewStatus.REVIEW_FURTHER:
            if 'reviewer_id' not in request.data:
                return Response('Must provide a new reviewer', status=status.HTTP_400_BAD_REQUEST)
            reviewer_id = request.data['reviewer_id']
            reviewer = get_object_or_404(User, pk=reviewer_id)

        request.data.update({
            'reviewer_id': request.user.id,
        })
        if db_job.assignee:
            request.data.update({
                'assignee_id': db_job.assignee.id,
            })

        issue_set = request.data['issue_set']
        for issue in issue_set:
            issue['job'] = db_job.id
            issue['owner_id'] = request.user.id
            comment_set = issue['comment_set']
            for comment in comment_set:
                comment['author_id'] = request.user.id

        serializer = self.get_serializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)

        if serializer.data['status'] == ReviewStatus.ACCEPTED:
            db_job.status = StatusChoice.COMPLETED
            db_job.save()
        elif serializer.data['status'] == ReviewStatus.REJECTED:
            db_job.status = StatusChoice.ANNOTATION
            db_job.save()
        else:
            db_job.reviewer = reviewer
            db_job.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

@method_decorator(name='destroy', decorator=swagger_auto_schema(operation_summary='Method removes an issue from a job'))
@method_decorator(name='partial_update', decorator=swagger_auto_schema(operation_summary='Method updates an issue. It is used to resolve/reopen an issue'))
class IssueViewSet(viewsets.GenericViewSet,  mixins.DestroyModelMixin, mixins.UpdateModelMixin):
    queryset = Issue.objects.all().order_by('id')
    http_method_names = ['get', 'patch', 'delete', 'options']

    def get_serializer_class(self):
        return IssueSerializer

    def partial_update(self, request, *args, **kwargs):
        db_issue = self.get_object()
        if 'resolver_id' in request.data and request.data['resolver_id'] and db_issue.resolver is None:
            # resolve
            db_issue.resolver = request.user
            db_issue.resolved_date = datetime.now()
            db_issue.save(update_fields=['resolver', 'resolved_date'])
        elif 'resolver_id' in request.data and not request.data['resolver_id'] and db_issue.resolver is not None:
            # reopen
            db_issue.resolver = None
            db_issue.resolved_date = None
            db_issue.save(update_fields=['resolver', 'resolved_date'])
        serializer = self.get_serializer(db_issue)
        return Response(serializer.data)

    def get_permissions(self):
        http_method = self.request.method
        permissions = [IsAuthenticated]

        if http_method in SAFE_METHODS:
            permissions.append(auth.IssueAccessPermission)
        elif http_method in ['DELETE']:
            permissions.append(auth.IssueDestroyPermission)
        elif http_method in ['PATCH']:
            permissions.append(auth.IssueChangePermission)
        else:
            permissions.append(auth.AdminRolePermission)

        return [perm() for perm in permissions]

    @swagger_auto_schema(method='get', operation_summary='The action returns all comments of a specific issue',
        responses={'200': CommentSerializer(many=True)}
    )
    @action(detail=True, methods=['GET'], serializer_class=CommentSerializer)
    def comments(self, request, pk):
        db_issue = self.get_object()
        queryset = db_issue.comment_set
        serializer = CommentSerializer(queryset, context={'request': request}, many=True)
        return Response(serializer.data)

@method_decorator(name='partial_update', decorator=swagger_auto_schema(operation_summary='Method updates comment in an issue'))
@method_decorator(name='destroy', decorator=swagger_auto_schema(operation_summary='Method removes a comment from an issue'))
class CommentViewSet(viewsets.GenericViewSet,
    mixins.DestroyModelMixin, mixins.UpdateModelMixin, mixins.CreateModelMixin):
    queryset = Comment.objects.all().order_by('id')
    serializer_class = CommentSerializer
    http_method_names = ['get', 'post', 'patch', 'delete', 'options']

    def create(self, request, *args, **kwargs):
        request.data.update({
            'author_id': request.user.id,
        })
        issue_id = request.data['issue']
        db_issue = get_object_or_404(Issue, pk=issue_id)
        self.check_object_permissions(self.request, db_issue.job)
        return super().create(request, args, kwargs)

    def get_permissions(self):
        http_method = self.request.method
        permissions = [IsAuthenticated]

        if http_method in ['PATCH', 'DELETE']:
            permissions.append(auth.CommentChangePermission)
        elif http_method in ['POST']:
            permissions.append(auth.CommentCreatePermission)
        else:
            permissions.append(auth.AdminRolePermission)

        return [perm() for perm in permissions]

class UserFilter(filters.FilterSet):
    class Meta:
        model = User
        fields = ("id",)

@method_decorator(name='list', decorator=swagger_auto_schema(
    manual_parameters=[
            openapi.Parameter('id',openapi.IN_QUERY,description="A unique number value identifying this user",type=openapi.TYPE_NUMBER),
    ],
    operation_summary='Method provides a paginated list of users registered on the server'))
@method_decorator(name='retrieve', decorator=swagger_auto_schema(
    operation_summary='Method provides information of a specific user'))
@method_decorator(name='partial_update', decorator=swagger_auto_schema(
    operation_summary='Method updates chosen fields of a user'))
@method_decorator(name='destroy', decorator=swagger_auto_schema(
    operation_summary='Method deletes a specific user from the server'))
class UserViewSet(viewsets.GenericViewSet, mixins.ListModelMixin,
    mixins.RetrieveModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin):
    queryset = User.objects.prefetch_related('groups').all().order_by('id')
    http_method_names = ['get', 'post', 'head', 'patch', 'delete']
    search_fields = ('username', 'first_name', 'last_name')
    filterset_class = UserFilter

    def get_serializer_class(self):
        user = self.request.user
        if user.is_staff:
            return UserSerializer
        else:
            is_self = int(self.kwargs.get("pk", 0)) == user.id or \
                self.action == "self"
            if is_self and self.request.method in SAFE_METHODS:
                return UserSerializer
            else:
                return BasicUserSerializer

    def get_permissions(self):
        permissions = [IsAuthenticated]
        user = self.request.user

        if not self.request.method in SAFE_METHODS:
            is_self = int(self.kwargs.get("pk", 0)) == user.id
            if not is_self:
                permissions.append(auth.AdminRolePermission)

        return [perm() for perm in permissions]

    @swagger_auto_schema(method='get', operation_summary='Method returns an instance of a user who is currently authorized')
    @action(detail=False, methods=['GET'])
    def self(self, request):
        """
        Method returns an instance of a user who is currently authorized
        """
        serializer_class = self.get_serializer_class()
        serializer = serializer_class(request.user, context={ "request": request })
        return Response(serializer.data)

def rq_handler(job, exc_type, exc_value, tb):
    job.exc_info = "".join(
        traceback.format_exception_only(exc_type, exc_value))
    job.save()
    if "tasks" in job.id.split("/"):
        return task.rq_handler(job, exc_type, exc_value, tb)

    return True

# TODO: Method should be reimplemented as a separated view
# @swagger_auto_schema(method='put', manual_parameters=[openapi.Parameter('format', in_=openapi.IN_QUERY,
#         description='A name of a loader\nYou can get annotation loaders from this API:\n/server/annotation/formats',
#         required=True, type=openapi.TYPE_STRING)],
#     operation_summary='Method allows to upload annotations',
#     responses={'202': openapi.Response(description='Load of annotations has been started'),
#         '201': openapi.Response(description='Annotations have been uploaded')},
#     tags=['tasks'])
# @api_view(['PUT'])
def _import_annotations(request, rq_id, rq_func, pk, format_name):
    format_desc = {f.DISPLAY_NAME: f
        for f in dm.views.get_import_formats()}.get(format_name)
    if format_desc is None:
        raise serializers.ValidationError(
            "Unknown input format '{}'".format(format_name))
    elif not format_desc.ENABLED:
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    queue = django_rq.get_queue("default")
    rq_job = queue.fetch_job(rq_id)

    if not rq_job:
        serializer = AnnotationFileSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            anno_file = serializer.validated_data['annotation_file']
            fd, filename = mkstemp(prefix='cvat_{}'.format(pk))
            with open(filename, 'wb+') as f:
                for chunk in anno_file.chunks():
                    f.write(chunk)

            av_scan_paths(filename)
            rq_job = queue.enqueue_call(
                func=rq_func,
                args=(pk, filename, format_name),
                job_id=rq_id
            )
            rq_job.meta['tmp_file'] = filename
            rq_job.meta['tmp_file_descriptor'] = fd
            rq_job.save_meta()
    else:
        if rq_job.is_finished:
            os.close(rq_job.meta['tmp_file_descriptor'])
            os.remove(rq_job.meta['tmp_file'])
            rq_job.delete()
            return Response(status=status.HTTP_201_CREATED)
        elif rq_job.is_failed:
            os.close(rq_job.meta['tmp_file_descriptor'])
            os.remove(rq_job.meta['tmp_file'])
            exc_info = str(rq_job.exc_info)
            rq_job.delete()

            # RQ adds a prefix with exception class name
            import_error_prefix = '{}.{}'.format(
                CvatImportError.__module__, CvatImportError.__name__)
            if exc_info.startswith(import_error_prefix):
                exc_info = exc_info.replace(import_error_prefix + ': ', '')
                return Response(data=exc_info,
                    status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response(data=exc_info,
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response(status=status.HTTP_202_ACCEPTED)

def _export_annotations(db_task, rq_id, request, format_name, action, callback, filename):
    if action not in {"", "download"}:
        raise serializers.ValidationError(
            "Unexpected action specified for the request")

    format_desc = {f.DISPLAY_NAME: f
        for f in dm.views.get_export_formats()}.get(format_name)
    if format_desc is None:
        raise serializers.ValidationError(
            "Unknown format specified for the request")
    elif not format_desc.ENABLED:
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    queue = django_rq.get_queue("default")

    rq_job = queue.fetch_job(rq_id)
    if rq_job:
        last_task_update_time = timezone.localtime(db_task.updated_date)
        request_time = rq_job.meta.get('request_time', None)
        if request_time is None or request_time < last_task_update_time:
            rq_job.cancel()
            rq_job.delete()
        else:
            if rq_job.is_finished:
                file_path = rq_job.return_value
                if action == "download" and osp.exists(file_path):
                    rq_job.delete()

                    timestamp = datetime.strftime(last_task_update_time,
                        "%Y_%m_%d_%H_%M_%S")
                    filename = filename or \
                        "task_{}-{}-{}{}".format(
                        db_task.name, timestamp,
                        format_name, osp.splitext(file_path)[1])
                    return sendfile(request, file_path, attachment=True,
                        attachment_filename=filename.lower())
                else:
                    if osp.exists(file_path):
                        return Response(status=status.HTTP_201_CREATED)
            elif rq_job.is_failed:
                exc_info = str(rq_job.exc_info)
                rq_job.delete()
                return Response(exc_info,
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                return Response(status=status.HTTP_202_ACCEPTED)

    try:
        if request.scheme:
            server_address = request.scheme + '://'
        server_address += request.get_host()
    except Exception:
        server_address = None

    ttl = dm.views.CACHE_TTL.total_seconds()
    queue.enqueue_call(func=callback,
        args=(db_task.id, format_name, server_address), job_id=rq_id,
        meta={ 'request_time': timezone.localtime() },
        result_ttl=ttl, failure_ttl=ttl)
    return Response(status=status.HTTP_202_ACCEPTED)


