// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { ClowderFileDto } from 'reducers/interfaces';
import isImageFile from './is-image-file';

export default function hasFileTypesCollision(files: ClowderFileDto[]): boolean {
    const notImageFiles: ClowderFileDto[] = files.filter((file: ClowderFileDto) => !isImageFile(file));

    const hasFolderOrImageFile: boolean = files.some((file: ClowderFileDto) => !file.is_file || isImageFile(file));

    return notImageFiles.length > 1 || (notImageFiles.length > 0 && hasFolderOrImageFile);
}
