// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import * as THREE from 'three';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader';
import CameraControls from 'camera-controls';
import { Canvas3dController } from './canvas3dController';
import { Listener, Master } from './master';
import CONST from './consts';
import {
    Canvas3dModel, DrawData, Mode, Planes, UpdateReasons, ViewType,
} from './canvas3dModel';
import {
    createRotationHelper, CuboidModel, setEdges, setTranslationHelper,
} from './cuboid';

export interface Canvas3dView {
    html(): ViewsDOM;
    render(): void;
    keyControls(keys: KeyboardEvent): void;
}

export enum CameraAction {
    ZOOM_IN = 'KeyI',
    MOVE_UP = 'KeyU',
    MOVE_DOWN = 'KeyO',
    MOVE_LEFT = 'KeyJ',
    ZOOM_OUT = 'KeyK',
    MOVE_RIGHT = 'KeyL',
    TILT_UP = 'ArrowUp',
    TILT_DOWN = 'ArrowDown',
    ROTATE_RIGHT = 'ArrowRight',
    ROTATE_LEFT = 'ArrowLeft',
}

export interface RayCast {
    renderer: THREE.Raycaster;
    mouseVector: THREE.Vector2;
}

export interface Views {
    perspective: RenderView;
    top: RenderView;
    side: RenderView;
    front: RenderView;
}

export interface CubeObject {
    perspective: THREE.Mesh;
    top: THREE.Mesh;
    side: THREE.Mesh;
    front: THREE.Mesh;
}

export interface RenderView {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera?: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    controls?: CameraControls;
    rayCaster?: RayCast;
}

export interface ViewsDOM {
    perspective: HTMLCanvasElement;
    top: HTMLCanvasElement;
    side: HTMLCanvasElement;
    front: HTMLCanvasElement;
}

export class Canvas3dViewImpl implements Canvas3dView, Listener {
    private controller: Canvas3dController;
    private views: Views;
    private clock: THREE.Clock;
    private speed: number;
    private cube: CuboidModel;
    private highlighted: boolean;
    private selected: CubeObject;
    private model: Canvas3dModel & Master;
    private action: any;

    private set mode(value: Mode) {
        this.controller.mode = value;
    }

    private get mode(): Mode {
        return this.controller.mode;
    }

