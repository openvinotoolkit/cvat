# SPDX-License-Identifier: MIT
import argparse
import getpass
import json
import logging
import os
from enum import Enum


def get_auth(s):
    """ Parse USER[:PASS] strings and prompt for password if none was
    supplied. """
    user, _, password = s.partition(':')
    password = password or os.environ.get('PASS') or getpass.getpass()
    return user, password


def parse_label_arg(s):
    """ If s is a file load it as JSON, otherwise parse s as JSON."""
    if os.path.exists(s):
        fp = open(s, 'r')
        return json.load(fp)
    else:
        return json.loads(s)


class ResourceType(Enum):

    LOCAL = 0
    SHARE = 1
    REMOTE = 2

    def __str__(self):
        return self.name.lower()

    def __repr__(self):
        return str(self)

    @staticmethod
    def argparse(s):
        try:
            return ResourceType[s.upper()]
        except KeyError:
            return s


#######################################################################
# Command line interface definition
#######################################################################

parser = argparse.ArgumentParser(
    description='Perform common operations related to CVAT tasks.\n\n'
)
task_subparser = parser.add_subparsers(dest='action')

#######################################################################
# Positional arguments
#######################################################################

parser.add_argument(
    '--auth',
    type=get_auth,
    metavar='USER:[PASS]',
    default=getpass.getuser(),
    help='''defaults to the current user and supports the PASS
            environment variable or password prompt
            (default user: %(default)s).'''
)
parser.add_argument(
    '--server-host',
    type=str,
    default='localhost',
    help='host (default: %(default)s)'
)
parser.add_argument(
    '--server-port',
    type=int,
    default='8080',
    help='port (default: %(default)s)'
)
parser.add_argument(
    '--https',
    default=False,
    action='store_true',
    help='using https connection (default: %(default)s)'
)
parser.add_argument(
    '--debug',
    action='store_const',
    dest='loglevel',
    const=logging.DEBUG,
    default=logging.INFO,
    help='show debug output'
)

#######################################################################
# Create
#######################################################################

task_create_parser = task_subparser.add_parser(
    'create',
    description='Create a new CVAT task.'
)
task_create_parser.add_argument(
    'name',
    type=str,
    help='name of the task'
)
task_create_parser.add_argument(
    '--labels',
    default='[]',
    type=parse_label_arg,
    help='string or file containing JSON labels specification'
)
task_create_parser.add_argument(
    '--project',
    default=None,
    type=int,
    help='project ID if project exists'
)
task_create_parser.add_argument(
    '--overlap',
    default=0,
    type=int,
    help='the number of intersected frames between different segments'
)
task_create_parser.add_argument(
    '--segment_size',
    default=0,
    type=int,
    help='the number of frames in a segment'
)
task_create_parser.add_argument(
    '--bug',
    default='',
    type=str,
    help='bug tracker URL'
)
task_create_parser.add_argument(
    'resource_type',
    default='local',
    choices=list(ResourceType),
    type=ResourceType.argparse,
    help='type of files specified'
)
task_create_parser.add_argument(
    'resources',
    type=str,
    help='list of paths or URLs',
    nargs='+'
)
task_create_parser.add_argument(
    '--annotation_path',
    default='',
    type=str,
    help='path to annotation file'
)
task_create_parser.add_argument(
    '--annotation_format',
    default='CVAT 1.1',
    type=str,
    help='format of the annotation file being uploaded, e.g. CVAT 1.1'
)
task_create_parser.add_argument(
    '--completion_verification_period',
    default=20,
    type=int,
    help='''number of seconds to wait until checking
            if data compression finished (necessary before uploading annotations)'''
)
task_create_parser.add_argument(
    '--dataset_repository_url',
    default='',
    type=str,
    help=('git repository to store annotations e.g.'
          ' https://github.com/user/repos [annotation/<anno_file_name.zip>]')
)
task_create_parser.add_argument(
    '--lfs',
    default=False,
    action='store_true',
    help='using lfs for dataset repository (default: %(default)s)'
)

#######################################################################
# Delete
#######################################################################

delete_parser = task_subparser.add_parser(
    'delete',
    description='Delete a CVAT task.'
)
delete_parser.add_argument(
    'task_ids',
    type=int,
    help='list of task IDs',
    nargs='+'
)

#######################################################################
# List
#######################################################################

ls_parser = task_subparser.add_parser(
    'ls',
    description='List all CVAT tasks in simple or JSON format.'
)
ls_parser.add_argument(
    '--json',
    dest='use_json_output',
    default=False,
    action='store_true',
    help='output JSON data'
)

#######################################################################
# Frames
#######################################################################

frames_parser = task_subparser.add_parser(
    'frames',
    description='Download all frame images for a CVAT task.'
)
frames_parser.add_argument(
    'task_id',
    type=int,
    help='task ID'
)
frames_parser.add_argument(
    'frame_ids',
    type=int,
    help='list of frame IDs to download',
    nargs='+'
)
frames_parser.add_argument(
    '--outdir',
    type=str,
    default='',
    help='directory to save images (default: CWD)'
)
frames_parser.add_argument(
    '--quality',
    type=str,
    choices=('original', 'compressed'),
    default='original',
    help='choose quality of images (default: %(default)s)'
)

#######################################################################
# Dump
#######################################################################

dump_parser = task_subparser.add_parser(
    'dump',
    description='Download annotations for a CVAT task.'
)
dump_parser.add_argument(
    'task_id',
    type=int,
    help='task ID'
)
dump_parser.add_argument(
    'filename',
    type=str,
    help='output file'
)
dump_parser.add_argument(
    '--format',
    dest='fileformat',
    type=str,
    default='CVAT for images 1.1',
    help='annotation format (default: %(default)s)'
)

#######################################################################
# Upload Annotations
#######################################################################

upload_parser = task_subparser.add_parser(
    'upload',
    description='Upload annotations for a CVAT task.'
)
upload_parser.add_argument(
    'task_id',
    type=int,
    help='task ID'
)
upload_parser.add_argument(
    'filename',
    type=str,
    help='upload file'
)
upload_parser.add_argument(
    '--format',
    dest='fileformat',
    type=str,
    default='CVAT 1.1',
    help='annotation format (default: %(default)s)'
)

#######################################################################
# Export task
#######################################################################

export_task_parser = task_subparser.add_parser(
    'export',
    description='Export a CVAT task.'
)
export_task_parser.add_argument(
    'task_id',
    type=int,
    help='task ID'
)
export_task_parser.add_argument(
    'filename',
    type=str,
    help='output file'
)

#######################################################################
# Import task
#######################################################################

import_task_parser = task_subparser.add_parser(
    'import',
    description='import a CVAT task.'
)
import_task_parser.add_argument(
    'filename',
    type=str,
    help='upload file'
)
