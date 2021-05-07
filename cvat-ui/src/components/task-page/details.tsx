// Copyright (C) 2019-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { Row, Col } from 'antd/lib/grid';
import Tag from 'antd/lib/tag';
import { CheckCircleOutlined, CloudSyncOutlined, LoadingOutlined, WarningOutlined } from '@ant-design/icons';
import Modal from 'antd/lib/modal';
import notification from 'antd/lib/notification';
import Text from 'antd/lib/typography/Text';
import Title from 'antd/lib/typography/Title';
import moment from 'moment';

import getCore from 'cvat-core-wrapper';
import { getReposData, syncRepos } from 'utils/git-utils';
import { ActiveInference } from 'reducers/interfaces';
import AutomaticAnnotationProgress from 'components/tasks-page/automatic-annotation-progress';
import Descriptions from 'antd/lib/descriptions';
import { Button } from 'antd';
import UserSelector, { User } from './user-selector';
import BugTrackerEditor from './bug-tracker-editor';
import LabelsEditorComponent from '../labels-editor/labels-editor';
import ProjectSubsetField from '../create-task-page/project-subset-field';

const core = getCore();

interface Props {
    previewImage: string;
    taskInstance: any;
    installedGit: boolean; // change to git repos url
    activeInference: ActiveInference | null;
    projectSubsets: string[];
    cancelAutoAnnotation(): void;
    onTaskUpdate: (taskInstance: any) => void;
    onClowderSync: (taskInstance: any) => void;
}

interface State {
    name: string;
    subset: string;
    repository: string;
    repositoryStatus: string;
}

export default class DetailsComponent extends React.PureComponent<Props, State> {
    private mounted: boolean;

    private previewImageElement: HTMLImageElement;

    private previewWrapperRef: React.RefObject<HTMLDivElement>;

    constructor(props: Props) {
        super(props);

        const { taskInstance } = props;

        this.mounted = false;
        this.previewImageElement = new Image();
        this.previewWrapperRef = React.createRef<HTMLDivElement>();
        this.state = {
            name: taskInstance.name,
            subset: taskInstance.subset,
            repository: '',
            repositoryStatus: '',
        };
    }

    public componentDidMount(): void {
        const { taskInstance, previewImage } = this.props;
        const { previewImageElement, previewWrapperRef } = this;
        this.mounted = true;

        previewImageElement.onload = () => {
            const { height, width } = previewImageElement;
            if (width > height) {
                previewImageElement.style.width = '100%';
            } else {
                previewImageElement.style.height = '100%';
            }
        };

        previewImageElement.src = previewImage;
        previewImageElement.alt = 'Preview';
        if (previewWrapperRef.current) {
            previewWrapperRef.current.appendChild(previewImageElement);
        }

        getReposData(taskInstance.id)
            .then((data): void => {
                if (data !== null && this.mounted) {
                    if (data.status.error) {
                        notification.error({
                            message: 'Could not receive repository status',
                            description: data.status.error,
                        });
                    } else {
                        this.setState({
                            repositoryStatus: data.status.value,
                        });
                    }

                    this.setState({
                        repository: data.url,
                    });
                }
            })
            .catch((error): void => {
                if (this.mounted) {
                    notification.error({
                        message: 'Could not receive repository status',
                        description: error.toString(),
                    });
                }
            });
    }

    public componentDidUpdate(prevProps: Props): void {
        const { taskInstance } = this.props;

        if (prevProps !== this.props) {
            this.setState({
                name: taskInstance.name,
            });
        }
    }

    public componentWillUnmount(): void {
        this.mounted = false;
    }

    private renderTaskName(): JSX.Element {
        const { name } = this.state;
        const { taskInstance, onTaskUpdate } = this.props;

        return (
            <Title
                level={4}
                editable={{
                    onChange: (value: string): void => {
                        this.setState({
                            name: value,
                        });

                        taskInstance.name = value;
                        onTaskUpdate(taskInstance);
                    },
                }}
                className='cvat-text-color'
            >
                {name}
            </Title>
        );
    }

    private renderClowderSyncButton(): JSX.Element {
        const { taskInstance, onClowderSync } = this.props;

        return (
            <Title level={4}>
                <Button type='link' onClick={() => onClowderSync(taskInstance)}>
                    <CloudSyncOutlined />
                    Clowder Sync
                </Button>
            </Title>
        );
    }

    private renderPreview(): JSX.Element {
        const { previewWrapperRef } = this;

        // Add image on mount after get its width and height to fit it into wrapper
        return <div ref={previewWrapperRef} className='cvat-task-preview-wrapper' />;
    }

    private renderParameters(): JSX.Element {
        const { taskInstance } = this.props;
        const { overlap, segmentSize, imageQuality } = taskInstance;

        return (
            <Descriptions className='cvat-task-parameters' bordered layout='vertical' size='small'>
                <Descriptions.Item label='Overlap size'>{overlap}</Descriptions.Item>
                <Descriptions.Item label='Segment size'>{segmentSize}</Descriptions.Item>
                <Descriptions.Item label='Image quality'>{imageQuality}</Descriptions.Item>
            </Descriptions>
        );
    }