    public constructor(model: Canvas3dModel & Master, controller: Canvas3dController) {
        this.controller = controller;
        this.clock = new THREE.Clock();
        this.speed = CONST.MOVEMENT_FACTOR;
        this.cube = new CuboidModel('line', '#ffffff');
        this.highlighted = false;
        this.selected = this.cube;
        this.model = model;
        this.action = {
            scan: null,
            detected: false,
            initialMouseVector: new THREE.Vector2(),
            translation: {
                status: false,
                helper: null,
                coordinates: null,
            },
            rotation: {
                status: false,
                helper: null,
                screenInit: {
                    x: 0,
                    y: 0,
                },
                screenMove: {
                    x: 0,
                    y: 0,
                },
            },
            resize: {
                status: false,
                helper: null,
                initScales: {
                    x: 1,
                    y: 1,
                    z: 1,
                },
                memScales: {
                    x: 1,
                    y: 1,
                    z: 1,
                },
                resizeVector: new THREE.Vector3(0, 0, 0),
            },
        };

        this.views = {
            perspective: {
                renderer: new THREE.WebGLRenderer({ antialias: true }),
                scene: new THREE.Scene(),
                rayCaster: {
                    renderer: new THREE.Raycaster(),
                    mouseVector: new THREE.Vector2(),
                },
            },
            top: {
                renderer: new THREE.WebGLRenderer({ antialias: true }),
                scene: new THREE.Scene(),
                rayCaster: {
                    renderer: new THREE.Raycaster(),
                    mouseVector: new THREE.Vector2(),
                },
            },
            side: {
                renderer: new THREE.WebGLRenderer({ antialias: true }),
                scene: new THREE.Scene(),
                rayCaster: {
                    renderer: new THREE.Raycaster(),
                    mouseVector: new THREE.Vector2(),
                },
            },
            front: {
                renderer: new THREE.WebGLRenderer({ antialias: true }),
                scene: new THREE.Scene(),
                rayCaster: {
                    renderer: new THREE.Raycaster(),
                    mouseVector: new THREE.Vector2(),
                },
            },
        };
        CameraControls.install({ THREE });

        const canvasPerspectiveView = this.views.perspective.renderer.domElement;
        const canvasTopView = this.views.top.renderer.domElement;
        const canvasSideView = this.views.side.renderer.domElement;
        const canvasFrontView = this.views.front.renderer.domElement;

        canvasPerspectiveView.addEventListener('contextmenu', (e: MouseEvent): void => {
            if (this.controller.focused.clientID !== null) {
                this.dispatchEvent(
                    new CustomEvent('canvas.contextmenu', {
                        bubbles: false,
                        cancelable: true,
                        detail: {
                            clientID: Number(this.controller.focused.clientID),
                            clientX: e.clientX,
                            clientY: e.clientY,
                        },
                    }),
                );
            }
        });

        canvasTopView.addEventListener('mousedown', this.startAction.bind(this, 'top'));
        canvasSideView.addEventListener('mousedown', this.startAction.bind(this, 'side'));
        canvasFrontView.addEventListener('mousedown', this.startAction.bind(this, 'front'));

        canvasTopView.addEventListener('mousemove', this.moveAction.bind(this, 'top'));
        canvasSideView.addEventListener('mousemove', this.moveAction.bind(this, 'side'));
        canvasFrontView.addEventListener('mousemove', this.moveAction.bind(this, 'front'));

        canvasTopView.addEventListener('mouseup', this.resetActions.bind(this));
        canvasSideView.addEventListener('mouseup', this.resetActions.bind(this));
        canvasFrontView.addEventListener('mouseup', this.resetActions.bind(this));

        canvasPerspectiveView.addEventListener('mousemove', (event: MouseEvent): void => {
            event.preventDefault();
            if (this.mode === Mode.DRAG_CANVAS) return;
            const canvas = this.views.perspective.renderer.domElement;
            const rect = canvas.getBoundingClientRect();
            const { mouseVector } = this.views.perspective.rayCaster as { mouseVector: THREE.Vector2 };
            mouseVector.x = ((event.clientX - (canvas.offsetLeft + rect.left)) / canvas.clientWidth) * 2 - 1;
            mouseVector.y = -((event.clientY - (canvas.offsetTop + rect.top)) / canvas.clientHeight) * 2 + 1;
        });

        canvasPerspectiveView.addEventListener('click', (e: MouseEvent): void => {
            e.preventDefault();
            if (this.mode !== Mode.IDLE || !this.views.perspective.rayCaster) return;
            const intersects = this.views.perspective.rayCaster.renderer.intersectObjects(
                this.views.perspective.scene.children[0].children,
                false,
            );
            this.dispatchEvent(
                new CustomEvent('canvas.selected', {
                    bubbles: false,
                    cancelable: true,
                    detail: {
                        clientID: intersects.length !== 0 ? Number(intersects[0].object.name) : null,
                    },
                }),
            );
        });

        canvasPerspectiveView.addEventListener('dblclick', (e: MouseEvent): void => {
            e.preventDefault();
            if (this.mode !== Mode.DRAW) return;
            this.controller.drawData.enabled = false;
            this.mode = Mode.IDLE;
            const { x, y, z } = this.cube.perspective.position;
            const { x: width, y: height, z: depth } = this.cube.perspective.scale;
            const { x: rotationX, y: rotationY, z: rotationZ } = this.cube.perspective.rotation;
            const points = [x, y, z, rotationX, rotationY, rotationZ, width, height, depth, 0, 0, 0, 0, 0, 0, 0];
            this.dispatchEvent(
                new CustomEvent('canvas.drawn', {
                    bubbles: false,
                    cancelable: true,
                    detail: {
                        state: {
                            shapeType: 'cuboid',
                            frame: this.model.data.imageID,
                            ...this.model.data.drawData.initialState,
                            points,
                        },
                        continue: undefined,
                        duration: 0,
                    },
                }),
            );
            this.dispatchEvent(new CustomEvent('canvas.canceled'));
        });

        this.mode = Mode.IDLE;

        Object.keys(this.views).forEach((view: string): void => {
            this.views[view as keyof Views].scene.background = new THREE.Color(0x000000);
        });

        const viewSize = CONST.ZOOM_FACTOR;
        const height = window.innerHeight;
        const width = window.innerWidth;
        const aspectRatio = window.innerWidth / window.innerHeight;

        // setting up the camera and adding it in the scene
        this.views.perspective.camera = new THREE.PerspectiveCamera(50, aspectRatio, 1, 500);
        this.views.perspective.camera.position.set(-15, 0, 4);
        this.views.perspective.camera.up.set(0, 0, 1);
        this.views.perspective.camera.lookAt(10, 0, 0);
        this.views.perspective.camera.name = 'cameraPerspective';

        this.views.top.camera = new THREE.OrthographicCamera(
            (-aspectRatio * viewSize) / 2 - 2,
            (aspectRatio * viewSize) / 2 + 2,
            viewSize / 2 + 2,
            -viewSize / 2 - 2,
            -10,
            10,
        );

        this.views.top.camera.position.set(0, 0, 5);
        this.views.top.camera.lookAt(0, 0, 0);
        this.views.top.camera.up.set(0, 0, 1);
        this.views.top.camera.name = 'cameraTop';

        this.views.side.camera = new THREE.OrthographicCamera(
            (-aspectRatio * viewSize) / 2,
            (aspectRatio * viewSize) / 2,
            viewSize / 2,
            -viewSize / 2,
            -10,
            10,
        );
        this.views.side.camera.position.set(0, 5, 0);
        this.views.side.camera.lookAt(0, 0, 0);
        this.views.side.camera.up.set(0, 0, 1);
        this.views.side.camera.name = 'cameraSide';

        this.views.front.camera = new THREE.OrthographicCamera(
            (-aspectRatio * viewSize) / 2,
            (aspectRatio * viewSize) / 2,
            viewSize / 2,
            -viewSize / 2,
            -10,
            10,
        );
        this.views.front.camera.position.set(3, 0, 0);
        this.views.front.camera.up.set(0, 0, 1);
        this.views.front.camera.lookAt(0, 0, 0);
        this.views.front.camera.name = 'cameraFront';

        Object.keys(this.views).forEach((view: string): void => {
            const viewType = this.views[view as keyof Views];
            if (viewType.camera) {
                viewType.renderer.setSize(width, height);
                if (view !== ViewType.PERSPECTIVE) {
                    viewType.controls = new CameraControls(viewType.camera, viewType.renderer.domElement);
                    viewType.controls.mouseButtons.left = CameraControls.ACTION.NONE;
                    viewType.controls.mouseButtons.right = CameraControls.ACTION.NONE;
                } else {
                    viewType.controls = new CameraControls(viewType.camera, viewType.renderer.domElement);
                }
                viewType.controls.minDistance = CONST.MIN_DISTANCE;
                viewType.controls.maxDistance = CONST.MAX_DISTANCE;
            }
        });
        this.views.top.controls.enabled = false;
        this.views.side.controls.enabled = false;
        this.views.front.controls.enabled = false;

        canvasTopView.addEventListener('wheel', (event: WheelEvent): void => {
            event.preventDefault();
            const { camera } = this.views.top;
            if (event.deltaY < 0 && camera.zoom < 2) {
                camera.zoom += 0.08;
            } else if (event.deltaY > 0 && camera.zoom > 0.1) {
                camera.zoom -= 0.08;
            }
        });
        canvasSideView.addEventListener('wheel', (event: WheelEvent): void => {
            event.preventDefault();
            const { camera } = this.views.side;
            if (event.deltaY < 0 && camera.zoom < 2) {
                camera.zoom += 0.08;
            } else if (event.deltaY > 0 && camera.zoom > 0.1) {
                camera.zoom -= 0.08;
            }
        });
        canvasFrontView.addEventListener('wheel', (event: WheelEvent): void => {
            event.preventDefault();
            const { camera } = this.views.front;
            if (event.deltaY < 0 && camera.zoom < 2) {
                camera.zoom += 0.08;
            } else if (event.deltaY > 0 && camera.zoom > 0.1) {
                camera.zoom -= 0.08;
            }
        });

        model.subscribe(this);
    }

    private startAction(view: any, event: MouseEvent): void {
        const canvas = this.views[view as keyof Views].renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        const { mouseVector } = this.views[view as keyof Views].rayCaster as { mouseVector: THREE.Vector2 };
        mouseVector.x = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
        mouseVector.y = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;
        this.action.rotation.screenInit = { x: event.clientX, y: event.clientY };
        this.action.rotation.screenMove = { x: event.clientX, y: event.clientY };
        if (
            this.model.data.selected
            && !this.model.data.selected.perspective.userData.lock
            && !this.model.data.selected.perspective.userData.hidden
        ) {
            this.action.scan = view;
        }
    }

