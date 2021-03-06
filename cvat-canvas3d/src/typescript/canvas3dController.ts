// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { Canvas3dModel, Mode, DrawData } from './canvas3dModel';

export interface Canvas3dController {
    readonly drawData: DrawData;
    mode: Mode;
}

export class Canvas3dControllerImpl implements Canvas3dController {
    private model: Canvas3dModel;

    public constructor(model: Canvas3dModel) {
        this.model = model;
    }

    public set mode(value: Mode) {
        this.model.mode = value;
    }

    public get mode(): Mode {
        return this.model.mode;
    }

    public get drawData(): DrawData {
        return this.model.data.drawData;
    }
}
