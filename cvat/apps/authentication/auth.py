# Copyright (C) 2018 Intel Corporation
#
# SPDX-License-Identifier: MIT

from django.conf import settings
from django.db.models import Q
import rules
from . import AUTH_ROLE
from . import signature
from rest_framework.permissions import BasePermission
from django.core import signing
from rest_framework import authentication, exceptions
from rest_framework.authentication import TokenAuthentication as _TokenAuthentication
from django.contrib.auth import login

# Even with token authorization it is very important to have a valid session id
# in cookies because in some cases we cannot use token authorization (e.g. when
# we redirect to the server in UI using just URL). To overkill that we override
# the class to call `login` method which restores the session id in cookies.
class TokenAuthentication(_TokenAuthentication):
    def authenticate(self, request):
        auth = super().authenticate(request)
        session = getattr(request, 'session')
        if auth is not None and session.session_key is None:
            login(request, auth[0], 'django.contrib.auth.backends.ModelBackend')
        return auth

def register_signals():
    from django.db.models.signals import post_migrate, post_save
    from django.contrib.auth.models import User, Group

    def create_groups(sender, **kwargs):
        for role in AUTH_ROLE:
            db_group, _ = Group.objects.get_or_create(name=role)
            db_group.save()

    post_migrate.connect(create_groups, weak=False)

    if settings.DJANGO_AUTH_TYPE == 'BASIC':
        from .auth_basic import create_user

        post_save.connect(create_user, sender=User)
    elif settings.DJANGO_AUTH_TYPE == 'LDAP':
        import django_auth_ldap.backend
        from .auth_ldap import create_user

        django_auth_ldap.backend.populate_user.connect(create_user)

class SignatureAuthentication(authentication.BaseAuthentication):
    """
    Authentication backend for signed URLs.
    """
    def authenticate(self, request):
        """
        Returns authenticated user if URL signature is valid.
        """
        signer = signature.Signer()
        sign = request.query_params.get(signature.QUERY_PARAM)
        if not sign:
            return

        try:
            user = signer.unsign(sign, request.build_absolute_uri())
        except signing.SignatureExpired:
            raise exceptions.AuthenticationFailed('This URL has expired.')
        except signing.BadSignature:
            raise exceptions.AuthenticationFailed('Invalid signature.')
        if not user.is_active:
            raise exceptions.AuthenticationFailed('User inactive or deleted.')

        return (user, None)

# AUTH PREDICATES
has_admin_role = rules.is_group_member(str(AUTH_ROLE.ADMIN))
has_user_role = rules.is_group_member(str(AUTH_ROLE.USER))
has_annotator_role = rules.is_group_member(str(AUTH_ROLE.ANNOTATOR))
has_observer_role = rules.is_group_member(str(AUTH_ROLE.OBSERVER))

@rules.predicate
def is_project_owner(db_user, db_project):
    # If owner is None (null) the task can be accessed/changed/deleted
    # only by admin. At the moment each task has an owner.
    return db_project is not None and db_project.owner == db_user

@rules.predicate
def is_project_assignee(db_user, db_project):
    return db_project is not None and db_project.assignee == db_user

@rules.predicate
def is_project_annotator(db_user, db_project):
    db_tasks = list(db_project.tasks.prefetch_related('segment_set').all())
    return any([is_task_annotator(db_user, db_task) for db_task in db_tasks])

@rules.predicate
def is_project_reviewer(db_user, db_project):
    db_tasks = list(db_project.tasks.prefetch_related('segment_set').all())
    return any([is_task_reviewer(db_user, db_task) for db_task in db_tasks])

@rules.predicate
def is_task_owner(db_user, db_task):
    # If owner is None (null) the task can be accessed/changed/deleted
    # only by admin. At the moment each task has an owner.
    return db_task.owner == db_user or is_project_owner(db_user, db_task.project)

@rules.predicate
def is_task_assignee(db_user, db_task):
    return db_task.assignee == db_user or is_project_assignee(db_user, db_task.project)

@rules.predicate
def is_task_reviewer(db_user, db_task):
    db_segments = list(db_task.segment_set.prefetch_related('job_set__assignee').all())
    return any([is_job_reviewer(db_user, db_job)
        for db_segment in db_segments for db_job in db_segment.job_set.all()])

@rules.predicate
def is_task_annotator(db_user, db_task):
    db_segments = list(db_task.segment_set.prefetch_related('job_set__assignee').all())
    return any([is_job_annotator(db_user, db_job)
        for db_segment in db_segments for db_job in db_segment.job_set.all()])

