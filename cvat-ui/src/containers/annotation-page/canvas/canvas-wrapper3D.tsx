// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { connect } from 'react-redux';

import CanvasWrapperComponent from 'components/annotation-page/canvas/canvas-wrapper3D';
import { confirmCanvasReady, resetCanvas } from 'actions/annotation-actions';

import { CombinedState } from 'reducers/interfaces';

import { Canvas3d } from 'cvat-canvas3d-wrapper';

interface StateToProps {
    canvasInstance: Canvas3d;
    jobInstance: any;
    frameData: any;
    curZLayer: number;
    annotations: any[];
}

interface DispatchToProps {
    onSetupCanvas(): void;
    onResetCanvas(): void;
}

function mapStateToProps(state: CombinedState): StateToProps {
    const {
        annotation: {
            canvas: { instance: canvasInstance },
            job: { instance: jobInstance },
            player: {
                frame: { data: frameData },
            },
            annotations: {
                states: annotations,
                zLayer: { cur: curZLayer },
            },
        },
    } = state;

    return {
        canvasInstance,
        jobInstance,
        frameData,
        curZLayer,
        annotations,
    };
}

function mapDispatchToProps(dispatch: any): DispatchToProps {
    return {
        onSetupCanvas(): void {
            dispatch(confirmCanvasReady());
        },
        onResetCanvas(): void {
            dispatch(resetCanvas());
        },
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(CanvasWrapperComponent);