    private moveAction(view: any, event: MouseEvent): void {
        event.preventDefault();
        const canvas = this.views[view as keyof Views].renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        const { mouseVector } = this.views[view as keyof Views].rayCaster as { mouseVector: THREE.Vector2 };
        mouseVector.x = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
        mouseVector.y = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;
        this.action.rotation.screenMove = { x: event.clientX, y: event.clientY };
    }

    private translateReferencePlane(coordinates: any): void {
        const topPlane = this.views.top.scene.getObjectByName(Planes.TOP);
        if (topPlane) {
            topPlane.position.x = coordinates.x;
            topPlane.position.y = coordinates.y;
            topPlane.position.z = coordinates.z;
        }
        const sidePlane = this.views.side.scene.getObjectByName(Planes.SIDE);
        if (sidePlane) {
            sidePlane.position.x = coordinates.x;
            sidePlane.position.y = coordinates.y;
            sidePlane.position.z = coordinates.z;
        }
        const frontPlane = this.views.front.scene.getObjectByName(Planes.FRONT);
        if (frontPlane) {
            frontPlane.position.x = coordinates.x;
            frontPlane.position.y = coordinates.y;
            frontPlane.position.z = coordinates.z;
        }
    }

    private resetActions(): void {
        const { scan, detected } = this.action;
        if (!detected) return;

        const { x, y, z } = this.model.data.selected[scan].position;
        const { x: width, y: height, z: depth } = this.model.data.selected[scan].scale;
        const { x: rotationX, y: rotationY, z: rotationZ } = this.model.data.selected[scan].rotation;
        const points = [x, y, z, rotationX, rotationY, rotationZ, width, height, depth, 0, 0, 0, 0, 0, 0, 0];
        const [state] = this.model.data.objects.filter(
            (_state: any): boolean => _state.clientID === Number(this.model.data.selected[scan].name),
        );
        this.dispatchEvent(
            new CustomEvent('canvas.edited', {
                bubbles: false,
                cancelable: true,
                detail: {
                    state,
                    points,
                },
            }),
        );
        if (this.action.rotation.status) {
            this.detachCamera(scan);
        }

        this.adjustPerspectiveCameras();
        this.translateReferencePlane(new THREE.Vector3(x, y, z));
        this.action = {
            ...this.action,
            scan: null,
            detected: false,
            translation: {
                status: false,
                helper: null,
            },
            rotation: {
                status: false,
                helper: null,
            },
            resize: {
                ...this.action.resize,
                status: false,
                helper: null,
            },
        };
    }

    private setupObjects(): void {
        if (this.views.perspective.scene.children[0]) {
            const {
                opacity, outlined, outlineColor, selectedOpacity, colorBy,
            } = this.model.data.shapeProperties;
            this.clearSceneObjects();
            for (let i = 0; i < this.model.data.objects.length; i++) {
                const object = this.model.data.objects[i];
                const clientID = String(object.clientID);
                if (object.hidden) {
                    continue;
                }
                const cuboid = new CuboidModel(
                    object.occluded ? 'dashed' : 'line',
                    outlined ? outlineColor : '#ffffff',
                );
                cuboid.setName(clientID);
                cuboid.perspective.userData = object;
                let color = '';
                if (colorBy === 'Label') {
                    ({ color } = object.label);
                } else if (colorBy === 'Instance') {
                    ({ color } = object.label);
                } else {
                    ({ color } = object.group);
                }
                cuboid.setOriginalColor(color);
                cuboid.setColor(color);
                cuboid.setOpacity(opacity);

                if (this.model.data.activeElement.clientID === clientID) {
                    cuboid.setOpacity(selectedOpacity);
                    if (!object.lock) {
                        createRotationHelper(cuboid.top, ViewType.TOP);
                        createRotationHelper(cuboid.side, ViewType.SIDE);
                        createRotationHelper(cuboid.front, ViewType.FRONT);
                        setTranslationHelper(cuboid.top);
                        setTranslationHelper(cuboid.side);
                        setTranslationHelper(cuboid.front);
                    }
                    setEdges(cuboid.top);
                    setEdges(cuboid.side);
                    setEdges(cuboid.front);

                    this.translateReferencePlane(
                        new THREE.Vector3(object.points[0], object.points[1], object.points[2]),
                    );
                    this.model.data.selected = cuboid;
                } else {
                    cuboid.top.visible = false;
                    cuboid.side.visible = false;
                    cuboid.front.visible = false;
                }
                cuboid.setPosition(object.points[0], object.points[1], object.points[2]);
                cuboid.setScale(object.points[6], object.points[7], object.points[8]);
                cuboid.setRotation(object.points[3], object.points[4], object.points[5]);
                this.addSceneChildren(cuboid);
                if (this.model.data.activeElement.clientID === clientID) {
                    cuboid.attachCameraReference();
                    this.rotatePlane(null, null);
                    setTimeout((): void => this.detachCamera(null), 100);
                }
            }
        }
    }

    private addSceneChildren(shapeObject: CuboidModel): void {
        this.views.perspective.scene.children[0].add(shapeObject.perspective);
        this.views.top.scene.children[0].add(shapeObject.top);
        this.views.side.scene.children[0].add(shapeObject.side);
        this.views.front.scene.children[0].add(shapeObject.front);
    }

    private dispatchEvent(event: CustomEvent): void {
        this.views.perspective.renderer.domElement.dispatchEvent(event);
    }

    public notify(model: Canvas3dModel & Master, reason: UpdateReasons): void {
        if (reason === UpdateReasons.IMAGE_CHANGED) {
            if (!model.data.image) return;
            const loader = new PCDLoader();
            const objectURL = URL.createObjectURL(model.data.image.imageData);
            this.clearScene();
            loader.load(objectURL, this.addScene.bind(this));
            URL.revokeObjectURL(objectURL);
            this.dispatchEvent(new CustomEvent('canvas.setup'));
        } else if (reason === UpdateReasons.SHAPE_ACTIVATED) {
            const { clientID } = this.model.data.activeElement;
            Object.keys(this.views).forEach((view: string): void => {
                const viewType = this.views[view as keyof Views];
                const object = viewType.scene.getObjectByName(clientID as string);
                if (view !== ViewType.PERSPECTIVE && object !== undefined && viewType.controls) {
                    viewType.controls.fitToBox(object, false);
                    viewType.controls.zoom(-4, false);
                }
            });
            this.setupObjects();
        } else if (reason === UpdateReasons.DRAW) {
            const data: DrawData = this.controller.drawData;
            if (data.redraw) {
                const object = this.views.perspective.scene.getObjectByName(String(data.redraw));
                if (object) {
                    object.visible = false;
                }
            }
            this.cube = new CuboidModel('line', '#ffffff');
        } else if (reason === UpdateReasons.OBJECTS_UPDATED) {
            this.setupObjects();
        } else if (reason === UpdateReasons.DRAG_CANVAS) {
            this.dispatchEvent(
                new CustomEvent(this.mode === Mode.DRAG_CANVAS ? 'canvas.dragstart' : 'canvas.dragstop', {
                    bubbles: false,
                    cancelable: true,
                }),
            );
        } else if (reason === UpdateReasons.CANCEL) {
            if (this.mode === Mode.DRAW) {
                this.controller.drawData.enabled = false;
                this.controller.drawData.redraw = undefined;
                Object.keys(this.views).forEach((view: string): void => {
                    this.views[view as keyof Views].scene.children[0].remove(this.cube[view as keyof Views]);
                });
            }
            this.mode = Mode.IDLE;
            this.dispatchEvent(new CustomEvent('canvas.canceled'));
        } else if (reason === UpdateReasons.FITTED_CANVAS) {
            this.dispatchEvent(new CustomEvent('canvas.fit'));
        }
    }

