// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { connect } from 'react-redux';

import { KeyMap } from 'utils/mousetrap-react';
import { Canvas } from 'cvat-canvas-wrapper';
import ControlsSideBarComponent from 'components/annotation-page/standard3D-workspace/controls-side-bar/controls-side-bar';
import { ActiveControl, CombinedState } from 'reducers/interfaces';

interface StateToProps {
    canvasInstance: Canvas;
    activeControl: ActiveControl;
    keyMap: KeyMap;
    normalizedKeyMap: Record<string, string>;
    loaded: boolean;
}

function mapStateToProps(state: CombinedState): StateToProps {
    const {
        annotation: {
            canvas: { instance: canvasInstance, activeControl },
        },
        shortcuts: { keyMap, normalizedKeyMap },
    } = state;

    return {
        canvasInstance,
        activeControl,
        normalizedKeyMap,
        keyMap,
    };
}

export default connect(mapStateToProps)(ControlsSideBarComponent);
