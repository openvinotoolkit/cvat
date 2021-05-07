// Copyright (C) 2019-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import React, { useEffect } from 'react';
import { useLocation } from 'react-router';
import { Row, Col } from 'antd/lib/grid';
import Modal from 'antd/lib/modal';
import Text from 'antd/lib/typography/Text';
import Paragraph from 'antd/lib/typography/Paragraph';
import TextArea from 'antd/lib/input/TextArea';

import CreateTaskContent, { CreateTaskData } from './create-task-content';

interface Props {
    onCreate: (data: CreateTaskData) => void;
    status: string;
    error: string;
    taskId: number | null;
    installedGit: boolean;
    clowderSyncing: boolean;
}

export default function CreateTaskPage(props: Props): JSX.Element {
    const { error, status, taskId, onCreate, installedGit, clowderSyncing } = props;

    const location = useLocation();

    let projectId = null;
    const params = new URLSearchParams(location.search);
    if (params.get('projectId')?.match(/^[1-9]+[0-9]*$/)) {
        projectId = +(params.get('projectId') as string);
    }

    useEffect(() => {
        if (error) {
            let errorCopy = error;
            const sshKeys: string[] = [];
            while (errorCopy.length) {
                const startIndex = errorCopy.search(/'ssh/);
                if (startIndex === -1) break;
                let sshKey = errorCopy.slice(startIndex + 1);
                const stopIndex = sshKey.search(/'/);
                sshKey = sshKey.slice(0, stopIndex);
                sshKeys.push(sshKey);
                errorCopy = errorCopy.slice(stopIndex + 1);
            }

            if (sshKeys.length) {
                Modal.error({
                    width: 800,
                    title: 'Could not clone the repository',
                    className: 'cvat-create-task-clone-repository-fail',
                    content: (
                        <>
                            <Paragraph>
                                <Text>Please make sure it exists and you have access</Text>
                            </Paragraph>
                            <Paragraph>
                                <Text>Consider adding the following public ssh keys to git: </Text>
                            </Paragraph>
                            <TextArea rows={10} value={sshKeys.join('\n\n')} />
                        </>
                    ),
                });
            }
        }
    }, [error, clowderSyncing]);

    return (
        <Row justify='center' align='top' className='cvat-create-task-form-wrapper'>
            <Col md={20} lg={16} xl={14} xxl={9}>
                <Text className='cvat-title'>Create a new task</Text>
                <CreateTaskContent
                    taskId={taskId}
                    projectId={projectId}
                    status={status}
                    onCreate={onCreate}
                    installedGit={installedGit}
                    clowderSyncing={clowderSyncing}
                />
            </Col>
        </Row>
    );
}
