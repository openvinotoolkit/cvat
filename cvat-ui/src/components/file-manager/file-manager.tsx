// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import React, { ReactText } from 'react';
import Tabs from 'antd/lib/tabs';
import Input from 'antd/lib/input';
import Text from 'antd/lib/typography/Text';
import Paragraph from 'antd/lib/typography/Paragraph';
import Upload, { RcFile } from 'antd/lib/upload';
import Empty from 'antd/lib/empty';
import Tree, { TreeNodeNormal } from 'antd/lib/tree/Tree';
// eslint-disable-next-line import/no-extraneous-dependencies
import { EventDataNode } from 'rc-tree/lib/interface';
import { InboxOutlined } from '@ant-design/icons';

import consts from 'consts';
import { ClowderFileDto } from 'reducers/interfaces';
import ClowderSyncTab from './clowder-sync-tab/clowder-sync-tab';

export interface Files {
    local: File[];
    share: string[];
    remote: string[];
    clowder?: ClowderFileDto[];
}

interface State {
    files: Files;
    expandedKeys: string[];
    active: 'local' | 'share' | 'remote' | 'clowder';
}

interface Props {
    withRemote: boolean;
    treeData: TreeNodeNormal[];
    clowderFiles: ClowderFileDto[];
    onLoadData: (key: string, success: () => void, failure: () => void) => void;
    onChangeActiveKey(key: string): void;
}

export default class FileManager extends React.PureComponent<Props, State> {
    public constructor(props: Props) {
        super(props);

        this.state = {
            files: {
                local: [],
                share: [],
                remote: [],
            },
            expandedKeys: [],
            active: 'local',
        };

        this.loadData('/');
    }

    public getFiles(): Files {
        const { active, files } = this.state;
        const { clowderFiles } = this.props;
        return {
            local: active === 'local' ? files.local : [],
            share: active === 'share' ? files.share : [],
            remote: active === 'remote' ? files.remote : [],
            clowder: active === 'clowder' ? clowderFiles : [],
        };
    }

    private loadData = (key: string): Promise<void> =>
        new Promise<void>((resolve, reject): void => {
            const { onLoadData } = this.props;

            const success = (): void => resolve();
            const failure = (): void => reject();
            onLoadData(key, success, failure);
        });

    public reset(): void {
        this.setState({
            expandedKeys: [],
            active: 'local',
            files: {
                local: [],
                share: [],
                remote: [],
            },
        });
    }

    private renderLocalSelector(): JSX.Element {
        const { files } = this.state;

        return (
            <Tabs.TabPane className='cvat-file-manager-local-tab' key='local' tab='My computer'>
                <Upload.Dragger
                    multiple
                    listType='text'
                    fileList={files.local as any[]}
                    showUploadList={
                        files.local.length < 5 && {
                            showRemoveIcon: false,
                        }
                    }
                    beforeUpload={(_: RcFile, newLocalFiles: RcFile[]): boolean => {
                        this.setState({
                            files: {
                                ...files,
                                local: newLocalFiles,
                            },
                        });
                        return false;
                    }}
                >
                    <p className='ant-upload-drag-icon'>
                        <InboxOutlined />
                    </p>
                    <p className='ant-upload-text'>Click or drag files to this area</p>
                    <p className='ant-upload-hint'>Support for a bulk images or a single video</p>
                </Upload.Dragger>
                {files.local.length >= 5 && (
                    <>
                        <br />
                        <Text className='cvat-text-color'>{`${files.local.length} files selected`}</Text>
                    </>
                )}
            </Tabs.TabPane>
        );
    }

    private renderShareSelector(): JSX.Element {
        function renderTreeNodes(data: TreeNodeNormal[]): JSX.Element[] {
            // sort alphabetically
            data.sort((a: TreeNodeNormal, b: TreeNodeNormal): number =>
                a.key.toLocaleString().localeCompare(b.key.toLocaleString()),
            );
            return data.map((item: TreeNodeNormal) => {
                if (item.children) {
                    return (
                        <Tree.TreeNode title={item.title} key={item.key} data={item} isLeaf={item.isLeaf}>
                            {renderTreeNodes(item.children)}
                        </Tree.TreeNode>
                    );
                }

                return <Tree.TreeNode {...item} key={item.key} data={item} />;
            });
        }

        const { SHARE_MOUNT_GUIDE_URL } = consts;
        const { treeData } = this.props;
        const { expandedKeys, files } = this.state;

        return (
            <Tabs.TabPane key='share' tab='Connected file share'>
                {treeData[0].children && treeData[0].children.length ? (
                    <Tree
                        className='cvat-share-tree'
                        checkable
                        showLine
                        height={256}
                        checkStrictly={false}
                        expandedKeys={expandedKeys}
                        checkedKeys={files.share}
                        loadData={(event: EventDataNode): Promise<void> => this.loadData(event.key.toLocaleString())}
                        onExpand={(newExpandedKeys: ReactText[]): void => {
                            this.setState({
                                expandedKeys: newExpandedKeys.map((text: ReactText): string => text.toLocaleString()),
                            });
                        }}
                        onCheck={(
                            checkedKeys:
                                | ReactText[]
                                | {
                                      checked: ReactText[];
                                      halfChecked: ReactText[];
                                  },
                        ): void => {
                            const keys = (checkedKeys as ReactText[]).map((text: ReactText): string =>
                                text.toLocaleString(),
                            );
                            this.setState({
                                files: {
                                    ...files,
                                    share: keys,
                                },
                            });
                        }}
                    >
                        {renderTreeNodes(treeData)}
                    </Tree>
                ) : (
                    <div className='cvat-empty-share-tree'>
                        <Empty />
                        <Paragraph className='cvat-text-color'>
                            Please, be sure you had
                            <Text strong>
                                <a href={SHARE_MOUNT_GUIDE_URL}> mounted </a>
                            </Text>
                            share before you built CVAT and the shared storage contains files
                        </Paragraph>
                    </div>
                )}
            </Tabs.TabPane>
        );
    }

    private renderRemoteSelector(): JSX.Element {
        const { files } = this.state;

        return (
            <Tabs.TabPane key='remote' tab='Remote sources'>
                <Input.TextArea
                    className='cvat-file-selector-remote'
                    placeholder='Enter one URL per line'
                    rows={6}
                    value={[...files.remote].join('\n')}
                    onChange={(event: React.ChangeEvent<HTMLTextAreaElement>): void => {
                        this.setState({
                            files: {
                                ...files,
                                remote: event.target.value.split('\n'),
                            },
                        });
                    }}
                />
            </Tabs.TabPane>
        );
    }

    public render(): JSX.Element {
        const { withRemote, onChangeActiveKey } = this.props;
        const { active } = this.state;

        return (
            <>
                <Tabs
                    type='card'
                    activeKey={active}
                    tabBarGutter={5}
                    onChange={(activeKey: string): void => {
                        onChangeActiveKey(activeKey);
                        this.setState({
                            active: activeKey as any,
                        });
                    }}
                >
                    {this.renderLocalSelector()}
                    {this.renderShareSelector()}
                    {withRemote && this.renderRemoteSelector()}

                    <Tabs.TabPane key='clowder' tab='Clowder Sync'>
                        <ClowderSyncTab />
                    </Tabs.TabPane>
                </Tabs>
            </>
        );
    }
}
