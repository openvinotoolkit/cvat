// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { ActionCreator } from 'redux';
import { Dispatch } from 'react';
import { ActionUnion, createAction, ThunkAction } from 'utils/redux';
import getCore from 'cvat-core-wrapper';
import { ClowderFileDto } from 'reducers/interfaces';

const cvat = getCore();

export enum ClowderActionTypes {
    GET_CLOWDER_ROOT_FILES = 'GET_CLOWDER_ROOT_FILES',
    GET_CLOWDER_ROOT_FILES_SUCCESS = 'GET_CLOWDER_ROOT_FILES_SUCCESS',
    GET_CLOWDER_ROOT_FILES_FAILED = 'GET_CLOWDER_ROOT_FILES_FAILED',

    GET_CLOWDER_PATH_ROOT_FILES = 'GET_CLOWDER_PATH_ROOT_FILES',
    GET_CLOWDER_PATH_ROOT_FILES_SUCCESS = 'GET_CLOWDER_PATH_ROOT_FILES_SUCCESS',
    GET_CLOWDER_PATH_ROOT_FILES_FAILED = 'GET_CLOWDER_PATH_ROOT_FILES_FAILED',

    GET_CLOWDER_FOLDER_FILES = 'GET_CLOWDER_FOLDER_FILES',
    GET_CLOWDER_FOLDER_FILES_SUCCESS = 'GET_CLOWDER_FOLDER_FILES_SUCCESS',
    GET_CLOWDER_FOLDER_FILES_FAILED = 'GET_CLOWDER_FOLDER_FILES_FAILED',

    GET_CLOWDER_PATH_FOLDER_FILES = 'GET_CLOWDER_PATH_FOLDER_FILES',
    GET_CLOWDER_PATH_FOLDER_FILES_SUCCESS = 'GET_CLOWDER_PATH_FOLDER_FILES_SUCCESS',
    GET_CLOWDER_PATH_FOLDER_FILES_FAILED = 'GET_CLOWDER_PATH_FOLDER_FILES_FAILED',

    COPY_CLOWDER_FILES_TO_UPLOAD_TABLE = 'COPY_CLOWDER_FILES_TO_UPLOAD_TABLE',
    REMOVE_CLOWDER_FILES_FROM_UPLOAD_TABLE = 'REMOVE_CLOWDER_FILES_FROM_UPLOAD_TABLE',

    SET_CLOWDER_DATASET_ID = 'SET_CLOWDER_DATASET_ID',
    SET_CLOWDER_API_KEY = 'SET_CLOWDER_API_KEY',

    CLEAR_CLOWDER_TABLES = 'CLEAR_CLOWDER_TABLES',
}

export const clowderActions = {
    getRootFiles: (datasetId: string) => createAction(ClowderActionTypes.GET_CLOWDER_ROOT_FILES, { datasetId }),
    getRootFilesSuccess: (files: ClowderFileDto[]) =>
        createAction(ClowderActionTypes.GET_CLOWDER_ROOT_FILES_SUCCESS, { files }),
    getRootFilesFailed: (error: unknown) => createAction(ClowderActionTypes.GET_CLOWDER_ROOT_FILES_FAILED, { error }),

    getPathRootFiles: (datasetId: string) =>
        createAction(ClowderActionTypes.GET_CLOWDER_PATH_ROOT_FILES, { datasetId }),
    getPathRootFilesSuccess: (files: ClowderFileDto[]) =>
        createAction(ClowderActionTypes.GET_CLOWDER_PATH_ROOT_FILES_SUCCESS, { files }),
    getPathRootFilesFailed: (error: unknown) =>
        createAction(ClowderActionTypes.GET_CLOWDER_PATH_ROOT_FILES_FAILED, { error }),

    getFolderFiles: (folderId: string) => createAction(ClowderActionTypes.GET_CLOWDER_FOLDER_FILES, { folderId }),
    getFolderFilesSuccess: (files: ClowderFileDto[], currentFolder: ClowderFileDto) =>
        createAction(ClowderActionTypes.GET_CLOWDER_FOLDER_FILES_SUCCESS, { files, currentFolder }),
    getFolderFilesFailed: (error: unknown) =>
        createAction(ClowderActionTypes.GET_CLOWDER_FOLDER_FILES_FAILED, { error }),

    getPathFolderFiles: (folderId: string) => createAction(ClowderActionTypes.GET_CLOWDER_FOLDER_FILES, { folderId }),
    getPathFolderFilesSuccess: (files: ClowderFileDto[], newPath: ClowderFileDto[]) =>
        createAction(ClowderActionTypes.GET_CLOWDER_PATH_FOLDER_FILES_SUCCESS, { files, newPath }),
    getPathFolderFilesFailed: (error: unknown) =>
        createAction(ClowderActionTypes.GET_CLOWDER_PATH_FOLDER_FILES_FAILED, { error }),

    copyFilesToUpload: (files: ClowderFileDto[]) =>
        createAction(ClowderActionTypes.COPY_CLOWDER_FILES_TO_UPLOAD_TABLE, { files }),
    removeFilesFromUpload: (files: ClowderFileDto[]) =>
        createAction(ClowderActionTypes.REMOVE_CLOWDER_FILES_FROM_UPLOAD_TABLE, { files }),

    setDatasetId: (datasetId: string) => createAction(ClowderActionTypes.SET_CLOWDER_DATASET_ID, { datasetId }),
    setApiKey: (apiKey: string) => createAction(ClowderActionTypes.SET_CLOWDER_API_KEY, { apiKey }),

    clearClowderTables: () => createAction(ClowderActionTypes.CLEAR_CLOWDER_TABLES, {}),
};

