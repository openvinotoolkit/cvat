/*
* Copyright (C) 2018 Intel Corporation
* SPDX-License-Identifier: MIT
*/

/* global
    require:false
    global:false
    encodeURIComponent:false
*/

(() => {
    const {
        Exception,
        ServerInteractionException,
    } = require('./exceptions');

    class ServerProxy {
        constructor() {
            const Cookie = require('js-cookie');
            const Axios = require('axios');

            function setCSRFHeader(header) {
                Axios.defaults.headers.delete['X-CSRFToken'] = header;
                Axios.defaults.headers.patch['X-CSRFToken'] = header;
                Axios.defaults.headers.post['X-CSRFToken'] = header;
                Axios.defaults.headers.put['X-CSRFToken'] = header;
            }

            async function about() {
                const { restAPI } = global.cvat.config;

                let response = null;
                try {
                    response = await Axios.get(`${restAPI}/server/about`, {
                        proxy: global.cvat.config.proxy,
                    });
                } catch (errorData) {
                    throw new ServerInteractionException('Could not get "about" information from a server', {
                        code: errorData.response ? errorData.response.status : errorData.code,
                    });
                }

                return response;
            }

            async function share(directory) {
                const { restAPI } = global.cvat.config;

                let response = null;
                try {
                    response = await Axios.get(`${restAPI}/server/share?directory=${directory}`, {
                        proxy: global.cvat.config.proxy,
                    });
                } catch (errorData) {
                    throw new ServerInteractionException('Could not get "share" information from a server', {
                        code: errorData.response ? errorData.response.status : errorData.code,
                    });
                }

                return response;
            }

            async function exception(exceptionObject) {
                const { restAPI } = global.cvat.config;

                try {
                    await Axios.post(`${restAPI}/server/exception`, JSON.stringify(exceptionObject), {
                        proxy: global.cvat.config.proxy,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });
                } catch (errorData) {
                    throw new ServerInteractionException('Could not send an exception to a server', {
                        code: errorData.response ? errorData.response.status : errorData.code,
                    });
                }
            }

            async function login(username, password) {
                function setCookie(response) {
                    if (response.headers['set-cookie']) {
                        // Browser itself setup cookie and header is none
                        // In NodeJS we need do it manually
                        let cookies = '';
                        for (let cookie of response.headers['set-cookie']) {
                            [cookie] = cookie.split(';'); // truncate extra information
                            const name = cookie.split('=')[0];
                            const value = cookie.split('=')[1];
                            if (name === 'csrftoken') {
                                setCSRFHeader(value);
                            }
                            Cookie.set(name, value);
                            cookies += `${cookie};`;
                        }

                        Axios.defaults.headers.common.Cookie = cookies;
                    } else {
                        // Browser code. We need set additinal header for authentification
                        const csrftoken = Cookie.get('csrftoken');
                        if (csrftoken) {
                            setCSRFHeader(csrftoken);
                        } else {
                            throw new Exception('An environment has been detected as a browser'
                                + ', but CSRF token has not been found in cookies');
                        }
                    }
                }

                const host = global.cvat.config.restAPI.slice(0, -7);
                let csrf = null;
                try {
                    csrf = await Axios.get(`${host}/auth/login`, {
                        proxy: global.cvat.config.proxy,
                    });
                } catch (errorData) {
                    throw new ServerInteractionException('Could not get CSRF token from a server', {
                        code: errorData.response ? errorData.response.status : errorData.code,
                    });
                }

                setCookie(csrf);

                const authentificationData = ([
                    `${encodeURIComponent('username')}=${encodeURIComponent(username)}`,
                    `${encodeURIComponent('password')}=${encodeURIComponent(password)}`,
                ]).join('&').replace(/%20/g, '+');

                let authentificationResponse = null;
                try {
                    authentificationResponse = await Axios.post(
                        `${host}/auth/login`,
                        authentificationData,
                        {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            proxy: global.cvat.config.proxy,
                            // do not redirect to a dashboard,
                            // otherwise we don't get a session id in a response
                            maxRedirects: 0,
                        },
                    );
                } catch (errorData) {
                    if (errorData.response.status === 302) {
                        // Redirection code expected
                        authentificationResponse = errorData.response;
                    } else {
                        throw new ServerInteractionException('Could not login on a server', {
                            code: errorData.response ? errorData.response.status : errorData.code,
                        });
                    }
                }

                setCookie(authentificationResponse);
            }

            async function getTasks(filter = '') {
                const { restAPI } = global.cvat.config;

                let response = null;
                try {
                    response = await Axios.get(`${restAPI}/tasks?${filter}`, {
                        proxy: global.cvat.config.proxy,
                    });
                } catch (errorData) {
                    throw new ServerInteractionException('Could not get tasks from a server', {
                        code: errorData.response ? errorData.response.status : errorData.code,
                    });
                }

                return response.data;
            }

            async function getTaskJobs(taskID) {
                const { restAPI } = global.cvat.config;

                let response = null;
                try {
                    response = await Axios.get(`${restAPI}/tasks/${taskID}/jobs`, {
                        proxy: global.cvat.config.proxy,
                    });
                } catch (errorData) {
                    throw new ServerInteractionException('Could not get jobs from a server', {
                        code: errorData.response ? errorData.response.status : errorData.code,
                    });
                }

                return response.data;
            }

            async function getJob(jobID) {
                const { restAPI } = global.cvat.config;

                let response = null;
                try {
                    response = await Axios.get(`${restAPI}/jobs/${jobID}`, {
                        proxy: global.cvat.config.proxy,
                    });
                } catch (errorData) {
                    throw new ServerInteractionException('Could not get jobs from a server', {
                        code: errorData.response ? errorData.response.status : errorData.code,
                    });
                }

                return response.data;
            }

            async function getUsers() {
                const { restAPI } = global.cvat.config;

                let response = null;
                try {
                    response = await Axios.get(`${restAPI}/users`, {
                        proxy: global.cvat.config.proxy,
                    });
                } catch (errorData) {
                    throw new ServerInteractionException('Could not get users from a server', {
                        code: errorData.response ? errorData.response.status : errorData.code,
                    });
                }

                return response.data;
            }

            async function getSelf() {
                const { restAPI } = global.cvat.config;

                let response = null;
                try {
                    response = await Axios.get(`${restAPI}/users/self`, {
                        proxy: global.cvat.config.proxy,
                    });
                } catch (errorData) {
                    throw new ServerInteractionException('Could not get users from a server', {
                        code: errorData.response ? errorData.response.status : errorData.code,
                    });
                }

                return response.data;
            }

            // Set csrftoken header from browser cookies if it exists
            // NodeJS env returns 'undefined'
            // So in NodeJS we need login after each run
            const csrftoken = Cookie.get('csrftoken');
            if (csrftoken) {
                setCSRFHeader(csrftoken);
            }

            Object.defineProperties(this, {
                server: {
                    value: Object.freeze({
                        about,
                        share,
                        exception,
                        login,
                    }),
                    writable: false,
                },

                tasks: {
                    value: Object.freeze({
                        get: getTasks,
                    }),
                    writable: false,
                },

                jobs: {
                    value: Object.freeze({
                        getTaskJobs,
                        getJob,
                    }),
                    writable: false,
                },

                users: {
                    value: Object.freeze({
                        getUsers,
                        getSelf,
                    }),
                    writable: false,
                },
            });
        }
    }

    const serverProxy = new ServerProxy();
    module.exports = serverProxy;
})();
