// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React, {
    ReactElement, SyntheticEvent, useEffect, useReducer, useRef,
} from 'react';
import Layout from 'antd/lib/layout/layout';
import {
    ArrowDownOutlined, ArrowLeftOutlined, ArrowRightOutlined, ArrowUpOutlined,
} from '@ant-design/icons';
import { ResizableBox } from 'react-resizable';
import {
    ColorBy, ContextMenuType, ObjectType, Workspace,
} from 'reducers/interfaces';
import {
    CameraAction, Canvas3d, ViewType, ViewsDOM,
} from 'cvat-canvas3d-wrapper';
import { Canvas } from 'cvat-canvas-wrapper';
import ContextImage from 'components/annotation-page/standard3D-workspace/context-image/context-image';
import CVATTooltip from 'components/common/cvat-tooltip';
import { LogType } from 'cvat-logger';
import getCore from 'cvat-core-wrapper';

const cvat = getCore();

interface Props {
    opacity: number;
    selectedOpacity: number;
    outlined: boolean;
    outlineColor: string;
    colorBy: ColorBy;
    canvasInstance: Canvas3d | Canvas;
    jobInstance: any;
    frameData: any;
    curZLayer: number;
    contextImageHide: boolean;
    loaded: boolean;
    data: string;
    annotations: any[];
    contextMenuVisibility: boolean;
    activeLabelID: number;
    activatedStateID: number | null;
    activeObjectType: ObjectType;
    onSetupCanvas: () => void;
    getContextImage(): void;
    onResetCanvas(): void;
    onCreateAnnotations(sessionInstance: any, frame: number, states: any[]): void;
    onActivateObject(activatedStateID: number | null): void;
    onUpdateAnnotations(states: any[]): void;
    onUpdateContextMenu(visible: boolean, left: number, top: number, type: ContextMenuType, pointID?: number): void;
    onEditShape: (enabled: boolean) => void;
    onDragCanvas: (enabled: boolean) => void;
    onShapeDrawn: () => void;
    workspace: Workspace;
    automaticBordering: boolean;
    showObjectsTextAlways: boolean;
    frame: number;
}

interface ViewSize {
    fullHeight: number;
    fullWidth: number;
    vertical: number;
    top: number;
    side: number;
    front: number;
}

function viewSizeReducer(
    state: ViewSize,
    action: { type: ViewType | 'set' | 'resize'; e?: SyntheticEvent; data?: ViewSize },
): ViewSize {
    const event = (action.e as unknown) as MouseEvent;
    const canvas3dContainer = document.getElementById('canvas3d-container');
    if (canvas3dContainer) {
        switch (action.type) {
            case ViewType.TOP: {
                const width = event.clientX - canvas3dContainer.getBoundingClientRect().left;
                const topWidth = state.top;
                if (topWidth < width) {
                    const top = state.top + (width - topWidth);
                    const side = state.side - (width - topWidth);
                    return {
                        ...state,
                        top,
                        side,
                    };
                }
                const top = state.top - (topWidth - width);
                const side = state.side + (topWidth - width);
                return {
                    ...state,
                    top,
                    side,
                };
            }
            case ViewType.SIDE: {
                const width = event.clientX - canvas3dContainer.getBoundingClientRect().left;
                const topSideWidth = state.top + state.side;
                if (topSideWidth < width) {
                    const side = state.side + (width - topSideWidth);
                    const front = state.front - (width - topSideWidth);
                    return {
                        ...state,
                        side,
                        front,
                    };
                }
                const side = state.side - (topSideWidth - width);
                const front = state.front + (topSideWidth - width);
                return {
                    ...state,
                    side,
                    front,
                };
            }
            case ViewType.PERSPECTIVE:
                return {
                    ...state,
                    vertical: event.clientY - canvas3dContainer.getBoundingClientRect().top,
                };
            case 'set':
                return action.data as ViewSize;
            case 'resize': {
                const canvasPerspectiveContainer = document.getElementById('cvat-canvas3d-perspective');
                let midState = { ...state };
                if (canvasPerspectiveContainer) {
                    if (state.fullHeight !== canvas3dContainer.clientHeight) {
                        const diff = canvas3dContainer.clientHeight - state.fullHeight;
                        midState = {
                            ...midState,
                            fullHeight: canvas3dContainer.clientHeight,
                            vertical: state.vertical + diff,
                        };
                    }
                    if (state.fullWidth !== canvasPerspectiveContainer.clientWidth) {
                        const oldWidth = state.fullWidth;
                        const width = canvasPerspectiveContainer.clientWidth;
                        midState = {
                            ...midState,
                            fullWidth: width,
                            top: (state.top / oldWidth) * width,
                            side: (state.side / oldWidth) * width,
                            front: (state.front / oldWidth) * width,
                        };
                    }
                    return midState;
                }
                return state;
            }
            default:
                throw new Error();
        }
    }
    return state;
}

