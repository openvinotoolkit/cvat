// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { connect } from 'react-redux';
import { KeyMap } from 'utils/mousetrap-react';

import CanvasWrapperComponent from 'components/annotation-page/canvas/canvas-wrapper';
import {
    confirmCanvasReady,
    dragCanvas,
    zoomCanvas,
    resetCanvas,
    shapeDrawn,
    mergeObjects,
    groupObjects,
    splitTrack,
    editShape,
    updateAnnotationsAsync,
    createAnnotationsAsync,
    mergeAnnotationsAsync,
    groupAnnotationsAsync,
    splitAnnotationsAsync,
    activateObject,
    selectObjects,
    updateCanvasContextMenu,
    addZLayer,
    switchZLayer,
    fetchAnnotationsAsync,
    getDataFailed,
} from 'actions/annotation-actions';
import {
    switchGrid,
    changeGridColor,
    changeGridOpacity,
    changeBrightnessLevel,
    changeContrastLevel,
    changeSaturationLevel,
    switchAutomaticBordering,
} from 'actions/settings-actions';
import { reviewActions } from 'actions/review-actions';
import {
    ColorBy,
    GridColor,
    ObjectType,
    CombinedState,
    ContextMenuType,
    Workspace,
    ActiveControl,
} from 'reducers/interfaces';

import { Canvas } from 'cvat-canvas-wrapper';
import { Canvas3d } from 'cvat-canvas3d-wrapper';

interface StateToProps {
    sidebarCollapsed: boolean;
    canvasInstance: Canvas | Canvas3d;
    jobInstance: any;
    activatedStateID: number | null;
    activatedAttributeID: number | null;
    selectedStatesID: number[];
    annotations: any[];
    frameIssues: any[] | null;
    frameData: any;
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
    showObjectsTextAlways: boolean;
    showAllInterpolationTracks: boolean;
    workspace: Workspace;
    minZLayer: number;
    maxZLayer: number;
    curZLayer: number;
    automaticBordering: boolean;
    switchableAutomaticBordering: boolean;
    keyMap: KeyMap;
    canvasBackgroundColor: string;
}

interface DispatchToProps {
    onSetupCanvas(): void;
    onDragCanvas: (enabled: boolean) => void;
    onZoomCanvas: (enabled: boolean) => void;
    onResetCanvas: () => void;
    onShapeDrawn: () => void;
    onMergeObjects: (enabled: boolean) => void;
    onGroupObjects: (enabled: boolean) => void;
    onSplitTrack: (enabled: boolean) => void;
    onEditShape: (enabled: boolean) => void;
    onUpdateAnnotations(states: any[]): void;
    onCreateAnnotations(sessionInstance: any, frame: number, states: any[]): void;
    onMergeAnnotations(sessionInstance: any, frame: number, states: any[]): void;
    onGroupAnnotations(sessionInstance: any, frame: number, states: any[]): void;
    onSplitAnnotations(sessionInstance: any, frame: number, state: any): void;
    onActivateObject: (activatedStateID: number | null) => void;
    onSelectObjects: (selectedStatesID: number[]) => void;
    onUpdateContextMenu(visible: boolean, left: number, top: number, type: ContextMenuType, pointID?: number): void;
    onAddZLayer(): void;
    onSwitchZLayer(cur: number): void;
    onChangeBrightnessLevel(level: number): void;
    onChangeContrastLevel(level: number): void;
    onChangeSaturationLevel(level: number): void;
    onChangeGridOpacity(opacity: number): void;
    onChangeGridColor(color: GridColor): void;
    onSwitchGrid(enabled: boolean): void;
    onSwitchAutomaticBordering(enabled: boolean): void;
    onFetchAnnotation(): void;
    onGetDataFailed(error: any): void;
    onStartIssue(position: number[]): void;
}

