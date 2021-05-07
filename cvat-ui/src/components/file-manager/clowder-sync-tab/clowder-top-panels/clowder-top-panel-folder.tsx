// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import React from 'react';
import { Row } from 'antd/lib/grid';
import { FileAddTwoTone } from '@ant-design/icons';
import { ClowderFileDto, CombinedState } from 'reducers/interfaces';
import { useDispatch, useSelector } from 'react-redux';
import { getPathFolderFilesAsync, getPathRootFilesAsync } from 'actions/clowder-actions';
import { Breadcrumb } from 'antd';
import ClowderTopPanel from './clowder-top-panel';

interface Props {
    selectedFilesCount: number;
    onAdd: () => void;
}

function ClowderTopPanelFolder(props: Props): JSX.Element {
    const dispatch = useDispatch();
    const { selectedFilesCount, onAdd } = props;

    const { path } = useSelector((state: CombinedState) => state.clowder);

    const currentFolder: ClowderFileDto | null = path[path.length - 1];

    const handleClickRoot = (): void => {
        dispatch(getPathRootFilesAsync());
    };

    const handleClickFolder = (folder: ClowderFileDto): void => {
        dispatch(getPathFolderFilesAsync(folder));
    };

    return (
        <>
            <ClowderTopPanel
                title='Files Viewer:'
                selectedFilesCount={selectedFilesCount}
                btnIcon={<FileAddTwoTone />}
                btnTitle='Add to CVAT'
                handleClick={onAdd}
            />

            {!!path.length && (
                <Row style={{ marginBottom: 8 }}>
                    <Breadcrumb separator='>' className='cvat-clowder-top-panel-breadcrumb'>
                        <Breadcrumb.Item href={undefined} onClick={handleClickRoot}>
                            Root
                        </Breadcrumb.Item>

                        {path.map((folder: ClowderFileDto) =>
                            folder === currentFolder ? (
                                <Breadcrumb.Item key={folder.clowderid}>{folder.name}</Breadcrumb.Item>
                            ) : (
                                <Breadcrumb.Item
                                    key={folder.clowderid}
                                    href={undefined}
                                    onClick={() => handleClickFolder(folder)}
                                >
                                    {folder.name}
                                </Breadcrumb.Item>
                            ),
                        )}
                    </Breadcrumb>
                </Row>
            )}
        </>
    );
}

export default React.memo(ClowderTopPanelFolder);
