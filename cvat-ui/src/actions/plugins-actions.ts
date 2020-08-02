// Copyright (C) 2020 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { ActionUnion, createAction, ThunkAction } from 'utils/redux';
import { SupportedPlugins } from 'reducers/interfaces';
import PluginChecker from 'utils/plugin-checker';

export enum PluginsActionTypes {
    CHECK_PLUGINS = 'CHECK_PLUGINS',
    CHECKED_ALL_PLUGINS = 'CHECKED_ALL_PLUGINS',
    RAISE_PLUGIN_CHECK_ERROR = 'RAISE_PLUGIN_CHECK_ERROR'
}

type PluginObjects = Record<SupportedPlugins, boolean>;

const pluginActions = {
    checkPlugins: () => createAction(PluginsActionTypes.CHECK_PLUGINS),
    checkedAllPlugins: (list: PluginObjects) => (
        createAction(PluginsActionTypes.CHECKED_ALL_PLUGINS, {
            list,
        })
    ),
    raisePluginCheckError: (error: Error) => (
        createAction(PluginsActionTypes.RAISE_PLUGIN_CHECK_ERROR, {
            error,
        })
    ),
};

export type PluginActions = ActionUnion<typeof pluginActions>;

export function checkPluginsAsync(): ThunkAction {
    return async (dispatch): Promise<void> => {
        dispatch(pluginActions.checkPlugins());
        const plugins: PluginObjects = {
            ANALYTICS: false,
            GIT_INTEGRATION: false,
            DEXTR_SEGMENTATION: false,
        };

        try {
            let pluginCheckError: any = null;

            const promises: Promise<boolean>[] = [
                PluginChecker.check(SupportedPlugins.ANALYTICS).catch((err) => {
                    pluginCheckError = err;
                    return false;
                }),
                PluginChecker.check(SupportedPlugins.GIT_INTEGRATION).catch(
                    (err) => {
                        pluginCheckError = err;
                        return false;
                    },
                ),
                PluginChecker.check(SupportedPlugins.DEXTR_SEGMENTATION).catch(
                    (err) => {
                        pluginCheckError = err;
                        return false;
                    },
                ),
            ];

            const values = await Promise.all(promises);
            [plugins.ANALYTICS, plugins.GIT_INTEGRATION,
                plugins.DEXTR_SEGMENTATION] = values;
            dispatch(pluginActions.checkedAllPlugins(plugins));

            if (pluginCheckError instanceof Error) throw pluginCheckError;
        } catch (error) {
            dispatch(pluginActions.raisePluginCheckError(error));
        }
    };
}
