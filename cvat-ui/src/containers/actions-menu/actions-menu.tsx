// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { connect } from 'react-redux';

import { MenuInfo } from 'rc-menu/lib/interface';
import ActionsMenuComponent, { Actions } from 'components/actions-menu/actions-menu';
import { CombinedState } from 'reducers/interfaces';

import { modelsActions } from 'actions/models-actions';
import {
    dumpAnnotationsAsync,
    loadAnnotationsAsync,
    exportDatasetAsync,
    deleteTaskAsync,
    exportTaskAsync,
} from 'actions/tasks-actions';
// eslint-disable-next-line import/no-extraneous-dependencies

interface OwnProps {
    taskInstance: any;
}

interface StateToProps {
    annotationFormats: any;
    loadActivity: string | null;
    dumpActivities: string[] | null;
    exportActivities: string[] | null;
    inferenceIsActive: boolean;
    exportIsActive: boolean;
}

interface DispatchToProps {
    loadAnnotations: (taskInstance: any, loader: any, file: File) => void;
    dumpAnnotations: (taskInstance: any, dumper: any) => void;
    exportDataset: (taskInstance: any, exporter: any) => void;
    deleteTask: (taskInstance: any) => void;
    openRunModelWindow: (taskInstance: any) => void;
    exportTask: (taskInstance: any) => void;
}

function mapStateToProps(state: CombinedState, own: OwnProps): StateToProps {
    const {
        taskInstance: { id: tid },
    } = own;

    const {
        formats: { annotationFormats },
        tasks: {
            activities: {
                dumps, loads, exports: activeExports, backups,
            },
        },
    } = state;

    return {
        dumpActivities: tid in dumps ? dumps[tid] : null,
        exportActivities: tid in activeExports ? activeExports[tid] : null,
        loadActivity: tid in loads ? loads[tid] : null,
        annotationFormats,
        inferenceIsActive: tid in state.models.inferences,
        exportIsActive: tid in backups,
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
        exportTask: (taskInstance: any): void => {
            dispatch(exportTaskAsync(taskInstance));
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
        exportIsActive,

        loadAnnotations,
        dumpAnnotations,
        exportDataset,
        deleteTask,
        openRunModelWindow,
        exportTask,
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
                // eslint-disable-next-line
                window.open(`${taskInstance.bugTracker}`, '_blank');
            } else if (action === Actions.RUN_AUTO_ANNOTATION) {
                openRunModelWindow(taskInstance);
            } else if (action === Actions.EXPORT_TASK) {
                exportTask(taskInstance);
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
            exportIsActive={exportIsActive}
        />
    );
}

export default connect(mapStateToProps, mapDispatchToProps)(ActionsMenuContainer);
