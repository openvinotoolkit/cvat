// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { connect } from 'react-redux';

import { TreeNodeNormal } from 'antd/lib/tree/Tree';
import FileManagerComponent, { Files } from 'components/file-manager/file-manager';

import { loadShareDataAsync } from 'actions/share-actions';
import { ShareItem, CombinedState, ClowderFileDto } from 'reducers/interfaces';

interface OwnProps {
    ref: any;
    withRemote: boolean;
    onChangeActiveKey(key: string): void;
}

interface StateToProps {
    treeData: TreeNodeNormal[];
    clowderFiles: ClowderFileDto[];
}

interface DispatchToProps {
    getTreeData(key: string, success: () => void, failure: () => void): void;
}

function mapStateToProps(state: CombinedState): StateToProps {
    function convert(items: ShareItem[], path?: string): TreeNodeNormal[] {
        return items.map(
            (item): TreeNodeNormal => {
                const isLeaf = item.type !== 'DIR';
                const key = `${path}${item.name}${isLeaf ? '' : '/'}`;
                return {
                    key,
                    isLeaf,
                    title: item.name || 'root',
                    children: convert(item.children, key),
                };
            },
        );
    }

    const { root } = state.share;
    const { filesToUpload } = state.clowder;
    return {
        treeData: convert([root], ''),
        clowderFiles: filesToUpload,
    };
}

function mapDispatchToProps(dispatch: any): DispatchToProps {
    return {
        getTreeData: (key: string, success: () => void, failure: () => void): void => {
            dispatch(loadShareDataAsync(key, success, failure));
        },
    };
}

type Props = StateToProps & DispatchToProps & OwnProps;

export class FileManagerContainer extends React.PureComponent<Props> {
    private managerComponentRef: any;

    public getFiles(): Files {
        return this.managerComponentRef.getFiles();
    }

    public reset(): Files {
        return this.managerComponentRef.reset();
    }

    public render(): JSX.Element {
        const {
            treeData, clowderFiles, getTreeData, withRemote, onChangeActiveKey,
        } = this.props;

        return (
            <FileManagerComponent
                treeData={treeData}
                clowderFiles={clowderFiles}
                onLoadData={getTreeData}
                onChangeActiveKey={onChangeActiveKey}
                withRemote={withRemote}
                ref={(component): void => {
                    this.managerComponentRef = component;
                }}
            />
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(FileManagerContainer);
