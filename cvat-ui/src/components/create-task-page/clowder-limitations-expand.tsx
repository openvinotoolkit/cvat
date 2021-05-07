// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import React, { useState } from 'react';
import { Col, Row } from 'antd';
import { DownOutlined, UpOutlined, WarningTwoTone } from '@ant-design/icons';

function ClowderLimitationsExpand(): JSX.Element {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <Row
            style={{
                padding: '8px 16px',
                margin: '4px 0 16px',
                borderRadius: '3px',
                border: '1px solid #91D5FF',
                background: '#E6F7FF',
                cursor: 'pointer',
            }}
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <Col flex='auto'>
                <Row align='middle'>
                    <Col>
                        <WarningTwoTone style={{ fontSize: '16px', marginRight: '8px' }} />
                    </Col>

                    <Col>Limitations for uploading</Col>

                    <Col style={{ marginLeft: 'auto' }}>{isExpanded ? <UpOutlined /> : <DownOutlined />}</Col>
                </Row>
            </Col>

            {isExpanded && (
                <ul style={{ margin: '8px 0 0' }}>
                    <li>All uploaded files must have different names</li>

                    <li>
                        Either a single video/archive/pdf/zip, or a set of images and directories can be uploaded for
                        one task
                    </li>
                </ul>
            )}
        </Row>
    );
}

export default React.memo(ClowderLimitationsExpand);
