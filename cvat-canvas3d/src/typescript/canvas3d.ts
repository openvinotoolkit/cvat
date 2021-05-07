// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import pjson from '../../package.json';
import { Canvas3dController, Canvas3dControllerImpl } from './canvas3dController';
import {
    Canvas3dModel,
    Canvas3dModelImpl,
    Mode,
    DrawData,
    ViewType,
    MouseInteraction,
    ShapeProperties,
} from './canvas3dModel';
import {
    Canvas3dView, Canvas3dViewImpl, ViewsDOM, CameraAction,
} from './canvas3dView';
import { Master } from './master';

const Canvas3dVersion = pjson.version;

interface Canvas3d {
    html(): ViewsDOM;
    setup(frameData: any, objectStates: any[]): void;
    isAbleToChangeFrame(): boolean;
    mode(): Mode;
    render(): void;
    keyControls(keys: KeyboardEvent): void;
    draw(drawData: DrawData): void;
    cancel(): void;
    dragCanvas(enable: boolean): void;
    activate(clientID: number | null, attributeID?: number): void;
    configureShapes(shapeProperties: ShapeProperties): void;
    fitCanvas(): void;
    fit(): void;
}

class Canvas3dImpl implements Canvas3d {
    private readonly model: Canvas3dModel & Master;
    private readonly controller: Canvas3dController;
    private view: Canvas3dView;

    public constructor() {
        this.model = new Canvas3dModelImpl();
        this.controller = new Canvas3dControllerImpl(this.model);
        this.view = new Canvas3dViewImpl(this.model, this.controller);
    }

    public html(): ViewsDOM {
        return this.view.html();
    }

    public keyControls(keys: KeyboardEvent): void {
        this.view.keyControls(keys);
    }

    public render(): void {
        this.view.render();
    }

    public draw(drawData: DrawData): void {
        this.model.draw(drawData);
    }

    public setup(frameData: any, objectStates: any[]): void {
        this.model.setup(frameData, objectStates);
    }

    public mode(): Mode {
        return this.model.mode;
    }

    public isAbleToChangeFrame(): boolean {
        return this.model.isAbleToChangeFrame();
    }

    public cancel(): void {
        this.model.cancel();
    }

    public dragCanvas(enable: boolean): void {
        this.model.dragCanvas(enable);
    }

    public configureShapes(shapeProperties: ShapeProperties): void {
        this.model.configureShapes(shapeProperties);
    }

    public activate(clientID: number | null, attributeID: number | null = null): void {
        this.model.activate(String(clientID), attributeID);
    }

    public fit(): void {
        this.model.fit();
    }

    public fitCanvas(): void {
        this.model.fit();
    }
}

export {
    Canvas3dImpl as Canvas3d, Canvas3dVersion, ViewType, MouseInteraction, CameraAction, ViewsDOM,
};
