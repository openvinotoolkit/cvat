// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { Col } from 'antd/lib/grid';
import Icon from '@ant-design/icons';
import Select from 'antd/lib/select';
import Button from 'antd/lib/button';
import Text from 'antd/lib/typography/Text';
import Tooltip from 'antd/lib/tooltip';
import Moment from 'react-moment';

import moment from 'moment';
import { useSelector } from 'react-redux';

import {
    FilterIcon, FullscreenIcon, InfoIcon, BrainIcon,
} from 'icons';
import {
    CombinedState, DimensionType, Workspace, PredictorState,
} from 'reducers/interfaces';

interface Props {
    workspace: Workspace;
    predictor: PredictorState;
    isTrainingActive: boolean;
    showStatistics(): void;
    switchPredictor(predictorEnabled: boolean): void;
    showFilters(): void;
    changeWorkspace(workspace: Workspace): void;

    jobInstance: any;
}

function RightGroup(props: Props): JSX.Element {
    const {
        showStatistics,
        changeWorkspace,
        switchPredictor,
        workspace,
        predictor,
        jobInstance,
        isTrainingActive,
        showFilters,
    } = props;
    const annotationAmount = predictor.annotationAmount || 0;
    const mediaAmount = predictor.mediaAmount || 0;
    const formattedScore = `${(predictor.projectScore * 100).toFixed(0)}%`;
    const predictorTooltip = (
        <div className='cvat-predictor-tooltip'>
            <span>Adaptive auto annotation is</span>
            {predictor.enabled ? (
                <Text type='success' strong>
                    {' active'}
                </Text>
            ) : (
                <Text type='warning' strong>
                    {' inactive'}
                </Text>
            )}
            <br />
            <span>
                Annotations amount:
                {annotationAmount}
            </span>
            <br />
            <span>
                Media amount:
                {mediaAmount}
            </span>
            <br />
            {annotationAmount > 0 ? (
                <span>
                    Model mAP is
                    {' '}
                    {formattedScore}
                    <br />
                </span>
            ) : null}
            {predictor.error ? (
                <Text type='danger'>
                    {predictor.error.toString()}
                    <br />
                </Text>
            ) : null}
            {predictor.message ? (
                <span>
                    Status:
                    {' '}
                    {predictor.message}
                    <br />
                </span>
            ) : null}
            {predictor.timeRemaining > 0 ? (
                <span>
                    Time Remaining:
                    {' '}
                    <Moment date={moment().add(-predictor.timeRemaining, 's')} format='hh:mm:ss' trim durationFromNow />
                    <br />
                </span>
            ) : null}
            {predictor.progress > 0 ? (
                <span>
                    Progress:
                    {predictor.progress.toFixed(1)}
                    {' '}
                    %
                </span>
            ) : null}
        </div>
    );

    let predictorClassName = 'cvat-annotation-header-button cvat-predictor-button';
    if (!!predictor.error || !predictor.projectScore) {
        predictorClassName += ' cvat-predictor-disabled';
    } else if (predictor.enabled) {
        if (predictor.fetching) {
            predictorClassName += ' cvat-predictor-fetching';
        }
        predictorClassName += ' cvat-predictor-inprogress';
    }

    const filters = useSelector((state: CombinedState) => state.annotation.annotations.filters);

    return (
        <Col className='cvat-annotation-header-right-group'>
            {isTrainingActive && (
                <Button
                    type='link'
                    className={predictorClassName}
                    onClick={() => {
                        switchPredictor(!predictor.enabled);
                    }}
                >
                    <Tooltip title={predictorTooltip}>
                        <Icon component={BrainIcon} />
                    </Tooltip>
                    {annotationAmount ? `mAP ${formattedScore}` : 'not trained'}
                </Button>
            )}
            <Button
                type='link'
                className='cvat-annotation-header-button'
                onClick={(): void => {
                    if (window.document.fullscreenEnabled) {
                        if (window.document.fullscreenElement) {
                            window.document.exitFullscreen();
                        } else {
                            window.document.documentElement.requestFullscreen();
                        }
                    }
                }}
            >
                <Icon component={FullscreenIcon} />
                Fullscreen
            </Button>
            <Button type='link' className='cvat-annotation-header-button' onClick={showStatistics}>
                <Icon component={InfoIcon} />
                Info
            </Button>
            <Button
                type='link'
                className={`cvat-annotation-header-button ${filters.length ? 'filters-armed' : ''}`}
                onClick={showFilters}
            >
                <Icon component={FilterIcon} />
                Filters
            </Button>
            <div>
                <Select
                    dropdownClassName='cvat-workspace-selector-dropdown'
                    className='cvat-workspace-selector'
                    onChange={changeWorkspace}
                    value={workspace}
                >
                    {Object.values(Workspace).map((ws) => {
                        if (jobInstance.task.dimension === DimensionType.DIM_3D) {
                            if (ws === Workspace.STANDARD) {
                                return null;
                            }
                            return (
                                <Select.Option disabled={ws !== Workspace.STANDARD3D} key={ws} value={ws}>
                                    {ws}
                                </Select.Option>
                            );
                        }
                        if (ws !== Workspace.STANDARD3D) {
                            return (
                                <Select.Option key={ws} value={ws}>
                                    {ws}
                                </Select.Option>
                            );
                        }
                        return null;
                    })}
                </Select>
            </div>
        </Col>
    );
}

export default React.memo(RightGroup);
