// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React, { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router';
import { withRouter } from 'react-router-dom';
import { Row, Col } from 'antd/lib/grid';
import { LoadingOutlined, QuestionCircleOutlined, CopyOutlined } from '@ant-design/icons';
import { ColumnFilterItem } from 'antd/lib/table/interface';
import Table from 'antd/lib/table';
import Button from 'antd/lib/button';
import Text from 'antd/lib/typography/Text';
import moment from 'moment';
import copy from 'copy-to-clipboard';
import { CombinedState } from 'reducers/interfaces';
import { connect } from 'react-redux';

import CVATTooltip from 'components/common/cvat-tooltip';

import getCore from 'cvat-core-wrapper';
import UserSelector, { User } from './user-selector';

const core = getCore();

const baseURL = core.config.backendAPI.slice(0, -7);

interface Props {
    taskInstance: any;
    onJobUpdate(jobInstance: any): void;
    currentJobsPage: number;
    setCurrentJobsPage(taskID: number, pageNumber: number): void;
}

interface StateToProps {
    currentJobsPage: number;
}

function mapStateToProps(state: CombinedState): StateToProps {
    console.log('State2:', state);
    return {
        currentJobsPage: state.tasks.current[0].currentJobsPage,
    };
}

function ReviewSummaryComponent({ jobInstance }: { jobInstance: any }): JSX.Element {
    const [summary, setSummary] = useState<Record<string, any> | null>(null);
    const [error, setError] = useState<any>(null);
    useEffect(() => {
        setError(null);
        jobInstance
            .reviewsSummary()
            .then((_summary: Record<string, any>) => {
                setSummary(_summary);
            })
            .catch((_error: any) => {
                // eslint-disable-next-line
                console.log(_error);
                setError(_error);
            });
    }, []);

    if (!summary) {
        if (error) {
            if (error.toString().includes('403')) {
                return <p>You do not have permissions</p>;
            }

            return <p>Could not fetch, check console output</p>;
        }

        return (
            <>
                <p>Loading.. </p>
                <LoadingOutlined />
            </>
        );
    }

    return (
        <table className='cvat-review-summary-description'>
            <tbody>
                <tr>
                    <td>
                        <Text strong>Reviews</Text>
                    </td>
                    <td>{summary.reviews}</td>
                </tr>
                <tr>
                    <td>
                        <Text strong>Average quality</Text>
                    </td>
                    <td>{Number.parseFloat(summary.average_estimated_quality).toFixed(2)}</td>
                </tr>
                <tr>
                    <td>
                        <Text strong>Unsolved issues</Text>
                    </td>
                    <td>{summary.issues_unsolved}</td>
                </tr>
                <tr>
                    <td>
                        <Text strong>Resolved issues</Text>
                    </td>
                    <td>{summary.issues_resolved}</td>
                </tr>
            </tbody>
        </table>
    );
}

