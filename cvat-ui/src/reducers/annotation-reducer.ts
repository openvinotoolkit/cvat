// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { AnyAction } from 'redux';
import { AnnotationActionTypes } from 'actions/annotation-actions';
import { AuthActionTypes } from 'actions/auth-actions';
import { BoundariesActionTypes } from 'actions/boundaries-actions';
import { Canvas, CanvasMode } from 'cvat-canvas-wrapper';
import { Canvas3d } from 'cvat-canvas3d-wrapper';
import {
    ActiveControl,
    AnnotationState,
    ContextMenuType,
    DimensionType,
    ObjectType,
    ShapeType,
    TaskStatus,
    Workspace,
} from './interfaces';

const defaultState: AnnotationState = {
    activities: {
        loads: {},
    },
    canvas: {
        contextMenu: {
            visible: false,
            left: 0,
            top: 0,
            type: ContextMenuType.CANVAS_SHAPE,
            pointID: null,
            clientID: null,
        },
        instance: new Canvas(),
        ready: false,
        activeControl: ActiveControl.CURSOR,
    },
    job: {
        openTime: null,
        labels: [],
        requestedId: null,
        instance: null,
        attributes: {},
        fetching: false,
        saving: false,
    },
    player: {
        frame: {
            number: 0,
            filename: '',
            data: null,
            hasRelatedContext: false,
            fetching: false,
            delay: 0,
            changeTime: null,
        },
        playing: false,
        frameAngles: [],
        contextImage: {
            fetching: false,
            data: null,
            hidden: false,
        },
    },
    drawing: {
        activeShapeType: ShapeType.RECTANGLE,
        activeLabelID: 0,
        activeObjectType: ObjectType.SHAPE,
    },
    annotations: {
        selectedStatesID: [],
        activatedStateID: null,
        activatedAttributeID: null,
        saving: {
            forceExit: false,
            uploading: false,
            statuses: [],
        },
        collapsed: {},
        collapsedAll: true,
        states: [],
        filters: [],
        resetGroupFlag: false,
        history: {
            undo: [],
            redo: [],
        },
        zLayer: {
            min: 0,
            max: 0,
            cur: 0,
        },
    },
    propagate: {
        objectState: null,
        frames: 50,
    },
    statistics: {
        visible: false,
        collecting: false,
        data: null,
    },
    aiToolsRef: React.createRef(),
    colors: [],
    sidebarCollapsed: false,
    appearanceCollapsed: false,
    filtersPanelVisible: false,
    requestReviewDialogVisible: false,
    submitReviewDialogVisible: false,
    tabContentHeight: 0,
    predictor: {
        enabled: false,
        error: null,
        message: '',
        projectScore: 0,
        fetching: false,
        annotatedFrames: [],
        timeRemaining: 0,
        progress: 0,
        annotationAmount: 0,
        mediaAmount: 0,
    },
    workspace: Workspace.STANDARD,
};

