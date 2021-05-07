// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { ClowderFileDto } from 'reducers/interfaces';

function sortByName(files: ClowderFileDto[]): ClowderFileDto[] {
    return files.sort((a: ClowderFileDto, b: ClowderFileDto) => {
        if (a.name.toLocaleLowerCase() > b.name.toLocaleLowerCase()) {
            return 1;
        }
        if (a.name.toLocaleLowerCase() < b.name.toLocaleLowerCase()) {
            return -1;
        }
        return 0;
    });
}

export default function sortClowderFiles(files: ClowderFileDto[]): ClowderFileDto[] {
    const clowderFiles = files.filter(({ is_file }: ClowderFileDto) => is_file);
    const clowderFolders = files.filter(({ is_file }: ClowderFileDto) => !is_file);

    const sortedFiles = sortByName(clowderFiles);
    const sortedFolders = sortByName(clowderFolders);

    return [...sortedFolders, ...sortedFiles];
}
