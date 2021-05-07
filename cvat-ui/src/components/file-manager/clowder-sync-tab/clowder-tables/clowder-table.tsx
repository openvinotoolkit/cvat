// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import { Table } from 'antd';
import { TableRowSelection } from 'antd/lib/table/interface';
import { FileTwoTone, FolderTwoTone } from '@ant-design/icons';
import React, { Key } from 'react';
import { ClowderFileDto } from 'reducers/interfaces';
import sortClowderFiles from './clowder-table-sorter';
import getDuplicationMap from './get-duplication-map';
import isImageFile from './is-image-file';

interface Props {
    files: ClowderFileDto[];
    selectedFileIds: string[];
    filesToUploadIds?: string[];
    highlightDuplicatedNames: boolean;
    hasFilesCollision?: boolean;
    handleChangeSelect: (newSelectedFileIds: Key[], newSelectedFiles: ClowderFileDto[]) => void;
    handleClickFolder?: (folder: ClowderFileDto) => void;
}

function ClowderTable(props: Props): JSX.Element {
    const {
        files,
        selectedFileIds,
        filesToUploadIds,
        highlightDuplicatedNames,
        hasFilesCollision,
        handleClickFolder,
        handleChangeSelect,
    } = props;

    const sortedFiles = sortClowderFiles(files);
    const fileNamesCountMap = getDuplicationMap(files);

    const renderFileCell = (file: ClowderFileDto): JSX.Element => (
        <div className='cvat-clowder-table-cell'>
            <FileTwoTone />

            <span
                className={`cvat-clowder-table-cell-text ${
                    (highlightDuplicatedNames && fileNamesCountMap[file.name] > 1) ||
                    (hasFilesCollision && !isImageFile(file))
                        ? 'cvat-clowder-table-cell-text-duplicate'
                        : ''
                }`}
                title={file.name}
            >
                &nbsp;&nbsp;
                {file.name}
            </span>
        </div>
    );

    const renderFolderCell = (file: ClowderFileDto): JSX.Element => (
        <div className='cvat-clowder-table-cell'>
            <button
                className={handleClickFolder ? 'cvat-clowder-table-link-btn' : 'cvat-clowder-table-link-btn-disabled'}
                type='button'
                {...(handleClickFolder && { onClick: () => handleClickFolder(file) })}
            >
                <FolderTwoTone />

                <span className='cvat-clowder-table-cell-text' title={file.name}>
                    &nbsp;&nbsp;
                    {file.name}
                </span>
            </button>
        </div>
    );

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            width: 450,
            render: (_: string, file: ClowderFileDto) => (file.is_file ? renderFileCell(file) : renderFolderCell(file)),
        },
        {
            title: 'Created on',
            dataIndex: 'created',
            render: (created: string | null) =>
                created
                    ? new Date(created).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                      })
                    : '',
        },
    ];

    const rowSelection: TableRowSelection<ClowderFileDto> = {
        selectedRowKeys: selectedFileIds,
        onChange: handleChangeSelect,
        ...(filesToUploadIds && {
            getCheckboxProps: (file: ClowderFileDto) => ({
                disabled: filesToUploadIds.includes(file.clowderid),
                name: file.name,
            }),
        }),
    };

    return (
        <Table
            className='cvat-clowder-table'
            rowKey='clowderid'
            rowSelection={rowSelection}
            columns={columns}
            dataSource={sortedFiles}
            pagination={false}
            size='small'
            scroll={{ y: 227 }}
        />
    );
}

export default React.memo(ClowderTable);
