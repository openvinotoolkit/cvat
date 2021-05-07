// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { connect } from 'react-redux';

import CanvasWrapperComponent from 'components/annotation-page/canvas/canvas-wrapper3D';
import {
    activateObject,
    confirmCanvasReady,
    createAnnotationsAsync,
    dragCanvas,
    editShape,
    getContextImage,
    resetCanvas,
    shapeDrawn,
    updateAnnotationsAsync,
    updateCanvasContextMenu,
} from 'actions/annotation-actions';

import {
    ActiveControl,
    ColorBy,
    CombinedState,
    ContextMenuType,
    GridColor,
    ObjectType,
    Workspace,
} from 'reducers/interfaces';

import { Canvas3d } from 'cvat-canvas3d-wrapper';
import { Canvas } from 'cvat-canvas-wrapper';
import { KeyMap } from '../../../utils/mousetrap-react';

interface StateToProps {
    canvasInstance: Canvas3d | Canvas;
    jobInstance: any;
    frameData: any;
    curZLayer: number;
    contextImageHide: boolean;
    loaded: boolean;
    data: string;
    annotations: any[];
    sidebarCollapsed: boolean;
    activatedStateID: number | null;
    activatedAttributeID: number | null;
    selectedStatesID: number[];
    frameIssues: any[] | null;
    frameAngle: number;
    frameFetching: boolean;
    frame: number;
    opacity: number;
    colorBy: ColorBy;
    selectedOpacity: number;
    outlined: boolean;
    outlineColor: string;
    showBitmap: boolean;
    showProjections: boolean;
    grid: boolean;
    gridSize: number;
    gridColor: GridColor;
    gridOpacity: number;
    activeLabelID: number;
    activeObjectType: ObjectType;
    brightnessLevel: number;
    contrastLevel: number;
    saturationLevel: number;
    resetZoom: boolean;
    aamZoomMargin: number;
    contextMenuVisibility: boolean;
    showObjectsTextAlways: boolean;
    showAllInterpolationTracks: boolean;
    workspace: Workspace;
    minZLayer: number;
    maxZLayer: number;
    automaticBordering: boolean;
    switchableAutomaticBordering: boolean;
    keyMap: KeyMap;
    canvasBackgroundColor: string;
}

interface DispatchToProps {
    onDragCanvas: (enabled: boolean) => void;
    onSetupCanvas(): void;
    getContextImage(): void;
    onResetCanvas(): void;
    onCreateAnnotations(sessionInstance: any, frame: number, states: any[]): void;
    onUpdateAnnotations(states: any[]): void;
    onActivateObject: (activatedStateID: number | null) => void;
    onShapeDrawn: () => void;
    onEditShape: (enabled: boolean) => void;
    onUpdateContextMenu(visible: boolean, left: number, top: number, type: ContextMenuType, pointID?: number): void;
}

function mapStateToProps(state: CombinedState): StateToProps {
    const {
        annotation: {
            canvas: {
                activeControl,
                instance: canvasInstance,
                contextMenu: { visible: contextMenuVisibility },
            },
            drawing: { activeLabelID, activeObjectType },
            job: { instance: jobInstance },
            player: {
                frame: { data: frameData, number: frame, fetching: frameFetching },
                contextImage: { hidden: contextImageHide, data, loaded },
                frameAngles,
            },
            annotations: {
                states: annotations,
                activatedStateID,
                activatedAttributeID,
                selectedStatesID,
                zLayer: { cur: curZLayer, min: minZLayer, max: maxZLayer },
            },
            sidebarCollapsed,
            workspace,
        },
        settings: {
            player: {
                canvasBackgroundColor,
                grid,
                gridSize,
                gridColor,
                gridOpacity,
                brightnessLevel,
                contrastLevel,
                saturationLevel,
                resetZoom,
            },
            workspace: {
                aamZoomMargin, showObjectsTextAlways, showAllInterpolationTracks, automaticBordering,
            },
            shapes: {
                opacity, colorBy, selectedOpacity, outlined, outlineColor, showBitmap, showProjections,
            },
        },
        review: { frameIssues, issuesHidden },
        shortcuts: { keyMap },
    } = state;

    return {
        canvasInstance,
        jobInstance,
        frameData,
        curZLayer,
        contextImageHide,
        loaded,
        data,
        contextMenuVisibility,
        annotations,
        sidebarCollapsed,
        frameIssues:
            issuesHidden || ![Workspace.REVIEW_WORKSPACE, Workspace.STANDARD].includes(workspace) ? null : frameIssues,
        frameAngle: frameAngles[frame - jobInstance.startFrame],
        frameFetching,
        frame,
        activatedStateID,
        activatedAttributeID,
        selectedStatesID,
        opacity,
        colorBy,
        selectedOpacity,
        outlined,
        outlineColor,
        showBitmap,
        showProjections,
        grid,
        gridSize,
        gridColor,
        gridOpacity,
        activeLabelID,
        activeObjectType,
        brightnessLevel,
        contrastLevel,
        saturationLevel,
        resetZoom,
        aamZoomMargin,
        showObjectsTextAlways,
        showAllInterpolationTracks,
        minZLayer,
        maxZLayer,
        automaticBordering,
        workspace,
        keyMap,
        canvasBackgroundColor,
        switchableAutomaticBordering:
            activeControl === ActiveControl.DRAW_POLYGON ||
            activeControl === ActiveControl.DRAW_POLYLINE ||
            activeControl === ActiveControl.EDIT,
    };
}

function mapDispatchToProps(dispatch: any): DispatchToProps {
    return {
        onDragCanvas(enabled: boolean): void {
            dispatch(dragCanvas(enabled));
        },
        onSetupCanvas(): void {
            dispatch(confirmCanvasReady());
        },
        getContextImage(): void {
            dispatch(getContextImage());
        },
        onResetCanvas(): void {
            dispatch(resetCanvas());
        },
        onCreateAnnotations(sessionInstance: any, frame: number, states: any[]): void {
            dispatch(createAnnotationsAsync(sessionInstance, frame, states));
        },
        onShapeDrawn(): void {
            dispatch(shapeDrawn());
        },
        onActivateObject(activatedStateID: number | null): void {
            if (activatedStateID === null) {
                dispatch(updateCanvasContextMenu(false, 0, 0));
            }

            dispatch(activateObject(activatedStateID, null));
        },
        onEditShape(enabled: boolean): void {
            dispatch(editShape(enabled));
        },
        onUpdateAnnotations(states: any[]): void {
            dispatch(updateAnnotationsAsync(states));
        },
        onUpdateContextMenu(
            visible: boolean,
            left: number,
            top: number,
            type: ContextMenuType,
            pointID?: number,
        ): void {
            dispatch(updateCanvasContextMenu(visible, left, top, pointID, type));
        },
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(CanvasWrapperComponent);
