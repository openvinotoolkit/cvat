// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import Menu from 'antd/lib/menu';
import Button from 'antd/lib/button';
import Modal from 'antd/lib/modal';
import Icon, {
    LinkOutlined,
    CopyOutlined,
    BlockOutlined,
    GatewayOutlined,
    RetweetOutlined,
    DeleteOutlined,
} from '@ant-design/icons';

import {
    BackgroundIcon, ForegroundIcon, ResetPerspectiveIcon, ColorizeIcon,
} from 'icons';
import CVATTooltip from 'components/common/cvat-tooltip';
import { ObjectType, ShapeType, ColorBy } from 'reducers/interfaces';
import { Canvas } from 'cvat-canvas-wrapper';
import { Canvas3d } from 'cvat-canvas3d-wrapper';
import ColorPicker from './color-picker';

interface Props {
    canvasInstance: Canvas | Canvas3d;
    readonly: boolean;
    serverID: number | undefined;
    locked: boolean;
    shapeType: ShapeType;
    objectType: ObjectType;
    color: string;
    colorBy: ColorBy;
    colorPickerVisible: boolean;
    changeColorShortcut: string;
    copyShortcut: string;
    pasteShortcut: string;
    propagateShortcut: string;
    toBackgroundShortcut: string;
    toForegroundShortcut: string;
    removeShortcut: string;
    changeColor(value: string): void;
    copy(): void;
    remove(): void;
    propagate(): void;
    createURL(): void;
    switchOrientation(): void;
    toBackground(): void;
    toForeground(): void;
    resetCuboidPerspective(): void;
    changeColorPickerVisible(visible: boolean): void;
    activateTracking(): void;
}

interface ItemProps {
    toolProps: Props;
}

function CreateURLItem(props: ItemProps): JSX.Element {
    const { toolProps, ...rest } = props;
    const { serverID, createURL } = toolProps;
    return (
        <Menu.Item {...rest}>
            <Button disabled={serverID === undefined} type='link' icon={<LinkOutlined />} onClick={createURL}>
                Create object URL
            </Button>
        </Menu.Item>
    );
}

function MakeCopyItem(props: ItemProps): JSX.Element {
    const { toolProps, ...rest } = props;
    const { copyShortcut, pasteShortcut, copy } = toolProps;
    return (
        <Menu.Item {...rest}>
            <CVATTooltip title={`${copyShortcut} and ${pasteShortcut}`}>
                <Button type='link' icon={<CopyOutlined />} onClick={copy}>
                    Make a copy
                </Button>
            </CVATTooltip>
        </Menu.Item>
    );
}

function PropagateItem(props: ItemProps): JSX.Element {
    const { toolProps, ...rest } = props;
    const { propagateShortcut, propagate } = toolProps;
    return (
        <Menu.Item {...rest}>
            <CVATTooltip title={`${propagateShortcut}`}>
                <Button type='link' icon={<BlockOutlined />} onClick={propagate}>
                    Propagate
                </Button>
            </CVATTooltip>
        </Menu.Item>
    );
}

function TrackingItem(props: ItemProps): JSX.Element {
    const { toolProps, ...rest } = props;
    const { activateTracking } = toolProps;
    return (
        <Menu.Item {...rest}>
            <CVATTooltip title='Run tracking with the active tracker'>
                <Button type='link' icon={<GatewayOutlined />} onClick={activateTracking}>
                    Track
                </Button>
            </CVATTooltip>
        </Menu.Item>
    );
}

function SwitchOrientationItem(props: ItemProps): JSX.Element {
    const { toolProps, ...rest } = props;
    const { switchOrientation } = toolProps;
    return (
        <Menu.Item {...rest}>
            <Button type='link' icon={<RetweetOutlined />} onClick={switchOrientation}>
                Switch orientation
            </Button>
        </Menu.Item>
    );
}

function ResetPerspectiveItem(props: ItemProps): JSX.Element {
    const { toolProps, ...rest } = props;
    const { resetCuboidPerspective } = toolProps;
    return (
        <Menu.Item {...rest}>
            <Button type='link' onClick={resetCuboidPerspective}>
                <Icon component={ResetPerspectiveIcon} />
                Reset perspective
            </Button>
        </Menu.Item>
    );
}