function mapStateToProps(state: CombinedState): StateToProps {
    const {
        annotation: {
            canvas: { activeControl, instance: canvasInstance },
            drawing: { activeLabelID, activeObjectType },
            job: { instance: jobInstance },
            player: {
                frame: { data: frameData, number: frame, fetching: frameFetching },
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
                aamZoomMargin,
                showObjectsTextAlways,
                showAllInterpolationTracks,
                automaticBordering,
                intelligentPolygonCrop,
            },
            shapes: {
                opacity, colorBy, selectedOpacity, outlined, outlineColor, showBitmap, showProjections,
            },
        },
        review: { frameIssues, issuesHidden },
        shortcuts: { keyMap },
    } = state;

    return {
        sidebarCollapsed,
        canvasInstance,
        jobInstance,
        frameIssues:
            issuesHidden || ![Workspace.REVIEW_WORKSPACE, Workspace.STANDARD].includes(workspace) ? null : frameIssues,
        frameData,
        frameAngle: frameAngles[frame - jobInstance.startFrame],
        frameFetching,
        frame,
        activatedStateID,
        activatedAttributeID,
        selectedStatesID,
        annotations,
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
        curZLayer,
        minZLayer,
        maxZLayer,
        automaticBordering,
        intelligentPolygonCrop,
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
        onSetupCanvas(): void {
            dispatch(confirmCanvasReady());
        },
        onDragCanvas(enabled: boolean): void {
            dispatch(dragCanvas(enabled));
        },
        onZoomCanvas(enabled: boolean): void {
            dispatch(zoomCanvas(enabled));
        },
        onResetCanvas(): void {
            dispatch(resetCanvas());
        },
        onShapeDrawn(): void {
            dispatch(shapeDrawn());
        },
        onMergeObjects(enabled: boolean): void {
            dispatch(mergeObjects(enabled));
        },
        onGroupObjects(enabled: boolean): void {
            dispatch(groupObjects(enabled));
        },
        onSplitTrack(enabled: boolean): void {
            dispatch(splitTrack(enabled));
        },
        onEditShape(enabled: boolean): void {
            dispatch(editShape(enabled));
        },
        onUpdateAnnotations(states: any[]): void {
            dispatch(updateAnnotationsAsync(states));
        },
        onCreateAnnotations(sessionInstance: any, frame: number, states: any[]): void {
            dispatch(createAnnotationsAsync(sessionInstance, frame, states));
        },
        onMergeAnnotations(sessionInstance: any, frame: number, states: any[]): void {
            dispatch(mergeAnnotationsAsync(sessionInstance, frame, states));
        },
        onGroupAnnotations(sessionInstance: any, frame: number, states: any[]): void {
            dispatch(groupAnnotationsAsync(sessionInstance, frame, states));
        },
        onSplitAnnotations(sessionInstance: any, frame: number, state: any): void {
            dispatch(splitAnnotationsAsync(sessionInstance, frame, state));
        },
        onActivateObject(activatedStateID: number | null): void {
            if (activatedStateID === null) {
                dispatch(updateCanvasContextMenu(false, 0, 0));
            }

            dispatch(activateObject(activatedStateID, null));
        },
        onSelectObjects(selectedStatesID: number[]): void {
            dispatch(selectObjects(selectedStatesID));
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
        onAddZLayer(): void {
            dispatch(addZLayer());
        },
        onSwitchZLayer(cur: number): void {
            dispatch(switchZLayer(cur));
        },
        onChangeBrightnessLevel(level: number): void {
            dispatch(changeBrightnessLevel(level));
        },
        onChangeContrastLevel(level: number): void {
            dispatch(changeContrastLevel(level));
        },
        onChangeSaturationLevel(level: number): void {
            dispatch(changeSaturationLevel(level));
        },
        onChangeGridOpacity(opacity: number): void {
            dispatch(changeGridOpacity(opacity));
        },
        onChangeGridColor(color: GridColor): void {
            dispatch(changeGridColor(color));
        },
        onSwitchGrid(enabled: boolean): void {
            dispatch(switchGrid(enabled));
        },
        onSwitchAutomaticBordering(enabled: boolean): void {
            dispatch(switchAutomaticBordering(enabled));
        },
        onFetchAnnotation(): void {
            dispatch(fetchAnnotationsAsync());
        },
        onGetDataFailed(error: any): void {
            dispatch(getDataFailed(error));
        },
        onStartIssue(position: number[]): void {
            dispatch(reviewActions.startIssue(position));
        },
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(CanvasWrapperComponent);
