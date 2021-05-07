// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { Col } from 'antd/lib/grid';
import Icon from '@ant-design/icons';
import Modal from 'antd/lib/modal';
import Button from 'antd/lib/button';
import Timeline from 'antd/lib/timeline';
import Dropdown from 'antd/lib/dropdown';

import AnnotationMenuContainer from 'containers/annotation-page/top-bar/annotation-menu';
import { MainMenuIcon, SaveIcon, UndoIcon, RedoIcon, ClowderSyncIcon } from 'icons';

interface Props {
    saving: boolean;
    savingStatuses: string[];
    undoAction?: string;
    redoAction?: string;
    saveShortcut: string;
    undoShortcut: string;
    redoShortcut: string;
    onSaveAnnotation(): void;
    onClowderSync(): void;
    onUndoClick(): void;
    onRedoClick(): void;
}

function LeftGroup(props: Props): JSX.Element {
    const {
        saving,
        savingStatuses,
        undoAction,
        redoAction,
        saveShortcut,
        undoShortcut,
        redoShortcut,
        onSaveAnnotation,
        onClowderSync,
        onUndoClick,
        onRedoClick,
    } = props;

    return (
        <Col className='cvat-annotation-header-left-group'>
            <Dropdown overlay={<AnnotationMenuContainer />}>
                <Button type='link' className='cvat-annotation-header-button'>
                    <Icon component={MainMenuIcon} />
                    Menu
                </Button>
            </Dropdown>
            <Button
                title={`Save current changes ${saveShortcut}`}
                onClick={saving ? undefined : onSaveAnnotation}
                type='link'
                className={saving ? 'cvat-annotation-disabled-header-button' : 'cvat-annotation-header-button'}
            >
                <Icon component={SaveIcon} />
                {saving ? 'Saving...' : 'Save'}
                <Modal title='Saving changes on the server' visible={saving} footer={[]} closable={false}>
                    <Timeline pending={savingStatuses[savingStatuses.length - 1] || 'Pending..'}>
                        {savingStatuses.slice(0, -1).map((status: string, id: number) => (
                            <Timeline.Item key={id}>{status}</Timeline.Item>
                        ))}
                    </Timeline>
                </Modal>
            </Button>
            <Button
                title='Export annotations to clowder'
                type='link'
                className='cvat-annotation-header-button'
                onClick={onClowderSync}
            >
                <Icon component={ClowderSyncIcon} />
                <span>Clowder Sync</span>
            </Button>
            <Button
                title={`Undo: ${undoAction} ${undoShortcut}`}
                disabled={!undoAction}
                style={{ pointerEvents: undoAction ? 'initial' : 'none', opacity: undoAction ? 1 : 0.5 }}
                type='link'
                className='cvat-annotation-header-button'
                onClick={onUndoClick}
            >
                <Icon component={UndoIcon} />
                <span>Undo</span>
            </Button>
            <Button
                title={`Redo: ${redoAction} ${redoShortcut}`}
                disabled={!redoAction}
                style={{ pointerEvents: redoAction ? 'initial' : 'none', opacity: redoAction ? 1 : 0.5 }}
                type='link'
                className='cvat-annotation-header-button'
                onClick={onRedoClick}
            >
                <Icon component={RedoIcon} />
                Redo
            </Button>
        </Col>
    );
}

export default React.memo(LeftGroup);