function ToBackgroundItem(props: ItemProps): JSX.Element {
    const { toolProps, ...rest } = props;
    const { toBackgroundShortcut, toBackground } = toolProps;
    return (
        <Menu.Item {...rest}>
            <CVATTooltip title={`${toBackgroundShortcut}`}>
                <Button type='link' onClick={toBackground}>
                    <Icon component={BackgroundIcon} />
                    To background
                </Button>
            </CVATTooltip>
        </Menu.Item>
    );
}

function ToForegroundItem(props: ItemProps): JSX.Element {
    const { toolProps, ...rest } = props;
    const { toForegroundShortcut, toForeground } = toolProps;
    return (
        <Menu.Item {...rest}>
            <CVATTooltip title={`${toForegroundShortcut}`}>
                <Button type='link' onClick={toForeground}>
                    <Icon component={ForegroundIcon} />
                    To foreground
                </Button>
            </CVATTooltip>
        </Menu.Item>
    );
}

function SwitchColorItem(props: ItemProps): JSX.Element {
    const { toolProps, ...rest } = props;
    const {
        color,
        colorPickerVisible,
        changeColorShortcut,
        colorBy,
        changeColor,
        changeColorPickerVisible,
    } = toolProps;
    return (
        <Menu.Item {...rest}>
            <ColorPicker
                value={color}
                onChange={changeColor}
                visible={colorPickerVisible}
                onVisibleChange={changeColorPickerVisible}
                resetVisible={false}
            >
                <CVATTooltip title={`${changeColorShortcut}`}>
                    <Button type='link'>
                        <Icon component={ColorizeIcon} />
                        {`Change ${colorBy.toLowerCase()} color`}
                    </Button>
                </CVATTooltip>
            </ColorPicker>
        </Menu.Item>
    );
}

function RemoveItem(props: ItemProps): JSX.Element {
    const { toolProps, ...rest } = props;
    const { removeShortcut, locked, remove } = toolProps;
    return (
        <Menu.Item {...rest}>
            <CVATTooltip title={`${removeShortcut}`}>
                <Button
                    type='link'
                    icon={<DeleteOutlined />}
                    onClick={(): void => {
                        if (locked) {
                            Modal.confirm({
                                className: 'cvat-modal-confirm',
                                title: 'Object is locked',
                                content: 'Are you sure you want to remove it?',
                                onOk() {
                                    remove();
                                },
                            });
                        } else {
                            remove();
                        }
                    }}
                >
                    Remove
                </Button>
            </CVATTooltip>
        </Menu.Item>
    );
}

export default function ItemMenu(props: Props): JSX.Element {
    const {
        readonly, shapeType, objectType, colorBy, canvasInstance,
    } = props;

    const is2D = canvasInstance instanceof Canvas;

    return (
        <Menu className='cvat-object-item-menu' selectable={false}>
            <CreateURLItem toolProps={props} />
            {!readonly && <MakeCopyItem toolProps={props} />}
            {!readonly && <PropagateItem toolProps={props} />}
            {is2D && !readonly && objectType === ObjectType.TRACK && shapeType === ShapeType.RECTANGLE && (
                <TrackingItem toolProps={props} />
            )}
            {is2D && !readonly && [ShapeType.POLYGON, ShapeType.POLYLINE, ShapeType.CUBOID].includes(shapeType) && (
                <SwitchOrientationItem toolProps={props} />
            )}
            {is2D && !readonly && shapeType === ShapeType.CUBOID && <ResetPerspectiveItem toolProps={props} />}
            {is2D && objectType !== ObjectType.TAG && <ToBackgroundItem toolProps={props} />}
            {is2D && !readonly && objectType !== ObjectType.TAG && <ToForegroundItem toolProps={props} />}
            {[ColorBy.INSTANCE, ColorBy.GROUP].includes(colorBy) && <SwitchColorItem toolProps={props} />}
            {!readonly && <RemoveItem toolProps={props} />}
        </Menu>
    );
}
