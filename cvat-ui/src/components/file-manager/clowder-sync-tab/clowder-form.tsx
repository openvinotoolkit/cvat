// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import React, { ChangeEvent } from 'react';
import { Button, Col, Input, Popover, Row } from 'antd';
import Paragraph from 'antd/lib/typography/Paragraph';
import Text from 'antd/lib/typography/Text';
import { useDispatch, useSelector } from 'react-redux';
import { CloudSyncOutlined, ExclamationCircleOutlined, QuestionCircleTwoTone } from '@ant-design/icons';
import clowderApiGuide from 'assets/clowder-api-guide.png';
import { clowderActions, getRootFilesAsync } from 'actions/clowder-actions';
import { CombinedState } from 'reducers/interfaces';

function ClowderForm(): JSX.Element {
    const datasetId = useSelector((state: CombinedState) => state.clowder.datasetId);
    const apiKey = useSelector((state: CombinedState) => state.clowder.apiKey);

    const dispatch = useDispatch();

    const onSync = (): void => {
        dispatch(clowderActions.clearClowderTables());
        dispatch(getRootFilesAsync());
    };

    const handleChangeClowderApiKey = ({ target }: ChangeEvent): void => {
        dispatch(clowderActions.setApiKey((target as HTMLInputElement).value));
    };

    const handleChangeClowderDatasetId = ({ target }: ChangeEvent): void => {
        dispatch(clowderActions.setDatasetId((target as HTMLInputElement).value));
    };

    const handleImageClick = (): void => {
        const image = new Image();
        image.src = clowderApiGuide;

        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(image, 0, 0);
                const dataURL = canvas.toDataURL('image/png');

                const newTab = window.open();
                if (newTab) {
                    newTab.document.body.innerHTML = `<img src="${dataURL}" />`;
                }
            }
        };
    };

    const renderPopoverTitle = (): JSX.Element => (
        <>
            <QuestionCircleTwoTone style={{ marginRight: '8px' }} />
            User Clowder API Key
        </>
    );

    const renderPopoverContent = (): JSX.Element => (
        <Row style={{ maxWidth: '390px', minHeight: '270px' }}>
            <Row style={{ marginBottom: '8px' }}>
                You can get your “User Clowder API Key” in Clowder’s Profile Details. Then click “Api keys” tab and copy
                extraction key to the form.
            </Row>
            <Row style={{ fontStyle: 'italic', marginBottom: '4px' }}>Click to preview example:</Row>

            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
            <img
                src={clowderApiGuide}
                alt='clowder guide'
                style={{ maxWidth: '100%', cursor: 'zoom-in' }}
                onClick={handleImageClick}
                onKeyPress={handleImageClick}
            />
        </Row>
    );

    return (
        <>
            <Row style={{ marginBottom: '16px' }}>
                <Paragraph style={{ marginBottom: '8px' }}>
                    <Text className='cvat-text-color'>
                        <span style={{ marginRight: '8px' }}>User Clowder API key</span>

                        <Popover
                            placement='top'
                            title={renderPopoverTitle()}
                            content={renderPopoverContent()}
                            trigger='click'
                        >
                            <ExclamationCircleOutlined />
                        </Popover>
                    </Text>
                </Paragraph>

                <Input value={apiKey} onChange={handleChangeClowderApiKey} maxLength={200} onPressEnter={onSync} />
            </Row>

            <Row style={{ marginBottom: '8px' }}>
                <Col span={24}>
                    <Text className='cvat-text-color'>Dataset ID:</Text>
                </Col>
            </Row>

            <Row>
                <Col flex='auto'>
                    <Input
                        className='cvat-clowder-sync-tab-input'
                        value={datasetId}
                        onChange={handleChangeClowderDatasetId}
                        maxLength={200}
                        onPressEnter={onSync}
                    />
                </Col>

                <Col flex='none'>
                    <Button
                        className='cvat-clowder-sync-tab-btn'
                        type='primary'
                        icon={<CloudSyncOutlined />}
                        onClick={onSync}
                    >
                        Synchronize
                    </Button>
                </Col>
            </Row>
        </>
    );
}

export default React.memo(ClowderForm);
