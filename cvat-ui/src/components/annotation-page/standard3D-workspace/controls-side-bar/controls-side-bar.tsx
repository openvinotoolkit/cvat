// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import Layout from 'antd/lib/layout';
import { ActiveControl } from 'reducers/interfaces';
import { Canvas3d as Canvas } from 'cvat-canvas3d-wrapper';
import CursorControl from './cursor-control';
import MoveControl from './move-control';
import DrawCuboidControl from './draw-cuboid-control';

interface Props {
    canvasInstance: Canvas;
    activeControl: ActiveControl;
    normalizedKeyMap: Record<string, string>;
}

export default function ControlsSideBarComponent(props: Props): JSX.Element {
    const { canvasInstance, activeControl, normalizedKeyMap } = props;

    return (
        <Layout.Sider className='cvat-canvas-controls-sidebar' theme='light' width={44}>
            <MoveControl canvasInstance={canvasInstance} activeControl={activeControl} />
            <CursorControl
                cursorShortkey={normalizedKeyMap.CANCEL}
                canvasInstance={canvasInstance}
                activeControl={activeControl}
            />

            <DrawCuboidControl
                canvasInstance={canvasInstance}
                isDrawing={activeControl === ActiveControl.DRAW_CUBOID}
            />
        </Layout.Sider>
    );
}
