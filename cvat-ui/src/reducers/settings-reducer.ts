// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { AnyAction } from 'redux';

import { BoundariesActionTypes } from 'actions/boundaries-actions';
import { AuthActionTypes } from 'actions/auth-actions';
import { SettingsActionTypes } from 'actions/settings-actions';
import { AnnotationActionTypes } from 'actions/annotation-actions';

import {
    SettingsState, GridColor, FrameSpeed, ColorBy, DimensionType,
} from './interfaces';

const defaultState: SettingsState = {
    shapes: {
        colorBy: ColorBy.LABEL,
        opacity: 3,
        selectedOpacity: 30,
        outlined: false,
        outlineColor: '#000000',
        showBitmap: false,
        showProjections: false,
    },
    workspace: {
        autoSave: false,
        autoSaveInterval: 15 * 60 * 1000,
        aamZoomMargin: 100,
        automaticBordering: false,
        showObjectsTextAlways: false,
        showAllInterpolationTracks: false,
        intelligentPolygonCrop: true,
    },
    player: {
        canvasBackgroundColor: '#ffffff',
        frameStep: 10,
        frameSpeed: FrameSpeed.Usual,
        resetZoom: false,
        rotateAll: false,
        grid: false,
        gridSize: 100,
        gridColor: GridColor.White,
        gridOpacity: 100,
        brightnessLevel: 100,
        contrastLevel: 100,
        saturationLevel: 100,
    },
    showDialog: false,
};

