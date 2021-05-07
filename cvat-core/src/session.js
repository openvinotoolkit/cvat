// Copyright (C) 2019-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

(() => {
    const store = require('store');
    const PluginRegistry = require('./plugins');
    const loggerStorage = require('./logger-storage');
    const serverProxy = require('./server-proxy');
    const {
        getFrame, getRanges, getPreview, clear: clearFrames, getContextImage,
    } = require('./frames');
    const { ArgumentError, DataError } = require('./exceptions');
    const { TaskStatus } = require('./enums');
    const { Label } = require('./labels');
    const User = require('./user');
    const Issue = require('./issue');
    const Review = require('./review');

    function buildDublicatedAPI(prototype) {
        Object.defineProperties(prototype, {
            annotations: Object.freeze({
                value: {
                    async upload(file, loader) {
                        const result = await PluginRegistry.apiWrapper.call(
                            this,
                            prototype.annotations.upload,
                            file,
                            loader,
                        );
                        return result;
                    },

                    async save(onUpdate) {
                        const result = await PluginRegistry.apiWrapper.call(this, prototype.annotations.save, onUpdate);
                        return result;
                    },

                    async clear(reload = false) {
                        const result = await PluginRegistry.apiWrapper.call(this, prototype.annotations.clear, reload);
                        return result;
                    },

                    async dump(dumper, name = null) {
                        const result = await PluginRegistry.apiWrapper.call(
                            this,
                            prototype.annotations.dump,
                            dumper,
                            name,
                        );
                        return result;
                    },

                    async statistics() {
                        const result = await PluginRegistry.apiWrapper.call(this, prototype.annotations.statistics);
                        return result;
                    },

                    async put(arrayOfObjects = []) {
                        const result = await PluginRegistry.apiWrapper.call(
                            this,
                            prototype.annotations.put,
                            arrayOfObjects,
                        );
                        return result;
                    },

                    async get(frame, allTracks = false, filters = []) {
                        const result = await PluginRegistry.apiWrapper.call(
                            this,
                            prototype.annotations.get,
                            frame,
                            allTracks,
                            filters,
                        );
                        return result;
                    },

                    async search(filters, frameFrom, frameTo) {
                        const result = await PluginRegistry.apiWrapper.call(
                            this,
                            prototype.annotations.search,
                            filters,
                            frameFrom,
                            frameTo,
                        );
                        return result;
                    },

                    async searchEmpty(frameFrom, frameTo) {
                        const result = await PluginRegistry.apiWrapper.call(
                            this,
                            prototype.annotations.searchEmpty,
                            frameFrom,
                            frameTo,
                        );
                        return result;
                    },

                    async select(objectStates, x, y) {
                        const result = await PluginRegistry.apiWrapper.call(
                            this,
                            prototype.annotations.select,
                            objectStates,
                            x,
                            y,
                        );
                        return result;
                    },

                    async merge(objectStates) {
                        const result = await PluginRegistry.apiWrapper.call(
                            this,
                            prototype.annotations.merge,
                            objectStates,
                        );
                        return result;
                    },

                    async split(objectState, frame) {
                        const result = await PluginRegistry.apiWrapper.call(
                            this,
                            prototype.annotations.split,
                            objectState,
                            frame,
                        );
                        return result;
                    },

                    async group(objectStates, reset = false) {
                        const result = await PluginRegistry.apiWrapper.call(
                            this,
                            prototype.annotations.group,
                            objectStates,
                            reset,
                        );
                        return result;
                    },

                    async import(data) {
                        const result = await PluginRegistry.apiWrapper.call(this, prototype.annotations.import, data);
                        return result;
                    },

                    async export() {
                        const result = await PluginRegistry.apiWrapper.call(this, prototype.annotations.export);
                        return result;
                    },

                    async exportDataset(format) {
                        const result = await PluginRegistry.apiWrapper.call(
                            this,
                            prototype.annotations.exportDataset,
                            format,
                        );
                        return result;
                    },

                    hasUnsavedChanges() {
                        const result = prototype.annotations.hasUnsavedChanges.implementation.call(this);
                        return result;
                    },
                },
                writable: true,
            }),
            frames: Object.freeze({
                value: {
                    async get(frame, isPlaying = false, step = 1) {
                        const result = await PluginRegistry.apiWrapper.call(
                            this,
                            prototype.frames.get,
                            frame,
                            isPlaying,
                            step,
                        );
                        return result;
                    },
                    async ranges() {
                        const result = await PluginRegistry.apiWrapper.call(this, prototype.frames.ranges);
                        return result;
                    },
                    async preview() {
                        const result = await PluginRegistry.apiWrapper.call(this, prototype.frames.preview);
                        return result;
                    },
                    async contextImage(taskId, frameId) {
                        const result = await PluginRegistry.apiWrapper.call(
                            this,
                            prototype.frames.contextImage,
                            taskId,
                            frameId,
                        );
                        return result;
                    },
                },
                writable: true,
            }),
            logger: Object.freeze({
                value: {
                    async log(logType, payload = {}, wait = false) {
                        const result = await PluginRegistry.apiWrapper.call(
                            this,
                            prototype.logger.log,
                            logType,
                            payload,
                            wait,
                        );
                        return result;
                    },
                },
                writable: true,
            }),
            actions: Object.freeze({
                value: {
                    async undo(count = 1) {
                        const result = await PluginRegistry.apiWrapper.call(this, prototype.actions.undo, count);
                        return result;
                    },
                    async redo(count = 1) {
                        const result = await PluginRegistry.apiWrapper.call(this, prototype.actions.redo, count);
                        return result;
                    },
                    async freeze(frozen) {
                        const result = await PluginRegistry.apiWrapper.call(this, prototype.actions.freeze, frozen);
                        return result;
                    },
                    async clear() {
                        const result = await PluginRegistry.apiWrapper.call(this, prototype.actions.clear);
                        return result;
                    },
                    async get() {
                        const result = await PluginRegistry.apiWrapper.call(this, prototype.actions.get);
                        return result;
                    },
                },
                writable: true,
            }),
            events: Object.freeze({
                value: {
                    async subscribe(evType, callback) {
                        const result = await PluginRegistry.apiWrapper.call(
                            this,
                            prototype.events.subscribe,
                            evType,
                            callback,
                        );
                        return result;
                    },
                    async unsubscribe(evType, callback = null) {
                        const result = await PluginRegistry.apiWrapper.call(
                            this,
                            prototype.events.unsubscribe,
                            evType,
                            callback,
                        );
                        return result;
                    },
                },
                writable: true,
            }),
            predictor: Object.freeze({
                value: {
                    async status() {
                        const result = await PluginRegistry.apiWrapper.call(this, prototype.predictor.status);
                        return result;
                    },
                    async predict(frame) {
                        const result = await PluginRegistry.apiWrapper.call(this, prototype.predictor.predict, frame);
                        return result;
                    },
                },
                writable: true,
            }),
        });
    }

    /**
     * Base abstract class for Task and Job. It contains common members.
     * @hideconstructor
     * @virtual
     */
    class Session {
        constructor() {
            /**
             * An interaction with annotations
             * @namespace annotations
             * @memberof Session
             */
            /**
             * Upload annotations from a dump file
             * You need upload annotations from a server again after successful executing
             * @method upload
             * @memberof Session.annotations
             * @param {File} annotations - a file with annotations
             * @param {module:API.cvat.classes.Loader} loader - a loader
             * which will be used to upload
             * @instance
             * @async
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ServerError}
             * @throws {module:API.cvat.exceptions.ArgumentError}
             */
            /**
             * Save all changes in annotations on a server
             * Objects which hadn't been saved on a server before,
             * get a serverID after saving. But received object states aren't updated.
             * So, after successful saving it's recommended to update them manually
             * (call the annotations.get() again)
             * @method save
             * @memberof Session.annotations
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ServerError}
             * @instance
             * @async
             * @param {function} [onUpdate] saving can be long.
             * This callback can be used to notify a user about current progress
             * Its argument is a text string
             */
            /**
             * Remove all annotations and optionally reinitialize it
             * @method clear
             * @memberof Session.annotations
             * @param {boolean} [reload = false] reset all changes and
             * reinitialize annotations by data from a server
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ArgumentError}
             * @throws {module:API.cvat.exceptions.ServerError}
             * @instance
             * @async
             */
            /**
             * Dump of annotations to a file.
             * Method always dumps annotations for a whole task.
             * @method dump
             * @memberof Session.annotations
             * @param {module:API.cvat.classes.Dumper} dumper - a dumper
             * @param {string} [name = null] - a name of a file with annotations
             * which will be used to dump
             * @returns {string} URL which can be used in order to get a dump file
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ServerError}
             * @throws {module:API.cvat.exceptions.ArgumentError}
             * @instance
             * @async
             */
            /**
             * Collect short statistics about a task or a job.
             * @method statistics
             * @memberof Session.annotations
             * @returns {module:API.cvat.classes.Statistics} statistics object
             * @throws {module:API.cvat.exceptions.PluginError}
             * @instance
             * @async
             */
            /**
             * Create new objects from one-frame states
             * After successful adding you need to update object states on a frame
             * @method put
             * @memberof Session.annotations
             * @param {module:API.cvat.classes.ObjectState[]} data
             * @returns {number[]} identificators of added objects
             * array of objects on the specific frame
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.DataError}
             * @throws {module:API.cvat.exceptions.ArgumentError}
             * @instance
             * @async
             */
            /**
             * Get annotations for a specific frame
             * </br> Filter supports following operators:
             * ==, !=, >, >=, <, <=, ~= and (), |, & for grouping.
             * </br> Filter supports properties:
             * width, height, label, serverID, clientID, type, shape, occluded
             * </br> All prop values are case-sensitive. CVAT uses json queries for search.
             * </br> Examples:
             * <ul>
             *   <li> label=="car" | label==["road sign"] </li>
             *   <li> width >= height </li>
             *   <li> attr["Attribute 1"] == attr["Attribute 2"] </li>
             *   <li> type=="track" & shape="rectangle" </li>
             *   <li> clientID == 50 </li>
             *   <li> (label=="car" & attr["parked"]==true)
             * | (label=="pedestrian" & width > 150) </li>
             *   <li> (( label==["car \"mazda\""]) &
             * (attr["sunglass ( help ) es"]==true |
             * (width > 150 | height > 150 & (clientID == serverID))))) </li>
             * </ul>
             * <b> If you have double quotes in your query string,
             * please escape them using back slash: \" </b>
             * @method get
             * @param {integer} frame get objects from the frame
             * @param {boolean} allTracks show all tracks
             * even if they are outside and not keyframe
             * @param {any[]} [filters = []]
             * get only objects that satisfied to specific filters
             * @returns {module:API.cvat.classes.ObjectState[]}
             * @memberof Session.annotations
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ArgumentError}
             * @instance
             * @async
             */
            /**
             * Find a frame in the range [from, to]
             * that contains at least one object satisfied to a filter
             * @method search
             * @memberof Session.annotations
             * @param {ObjectFilter} [filter = []] filter
             * @param {integer} from lower bound of a search
             * @param {integer} to upper bound of a search
             * @returns {integer|null} a frame that contains objects according to the filter
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ArgumentError}
             * @instance
             * @async
             */
            /**
             * Find the nearest empty frame without any annotations
             * @method searchEmpty
             * @memberof Session.annotations
             * @param {integer} from lower bound of a search
             * @param {integer} to upper bound of a search
             * @returns {integer|null} a frame that contains objects according to the filter
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ArgumentError}
             * @instance
             * @async
             */
            /**
             * Select shape under a cursor by using minimal distance
             * between a cursor and a shape edge or a shape point
             * For closed shapes a cursor is placed inside a shape
             * @method select
             * @memberof Session.annotations
             * @param {module:API.cvat.classes.ObjectState[]} objectStates
             * objects which can be selected
             * @param {float} x horizontal coordinate
             * @param {float} y vertical coordinate
             * @returns {Object}
             * a pair of {state: ObjectState, distance: number} for selected object.
             * Pair values can be null if there aren't any sutisfied objects
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ArgumentError}
             * @instance
             * @async
             */
            /**
             * Method unites several shapes and tracks into the one
             * All shapes must be the same (rectangle, polygon, etc)
             * All labels must be the same
             * After successful merge you need to update object states on a frame
             * @method merge
             * @memberof Session.annotations
             * @param {module:API.cvat.classes.ObjectState[]} objectStates
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ArgumentError}
             * @instance
             * @async
             */
            /**
             * Method splits a track into two parts
             * (start frame: previous frame), (frame, last frame)
             * After successful split you need to update object states on a frame
             * @method split
             * @memberof Session.annotations
             * @param {module:API.cvat.classes.ObjectState} objectState
             * @param {integer} frame
             * @throws {module:API.cvat.exceptions.ArgumentError}
             * @throws {module:API.cvat.exceptions.PluginError}
             * @instance
             * @async
             */
            /**
             * Method creates a new group and put all passed objects into it
             * After successful split you need to update object states on a frame
             * @method group
             * @memberof Session.annotations
             * @param {module:API.cvat.classes.ObjectState[]} objectStates
             * @param {boolean} reset pass "true" to reset group value (set it to 0)
             * @returns {integer} an ID of created group
             * @throws {module:API.cvat.exceptions.ArgumentError}
             * @throws {module:API.cvat.exceptions.PluginError}
             * @instance
             * @async
             */
            /**
             * Method indicates if there are any changes in
             * annotations which haven't been saved on a server
             * </br><b> This function cannot be wrapped with a plugin </b>
             * @method hasUnsavedChanges
             * @memberof Session.annotations
             * @returns {boolean}
             * @throws {module:API.cvat.exceptions.PluginError}
             * @instance
             */
            /**
             *
             * Import raw data in a collection
             * @method import
             * @memberof Session.annotations
             * @param {Object} data
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ArgumentError}
             * @instance
             * @async
             */
            /**
             *
             * Export a collection as a row data
             * @method export
             * @memberof Session.annotations
             * @returns {Object} data
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ArgumentError}
             * @instance
             * @async
             */
            /**
             * Export as a dataset.
             * Method builds a dataset in the specified format.
             * @method exportDataset
             * @memberof Session.annotations
             * @param {module:String} format - a format
             * @returns {string} An URL to the dataset file
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ServerError}
             * @throws {module:API.cvat.exceptions.ArgumentError}
             * @instance
             * @async
             */
            /**
             * Namespace is used for an interaction with frames
             * @namespace frames
             * @memberof Session
             */
            /**
             * Get frame by its number
             * @method get
             * @memberof Session.frames
             * @param {integer} frame number of frame which you want to get
             * @returns {module:API.cvat.classes.FrameData}
             * @instance
             * @async
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ServerError}
             * @throws {module:API.cvat.exceptions.DataError}
             * @throws {module:API.cvat.exceptions.ArgumentError}
             */
            /**
             * Get the first frame of a task for preview
             * @method preview
             * @memberof Session.frames
             * @returns {string} - jpeg encoded image
             * @instance
             * @async
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ServerError}
             * @throws {module:API.cvat.exceptions.ArgumentError}
             */
            /**
             * Returns the ranges of cached frames
             * @method ranges
             * @memberof Session.frames
             * @returns {Array.<string>}
             * @instance
             * @async
             */
            /**
             * Namespace is used for an interaction with logs
             * @namespace logger
             * @memberof Session
             */
            /**
             * Create a log and add it to a log collection <br>
             * Durable logs will be added after "close" method is called for them <br>
             * The fields "task_id" and "job_id" automatically added when add logs
             * throught a task or a job <br>
             * Ignore rules exist for some logs (e.g. zoomImage, changeAttribute) <br>
             * Payload of ignored logs are shallowly combined to previous logs of the same type
             * @method log
             * @memberof Session.logger
             * @param {module:API.cvat.enums.LogType | string} type - log type
             * @param {Object} [payload = {}] - any other data that will be appended to the log
             * @param {boolean} [wait = false] - specifies if log is durable
             * @returns {module:API.cvat.classes.Log}
             * @instance
             * @async
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ArgumentError}
             */
            /**
             * Namespace is used for an interaction with actions
             * @namespace actions
             * @memberof Session
             */
            /**
             * @typedef {Object} HistoryActions
             * @property {string[]} [undo] - array of possible actions to undo
             * @property {string[]} [redo] - array of possible actions to redo
             * @global
             */
            /**
             * Make undo
             * @method undo
             * @memberof Session.actions
             * @param {number} [count=1] number of actions to undo
             * @returns {number[]} Array of affected objects
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ArgumentError}
             * @instance
             * @async
             */
            /**
             * Make redo
             * @method redo
             * @memberof Session.actions
             * @param {number} [count=1] number of actions to redo
             * @returns {number[]} Array of affected objects
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ArgumentError}
             * @instance
             * @async
             */
            /**
             * Freeze history (do not save new actions)
             * @method freeze
             * @memberof Session.actions
             * @throws {module:API.cvat.exceptions.PluginError}
             * @instance
             * @async
             */
            /**
             * Remove all actions from history
             * @method clear
             * @memberof Session.actions
             * @throws {module:API.cvat.exceptions.PluginError}
             * @instance
             * @async
             */
            /**
             * Get actions
             * @method get
             * @memberof Session.actions
             * @returns {HistoryActions}
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ArgumentError}
             * @returns {Array.<Array.<string|number>>}
             * array of pairs [action name, frame number]
             * @instance
             * @async
             */
            /**
             * Namespace is used for an interaction with events
             * @namespace events
             * @memberof Session
             */
            /**
             * Subscribe on an event
             * @method subscribe
             * @memberof Session.events
             * @param {module:API.cvat.enums.EventType} type - event type
             * @param {functions} callback - function which will be called on event
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ArgumentError}
             * @instance
             * @async
             */
            /**
             * Unsubscribe from an event. If callback is not provided,
             * all callbacks will be removed from subscribers for the event
             * @method unsubscribe
             * @memberof Session.events
             * @param {module:API.cvat.enums.EventType} type - event type
             * @param {functions} [callback = null] - function which is called on event
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ArgumentError}
             * @instance
             * @async
             */
            /**
             * @typedef {Object} PredictorStatus
             * @property {string} message - message for a user to be displayed somewhere
             * @property {number} projectScore - model accuracy
             * @global
             */
            /**
             * Namespace is used for an interaction with events
             * @namespace predictor
             * @memberof Session
             */
            /**
             * Subscribe to updates of a ML model binded to the project
             * @method status
             * @memberof Session.predictor
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ServerError}
             * @returns {PredictorStatus}
             * @instance
             * @async
             */
            /**
             * Get predictions from a ML model binded to the project
             * @method predict
             * @memberof Session.predictor
             * @param {number} frame - number of frame to inference
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ArgumentError}
             * @throws {module:API.cvat.exceptions.ServerError}
             * @throws {module:API.cvat.exceptions.DataError}
             * @returns {object[] | null} annotations
             * @instance
             * @async
             */
        }
    }

    /**
     * Class representing a job.
     * @memberof module:API.cvat.classes
     * @hideconstructor
     * @extends Session
     */
    class Job extends Session {
        constructor(initialData) {
            super();
            const data = {
                id: undefined,
                assignee: null,
                reviewer: null,
                status: undefined,
                start_frame: undefined,
                stop_frame: undefined,
                task: undefined,
            };

            let updatedFields = {
                assignee: false,
                reviewer: false,
                status: false,
            };

            for (const property in data) {
                if (Object.prototype.hasOwnProperty.call(data, property)) {
                    if (property in initialData) {
                        data[property] = initialData[property];
                    }

                    if (data[property] === undefined) {
                        throw new ArgumentError(`Job field "${property}" was not initialized`);
                    }
                }
            }

            if (data.assignee) data.assignee = new User(data.assignee);
            if (data.reviewer) data.reviewer = new User(data.reviewer);

            Object.defineProperties(
                this,
                Object.freeze({
                    /**
                     * @name id
                     * @type {integer}
                     * @memberof module:API.cvat.classes.Job
                     * @readonly
                     * @instance
                     */
                    id: {
                        get: () => data.id,
                    },
                    /**
                     * Instance of a user who is responsible for the job annotations
                     * @name assignee
                     * @type {module:API.cvat.classes.User}
                     * @memberof module:API.cvat.classes.Job
                     * @instance
                     * @throws {module:API.cvat.exceptions.ArgumentError}
                     */
                    assignee: {
                        get: () => data.assignee,
                        set: (assignee) => {
                            if (assignee !== null && !(assignee instanceof User)) {
                                throw new ArgumentError('Value must be a user instance');
                            }
                            updatedFields.assignee = true;
                            data.assignee = assignee;
                        },
                    },
                    /**
                     * Instance of a user who is responsible for review
                     * @name reviewer
                     * @type {module:API.cvat.classes.User}
                     * @memberof module:API.cvat.classes.Job
                     * @instance
                     * @throws {module:API.cvat.exceptions.ArgumentError}
                     */
                    reviewer: {
                        get: () => data.reviewer,
                        set: (reviewer) => {
                            if (reviewer !== null && !(reviewer instanceof User)) {
                                throw new ArgumentError('Value must be a user instance');
                            }
                            updatedFields.reviewer = true;
                            data.reviewer = reviewer;
                        },
                    },
                    /**
                     * @name status
                     * @type {module:API.cvat.enums.TaskStatus}
                     * @memberof module:API.cvat.classes.Job
                     * @instance
                     * @throws {module:API.cvat.exceptions.ArgumentError}
                     */
                    status: {
                        get: () => data.status,
                        set: (status) => {
                            const type = TaskStatus;
                            let valueInEnum = false;
                            for (const value in type) {
                                if (type[value] === status) {
                                    valueInEnum = true;
                                    break;
                                }
                            }

                            if (!valueInEnum) {
                                throw new ArgumentError(
                                    'Value must be a value from the enumeration cvat.enums.TaskStatus',
                                );
                            }

                            updatedFields.status = true;
                            data.status = status;
                        },
                    },
                    /**
                     * @name startFrame
                     * @type {integer}
                     * @memberof module:API.cvat.classes.Job
                     * @readonly
                     * @instance
                     */
                    startFrame: {
                        get: () => data.start_frame,
                    },
                    /**
                     * @name stopFrame
                     * @type {integer}
                     * @memberof module:API.cvat.classes.Job
                     * @readonly
                     * @instance
                     */
                    stopFrame: {
                        get: () => data.stop_frame,
                    },
                    /**
                     * @name task
                     * @type {module:API.cvat.classes.Task}
                     * @memberof module:API.cvat.classes.Job
                     * @readonly
                     * @instance
                     */
                    task: {
                        get: () => data.task,
                    },
                    __updatedFields: {
                        get: () => updatedFields,
                        set: (fields) => {
                            updatedFields = fields;
                        },
                    },
                }),
            );

            // When we call a function, for example: task.annotations.get()
            // In the method get we lose the task context
            // So, we need return it
            this.annotations = {
                get: Object.getPrototypeOf(this).annotations.get.bind(this),
                put: Object.getPrototypeOf(this).annotations.put.bind(this),
                save: Object.getPrototypeOf(this).annotations.save.bind(this),
                dump: Object.getPrototypeOf(this).annotations.dump.bind(this),
                merge: Object.getPrototypeOf(this).annotations.merge.bind(this),
                split: Object.getPrototypeOf(this).annotations.split.bind(this),
                group: Object.getPrototypeOf(this).annotations.group.bind(this),
                clear: Object.getPrototypeOf(this).annotations.clear.bind(this),
                search: Object.getPrototypeOf(this).annotations.search.bind(this),
                searchEmpty: Object.getPrototypeOf(this).annotations.searchEmpty.bind(this),
                upload: Object.getPrototypeOf(this).annotations.upload.bind(this),
                select: Object.getPrototypeOf(this).annotations.select.bind(this),
                import: Object.getPrototypeOf(this).annotations.import.bind(this),
                export: Object.getPrototypeOf(this).annotations.export.bind(this),
                statistics: Object.getPrototypeOf(this).annotations.statistics.bind(this),
                hasUnsavedChanges: Object.getPrototypeOf(this).annotations.hasUnsavedChanges.bind(this),
            };

            this.actions = {
                undo: Object.getPrototypeOf(this).actions.undo.bind(this),
                redo: Object.getPrototypeOf(this).actions.redo.bind(this),
                freeze: Object.getPrototypeOf(this).actions.freeze.bind(this),
                clear: Object.getPrototypeOf(this).actions.clear.bind(this),
                get: Object.getPrototypeOf(this).actions.get.bind(this),
            };

            this.frames = {
                get: Object.getPrototypeOf(this).frames.get.bind(this),
                ranges: Object.getPrototypeOf(this).frames.ranges.bind(this),
                preview: Object.getPrototypeOf(this).frames.preview.bind(this),
                contextImage: Object.getPrototypeOf(this).frames.contextImage.bind(this),
            };

            this.logger = {
                log: Object.getPrototypeOf(this).logger.log.bind(this),
            };

            this.predictor = {
                status: Object.getPrototypeOf(this).predictor.status.bind(this),
                predict: Object.getPrototypeOf(this).predictor.predict.bind(this),
            };
        }

        /**
         * Method updates job data like status or assignee
         * @method save
         * @memberof module:API.cvat.classes.Job
         * @readonly
         * @instance
         * @async
         * @throws {module:API.cvat.exceptions.ServerError}
         * @throws {module:API.cvat.exceptions.PluginError}
         */
        async save() {
            const result = await PluginRegistry.apiWrapper.call(this, Job.prototype.save);
            return result;
        }

        /**
         * Method returns a list of issues for a job
         * @method issues
         * @memberof module:API.cvat.classes.Job
         * @type {module:API.cvat.classes.Issue[]}
         * @readonly
         * @instance
         * @async
         * @throws {module:API.cvat.exceptions.ServerError}
         * @throws {module:API.cvat.exceptions.PluginError}
         */
        async issues() {
            const result = await PluginRegistry.apiWrapper.call(this, Job.prototype.issues);
            return result;
        }

        /**
         * Method returns a list of reviews for a job
         * @method reviews
         * @type {module:API.cvat.classes.Review[]}
         * @memberof module:API.cvat.classes.Job
         * @readonly
         * @instance
         * @async
         * @throws {module:API.cvat.exceptions.ServerError}
         * @throws {module:API.cvat.exceptions.PluginError}
         */
        async reviews() {
            const result = await PluginRegistry.apiWrapper.call(this, Job.prototype.reviews);
            return result;
        }

        /**
         * /**
         * @typedef {Object} ReviewSummary
         * @property {number} reviews Number of done reviews
         * @property {number} average_estimated_quality
         * @property {number} issues_unsolved
         * @property {number} issues_resolved
         * @property {string[]} assignees
         * @property {string[]} reviewers
         */
        /**
         * Method returns brief summary of within all reviews
         * @method reviewsSummary
         * @type {ReviewSummary}
         * @memberof module:API.cvat.classes.Job
         * @readonly
         * @instance
         * @async
         * @throws {module:API.cvat.exceptions.ServerError}
         * @throws {module:API.cvat.exceptions.PluginError}
         */
        async reviewsSummary() {
            const result = await PluginRegistry.apiWrapper.call(this, Job.prototype.reviewsSummary);
            return result;
        }
    }

    /**
     * Class representing a task
     * @memberof module:API.cvat.classes
     * @extends Session
     */
    class Task extends Session {
        /**
         * In a fact you need use the constructor only if you want to create a task
         * @param {object} initialData - Object which is used for initalization
         * <br> It can contain keys:
         * <br> <li style="margin-left: 10px;"> name
         * <br> <li style="margin-left: 10px;"> assignee
         * <br> <li style="margin-left: 10px;"> bug_tracker
         * <br> <li style="margin-left: 10px;"> labels
         * <br> <li style="margin-left: 10px;"> segment_size
         * <br> <li style="margin-left: 10px;"> overlap
         */
        constructor(initialData) {
            super();
            const data = {
                id: undefined,
                name: undefined,
                project_id: undefined,
                status: undefined,
                size: undefined,
                mode: undefined,
                owner: null,
                assignee: null,
                created_date: undefined,
                updated_date: undefined,
                bug_tracker: undefined,
                subset: undefined,
                overlap: undefined,
                segment_size: undefined,
                image_quality: undefined,
                start_frame: undefined,
                stop_frame: undefined,
                frame_filter: undefined,
                data_chunk_size: undefined,
                data_compressed_chunk_type: undefined,
                data_original_chunk_type: undefined,
                use_zip_chunks: undefined,
                use_cache: undefined,
                copy_data: undefined,
                dimension: undefined,
            };

            let updatedFields = {
                name: false,
                assignee: false,
                bug_tracker: false,
                subset: false,
                labels: false,
                project_id: false,
            };

            for (const property in data) {
                if (Object.prototype.hasOwnProperty.call(data, property) && property in initialData) {
                    data[property] = initialData[property];
                }
            }

            if (data.assignee) data.assignee = new User(data.assignee);
            if (data.owner) data.owner = new User(data.owner);

            data.labels = [];
            data.jobs = [];
            data.files = Object.freeze({
                server_files: [],
                client_files: [],
                remote_files: [],
            });

            if (Array.isArray(initialData.segments)) {
                for (const segment of initialData.segments) {
                    if (Array.isArray(segment.jobs)) {
                        for (const job of segment.jobs) {
                            const jobInstance = new Job({
                                url: job.url,
                                id: job.id,
                                assignee: job.assignee,
                                reviewer: job.reviewer,
                                status: job.status,
                                start_frame: segment.start_frame,
                                stop_frame: segment.stop_frame,
                                task: this,
                            });
                            data.jobs.push(jobInstance);
                        }
                    }
                }
            }

            if (Array.isArray(initialData.labels)) {
                for (const label of initialData.labels) {
                    const classInstance = new Label(label);
                    data.labels.push(classInstance);
                }
            }

            Object.defineProperties(
                this,
                Object.freeze({
                    /**
                     * @name id
                     * @type {integer}
                     * @memberof module:API.cvat.classes.Task
                     * @readonly
                     * @instance
                     */
                    id: {
                        get: () => data.id,
                    },
                    /**
                     * @name name
                     * @type {string}
                     * @memberof module:API.cvat.classes.Task
                     * @instance
                     * @throws {module:API.cvat.exceptions.ArgumentError}
                     */
                    name: {
                        get: () => data.name,
                        set: (value) => {
                            if (!value.trim().length) {
                                throw new ArgumentError('Value must not be empty');
                            }
                            updatedFields.name = true;
                            data.name = value;
                        },
                    },
                    /**
                     * @name projectId
                     * @type {integer|null}
                     * @memberof module:API.cvat.classes.Task
                     * @instance
                     */
                    projectId: {
                        get: () => data.project_id,
                        set: (projectId) => {
                            if (!Number.isInteger(projectId) || projectId <= 0) {
                                throw new ArgumentError('Value must be a positive integer');
                            }

                            updatedFields.project_id = true;
                            data.project_id = projectId;
                        },
                    },
                    /**
                     * @name status
                     * @type {module:API.cvat.enums.TaskStatus}
                     * @memberof module:API.cvat.classes.Task
                     * @readonly
                     * @instance
                     */
                    status: {
                        get: () => data.status,
                    },
                    /**
                     * @name size
                     * @type {integer}
                     * @memberof module:API.cvat.classes.Task
                     * @readonly
                     * @instance
                     */
                    size: {
                        get: () => data.size,
                    },
                    /**
                     * @name mode
                     * @type {TaskMode}
                     * @memberof module:API.cvat.classes.Task
                     * @readonly
                     * @instance
                     */
                    mode: {
                        get: () => data.mode,
                    },
                    /**
                     * Instance of a user who has created the task
                     * @name owner
                     * @type {module:API.cvat.classes.User}
                     * @memberof module:API.cvat.classes.Task
                     * @readonly
                     * @instance
                     */
                    owner: {
                        get: () => data.owner,
                    },
                    /**
                     * Instance of a user who is responsible for the task
                     * @name assignee
                     * @type {module:API.cvat.classes.User}
                     * @memberof module:API.cvat.classes.Task
                     * @instance
                     * @throws {module:API.cvat.exceptions.ArgumentError}
                     */
                    assignee: {
                        get: () => data.assignee,
                        set: (assignee) => {
                            if (assignee !== null && !(assignee instanceof User)) {
                                throw new ArgumentError('Value must be a user instance');
                            }
                            updatedFields.assignee = true;
                            data.assignee = assignee;
                        },
                    },
                    /**
                     * @name createdDate
                     * @type {string}
                     * @memberof module:API.cvat.classes.Task
                     * @readonly
                     * @instance
                     */
                    createdDate: {
                        get: () => data.created_date,
                    },
                    /**
                     * @name updatedDate
                     * @type {string}
                     * @memberof module:API.cvat.classes.Task
                     * @readonly
                     * @instance
                     */
                    updatedDate: {
                        get: () => data.updated_date,
                    },
                    /**
                     * @name bugTracker
                     * @type {string}
                     * @memberof module:API.cvat.classes.Task
                     * @instance
                     * @throws {module:API.cvat.exceptions.ArgumentError}
                     */
                    bugTracker: {
                        get: () => data.bug_tracker,
                        set: (tracker) => {
                            if (typeof tracker !== 'string') {
                                throw new ArgumentError(
                                    `Subset value must be a string. But ${typeof tracker} has been got.`,
                                );
                            }

                            updatedFields.bug_tracker = true;
                            data.bug_tracker = tracker;
                        },
                    },
                    /**
                     * @name subset
                     * @type {string}
                     * @memberof module:API.cvat.classes.Task
                     * @instance
                     * @throws {module:API.cvat.exception.ArgumentError}
                     */
                    subset: {
                        get: () => data.subset,
                        set: (subset) => {
                            if (typeof subset !== 'string') {
                                throw new ArgumentError(
                                    `Subset value must be a string. But ${typeof subset} has been got.`,
                                );
                            }

                            updatedFields.subset = true;
                            data.subset = subset;
                        },
                    },
                    /**
                     * @name overlap
                     * @type {integer}
                     * @memberof module:API.cvat.classes.Task
                     * @instance
                     * @throws {module:API.cvat.exceptions.ArgumentError}
                     */
                    overlap: {
                        get: () => data.overlap,
                        set: (overlap) => {
                            if (!Number.isInteger(overlap) || overlap < 0) {
                                throw new ArgumentError('Value must be a non negative integer');
                            }
                            data.overlap = overlap;
                        },
                    },
                    /**
                     * @name segmentSize
                     * @type {integer}
                     * @memberof module:API.cvat.classes.Task
                     * @instance
                     * @throws {module:API.cvat.exceptions.ArgumentError}
                     */
                    segmentSize: {
                        get: () => data.segment_size,
                        set: (segment) => {
                            if (!Number.isInteger(segment) || segment < 0) {
                                throw new ArgumentError('Value must be a positive integer');
                            }
                            data.segment_size = segment;
                        },
                    },
                    /**
                     * @name imageQuality
                     * @type {integer}
                     * @memberof module:API.cvat.classes.Task
                     * @instance
                     * @throws {module:API.cvat.exceptions.ArgumentError}
                     */
                    imageQuality: {
                        get: () => data.image_quality,
                        set: (quality) => {
                            if (!Number.isInteger(quality) || quality < 0) {
                                throw new ArgumentError('Value must be a positive integer');
                            }
                            data.image_quality = quality;
                        },
                    },
                    /**
                     * @name useZipChunks
                     * @type {boolean}
                     * @memberof module:API.cvat.classes.Task
                     * @instance
                     * @throws {module:API.cvat.exceptions.ArgumentError}
                     */
                    useZipChunks: {
                        get: () => data.use_zip_chunks,
                        set: (useZipChunks) => {
                            if (typeof useZipChunks !== 'boolean') {
                                throw new ArgumentError('Value must be a boolean');
                            }
                            data.use_zip_chunks = useZipChunks;
                        },
                    },
                    /**
                     * @name useCache
                     * @type {boolean}
                     * @memberof module:API.cvat.classes.Task
                     * @instance
                     * @throws {module:API.cvat.exceptions.ArgumentError}
                     */
                    useCache: {
                        get: () => data.use_cache,
                        set: (useCache) => {
                            if (typeof useCache !== 'boolean') {
                                throw new ArgumentError('Value must be a boolean');
                            }
                            data.use_cache = useCache;
                        },
                    },
                    /**
                     * @name copyData
                     * @type {boolean}
                     * @memberof module:API.cvat.classes.Task
                     * @instance
                     * @throws {module:API.cvat.exceptions.ArgumentError}
                     */
                    copyData: {
                        get: () => data.copy_data,
                        set: (copyData) => {
                            if (typeof copyData !== 'boolean') {
                                throw new ArgumentError('Value must be a boolean');
                            }
                            data.copy_data = copyData;
                        },
                    },
                    /**
                     * After task has been created value can be appended only.
                     * @name labels
                     * @type {module:API.cvat.classes.Label[]}
                     * @memberof module:API.cvat.classes.Task
                     * @instance
                     * @throws {module:API.cvat.exceptions.ArgumentError}
                     */
                    labels: {
                        get: () => data.labels.filter((_label) => !_label.deleted),
                        set: (labels) => {
                            if (!Array.isArray(labels)) {
                                throw new ArgumentError('Value must be an array of Labels');
                            }

                            for (const label of labels) {
                                if (!(label instanceof Label)) {
                                    throw new ArgumentError(
                                        `Each array value must be an instance of Label. ${typeof label} was found`,
                                    );
                                }
                            }

                            const IDs = labels.map((_label) => _label.id);
                            const deletedLabels = data.labels.filter((_label) => !IDs.includes(_label.id));
                            deletedLabels.forEach((_label) => {
                                _label.deleted = true;
                            });

                            updatedFields.labels = true;
                            data.labels = [...deletedLabels, ...labels];
                        },
                    },
                    /**
                     * @name jobs
                     * @type {module:API.cvat.classes.Job[]}
                     * @memberof module:API.cvat.classes.Task
                     * @readonly
                     * @instance
                     */
                    jobs: {
                        get: () => [...data.jobs],
                    },
                    /**
                     * List of files from shared resource
                     * @name serverFiles
                     * @type {string[]}
                     * @memberof module:API.cvat.classes.Task
                     * @instance
                     * @throws {module:API.cvat.exceptions.ArgumentError}
                     */
                    serverFiles: {
                        get: () => [...data.files.server_files],
                        set: (serverFiles) => {
                            if (!Array.isArray(serverFiles)) {
                                throw new ArgumentError(
                                    `Value must be an array. But ${typeof serverFiles} has been got.`,
                                );
                            }

                            for (const value of serverFiles) {
                                if (typeof value !== 'string') {
                                    throw new ArgumentError(
                                        `Array values must be a string. But ${typeof value} has been got.`,
                                    );
                                }
                            }

                            Array.prototype.push.apply(data.files.server_files, serverFiles);
                        },
                    },
                    /**
                     * List of files from client host
                     * @name clientFiles
                     * @type {File[]}
                     * @memberof module:API.cvat.classes.Task
                     * @instance
                     * @throws {module:API.cvat.exceptions.ArgumentError}
                     */
                    clientFiles: {
                        get: () => [...data.files.client_files],
                        set: (clientFiles) => {
                            if (!Array.isArray(clientFiles)) {
                                throw new ArgumentError(
                                    `Value must be an array. But ${typeof clientFiles} has been got.`,
                                );
                            }

                            for (const value of clientFiles) {
                                if (!(value instanceof File)) {
                                    throw new ArgumentError(
                                        `Array values must be a File. But ${value.constructor.name} has been got.`,
                                    );
                                }
                            }

                            Array.prototype.push.apply(data.files.client_files, clientFiles);
                        },
                    },
                    /**
                     * List of files from remote host
                     * @name remoteFiles
                     * @type {File[]}
                     * @memberof module:API.cvat.classes.Task
                     * @instance
                     * @throws {module:API.cvat.exceptions.ArgumentError}
                     */
                    remoteFiles: {
                        get: () => [...data.files.remote_files],
                        set: (remoteFiles) => {
                            if (!Array.isArray(remoteFiles)) {
                                throw new ArgumentError(
                                    `Value must be an array. But ${typeof remoteFiles} has been got.`,
                                );
                            }

                            for (const value of remoteFiles) {
                                if (typeof value !== 'string') {
                                    throw new ArgumentError(
                                        `Array values must be a string. But ${typeof value} has been got.`,
                                    );
                                }
                            }

                            Array.prototype.push.apply(data.files.remote_files, remoteFiles);
                        },
                    },
                    /**
                     * The first frame of a video to annotation
                     * @name startFrame
                     * @type {integer}
                     * @memberof module:API.cvat.classes.Task
                     * @instance
                     * @throws {module:API.cvat.exceptions.ArgumentError}
                     */
                    startFrame: {
                        get: () => data.start_frame,
                        set: (frame) => {
                            if (!Number.isInteger(frame) || frame < 0) {
                                throw new ArgumentError('Value must be a not negative integer');
                            }
                            data.start_frame = frame;
                        },
                    },
                    /**
                     * The last frame of a video to annotation
                     * @name stopFrame
                     * @type {integer}
                     * @memberof module:API.cvat.classes.Task
                     * @instance
                     * @throws {module:API.cvat.exceptions.ArgumentError}
                     */
                    stopFrame: {
                        get: () => data.stop_frame,
                        set: (frame) => {
                            if (!Number.isInteger(frame) || frame < 0) {
                                throw new ArgumentError('Value must be a not negative integer');
                            }
                            data.stop_frame = frame;
                        },
                    },
                    /**
                     * Filter to ignore some frames during task creation
                     * @name frameFilter
                     * @type {string}
                     * @memberof module:API.cvat.classes.Task
                     * @instance
                     * @throws {module:API.cvat.exceptions.ArgumentError}
                     */
                    frameFilter: {
                        get: () => data.frame_filter,
                        set: (filter) => {
                            if (typeof filter !== 'string') {
                                throw new ArgumentError(
                                    `Filter value must be a string. But ${typeof filter} has been got.`,
                                );
                            }

                            data.frame_filter = filter;
                        },
                    },
                    dataChunkSize: {
                        get: () => data.data_chunk_size,
                        set: (chunkSize) => {
                            if (typeof chunkSize !== 'number' || chunkSize < 1) {
                                throw new ArgumentError(
                                    `Chunk size value must be a positive number. But value ${chunkSize} has been got.`,
                                );
                            }

                            data.data_chunk_size = chunkSize;
                        },
                    },
                    dataChunkType: {
                        get: () => data.data_compressed_chunk_type,
                    },
                    dimension: {
                        /**
                         * @name enabled
                         * @type {string}
                         * @memberof module:API.cvat.enums.DimensionType
                         * @readonly
                         * @instance
                         */
                        get: () => data.dimension,
                    },
                    _internalData: {
                        get: () => data,
                    },
                    __updatedFields: {
                        get: () => updatedFields,
                        set: (fields) => {
                            updatedFields = fields;
                        },
                    },
                }),
            );

            // When we call a function, for example: task.annotations.get()
            // In the method get we lose the task context
            // So, we need return it
            this.annotations = {
                get: Object.getPrototypeOf(this).annotations.get.bind(this),
                put: Object.getPrototypeOf(this).annotations.put.bind(this),
                save: Object.getPrototypeOf(this).annotations.save.bind(this),
                dump: Object.getPrototypeOf(this).annotations.dump.bind(this),
                merge: Object.getPrototypeOf(this).annotations.merge.bind(this),
                split: Object.getPrototypeOf(this).annotations.split.bind(this),
                group: Object.getPrototypeOf(this).annotations.group.bind(this),
                clear: Object.getPrototypeOf(this).annotations.clear.bind(this),
                search: Object.getPrototypeOf(this).annotations.search.bind(this),
                searchEmpty: Object.getPrototypeOf(this).annotations.searchEmpty.bind(this),
                upload: Object.getPrototypeOf(this).annotations.upload.bind(this),
                select: Object.getPrototypeOf(this).annotations.select.bind(this),
                import: Object.getPrototypeOf(this).annotations.import.bind(this),
                export: Object.getPrototypeOf(this).annotations.export.bind(this),
                statistics: Object.getPrototypeOf(this).annotations.statistics.bind(this),
                hasUnsavedChanges: Object.getPrototypeOf(this).annotations.hasUnsavedChanges.bind(this),
                exportDataset: Object.getPrototypeOf(this).annotations.exportDataset.bind(this),
            };

            this.actions = {
                undo: Object.getPrototypeOf(this).actions.undo.bind(this),
                redo: Object.getPrototypeOf(this).actions.redo.bind(this),
                freeze: Object.getPrototypeOf(this).actions.freeze.bind(this),
                clear: Object.getPrototypeOf(this).actions.clear.bind(this),
                get: Object.getPrototypeOf(this).actions.get.bind(this),
            };

            this.frames = {
                get: Object.getPrototypeOf(this).frames.get.bind(this),
                ranges: Object.getPrototypeOf(this).frames.ranges.bind(this),
                preview: Object.getPrototypeOf(this).frames.preview.bind(this),
                contextImage: Object.getPrototypeOf(this).frames.contextImage.bind(this),
            };

            this.logger = {
                log: Object.getPrototypeOf(this).logger.log.bind(this),
            };

            this.predictor = {
                status: Object.getPrototypeOf(this).predictor.status.bind(this),
                predict: Object.getPrototypeOf(this).predictor.predict.bind(this),
            };
        }

        /**
         * Method removes all task related data from the client (annotations, history, etc.)
         * @method close
         * @returns {module:API.cvat.classes.Task}
         * @memberof module:API.cvat.classes.Task
         * @readonly
         * @async
         * @instance
         * @throws {module:API.cvat.exceptions.PluginError}
         */
        async close() {
            const result = await PluginRegistry.apiWrapper.call(this, Task.prototype.close);
            return result;
        }

        /**
         * Method updates data of a created task or creates new task from scratch
         * @method save
         * @returns {module:API.cvat.classes.Task}
         * @memberof module:API.cvat.classes.Task
         * @param {function} [onUpdate] - the function which is used only if task hasn't
         * been created yet. It called in order to notify about creation status.
         * It receives the string parameter which is a status message
         * @readonly
         * @instance
         * @async
         * @throws {module:API.cvat.exceptions.ServerError}
         * @throws {module:API.cvat.exceptions.PluginError}
         */
        async save(onUpdate = () => {}) {
            const result = await PluginRegistry.apiWrapper.call(this, Task.prototype.save, onUpdate);
            return result;
        }

        /**
         * Method deletes a task from a server
         * @method delete
         * @memberof module:API.cvat.classes.Task
         * @readonly
         * @instance
         * @async
         * @throws {module:API.cvat.exceptions.ServerError}
         * @throws {module:API.cvat.exceptions.PluginError}
         */
        async delete() {
            const result = await PluginRegistry.apiWrapper.call(this, Task.prototype.delete);
            return result;
        }
    }

    module.exports = {
        Job,
        Task,
    };

    const {
        getAnnotations,
        putAnnotations,
        saveAnnotations,
        hasUnsavedChanges,
        searchAnnotations,
        searchEmptyFrame,
        mergeAnnotations,
        splitAnnotations,
        groupAnnotations,
        clearAnnotations,
        selectObject,
        annotationsStatistics,
        uploadAnnotations,
        dumpAnnotations,
        importAnnotations,
        exportAnnotations,
        exportDataset,
        undoActions,
        redoActions,
        freezeHistory,
        clearActions,
        getActions,
        closeSession,
    } = require('./annotations');

    buildDublicatedAPI(Job.prototype);
    buildDublicatedAPI(Task.prototype);

    Job.prototype.save.implementation = async function () {
        if (this.id) {
            const jobData = {};

            for (const [field, isUpdated] of Object.entries(this.__updatedFields)) {
                if (isUpdated) {
                    switch (field) {
                    case 'status':
                        jobData.status = this.status;
                        break;
                    case 'assignee':
                        jobData.assignee_id = this.assignee ? this.assignee.id : null;
                        break;
                    case 'reviewer':
                        jobData.reviewer_id = this.reviewer ? this.reviewer.id : null;
                        break;
                    default:
                        break;
                    }
                }
            }

            await serverProxy.jobs.save(this.id, jobData);

            this.__updatedFields = {
                status: false,
                assignee: false,
                reviewer: false,
            };

            return this;
        }

        throw new ArgumentError('Can not save job without and id');
    };

    Job.prototype.issues.implementation = async function () {
        const result = await serverProxy.jobs.issues(this.id);
        return result.map((issue) => new Issue(issue));
    };

    Job.prototype.reviews.implementation = async function () {
        const result = await serverProxy.jobs.reviews.get(this.id);
        const reviews = result.map((review) => new Review(review));

        // try to get not finished review from the local storage
        const data = store.get(`job-${this.id}-review`);
        if (data) {
            reviews.push(new Review(JSON.parse(data)));
        }

        return reviews;
    };

    Job.prototype.reviewsSummary.implementation = async function () {
        const reviews = await serverProxy.jobs.reviews.get(this.id);
        const issues = await serverProxy.jobs.issues(this.id);

        const qualities = reviews.map((review) => review.estimated_quality);
        const reviewers = reviews.filter((review) => review.reviewer).map((review) => review.reviewer.username);
        const assignees = reviews.filter((review) => review.assignee).map((review) => review.assignee.username);

        return {
            reviews: reviews.length,
            average_estimated_quality: qualities.reduce((acc, quality) => acc + quality, 0) / (qualities.length || 1),
            issues_unsolved: issues.filter((issue) => !issue.resolved_date).length,
            issues_resolved: issues.filter((issue) => issue.resolved_date).length,
            assignees: Array.from(new Set(assignees.filter((assignee) => assignee !== null))),
            reviewers: Array.from(new Set(reviewers.filter((reviewer) => reviewer !== null))),
        };
    };

    Job.prototype.frames.get.implementation = async function (frame, isPlaying, step) {
        if (!Number.isInteger(frame) || frame < 0) {
            throw new ArgumentError(`Frame must be a positive integer. Got: "${frame}"`);
        }

        if (frame < this.startFrame || frame > this.stopFrame) {
            throw new ArgumentError(`The frame with number ${frame} is out of the job`);
        }

        const frameData = await getFrame(
            this.task.id,
            this.task.dataChunkSize,
            this.task.dataChunkType,
            this.task.mode,
            frame,
            this.startFrame,
            this.stopFrame,
            isPlaying,
            step,
            this.task.dimension,
        );
        return frameData;
    };

    Job.prototype.frames.ranges.implementation = async function () {
        const rangesData = await getRanges(this.task.id);
        return rangesData;
    };

    Job.prototype.frames.preview.implementation = async function () {
        const frameData = await getPreview(this.task.id);
        return frameData;
    };

    // TODO: Check filter for annotations
    Job.prototype.annotations.get.implementation = async function (frame, allTracks, filters) {
        if (!Array.isArray(filters)) {
            throw new ArgumentError('Filters must be an array');
        }

        if (!Number.isInteger(frame)) {
            throw new ArgumentError('The frame argument must be an integer');
        }

        if (frame < this.startFrame || frame > this.stopFrame) {
            throw new ArgumentError(`Frame ${frame} does not exist in the job`);
        }

        const annotationsData = await getAnnotations(this, frame, allTracks, filters);
        return annotationsData;
    };

    Job.prototype.annotations.search.implementation = function (filters, frameFrom, frameTo) {
        if (!Array.isArray(filters)) {
            throw new ArgumentError('Filters must be an array');
        }

        if (!Number.isInteger(frameFrom) || !Number.isInteger(frameTo)) {
            throw new ArgumentError('The start and end frames both must be an integer');
        }

        if (frameFrom < this.startFrame || frameFrom > this.stopFrame) {
            throw new ArgumentError('The start frame is out of the job');
        }

        if (frameTo < this.startFrame || frameTo > this.stopFrame) {
            throw new ArgumentError('The stop frame is out of the job');
        }

        const result = searchAnnotations(this, filters, frameFrom, frameTo);
        return result;
    };

    Job.prototype.annotations.searchEmpty.implementation = function (frameFrom, frameTo) {
        if (!Number.isInteger(frameFrom) || !Number.isInteger(frameTo)) {
            throw new ArgumentError('The start and end frames both must be an integer');
        }

        if (frameFrom < this.startFrame || frameFrom > this.stopFrame) {
            throw new ArgumentError('The start frame is out of the job');
        }

        if (frameTo < this.startFrame || frameTo > this.stopFrame) {
            throw new ArgumentError('The stop frame is out of the job');
        }

        const result = searchEmptyFrame(this, frameFrom, frameTo);
        return result;
    };

    Job.prototype.annotations.save.implementation = async function (onUpdate) {
        const result = await saveAnnotations(this, onUpdate);
        return result;
    };

    Job.prototype.annotations.merge.implementation = async function (objectStates) {
        const result = await mergeAnnotations(this, objectStates);
        return result;
    };

    Job.prototype.annotations.split.implementation = async function (objectState, frame) {
        const result = await splitAnnotations(this, objectState, frame);
        return result;
    };

    Job.prototype.annotations.group.implementation = async function (objectStates, reset) {
        const result = await groupAnnotations(this, objectStates, reset);
        return result;
    };

    Job.prototype.annotations.hasUnsavedChanges.implementation = function () {
        const result = hasUnsavedChanges(this);
        return result;
    };

    Job.prototype.annotations.clear.implementation = async function (reload) {
        const result = await clearAnnotations(this, reload);
        return result;
    };

    Job.prototype.annotations.select.implementation = function (frame, x, y) {
        const result = selectObject(this, frame, x, y);
        return result;
    };

    Job.prototype.annotations.statistics.implementation = function () {
        const result = annotationsStatistics(this);
        return result;
    };

    Job.prototype.annotations.put.implementation = function (objectStates) {
        const result = putAnnotations(this, objectStates);
        return result;
    };

    Job.prototype.annotations.upload.implementation = async function (file, loader) {
        const result = await uploadAnnotations(this, file, loader);
        return result;
    };

    Job.prototype.annotations.import.implementation = function (data) {
        const result = importAnnotations(this, data);
        return result;
    };

    Job.prototype.annotations.export.implementation = function () {
        const result = exportAnnotations(this);
        return result;
    };

    Job.prototype.annotations.dump.implementation = async function (dumper, name) {
        const result = await dumpAnnotations(this, name, dumper);
        return result;
    };

    Job.prototype.annotations.exportDataset.implementation = async function (format) {
        const result = await exportDataset(this.task, format);
        return result;
    };

    Job.prototype.actions.undo.implementation = function (count) {
        const result = undoActions(this, count);
        return result;
    };

    Job.prototype.actions.redo.implementation = function (count) {
        const result = redoActions(this, count);
        return result;
    };

    Job.prototype.actions.freeze.implementation = function (frozen) {
        const result = freezeHistory(this, frozen);
        return result;
    };

    Job.prototype.actions.clear.implementation = function () {
        const result = clearActions(this);
        return result;
    };

    Job.prototype.actions.get.implementation = function () {
        const result = getActions(this);
        return result;
    };

    Job.prototype.logger.log.implementation = async function (logType, payload, wait) {
        const result = await this.task.logger.log(logType, { ...payload, job_id: this.id }, wait);
        return result;
    };

    Job.prototype.predictor.status.implementation = async function () {
        const result = await this.task.predictor.status();
        return result;
    };

    Job.prototype.predictor.predict.implementation = async function (frame) {
        const result = await this.task.predictor.predict(frame);
        return result;
    };

    Task.prototype.close.implementation = function closeTask() {
        clearFrames(this.id);
        for (const job of this.jobs) {
            closeSession(job);
        }

        closeSession(this);
        return this;
    };

    Task.prototype.save.implementation = async function (onUpdate) {
        // TODO: Add ability to change an owner and an assignee
        if (typeof this.id !== 'undefined') {
            // If the task has been already created, we update it
            const taskData = {};

            for (const [field, isUpdated] of Object.entries(this.__updatedFields)) {
                if (isUpdated) {
                    switch (field) {
                    case 'assignee':
                        taskData.assignee_id = this.assignee ? this.assignee.id : null;
                        break;
                    case 'name':
                        taskData.name = this.name;
                        break;
                    case 'bug_tracker':
                        taskData.bug_tracker = this.bugTracker;
                        break;
                    case 'subset':
                        taskData.subset = this.subset;
                        break;
                    case 'project_id':
                        taskData.project_id = this.projectId;
                        break;
                    case 'labels':
                        taskData.labels = [...this._internalData.labels.map((el) => el.toJSON())];
                        break;
                    default:
                        break;
                    }
                }
            }

            await serverProxy.tasks.saveTask(this.id, taskData);

            this.updatedFields = {
                assignee: false,
                name: false,
                bugTracker: false,
                subset: false,
                labels: false,
                project_id: false,
            };

            return this;
        }

        const taskSpec = {
            name: this.name,
            labels: this.labels.map((el) => el.toJSON()),
        };

        if (typeof this.bugTracker !== 'undefined') {
            taskSpec.bug_tracker = this.bugTracker;
        }
        if (typeof this.segmentSize !== 'undefined') {
            taskSpec.segment_size = this.segmentSize;
        }
        if (typeof this.overlap !== 'undefined') {
            taskSpec.overlap = this.overlap;
        }
        if (typeof this.projectId !== 'undefined') {
            taskSpec.project_id = this.projectId;
        }
        if (typeof this.subset !== 'undefined') {
            taskSpec.subset = this.subset;
        }

        const taskDataSpec = {
            client_files: this.clientFiles,
            server_files: this.serverFiles,
            remote_files: this.remoteFiles,
            image_quality: this.imageQuality,
            use_zip_chunks: this.useZipChunks,
            use_cache: this.useCache,
        };

        if (typeof this.startFrame !== 'undefined') {
            taskDataSpec.start_frame = this.startFrame;
        }
        if (typeof this.stopFrame !== 'undefined') {
            taskDataSpec.stop_frame = this.stopFrame;
        }
        if (typeof this.frameFilter !== 'undefined') {
            taskDataSpec.frame_filter = this.frameFilter;
        }
        if (typeof this.dataChunkSize !== 'undefined') {
            taskDataSpec.chunk_size = this.dataChunkSize;
        }
        if (typeof this.copyData !== 'undefined') {
            taskDataSpec.copy_data = this.copyData;
        }

        const task = await serverProxy.tasks.createTask(taskSpec, taskDataSpec, onUpdate);
        return new Task(task);
    };

    Task.prototype.delete.implementation = async function () {
        const result = await serverProxy.tasks.deleteTask(this.id);
        return result;
    };

    Task.prototype.frames.get.implementation = async function (frame, isPlaying, step) {
        if (!Number.isInteger(frame) || frame < 0) {
            throw new ArgumentError(`Frame must be a positive integer. Got: "${frame}"`);
        }

        if (frame >= this.size) {
            throw new ArgumentError(`The frame with number ${frame} is out of the task`);
        }

        const result = await getFrame(
            this.id,
            this.dataChunkSize,
            this.dataChunkType,
            this.mode,
            frame,
            0,
            this.size - 1,
            isPlaying,
            step,
        );
        return result;
    };

    Task.prototype.frames.ranges.implementation = async function () {
        const rangesData = await getRanges(this.id);
        return rangesData;
    };

    Task.prototype.frames.preview.implementation = async function () {
        const frameData = await getPreview(this.id);
        return frameData;
    };

    // TODO: Check filter for annotations
    Task.prototype.annotations.get.implementation = async function (frame, allTracks, filters) {
        if (!Array.isArray(filters) || filters.some((filter) => typeof filter !== 'string')) {
            throw new ArgumentError('The filters argument must be an array of strings');
        }

        if (!Number.isInteger(frame) || frame < 0) {
            throw new ArgumentError(`Frame must be a positive integer. Got: "${frame}"`);
        }

        if (frame >= this.size) {
            throw new ArgumentError(`Frame ${frame} does not exist in the task`);
        }

        const result = await getAnnotations(this, frame, allTracks, filters);
        return result;
    };

    Task.prototype.annotations.search.implementation = function (filters, frameFrom, frameTo) {
        if (!Array.isArray(filters) || filters.some((filter) => typeof filter !== 'string')) {
            throw new ArgumentError('The filters argument must be an array of strings');
        }

        if (!Number.isInteger(frameFrom) || !Number.isInteger(frameTo)) {
            throw new ArgumentError('The start and end frames both must be an integer');
        }

        if (frameFrom < 0 || frameFrom >= this.size) {
            throw new ArgumentError('The start frame is out of the task');
        }

        if (frameTo < 0 || frameTo >= this.size) {
            throw new ArgumentError('The stop frame is out of the task');
        }

        const result = searchAnnotations(this, filters, frameFrom, frameTo);
        return result;
    };

    Task.prototype.annotations.searchEmpty.implementation = function (frameFrom, frameTo) {
        if (!Number.isInteger(frameFrom) || !Number.isInteger(frameTo)) {
            throw new ArgumentError('The start and end frames both must be an integer');
        }

        if (frameFrom < 0 || frameFrom >= this.size) {
            throw new ArgumentError('The start frame is out of the task');
        }

        if (frameTo < 0 || frameTo >= this.size) {
            throw new ArgumentError('The stop frame is out of the task');
        }

        const result = searchEmptyFrame(this, frameFrom, frameTo);
        return result;
    };

    Task.prototype.annotations.save.implementation = async function (onUpdate) {
        const result = await saveAnnotations(this, onUpdate);
        return result;
    };

    Task.prototype.annotations.merge.implementation = async function (objectStates) {
        const result = await mergeAnnotations(this, objectStates);
        return result;
    };

    Task.prototype.annotations.split.implementation = async function (objectState, frame) {
        const result = await splitAnnotations(this, objectState, frame);
        return result;
    };

    Task.prototype.annotations.group.implementation = async function (objectStates, reset) {
        const result = await groupAnnotations(this, objectStates, reset);
        return result;
    };

    Task.prototype.annotations.hasUnsavedChanges.implementation = function () {
        const result = hasUnsavedChanges(this);
        return result;
    };

    Task.prototype.annotations.clear.implementation = async function (reload) {
        const result = await clearAnnotations(this, reload);
        return result;
    };

    Task.prototype.annotations.select.implementation = function (frame, x, y) {
        const result = selectObject(this, frame, x, y);
        return result;
    };

    Task.prototype.annotations.statistics.implementation = function () {
        const result = annotationsStatistics(this);
        return result;
    };

    Task.prototype.annotations.put.implementation = function (objectStates) {
        const result = putAnnotations(this, objectStates);
        return result;
    };

    Task.prototype.annotations.upload.implementation = async function (file, loader) {
        const result = await uploadAnnotations(this, file, loader);
        return result;
    };

    Task.prototype.annotations.dump.implementation = async function (dumper, name) {
        const result = await dumpAnnotations(this, name, dumper);
        return result;
    };

    Task.prototype.annotations.import.implementation = function (data) {
        const result = importAnnotations(this, data);
        return result;
    };

    Task.prototype.annotations.export.implementation = function () {
        const result = exportAnnotations(this);
        return result;
    };

    Task.prototype.annotations.exportDataset.implementation = async function (format) {
        const result = await exportDataset(this, format);
        return result;
    };

    Task.prototype.actions.undo.implementation = function (count) {
        const result = undoActions(this, count);
        return result;
    };

    Task.prototype.actions.redo.implementation = function (count) {
        const result = redoActions(this, count);
        return result;
    };

    Task.prototype.actions.freeze.implementation = function (frozen) {
        const result = freezeHistory(this, frozen);
        return result;
    };

    Task.prototype.actions.clear.implementation = function () {
        const result = clearActions(this);
        return result;
    };

    Task.prototype.actions.get.implementation = function () {
        const result = getActions(this);
        return result;
    };

    Task.prototype.logger.log.implementation = async function (logType, payload, wait) {
        const result = await loggerStorage.log(logType, { ...payload, task_id: this.id }, wait);
        return result;
    };

    Task.prototype.predictor.status.implementation = async function () {
        if (!Number.isInteger(this.projectId)) {
            throw new DataError('The task must belong to a project to use the feature');
        }

        const result = await serverProxy.predictor.status(this.projectId);
        return {
            message: result.message,
            progress: result.progress,
            projectScore: result.score,
            timeRemaining: result.time_remaining,
            mediaAmount: result.media_amount,
            annotationAmount: result.annotation_amount,
        };
    };

    Task.prototype.predictor.predict.implementation = async function (frame) {
        if (!Number.isInteger(frame) || frame < 0) {
            throw new ArgumentError(`Frame must be a positive integer. Got: "${frame}"`);
        }

        if (frame >= this.size) {
            throw new ArgumentError(`The frame with number ${frame} is out of the task`);
        }

        if (!Number.isInteger(this.projectId)) {
            throw new DataError('The task must belong to a project to use the feature');
        }

        const result = await serverProxy.predictor.predict(this.id, frame);
        return result;
    };

    Job.prototype.frames.contextImage.implementation = async function (taskId, frameId) {
        const result = await getContextImage(taskId, frameId);
        return result;
    };
})();