export default (state = defaultState, action: AnyAction): AnnotationState => {
    switch (action.type) {
        case AnnotationActionTypes.GET_JOB: {
            return {
                ...state,
                job: {
                    ...state.job,
                    instance: null,
                    requestedId: action.payload.requestedId,
                    fetching: true,
                },
            };
        }
        case BoundariesActionTypes.RESET_AFTER_ERROR:
        case AnnotationActionTypes.GET_JOB_SUCCESS: {
            const {
                job,
                states,
                openTime,
                frameNumber: number,
                frameFilename: filename,
                frameHasRelatedContext,
                colors,
                filters,
                frameData: data,
                minZ,
                maxZ,
            } = action.payload;

            const isReview = job.status === TaskStatus.REVIEW;
            let workspaceSelected = Workspace.STANDARD;

            if (job.task.dimension === DimensionType.DIM_3D) {
                workspaceSelected = Workspace.STANDARD3D;
            }
            return {
                ...state,
                job: {
                    ...state.job,
                    openTime,
                    fetching: false,
                    instance: job,
                    labels: job.task.labels,
                    attributes: job.task.labels.reduce((acc: Record<number, any[]>, label: any): Record<
                    number,
                    any[]
                    > => {
                        acc[label.id] = label.attributes;
                        return acc;
                    }, {}),
                },
                annotations: {
                    ...state.annotations,
                    states,
                    filters,
                    zLayer: {
                        min: minZ,
                        max: maxZ,
                        cur: maxZ,
                    },
                },
                player: {
                    ...state.player,
                    frame: {
                        ...state.player.frame,
                        filename,
                        hasRelatedContext: frameHasRelatedContext,
                        number,
                        data,
                    },
                    frameAngles: Array(job.stopFrame - job.startFrame + 1).fill(0),
                },
                drawing: {
                    ...state.drawing,
                    activeLabelID: job.task.labels.length ? job.task.labels[0].id : null,
                    activeObjectType: job.task.mode === 'interpolation' ? ObjectType.TRACK : ObjectType.SHAPE,
                },
                canvas: {
                    ...state.canvas,
                    instance: job.task.dimension === DimensionType.DIM_2D ? new Canvas() : new Canvas3d(),
                },
                colors,
                workspace: isReview ? Workspace.REVIEW_WORKSPACE : workspaceSelected,
            };
        }
        case AnnotationActionTypes.GET_JOB_FAILED: {
            return {
                ...state,
                job: {
                    ...state.job,
                    instance: undefined,
                    fetching: false,
                },
            };
        }
        case AnnotationActionTypes.GET_DATA_FAILED: {
            return {
                ...state,
                player: {
                    ...state.player,
                    frame: {
                        ...state.player.frame,
                        fetching: false,
                    },
                },
            };
        }
        case AnnotationActionTypes.CHANGE_FRAME: {
            return {
                ...state,
                player: {
                    ...state.player,
                    frame: {
                        ...state.player.frame,
                        fetching: true,
                    },
                },
                canvas: {
                    ...state.canvas,
                    ready: false,
                },
            };
        }
        case AnnotationActionTypes.CHANGE_FRAME_SUCCESS: {
            const {
                number,
                data,
                filename,
                hasRelatedContext,
                states,
                minZ,
                maxZ,
                curZ,
                delay,
                changeTime,
            } = action.payload;

            const activatedStateID = states
                .map((_state: any) => _state.clientID)
                .includes(state.annotations.activatedStateID) ?
                state.annotations.activatedStateID :
                null;

            return {
                ...state,
                player: {
                    ...state.player,
                    frame: {
                        data,
                        filename,
                        hasRelatedContext,
                        number,
                        fetching: false,
                        changeTime,
                        delay,
                    },
                    contextImage: {
                        ...state.player.contextImage,
                        data: null,
                    },
                },
                annotations: {
                    ...state.annotations,
                    activatedStateID,
                    states,
                    zLayer: {
                        min: minZ,
                        max: maxZ,
                        cur: curZ,
                    },
                },
            };
        }
        case AnnotationActionTypes.CHANGE_FRAME_FAILED: {
            return {
                ...state,
                player: {
                    ...state.player,
                    frame: {
                        ...state.player.frame,
                        fetching: false,
                    },
                },
            };
        }
        case AnnotationActionTypes.ROTATE_FRAME: {
            const { offset, angle, rotateAll } = action.payload;
            return {
                ...state,
                player: {
                    ...state.player,
                    frameAngles: state.player.frameAngles.map((_angle: number, idx: number) => {
                        if (rotateAll || offset === idx) {
                            return angle;
                        }
                        return _angle;
                    }),
                },
            };
        }
        case AnnotationActionTypes.SAVE_ANNOTATIONS: {
            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    saving: {
                        ...state.annotations.saving,
                        uploading: true,
                        statuses: [],
                    },
                },
            };
        }
        case AnnotationActionTypes.SAVE_ANNOTATIONS_SUCCESS: {
            const { states } = action.payload;
            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    states,
                    saving: {
                        ...state.annotations.saving,
                        uploading: false,
                    },
                },
            };
        }
        case AnnotationActionTypes.SAVE_ANNOTATIONS_FAILED: {
            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    saving: {
                        ...state.annotations.saving,
                        uploading: false,
                    },
                },
            };
        }
        case AnnotationActionTypes.SAVE_UPDATE_ANNOTATIONS_STATUS: {
            const { status } = action.payload;

            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    saving: {
                        ...state.annotations.saving,
                        statuses: [...state.annotations.saving.statuses, status],
                    },
                },
            };
        }
        case AnnotationActionTypes.SWITCH_PLAY: {
            const { playing } = action.payload;

            return {
                ...state,
                player: {
                    ...state.player,
                    playing,
                },
            };
        }
        case AnnotationActionTypes.COLLAPSE_SIDEBAR: {
            return {
                ...state,
                sidebarCollapsed: !state.sidebarCollapsed,
            };
        }
        case AnnotationActionTypes.COLLAPSE_APPEARANCE: {
            return {
                ...state,
                appearanceCollapsed: !state.appearanceCollapsed,
            };
        }
        case AnnotationActionTypes.UPDATE_TAB_CONTENT_HEIGHT: {
            const { tabContentHeight } = action.payload;
            return {
                ...state,
                tabContentHeight,
            };
        }
        case AnnotationActionTypes.COLLAPSE_OBJECT_ITEMS: {
            const { states, collapsed } = action.payload;

            const updatedCollapsedStates = { ...state.annotations.collapsed };
            const totalStatesCount = state.annotations.states.length;
            for (const objectState of states) {
                updatedCollapsedStates[objectState.clientID] = collapsed;
            }

            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    collapsed: updatedCollapsedStates,
                    collapsedAll: states.length === totalStatesCount ? collapsed : state.annotations.collapsedAll,
                },
            };
        }
        case AnnotationActionTypes.CONFIRM_CANVAS_READY: {
            return {
                ...state,
                canvas: {
                    ...state.canvas,
                    ready: true,
                },
            };
        }
        case AnnotationActionTypes.DRAG_CANVAS: {
            const { enabled } = action.payload;
            const activeControl = enabled ? ActiveControl.DRAG_CANVAS : ActiveControl.CURSOR;

            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    activatedStateID: null,
                },
                canvas: {
                    ...state.canvas,
                    activeControl,
                },
            };
        }
        case AnnotationActionTypes.ZOOM_CANVAS: {
            const { enabled } = action.payload;
            const activeControl = enabled ? ActiveControl.ZOOM_CANVAS : ActiveControl.CURSOR;

            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    activatedStateID: null,
                },
                canvas: {
                    ...state.canvas,
                    activeControl,
                },
            };
        }
        case AnnotationActionTypes.REMEMBER_CREATED_OBJECT: {
            const { payload } = action;

            let { activeControl } = state.canvas;
            if (payload.activeShapeType === ShapeType.RECTANGLE) {
                activeControl = ActiveControl.DRAW_RECTANGLE;
            } else if (payload.activeShapeType === ShapeType.POLYGON) {
                activeControl = ActiveControl.DRAW_POLYGON;
            } else if (payload.activeShapeType === ShapeType.POLYLINE) {
                activeControl = ActiveControl.DRAW_POLYLINE;
            } else if (payload.activeShapeType === ShapeType.POINTS) {
                activeControl = ActiveControl.DRAW_POINTS;
            } else if (payload.activeShapeType === ShapeType.CUBOID) {
                activeControl = ActiveControl.DRAW_CUBOID;
            } else if (payload.activeObjectType === ObjectType.TAG) {
                activeControl = ActiveControl.CURSOR;
            }

            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    activatedStateID: null,
                },
                canvas: {
                    ...state.canvas,
                    activeControl,
                },
                drawing: {
                    ...state.drawing,
                    ...payload,
                    activeInteractor: undefined,
                },
            };
        }
        case AnnotationActionTypes.REPEAT_DRAW_SHAPE: {
            const { activeControl } = action.payload;

            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    activatedStateID: null,
                },
                canvas: {
                    ...state.canvas,
                    activeControl,
                },
            };
        }
        case AnnotationActionTypes.SELECT_ISSUE_POSITION: {
            const { enabled } = action.payload;
            const activeControl = enabled ? ActiveControl.OPEN_ISSUE : ActiveControl.CURSOR;

            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    activatedStateID: null,
                },
                canvas: {
                    ...state.canvas,
                    activeControl,
                },
            };
        }
        case AnnotationActionTypes.MERGE_OBJECTS: {
            const { enabled } = action.payload;
            const activeControl = enabled ? ActiveControl.MERGE : ActiveControl.CURSOR;

            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    activatedStateID: null,
                },
                canvas: {
                    ...state.canvas,
                    activeControl,
                },
            };
        }
        case AnnotationActionTypes.GROUP_OBJECTS: {
            const { enabled } = action.payload;
            const activeControl = enabled ? ActiveControl.GROUP : ActiveControl.CURSOR;

            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    activatedStateID: null,
                },
                canvas: {
                    ...state.canvas,
                    activeControl,
                },
            };
        }
        case AnnotationActionTypes.SPLIT_TRACK: {
            const { enabled } = action.payload;
            const activeControl = enabled ? ActiveControl.SPLIT : ActiveControl.CURSOR;

            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    activatedStateID: null,
                },
                canvas: {
                    ...state.canvas,
                    activeControl,
                },
            };
        }
        case AnnotationActionTypes.SHAPE_DRAWN: {
            return {
                ...state,
                canvas: {
                    ...state.canvas,
                    activeControl: ActiveControl.CURSOR,
                },
            };
        }
        case AnnotationActionTypes.UPDATE_ANNOTATIONS_SUCCESS: {
            const {
                history, states: updatedStates, minZ, maxZ,
            } = action.payload;
            const { states: prevStates } = state.annotations;
            const nextStates = [...prevStates];

            const clientIDs = prevStates.map((prevState: any): number => prevState.clientID);
            for (const updatedState of updatedStates) {
                const index = clientIDs.indexOf(updatedState.clientID);
                if (index !== -1) {
                    nextStates[index] = updatedState;
                }
            }

            const maxZLayer = Math.max(state.annotations.zLayer.max, maxZ);
            const minZLayer = Math.min(state.annotations.zLayer.min, minZ);

            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    zLayer: {
                        min: minZLayer,
                        max: maxZLayer,
                        cur: maxZLayer,
                    },
                    states: nextStates,
                    history,
                },
            };
        }
        case AnnotationActionTypes.UPDATE_ANNOTATIONS_FAILED: {
            const { states } = action.payload;
            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    states,
                },
            };
        }
        case AnnotationActionTypes.CREATE_ANNOTATIONS_SUCCESS: {
            const { states, history } = action.payload;

            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    states,
                    history,
                },
            };
        }
        case AnnotationActionTypes.MERGE_ANNOTATIONS_SUCCESS: {
            const { states, history } = action.payload;

            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    states,
                    history,
                },
            };
        }
        case AnnotationActionTypes.RESET_ANNOTATIONS_GROUP: {
            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    resetGroupFlag: true,
                },
            };
        }
        case AnnotationActionTypes.GROUP_ANNOTATIONS: {
            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    resetGroupFlag: false,
                },
            };
        }
        case AnnotationActionTypes.GROUP_ANNOTATIONS_SUCCESS: {
            const { states, history } = action.payload;

            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    states,
                    history,
                },
            };
        }
        case AnnotationActionTypes.SPLIT_ANNOTATIONS_SUCCESS: {
            const { states, history } = action.payload;

            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    states,
                    history,
                },
            };
        }
        case AnnotationActionTypes.ACTIVATE_OBJECT: {
            const { activatedStateID, activatedAttributeID } = action.payload;

            const {
                canvas: { activeControl, instance },
            } = state;

            if (activeControl !== ActiveControl.CURSOR || instance.mode() !== CanvasMode.IDLE) {
                return state;
            }

            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    activatedStateID,
                    activatedAttributeID,
                },
            };
        }
        case AnnotationActionTypes.SELECT_OBJECTS: {
            const { selectedStatesID } = action.payload;

            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    selectedStatesID,
                },
            };
        }
        case AnnotationActionTypes.REMOVE_OBJECT_SUCCESS: {
            const { objectState, history } = action.payload;
            const contextMenuClientID = state.canvas.contextMenu.clientID;
            const contextMenuVisible = state.canvas.contextMenu.visible;

            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    history,
                    activatedStateID: null,
                    states: state.annotations.states.filter(
                        (_objectState: any) => _objectState.clientID !== objectState.clientID,
                    ),
                },
                canvas: {
                    ...state.canvas,
                    contextMenu: {
                        ...state.canvas.contextMenu,
                        clientID: objectState.clientID === contextMenuClientID ? null : contextMenuClientID,
                        visible: objectState.clientID === contextMenuClientID ? false : contextMenuVisible,
                    },
                },
            };
        }
        case AnnotationActionTypes.PASTE_SHAPE: {
            const { activeControl } = action.payload;

            return {
                ...state,
                canvas: {
                    ...state.canvas,
                    activeControl,
                },
                annotations: {
                    ...state.annotations,
                    activatedStateID: null,
                },
            };
        }
        case AnnotationActionTypes.COPY_SHAPE: {
            const { objectState } = action.payload;

            return {
                ...state,
                drawing: {
                    ...state.drawing,
                    activeInitialState: objectState,
                },
            };
        }
        case AnnotationActionTypes.EDIT_SHAPE: {
            const { enabled } = action.payload;
            const activeControl = enabled ? ActiveControl.EDIT : ActiveControl.CURSOR;

            return {
                ...state,
                canvas: {
                    ...state.canvas,
                    activeControl,
                },
            };
        }
        case AnnotationActionTypes.PROPAGATE_OBJECT: {
            const { objectState } = action.payload;
            return {
                ...state,
                propagate: {
                    ...state.propagate,
                    objectState,
                },
            };
        }
        case AnnotationActionTypes.PROPAGATE_OBJECT_SUCCESS: {
            const { history } = action.payload;
            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    history,
                },
                propagate: {
                    ...state.propagate,
                    objectState: null,
                },
            };
        }
        case AnnotationActionTypes.CHANGE_PROPAGATE_FRAMES: {
            const { frames } = action.payload;

            return {
                ...state,
                propagate: {
                    ...state.propagate,
                    frames,
                },
            };
        }
        case AnnotationActionTypes.SWITCH_SHOWING_STATISTICS: {
            const { visible } = action.payload;

            return {
                ...state,
                statistics: {
                    ...state.statistics,
                    visible,
                },
            };
        }
        case AnnotationActionTypes.SWITCH_SHOWING_FILTERS: {
            const { visible } = action.payload;

            return {
                ...state,
                filtersPanelVisible: visible,
            };
        }
        case AnnotationActionTypes.COLLECT_STATISTICS: {
            return {
                ...state,
                statistics: {
                    ...state.statistics,
                    collecting: true,
                },
            };
        }
        case AnnotationActionTypes.COLLECT_STATISTICS_SUCCESS: {
            const { data } = action.payload;
            return {
                ...state,
                statistics: {
                    ...state.statistics,
                    collecting: false,
                    data,
                },
            };
        }
        case AnnotationActionTypes.COLLECT_STATISTICS_FAILED: {
            return {
                ...state,
                statistics: {
                    ...state.statistics,
                    collecting: false,
                    data: null,
                },
            };
        }
        case AnnotationActionTypes.UPLOAD_JOB_ANNOTATIONS: {
            const { job, loader } = action.payload;
            const { loads } = state.activities;
            loads[job.id] = job.id in loads ? loads[job.id] : loader.name;

            return {
                ...state,
                activities: {
                    ...state.activities,
                    loads: {
                        ...loads,
                    },
                },
            };
        }
        case AnnotationActionTypes.UPLOAD_JOB_ANNOTATIONS_FAILED: {
            const { job } = action.payload;
            const { loads } = state.activities;

            delete loads[job.id];

            return {
                ...state,
                activities: {
                    ...state.activities,
                    loads: {
                        ...loads,
                    },
                },
            };
        }
        case AnnotationActionTypes.UPLOAD_JOB_ANNOTATIONS_SUCCESS: {
            const { states, job, history } = action.payload;
            const { loads } = state.activities;

            delete loads[job.id];

            return {
                ...state,
                activities: {
                    ...state.activities,
                    loads: {
                        ...loads,
                    },
                },
                annotations: {
                    ...state.annotations,
                    history,
                    states,
                    selectedStatesID: [],
                    activatedStateID: null,
                    collapsed: {},
                },
            };
        }
        case AnnotationActionTypes.REMOVE_JOB_ANNOTATIONS_SUCCESS: {
            const { history } = action.payload;
            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    history,
                    selectedStatesID: [],
                    activatedStateID: null,
                    collapsed: {},
                    states: [],
                },
            };
        }
        case AnnotationActionTypes.UPDATE_CANVAS_CONTEXT_MENU: {
            const {
                visible, left, top, type, pointID,
            } = action.payload;

            return {
                ...state,
                canvas: {
                    ...state.canvas,
                    contextMenu: {
                        ...state.canvas.contextMenu,
                        visible,
                        left,
                        top,
                        type,
                        pointID,
                        clientID: state.annotations.activatedStateID,
                    },
                },
            };
        }
        case AnnotationActionTypes.REDO_ACTION_SUCCESS:
        case AnnotationActionTypes.UNDO_ACTION_SUCCESS: {
            const {
                history, states, minZ, maxZ,
            } = action.payload;

            const activatedStateID = states
                .map((_state: any) => _state.clientID)
                .includes(state.annotations.activatedStateID) ?
                state.annotations.activatedStateID :
                null;

            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    activatedStateID,
                    states,
                    history,
                    zLayer: {
                        min: minZ,
                        max: maxZ,
                        cur: maxZ,
                    },
                },
            };
        }
        case AnnotationActionTypes.FETCH_ANNOTATIONS_SUCCESS: {
            const { states, minZ, maxZ } = action.payload;
            const activatedStateID = states
                .map((_state: any) => _state.clientID)
                .includes(state.annotations.activatedStateID) ?
                state.annotations.activatedStateID :
                null;

            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    activatedStateID,
                    states,
                    zLayer: {
                        min: minZ,
                        max: maxZ,
                        cur: maxZ,
                    },
                },
            };
        }
        case AnnotationActionTypes.CHANGE_ANNOTATIONS_FILTERS: {
            const { filters } = action.payload;
            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    filters,
                },
            };
        }
        case AnnotationActionTypes.SWITCH_Z_LAYER: {
            const { cur } = action.payload;
            const { max, min } = state.annotations.zLayer;

            let { activatedStateID } = state.annotations;
            if (activatedStateID !== null) {
                const idx = state.annotations.states.map((_state: any) => _state.clientID).indexOf(activatedStateID);
                if (idx !== -1) {
                    if (state.annotations.states[idx].zOrder > cur) {
                        activatedStateID = null;
                    }
                } else {
                    activatedStateID = null;
                }
            }

            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    activatedStateID,
                    zLayer: {
                        ...state.annotations.zLayer,
                        cur: Math.max(Math.min(cur, max), min),
                    },
                },
            };
        }
        case AnnotationActionTypes.ADD_Z_LAYER: {
            const { max } = state.annotations.zLayer;
            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    zLayer: {
                        ...state.annotations.zLayer,
                        max: max + 1,
                        cur: max + 1,
                    },
                },
            };
        }
        case AnnotationActionTypes.INTERACT_WITH_CANVAS: {
            const { activeInteractor, activeLabelID } = action.payload;
            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    activatedStateID: null,
                },
                drawing: {
                    ...state.drawing,
                    activeInteractor,
                    activeLabelID,
                },
                canvas: {
                    ...state.canvas,
                    activeControl: activeInteractor.type.startsWith('opencv') ?
                        ActiveControl.OPENCV_TOOLS :
                        ActiveControl.AI_TOOLS,
                },
            };
        }
        case AnnotationActionTypes.SWITCH_REQUEST_REVIEW_DIALOG: {
            const { visible } = action.payload;
            return {
                ...state,
                requestReviewDialogVisible: visible,
            };
        }
        case AnnotationActionTypes.SWITCH_SUBMIT_REVIEW_DIALOG: {
            const { visible } = action.payload;
            return {
                ...state,
                submitReviewDialogVisible: visible,
            };
        }
        case AnnotationActionTypes.SET_FORCE_EXIT_ANNOTATION_PAGE_FLAG: {
            const { forceExit } = action.payload;
            return {
                ...state,
                annotations: {
                    ...state.annotations,
                    saving: {
                        ...state.annotations.saving,
                        forceExit,
                    },
                },
            };
        }
        case AnnotationActionTypes.CHANGE_WORKSPACE: {
            const { workspace } = action.payload;
            if (state.canvas.activeControl !== ActiveControl.CURSOR) {
                return state;
            }

            return {
                ...state,
                workspace,
            };
        }
        case AnnotationActionTypes.UPDATE_PREDICTOR_STATE: {
            const { payload } = action;
            return {
                ...state,
                predictor: {
                    ...state.predictor,
                    ...payload,
                },
            };
        }
        case AnnotationActionTypes.GET_PREDICTIONS: {
            return {
                ...state,
                predictor: {
                    ...state.predictor,
                    fetching: true,
                },
            };
        }
        case AnnotationActionTypes.GET_PREDICTIONS_SUCCESS: {
            const { frame } = action.payload;
            const annotatedFrames = [...state.predictor.annotatedFrames, frame];

            return {
                ...state,
                predictor: {
                    ...state.predictor,
                    fetching: false,
                    annotatedFrames,
                },
            };
        }
        case AnnotationActionTypes.GET_PREDICTIONS_FAILED: {
            return {
                ...state,
                predictor: {
                    ...state.predictor,
                    fetching: false,
                },
            };
        }
        case AnnotationActionTypes.RESET_CANVAS: {
            return {
                ...state,
                canvas: {
                    ...state.canvas,
                    activeControl: ActiveControl.CURSOR,
                },
            };
        }
        case AnnotationActionTypes.HIDE_SHOW_CONTEXT_IMAGE: {
            const { hidden } = action.payload;
            return {
                ...state,
                player: {
                    ...state.player,
                    contextImage: {
                        ...state.player.contextImage,
                        hidden,
                    },
                },
            };
        }
        case AnnotationActionTypes.GET_CONTEXT_IMAGE: {
            return {
                ...state,
                player: {
                    ...state.player,
                    contextImage: {
                        ...state.player.contextImage,
                        fetching: true,
                    },
                },
            };
        }
        case AnnotationActionTypes.GET_CONTEXT_IMAGE_SUCCESS: {
            const { contextImageData } = action.payload;

            return {
                ...state,
                player: {
                    ...state.player,
                    contextImage: {
                        ...state.player.contextImage,
                        fetching: false,
                        data: contextImageData,
                    },
                },
            };
        }
        case AnnotationActionTypes.GET_CONTEXT_IMAGE_FAILED: {
            return {
                ...state,
                player: {
                    ...state.player,
                    contextImage: {
                        ...state.player.contextImage,
                        fetching: false,
                    },
                },
            };
        }
        case AnnotationActionTypes.CLOSE_JOB:
        case AuthActionTypes.LOGOUT_SUCCESS: {
            return { ...defaultState };
        }
        default: {
            return state;
        }
    }
};
