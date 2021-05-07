#!/usr/bin/env python3
#
# SPDX-License-Identifier: MIT
import logging
import requests
import sys
from http.client import HTTPConnection
from core.core import CLI, CVAT_API_V1
from core.definition import parser
log = logging.getLogger(__name__)


def config_log(level):
    log = logging.getLogger('core')
    log.addHandler(logging.StreamHandler(sys.stdout))
    log.setLevel(level)
    if level <= logging.DEBUG:
        HTTPConnection.debuglevel = 1


def main():
    actions = {
        'create': CLI.tasks_create,
        'delete': CLI.tasks_delete,
        'ls': CLI.tasks_list,
        'frames': CLI.tasks_frame,
        'dump': CLI.tasks_dump,
        'upload': CLI.tasks_upload,
        'export': CLI.tasks_export,
        'import': CLI.tasks_import,
    }
    args = parser.parse_args()
    config_log(args.loglevel)
    with requests.Session() as session:
        api = CVAT_API_V1('%s:%s' % (args.server_host, args.server_port), args.https)
        cli = CLI(session, api, args.auth)
        try:
            actions[args.action](cli, **args.__dict__)
        except (requests.exceptions.HTTPError,
                requests.exceptions.ConnectionError,
                requests.exceptions.RequestException) as e:
            log.critical(e)


if __name__ == '__main__':
    main()
