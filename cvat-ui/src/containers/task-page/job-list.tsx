// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { connect } from 'react-redux';

import JobListComponent from 'components/task-page/job-list';
import { updateJobAsync, updateCurrentJobsPage } from 'actions/tasks-actions';
import { Task } from 'reducers/interfaces';

interface OwnProps {
    task: Task;
}

interface DispatchToProps {
    onJobUpdate(jobInstance: any): void;
    setCurrentJobsPage(taskID: number, pagenumber: number): void;
}

function mapDispatchToProps(dispatch: any): DispatchToProps {
    return {
        onJobUpdate: (jobInstance: any): void => dispatch(updateJobAsync(jobInstance)),
        setCurrentJobsPage: (taskID: number, pageNumber: number): void =>
            dispatch(updateCurrentJobsPage(taskID, pageNumber)),
    };
}

function TaskPageContainer(props: DispatchToProps & OwnProps): JSX.Element {
    const { task, onJobUpdate, setCurrentJobsPage } = props;

    return (
        <JobListComponent
            taskInstance={task.instance}
            onJobUpdate={onJobUpdate}
            setCurrentJobsPage={setCurrentJobsPage}
        />
    );
}

export default connect(null, mapDispatchToProps)(TaskPageContainer);
