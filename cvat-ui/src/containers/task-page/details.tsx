// Copyright (C) 2019-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { connect } from 'react-redux';

import DetailsComponent from 'components/task-page/details';
import { syncTaskWithClowderAsync, updateTaskAsync } from 'actions/tasks-actions';
import { cancelInferenceAsync } from 'actions/models-actions';
import { Task, CombinedState, ActiveInference } from 'reducers/interfaces';

interface OwnProps {
    task: Task;
}

interface StateToProps {
    activeInference: ActiveInference | null;
    installedGit: boolean;
    projectSubsets: string[];
}

interface DispatchToProps {
    cancelAutoAnnotation(): void;
    onTaskUpdate: (taskInstance: any) => void;
    onClowderSync: (taskInstance: any) => void;
}

function mapStateToProps(state: CombinedState, own: OwnProps): StateToProps {
    const { list } = state.plugins;
    const [taskProject] = state.projects.current.filter((project) => project.id === own.task.instance.projectId);

    return {
        installedGit: list.GIT_INTEGRATION,
        activeInference: state.models.inferences[own.task.instance.id] || null,
        projectSubsets: taskProject
            ? ([
                  ...new Set(taskProject.tasks.map((task: any) => task.subset).filter((subset: string) => subset)),
              ] as string[])
            : [],
    };
}

function mapDispatchToProps(dispatch: any, own: OwnProps): DispatchToProps {
    return {
        onTaskUpdate(taskInstance: any): void {
            dispatch(updateTaskAsync(taskInstance));
        },
        cancelAutoAnnotation(): void {
            dispatch(cancelInferenceAsync(own.task.instance.id));
        },
        onClowderSync(taskInstance: any): void {
            dispatch(syncTaskWithClowderAsync(taskInstance));
        },
    };
}

function TaskPageContainer(props: StateToProps & DispatchToProps & OwnProps): JSX.Element {
    const {
        task,
        installedGit,
        activeInference,
        projectSubsets,
        cancelAutoAnnotation,
        onTaskUpdate,
        onClowderSync,
    } = props;

    return (
        <DetailsComponent
            previewImage={task.preview}
            taskInstance={task.instance}
            installedGit={installedGit}
            activeInference={activeInference}
            projectSubsets={projectSubsets}
            onTaskUpdate={onTaskUpdate}
            cancelAutoAnnotation={cancelAutoAnnotation}
            onClowderSync={onClowderSync}
        />
    );
}

export default connect(mapStateToProps, mapDispatchToProps)(TaskPageContainer);
