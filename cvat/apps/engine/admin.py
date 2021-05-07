
# Copyright (C) 2018 Intel Corporation
#
# SPDX-License-Identifier: MIT

from django.contrib import admin
from .models import Task, Segment, Job, Label, AttributeSpec, Project, CloudStorage

class JobInline(admin.TabularInline):
    model = Job
    can_delete = False

    # Don't show extra lines to add an object
    def has_add_permission(self, request, obj):
        return False

class SegmentInline(admin.TabularInline):
    model = Segment
    show_change_link = True
    readonly_fields = ('start_frame', 'stop_frame')
    can_delete = False

    # Don't show extra lines to add an object
    def has_add_permission(self, request, obj):
        return False


class AttributeSpecInline(admin.TabularInline):
    model = AttributeSpec
    extra = 0
    max_num = None

class LabelInline(admin.TabularInline):
    model = Label
    show_change_link = True
    extra = 0
    max_num = None

class LabelAdmin(admin.ModelAdmin):
    # Don't show on admin index page
    def has_module_permission(self, request):
        return False

    inlines = [
        AttributeSpecInline
    ]

class SegmentAdmin(admin.ModelAdmin):
    # Don't show on admin index page
    def has_module_permission(self, request):
        return False

    inlines = [
        JobInline
    ]

class ProjectAdmin(admin.ModelAdmin):
    date_hierarchy = 'updated_date'
    readonly_fields = ('created_date', 'updated_date', 'status')
    fields = ('name', 'owner', 'created_date', 'updated_date', 'status')
    search_fields = ('name', 'owner__username', 'owner__first_name',
        'owner__last_name', 'owner__email', 'assignee__username', 'assignee__first_name',
        'assignee__last_name')
    inlines = [
        LabelInline
    ]

    def has_add_permission(self, _request):
        return False

class TaskAdmin(admin.ModelAdmin):
    date_hierarchy = 'updated_date'
    readonly_fields = ('created_date', 'updated_date', 'overlap')
    list_display = ('name', 'mode', 'owner', 'assignee', 'created_date', 'updated_date')
    search_fields = ('name', 'mode', 'owner__username', 'owner__first_name',
        'owner__last_name', 'owner__email', 'assignee__username', 'assignee__first_name',
        'assignee__last_name')
    inlines = [
        SegmentInline,
        LabelInline
    ]

    # Don't allow to add a task because it isn't trivial operation
    def has_add_permission(self, request):
        return False

class CloudStorageAdmin(admin.ModelAdmin):
    date_hierarchy = 'updated_date'
    readonly_fields = ('created_date', 'updated_date', 'provider_type')
    list_display = ('__str__', 'owner', 'created_date', 'updated_date')
    search_fields = ('provider_type', 'resource', 'owner__username', 'owner__first_name',
        'owner__last_name', 'owner__email',)

    empty_value_display = 'unknown'

    def has_add_permission(self, request):
        return False

admin.site.register(Task, TaskAdmin)
admin.site.register(Segment, SegmentAdmin)
admin.site.register(Label, LabelAdmin)
admin.site.register(Project, ProjectAdmin)
admin.site.register(CloudStorage, CloudStorageAdmin)
