// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import React from 'react';
import { DeleteTwoTone } from '@ant-design/icons';
import ClowderTopPanel from './clowder-top-panel';

interface Props {
    selectedFilesCount: number;
    onDelete: () => void;
}

function ClowderTopPanelUpload(props: Props): JSX.Element {
    const { selectedFilesCount, onDelete } = props;

    return (
        <ClowderTopPanel
            title='CVAT Upload:'
            selectedFilesCount={selectedFilesCount}
            btnIcon={<DeleteTwoTone />}
            btnTitle='Delete'
            handleClick={onDelete}
        />
    );
}

export default React.memo(ClowderTopPanelUpload);
