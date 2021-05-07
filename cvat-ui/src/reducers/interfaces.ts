// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { MutableRefObject } from 'react';
import { Canvas3d } from 'cvat-canvas3d/src/typescript/canvas3d';
import { Canvas, RectDrawingMethod } from 'cvat-canvas-wrapper';
import { IntelligentScissors } from 'utils/opencv-wrapper/intelligent-scissors';
import { KeyMap } from 'utils/mousetrap-react';

export type StringObject = {
    [index: string]: string;
};

export interface AuthState {
    initialized: boolean;
    fetching: boolean;
    user: any;
    authActionsFetching: boolean;
    authActionsInitialized: boolean;
    showChangePasswordDialog: boolean;
    allowChangePassword: boolean;
    allowResetPassword: boolean;
}

export interface ProjectsQuery {
    page: number;
    id: number | null;
    search: string | null;
    owner: string | null;
    name: string | null;
    status: string | null;
    [key: string]: string | number | null | undefined;
}

export type Project = any;

export interface ProjectsState {
    initialized: boolean;
    fetching: boolean;
    count: number;
    current: Project[];
    gettingQuery: ProjectsQuery;
    activities: {
        creates: {
            id: null | number;
            error: string;
        };
        deletes: {
            [projectId: number]: boolean; // deleted (deleting if in dictionary)
        };
    };
}

export interface TasksQuery {
    page: number;
    id: number | null;
    search: string | null;
    owner: string | null;
    assignee: string | null;
    name: string | null;
    status: string | null;
    mode: string | null;
    [key: string]: string | number | null;
}

export interface Task {
    instance: any; // cvat-core instance
    preview: string;
}

export interface TasksState {
    initialized: boolean;
    fetching: boolean;
    updating: boolean;
    hideEmpty: boolean;
    gettingQuery: TasksQuery;
    count: number;
    current: Task[];
    activities: {
        dumps: {
            // dumps in different formats at the same time
            [tid: number]: string[]; // dumper names
        };
        exports: {
            // exports in different formats at the same time
            [tid: number]: string[]; // dumper names
        };
        loads: {
            // only one loading simultaneously
            [tid: number]: string; // loader name
        };
        deletes: {
            [tid: number]: boolean; // deleted (deleting if in dictionary)
        };
        creates: {
            taskId: number | null;
            status: string;
            error: string;
        };
    };
}

export interface FormatsState {
    annotationFormats: any;
    fetching: boolean;
    initialized: boolean;
}

export enum SupportedPlugins {
    GIT_INTEGRATION = 'GIT_INTEGRATION',
    ANALYTICS = 'ANALYTICS',
    MODELS = 'MODELS',
    PREDICT = 'PREDICT',
}

export type PluginsList = {
    [name in SupportedPlugins]: boolean;
};

export interface PluginsState {
    fetching: boolean;
    initialized: boolean;
    list: PluginsList;
}

export interface AboutState {
    server: any;
    packageVersion: {
        core: string;
        canvas: string;
        ui: string;
    };
    fetching: boolean;
    initialized: boolean;
}

export interface UserAgreement {
    name: string;
    displayText: string;
    url: string;
    required: boolean;
}

export interface UserAgreementsState {
    list: UserAgreement[];
    fetching: boolean;
    initialized: boolean;
}

export interface ShareFileInfo {
    // get this data from cvat-core
    name: string;
    type: 'DIR' | 'REG';
}

export interface ShareItem {
    name: string;
    type: 'DIR' | 'REG';
    children: ShareItem[];
}

export interface ShareState {
    root: ShareItem;
}

export interface Model {
    id: string;
    name: string;
    labels: string[];
    framework: string;
    description: string;
    type: string;
    params: {
        canvas: Record<string, unknown>;
    };
}

export type OpenCVTool = IntelligentScissors;
export enum TaskStatus {
    ANNOTATION = 'annotation',
    REVIEW = 'validation',
    COMPLETED = 'completed',
}

export enum RQStatus {
    unknown = 'unknown',
    queued = 'queued',
    started = 'started',
    finished = 'finished',
    failed = 'failed',
}

export interface ActiveInference {
    status: RQStatus;
    progress: number;
    error: string;
    id: string;
}

export interface ModelsState {
    initialized: boolean;
    fetching: boolean;
    creatingStatus: string;
    interactors: Model[];
    detectors: Model[];
    trackers: Model[];
    reid: Model[];
    inferences: {
        [index: number]: ActiveInference;
    };
    visibleRunWindows: boolean;
    activeRunTask: any;
}

export interface ErrorState {
    message: string;
    reason: string;
    className?: string;
}

