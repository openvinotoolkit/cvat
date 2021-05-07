// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import Input from 'antd/lib/input';
import { Col, Row } from 'antd/lib/grid';

import { PredictorState, Workspace } from 'reducers/interfaces';
import LeftGroup from './left-group';
import PlayerButtons from './player-buttons';
import PlayerNavigation from './player-navigation';
import RightGroup from './right-group';

interface Props {
    playing: boolean;
    saving: boolean;
    savingStatuses: string[];
    frameNumber: number;
    frameFilename: string;
    inputFrameRef: React.RefObject<Input>;
    startFrame: number;
    stopFrame: number;
    undoAction?: string;
    redoAction?: string;
    workspace: Workspace;
    saveShortcut: string;
    undoShortcut: string;
    redoShortcut: string;
    playPauseShortcut: string;
    nextFrameShortcut: string;
    previousFrameShortcut: string;
    forwardShortcut: string;
    backwardShortcut: string;
    prevButtonType: string;
    nextButtonType: string;
    focusFrameInputShortcut: string;
    predictor: PredictorState;
    isTrainingActive: boolean;
    changeWorkspace(workspace: Workspace): void;
    switchPredictor(predictorEnabled: boolean): void;
    showStatistics(): void;
    showFilters(): void;
    onSwitchPlay(): void;
    onSaveAnnotation(): void;
    onPrevFrame(): void;
    onNextFrame(): void;
    onForward(): void;
    onBackward(): void;
    onFirstFrame(): void;
    onLastFrame(): void;
    setPrevButtonType(type: 'regular' | 'filtered' | 'empty'): void;
    setNextButtonType(type: 'regular' | 'filtered' | 'empty'): void;
    onSliderChange(value: number): void;
    onInputChange(value: number): void;
    onURLIconClick(): void;
    onUndoClick(): void;
    onRedoClick(): void;
    jobInstance: any;
}

export default function AnnotationTopBarComponent(props: Props): JSX.Element {
    const {
        saving,
        savingStatuses,
        undoAction,
        redoAction,
        playing,
        frameNumber,
        frameFilename,
        inputFrameRef,
        startFrame,
        stopFrame,
        workspace,
        saveShortcut,
        undoShortcut,
        redoShortcut,
        playPauseShortcut,
        nextFrameShortcut,
        previousFrameShortcut,
        forwardShortcut,
        backwardShortcut,
        prevButtonType,
        nextButtonType,
        predictor,
        focusFrameInputShortcut,
        showStatistics,
        switchPredictor,
        showFilters,
        changeWorkspace,
        onSwitchPlay,
        onSaveAnnotation,
        onPrevFrame,
        onNextFrame,
        onForward,
        onBackward,
        onFirstFrame,
        onLastFrame,
        setPrevButtonType,
        setNextButtonType,
        onSliderChange,
        onInputChange,
        onURLIconClick,
        onUndoClick,
        onRedoClick,
        jobInstance,
        isTrainingActive,
    } = props;

    return (
        <Row justify='space-between'>
            <LeftGroup
                saving={saving}
                savingStatuses={savingStatuses}
                undoAction={undoAction}
                redoAction={redoAction}
                saveShortcut={saveShortcut}
                undoShortcut={undoShortcut}
                redoShortcut={redoShortcut}
                onSaveAnnotation={onSaveAnnotation}
                onUndoClick={onUndoClick}
                onRedoClick={onRedoClick}
            />
            <Col className='cvat-annotation-header-player-group'>
                <Row align='middle'>
                    <PlayerButtons
                        playing={playing}
                        playPauseShortcut={playPauseShortcut}
                        nextFrameShortcut={nextFrameShortcut}
                        previousFrameShortcut={previousFrameShortcut}
                        forwardShortcut={forwardShortcut}
                        backwardShortcut={backwardShortcut}
                        prevButtonType={prevButtonType}
                        nextButtonType={nextButtonType}
                        onPrevFrame={onPrevFrame}
                        onNextFrame={onNextFrame}
                        onForward={onForward}
                        onBackward={onBackward}
                        onFirstFrame={onFirstFrame}
                        onLastFrame={onLastFrame}
                        onSwitchPlay={onSwitchPlay}
                        setPrevButton={setPrevButtonType}
                        setNextButton={setNextButtonType}
                    />
                    <PlayerNavigation
                        startFrame={startFrame}
                        stopFrame={stopFrame}
                        frameNumber={frameNumber}
                        frameFilename={frameFilename}
                        focusFrameInputShortcut={focusFrameInputShortcut}
                        inputFrameRef={inputFrameRef}
                        onSliderChange={onSliderChange}
                        onInputChange={onInputChange}
                        onURLIconClick={onURLIconClick}
                    />
                </Row>
            </Col>
            <RightGroup
                predictor={predictor}
                workspace={workspace}
                switchPredictor={switchPredictor}
                jobInstance={jobInstance}
                changeWorkspace={changeWorkspace}
                showStatistics={showStatistics}
                isTrainingActive={isTrainingActive}
                showFilters={showFilters}
            />
        </Row>
    );
}
