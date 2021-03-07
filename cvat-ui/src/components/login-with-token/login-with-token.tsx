// Copyright (C) 2020 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React, { useEffect } from 'react';
import { Redirect, useParams, useLocation } from 'react-router';
import { useCookies } from 'react-cookie';

export default function LoginWithTokenComponent(): JSX.Element {
    const location = useLocation();
    const { sessionId, token } = useParams<{ sessionId: string; token: string }>();
    const [cookies, setCookie] = useCookies(['sessionid', 'csrftoken']);

    const expires1y = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
    const expires2w = new Date(new Date().setDate(new Date().getDate() + 13));
    const search = new URLSearchParams(location.search);

    setCookie('sessionid', sessionId, { path: '/' });
    setCookie('csrftoken', token, { path: '/' });
    setCookie('sessionid', sessionId, { domain: 'localhost', path: '/' });
    setCookie('csrftoken', token, { domain: 'localhost', path: '/' });

    useEffect(
        () => () => {
            window.location.reload();
        },
        [cookies.sessionid, cookies.csrftoken],
    );

    if (cookies.sessionid && cookies.csrftoken) {
        return <Redirect to={search.get('next') || '/tasks'} />;
    }
    return <Redirect to={'/auth/login'} />;
}
