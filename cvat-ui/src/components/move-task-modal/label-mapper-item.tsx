// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { Col, Row } from 'antd/lib/grid';
import Tag from 'antd/lib/tag';
import Select from 'antd/lib/select';
import Checkbox from 'antd/lib/checkbox';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';

export interface LabelMapperItemValue {
    labelId: number;
    newLabelName: string | null;
    clearAtrributes: boolean;
}

export interface LabelMapperItemProps {
    label: any;
    projectLabels?: any[];
    value: LabelMapperItemValue;
    labelMappers: LabelMapperItemValue[];
    onChange: (value: LabelMapperItemValue) => void;
}

export default function LabelMapperItem(props: LabelMapperItemProps): JSX.Element {
    const {
        label, value, onChange, projectLabels, labelMappers,
    } = props;

    const labelNames = labelMappers.map((mapper) => mapper.newLabelName).filter((el) => el);

    return (
        <Row className='cvat-move-task-label-mapper-item' align='middle'>
            <Col span={6}>
                {label.name.length > 12 ? (
                    <Tooltip overlay={label.name}>
                        <Tag color={label.color}>
                            {`${label.name.slice(0, 12)}...`}
                        </Tag>
                    </Tooltip>
                ) : (
                    <Tag color={label.color}>
                        {label.name}
                    </Tag>
                )}
                <ArrowRightOutlined />
            </Col>
            <Col>
                <Select
                    disabled={typeof projectLabels === 'undefined'}
                    value={value.newLabelName || ''}
                    onChange={(_value) =>
                        onChange({
                            ...value,
                            newLabelName: _value as string,
                        })}
                >
                    {projectLabels?.filter((_label) => (
                        !labelNames.includes(_label.name)
                    )).map((_label) => (
                        <Select.Option key={_label.id} value={_label.name}>
                            {_label.name}
                        </Select.Option>
                    ))}
                </Select>
            </Col>
            <Col>
                <Checkbox
                    disabled
                    checked={value.clearAtrributes}
                    onChange={(_value) =>
                        onChange({
                            ...value,
                            clearAtrributes: _value.target.checked,
                        })}
                >
                    Clear attributes
                </Checkbox>
            </Col>
        </Row>
    );
}
