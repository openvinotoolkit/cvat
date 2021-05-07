// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT
import * as THREE from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { ViewType } from './canvas3dModel';
import constants from './consts';

export interface Indexable {
    [key: string]: any;
}

export class CuboidModel {
    public perspective: THREE.Mesh;
    public top: THREE.Mesh;
    public side: THREE.Mesh;
    public front: THREE.Mesh;

    public constructor(outline: string, outlineColor: string) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: false,
            transparent: true,
            opacity: 0.4,
        });
        this.perspective = new THREE.Mesh(geometry, material);
        const geo = new THREE.EdgesGeometry(this.perspective.geometry);
        const wireframe = new THREE.LineSegments(
            geo,
            outline === 'line'
                ? new THREE.LineBasicMaterial({ color: outlineColor, linewidth: 4 })
                : new THREE.LineDashedMaterial({
                    color: outlineColor,
                    dashSize: 0.05,
                    gapSize: 0.05,
                }),
        );
        wireframe.computeLineDistances();
        wireframe.renderOrder = 1;
        this.perspective.add(wireframe);

        this.top = new THREE.Mesh(geometry, material);
        this.side = new THREE.Mesh(geometry, material);
        this.front = new THREE.Mesh(geometry, material);
    }

    public setPosition(x: number, y: number, z: number): void {
        [ViewType.PERSPECTIVE, ViewType.TOP, ViewType.SIDE, ViewType.FRONT].forEach((view): void => {
            (this as Indexable)[view].position.set(x, y, z);
        });
    }

    public setScale(x: number, y: number, z: number): void {
        [ViewType.PERSPECTIVE, ViewType.TOP, ViewType.SIDE, ViewType.FRONT].forEach((view): void => {
            (this as Indexable)[view].scale.set(x, y, z);
        });
    }

    public setRotation(x: number, y: number, z: number): void {
        [ViewType.PERSPECTIVE, ViewType.TOP, ViewType.SIDE, ViewType.FRONT].forEach((view): void => {
            (this as Indexable)[view].rotation.set(x, y, z);
        });
    }

    public attachCameraReference(): void {
        // Attach Cam Reference
        const topCameraReference = new THREE.Object3D();
        topCameraReference.translateZ(2);
        topCameraReference.name = constants.CAMERA_REFERENCE;
        this.top.add(topCameraReference);
        this.top.userData = { ...this.top.userData, camReference: topCameraReference };

        const sideCameraReference = new THREE.Object3D();
        sideCameraReference.translateY(2);
        sideCameraReference.name = constants.CAMERA_REFERENCE;
        this.side.add(sideCameraReference);
        this.side.userData = { ...this.side.userData, camReference: sideCameraReference };

        const frontCameraReference = new THREE.Object3D();
        frontCameraReference.translateX(2);
        frontCameraReference.name = constants.CAMERA_REFERENCE;
        this.front.add(frontCameraReference);
        this.front.userData = { ...this.front.userData, camReference: frontCameraReference };
    }

    public getReferenceCoordinates(viewType: string): THREE.Vector3 {
        const { elements } = (this as Indexable)[viewType].getObjectByName(constants.CAMERA_REFERENCE).matrixWorld;
        return new THREE.Vector3(elements[12], elements[13], elements[14]);
    }

    public setName(clientId: any): void {
        [ViewType.PERSPECTIVE, ViewType.TOP, ViewType.SIDE, ViewType.FRONT].forEach((view): void => {
            (this as Indexable)[view].name = clientId;
        });
    }

    public setOriginalColor(color: string): void {
        [ViewType.PERSPECTIVE, ViewType.TOP, ViewType.SIDE, ViewType.FRONT].forEach((view): void => {
            ((this as Indexable)[view] as any).originalColor = color;
        });
    }

    public setColor(color: string): void {
        [ViewType.PERSPECTIVE, ViewType.TOP, ViewType.SIDE, ViewType.FRONT].forEach((view): void => {
            ((this as Indexable)[view].material as THREE.MeshBasicMaterial).color.set(color);
        });
    }

    public setOpacity(opacity: number): void {
        [ViewType.PERSPECTIVE, ViewType.TOP, ViewType.SIDE, ViewType.FRONT].forEach((view): void => {
            ((this as Indexable)[view].material as THREE.MeshBasicMaterial).opacity = opacity / 100;
        });
    }
}

export function setEdges(instance: THREE.Mesh): THREE.LineSegments {
    const edges = new THREE.EdgesGeometry(instance.geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: '#ffffff', linewidth: 3 }));
    line.name = constants.CUBOID_EDGE_NAME;
    instance.add(line);
    return line;
}

export function setTranslationHelper(instance: THREE.Mesh): void {
    const sphereGeometry = new THREE.SphereGeometry(0.05);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff', opacity: 1 });
    instance.geometry.deleteAttribute('normal');
    instance.geometry.deleteAttribute('uv');
    // eslint-disable-next-line no-param-reassign
    instance.geometry = BufferGeometryUtils.mergeVertices(instance.geometry);
    const vertices = [];
    const positionAttribute = instance.geometry.getAttribute('position');
    for (let i = 0; i < positionAttribute.count; i++) {
        const vertex = new THREE.Vector3();
        vertex.fromBufferAttribute(positionAttribute, i);
        vertices.push(vertex);
    }
    const helpers = [];
    for (let i = 0; i < vertices.length; i++) {
        helpers[i] = new THREE.Mesh(sphereGeometry.clone(), sphereMaterial.clone());
        helpers[i].position.set(vertices[i].x, vertices[i].y, vertices[i].z);
        helpers[i].up.set(0, 0, 1);
        instance.add(helpers[i]);
    }
    // eslint-disable-next-line no-param-reassign
    instance.userData = { ...instance.userData, resizeHelpers: helpers };
}

export function createRotationHelper(instance: THREE.Mesh, viewType: ViewType): void {
    const sphereGeometry = new THREE.SphereGeometry(0.05);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff', opacity: 1 });
    const rotationHelper = new THREE.Mesh(sphereGeometry, sphereMaterial);
    rotationHelper.name = constants.ROTATION_HELPER;
    switch (viewType) {
        case ViewType.TOP:
            rotationHelper.position.set(
                (instance.geometry as THREE.BoxGeometry).parameters.height / 2 + constants.ROTATION_HELPER_OFFSET,
                instance.position.y,
                instance.position.z,
            );
            instance.add(rotationHelper.clone());
            // eslint-disable-next-line no-param-reassign
            instance.userData = { ...instance.userData, rotationHelpers: rotationHelper.clone() };
            break;
        case ViewType.SIDE:
        case ViewType.FRONT:
            rotationHelper.position.set(
                instance.position.x,
                instance.position.y,
                (instance.geometry as THREE.BoxGeometry).parameters.depth / 2 + constants.ROTATION_HELPER_OFFSET,
            );
            instance.add(rotationHelper.clone());
            // eslint-disable-next-line no-param-reassign
            instance.userData = { ...instance.userData, rotationHelpers: rotationHelper.clone() };
            break;
        default:
            break;
    }
}