export interface NotificationsState {
    errors: {
        auth: {
            authorized: null | ErrorState;
            login: null | ErrorState;
            logout: null | ErrorState;
            register: null | ErrorState;
            changePassword: null | ErrorState;
            requestPasswordReset: null | ErrorState;
            resetPassword: null | ErrorState;
            loadAuthActions: null | ErrorState;
        };
        projects: {
            fetching: null | ErrorState;
            updating: null | ErrorState;
            deleting: null | ErrorState;
            creating: null | ErrorState;
        };
        tasks: {
            fetching: null | ErrorState;
            updating: null | ErrorState;
            dumping: null | ErrorState;
            loading: null | ErrorState;
            exporting: null | ErrorState;
            deleting: null | ErrorState;
            creating: null | ErrorState;
        };
        formats: {
            fetching: null | ErrorState;
        };
        users: {
            fetching: null | ErrorState;
        };
        about: {
            fetching: null | ErrorState;
        };
        share: {
            fetching: null | ErrorState;
        };
        models: {
            starting: null | ErrorState;
            fetching: null | ErrorState;
            canceling: null | ErrorState;
            metaFetching: null | ErrorState;
            inferenceStatusFetching: null | ErrorState;
        };
        annotation: {
            saving: null | ErrorState;
            jobFetching: null | ErrorState;
            frameFetching: null | ErrorState;
            contextImageFetching: null | ErrorState;
            changingLabelColor: null | ErrorState;
            updating: null | ErrorState;
            creating: null | ErrorState;
            merging: null | ErrorState;
            grouping: null | ErrorState;
            splitting: null | ErrorState;
            removing: null | ErrorState;
            propagating: null | ErrorState;
            collectingStatistics: null | ErrorState;
            savingJob: null | ErrorState;
            uploadAnnotations: null | ErrorState;
            removeAnnotations: null | ErrorState;
            fetchingAnnotations: null | ErrorState;
            undo: null | ErrorState;
            redo: null | ErrorState;
            search: null | ErrorState;
            searchEmptyFrame: null | ErrorState;
            savingLogs: null | ErrorState;
        };
        boundaries: {
            resetError: null | ErrorState;
        };
        userAgreements: {
            fetching: null | ErrorState;
        };
        review: {
            initialization: null | ErrorState;
            finishingIssue: null | ErrorState;
            resolvingIssue: null | ErrorState;
            reopeningIssue: null | ErrorState;
            commentingIssue: null | ErrorState;
            submittingReview: null | ErrorState;
        };
        predictor: {
            prediction: null | ErrorState;
        };
    };
    messages: {
        tasks: {
            loadingDone: string;
        };
        models: {
            inferenceDone: string;
        };
        auth: {
            changePasswordDone: string;
            registerDone: string;
            requestPasswordResetDone: string;
            resetPasswordDone: string;
        };
    };
}

export enum ActiveControl {
    CURSOR = 'cursor',
    DRAG_CANVAS = 'drag_canvas',
    ZOOM_CANVAS = 'zoom_canvas',
    DRAW_RECTANGLE = 'draw_rectangle',
    DRAW_POLYGON = 'draw_polygon',
    DRAW_POLYLINE = 'draw_polyline',
    DRAW_POINTS = 'draw_points',
    DRAW_CUBOID = 'draw_cuboid',
    MERGE = 'merge',
    GROUP = 'group',
    SPLIT = 'split',
    EDIT = 'edit',
    OPEN_ISSUE = 'open_issue',
    AI_TOOLS = 'ai_tools',
    PHOTO_CONTEXT = 'PHOTO_CONTEXT',
    OPENCV_TOOLS = 'opencv_tools',
}

export enum ShapeType {
    RECTANGLE = 'rectangle',
    POLYGON = 'polygon',
    POLYLINE = 'polyline',
    POINTS = 'points',
    CUBOID = 'cuboid',
}

export enum ObjectType {
    SHAPE = 'shape',
    TRACK = 'track',
    TAG = 'tag',
}

export enum StatesOrdering {
    ID_DESCENT = 'ID - descent',
    ID_ASCENT = 'ID - ascent',
    UPDATED = 'Updated time',
}

export enum ContextMenuType {
    CANVAS_SHAPE = 'canvas_shape',
    CANVAS_SHAPE_POINT = 'canvas_shape_point',
}

export enum Rotation {
    ANTICLOCKWISE90,
    CLOCKWISE90,
}

export interface PredictorState {
    timeRemaining: number;
    progress: number;
    projectScore: number;
    message: string;
    error: Error | null;
    enabled: boolean;
    fetching: boolean;
    annotationAmount: number;
    mediaAmount: number;
    annotatedFrames: number[];
}

