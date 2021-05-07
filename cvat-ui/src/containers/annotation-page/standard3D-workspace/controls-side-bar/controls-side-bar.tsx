// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { connect } from 'react-redux';
import { KeyMap } from 'utils/mousetrap-react';

import { Canvas } from 'cvat-canvas-wrapper';
import { hideShowContextImage } from 'actions/annotation-actions';
import ControlsSideBarComponent from 'components/annotation-page/standard3D-workspace/controls-side-bar/controls-side-bar';
import { ActiveControl, CombinedState } from 'reducers/interfaces';

interface StateToProps {
    canvasInstance: Canvas;
    activeControl: ActiveControl;
    keyMap: KeyMap;
    normalizedKeyMap: Record<string, string>;
    contextImageHide: boolean;
    loaded: boolean;
}

interface DispatchToProps {
    hideShowContextImage(hidden: boolean): void;
}

function mapStateToProps(state: CombinedState): StateToProps {
    const {
        annotation: {
            canvas: { instance: canvasInstance, activeControl },
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
    };
}

function dispatchToProps(dispatch: any): DispatchToProps {
    return {
        hideShowContextImage(hidden: boolean): void {
            dispatch(hideShowContextImage(hidden));
        },
    };
}

export default connect(mapStateToProps, dispatchToProps)(ControlsSideBarComponent);