const CanvasWrapperComponent = (props: Props): ReactElement => {
    const animateId = useRef(0);
    const [viewSize, setViewSize] = useReducer(viewSizeReducer, {
        fullHeight: 0,
        fullWidth: 0,
        vertical: 0,
        top: 0,
        side: 0,
        front: 0,
    });
    const perspectiveView = useRef<HTMLDivElement | null>(null);
    const topView = useRef<HTMLDivElement | null>(null);
    const sideView = useRef<HTMLDivElement | null>(null);
    const frontView = useRef<HTMLDivElement | null>(null);

    const {
        opacity,
        outlined,
        outlineColor,
        selectedOpacity,
        colorBy,
        contextMenuVisibility,
        frameData,
        onResetCanvas,
        onSetupCanvas,
        contextImageHide,
        getContextImage,
        loaded,
        data,
        annotations,
        frame,
        jobInstance,
        activeLabelID,
        activeObjectType,
        onShapeDrawn,
        onCreateAnnotations,
    } = props;
    const { canvasInstance } = props as { canvasInstance: Canvas3d };

    const onCanvasSetup = (): void => {
        onSetupCanvas();
    };

    const onCanvasDragStart = (): void => {
        const { onDragCanvas } = props;
        onDragCanvas(true);
    };

    const onCanvasDragDone = (): void => {
        const { onDragCanvas } = props;
        onDragCanvas(false);
    };

    const animateCanvas = (): void => {
        canvasInstance.render();
        animateId.current = requestAnimationFrame(animateCanvas);
    };

    const updateCanvas = (): void => {
        if (frameData !== null) {
            canvasInstance.setup(
                frameData,
                annotations.filter((e) => e.objectType !== ObjectType.TAG),
            );
        }
    };

    const onCanvasCancel = (): void => {
        onResetCanvas();
    };

    const onCanvasShapeDrawn = (event: any): void => {
        if (!event.detail.continue) {
            onShapeDrawn();
        }

        const { state, duration } = event.detail;
        const isDrawnFromScratch = !state.label;
        if (isDrawnFromScratch) {
            jobInstance.logger.log(LogType.drawObject, { count: 1, duration });
        } else {
            jobInstance.logger.log(LogType.pasteObject, { count: 1, duration });
        }

        state.objectType = state.objectType || activeObjectType;
        state.label = state.label || jobInstance.task.labels.filter((label: any) => label.id === activeLabelID)[0];
        state.occluded = state.occluded || false;
        state.frame = frame;
        state.zOrder = 0;
        const objectState = new cvat.classes.ObjectState(state);
        onCreateAnnotations(jobInstance, frame, [objectState]);
    };

    const onCanvasClick = (e: MouseEvent): void => {
        const { onUpdateContextMenu } = props;
        if (contextMenuVisibility) {
            onUpdateContextMenu(false, e.clientX, e.clientY, ContextMenuType.CANVAS_SHAPE);
        }
    };

    const initialSetup = (): void => {
        const canvasInstanceDOM = canvasInstance.html() as ViewsDOM;
        canvasInstanceDOM.perspective.addEventListener('canvas.setup', onCanvasSetup);
        canvasInstanceDOM.perspective.addEventListener('canvas.canceled', onCanvasCancel);
        canvasInstanceDOM.perspective.addEventListener('canvas.dragstart', onCanvasDragStart);
        canvasInstanceDOM.perspective.addEventListener('canvas.dragstop', onCanvasDragDone);
    };

    const keyControls = (key: KeyboardEvent): void => {
        canvasInstance.keyControls(key);
    };

    const onCanvasShapeSelected = (event: any): void => {
        const { onActivateObject } = props;
        const { clientID } = event.detail;
        onActivateObject(clientID);
        canvasInstance.activate(clientID);
    };

    const onCanvasEditDone = (event: any): void => {
        const { onEditShape, onUpdateAnnotations } = props;
        onEditShape(false);
        const { state, points } = event.detail;
        state.points = points;
        onUpdateAnnotations([state]);
    };

    useEffect(() => {
        const canvasInstanceDOM = canvasInstance.html();
        if (
            perspectiveView &&
            perspectiveView.current &&
            topView &&
            topView.current &&
            sideView &&
            sideView.current &&
            frontView &&
            frontView.current
        ) {
            perspectiveView.current.appendChild(canvasInstanceDOM.perspective);
            topView.current.appendChild(canvasInstanceDOM.top);
            sideView.current.appendChild(canvasInstanceDOM.side);
            frontView.current.appendChild(canvasInstanceDOM.front);
            const canvas3dContainer = document.getElementById('canvas3d-container');
            if (canvas3dContainer) {
                const width = canvas3dContainer.clientWidth / 3;
                setViewSize({
                    type: 'set',
                    data: {
                        fullHeight: canvas3dContainer.clientHeight,
                        fullWidth: canvas3dContainer.clientWidth,
                        vertical: canvas3dContainer.clientHeight / 2,
                        top: width,
                        side: width,
                        front: width,
                    },
                });
            }
        }

        document.addEventListener('keydown', keyControls);

        initialSetup();
        updateCanvas();
        animateCanvas();

        return () => {
            canvasInstanceDOM.perspective.removeEventListener('canvas.setup', onCanvasSetup);
            canvasInstanceDOM.perspective.removeEventListener('canvas.canceled', onCanvasCancel);
            canvasInstanceDOM.perspective.removeEventListener('canvas.dragstart', onCanvasDragStart);
            canvasInstanceDOM.perspective.removeEventListener('canvas.dragstop', onCanvasDragDone);
            document.removeEventListener('keydown', keyControls);
            cancelAnimationFrame(animateId.current);
        };
    }, []);

    const updateShapesView = (): void => {
        (canvasInstance as Canvas3d).configureShapes({
            opacity,
            outlined,
            outlineColor,
            selectedOpacity,
            colorBy,
        });
    };

    const onContextMenu = (event: any): void => {
        const { onUpdateContextMenu, onActivateObject } = props;
        onActivateObject(event.detail.clientID);
        onUpdateContextMenu(
            event.detail.clientID !== null,
            event.detail.clientX,
            event.detail.clientY,
            ContextMenuType.CANVAS_SHAPE,
        );
    };

    const onResize = (): void => {
        setViewSize({
            type: 'resize',
        });
    };

    useEffect(() => {
        updateShapesView();
    }, [opacity, outlined, outlineColor, selectedOpacity, colorBy]);

    useEffect(() => {
        const canvasInstanceDOM = canvasInstance.html() as ViewsDOM;
        updateCanvas();
        canvasInstanceDOM.perspective.addEventListener('canvas.drawn', onCanvasShapeDrawn);
        canvasInstanceDOM.perspective.addEventListener('canvas.selected', onCanvasShapeSelected);
        canvasInstanceDOM.perspective.addEventListener('canvas.edited', onCanvasEditDone);
        canvasInstanceDOM.perspective.addEventListener('canvas.contextmenu', onContextMenu);
        canvasInstanceDOM.perspective.addEventListener('click', onCanvasClick);
        canvasInstanceDOM.perspective.addEventListener('canvas.fit', onResize);
        window.addEventListener('resize', onResize);

        return () => {
            canvasInstanceDOM.perspective.removeEventListener('canvas.drawn', onCanvasShapeDrawn);
            canvasInstanceDOM.perspective.removeEventListener('canvas.selected', onCanvasShapeSelected);
            canvasInstanceDOM.perspective.removeEventListener('canvas.edited', onCanvasEditDone);
            canvasInstanceDOM.perspective.removeEventListener('canvas.contextmenu', onContextMenu);
            canvasInstanceDOM.perspective.removeEventListener('click', onCanvasClick);
            canvasInstanceDOM.perspective.removeEventListener('canvas.fit', onResize);
            window.removeEventListener('resize', onResize);
        };
    }, [frameData, annotations, activeLabelID, contextMenuVisibility]);

    const screenKeyControl = (code: CameraAction): void => {
        canvasInstance.keyControls(new KeyboardEvent('keydown', { code, altKey: true }));
    };

    const ArrowGroup = (): ReactElement => (
        <span className='cvat-canvas3d-perspective-arrow-directions'>
            <CVATTooltip title='Arrow Up' placement='topRight'>
                <button
                    data-cy='arrow-up'
                    onClick={() => screenKeyControl(CameraAction.TILT_UP)}
                    type='button'
                    className='cvat-canvas3d-perspective-arrow-directions-icons-up'
                >
                    <ArrowUpOutlined className='cvat-canvas3d-perspective-arrow-directions-icons-color' />
                </button>
            </CVATTooltip>
            <br />
            <CVATTooltip title='Arrow Left' placement='topRight'>
                <button
                    onClick={() => screenKeyControl(CameraAction.ROTATE_LEFT)}
                    type='button'
                    className='cvat-canvas3d-perspective-arrow-directions-icons-bottom'
                >
                    <ArrowLeftOutlined className='cvat-canvas3d-perspective-arrow-directions-icons-color' />
                </button>
            </CVATTooltip>
            <CVATTooltip title='Arrow Bottom' placement='topRight'>
                <button
                    onClick={() => screenKeyControl(CameraAction.TILT_DOWN)}
                    type='button'
                    className='cvat-canvas3d-perspective-arrow-directions-icons-bottom'
                >
                    <ArrowDownOutlined className='cvat-canvas3d-perspective-arrow-directions-icons-color' />
                </button>
            </CVATTooltip>
            <CVATTooltip title='Arrow Right' placement='topRight'>
                <button
                    onClick={() => screenKeyControl(CameraAction.ROTATE_RIGHT)}
                    type='button'
                    className='cvat-canvas3d-perspective-arrow-directions-icons-bottom'
                >
                    <ArrowRightOutlined className='cvat-canvas3d-perspective-arrow-directions-icons-color' />
                </button>
            </CVATTooltip>
        </span>
    );

    const ControlGroup = (): ReactElement => (
        <span className='cvat-canvas3d-perspective-directions'>
            <CVATTooltip title='Alt+U' placement='topLeft'>
                <button
                    onClick={() => screenKeyControl(CameraAction.MOVE_UP)}
                    type='button'
                    className='cvat-canvas3d-perspective-directions-icon'
                >
                    U
                </button>
            </CVATTooltip>
            <CVATTooltip title='Alt+I' placement='topLeft'>
                <button
                    onClick={() => screenKeyControl(CameraAction.ZOOM_IN)}
                    type='button'
                    className='cvat-canvas3d-perspective-directions-icon'
                >
                    I
                </button>
            </CVATTooltip>
            <CVATTooltip title='Alt+O' placement='topLeft'>
                <button
                    onClick={() => screenKeyControl(CameraAction.MOVE_DOWN)}
                    type='button'
                    className='cvat-canvas3d-perspective-directions-icon'
                >
                    O
                </button>
            </CVATTooltip>
            <br />
            <CVATTooltip title='Alt+J' placement='topLeft'>
                <button
                    onClick={() => screenKeyControl(CameraAction.MOVE_LEFT)}
                    type='button'
                    className='cvat-canvas3d-perspective-directions-icon'
                >
                    J
                </button>
            </CVATTooltip>
            <CVATTooltip title='Alt+K' placement='topLeft'>
                <button
                    onClick={() => screenKeyControl(CameraAction.ZOOM_OUT)}
                    type='button'
                    className='cvat-canvas3d-perspective-directions-icon'
                >
                    K
                </button>
            </CVATTooltip>
            <CVATTooltip title='Alt+L' placement='topLeft'>
                <button
                    onClick={() => screenKeyControl(CameraAction.MOVE_RIGHT)}
                    type='button'
                    className='cvat-canvas3d-perspective-directions-icon'
                >
                    L
                </button>
            </CVATTooltip>
        </span>
    );

    return (
        <Layout.Content className='cvat-canvas3d-fullsize' id='canvas3d-container'>
            <ContextImage
                frame={frameData}
                contextImageHide={contextImageHide}
                getContextImage={getContextImage}
                loaded={loaded}
                data={data}
            />
            <ResizableBox
                className='cvat-resizable'
                width={Infinity}
                height={viewSize.vertical}
                axis='y'
                handle={<span className='cvat-resizable-handle-horizontal' />}
                onResize={(e: SyntheticEvent) => setViewSize({ type: ViewType.PERSPECTIVE, e })}
            >
                <div className='cvat-canvas3d-perspective' id='cvat-canvas3d-perspective'>
                    <div className='cvat-canvas-container cvat-canvas-container-overflow' ref={perspectiveView} />
                    <ArrowGroup />
                    <ControlGroup />
                </div>
            </ResizableBox>
            <div
                className='cvat-canvas3d-orthographic-views'
                style={{ height: viewSize.fullHeight - viewSize.vertical }}
            >
                <ResizableBox
                    className='cvat-resizable'
                    width={viewSize.top}
                    height={viewSize.fullHeight - viewSize.vertical}
                    axis='x'
                    handle={<span className='cvat-resizable-handle-vertical-top' />}
                    onResize={(e: SyntheticEvent) => setViewSize({ type: ViewType.TOP, e })}
                >
                    <div className='cvat-canvas3d-orthographic-view cvat-canvas3d-topview'>
                        <div className='cvat-canvas3d-header'>TOP</div>
                        <div className='cvat-canvas3d-fullsize' ref={topView} />
                    </div>
                </ResizableBox>
                <ResizableBox
                    className='cvat-resizable'
                    width={viewSize.side}
                    height={viewSize.fullHeight - viewSize.vertical}
                    axis='x'
                    handle={<span className='cvat-resizable-handle-vertical-side' />}
                    onResize={(e: SyntheticEvent) => setViewSize({ type: ViewType.SIDE, e })}
                >
                    <div className='cvat-canvas3d-orthographic-view cvat-canvas3d-sideview'>
                        <div className='cvat-canvas3d-header'>SIDE</div>
                        <div className='cvat-canvas3d-fullsize' ref={sideView} />
                    </div>
                </ResizableBox>
                <div
                    className='cvat-canvas3d-orthographic-view cvat-canvas3d-frontview'
                    style={{ width: viewSize.front, height: viewSize.fullHeight - viewSize.vertical }}
                >
                    <div className='cvat-canvas3d-header'>FRONT</div>
                    <div className='cvat-canvas3d-fullsize' ref={frontView} />
                </div>
            </div>
        </Layout.Content>
    );
};

export default React.memo(CanvasWrapperComponent);