export interface AnnotationState {
    activities: {
        loads: {
            // only one loading simultaneously
            [jid: number]: string; // loader name
        };
    };
    canvas: {
        contextMenu: {
            visible: boolean;
            top: number;
            left: number;
            type: ContextMenuType;
            pointID: number | null;
            clientID: number | null;
        };
        instance: Canvas | Canvas3d;
        ready: boolean;
        activeControl: ActiveControl;
    };
    job: {
        openTime: null | number;
        labels: any[];
        requestedId: number | null;
        instance: any | null | undefined;
        attributes: Record<number, any[]>;
        fetching: boolean;
        saving: boolean;
    };
    player: {
        frame: {
            number: number;
            filename: string;
            hasRelatedContext: boolean;
            data: any | null;
            fetching: boolean;
            delay: number;
            changeTime: number | null;
        };
        playing: boolean;
        frameAngles: number[];
        contextImage: {
            fetching: boolean;
            data: string | null;
            hidden: boolean;
        };
    };
    drawing: {
        activeInteractor?: Model | OpenCVTool;
        activeShapeType: ShapeType;
        activeRectDrawingMethod?: RectDrawingMethod;
        activeNumOfPoints?: number;
        activeLabelID: number;
        activeObjectType: ObjectType;
        activeInitialState?: any;
    };
    annotations: {
        selectedStatesID: number[];
        activatedStateID: number | null;
        activatedAttributeID: number | null;
        collapsed: Record<number, boolean>;
        collapsedAll: boolean;
        states: any[];
        filters: any[];
        resetGroupFlag: boolean;
        history: {
            undo: [string, number][];
            redo: [string, number][];
        };
        saving: {
            forceExit: boolean;
            uploading: boolean;
            statuses: string[];
        };
        zLayer: {
            min: number;
            max: number;
            cur: number;
        };
    };
    propagate: {
        objectState: any | null;
        frames: number;
    };
    statistics: {
        collecting: boolean;
        visible: boolean;
        data: any;
    };
    colors: any[];
    filtersPanelVisible: boolean;
    requestReviewDialogVisible: boolean;
    submitReviewDialogVisible: boolean;
    sidebarCollapsed: boolean;
    appearanceCollapsed: boolean;
    tabContentHeight: number;
    workspace: Workspace;
    predictor: PredictorState;
    aiToolsRef: MutableRefObject<any>;
}

export enum Workspace {
    STANDARD3D = 'Standard 3D',
    STANDARD = 'Standard',
    ATTRIBUTE_ANNOTATION = 'Attribute annotation',
    TAG_ANNOTATION = 'Tag annotation',
    REVIEW_WORKSPACE = 'Review',
}

export enum GridColor {
    White = 'White',
    Black = 'Black',
    Red = 'Red',
    Green = 'Green',
    Blue = 'Blue',
}

export enum FrameSpeed {
    Fastest = 100,
    Fast = 50,
    Usual = 25,
    Slow = 15,
    Slower = 12,
    Slowest = 1,
}

export enum ColorBy {
    INSTANCE = 'Instance',
    GROUP = 'Group',
    LABEL = 'Label',
}

export interface PlayerSettingsState {
    canvasBackgroundColor: string;
    frameStep: number;
    frameSpeed: FrameSpeed;
    resetZoom: boolean;
    rotateAll: boolean;
    grid: boolean;
    gridSize: number;
    gridColor: GridColor;
    gridOpacity: number; // in %
    brightnessLevel: number;
    contrastLevel: number;
    saturationLevel: number;
}

export interface WorkspaceSettingsState {
    autoSave: boolean;
    autoSaveInterval: number; // in ms
    aamZoomMargin: number;
    automaticBordering: boolean;
    showObjectsTextAlways: boolean;
    showAllInterpolationTracks: boolean;
    intelligentPolygonCrop: boolean;
}

export interface ShapesSettingsState {
    colorBy: ColorBy;
    opacity: number;
    selectedOpacity: number;
    outlined: boolean;
    outlineColor: string;
    showBitmap: boolean;
    showProjections: boolean;
}

export interface SettingsState {
    shapes: ShapesSettingsState;
    workspace: WorkspaceSettingsState;
    player: PlayerSettingsState;
    showDialog: boolean;
}

export interface ShortcutsState {
    visibleShortcutsHelp: boolean;
    keyMap: KeyMap;
    normalizedKeyMap: Record<string, string>;
}

export enum ReviewStatus {
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    REVIEW_FURTHER = 'review_further',
}

export interface ReviewState {
    reviews: any[];
    issues: any[];
    frameIssues: any[];
    latestComments: string[];
    activeReview: any | null;
    newIssuePosition: number[] | null;
    issuesHidden: boolean;
    fetching: {
        reviewId: number | null;
        issueId: number | null;
    };
}

export interface CombinedState {
    auth: AuthState;
    projects: ProjectsState;
    tasks: TasksState;
    about: AboutState;
    share: ShareState;
    formats: FormatsState;
    userAgreements: UserAgreementsState;
    plugins: PluginsState;
    models: ModelsState;
    notifications: NotificationsState;
    annotation: AnnotationState;
    settings: SettingsState;
    shortcuts: ShortcutsState;
    review: ReviewState;
}

export enum DimensionType {
    DIM_3D = '3d',
    DIM_2D = '2d',
}
