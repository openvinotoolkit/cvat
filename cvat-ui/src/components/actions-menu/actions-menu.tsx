// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import React from 'react';
import Menu from 'antd/lib/menu';
import Modal from 'antd/lib/modal';
// eslint-disable-next-line import/no-extraneous-dependencies
import { MenuInfo } from 'rc-menu/lib/interface';
import DumpSubmenu from './dump-submenu';
import LoadSubmenu from './load-submenu';
import ExportSubmenu from './export-submenu';
import { DimensionType } from '../../reducers/interfaces';

interface Props {
    taskID: number;
    taskMode: string;
    bugTracker: string;
    loaders: any[];
    dumpers: any[];
    loadActivity: string | null;
    dumpActivities: string[] | null;
    exportActivities: string[] | null;
    inferenceIsActive: boolean;
    taskDimension: DimensionType;
    onClickMenu: (params: MenuInfo, file?: File) => void;
}

export enum Actions {
    DUMP_TASK_ANNO = 'dump_task_anno',
    LOAD_TASK_ANNO = 'load_task_anno',
    EXPORT_TASK_DATASET = 'export_task_dataset',
    DELETE_TASK = 'delete_task',
    RUN_AUTO_ANNOTATION = 'run_auto_annotation',
    MOVE_TASK_TO_PROJECT = 'move_task_to_project',
    OPEN_BUG_TRACKER = 'open_bug_tracker',
}

export default function ActionsMenuComponent(props: Props): JSX.Element {
    const {
        taskID,
        taskMode,
        bugTracker,
        inferenceIsActive,
        dumpers,
        loaders,
        onClickMenu,
        dumpActivities,
        exportActivities,
        loadActivity,
        taskDimension,
    } = props;

    let latestParams: MenuInfo | null = null;
    function onClickMenuWrapper(params: MenuInfo | null, file?: File): void {
        const copyParams = params || latestParams;
        if (!copyParams) {
            return;
        }
        latestParams = copyParams;

        if (copyParams.keyPath.length === 2) {
            const [, action] = copyParams.keyPath;
            if (action === Actions.LOAD_TASK_ANNO) {
                if (file) {
                    Modal.confirm({
                        title: 'Current annotation will be lost',
                        content: 'You are going to upload new annotations to this task. Continue?',
                        className: 'cvat-modal-content-load-task-annotation',
                        onOk: () => {
                            onClickMenu(copyParams, file);
                        },
                        okButtonProps: {
                            type: 'primary',
                            danger: true,
                        },
                        okText: 'Update',
                    });
                }
            } else {
                onClickMenu(copyParams);
            }
        } else if (copyParams.key === Actions.DELETE_TASK) {
            Modal.confirm({
                title: `The task ${taskID} will be deleted`,
                content: 'All related data (images, annotations) will be lost. Continue?',
                className: 'cvat-modal-confirm-delete-task',
                onOk: () => {
                    onClickMenu(copyParams);
                },
                okButtonProps: {
                    type: 'primary',
                    danger: true,
                },
                okText: 'Delete',
            });
        } else {
            onClickMenu(copyParams);
        }
    }

    return (
        <Menu selectable={false} className='cvat-actions-menu' onClick={onClickMenuWrapper}>
            {DumpSubmenu({
                taskMode,
                dumpers,
                dumpActivities,
                menuKey: Actions.DUMP_TASK_ANNO,
                taskDimension,
            })}
            {LoadSubmenu({
                loaders,
                loadActivity,
                onFileUpload: (file: File): void => {
                    onClickMenuWrapper(null, file);
                },
                menuKey: Actions.LOAD_TASK_ANNO,
                taskDimension,
            })}
            {ExportSubmenu({
                exporters: dumpers,
                exportActivities,
                menuKey: Actions.EXPORT_TASK_DATASET,
                taskDimension,
            })}
            {!!bugTracker && <Menu.Item key={Actions.OPEN_BUG_TRACKER}>Open bug tracker</Menu.Item>}
            <Menu.Item disabled={inferenceIsActive} key={Actions.RUN_AUTO_ANNOTATION}>
                Automatic annotation
            </Menu.Item>
            <hr />
            <Menu.Item key={Actions.MOVE_TASK_TO_PROJECT}>Move to project</Menu.Item>
            <Menu.Item key={Actions.DELETE_TASK}>Delete</Menu.Item>
        </Menu>
    );
}
