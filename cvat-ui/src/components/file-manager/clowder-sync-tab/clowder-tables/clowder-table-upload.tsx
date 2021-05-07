// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import React, { Key, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Row } from 'antd';
import { ClowderFileDto, CombinedState } from 'reducers/interfaces';
import { clowderActions } from 'actions/clowder-actions';
import ClowderTable from './clowder-table';
import ClowderTopPanelUpload from '../clowder-top-panels/clowder-top-panel-upload';
import getDuplicationString from './get-duplication-string';
import hasFileTypesCollision from './has-file-types-collision';

function ClowderTableUpload(): JSX.Element {
    const filesToUpload = useSelector((state: CombinedState) => state.clowder.filesToUpload);
    const duplicatedNamesStr = getDuplicationString(filesToUpload);
    const hasFilesCollision = hasFileTypesCollision(filesToUpload);

    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<ClowderFileDto[]>([]);

    const dispatch = useDispatch();

    useEffect(() => {
        setSelectedFileIds([]);
        setSelectedFiles([]);
    }, [filesToUpload]);

    const handleChangeSelect = (newSelectedFileIds: Key[], newSelectedFiles: ClowderFileDto[]): void => {
        setSelectedFileIds(newSelectedFileIds as string[]);
        setSelectedFiles(newSelectedFiles);
    };

    const handleDelete = (): void => {
        dispatch(clowderActions.removeFilesFromUpload(selectedFiles));
    };

    return (
        <>
            <ClowderTopPanelUpload selectedFilesCount={selectedFileIds.length} onDelete={handleDelete} />

            <Row style={{ marginBottom: 8 }}>
                <ClowderTable
                    files={filesToUpload}
                    selectedFileIds={selectedFileIds}
                    highlightDuplicatedNames
                    hasFilesCollision={hasFilesCollision}
                    handleChangeSelect={handleChangeSelect}
                />
            </Row>

            {duplicatedNamesStr && (
                <Alert
                    message='Some files have the same names. Please, rename them in Clowder.'
                    description={duplicatedNamesStr}
                    type='warning'
                />
            )}

            {duplicatedNamesStr && hasFilesCollision && <Row style={{ height: 8 }} />}

            {hasFilesCollision && (
                <Alert
                    message='Either a single video/archive/pdf/zip, or a set of images and directories can be uploaded for one task.'
                    type='warning'
                />
            )}
        </>
    );
}

export default React.memo(ClowderTableUpload);
