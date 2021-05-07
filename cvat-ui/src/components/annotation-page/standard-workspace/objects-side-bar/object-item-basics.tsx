// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React, { useState } from 'react';
import { Row, Col } from 'antd/lib/grid';
import { MoreOutlined } from '@ant-design/icons';
import Dropdown from 'antd/lib/dropdown';
import Text from 'antd/lib/typography/Text';

import { ObjectType, ShapeType, ColorBy } from 'reducers/interfaces';
import CVATTooltip from 'components/common/cvat-tooltip';
import { Canvas } from 'cvat-canvas-wrapper';
import { Canvas3d } from 'cvat-canvas3d-wrapper';
import LabelSelector from 'components/label-selector/label-selector';
import ItemMenu from './object-item-menu';

interface Props {
    canvasInstance: Canvas | Canvas3d;
    readonly: boolean;
    clientID: number;
    serverID: number | undefined;
    labelID: number;
    labels: any[];
    shapeType: ShapeType;
    objectType: ObjectType;
    color: string;
    colorBy: ColorBy;
    type: string;
    locked: boolean;
    changeColorShortcut: string;
    copyShortcut: string;
    pasteShortcut: string;
    propagateShortcut: string;
    toBackgroundShortcut: string;
    toForegroundShortcut: string;
    removeShortcut: string;
    changeColor(color: string): void;
    changeLabel(label: any): void;
    copy(): void;
    remove(): void;
    propagate(): void;
    createURL(): void;
    switchOrientation(): void;
    toBackground(): void;
    toForeground(): void;
    resetCuboidPerspective(): void;
    activateTracking(): void;
}

function ItemTopComponent(props: Props): JSX.Element {
    const {
        readonly,
        clientID,
        serverID,
        labelID,
        labels,
        shapeType,
        objectType,
        color,
        colorBy,
        type,
        locked,
        changeColorShortcut,
        copyShortcut,
        pasteShortcut,
        propagateShortcut,
        toBackgroundShortcut,
        toForegroundShortcut,
        removeShortcut,
        changeColor,
        changeLabel,
        copy,
        remove,
        propagate,
        createURL,
        switchOrientation,
        toBackground,
        toForeground,
        resetCuboidPerspective,
        activateTracking,
        canvasInstance,
    } = props;

    const [menuVisible, setMenuVisible] = useState(false);
    const [colorPickerVisible, setColorPickerVisible] = useState(false);

    const changeMenuVisible = (visible: boolean): void => {
        if (!visible && colorPickerVisible) return;
        setMenuVisible(visible);
    };

    const changeColorPickerVisible = (visible: boolean): void => {
        if (!visible) {
            setMenuVisible(false);
        }
        setColorPickerVisible(visible);
    };

    return (
        <Row align='middle'>
            <Col span={10}>
                <Text style={{ fontSize: 12 }}>{clientID}</Text>
                <br />
                <Text
                    type='secondary'
                    style={{ fontSize: 10 }}
                    className='cvat-objects-sidebar-state-item-object-type-text'
                >
                    {type}
                </Text>
            </Col>
            <Col span={12}>
                <CVATTooltip title='Change current label'>
                    <LabelSelector
                        disabled={readonly}
                        size='small'
                        labels={labels}
                        value={labelID}
                        onChange={changeLabel}
                        className='cvat-objects-sidebar-state-item-label-selector'
                    />
                </CVATTooltip>
            </Col>
            <Col span={2}>
                <Dropdown
                    visible={menuVisible}
                    onVisibleChange={changeMenuVisible}
                    placement='bottomLeft'
                    overlay={ItemMenu({
                        canvasInstance,
                        readonly,
                        serverID,
                        locked,
                        shapeType,
                        objectType,
                        color,
                        colorBy,
                        colorPickerVisible,
                        changeColorShortcut,
                        copyShortcut,
                        pasteShortcut,
                        propagateShortcut,
                        toBackgroundShortcut,
                        toForegroundShortcut,
                        removeShortcut,
                        changeColor,
                        copy,
                        remove,
                        propagate,
                        createURL,
                        switchOrientation,
                        toBackground,
                        toForeground,
                        resetCuboidPerspective,
                        changeColorPickerVisible,
                        activateTracking,
                    })}
                >
                    <MoreOutlined />
                </Dropdown>
            </Col>
        </Row>
    );
}

export default React.memo(ItemTopComponent);
