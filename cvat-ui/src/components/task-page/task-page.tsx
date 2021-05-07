// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import React from 'react';
import { RouteComponentProps } from 'react-router';
import { withRouter } from 'react-router-dom';
import { Row, Col } from 'antd/lib/grid';
import Spin from 'antd/lib/spin';
import Result from 'antd/lib/result';

import DetailsContainer from 'containers/task-page/details';
import JobListContainer from 'containers/task-page/job-list';
import ModelRunnerModal from 'components/model-runner-modal/model-runner-dialog';
import MoveTaskModal from 'components/move-task-modal/move-task-modal';
import { Task } from 'reducers/interfaces';
import TopBarComponent from './top-bar';

interface TaskPageComponentProps {
    task: Task | null | undefined;
    fetching: boolean;
    updating: boolean;
    deleteActivity: boolean | null;
    installedGit: boolean;
    getTask: () => void;
}

type Props = TaskPageComponentProps & RouteComponentProps<{ id: string }>;

class TaskPageComponent extends React.PureComponent<Props> {
    public componentDidMount(): void {
        const { task, fetching, getTask } = this.props;

        if (task === null && !fetching) {
            getTask();
        }
    }

    public componentDidUpdate(): void {
        const {
            deleteActivity, history, task, fetching, getTask,
        } = this.props;

        if (task === null && !fetching) {
            getTask();
        }

        if (deleteActivity) {
            history.replace('/tasks');
        }
    }

    public render(): JSX.Element {
        const { task, updating } = this.props;

        if (task === null) {
            return <Spin size='large' className='cvat-spinner' />;
        }

        if (typeof task === 'undefined') {
            return (
                <Result
                    className='cvat-not-found'
                    status='404'
                    title='Sorry, but this task was not found'
                    subTitle='Please, be sure information you tried to get exist and you have access'
                />
            );
        }

        return (
            <>
                <Row
                    style={{ display: updating ? 'none' : undefined }}
                    justify='center'
                    align='top'
                    className='cvat-task-details-wrapper'
                >
                    <Col md={22} lg={18} xl={16} xxl={14}>
                        <TopBarComponent taskInstance={(task as Task).instance} />
                        <DetailsContainer task={task as Task} />
                        <JobListContainer task={task as Task} />
                    </Col>
                </Row>
                <ModelRunnerModal />
                <MoveTaskModal />
                {updating && <Spin size='large' className='cvat-spinner' />}
            </>
        );
    }
}

export default withRouter(TaskPageComponent);