    private clearScene(): void {
        Object.keys(this.views).forEach((view: string): void => {
            this.views[view as keyof Views].scene.children = [];
        });
    }

    private clearSceneObjects(): void {
        Object.keys(this.views).forEach((view: string): void => {
            this.views[view as keyof Views].scene.children[0].children = [];
        });
    }

    private addScene(points: any): void {
        // eslint-disable-next-line no-param-reassign
        points.material.size = 0.08;
        points.material.color.set(new THREE.Color(0xffffff));
        const sphereCenter = points.geometry.boundingSphere.center;
        const { radius } = points.geometry.boundingSphere;
        if (!this.views.perspective.camera) return;
        const xRange = -radius / 2 < this.views.perspective.camera.position.x - sphereCenter.x
            && radius / 2 > this.views.perspective.camera.position.x - sphereCenter.x;
        const yRange = -radius / 2 < this.views.perspective.camera.position.y - sphereCenter.y
            && radius / 2 > this.views.perspective.camera.position.y - sphereCenter.y;
        const zRange = -radius / 2 < this.views.perspective.camera.position.z - sphereCenter.z
            && radius / 2 > this.views.perspective.camera.position.z - sphereCenter.z;
        let newX = 0;
        let newY = 0;
        let newZ = 0;
        if (!xRange) {
            newX = sphereCenter.x;
        }
        if (!yRange) {
            newY = sphereCenter.y;
        }
        if (!zRange) {
            newZ = sphereCenter.z;
        }
        if (newX || newY || newZ) {
            this.positionAllViews(newX, newY, newZ);
        }
        this.views.perspective.scene.add(points);
        // Setup TopView
        const canvasTopView = this.views.top.renderer.domElement;
        const topScenePlane = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(
                canvasTopView.offsetHeight,
                canvasTopView.offsetWidth,
                canvasTopView.offsetHeight,
                canvasTopView.offsetWidth,
            ),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                alphaTest: 0,
                visible: true,
                transparent: true,
                opacity: 0,
            }),
        );
        topScenePlane.position.set(0, 0, 0);
        topScenePlane.name = Planes.TOP;
        (topScenePlane.material as THREE.MeshBasicMaterial).side = THREE.DoubleSide;
        (topScenePlane as any).verticesNeedUpdate = true;
        this.views.top.scene.add(points.clone());
        this.views.top.scene.add(topScenePlane);
        // Setup Side View
        const canvasSideView = this.views.side.renderer.domElement;
        const sideScenePlane = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(
                canvasSideView.offsetHeight,
                canvasSideView.offsetWidth,
                canvasSideView.offsetHeight,
                canvasSideView.offsetWidth,
            ),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                alphaTest: 0,
                visible: true,
                transparent: true,
                opacity: 0,
            }),
        );
        sideScenePlane.position.set(0, 0, 0);
        sideScenePlane.rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);
        sideScenePlane.name = Planes.SIDE;
        (sideScenePlane.material as THREE.MeshBasicMaterial).side = THREE.DoubleSide;
        (sideScenePlane as any).verticesNeedUpdate = true;
        this.views.side.scene.add(points.clone());
        this.views.side.scene.add(sideScenePlane);
        // Setup front View
        const canvasFrontView = this.views.front.renderer.domElement;
        const frontScenePlane = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(
                canvasFrontView.offsetHeight,
                canvasFrontView.offsetWidth,
                canvasFrontView.offsetHeight,
                canvasFrontView.offsetWidth,
            ),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                alphaTest: 0,
                visible: true,
                transparent: true,
                opacity: 0,
            }),
        );
        frontScenePlane.position.set(0, 0, 0);
        frontScenePlane.rotation.set(0, Math.PI / 2, 0);
        frontScenePlane.name = Planes.FRONT;
        (frontScenePlane.material as THREE.MeshBasicMaterial).side = THREE.DoubleSide;
        (frontScenePlane as any).verticesNeedUpdate = true;
        this.views.front.scene.add(points.clone());
        this.views.front.scene.add(frontScenePlane);
        this.setupObjects();
    }

    private positionAllViews(x: number, y: number, z: number): void {
        if (
            this.views.perspective.controls
            && this.views.top.controls
            && this.views.side.controls
            && this.views.front.controls
        ) {
            this.views.perspective.controls.setLookAt(x - 8, y - 8, z + 3, x, y, z, false);
            this.views.top.controls.setLookAt(x, y, z + 8, x, y, z, false);
            this.views.side.controls.setLookAt(x, y + 8, z, x, y, z, false);
            this.views.front.controls.setLookAt(x + 8, y, z, x, y, z, false);
        }
    }

    private static resizeRendererToDisplaySize(viewName: string, view: RenderView): void {
        const { camera, renderer } = view;
        const canvas = renderer.domElement;
        if (!canvas.parentElement) return;
        const width = canvas.parentElement.clientWidth;
        const height = canvas.parentElement.clientHeight;
        const needResize = canvas.clientWidth !== width || canvas.clientHeight !== height;
        if (needResize && camera && view.camera) {
            if (camera instanceof THREE.PerspectiveCamera) {
                camera.aspect = width / height;
            } else {
                const topViewFactor = 0;
                const viewSize = CONST.ZOOM_FACTOR;
                const aspectRatio = width / height;
                if (!(camera instanceof THREE.PerspectiveCamera)) {
                    camera.left = (-aspectRatio * viewSize) / 2 - topViewFactor;
                    camera.right = (aspectRatio * viewSize) / 2 + topViewFactor;
                    camera.top = viewSize / 2 + topViewFactor;
                    camera.bottom = -viewSize / 2 - topViewFactor;
                }
                camera.near = -10;
                camera.far = 10;
            }
            view.renderer.setSize(width, height);
            view.camera.updateProjectionMatrix();
        }
    }

    private renderRayCaster = (viewType: RenderView): void => {
        viewType.rayCaster.renderer.setFromCamera(viewType.rayCaster.mouseVector, viewType.camera);
        if (this.mode === Mode.DRAW) {
            const intersects = this.views.perspective.rayCaster.renderer.intersectObjects(
                this.views.perspective.scene.children,
                false,
            );
            if (intersects.length > 0) {
                this.views.perspective.scene.children[0].add(this.cube.perspective);
                const newPoints = intersects[0].point;
                this.cube.perspective.position.copy(newPoints);
                this.views.perspective.renderer.domElement.style.cursor = 'default';
            }
        } else if (this.mode === Mode.IDLE) {
            const { children } = this.views.perspective.scene.children[0];
            const { renderer } = this.views.perspective.rayCaster;
            const intersects = renderer.intersectObjects(children, false);
            if (intersects.length !== 0) {
                const clientID = intersects[0].object.name;
                if (clientID === undefined || clientID === '' || this.model.data.focusData.clientID === clientID) {
                    return;
                }
                const object = this.views.perspective.scene.getObjectByName(clientID);
                if (object === undefined) return;
                this.model.data.focusData.clientID = clientID;
                ((object as THREE.Mesh).material as THREE.MeshBasicMaterial).color.set('#ffffff');
            } else if (this.model.data.focusData.clientID !== null) {
                try {
                    const object = this.views.perspective.scene.getObjectByName(this.model.data.focusData.clientID);
                    ((object as THREE.Mesh).material as THREE.MeshBasicMaterial).color.set(
                        (object as any).originalColor,
                    );
                    // eslint-disable-next-line no-empty
                } catch {}
                this.model.data.focusData.clientID = null;
            }
        }
    };

    public render(): void {
        Object.keys(this.views).forEach((view: string): void => {
            const viewType = this.views[view as keyof Views];
            if (!(viewType.controls && viewType.camera && viewType.rayCaster)) return;
            Canvas3dViewImpl.resizeRendererToDisplaySize(view, viewType);
            if (viewType.controls.enabled) {
                viewType.controls.update(this.clock.getDelta());
            } else {
                viewType.camera.updateProjectionMatrix();
            }
            viewType.renderer.render(viewType.scene, viewType.camera);
            if (view === ViewType.PERSPECTIVE && viewType.scene.children.length !== 0) {
                this.renderRayCaster(viewType);
            }
            if (this.controller.activeElement.clientID !== null && view !== ViewType.PERSPECTIVE) {
                viewType.rayCaster.renderer.setFromCamera(viewType.rayCaster.mouseVector, viewType.camera);
                // First Scan
                if (this.action.scan === view) {
                    if (!(this.action.translation.status || this.action.resize.status || this.action.rotation.status)) {
                        this.initiateAction(view, viewType);
                    }
                    // Action Operations
                    if (this.action.detected) {
                        if (this.action.translation.status) {
                            this.renderTranslateAction(view as ViewType, viewType);
                        } else if (this.action.resize.status) {
                            this.renderResizeAction(view as ViewType, viewType);
                        } else {
                            this.renderRotateAction(view as ViewType, viewType);
                        }
                    }
                }
            }
        });
    }

    private adjustPerspectiveCameras(): void {
        const coordinatesTop = this.model.data.selected.getReferenceCoordinates(ViewType.TOP);
        const sphericalTop = new THREE.Spherical();
        sphericalTop.setFromVector3(coordinatesTop);
        this.views.top.camera.position.setFromSpherical(sphericalTop);
        this.views.top.camera.updateProjectionMatrix();

        const coordinatesSide = this.model.data.selected.getReferenceCoordinates(ViewType.SIDE);
        const sphericalSide = new THREE.Spherical();
        sphericalSide.setFromVector3(coordinatesSide);
        this.views.side.camera.position.setFromSpherical(sphericalSide);
        this.views.side.camera.updateProjectionMatrix();

        const coordinatesFront = this.model.data.selected.getReferenceCoordinates(ViewType.FRONT);
        const sphericalFront = new THREE.Spherical();
        sphericalFront.setFromVector3(coordinatesFront);
        this.views.front.camera.position.setFromSpherical(sphericalFront);
        this.views.front.camera.updateProjectionMatrix();
    }

    private renderTranslateAction(view: ViewType, viewType: any): void {
        const intersects = viewType.rayCaster.renderer.intersectObjects(
            [viewType.scene.getObjectByName(`${view}Plane`)],
            true,
        );
        if (intersects.length !== 0 && intersects[0].point) {
            const coordinates = intersects[0].point;
            this.action.translation.coordinates = coordinates;
            this.moveObject(coordinates);
        }
    }

    private moveObject(coordinates: THREE.Vector3): void {
        const {
            perspective, top, side, front,
        } = this.model.data.selected;
        perspective.position.copy(coordinates.clone());
        top.position.copy(coordinates.clone());
        side.position.copy(coordinates.clone());
        front.position.copy(coordinates.clone());
    }

    private setSelectedChildScale(x: number, y: number, z: number): void {
        [ViewType.TOP, ViewType.SIDE, ViewType.SIDE].forEach((view: ViewType): void => {
            this.model.data.selected[view].children.forEach((element: any): void => {
                if (element.name !== CONST.CUBOID_EDGE_NAME) {
                    element.scale.set(
                        x == null ? element.scale.x : x,
                        y == null ? element.scale.y : y,
                        z == null ? element.scale.z : z,
                    );
                }
            });
        });
    }

    private renderResizeAction(view: ViewType, viewType: any): void {
        const intersects = viewType.rayCaster.renderer.intersectObjects(
            [viewType.scene.getObjectByName(`${view}Plane`)],
            true,
        );
        // Return if no intersection with the reference plane
        if (intersects.length === 0) return;
        const { x: scaleInitX, y: scaleInitY, z: scaleInitZ } = this.action.resize.initScales;
        const { x: scaleMemX, y: scaleMemY, z: scaleMemZ } = this.action.resize.memScales;
        const { x: initPosX, y: initPosY } = this.action.resize.helper;
        const { x: currentPosX, y: currentPosY } = viewType.rayCaster.mouseVector;
        const { resizeVector } = this.action.resize;
        switch (view) {
            case ViewType.TOP: {
                let y = scaleInitX * (currentPosX / initPosX);
                let x = scaleInitY * (currentPosY / initPosY);
                if (x < 0) x = 0.2;
                if (y < 0) y = 0.2;
                this.model.data.selected.setScale(y, x, this.model.data.selected.top.scale.z);
                this.setSelectedChildScale(1 / y, 1 / x, null);
                const differenceX = y / 2 - scaleMemX / 2;
                const differenceY = x / 2 - scaleMemY / 2;

                const differenceOpX = (currentPosX > 0 && currentPosY < 0) || (currentPosX > 0 && currentPosY > 0);
                const differenceOpY = (currentPosX < 0 && currentPosY < 0) || (currentPosX < 0 && currentPosY > 0);

                resizeVector.x += differenceOpX ? differenceX : -differenceX;
                resizeVector.y += differenceOpY ? differenceY : -differenceY;

                this.action.resize.memScales.x = y;
                this.action.resize.memScales.y = x;
                break;
            }
            case ViewType.SIDE: {
                let x = scaleInitX * (currentPosX / initPosX);
                let z = scaleInitZ * (currentPosY / initPosY);
                if (x < 0) x = 0.2;
                if (z < 0) z = 0.2;
                this.model.data.selected.setScale(x, this.model.data.selected.top.scale.y, z);
                this.setSelectedChildScale(1 / x, null, 1 / z);
                const differenceX = x / 2 - scaleMemX / 2;
                const differenceY = z / 2 - scaleMemZ / 2;

                if (currentPosX > 0 && currentPosY < 0) {
                    resizeVector.x += differenceX;
                    resizeVector.y -= differenceY;
                } else if (currentPosX > 0 && currentPosY > 0) {
                    resizeVector.x += differenceX;
                    resizeVector.y += differenceY;
                } else if (currentPosX < 0 && currentPosY < 0) {
                    resizeVector.x -= differenceX;
                    resizeVector.y -= differenceY;
                } else if (currentPosX < 0 && currentPosY > 0) {
                    resizeVector.x -= differenceX;
                    resizeVector.y += differenceY;
                }

                this.action.resize.memScales = { ...this.action.resize.memScales, x, z };
                break;
            }
            case ViewType.FRONT: {
                let y = scaleInitY * (currentPosX / initPosX);
                let z = scaleInitZ * (currentPosY / initPosY);
                if (y < 0) y = 0.2;
                if (z < 0) z = 0.2;
                this.model.data.selected.setScale(this.model.data.selected.top.scale.x, y, z);
                this.setSelectedChildScale(null, 1 / y, 1 / z);
                const differenceX = z / 2 - scaleMemY / 2;
                const differenceY = y / 2 - scaleMemZ / 2;

                if (currentPosX > 0 && currentPosY < 0) {
                    resizeVector.x += differenceX;
                    resizeVector.y += differenceY;
                } else if (currentPosX > 0 && currentPosY > 0) {
                    resizeVector.x -= differenceX;
                    resizeVector.y += differenceY;
                } else if (currentPosX < 0 && currentPosY < 0) {
                    resizeVector.x += differenceX;
                    resizeVector.y -= differenceY;
                } else if (currentPosX < 0 && currentPosY > 0) {
                    resizeVector.x -= differenceX;
                    resizeVector.y -= differenceY;
                }

                this.action.resize.memScales.y = z;
                this.action.resize.memScales.z = y;
                break;
            }
            default:
        }
        const coordinates = resizeVector.clone();
        intersects[0].object.localToWorld(coordinates);
        this.moveObject(coordinates);
        this.adjustPerspectiveCameras();
    }

    private static isLeft(a: any, b: any, c: any): boolean {
        // For reference
        // A
        // |\                // A = Rotation Center
        // | \               // B = Previous Frame Position
        // |  C              // C = Current Frame Position
        // B
        return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) > 0;
    }

    private rotateCube(instance: CuboidModel, direction: number, view: ViewType): void {
        switch (view) {
            case ViewType.TOP:
                instance.perspective.rotateZ(direction);
                instance.top.rotateZ(direction);
                instance.side.rotateZ(direction);
                instance.front.rotateZ(direction);
                this.rotateCamera(direction, view);
                break;
            case ViewType.FRONT:
                instance.perspective.rotateX(direction);
                instance.top.rotateX(direction);
                instance.side.rotateX(direction);
                instance.front.rotateX(direction);
                this.rotateCamera(direction, view);
                break;
            case ViewType.SIDE:
                instance.perspective.rotateY(direction);
                instance.top.rotateY(direction);
                instance.side.rotateY(direction);
                instance.front.rotateY(direction);
                this.rotateCamera(direction, view);
                break;
            default:
        }
    }

    private rotateCamera(direction: any, view: ViewType): void {
        switch (view) {
            case ViewType.TOP:
                this.views.top.camera.rotateZ(direction);
                break;
            case ViewType.FRONT:
                this.views.front.camera.rotateZ(direction);
                break;
            case ViewType.SIDE:
                this.views.side.camera.rotateZ(direction);
                break;
            default:
        }
    }

    private attachCamera(view: ViewType): void {
        switch (view) {
            case ViewType.TOP:
                this.model.data.selected.side.attach(this.views.side.camera);
                this.model.data.selected.front.attach(this.views.front.camera);
                break;
            case ViewType.SIDE:
                this.model.data.selected.front.attach(this.views.front.camera);
                this.model.data.selected.top.attach(this.views.top.camera);
                break;
            case ViewType.FRONT:
                this.model.data.selected.side.attach(this.views.side.camera);
                this.model.data.selected.top.attach(this.views.top.camera);
                break;
            default:
        }
    }

    private detachCamera(view: ViewType): void {
        const coordTop = this.model.data.selected.getReferenceCoordinates(ViewType.TOP);
        const sphericaltop = new THREE.Spherical();
        sphericaltop.setFromVector3(coordTop);

        const coordSide = this.model.data.selected.getReferenceCoordinates(ViewType.SIDE);
        const sphericalside = new THREE.Spherical();
        sphericalside.setFromVector3(coordSide);

        const coordFront = this.model.data.selected.getReferenceCoordinates(ViewType.FRONT);
        const sphericalfront = new THREE.Spherical();
        sphericalfront.setFromVector3(coordFront);

        const { side: objectSideView, front: objectFrontView, top: objectTopView } = this.model.data.selected;
        const { camera: sideCamera } = this.views.side;
        const { camera: frontCamera } = this.views.front;
        const { camera: topCamera } = this.views.top;

        switch (view) {
            case ViewType.TOP: {
                const camRotationSide = objectSideView
                    .getObjectByName('cameraSide')
                    .getWorldQuaternion(new THREE.Quaternion());
                objectSideView.remove(sideCamera);
                sideCamera.position.setFromSpherical(sphericalside);
                sideCamera.lookAt(objectSideView.position.x, objectSideView.position.y, objectSideView.position.z);
                sideCamera.setRotationFromQuaternion(camRotationSide);
                sideCamera.scale.set(1, 1, 1);

                const camRotationFront = objectFrontView
                    .getObjectByName('cameraFront')
                    .getWorldQuaternion(new THREE.Quaternion());
                objectFrontView.remove(frontCamera);
                frontCamera.position.setFromSpherical(sphericalfront);
                frontCamera.lookAt(objectFrontView.position.x, objectFrontView.position.y, objectFrontView.position.z);
                frontCamera.setRotationFromQuaternion(camRotationFront);
                frontCamera.scale.set(1, 1, 1);
                break;
            }
            case ViewType.SIDE: {
                const camRotationFront = objectFrontView
                    .getObjectByName('cameraFront')
                    .getWorldQuaternion(new THREE.Quaternion());
                objectFrontView.remove(frontCamera);
                frontCamera.position.setFromSpherical(sphericalfront);
                frontCamera.lookAt(objectFrontView.position.x, objectFrontView.position.y, objectFrontView.position.z);
                frontCamera.setRotationFromQuaternion(camRotationFront);
                frontCamera.scale.set(1, 1, 1);

                objectTopView.remove(topCamera);
                topCamera.position.setFromSpherical(sphericaltop);
                topCamera.lookAt(objectTopView.position.x, objectTopView.position.y, objectTopView.position.z);
                topCamera.setRotationFromEuler(objectTopView.rotation);
                topCamera.scale.set(1, 1, 1);
                break;
            }
            case ViewType.FRONT: {
                const camRotationSide = objectSideView
                    .getObjectByName('cameraSide')
                    .getWorldQuaternion(new THREE.Quaternion());
                objectSideView.remove(sideCamera);
                sideCamera.position.setFromSpherical(sphericalside);
                sideCamera.lookAt(objectSideView.position.x, objectSideView.position.y, objectSideView.position.z);
                sideCamera.setRotationFromQuaternion(camRotationSide);
                sideCamera.scale.set(1, 1, 1);

                objectTopView.remove(topCamera);
                topCamera.position.setFromSpherical(sphericaltop);
                topCamera.lookAt(objectTopView.position.x, objectTopView.position.y, objectTopView.position.z);
                topCamera.setRotationFromEuler(objectTopView.rotation);
                topCamera.scale.set(1, 1, 1);
                break;
            }
            default: {
                sideCamera.position.setFromSpherical(sphericalside);
                sideCamera.lookAt(objectSideView.position.x, objectSideView.position.y, objectSideView.position.z);
                sideCamera.rotation.z = this.views.side.scene.getObjectByName(Planes.SIDE).rotation.z;
                sideCamera.scale.set(1, 1, 1);

                topCamera.position.setFromSpherical(sphericaltop);
                topCamera.lookAt(objectTopView.position.x, objectTopView.position.y, objectTopView.position.z);
                topCamera.setRotationFromEuler(objectTopView.rotation);
                topCamera.scale.set(1, 1, 1);

                frontCamera.position.setFromSpherical(sphericalfront);
                frontCamera.lookAt(objectFrontView.position.x, objectFrontView.position.y, objectFrontView.position.z);
                frontCamera.rotation.z = this.views.front.scene.getObjectByName(Planes.FRONT).rotation.x;
                frontCamera.scale.set(1, 1, 1);
            }
        }
    }

    private rotatePlane(direction: number, view: ViewType): void {
        const sceneTopPlane = this.views.top.scene.getObjectByName(Planes.TOP);
        const sceneSidePlane = this.views.side.scene.getObjectByName(Planes.SIDE);
        const sceneFrontPlane = this.views.front.scene.getObjectByName(Planes.FRONT);
        switch (view) {
            case ViewType.TOP:
                sceneTopPlane.rotateZ(direction);
                sceneSidePlane.rotateY(direction);
                sceneFrontPlane.rotateX(-direction);
                break;
            case ViewType.SIDE:
                sceneTopPlane.rotateY(direction);
                sceneSidePlane.rotateZ(direction);
                sceneFrontPlane.rotateY(direction);
                break;
            case ViewType.FRONT:
                sceneTopPlane.rotateX(direction);
                sceneSidePlane.rotateX(-direction);
                sceneFrontPlane.rotateZ(direction);
                break;
            default: {
                const { top: objectTopView, side: objectSideView, front: objectFrontView } = this.model.data.selected;
                objectTopView.add(sceneTopPlane);
                objectSideView.add(sceneSidePlane);
                objectFrontView.add(sceneFrontPlane);
                objectTopView.getObjectByName(Planes.TOP).rotation.set(0, 0, 0);
                objectSideView.getObjectByName(Planes.SIDE).rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);
                objectFrontView.getObjectByName(Planes.FRONT).rotation.set(0, Math.PI / 2, 0);

                const quaternionSide = new THREE.Quaternion();
                objectSideView.getObjectByName(Planes.SIDE).getWorldQuaternion(quaternionSide);
                const rotationSide = new THREE.Euler();
                rotationSide.setFromQuaternion(quaternionSide);

                const quaternionFront = new THREE.Quaternion();
                objectFrontView.getObjectByName(Planes.FRONT).getWorldQuaternion(quaternionFront);
                const rotationFront = new THREE.Euler();
                rotationFront.setFromQuaternion(quaternionFront);

                const quaternionTop = new THREE.Quaternion();
                objectTopView.getObjectByName(Planes.TOP).getWorldQuaternion(quaternionTop);
                const rotationTop = new THREE.Euler();
                rotationTop.setFromQuaternion(quaternionTop);

                objectTopView.remove(sceneTopPlane);
                objectSideView.remove(sceneSidePlane);
                objectFrontView.remove(sceneFrontPlane);

                const canvasTopView = this.views.top.renderer.domElement;
                const planeTop = new THREE.Mesh(
                    new THREE.PlaneBufferGeometry(
                        canvasTopView.offsetHeight,
                        canvasTopView.offsetWidth,
                        canvasTopView.offsetHeight,
                        canvasTopView.offsetWidth,
                    ),
                    new THREE.MeshBasicMaterial({
                        color: 0xff0000,
                        alphaTest: 0,
                        visible: false,
                        transparent: true,
                        opacity: 0.1,
                    }),
                );
                planeTop.name = Planes.TOP;
                (planeTop.material as THREE.MeshBasicMaterial).side = THREE.DoubleSide;

                const canvasSideView = this.views.side.renderer.domElement;
                const planeSide = new THREE.Mesh(
                    new THREE.PlaneBufferGeometry(
                        canvasSideView.offsetHeight,
                        canvasSideView.offsetWidth,
                        canvasSideView.offsetHeight,
                        canvasSideView.offsetWidth,
                    ),
                    new THREE.MeshBasicMaterial({
                        color: 0x00ff00,
                        alphaTest: 0,
                        visible: false,
                        transparent: true,
                        opacity: 0.1,
                    }),
                );
                planeSide.name = Planes.SIDE;
                (planeSide.material as THREE.MeshBasicMaterial).side = THREE.DoubleSide;

                const canvasFrontView = this.views.front.renderer.domElement;
                const planeFront = new THREE.Mesh(
                    new THREE.PlaneBufferGeometry(
                        canvasFrontView.offsetHeight,
                        canvasFrontView.offsetWidth,
                        canvasFrontView.offsetHeight,
                        canvasFrontView.offsetWidth,
                    ),
                    new THREE.MeshBasicMaterial({
                        color: 0x0000ff,
                        alphaTest: 0,
                        visible: false,
                        transparent: true,
                        opacity: 0.5,
                    }),
                );
                planeFront.name = Planes.FRONT;
                (planeFront.material as THREE.MeshBasicMaterial).side = THREE.DoubleSide;

                const coordinates = {
                    x: objectTopView.position.x,
                    y: objectTopView.position.y,
                    z: objectTopView.position.z,
                };

                planeTop.rotation.set(rotationTop.x, rotationTop.y, rotationTop.z);
                planeSide.rotation.set(rotationSide.x, rotationSide.y, rotationSide.z);
                planeFront.rotation.set(rotationFront.x, rotationFront.y, rotationFront.z);
                this.views.top.scene.add(planeTop);
                this.views.side.scene.add(planeSide);
                this.views.front.scene.add(planeFront);

                this.translateReferencePlane(coordinates);
            }
        }
    }

    private renderRotateAction(view: ViewType, viewType: any): void {
        const rotationSpeed = Math.PI / CONST.ROTATION_SPEED;
        const { renderer } = viewType;
        const canvas = renderer.domElement;
        if (!canvas) return;
        const canvasCentre = {
            x: canvas.offsetLeft + canvas.offsetWidth / 2,
            y: canvas.offsetTop + canvas.offsetHeight / 2,
        };
        if (
            this.action.rotation.screenInit.x === this.action.rotation.screenMove.x
            && this.action.rotation.screenInit.y === this.action.rotation.screenMove.y
        ) {
            return;
        }
        if (Canvas3dViewImpl.isLeft(canvasCentre, this.action.rotation.screenInit, this.action.rotation.screenMove)) {
            this.rotateCube(this.model.data.selected, -rotationSpeed, view);
            this.rotatePlane(-rotationSpeed, view);
        } else {
            this.rotateCube(this.model.data.selected, rotationSpeed, view);
            this.rotatePlane(rotationSpeed, view);
        }
        this.action.rotation.helper.x = this.action.rotation.screenMove.x;
        this.action.rotation.helper.y = this.action.rotation.screenMove.y;
    }

    private initiateAction(view: string, viewType: any): void {
        const intersectsHelperResize = viewType.rayCaster.renderer.intersectObjects(
            this.model.data.selected[view].userData.resizeHelpers,
            false,
        );

        if (intersectsHelperResize.length !== 0) {
            this.action.resize.helper = viewType.rayCaster.mouseVector.clone();
            this.action.resize.status = true;
            this.action.detected = true;
            this.views.top.controls.enabled = false;
            this.views.side.controls.enabled = false;
            this.views.front.controls.enabled = false;
            const { x, y, z } = this.model.data.selected[view].scale;
            this.action.resize.initScales = { x, y, z };
            this.action.resize.memScales = { x, y, z };
            this.action.resize.resizeVector = new THREE.Vector3(0, 0, 0);
            return;
        }
        const intersectsHelperRotation = viewType.rayCaster.renderer.intersectObjects(
            [this.model.data.selected[view].getObjectByName('rotationHelper')],
            false,
        );
        if (intersectsHelperRotation.length !== 0) {
            this.action.rotation.helper = viewType.rayCaster.mouseVector.clone();
            this.action.rotation.status = true;
            this.action.detected = true;
            this.views.top.controls.enabled = false;
            this.views.side.controls.enabled = false;
            this.views.front.controls.enabled = false;
            this.attachCamera(view as ViewType);
            return;
        }
        const intersectsBox = viewType.rayCaster.renderer.intersectObjects([this.model.data.selected[view]], false);
        if (intersectsBox.length !== 0) {
            this.action.translation.helper = viewType.rayCaster.mouseVector.clone();
            this.action.translation.status = true;
            this.action.detected = true;
            this.views.top.controls.enabled = false;
            this.views.side.controls.enabled = false;
            this.views.front.controls.enabled = false;
        }
    }

    public keyControls(key: any): void {
        const { controls } = this.views.perspective;
        if (!controls) return;
        switch (key.code) {
            case CameraAction.ROTATE_RIGHT:
                controls.rotate(0.1 * THREE.MathUtils.DEG2RAD * this.speed, 0, true);
                break;
            case CameraAction.ROTATE_LEFT:
                controls.rotate(-0.1 * THREE.MathUtils.DEG2RAD * this.speed, 0, true);
                break;
            case CameraAction.TILT_UP:
                controls.rotate(0, -0.05 * THREE.MathUtils.DEG2RAD * this.speed, true);
                break;
            case CameraAction.TILT_DOWN:
                controls.rotate(0, 0.05 * THREE.MathUtils.DEG2RAD * this.speed, true);
                break;
            default:
                break;
        }
        if (key.altKey === true) {
            switch (key.code) {
                case CameraAction.ZOOM_IN:
                    controls.dolly(CONST.DOLLY_FACTOR, true);
                    break;
                case CameraAction.ZOOM_OUT:
                    controls.dolly(-CONST.DOLLY_FACTOR, true);
                    break;
                case CameraAction.MOVE_LEFT:
                    controls.truck(-0.01 * this.speed, 0, true);
                    break;
                case CameraAction.MOVE_RIGHT:
                    controls.truck(0.01 * this.speed, 0, true);
                    break;
                case CameraAction.MOVE_DOWN:
                    controls.truck(0, -0.01 * this.speed, true);
                    break;
                case CameraAction.MOVE_UP:
                    controls.truck(0, 0.01 * this.speed, true);
                    break;
                default:
                    break;
            }
        }
    }

    public html(): ViewsDOM {
        return {
            perspective: this.views.perspective.renderer.domElement,
            top: this.views.top.renderer.domElement,
            side: this.views.side.renderer.domElement,
            front: this.views.front.renderer.domElement,
        };
    }
}
