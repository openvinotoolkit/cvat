// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import React from 'react';
import Spin from 'antd/lib/spin';
import Paragraph from 'antd/lib/typography/Paragraph';
import Text from 'antd/lib/typography/Text';
import { useSelector } from 'react-redux';
import { CombinedState } from 'reducers/interfaces';
import ClowderTableFolder from './clowder-tables/clowder-table-folder';
import ClowderTableUpload from './clowder-tables/clowder-table-upload';
import ClowderForm from './clowder-form';

function ClowderSyncTab(): JSX.Element {
    const fetching = useSelector((state: CombinedState) => state.clowder.fetching);

    return (
        <Spin spinning={fetching}>
            <ClowderForm />

            <Paragraph>
                <Text type='secondary'>Attach a repository from Clowder</Text>
            </Paragraph>

            <ClowderTableFolder />

            <br />

            <ClowderTableUpload />
        </Spin>
    );
}

export default React.memo(ClowderSyncTab);
