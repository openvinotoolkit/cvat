// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { ClowderActionTypes } from 'actions/clowder-actions';
import { ShareActionTypes } from 'actions/share-actions';
import { TasksActionTypes } from 'actions/tasks-actions';
import { AnyAction } from 'redux';
import { ClowderFileDto, ClowderState } from './interfaces';

const defaultState: ClowderState = {
    datasetId: '',
    apiKey: '',
    currentFolderFiles: [],
    filesToUpload: [],
    path: [],
    fetching: false,
};

export default function (state: ClowderState = defaultState, action: AnyAction): ClowderState {
    switch (action.type) {
        case ClowderActionTypes.GET_CLOWDER_PATH_FOLDER_FILES:
        case ClowderActionTypes.GET_CLOWDER_ROOT_FILES:
        case ClowderActionTypes.GET_CLOWDER_PATH_ROOT_FILES:
        case ClowderActionTypes.GET_CLOWDER_FOLDER_FILES:
        case TasksActionTypes.CREATE_TASK: {
            return {
                ...state,
                fetching: true,
            };
        }

        case ClowderActionTypes.GET_CLOWDER_ROOT_FILES_SUCCESS: {
            const { files } = action.payload;

            return {
                ...state,
                path: [],
                currentFolderFiles: files,
                filesToUpload: [],
                fetching: false,
            };
        }

        case ClowderActionTypes.GET_CLOWDER_PATH_ROOT_FILES_SUCCESS: {
            const { files } = action.payload;

            return {
                ...state,
                path: [],
                currentFolderFiles: files,
                fetching: false,
            };
        }

        case ClowderActionTypes.GET_CLOWDER_FOLDER_FILES_SUCCESS: {
            const { files, currentFolder } = action.payload;

            return {
                ...state,
                path: [...state.path, currentFolder],
                currentFolderFiles: files,
                fetching: false,
            };
        }

        case ClowderActionTypes.GET_CLOWDER_PATH_FOLDER_FILES_SUCCESS: {
            const { files, newPath } = action.payload;

            return {
                ...state,
                path: newPath,
                currentFolderFiles: files,
                fetching: false,
            };
        }

        case ClowderActionTypes.GET_CLOWDER_ROOT_FILES_FAILED:
        case ClowderActionTypes.GET_CLOWDER_PATH_ROOT_FILES_FAILED:
        case ClowderActionTypes.GET_CLOWDER_FOLDER_FILES_FAILED:
        case ClowderActionTypes.GET_CLOWDER_PATH_FOLDER_FILES_FAILED:
        case TasksActionTypes.CREATE_TASK_FAILED: {
            return {
                ...state,
                fetching: false,
            };
        }

        case TasksActionTypes.CREATE_TASK_SUCCESS: {
            return {
                ...state,
                currentFolderFiles: [],
                filesToUpload: [],
                fetching: false,
            };
        }

        case ClowderActionTypes.COPY_CLOWDER_FILES_TO_UPLOAD_TABLE: {
            const { files } = action.payload;

            return {
                ...state,
                filesToUpload: [...state.filesToUpload, ...files],
            };
        }

        case ClowderActionTypes.REMOVE_CLOWDER_FILES_FROM_UPLOAD_TABLE: {
            const { files } = action.payload;
            const removeFileIds = files.map(({ clowderid }: ClowderFileDto) => clowderid);

            return {
                ...state,
                filesToUpload: state.filesToUpload.filter(
                    (file: ClowderFileDto) => !removeFileIds.includes(file.clowderid),
                ),
            };
        }

        case ClowderActionTypes.SET_CLOWDER_DATASET_ID: {
            const { datasetId } = action.payload;

            return {
                ...state,
                datasetId,
            };
        }

        case ClowderActionTypes.SET_CLOWDER_API_KEY: {
            const { apiKey } = action.payload;

            return {
                ...state,
                apiKey,
            };
        }

        case ClowderActionTypes.CLEAR_CLOWDER_TABLES: {
            return {
                ...state,
                currentFolderFiles: [],
                filesToUpload: [],
                path: [],
            };
        }

        case ShareActionTypes.LOAD_SHARE_DATA: {
            return {
                ...defaultState,
            };
        }

        default:
            return state;
    }
}