@rules.predicate
def is_job_owner(db_user, db_job):
    return is_task_owner(db_user, db_job.segment.task)

@rules.predicate
def is_job_annotator(db_user, db_job):
    db_task = db_job.segment.task
    # A job can be annotated by any user if the task's assignee is None.
    has_rights = (db_task.assignee is None and not settings.RESTRICTIONS['reduce_task_visibility']) or is_task_assignee(db_user, db_task)
    if db_job.assignee is not None:
        has_rights |= (db_user == db_job.assignee)

    return has_rights

@rules.predicate
def has_change_permissions(db_user, db_job):
    db_task = db_job.segment.task
    # A job can be annotated by any user if the task's assignee is None.
    has_rights = (db_task.assignee is None and not settings.RESTRICTIONS['reduce_task_visibility']) or is_task_assignee(db_user, db_task)
    if db_job.assignee is not None:
        has_rights |= (db_user == db_job.assignee) and (db_job.status == 'annotation')
    if db_job.reviewer is not None:
        has_rights |= (db_user == db_job.reviewer) and (db_job.status == 'validation')

    return has_rights

@rules.predicate
def is_job_reviewer(db_user, db_job):
    has_rights = db_job.reviewer == db_user
    return has_rights

@rules.predicate
def is_issue_owner(db_user, db_issue):
    has_rights = db_issue.owner == db_user
    return has_rights

@rules.predicate
def is_comment_author(db_user, db_comment):
    has_rights = (db_comment.author == db_user)
    return has_rights

@rules.predicate
def is_cloud_storage_owner(db_user, db_storage):
    return db_storage.owner == db_user

# AUTH PERMISSIONS RULES
rules.add_perm('engine.role.user', has_user_role)
rules.add_perm('engine.role.admin', has_admin_role)
rules.add_perm('engine.role.annotator', has_annotator_role)
rules.add_perm('engine.role.observer', has_observer_role)

rules.add_perm('engine.project.create', has_admin_role | has_user_role)
rules.add_perm('engine.project.access', has_admin_role | has_observer_role |
    is_project_owner | is_project_annotator)
rules.add_perm('engine.project.change', has_admin_role | is_project_owner |
    is_project_assignee)
rules.add_perm('engine.project.delete', has_admin_role | is_project_owner)

rules.add_perm('engine.task.create', has_admin_role | has_user_role)
rules.add_perm('engine.task.access', has_admin_role | has_observer_role |
    is_task_owner | is_task_annotator | is_task_reviewer)
rules.add_perm('engine.task.change', has_admin_role | is_task_owner |
    is_task_assignee)
rules.add_perm('engine.task.delete', has_admin_role | is_task_owner)

rules.add_perm('engine.job.access', has_admin_role | has_observer_role |
    is_job_owner | is_job_annotator | is_job_reviewer)
rules.add_perm('engine.job.change', has_admin_role | is_job_owner | has_change_permissions)
rules.add_perm('engine.job.review', has_admin_role | (is_job_reviewer & has_change_permissions))

rules.add_perm('engine.issue.change', has_admin_role | is_issue_owner)
rules.add_perm('engine.issue.destroy', has_admin_role | is_issue_owner)

rules.add_perm('engine.comment.change', has_admin_role | is_comment_author)


rules.add_perm('engine.cloudstorage.create', has_admin_role | has_user_role)
rules.add_perm('engine.cloudstorage.change', has_admin_role | is_cloud_storage_owner)

class AdminRolePermission(BasePermission):
    # pylint: disable=no-self-use
    def has_permission(self, request, view):
        return request.user.has_perm('engine.role.admin')

class UserRolePermission(BasePermission):
    # pylint: disable=no-self-use
    def has_permission(self, request, view):
        return request.user.has_perm('engine.role.user')

class AnnotatorRolePermission(BasePermission):
    # pylint: disable=no-self-use
    def has_permission(self, request, view):
        return request.user.has_perm('engine.role.annotator')

class ObserverRolePermission(BasePermission):
    # pylint: disable=no-self-use
    def has_permission(self, request, view):
        return request.user.has_perm('engine.role.observer')

class ProjectCreatePermission(BasePermission):
    # pylint: disable=no-self-use
    def has_permission(self, request, view):
        return request.user.has_perm('engine.project.create')

class ProjectAccessPermission(BasePermission):
    # pylint: disable=no-self-use
    def has_object_permission(self, request, view, obj):
        return request.user.has_perm('engine.project.access', obj)

