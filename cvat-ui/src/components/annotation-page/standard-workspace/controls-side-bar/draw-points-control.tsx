// Copyright (C) 2020 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import Popover from 'antd/lib/popover';
import Icon from '@ant-design/icons';

import { Canvas } from 'cvat-canvas-wrapper';
import { PointIcon } from 'icons';
import { ShapeType } from 'reducers/interfaces';

import DrawShapePopoverContainer from 'containers/annotation-page/standard-workspace/controls-side-bar/draw-shape-popover';

interface Props {
    canvasInstance: Canvas;
    isDrawing: boolean;
}

function DrawPointsControl(props: Props): JSX.Element {
    const { canvasInstance, isDrawing } = props;

    const dynamcPopoverPros = isDrawing ?
        {
            overlayStyle: {
                display: 'none',
            },
        } :
        {};

    const dynamicIconProps = isDrawing ?
        {
            className: 'cvat-draw-points-control cvat-active-canvas-control',
            onClick: (): void => {
                canvasInstance.draw({ enabled: false });
            },
        } :
        {
            className: 'cvat-draw-points-control',
        };

    return (
        <Popover
            {...dynamcPopoverPros}
            overlayClassName='cvat-draw-shape-popover cvat-draw-shape-popover-points'
            placement='right'
            content={<DrawShapePopoverContainer shapeType={ShapeType.POINTS} />}
        >
            <Icon {...dynamicIconProps} component={PointIcon} />
        </Popover>
    );
}

export default React.memo(DrawPointsControl);
