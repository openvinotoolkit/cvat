// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import {
    Canvas3dModel, Mode, DrawData, ActiveElement, FocusData,
} from './canvas3dModel';

export interface Canvas3dController {
    readonly drawData: DrawData;
    readonly activeElement: ActiveElement;
    readonly selected: any;
    readonly focused: FocusData;
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

    public get activeElement(): ActiveElement {
        return this.model.data.activeElement;
    }

    public get selected(): any {
        return this.model.data.selected;
    }

    public get focused(): any {
        return this.model.data.focusData;
    }
}
