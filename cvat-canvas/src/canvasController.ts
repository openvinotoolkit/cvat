/*
* Copyright (C) 2019 Intel Corporation
* SPDX-License-Identifier: MIT
*/

import {
    CanvasModel,
    Geometry,
    Position,
    Size,
    FocusData,
} from './canvasModel';

export interface CanvasController {
    readonly gridSize: Size;
    readonly objects: any[];
    readonly focusData: FocusData;
    geometry: Geometry;
    canvasSize: Size;

    zoom(x: number, y: number, direction: number): void;
    enableDrag(x: number, y: number): void;
    drag(x: number, y: number): void;
    disableDrag(): void;

    fit(): void;
}

export class CanvasControllerImpl implements CanvasController {
    private model: CanvasModel;
    private lastDragPosition: Position;
    private isDragging: boolean;

    public constructor(model: CanvasModel) {
        this.model = model;
    }

    public zoom(x: number, y: number, direction: number): void {
        this.model.zoom(x, y, direction);
    }

    public fit(): void {
        this.model.fit();
    }

    public enableDrag(x: number, y: number): void {
        this.lastDragPosition = {
            x,
            y,
        };
        this.isDragging = true;
    }

    public drag(x: number, y: number): void {
        if (this.isDragging) {
            const topOffset: number = y - this.lastDragPosition.y;
            const leftOffset: number = x - this.lastDragPosition.x;
            this.lastDragPosition = {
                x,
                y,
            };
            this.model.move(topOffset, leftOffset);
        }
    }

    public disableDrag(): void {
        this.isDragging = false;
    }

    public get geometry(): Geometry {
        return this.model.geometry;
    }

    public set geometry(geometry: Geometry) {
        this.model.geometry = geometry;
    }

    public get objects(): any[] {
        return this.model.objects;
    }

    public set canvasSize(value: Size) {
        this.model.canvasSize = value;
    }

    public get canvasSize(): Size {
        return this.model.canvasSize;
    }

    public get gridSize(): Size {
        return this.model.gridSize;
    }

    public get focusData(): FocusData {
        return this.model.focusData;
    }
}