    private renderDescription(): JSX.Element {
        const { taskInstance, onTaskUpdate } = this.props;
        const owner = taskInstance.owner ? taskInstance.owner.username : null;
        const assignee = taskInstance.assignee ? taskInstance.assignee : null;
        const created = moment(taskInstance.createdDate).format('MMMM Do YYYY');
        const assigneeSelect = (
            <UserSelector
                value={assignee}
                onSelect={(value: User | null): void => {
                    taskInstance.assignee = value;
                    onTaskUpdate(taskInstance);
                }}
            />
        );

        return (
            <Row className='cvat-task-details-user-block' justify='space-between' align='middle'>
                <Col span={12}>
                    {owner && (
                        <Text type='secondary'>{`Task #${taskInstance.id} Created by ${owner} on ${created}`}</Text>
                    )}
                </Col>
                <Col span={10}>
                    <Text type='secondary'>Assigned to</Text>
                    {assigneeSelect}
                </Col>
            </Row>
        );
    }

    private renderDatasetRepository(): JSX.Element | boolean {
        const { taskInstance } = this.props;
        const { repository, repositoryStatus } = this.state;

        return (
            !!repository && (
                <Row>
                    <Col className='cvat-dataset-repository-url'>
                        <Text strong className='cvat-text-color'>
                            Dataset Repository
                        </Text>
                        <br />
                        <a href={repository} rel='noopener noreferrer' target='_blank'>
                            {repository}
                        </a>
                        {repositoryStatus === 'sync' && (
                            <Tag color='blue'>
                                <CheckCircleOutlined />
                                Synchronized
                            </Tag>
                        )}
                        {repositoryStatus === 'merged' && (
                            <Tag color='green'>
                                <CheckCircleOutlined />
                                Merged
                            </Tag>
                        )}
                        {repositoryStatus === 'syncing' && (
                            <Tag color='purple'>
                                <LoadingOutlined />
                                Syncing
                            </Tag>
                        )}
                        {repositoryStatus === '!sync' && (
                            <Tag
                                color='red'
                                onClick={(): void => {
                                    this.setState({
                                        repositoryStatus: 'syncing',
                                    });

                                    syncRepos(taskInstance.id)
                                        .then((): void => {
                                            if (this.mounted) {
                                                this.setState({
                                                    repositoryStatus: 'sync',
                                                });
                                            }
                                        })
                                        .catch((error): void => {
                                            if (this.mounted) {
                                                Modal.error({
                                                    width: 800,
                                                    title: 'Could not synchronize the repository',
                                                    content: error.toString(),
                                                });

                                                this.setState({
                                                    repositoryStatus: '!sync',
                                                });
                                            }
                                        });
                                }}
                            >
                                <WarningOutlined />
                                Synchronize
                            </Tag>
                        )}
                    </Col>
                </Row>
            )
        );
    }

    private renderLabelsEditor(): JSX.Element {
        const { taskInstance, onTaskUpdate } = this.props;

        return (
            <Row>
                <Col span={24}>
                    <LabelsEditorComponent
                        labels={taskInstance.labels.map((label: any): string => label.toJSON())}
                        onSubmit={(labels: any[]): void => {
                            taskInstance.labels = labels.map((labelData): any => new core.classes.Label(labelData));
                            onTaskUpdate(taskInstance);
                        }}
                    />
                </Col>
            </Row>
        );
    }

    private renderSubsetField(): JSX.Element {
        const { subset } = this.state;
        const { taskInstance, projectSubsets, onTaskUpdate } = this.props;

        return (
            <Row>
                <Col span={24}>
                    <Text className='cvat-text-color'>Subset:</Text>
                </Col>
                <Col span={24}>
                    <ProjectSubsetField
                        value={subset}
                        projectId={taskInstance.projectId}
                        projectSubsets={projectSubsets}
                        onChange={(value) => {
                            this.setState({
                                subset: value,
                            });

                            if (taskInstance.subset !== value) {
                                taskInstance.subset = value;
                                onTaskUpdate(taskInstance);
                            }
                        }}
                    />
                </Col>
            </Row>
        );
    }

    public render(): JSX.Element {
        const { activeInference, cancelAutoAnnotation, taskInstance, onTaskUpdate } = this.props;

        return (
            <div className='cvat-task-details'>
                <Row justify='space-between' align='middle'>
                    <Col className='cvat-task-details-task-name'>{this.renderTaskName()}</Col>
                    <Col>{this.renderClowderSyncButton()}</Col>
                </Row>
                <Row justify='space-between' align='top'>
                    <Col md={8} lg={7} xl={7} xxl={6}>
                        <Row justify='start' align='middle'>
                            <Col span={24}>{this.renderPreview()}</Col>
                        </Row>
                        <Row>
                            <Col span={24}>{this.renderParameters()}</Col>
                        </Row>
                    </Col>
                    <Col md={16} lg={17} xl={17} xxl={18}>
                        {this.renderDescription()}
                        <Row justify='space-between' align='middle'>
                            <Col span={12}>
                                <BugTrackerEditor
                                    instance={taskInstance}
                                    onChange={(bugTracker) => {
                                        taskInstance.bugTracker = bugTracker;
                                        onTaskUpdate(taskInstance);
                                    }}
                                />
                            </Col>
                            <Col span={10}>
                                <AutomaticAnnotationProgress
                                    activeInference={activeInference}
                                    cancelAutoAnnotation={cancelAutoAnnotation}
                                />
                            </Col>
                        </Row>
                        {this.renderDatasetRepository()}
                        {!taskInstance.projectId && this.renderLabelsEditor()}
                        {taskInstance.projectId && this.renderSubsetField()}
                    </Col>
                </Row>
            </div>
        );
    }
}
