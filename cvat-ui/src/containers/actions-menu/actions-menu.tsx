// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { connect } from 'react-redux';

import ActionsMenuComponent, { Actions } from 'components/actions-menu/actions-menu';
import { CombinedState } from 'reducers/interfaces';

import { modelsActions } from 'actions/models-actions';
import {
    dumpAnnotationsAsync,
    loadAnnotationsAsync,
    exportDatasetAsync,
    deleteTaskAsync,
    showMoveTaskModal,
} from 'actions/tasks-actions';
// eslint-disable-next-line import/no-extraneous-dependencies
import { MenuInfo } from 'rc-menu/lib/interface';

interface OwnProps {
    taskInstance: any;
}

interface StateToProps {
    annotationFormats: any;
    loadActivity: string | null;
    dumpActivities: string[] | null;
    exportActivities: string[] | null;
    inferenceIsActive: boolean;
}

interface DispatchToProps {
    loadAnnotations: (taskInstance: any, loader: any, file: File) => void;
    dumpAnnotations: (taskInstance: any, dumper: any) => void;
    exportDataset: (taskInstance: any, exporter: any) => void;
    deleteTask: (taskInstance: any) => void;
    openRunModelWindow: (taskInstance: any) => void;
    openMoveTaskToProjectWindow: (taskInstance: any) => void;
}

function mapStateToProps(state: CombinedState, own: OwnProps): StateToProps {
    const {
        taskInstance: { id: tid },
    } = own;

    const {
        formats: { annotationFormats },
        tasks: {
            activities: { dumps, loads, exports: activeExports },
        },
    } = state;

    return {
        dumpActivities: tid in dumps ? dumps[tid] : null,
        exportActivities: tid in activeExports ? activeExports[tid] : null,
        loadActivity: tid in loads ? loads[tid] : null,
        annotationFormats,
        inferenceIsActive: tid in state.models.inferences,
    };
}

function mapDispatchToProps(dispatch: any): DispatchToProps {
    return {
        loadAnnotations: (taskInstance: any, loader: any, file: File): void => {
            dispatch(loadAnnotationsAsync(taskInstance, loader, file));
        },
        dumpAnnotations: (taskInstance: any, dumper: any): void => {
            dispatch(dumpAnnotationsAsync(taskInstance, dumper));
        },
        exportDataset: (taskInstance: any, exporter: any): void => {
            dispatch(exportDatasetAsync(taskInstance, exporter));
        },
        deleteTask: (taskInstance: any): void => {
            dispatch(deleteTaskAsync(taskInstance));
        },
        openRunModelWindow: (taskInstance: any): void => {
            dispatch(modelsActions.showRunModelDialog(taskInstance));
        },
        openMoveTaskToProjectWindow: (taskInstance: any): void => {
            dispatch(showMoveTaskModal(taskInstance));
        },
    };
}

function ActionsMenuContainer(props: OwnProps & StateToProps & DispatchToProps): JSX.Element {
    const {
        taskInstance,
        annotationFormats: { loaders, dumpers },
        loadActivity,
        dumpActivities,
        exportActivities,
        inferenceIsActive,

        loadAnnotations,
        dumpAnnotations,
        exportDataset,
        deleteTask,
        openRunModelWindow,
        openMoveTaskToProjectWindow,
    } = props;

    function onClickMenu(params: MenuInfo, file?: File): void {
        if (params.keyPath.length > 1) {
            const [additionalKey, action] = params.keyPath;
            if (action === Actions.DUMP_TASK_ANNO) {
                const format = additionalKey;
                const [dumper] = dumpers.filter((_dumper: any): boolean => _dumper.name === format);
                if (dumper) {
                    dumpAnnotations(taskInstance, dumper);
                }
            } else if (action === Actions.LOAD_TASK_ANNO) {
                const format = additionalKey;
                const [loader] = loaders.filter((_loader: any): boolean => _loader.name === format);
                if (loader && file) {
                    loadAnnotations(taskInstance, loader, file);
                }
            } else if (action === Actions.EXPORT_TASK_DATASET) {
                const format = additionalKey;
                const [exporter] = dumpers.filter((_exporter: any): boolean => _exporter.name === format);
                if (exporter) {
                    exportDataset(taskInstance, exporter);
                }
            }
        } else {
            const [action] = params.keyPath;
            if (action === Actions.DELETE_TASK) {
                deleteTask(taskInstance);
            } else if (action === Actions.OPEN_BUG_TRACKER) {
                window.open(`${taskInstance.bugTracker}`, '_blank');
            } else if (action === Actions.RUN_AUTO_ANNOTATION) {
                openRunModelWindow(taskInstance);
            } else if (action === Actions.MOVE_TASK_TO_PROJECT) {
                openMoveTaskToProjectWindow(taskInstance);
            }
        }
    }

    return (
        <ActionsMenuComponent
            taskID={taskInstance.id}
            taskMode={taskInstance.mode}
            bugTracker={taskInstance.bugTracker}
            loaders={loaders}
            dumpers={dumpers}
            loadActivity={loadActivity}
            dumpActivities={dumpActivities}
            exportActivities={exportActivities}
            inferenceIsActive={inferenceIsActive}
            onClickMenu={onClickMenu}
            taskDimension={taskInstance.dimension}
        />
    );
}

export default connect(mapStateToProps, mapDispatchToProps)(ActionsMenuContainer);
