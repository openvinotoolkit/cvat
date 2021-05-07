// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Modal from 'antd/lib/modal';
import { Row, Col } from 'antd/lib/grid';
import Divider from 'antd/lib/divider';
import notification from 'antd/lib/notification';
import Tooltip from 'antd/lib/tooltip';
import { QuestionCircleFilled } from '@ant-design/icons';

import ProjectSearch from 'components/create-task-page/project-search-field';
import { CombinedState } from 'reducers/interfaces';
import { closeMoveTaskModal, moveTaskToProjectAsync } from 'actions/tasks-actions';
import getCore from 'cvat-core-wrapper';
import LabelMapperItem, { LabelMapperItemValue } from './label-mapper-item';

const core = getCore();

export default function MoveTaskModal(): JSX.Element {
    const visible = useSelector((state: CombinedState) => state.tasks.moveTask.modalVisible);
    const task = useSelector((state: CombinedState) => {
        const [taskInstance] = state.tasks.current.filter((_task) => _task.instance.id === state.tasks.moveTask.taskId);
        return taskInstance?.instance;
    });
    const taskUpdating = useSelector((state: CombinedState) => state.tasks.updating);
    const dispatch = useDispatch();

    const [projectId, setProjectId] = useState<number | null>(null);
    const [project, setProject] = useState<any>(null);
    const [values, setValues] = useState<{ [key: string]: LabelMapperItemValue }>({});

    const initValues = (): void => {
        if (task) {
            const labelValues: { [key: string]: LabelMapperItemValue } = {};
            task.labels.forEach((label: any) => {
                labelValues[label.id] = {
                    labelId: label.id,
                    newLabelName: null,
                    clearAtrributes: true,
                };
            });
            setValues(labelValues);
        }
    };

    const onCancel = (): void => {
        dispatch(closeMoveTaskModal());
        initValues();
        setProject(null);
        setProjectId(null);
    };

    const submitMove = async (): Promise<void> => {
        if (!projectId) {
            notification.error({
                message: 'Project not selected',
            });
            return;
        }
        if (!Object.values(values).every((_value) => _value.newLabelName !== null)) {
            notification.error({
                message: 'Not all labels mapped',
                description: 'Please choose any action to not mapped labels first',
            });
            return;
        }
        dispatch(
            moveTaskToProjectAsync(
                task,
                projectId,
                Object.values(values).map((value) => ({
                    label_id: value.labelId,
                    new_label_name: value.newLabelName,
                    clear_attributes: value.clearAtrributes,
                })),
            ),
        );
        onCancel();
    };

    useEffect(() => {
        if (projectId) {
            core.projects.get({ id: projectId }).then((_project: any) => {
                if (projectId) {
                    setProject(_project[0]);
                    const { labels } = _project[0];
                    const labelValues: { [key: string]: LabelMapperItemValue } = {};
                    Object.entries(values).forEach(([id, label]) => {
                        const [autoNewLabel] = labels.filter((_label: any) => (
                            _label.name === task.labels.filter((_taskLabel: any) => (
                                _taskLabel.id === label.labelId
                            ))[0].name
                        ));
                        labelValues[id] = {
                            labelId: label.labelId,
                            newLabelName: autoNewLabel ? autoNewLabel.name : null,
                            clearAtrributes: true,
                        };
                    });
                    setValues(labelValues);
                }
            });
        } else {
            setProject(null);
        }
    }, [projectId]);

    useEffect(() => {
        initValues();
    }, [task?.id]);

    return (
        <Modal
            visible={visible}
            onCancel={onCancel}
            onOk={submitMove}
            okButtonProps={{ disabled: taskUpdating }}
            title={(
                <span>
                    {`Move task ${task?.id} to project`}
                    {/* TODO: replace placeholder */}
                    <Tooltip title='Some moving proccess description here'>
                        <QuestionCircleFilled className='ant-typography-secondary' />
                    </Tooltip>
                </span>
            )}
            className='cvat-task-move-modal'
        >
            <Row align='middle'>
                <Col>Project:</Col>
                <Col>
                    <ProjectSearch excludeId={task?.projectId} value={projectId} onSelect={setProjectId} />
                </Col>
            </Row>
            <Divider orientation='left'>Label mapping</Divider>
            {!!Object.keys(values).length && !taskUpdating &&
                task?.labels.map((label: any) => (
                    <LabelMapperItem
                        label={label}
                        key={label.id}
                        projectLabels={project?.labels}
                        value={values[label.id]}
                        labelMappers={Object.values(values)}
                        onChange={(value) => {
                            setValues({
                                ...values,
                                [value.labelId]: value,
                            });
                        }}
                    />
                ))}
        </Modal>
    );
}