export default (state = defaultState, action: AnyAction): SettingsState => {
    switch (action.type) {
        case SettingsActionTypes.SWITCH_ROTATE_ALL: {
            return {
                ...state,
                player: {
                    ...state.player,
                    rotateAll: action.payload.rotateAll,
                },
            };
        }
        case SettingsActionTypes.SWITCH_GRID: {
            return {
                ...state,
                player: {
                    ...state.player,
                    grid: action.payload.grid,
                },
            };
        }
        case SettingsActionTypes.CHANGE_GRID_SIZE: {
            return {
                ...state,
                player: {
                    ...state.player,
                    gridSize: action.payload.gridSize,
                },
            };
        }
        case SettingsActionTypes.CHANGE_GRID_COLOR: {
            return {
                ...state,
                player: {
                    ...state.player,
                    gridColor: action.payload.gridColor,
                },
            };
        }
        case SettingsActionTypes.CHANGE_GRID_OPACITY: {
            return {
                ...state,
                player: {
                    ...state.player,
                    gridOpacity: action.payload.gridOpacity,
                },
            };
        }
        case SettingsActionTypes.CHANGE_SHAPES_COLOR_BY: {
            return {
                ...state,
                shapes: {
                    ...state.shapes,
                    colorBy: action.payload.colorBy,
                },
            };
        }
        case SettingsActionTypes.CHANGE_SHAPES_OPACITY: {
            return {
                ...state,
                shapes: {
                    ...state.shapes,
                    opacity: action.payload.opacity,
                },
            };
        }
        case SettingsActionTypes.CHANGE_SELECTED_SHAPES_OPACITY: {
            return {
                ...state,
                shapes: {
                    ...state.shapes,
                    selectedOpacity: action.payload.selectedOpacity,
                },
            };
        }
        case SettingsActionTypes.CHANGE_SHAPES_OUTLINED_BORDERS: {
            return {
                ...state,
                shapes: {
                    ...state.shapes,
                    outlined: action.payload.outlined,
                    outlineColor: action.payload.color,
                },
            };
        }
        case SettingsActionTypes.CHANGE_SHAPES_SHOW_PROJECTIONS: {
            return {
                ...state,
                shapes: {
                    ...state.shapes,
                    showProjections: action.payload.showProjections,
                },
            };
        }
        case SettingsActionTypes.CHANGE_SHOW_UNLABELED_REGIONS: {
            return {
                ...state,
                shapes: {
                    ...state.shapes,
                    showBitmap: action.payload.showBitmap,
                },
            };
        }
        case SettingsActionTypes.CHANGE_FRAME_STEP: {
            return {
                ...state,
                player: {
                    ...state.player,
                    frameStep: action.payload.frameStep,
                },
            };
        }
        case SettingsActionTypes.CHANGE_FRAME_SPEED: {
            return {
                ...state,
                player: {
                    ...state.player,
                    frameSpeed: action.payload.frameSpeed,
                },
            };
        }
        case SettingsActionTypes.SWITCH_RESET_ZOOM: {
            return {
                ...state,
                player: {
                    ...state.player,
                    resetZoom: action.payload.resetZoom,
                },
            };
        }
        case SettingsActionTypes.CHANGE_BRIGHTNESS_LEVEL: {
            return {
                ...state,
                player: {
                    ...state.player,
                    brightnessLevel: action.payload.level,
                },
            };
        }
        case SettingsActionTypes.CHANGE_CONTRAST_LEVEL: {
            return {
                ...state,
                player: {
                    ...state.player,
                    contrastLevel: action.payload.level,
                },
            };
        }
        case SettingsActionTypes.CHANGE_SATURATION_LEVEL: {
            return {
                ...state,
                player: {
                    ...state.player,
                    saturationLevel: action.payload.level,
                },
            };
        }
        case SettingsActionTypes.SWITCH_AUTO_SAVE: {
            return {
                ...state,
                workspace: {
                    ...state.workspace,
                    autoSave: action.payload.autoSave,
                },
            };
        }
        case SettingsActionTypes.CHANGE_AUTO_SAVE_INTERVAL: {
            return {
                ...state,
                workspace: {
                    ...state.workspace,
                    autoSaveInterval: action.payload.autoSaveInterval,
                },
            };
        }
        case SettingsActionTypes.CHANGE_AAM_ZOOM_MARGIN: {
            return {
                ...state,
                workspace: {
                    ...state.workspace,
                    aamZoomMargin: action.payload.aamZoomMargin,
                },
            };
        }
        case SettingsActionTypes.SWITCH_SHOWNIG_INTERPOLATED_TRACKS: {
            return {
                ...state,
                workspace: {
                    ...state.workspace,
                    showAllInterpolationTracks: action.payload.showAllInterpolationTracks,
                },
            };
        }
        case SettingsActionTypes.SWITCH_SHOWING_OBJECTS_TEXT_ALWAYS: {
            return {
                ...state,
                workspace: {
                    ...state.workspace,
                    showObjectsTextAlways: action.payload.showObjectsTextAlways,
                },
            };
        }
        case SettingsActionTypes.SWITCH_AUTOMATIC_BORDERING: {
            return {
                ...state,
                workspace: {
                    ...state.workspace,
                    automaticBordering: action.payload.automaticBordering,
                },
            };
        }
        case SettingsActionTypes.SWITCH_INTELLIGENT_POLYGON_CROP: {
            return {
                ...state,
                workspace: {
                    ...state.workspace,
                    intelligentPolygonCrop: action.payload.intelligentPolygonCrop,
                },
            };
        }
        case SettingsActionTypes.CHANGE_CANVAS_BACKGROUND_COLOR: {
            return {
                ...state,
                player: {
                    ...state.player,
                    canvasBackgroundColor: action.payload.color,
                },
            };
        }
        case SettingsActionTypes.SWITCH_SETTINGS_DIALOG: {
            return {
                ...state,
                showDialog: typeof action.payload.show === 'undefined' ? !state.showDialog : action.payload.show,
            };
        }
        case SettingsActionTypes.SET_SETTINGS: {
            return {
                ...state,
                ...action.payload.settings,
            };
        }
        case BoundariesActionTypes.RESET_AFTER_ERROR:
        case AnnotationActionTypes.GET_JOB_SUCCESS: {
            const { job } = action.payload;

            return {
                ...state,
                player: {
                    ...state.player,
                    resetZoom: job && job.task.mode === 'annotation',
                },
                shapes: {
                    ...defaultState.shapes,
                    ...(job.task.dimension === DimensionType.DIM_3D ?
                        {
                            opacity: 40,
                            selectedOpacity: 60,
                        } :
                        {}),
                },
            };
        }
        case AuthActionTypes.LOGOUT_SUCCESS: {
            return { ...defaultState };
        }
        default: {
            return state;
        }
    }
};
