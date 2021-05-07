// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { connect } from 'react-redux';
import { KeyMap } from 'utils/mousetrap-react';

import { Canvas } from 'cvat-canvas-wrapper';
import { Canvas3d } from 'cvat-canvas3d-wrapper';
import {
    hideShowContextImage,
    pasteShapeAsync,
    redrawShapeAsync,
    repeatDrawShapeAsync,
} from 'actions/annotation-actions';
import ControlsSideBarComponent from 'components/annotation-page/standard3D-workspace/controls-side-bar/controls-side-bar';
import { ActiveControl, CombinedState } from 'reducers/interfaces';

interface StateToProps {
    canvasInstance: Canvas | Canvas3d;
    activeControl: ActiveControl;
    keyMap: KeyMap;
    normalizedKeyMap: Record<string, string>;
    contextImageHide: boolean;
    loaded: boolean;
    labels: any[];
}

interface DispatchToProps {
    hideShowContextImage(hidden: boolean): void;
    repeatDrawShape(): void;
    redrawShape(): void;
    pasteShape(): void;
}

function mapStateToProps(state: CombinedState): StateToProps {
    const {
        annotation: {
            canvas: { instance: canvasInstance, activeControl },
            job: { labels },
            player: {
                contextImage: { hidden: contextImageHide, loaded },
            },
        },
        shortcuts: { keyMap, normalizedKeyMap },
    } = state;

    return {
        canvasInstance,
        activeControl,
        normalizedKeyMap,
        keyMap,
        contextImageHide,
        loaded,
        labels,
    };
}

function dispatchToProps(dispatch: any): DispatchToProps {
    return {
        hideShowContextImage(hidden: boolean): void {
            dispatch(hideShowContextImage(hidden));
        },
        repeatDrawShape(): void {
            dispatch(repeatDrawShapeAsync());
        },
        redrawShape(): void {
            dispatch(redrawShapeAsync());
        },
        pasteShape(): void {
            dispatch(pasteShapeAsync());
        },
    };
}

export default connect(mapStateToProps, dispatchToProps)(ControlsSideBarComponent);
