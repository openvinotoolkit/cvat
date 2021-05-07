// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React, { useEffect, useState } from 'react';
import { notification } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { QuestionCircleOutlined, ShrinkOutlined } from '@ant-design/icons';
import Spin from 'antd/lib/spin';
import Image from 'antd/lib/image';

import { CombinedState } from 'reducers/interfaces';
import { hideShowContextImage, getContextImage } from 'actions/annotation-actions';
import CVATTooltip from 'components/common/cvat-tooltip';

export default function ContextImage(): JSX.Element | null {
    const dispatch = useDispatch();
    const { number: frame, hasRelatedContext } = useSelector((state: CombinedState) => state.annotation.player.frame);
    const { data: contextImageData, hidden: contextImageHidden, fetching: contextImageFetching } = useSelector(
        (state: CombinedState) => state.annotation.player.contextImage,
    );
    const [requested, setRequested] = useState(false);

    useEffect(() => {
        if (requested) {
            setRequested(false);
        }
    }, [frame]);

    useEffect(() => {
        if (hasRelatedContext && !contextImageHidden && !requested) {
            dispatch(getContextImage());
            setRequested(true);
        }
    }, [contextImageHidden, requested, hasRelatedContext]);

    if (!hasRelatedContext) {
        return null;
    }

    return (
        <div className='cvat-context-image-wrapper' {...(contextImageHidden ? { style: { width: '32px' } } : {})}>
            <div className='cvat-context-image-wrapper-header' />
            {contextImageFetching ? <Spin size='small' /> : null}
            {contextImageHidden ? (
                <CVATTooltip title='A context image is available'>
                    <QuestionCircleOutlined
                        className='cvat-context-image-switcher'
                        onClick={() => dispatch(hideShowContextImage(false))}
                    />
                </CVATTooltip>
            ) : (
                <>
                    <ShrinkOutlined
                        className='cvat-context-image-switcher'
                        onClick={() => dispatch(hideShowContextImage(true))}
                    />
                    <Image
                        {...(contextImageData ? { src: contextImageData } : {})}
                        onError={() => {
                            notification.error({
                                message: 'Could not display context image',
                                description: `Source is  ${
                                    contextImageData === null ? 'empty' : contextImageData.slice(0, 100)
                                }`,
                            });
                        }}
                        className='cvat-context-image'
                    />
                </>
            )}
        </div>
    );
}
