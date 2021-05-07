// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import React, { Key, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ClowderFileDto, CombinedState } from 'reducers/interfaces';
import { clowderActions, getFolderFilesAsync } from 'actions/clowder-actions';
import ClowderTopPanelFolder from '../clowder-top-panels/clowder-top-panel-folder';
import ClowderTable from './clowder-table';

function ClowderTableFolder(): JSX.Element {
    const folderFiles = useSelector((state: CombinedState) => state.clowder.currentFolderFiles);
    const filesToUpload = useSelector((state: CombinedState) => state.clowder.filesToUpload);
    const filesToUploadIds = filesToUpload.map(({ clowderid }: ClowderFileDto) => clowderid);

    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<ClowderFileDto[]>([]);

    const dispatch = useDispatch();

    useEffect(() => {
        setSelectedFileIds([]);
        setSelectedFiles([]);
    }, [folderFiles]);

    const handleClickFolder = (folder: ClowderFileDto): void => {
        dispatch(getFolderFilesAsync(folder));
    };

    const handleChangeSelect = (newSelectedFileIds: Key[], newSelectedFiles: ClowderFileDto[]): void => {
        setSelectedFileIds(newSelectedFileIds as string[]);
        setSelectedFiles(newSelectedFiles);
    };

    const handleAdd = (): void => {
        dispatch(clowderActions.copyFilesToUpload(selectedFiles));
        setSelectedFileIds([]);
        setSelectedFiles([]);
    };

    return (
        <>
            <ClowderTopPanelFolder selectedFilesCount={selectedFileIds.length} onAdd={handleAdd} />

            <ClowderTable
                files={folderFiles}
                selectedFileIds={selectedFileIds}
                filesToUploadIds={filesToUploadIds}
                highlightDuplicatedNames={false}
                handleClickFolder={handleClickFolder}
                handleChangeSelect={handleChangeSelect}
            />
        </>
    );
}

export default React.memo(ClowderTableFolder);
