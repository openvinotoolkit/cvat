// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { AnyAction } from 'redux';
import { BoundariesActionTypes } from 'actions/boundaries-actions';
import { TasksActionTypes } from 'actions/tasks-actions';
import { AuthActionTypes } from 'actions/auth-actions';

import { TasksState, Task } from './interfaces';

const defaultState: TasksState = {
    initialized: false,
    fetching: false,
    updating: false,
    hideEmpty: false,
    count: 0,
    current: [],
    gettingQuery: {
        page: 1,
        id: null,
        search: null,
        owner: null,
        assignee: null,
        name: null,
        status: null,
        mode: null,
    },
    activities: {
        dumps: {},
        exports: {},
        loads: {},
        deletes: {},
        creates: {
            taskId: null,
            status: '',
            error: '',
        },
    },
};

export default (state: TasksState = defaultState, action: AnyAction): TasksState => {
    switch (action.type) {
        case TasksActionTypes.GET_TASKS:
            return {
                ...state,
                activities: {
                    ...state.activities,
                    deletes: {},
                },
                initialized: false,
                fetching: true,
                hideEmpty: true,
                count: 0,
                current: [],
                gettingQuery: { ...action.payload.query },
            };
        case TasksActionTypes.GET_TASKS_SUCCESS: {
            const combinedWithPreviews = action.payload.array.map(
                (task: any, index: number): Task => ({
                    instance: task,
                    preview: action.payload.previews[index],
                }),
            );

            return {
                ...state,
                initialized: true,
                fetching: false,
                count: action.payload.count,
                current: combinedWithPreviews,
                gettingQuery: { ...action.payload.query },
            };
        }
        case TasksActionTypes.GET_TASKS_FAILED:
            return {
                ...state,
                initialized: true,
                fetching: false,
            };
        case TasksActionTypes.DUMP_ANNOTATIONS: {
            const { task } = action.payload;
            const { dumper } = action.payload;
            const { dumps } = state.activities;

            dumps[task.id] =
                task.id in dumps && !dumps[task.id].includes(dumper.name)
                    ? [...dumps[task.id], dumper.name]
                    : dumps[task.id] || [dumper.name];

            return {
                ...state,
                activities: {
                    ...state.activities,
                    dumps: {
                        ...dumps,
                    },
                },
            };
        }
        case TasksActionTypes.DUMP_ANNOTATIONS_FAILED:
        case TasksActionTypes.DUMP_ANNOTATIONS_SUCCESS: {
            const { task } = action.payload;
            const { dumper } = action.payload;
            const { dumps } = state.activities;

            dumps[task.id] = dumps[task.id].filter((dumperName: string): boolean => dumperName !== dumper.name);

            return {
                ...state,
                activities: {
                    ...state.activities,
                    dumps: {
                        ...dumps,
                    },
                },
            };
        }
        case TasksActionTypes.EXPORT_DATASET: {
            const { task } = action.payload;
            const { exporter } = action.payload;
            const { exports: activeExports } = state.activities;

            activeExports[task.id] =
                task.id in activeExports && !activeExports[task.id].includes(exporter.name)
                    ? [...activeExports[task.id], exporter.name]
                    : activeExports[task.id] || [exporter.name];

            return {
                ...state,
                activities: {
                    ...state.activities,
                    exports: {
                        ...activeExports,
                    },
                },
            };
        }
        case TasksActionTypes.EXPORT_DATASET_FAILED:
        case TasksActionTypes.EXPORT_DATASET_SUCCESS: {
            const { task } = action.payload;
            const { exporter } = action.payload;
            const { exports: activeExports } = state.activities;

            activeExports[task.id] = activeExports[task.id].filter(
                (exporterName: string): boolean => exporterName !== exporter.name,
            );

            return {
                ...state,
                activities: {
                    ...state.activities,
                    exports: {
                        ...activeExports,
                    },
                },
            };
        }
        case TasksActionTypes.LOAD_ANNOTATIONS: {
            const { task } = action.payload;
            const { loader } = action.payload;
            const { loads } = state.activities;

            loads[task.id] = task.id in loads ? loads[task.id] : loader.name;

            return {
                ...state,
                activities: {
                    ...state.activities,
                    loads: {
                        ...loads,
                    },
                },
            };
        }
        case TasksActionTypes.LOAD_ANNOTATIONS_FAILED:
        case TasksActionTypes.LOAD_ANNOTATIONS_SUCCESS: {
            const { task } = action.payload;
            const { loads } = state.activities;

            delete loads[task.id];

            return {
                ...state,
                activities: {
                    ...state.activities,
                    loads: {
                        ...loads,
                    },
                },
            };
        }
        case TasksActionTypes.DELETE_TASK: {
            const { taskID } = action.payload;
            const { deletes } = state.activities;

            deletes[taskID] = false;

            return {
                ...state,
                activities: {
                    ...state.activities,
                    deletes: {
                        ...deletes,
                    },
                },
            };
        }
        case TasksActionTypes.DELETE_TASK_SUCCESS: {
            const { taskID } = action.payload;
            const { deletes } = state.activities;

            deletes[taskID] = true;

            return {
                ...state,
                activities: {
                    ...state.activities,
                    deletes: {
                        ...deletes,
                    },
                },
            };
        }
        case TasksActionTypes.DELETE_TASK_FAILED: {
            const { taskID } = action.payload;
            const { deletes } = state.activities;

            delete deletes[taskID];

            return {
                ...state,
                activities: {
                    ...state.activities,
                    deletes: {
                        ...deletes,
                    },
                },
            };
        }
        case TasksActionTypes.CREATE_TASK: {
            return {
                ...state,
                activities: {
                    ...state.activities,
                    creates: {
                        taskId: null,
                        status: '',
                        error: '',
                    },
                },
            };
        }
        case TasksActionTypes.CREATE_TASK_STATUS_UPDATED: {
            const { status } = action.payload;

            return {
                ...state,
                activities: {
                    ...state.activities,
                    creates: {
                        ...state.activities.creates,
                        status,
                    },
                },
            };
        }
        case TasksActionTypes.CREATE_TASK_SUCCESS: {
            const { taskId } = action.payload;
            return {
                ...state,
                activities: {
                    ...state.activities,
                    creates: {
                        ...state.activities.creates,
                        taskId,
                        status: 'CREATED',
                    },
                },
            };
        }
        case TasksActionTypes.CREATE_TASK_FAILED: {
            return {
                ...state,
                activities: {
                    ...state.activities,
                    creates: {
                        ...state.activities.creates,
                        status: 'FAILED',
                        error: action.payload.error.toString(),
                    },
                },
            };
        }
        case TasksActionTypes.UPDATE_TASK: {
            return {
                ...state,
                updating: true,
            };
        }
        case TasksActionTypes.UPDATE_TASK_SUCCESS: {
            // a task will be undefined after updating when a user doesn't have access to the task anymore
            const { task, taskID } = action.payload;

            if (typeof task === 'undefined') {
                return {
                    ...state,
                    updating: false,
                    current: state.current.filter((_task: Task): boolean => _task.instance.id !== taskID),
                };
            }

            return {
                ...state,
                updating: false,
                current: state.current.map(
                    (_task): Task => {
                        if (_task.instance.id === task.id) {
                            return {
                                ..._task,
                                instance: task,
                            };
                        }

                        return _task;
                    },
                ),
            };
        }
        case TasksActionTypes.UPDATE_TASK_FAILED: {
            return {
                ...state,
                updating: false,
                current: state.current.map(
                    (task): Task => {
                        if (task.instance.id === action.payload.task.id) {
                            return {
                                ...task,
                                instance: action.payload.task,
                            };
                        }

                        return task;
                    },
                ),
            };
        }
        case TasksActionTypes.HIDE_EMPTY_TASKS: {
            return {
                ...state,
                hideEmpty: action.payload.hideEmpty,
            };
        }
        case TasksActionTypes.SYNC_TASK_WITH_CLOWDER: {
            return {
                ...state,
                updating: true,
            };
        }

        case TasksActionTypes.SYNC_TASK_WITH_CLOWDER_SUCCESS:
        case TasksActionTypes.SYNC_TASK_WITH_CLOWDER_FAILED: {
            return {
                ...state,
                updating: false,
            };
        }
        case BoundariesActionTypes.RESET_AFTER_ERROR:
        case AuthActionTypes.LOGOUT_SUCCESS: {
            return { ...defaultState };
        }
        default:
            return state;
    }
};
