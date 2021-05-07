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
import { Workspace } from 'reducers/interfaces';
import {
    CAMERA_ACTION, Canvas3d, MouseInteraction, ViewType,
} from 'cvat-canvas3d-wrapper';
import ContextImage from 'components/annotation-page/standard-workspace/context-image/context-image';
import CVATTooltip from 'components/common/cvat-tooltip';

interface Props {
    canvasInstance: Canvas3d;
    jobInstance: any;
    frameData: any;
    curZLayer: number;
    annotations: any[];
    onSetupCanvas: () => void;
    onResetCanvas(): void;
    workspace: Workspace;
    animateID: any;
    automaticBordering: boolean;
    showObjectsTextAlways: boolean;
}

interface ViewSize {
    fullHeight: number;
    vertical: number;
    top: number;
    side: number;
    front: number;
}

function viewSizeReducer(
    state: ViewSize,
    action: { type: ViewType | 'set'; e?: SyntheticEvent; data?: ViewSize },
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
        vertical: 0,
        top: 0,
        side: 0,
        front: 0,
    });
    const perspectiveView = useRef<HTMLDivElement | null>(null);
    const topView = useRef<HTMLDivElement | null>(null);
    const sideView = useRef<HTMLDivElement | null>(null);
    const frontView = useRef<HTMLDivElement | null>(null);

    const { frameData, annotations, curZLayer } = props;

    const onCanvasSetup = (): void => {
        const { onSetupCanvas } = props;
        onSetupCanvas();
    };

    const animateCanvas = (): void => {
        const { canvasInstance } = props;

        canvasInstance.render();
        animateId.current = requestAnimationFrame(animateCanvas);
    };

    const updateCanvas = (): void => {
        const { canvasInstance } = props;

        if (frameData !== null) {
            canvasInstance.setup(frameData);
        }
    };

    const onMouseClick = (event: MouseEvent): void => {
        const { canvasInstance } = props;
        canvasInstance.mouseControls(MouseInteraction.CLICK, event);
    };

    const onMouseDoubleClick = (event: MouseEvent): void => {
        const { canvasInstance } = props;
        canvasInstance.mouseControls(MouseInteraction.DOUBLE_CLICK, event);
    };

    const onMouseHover = (event: MouseEvent): void => {
        const { canvasInstance } = props;
        canvasInstance.mouseControls(MouseInteraction.HOVER, event);
    };

    const onCanvasCancel = (): void => {
        const { onResetCanvas } = props;
        onResetCanvas();
    };

    const initialSetup = (): void => {
        const { canvasInstance } = props;

        const canvasInstanceDOM = canvasInstance.html();
        // Events
        canvasInstanceDOM.perspective.addEventListener('canvas.setup', onCanvasSetup);
        canvasInstanceDOM.perspective.addEventListener('mousemove', onMouseHover);
        canvasInstanceDOM.perspective.addEventListener('canvas.canceled', onCanvasCancel);
        canvasInstanceDOM.perspective.addEventListener(MouseInteraction.DOUBLE_CLICK, onMouseDoubleClick);
        canvasInstanceDOM.perspective.addEventListener(MouseInteraction.CLICK, onMouseClick);
    };

    const keyControls = (key: KeyboardEvent): void => {
        const { canvasInstance } = props;
        canvasInstance.keyControls(key);
    };

    useEffect(() => {
        const { canvasInstance } = props;

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
            canvasInstanceDOM.perspective.removeEventListener('mousemove', onMouseHover);
            canvasInstanceDOM.perspective.removeEventListener('canvas.canceled', onCanvasCancel);
            canvasInstanceDOM.perspective.removeEventListener(MouseInteraction.DOUBLE_CLICK, onMouseDoubleClick);
            canvasInstanceDOM.perspective.removeEventListener(MouseInteraction.CLICK, onMouseClick);
            document.removeEventListener('keydown', keyControls);
            cancelAnimationFrame(animateId.current);
        };
    }, []);

    useEffect(() => {
        updateCanvas();
    }, [frameData, annotations, curZLayer]);

    const screenKeyControl = (code: CAMERA_ACTION): void => {
        const { canvasInstance } = props;
        canvasInstance.keyControls(new KeyboardEvent('keydown', { code, altKey: true }));
    };

    const ArrowGroup = (): ReactElement => (
        <span className='cvat-canvas3d-perspective-arrow-directions'>
            <CVATTooltip title='Arrow Up' placement='topRight'>
                <button
                    onClick={() => screenKeyControl(CAMERA_ACTION.TILT_UP)}
                    type='button'
                    className='cvat-canvas3d-perspective-arrow-directions-icons-up'
                >
                    <ArrowUpOutlined className='cvat-canvas3d-perspective-arrow-directions-icons-color' />
                </button>
            </CVATTooltip>
            <br />
            <CVATTooltip title='Arrow Left' placement='topRight'>
                <button
                    onClick={() => screenKeyControl(CAMERA_ACTION.ROTATE_LEFT)}
                    type='button'
                    className='cvat-canvas3d-perspective-arrow-directions-icons-bottom'
                >
                    <ArrowLeftOutlined className='cvat-canvas3d-perspective-arrow-directions-icons-color' />
                </button>
            </CVATTooltip>
            <CVATTooltip title='Arrow Bottom' placement='topRight'>
                <button
                    onClick={() => screenKeyControl(CAMERA_ACTION.TILT_DOWN)}
                    type='button'
                    className='cvat-canvas3d-perspective-arrow-directions-icons-bottom'
                >
                    <ArrowDownOutlined className='cvat-canvas3d-perspective-arrow-directions-icons-color' />
                </button>
            </CVATTooltip>
            <CVATTooltip title='Arrow Right' placement='topRight'>
                <button
                    onClick={() => screenKeyControl(CAMERA_ACTION.ROTATE_RIGHT)}
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
                    onClick={() => screenKeyControl(CAMERA_ACTION.MOVE_UP)}
                    type='button'
                    className='cvat-canvas3d-perspective-directions-icon'
                >
                    U
                </button>
            </CVATTooltip>
            <CVATTooltip title='Alt+I' placement='topLeft'>
                <button
                    onClick={() => screenKeyControl(CAMERA_ACTION.ZOOM_IN)}
                    type='button'
                    className='cvat-canvas3d-perspective-directions-icon'
                >
                    I
                </button>
            </CVATTooltip>
            <CVATTooltip title='Alt+O' placement='topLeft'>
                <button
                    onClick={() => screenKeyControl(CAMERA_ACTION.MOVE_DOWN)}
                    type='button'
                    className='cvat-canvas3d-perspective-directions-icon'
                >
                    O
                </button>
            </CVATTooltip>
            <br />
            <CVATTooltip title='Alt+J' placement='topLeft'>
                <button
                    onClick={() => screenKeyControl(CAMERA_ACTION.MOVE_LEFT)}
                    type='button'
                    className='cvat-canvas3d-perspective-directions-icon'
                >
                    J
                </button>
            </CVATTooltip>
            <CVATTooltip title='Alt+K' placement='topLeft'>
                <button
                    onClick={() => screenKeyControl(CAMERA_ACTION.ZOOM_OUT)}
                    type='button'
                    className='cvat-canvas3d-perspective-directions-icon'
                >
                    K
                </button>
            </CVATTooltip>
            <CVATTooltip title='Alt+L' placement='topLeft'>
                <button
                    onClick={() => screenKeyControl(CAMERA_ACTION.MOVE_RIGHT)}
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
            <ContextImage />
            <ResizableBox
                className='cvat-resizable'
                width={Infinity}
                height={viewSize.vertical}
                axis='y'
                handle={<span className='cvat-resizable-handle-horizontal' />}
                onResize={(e: SyntheticEvent) => setViewSize({ type: ViewType.PERSPECTIVE, e })}
            >
                <div className='cvat-canvas3d-perspective'>
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
