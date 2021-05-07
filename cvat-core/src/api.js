// Copyright (C) 2019-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

/**
 * External API which should be used by for development
 * @module API
 */

function build() {
    const PluginRegistry = require('./plugins');
    const loggerStorage = require('./logger-storage');
    const Log = require('./log');
    const ObjectState = require('./object-state');
    const Statistics = require('./statistics');
    const Comment = require('./comment');
    const Issue = require('./issue');
    const Review = require('./review');
    const { Job, Task } = require('./session');
    const { Project } = require('./project');
    const { Attribute, Label } = require('./labels');
    const MLModel = require('./ml-model');

    const enums = require('./enums');

    const {
        Exception, ArgumentError, DataError, ScriptingError, PluginError, ServerError,
    } = require('./exceptions');

    const User = require('./user');
    const pjson = require('../package.json');
    const config = require('./config');

    /**
     * API entrypoint
     * @namespace cvat
     * @memberof module:API
     */
    const cvat = {
        /**
         * Namespace is used for an interaction with a server
         * @namespace server
         * @package
         * @memberof module:API.cvat
         */
        server: {
            /**
             * @typedef {Object} ServerInfo
             * @property {string} name A name of the tool
             * @property {string} description A description of the tool
             * @property {string} version A version of the tool
             * @global
             */

            /**
             * Method returns some information about the annotation tool
             * @method about
             * @async
             * @memberof module:API.cvat.server
             * @return {ServerInfo}
             * @throws {module:API.cvat.exceptions.ServerError}
             * @throws {module:API.cvat.exceptions.PluginError}
             */
            async about() {
                const result = await PluginRegistry.apiWrapper(cvat.server.about);
                return result;
            },
            /**
             * @typedef {Object} FileInfo
             * @property {string} name A name of a file
             * @property {module:API.cvat.enums.ShareFileType} type
             * A type of a file
             * @global
             */

            /**
             * Method returns a list of files in a specified directory on a share
             * @method share
             * @async
             * @memberof module:API.cvat.server
             * @param {string} [directory=/] - Share directory path
             * @returns {FileInfo[]}
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ServerError}
             */
            async share(directory = '/') {
                const result = await PluginRegistry.apiWrapper(cvat.server.share, directory);
                return result;
            },
            /**
             * Method returns available annotation formats
             * @method formats
             * @async
             * @memberof module:API.cvat.server
             * @returns {module:API.cvat.classes.AnnotationFormats}
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ServerError}
             */
            async formats() {
                const result = await PluginRegistry.apiWrapper(cvat.server.formats);
                return result;
            },
            /**
             * Method returns user agreements that the user must accept
             * @method userAgreements
             * @async
             * @memberof module:API.cvat.server
             * @returns {Object[]}
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ServerError}
             */
            async userAgreements() {
                const result = await PluginRegistry.apiWrapper(cvat.server.userAgreements);
                return result;
            },
            /**
             * Method allows to register on a server
             * @method register
             * @async
             * @memberof module:API.cvat.server
             * @param {string} username An username for the new account
             * @param {string} firstName A first name for the new account
             * @param {string} lastName A last name for the new account
             * @param {string} email A email address for the new account
             * @param {string} password1 A password for the new account
             * @param {string} password2 The confirmation password for the new account
             * @param {Object} userConfirmations An user confirmations of terms of use if needed
             * @returns {Object} response data
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ServerError}
             */
            async register(username, firstName, lastName, email, password1, password2, userConfirmations) {
                const result = await PluginRegistry.apiWrapper(
                    cvat.server.register,
                    username,
                    firstName,
                    lastName,
                    email,
                    password1,
                    password2,
                    userConfirmations,
                );
                return result;
            },
            /**
             * Method allows to login on a server
             * @method login
             * @async
             * @memberof module:API.cvat.server
             * @param {string} username An username of an account
             * @param {string} password A password of an account
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ServerError}
             */
            async login(username, password) {
                const result = await PluginRegistry.apiWrapper(cvat.server.login, username, password);
                return result;
            },
            /**
             * Method allows to logout from the server
             * @method logout
             * @async
             * @memberof module:API.cvat.server
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ServerError}
             */
            async logout() {
                const result = await PluginRegistry.apiWrapper(cvat.server.logout);
                return result;
            },
            /**
             * Method allows to change user password
             * @method changePassword
             * @async
             * @memberof module:API.cvat.server
             * @param {string} oldPassword Current password for the account
             * @param {string} newPassword1 New password for the account
             * @param {string} newPassword2 Confirmation password for the account
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ServerError}
             */
            async changePassword(oldPassword, newPassword1, newPassword2) {
                const result = await PluginRegistry.apiWrapper(
                    cvat.server.changePassword,
                    oldPassword,
                    newPassword1,
                    newPassword2,
                );
                return result;
            },
            /**
             * Method allows to reset user password
             * @method requestPasswordReset
             * @async
             * @memberof module:API.cvat.server
             * @param {string} email A email address for the account
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ServerError}
             */
            async requestPasswordReset(email) {
                const result = await PluginRegistry.apiWrapper(cvat.server.requestPasswordReset, email);
                return result;
            },
            /**
             * Method allows to confirm reset user password
             * @method resetPassword
             * @async
             * @memberof module:API.cvat.server
             * @param {string} newPassword1 New password for the account
             * @param {string} newPassword2 Confirmation password for the account
             * @param {string} uid User id
             * @param {string} token Request authentication token
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ServerError}
             */
            async resetPassword(newPassword1, newPassword2, uid, token) {
                const result = await PluginRegistry.apiWrapper(
                    cvat.server.resetPassword,
                    newPassword1,
                    newPassword2,
                    uid,
                    token,
                );
                return result;
            },
            /**
             * Method allows to know whether you are authorized on the server
             * @method authorized
             * @async
             * @memberof module:API.cvat.server
             * @returns {boolean}
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ServerError}
             */
            async authorized() {
                const result = await PluginRegistry.apiWrapper(cvat.server.authorized);
                return result;
            },
            /**
             * Method allows to do requests via cvat-core with authorization headers
             * @method request
             * @async
             * @memberof module:API.cvat.server
             * @param {string} url
             * @param {Object} data request parameters: method, headers, data, etc.
             * @returns {Object | undefined} response data if exist
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ServerError}
             */
            async request(url, data) {
                const result = await PluginRegistry.apiWrapper(cvat.server.request, url, data);
                return result;
            },

            /**
             * Method returns apps that are installed on the server
             * @method installedApps
             * @async
             * @memberof module:API.cvat.server
             * @returns {Object} map {installedApp: boolean}
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ServerError}
             */
            async installedApps() {
                const result = await PluginRegistry.apiWrapper(cvat.server.installedApps);
                return result;
            },
        },
        /**
         * Namespace is used for getting projects
         * @namespace projects
         * @memberof module:API.cvat
         */
        projects: {
            /**
             * @typedef {Object} ProjectFilter
             * @property {string} name Check if name contains this value
             * @property {module:API.cvat.enums.ProjectStatus} status
             * Check if status contains this value
             * @property {integer} id Check if id equals this value
             * @property {integer} page Get specific page
             * (default REST API returns 20 projects per request.
             * In order to get more, it is need to specify next page)
             * @property {string} owner Check if owner user contains this value
             * @property {string} search Combined search of contains among all fields
             * @global
             */

            /**
             * Method returns list of projects corresponding to a filter
             * @method get
             * @async
             * @memberof module:API.cvat.projects
             * @param {ProjectFilter} [filter={}] project filter
             * @returns {module:API.cvat.classes.Project[]}
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ServerError}
             */
            async get(filter = {}) {
                const result = await PluginRegistry.apiWrapper(cvat.projects.get, filter);
                return result;
            },

            /**
             * Method returns list of project names with project ids
             * corresponding to a search phrase
             * used for autocomplete field
             * @method searchNames
             * @async
             * @memberof module:API.cvat.projects
             * @param {string} [search = ''] search phrase
             * @param {number} [limit = 10] number of returning project names
             * @returns {module:API.cvat.classes.Project[]}
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ServerError}
             *
             */
            async searchNames(search = '', limit = 10) {
                const result = await PluginRegistry.apiWrapper(cvat.projects.searchNames, search, limit);
                return result;
            },
        },
        /**
         * Namespace is used for getting tasks
         * @namespace tasks
         * @memberof module:API.cvat
         */
        tasks: {
            /**
             * @typedef {Object} TaskFilter
             * @property {string} name Check if name contains this value
             * @property {module:API.cvat.enums.TaskStatus} status
             * Check if status contains this value
             * @property {module:API.cvat.enums.TaskMode} mode
             * Check if mode contains this value
             * @property {integer} id Check if id equals this value
             * @property {integer} page Get specific page
             * (default REST API returns 20 tasks per request.
             * In order to get more, it is need to specify next page)
             * @property {integer} projectId Check if project_id field contains this value
             * @property {string} owner Check if owner user contains this value
             * @property {string} assignee Check if assigneed contains this value
             * @property {string} search Combined search of contains among all fields
             * @global
             */

            /**
             * Method returns list of tasks corresponding to a filter
             * @method get
             * @async
             * @memberof module:API.cvat.tasks
             * @param {TaskFilter} [filter={}] task filter
             * @returns {module:API.cvat.classes.Task[]}
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ServerError}
             */
            async get(filter = {}) {
                const result = await PluginRegistry.apiWrapper(cvat.tasks.get, filter);
                return result;
            },
        },
        /**
         * Namespace is used for getting jobs
         * @namespace jobs
         * @memberof module:API.cvat
         */
        jobs: {
            /**
             * @typedef {Object} JobFilter
             * Only one of fields is allowed simultaneously
             * @property {integer} taskID filter all jobs of specific task
             * @property {integer} jobID filter job with a specific id
             * @global
             */

            /**
             * Method returns list of jobs corresponding to a filter
             * @method get
             * @async
             * @memberof module:API.cvat.jobs
             * @param {JobFilter} filter job filter
             * @returns {module:API.cvat.classes.Job[]}
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ServerError}
             */
            async get(filter = {}) {
                const result = await PluginRegistry.apiWrapper(cvat.jobs.get, filter);
                return result;
            },
        },
        /**
         * Namespace is used for getting users
         * @namespace users
         * @memberof module:API.cvat
         */
        users: {
            /**
             * @typedef {Object} UserFilter
             * @property {boolean} self get only self
             * @global
             */

            /**
             * Method returns list of users corresponding to a filter
             * @method get
             * @async
             * @memberof module:API.cvat.users
             * @param {UserFilter} [filter={}] user filter
             * @returns {module:API.cvat.classes.User[]}
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ServerError}
             */
            async get(filter = {}) {
                const result = await PluginRegistry.apiWrapper(cvat.users.get, filter);
                return result;
            },
        },
        /**
         * Namespace is used for plugin management
         * @namespace plugins
         * @memberof module:API.cvat
         */
        plugins: {
            /**
             * @typedef {Object} Plugin
             * A plugin is a Javascript object. It must have properties are listed below. <br>
             * It also mustn't have property 'functions' which is used internally. <br>
             * You can expand any API method including class methods. <br>
             * In order to expand class method just use a class name
             * in a cvat space (example is listed below).
             *
             * @property {string} name A name of a plugin
             * @property {string} description A description of a plugin
             * Example plugin implementation listed below:
             * @example
             * plugin = {
             *   name: 'Example Plugin',
             *   description: 'This example plugin demonstrates how plugin system in CVAT works',
             *   cvat: {
             *     server: {
             *       about: {
             *         // Plugin adds some actions after executing the cvat.server.about()
             *         // For example it adds a field with installed plugins to a result
             *         // An argument "self" is a plugin itself
             *         // An argument "result" is a return value of cvat.server.about()
             *         // All next arguments are arguments of a wrapped function
             *         // (in this case the wrapped function doesn't have any arguments)
             *         async leave(self, result) {
             *           result.plugins = await self.internal.getPlugins();
             *           // Note that a method leave must return "result" (changed or not)
             *           // Otherwise API won't work as expected
             *           return result;
             *         },
             *       },
             *     },
             *     // In this example plugin also wraps a class method
             *     classes: {
             *       Job: {
             *         prototype: {
             *           annotations: {
             *             put: {
             *               // The first argument "self" is a plugin, like in a case above
             *               // The second argument is an argument of the
             *               // Job.annotations.put()
             *               // It contains an array of objects to put
             *               // In this sample we round objects coordinates and save them
             *               enter(self, objects) {
             *                 for (const obj of objects) {
             *                   if (obj.type != 'tag') {
             *                     const points = obj.position.map((point) => {
             *                       const roundPoint = {
             *                         x: Math.round(point.x),
             *                         y: Math.round(point.y),
             *                       };
             *                       return roundPoint;
             *                     });
             *                   }
             *                 }
             *               },
             *             },
             *           },
             *         },
             *       },
             *     },
             *   },
             *   // In general you can add any others members to your plugin
             *   // Members below are only examples
             *   internal: {
             *     async getPlugins() {
             *       // Collect information about installed plugins
             *       const plugins = await cvat.plugins.list();
             *       return plugins.map((el) => {
             *         return {
             *           name: el.name,
             *           description: el.description,
             *         };
             *       });
             *     },
             *   },
             * };
             * @global
             */

            /**
             * Method returns list of installed plugins
             * @method list
             * @async
             * @memberof module:API.cvat.plugins
             * @returns {Plugin[]}
             * @throws {module:API.cvat.exceptions.PluginError}
             */
            async list() {
                const result = await PluginRegistry.apiWrapper(cvat.plugins.list);
                return result;
            },
            /**
             * Install plugin to CVAT
             * @method register
             * @async
             * @memberof module:API.cvat.plugins
             * @param {Plugin} [plugin] plugin for registration
             * @throws {module:API.cvat.exceptions.PluginError}
             */
            async register(plugin) {
                const result = await PluginRegistry.apiWrapper(cvat.plugins.register, plugin);
                return result;
            },
        },

        /**
         * Namespace is used for serverless functions management (mainly related with DL models)
         * @namespace lambda
         * @memberof module:API.cvat
         */
        lambda: {
            /**
             * Method returns list of available serverless models
             * @method list
             * @async
             * @memberof module:API.cvat.lambda
             * @returns {module:API.cvat.classes.MLModel[]}
             * @throws {module:API.cvat.exceptions.ServerError}
             * @throws {module:API.cvat.exceptions.PluginError}
             */
            async list() {
                const result = await PluginRegistry.apiWrapper(cvat.lambda.list);
                return result;
            },

            /**
             * Run long-time request for a function on a specific task
             * @method run
             * @async
             * @memberof module:API.cvat.lambda
             * @param {module:API.cvat.classes.Task} task task to be annotated
             * @param {module:API.cvat.classes.MLModel} model model used to get annotation
             * @param {object} [args] extra arguments
             * @returns {string} requestID
             * @throws {module:API.cvat.exceptions.ServerError}
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ArgumentError}
             */
            async run(task, model, args) {
                const result = await PluginRegistry.apiWrapper(cvat.lambda.run, task, model, args);
                return result;
            },

            /**
             * Run short-time request for a function on a specific task
             * @method call
             * @async
             * @memberof module:API.cvat.lambda
             * @param {module:API.cvat.classes.Task} task task to be annotated
             * @param {module:API.cvat.classes.MLModel} model model used to get annotation
             * @param {object} [args] extra arguments
             * @returns {object[]} annotations
             * @throws {module:API.cvat.exceptions.ServerError}
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ArgumentError}
             */
            async call(task, model, args) {
                const result = await PluginRegistry.apiWrapper(cvat.lambda.call, task, model, args);
                return result;
            },

            /**
             * Cancel running of a serverless function for a specific task
             * @method cancel
             * @async
             * @memberof module:API.cvat.lambda
             * @param {string} requestID
             * @throws {module:API.cvat.exceptions.ServerError}
             * @throws {module:API.cvat.exceptions.PluginError}
             * @throws {module:API.cvat.exceptions.ArgumentError}
             */
            async cancel(requestID) {
                const result = await PluginRegistry.apiWrapper(cvat.lambda.cancel, requestID);
                return result;
            },

            /**
             * @callback onRequestStatusChange
             * @param {string} status
             * @param {number} progress
             * @param {string} [message]
             * @global
             */
            /**
             * Listen for a specific request
             * @method listen
             * @async
             * @memberof module:API.cvat.lambda
             * @param {string} requestID
             * @param {onRequestStatusChange} onChange
             * @throws {module:API.cvat.exceptions.ArgumentError}
             * @throws {module:API.cvat.exceptions.ServerError}
             * @throws {module:API.cvat.exceptions.PluginError}
             */
            async listen(requestID, onChange) {
                const result = await PluginRegistry.apiWrapper(cvat.lambda.listen, requestID, onChange);
                return result;
            },

            /**
             * Get active lambda requests
             * @method requests
             * @async
             * @memberof module:API.cvat.lambda
             * @throws {module:API.cvat.exceptions.ServerError}
             * @throws {module:API.cvat.exceptions.PluginError}
             */
            async requests() {
                const result = await PluginRegistry.apiWrapper(cvat.lambda.requests);
                return result;
            },
        },
        /**
         * Namespace to working with clowder
         * @namespace clowder
         * @memberof module:API.cvat
         */
        clowder: {
            /**
             * @typedef {Object} ClowderFile
             * @property {string} clowderid clowder dataset id
             * @property {string} name filename
             * @property {boolean} is_file is it folder or file
             * @global
             */

            /**
             * Method returns list of root files and folders from clowder dataset
             * @method getRootFiles
             * @async
             * @memberof module:API.cvat.clowder
             * @param {string} datasetId
             * @param {string} clowderApiKey
             * @returns {ClowderFile[]}
             * @throws {module:API.cvat.exceptions.ServerError}
             */
            async getRootFiles(datasetId, clowderApiKey) {
                const result = await PluginRegistry.apiWrapper(cvat.clowder.getRootFiles, datasetId, clowderApiKey);
                return result;
            },

            /**
             * Method returns list of files and folders from specific clowder dataset folder
             * @method getFolderFiles
             * @async
             * @memberof module:API.cvat.clowder
             * @param {string} datasetId
             * @param {string} folderId
             * @param {string} clowderApiKey
             * @returns {ClowderFile[]}
             * @throws {module:API.cvat.exceptions.ServerError}
             */
            async getFolderFiles(datasetId, folderId, clowderApiKey) {
                const result = await PluginRegistry.apiWrapper(
                    cvat.clowder.getFolderFiles,
                    datasetId,
                    folderId,
                    clowderApiKey,
                );
                return result;
            },
        },
        /**
         * Namespace to working with logs
         * @namespace logger
         * @memberof module:API.cvat
         */
        /**
         * Method to logger configuration
         * @method configure
         * @memberof module:API.cvat.logger
         * @param {function} isActiveChecker - callback to know if logger
         * should increase working time or not
         * @param {object} userActivityCallback - container for a callback <br>
         * Logger put here a callback to update user activity timer <br>
         * You can call it outside
         * @instance
         * @async
         * @throws {module:API.cvat.exceptions.PluginError}
         * @throws {module:API.cvat.exceptions.ArgumentError}
         */

        /**
         * Append log to a log collection <br>
         * Durable logs will have been added after "close" method is called for them <br>
         * Ignore rules exist for some logs (e.g. zoomImage, changeAttribute) <br>
         * Payload of ignored logs are shallowly combined to previous logs of the same type
         * @method log
         * @memberof module:API.cvat.logger
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
         * Save accumulated logs on a server
         * @method save
         * @memberof module:API.cvat.logger
         * @throws {module:API.cvat.exceptions.PluginError}
         * @throws {module:API.cvat.exceptions.ServerError}
         * @instance
         * @async
         */
        logger: loggerStorage,
        /**
         * Namespace contains some changeable configurations
         * @namespace config
         * @memberof module:API.cvat
         */
        config: {
            /**
             * @memberof module:API.cvat.config
             * @property {string} backendAPI host with a backend api
             * @memberof module:API.cvat.config
             * @property {string} proxy Axios proxy settings.
             * For more details please read <a href="https://github.com/axios/axios"> here </a>
             * @memberof module:API.cvat.config
             * @memberof module:API.cvat.config
             */
            get backendAPI() {
                return config.backendAPI;
            },
            set backendAPI(value) {
                config.backendAPI = value;
            },
            get proxy() {
                return config.proxy;
            },
            set proxy(value) {
                config.proxy = value;
            },
        },
        /**
         * Namespace contains some library information e.g. api version
         * @namespace client
         * @memberof module:API.cvat
         */
        client: {
            /**
             * @property {string} version Client version.
             * Format: <b>{major}.{minor}.{patch}</b>
             * <li style="margin-left: 10px;"> A major number is changed after an API becomes
             * incompatible with a previous version
             * <li style="margin-left: 10px;"> A minor number is changed after an API expands
             * <li style="margin-left: 10px;"> A patch number is changed after an each build
             * @memberof module:API.cvat.client
             * @readonly
             */
            version: `${pjson.version}`,
        },
        /**
         * Namespace is used for access to enums
         * @namespace enums
         * @memberof module:API.cvat
         */
        enums,
        /**
         * Namespace is used for access to exceptions
         * @namespace exceptions
         * @memberof module:API.cvat
         */
        exceptions: {
            Exception,
            ArgumentError,
            DataError,
            ScriptingError,
            PluginError,
            ServerError,
        },
        /**
         * Namespace is used for access to classes
         * @namespace classes
         * @memberof module:API.cvat
         */
        classes: {
            User,
            Project,
            Task,
            Job,
            Log,
            Attribute,
            Label,
            Statistics,
            ObjectState,
            MLModel,
            Comment,
            Issue,
            Review,
        },
    };

    cvat.server = Object.freeze(cvat.server);
    cvat.projects = Object.freeze(cvat.projects);
    cvat.tasks = Object.freeze(cvat.tasks);
    cvat.jobs = Object.freeze(cvat.jobs);
    cvat.users = Object.freeze(cvat.users);
    cvat.plugins = Object.freeze(cvat.plugins);
    cvat.lambda = Object.freeze(cvat.lambda);
    cvat.client = Object.freeze(cvat.client);
    cvat.enums = Object.freeze(cvat.enums);
    cvat.clowder = Object.freeze(cvat.clowder);

    const implementAPI = require('./api-implementation');

    Math.clamp = function (value, min, max) {
        return Math.min(Math.max(value, min), max);
    };

    const implemented = Object.freeze(implementAPI(cvat));
    return implemented;
}

module.exports = build();