function JobListComponent(props: Props & RouteComponentProps): JSX.Element {
    const {
        taskInstance,
        onJobUpdate,
        history: { push },
        currentJobsPage,
        setCurrentJobsPage,
    } = props;

    const { jobs, id: taskId } = taskInstance;

    function sorter(path: string) {
        return (obj1: any, obj2: any): number => {
            let currentObj1 = obj1;
            let currentObj2 = obj2;
            let field1: string | null = null;
            let field2: string | null = null;
            for (const pathSegment of path.split('.')) {
                field1 = currentObj1 && pathSegment in currentObj1 ? currentObj1[pathSegment] : null;
                field2 = currentObj2 && pathSegment in currentObj2 ? currentObj2[pathSegment] : null;
                currentObj1 = currentObj1 && pathSegment in currentObj1 ? currentObj1[pathSegment] : null;
                currentObj2 = currentObj2 && pathSegment in currentObj2 ? currentObj2[pathSegment] : null;
            }

            if (field1 && field2) {
                return field1.localeCompare(field2);
            }

            if (field1 === null) {
                return 1;
            }

            return -1;
        };
    }

    function collectUsers(path: string): ColumnFilterItem[] {
        return Array.from<string | null>(
            new Set(
                jobs.map((job: any) => {
                    if (job[path] === null) {
                        return null;
                    }

                    return job[path].username;
                }),
            ),
        ).map((value: string | null) => ({ text: value || 'Is Empty', value: value || false }));
    }

    const columns = [
        {
            title: 'Job',
            dataIndex: 'job',
            key: 'job',
            render: (id: number): JSX.Element => (
                <div>
                    <Button
                        type='link'
                        onClick={(e: React.MouseEvent): void => {
                            e.preventDefault();
                            push(`/tasks/${taskId}/jobs/${id}`);
                        }}
                        href={`/tasks/${taskId}/jobs/${id}`}
                    >
                        {`Job #${id}`}
                    </Button>
                </div>
            ),
        },
        {
            title: 'Frames',
            dataIndex: 'frames',
            key: 'frames',
            className: 'cvat-text-color cvat-job-item-frames',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            className: 'cvat-job-item-status',
            render: (jobInstance: any): JSX.Element => {
                const { status } = jobInstance;
                let progressColor = null;
                if (status === 'completed') {
                    progressColor = 'cvat-job-completed-color';
                } else if (status === 'validation') {
                    progressColor = 'cvat-job-validation-color';
                } else {
                    progressColor = 'cvat-job-annotation-color';
                }

                return (
                    <Text strong className={progressColor}>
                        {status}
                        <CVATTooltip title={<ReviewSummaryComponent jobInstance={jobInstance} />}>
                            <QuestionCircleOutlined />
                        </CVATTooltip>
                    </Text>
                );
            },
            sorter: sorter('status.status'),
            filters: [
                { text: 'annotation', value: 'annotation' },
                { text: 'validation', value: 'validation' },
                { text: 'completed', value: 'completed' },
            ],
            onFilter: (value: string | number | boolean, record: any) => record.status.status === value,
        },
        {
            title: 'Started on',
            dataIndex: 'started',
            key: 'started',
            className: 'cvat-text-color',
        },
        {
            title: 'Duration',
            dataIndex: 'duration',
            key: 'duration',
            className: 'cvat-text-color',
        },
        {
            title: 'Assignee',
            dataIndex: 'assignee',
            key: 'assignee',
            className: 'cvat-job-item-assignee',
            render: (jobInstance: any): JSX.Element => (
                <UserSelector
                    className='cvat-job-assignee-selector'
                    value={jobInstance.assignee}
                    onSelect={(value: User | null): void => {
                        // eslint-disable-next-line
                        jobInstance.assignee = value;
                        onJobUpdate(jobInstance);
                    }}
                />
            ),
            sorter: sorter('assignee.assignee.username'),
            filters: collectUsers('assignee'),
            onFilter: (value: string | number | boolean, record: any) =>
                (record.assignee.assignee?.username || false) === value,
        },
        {
            title: 'Reviewer',
            dataIndex: 'reviewer',
            key: 'reviewer',
            className: 'cvat-job-item-reviewer',
            render: (jobInstance: any): JSX.Element => (
                <UserSelector
                    className='cvat-job-reviewer-selector'
                    value={jobInstance.reviewer}
                    onSelect={(value: User | null): void => {
                        // eslint-disable-next-line
                        jobInstance.reviewer = value;
                        onJobUpdate(jobInstance);
                    }}
                />
            ),
            sorter: sorter('reviewer.reviewer.username'),
            filters: collectUsers('reviewer'),
            onFilter: (value: string | number | boolean, record: any) =>
                (record.reviewer.reviewer?.username || false) === value,
        },
    ];

    const onChange = function (newPage: number): void {
        // console.log("props.currentJobsPAge:", currentJobsPage);
        // console.log("update page to:", newPage);
        setCurrentJobsPage(taskId, newPage);
    };

    let completed = 0;
    const data = jobs.reduce((acc: any[], job: any) => {
        if (job.status === 'completed') {
            completed++;
        }

        const created = moment(props.taskInstance.createdDate);

        const now = moment(moment.now());
        acc.push({
            key: job.id,
            job: job.id,
            frames: `${job.startFrame}-${job.stopFrame}`,
            status: job,
            started: `${created.format('MMMM Do YYYY HH:MM')}`,
            duration: `${moment.duration(now.diff(created)).humanize()}`,
            assignee: job,
            reviewer: job,
        });

        return acc;
    }, []);

    return (
        <div className='cvat-task-job-list'>
            <Row justify='space-between' align='middle'>
                <Col>
                    <Text className='cvat-text-color cvat-jobs-header'> Jobs </Text>
                    <CVATTooltip trigger='click' title='Copied to clipboard!'>
                        <Button
                            type='link'
                            onClick={(): void => {
                                let serialized = '';
                                const [latestJob] = [...taskInstance.jobs].reverse();
                                for (const job of taskInstance.jobs) {
                                    serialized += `Job #${job.id}`.padEnd(`${latestJob.id}`.length + 6, ' ');
                                    serialized += `: ${baseURL}/?id=${job.id}`.padEnd(
                                        `${latestJob.id}`.length + baseURL.length + 8,
                                        ' ',
                                    );
                                    serialized += `: [${job.startFrame}-${job.stopFrame}]`.padEnd(
                                        `${latestJob.startFrame}${latestJob.stopFrame}`.length + 5,
                                        ' ',
                                    );

                                    if (job.assignee) {
                                        serialized += `\t assigned to "${job.assignee.username}"`;
                                    }

                                    if (job.reviewer) {
                                        serialized += `\t reviewed by "${job.reviewer.username}"`;
                                    }

                                    serialized += '\n';
                                }
                                copy(serialized);
                            }}
                        >
                            <CopyOutlined />
                            Copy
                        </Button>
                    </CVATTooltip>
                </Col>
                <Col>
                    <Text className='cvat-text-color'>{`${completed} of ${data.length} jobs`}</Text>
                </Col>
            </Row>
            <Table
                className='cvat-task-jobs-table'
                rowClassName={() => 'cvat-task-jobs-table-row'}
                columns={columns}
                dataSource={data}
                size='small'
                pagination={{
                    current: currentJobsPage,
                    onChange,
                    position: ['topRight', 'bottomRight'],
                    defaultPageSize: 10,
                    showSizeChanger: true,
                }}
            />
        </div>
    );
}

export default withRouter(connect(mapStateToProps)(JobListComponent));
