// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';

import ObjectButtonsContainer from 'containers/annotation-page/standard-workspace/objects-side-bar/object-buttons';
import { ObjectType, ShapeType, ColorBy } from 'reducers/interfaces';
import { Canvas } from 'cvat-canvas-wrapper';
import { Canvas3d } from 'cvat-canvas3d-wrapper';
import ItemDetails, { attrValuesAreEqual } from './object-item-details';
import ItemBasics from './object-item-basics';

interface Props {
    normalizedKeyMap: Record<string, string>;
    readonly: boolean;
    activated: boolean;
    objectType: ObjectType;
    shapeType: ShapeType;
    clientID: number;
    serverID: number | undefined;
    labelID: number;
    locked: boolean;
    attrValues: Record<number, string>;
    color: string;
    colorBy: ColorBy;

    labels: any[];
    attributes: any[];
    collapsed: boolean;
    canvasInstance: Canvas | Canvas3d;

    activate(): void;
    copy(): void;
    propagate(): void;
    createURL(): void;
    switchOrientation(): void;
    toBackground(): void;
    toForeground(): void;
    remove(): void;
    changeLabel(label: any): void;
    changeAttribute(attrID: number, value: string): void;
    changeColor(color: string): void;
    collapse(): void;
    resetCuboidPerspective(): void;
    activateTracking(): void;
}

function objectItemsAreEqual(prevProps: Props, nextProps: Props): boolean {
    return (
        nextProps.activated === prevProps.activated &&
        nextProps.readonly === prevProps.readonly &&
        nextProps.locked === prevProps.locked &&
        nextProps.labelID === prevProps.labelID &&
        nextProps.color === prevProps.color &&
        nextProps.clientID === prevProps.clientID &&
        nextProps.serverID === prevProps.serverID &&
        nextProps.objectType === prevProps.objectType &&
        nextProps.shapeType === prevProps.shapeType &&
        nextProps.collapsed === prevProps.collapsed &&
        nextProps.labels === prevProps.labels &&
        nextProps.attributes === prevProps.attributes &&
        nextProps.normalizedKeyMap === prevProps.normalizedKeyMap &&
        nextProps.colorBy === prevProps.colorBy &&
        attrValuesAreEqual(nextProps.attrValues, prevProps.attrValues)
    );
}

function ObjectItemComponent(props: Props): JSX.Element {
    const {
        activated,
        readonly,
        objectType,
        shapeType,
        clientID,
        serverID,
        locked,
        attrValues,
        labelID,
        color,
        colorBy,

        attributes,
        labels,
        collapsed,
        normalizedKeyMap,

        activate,
        copy,
        propagate,
        createURL,
        switchOrientation,
        toBackground,
        toForeground,
        remove,
        changeLabel,
        changeAttribute,
        changeColor,
        collapse,
        resetCuboidPerspective,
        activateTracking,
        canvasInstance,
    } = props;

    const type =
        objectType === ObjectType.TAG ?
            ObjectType.TAG.toUpperCase() :
            `${shapeType.toUpperCase()} ${objectType.toUpperCase()}`;

    const className = !activated ?
        'cvat-objects-sidebar-state-item' :
        'cvat-objects-sidebar-state-item cvat-objects-sidebar-state-active-item';

    return (
        <div style={{ display: 'flex', marginBottom: '1px' }}>
            <div className='cvat-objects-sidebar-state-item-color' style={{ background: `${color}` }} />
            <div
                onMouseEnter={activate}
                id={`cvat-objects-sidebar-state-item-${clientID}`}
                className={className}
                style={{ backgroundColor: `${color}88` }}
            >
                <ItemBasics
                    canvasInstance={canvasInstance}
                    readonly={readonly}
                    serverID={serverID}
                    clientID={clientID}
                    labelID={labelID}
                    labels={labels}
                    shapeType={shapeType}
                    objectType={objectType}
                    color={color}
                    colorBy={colorBy}
                    type={type}
                    locked={locked}
                    copyShortcut={normalizedKeyMap.COPY_SHAPE}
                    pasteShortcut={normalizedKeyMap.PASTE_SHAPE}
                    propagateShortcut={normalizedKeyMap.PROPAGATE_OBJECT}
                    toBackgroundShortcut={normalizedKeyMap.TO_BACKGROUND}
                    toForegroundShortcut={normalizedKeyMap.TO_FOREGROUND}
                    removeShortcut={normalizedKeyMap.DELETE_OBJECT}
                    changeColorShortcut={normalizedKeyMap.CHANGE_OBJECT_COLOR}
                    changeLabel={changeLabel}
                    changeColor={changeColor}
                    copy={copy}
                    remove={remove}
                    propagate={propagate}
                    createURL={createURL}
                    switchOrientation={switchOrientation}
                    toBackground={toBackground}
                    toForeground={toForeground}
                    resetCuboidPerspective={resetCuboidPerspective}
                    activateTracking={activateTracking}
                />
                <ObjectButtonsContainer readonly={readonly} clientID={clientID} />
                {!!attributes.length && (
                    <ItemDetails
                        readonly={readonly}
                        collapsed={collapsed}
                        attributes={attributes}
                        values={attrValues}
                        collapse={collapse}
                        changeAttribute={changeAttribute}
                    />
                )}
            </div>
        </div>
    );
}

export default React.memo(ObjectItemComponent, objectItemsAreEqual);
