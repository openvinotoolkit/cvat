// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { ClowderFileDto } from 'reducers/interfaces';

export default function getDuplicationMap(files: ClowderFileDto[]): Record<string, number> {
    return files.reduce(
        (acc: Record<string, number>, { name, is_file }: ClowderFileDto) =>
            is_file
                ? {
                      ...acc,
                      ...(acc[name] ? { [name]: acc[name] + 1 } : { [name]: 1 }),
                  }
                : acc,
        {},
    );
}