class ProjectChangePermission(BasePermission):
    # pylint: disable=no-self-use
    def has_object_permission(self, request, view, obj):
        return request.user.has_perm('engine.project.change', obj)

class ProjectDeletePermission(BasePermission):
    # pylint: disable=no-self-use
    def has_object_permission(self, request, view, obj):
        return request.user.has_perm('engine.project.delete', obj)

class TaskCreatePermission(BasePermission):
    # pylint: disable=no-self-use
    def has_permission(self, request, view):
        return request.user.has_perm('engine.task.create')

class TaskAccessPermission(BasePermission):
    # pylint: disable=no-self-use
    def has_object_permission(self, request, view, obj):
        return request.user.has_perm('engine.task.access', obj)


class ProjectGetQuerySetMixin(object):
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        # Don't filter queryset for admin, observer and detail methods
        if has_admin_role(user) or has_observer_role(user) or self.detail:
            return queryset
        else:
            return queryset.filter(Q(owner=user) | Q(assignee=user) |
                Q(task__owner=user) | Q(task__assignee=user) |
                Q(task__segment__job__assignee=user) |
                Q(task__segment__job__reviewer=user)).distinct()

def filter_task_queryset(queryset, user):
    # Don't filter queryset for admin, observer
    if has_admin_role(user) or has_observer_role(user):
        return queryset

    query_filter = Q(owner=user) | Q(assignee=user) | \
        Q(segment__job__assignee=user) | Q(segment__job__reviewer=user)
    if not settings.RESTRICTIONS['reduce_task_visibility']:
        query_filter |= Q(assignee=None)

    return queryset.filter(query_filter).distinct()

class TaskGetQuerySetMixin(object):
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        # Don't filter queryset for detail methods
        if self.detail:
            return queryset
        else:
            return filter_task_queryset(queryset, user)

class TaskChangePermission(BasePermission):
    # pylint: disable=no-self-use
    def has_object_permission(self, request, view, obj):
        return request.user.has_perm('engine.task.change', obj)

class TaskDeletePermission(BasePermission):
    # pylint: disable=no-self-use
    def has_object_permission(self, request, view, obj):
        return request.user.has_perm('engine.task.delete', obj)

class JobAccessPermission(BasePermission):
    # pylint: disable=no-self-use
    def has_object_permission(self, request, view, obj):
        return request.user.has_perm('engine.job.access', obj)

class JobChangePermission(BasePermission):
    # pylint: disable=no-self-use
    def has_object_permission(self, request, view, obj):
        return request.user.has_perm('engine.job.change', obj)

class JobReviewPermission(BasePermission):
    # pylint: disable=no-self-use
    def has_object_permission(self, request, view, obj):
        return request.user.has_perm('engine.job.review', obj)

class IssueAccessPermission(BasePermission):
    # pylint: disable=no-self-use
    def has_object_permission(self, request, view, obj):
        db_job = obj.job
        return request.user.has_perm('engine.job.access', db_job)

class IssueDestroyPermission(BasePermission):
    # pylint: disable=no-self-use
    def has_object_permission(self, request, view, obj):
        return request.user.has_perm('engine.issue.destroy', obj)

class IssueChangePermission(BasePermission):
    # pylint: disable=no-self-use
    def has_object_permission(self, request, view, obj):
        db_job = obj.job
        return (request.user.has_perm('engine.job.change', db_job)
            or request.user.has_perm('engine.issue.change', obj))

class CommentCreatePermission(BasePermission):
    # pylint: disable=no-self-use
    def has_object_permission(self, request, view, obj): # obj is db_job
        return request.user.has_perm('engine.job.access', obj)

class CommentChangePermission(BasePermission):
    # pylint: disable=no-self-use
    def has_object_permission(self, request, view, obj):
        return request.user.has_perm('engine.comment.change', obj)

class CloudStorageAccessPermission(BasePermission):
    # pylint: disable=no-self-use
    def has_object_permission(self, request, view, obj):
        return request.user.has_perm("engine.cloudstorage.change", obj)

class CloudStorageChangePermission(BasePermission):
    # pylint: disable=no-self-use
    def has_object_permission(self, request, view, obj):
        return request.user.has_perm("engine.cloudstorage.change", obj)

class CloudStorageGetQuerySetMixin(object):
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if has_admin_role(user) or self.detail:
            return queryset
        else:
            return queryset.filter(owner=user)
