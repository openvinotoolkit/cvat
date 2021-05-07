// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { ActionUnion, createAction, ThunkAction, ThunkDispatch } from 'utils/redux';
import getCore from 'cvat-core-wrapper';
import { LogType } from 'cvat-logger';
import { computeZRange } from './annotation-actions';

const cvat = getCore();

export enum BoundariesActionTypes {
    RESET_AFTER_ERROR = 'RESET_AFTER_ERROR',
    THROW_RESET_ERROR = 'THROW_RESET_ERROR',
}

export const boundariesActions = {
    resetAfterError: (
        job: any,
        states: any[],
        frameNumber: number,
        frameData: any | null,
        minZ: number,
        maxZ: number,
        colors: string[],
    ) =>
        createAction(BoundariesActionTypes.RESET_AFTER_ERROR, {
            job,
            states,
            frameNumber,
            frameData,
            minZ,
            maxZ,
            colors,
        }),
    throwResetError: () => createAction(BoundariesActionTypes.THROW_RESET_ERROR),
};

export function resetAfterErrorAsync(): ThunkAction {
    return async (dispatch: ThunkDispatch, getState): Promise<void> => {
        try {
            const state = getState();
            const job = state.annotation.job.instance;

            if (job) {
                const currentFrame = state.annotation.player.frame.number;
                const { showAllInterpolationTracks } = state.settings.workspace;
                const frameNumber = Math.max(Math.min(job.stopFrame, currentFrame), job.startFrame);

                const states = await job.annotations.get(frameNumber, showAllInterpolationTracks, []);
                const frameData = await job.frames.get(frameNumber);
                const [minZ, maxZ] = computeZRange(states);
                const colors = [...cvat.enums.colors];

                await job.logger.log(LogType.restoreJob);

                dispatch(boundariesActions.resetAfterError(job, states, frameNumber, frameData, minZ, maxZ, colors));
            } else {
                dispatch(boundariesActions.resetAfterError(null, [], 0, null, 0, 0, []));
            }
        } catch (error) {
            dispatch(boundariesActions.throwResetError());
        }
    };
}

export type BoundariesActions = ActionUnion<typeof boundariesActions>;
