// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import React from 'react';
import { Button, Col, Divider, Row } from 'antd';

interface Props {
    title: string;
    selectedFilesCount: number;
    btnIcon: JSX.Element;
    btnTitle: string;
    handleClick: () => void;
}

function ClowderTopPanel(props: Props): JSX.Element {
    const { title, selectedFilesCount, btnIcon, btnTitle, handleClick } = props;

    return (
        <Row align='middle' justify='space-between' style={{ marginBottom: 8 }}>
            <Col>{title}</Col>

            <Col>
                <Row align='middle'>
                    <Col>
                        Selected:&nbsp;
                        {selectedFilesCount}
                    </Col>

                    <Col>
                        <Divider type='vertical' className='cvat-clowder-top-panel-separator' />
                    </Col>

                    <Col>
                        <Button
                            className='cvat-clowder-top-panel-btn'
                            type='link'
                            shape='circle'
                            icon={btnIcon}
                            disabled={!selectedFilesCount}
                            onClick={handleClick}
                        >
                            {btnTitle}
                        </Button>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
}

export default React.memo(ClowderTopPanel);
