// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { ClowderFileDto } from 'reducers/interfaces';

const IMAGE_FILE_PATTERN = /\.(jpe?g|bmp|png|gif)$/;

export default function isImageFile({ name, is_file }: ClowderFileDto): boolean {
    return is_file && IMAGE_FILE_PATTERN.test(name);
}
