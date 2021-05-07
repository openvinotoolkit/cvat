// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { ClowderFileDto } from 'reducers/interfaces';
import getDuplicationMap from './get-duplication-map';

export default function getDuplicationString(files: ClowderFileDto[]): string {
    const fileNamesCountMap = getDuplicationMap(files);

    return Object.entries(fileNamesCountMap)
        .reduce((acc: string[], [name, count]: [string, number]) => (count > 1 ? [...acc, name] : acc), [])
        .join(', ');
}