export type ClowderActions = ActionUnion<typeof clowderActions>;

export function getRootFilesAsync(): ThunkAction<Promise<void>, ClowderActions> {
    return async (dispatch: ActionCreator<Dispatch<ClowderActions>>, getState): Promise<void> => {
        const { datasetId, apiKey } = getState().clowder;

        dispatch(clowderActions.getRootFiles(datasetId));

        try {
            const files: ClowderFileDto[] = await cvat.clowder.getRootFiles(datasetId, apiKey);

            dispatch(clowderActions.getRootFilesSuccess(files));
        } catch (error) {
            dispatch(clowderActions.getRootFilesFailed(error));
        }
    };
}

export function getPathRootFilesAsync(): ThunkAction<Promise<void>, ClowderActions> {
    return async (dispatch: ActionCreator<Dispatch<ClowderActions>>, getState): Promise<void> => {
        const { datasetId, apiKey } = getState().clowder;

        dispatch(clowderActions.getPathRootFiles(datasetId));

        try {
            const files: ClowderFileDto[] = await cvat.clowder.getRootFiles(datasetId, apiKey);

            dispatch(clowderActions.getPathRootFilesSuccess(files));
        } catch (error) {
            dispatch(clowderActions.getPathRootFilesFailed(error));
        }
    };
}

export function getFolderFilesAsync(folder: ClowderFileDto): ThunkAction<Promise<void>, ClowderActions> {
    return async (dispatch: ActionCreator<Dispatch<ClowderActions>>, getState): Promise<void> => {
        const { apiKey } = getState().clowder;

        dispatch(clowderActions.getFolderFiles(folder.clowderid));

        try {
            const files: ClowderFileDto[] = await cvat.clowder.getFolderFiles(
                folder.srcdatasetid,
                folder.clowderid,
                apiKey,
            );

            dispatch(clowderActions.getFolderFilesSuccess(files, folder));
        } catch (error) {
            dispatch(clowderActions.getFolderFilesFailed(error));
        }
    };
}

export function getPathFolderFilesAsync(folder: ClowderFileDto): ThunkAction<Promise<void>, ClowderActions> {
    return async (dispatch: ActionCreator<Dispatch<ClowderActions>>, getState): Promise<void> => {
        const { apiKey } = getState().clowder;

        dispatch(clowderActions.getPathFolderFiles(folder.clowderid));

        try {
            const files: ClowderFileDto[] = await cvat.clowder.getFolderFiles(
                folder.srcdatasetid,
                folder.clowderid,
                apiKey,
            );
            const { path } = getState().clowder;
            const currentFolderIdx = path.findIndex(({ clowderid }: ClowderFileDto) => clowderid === folder.clowderid);

            const newPath: ClowderFileDto[] = currentFolderIdx !== -1 ? path.slice(0, currentFolderIdx + 1) : [];

            dispatch(clowderActions.getPathFolderFilesSuccess(files, newPath));
        } catch (error) {
            dispatch(clowderActions.getPathFolderFilesFailed(error));
        }
    };
}
