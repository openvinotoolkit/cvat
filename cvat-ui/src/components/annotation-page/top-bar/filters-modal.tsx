// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Builder, Config, ImmutableTree, JsonLogicTree, Query, Utils as QbUtils,
} from 'react-awesome-query-builder';
import AntdWidgets from 'react-awesome-query-builder/lib/components/widgets/antd';
import AntdConfig from 'react-awesome-query-builder/lib/config/antd';
import 'react-awesome-query-builder/lib/css/styles.css';
import { DownOutlined } from '@ant-design/icons';
import { Dropdown, Menu } from 'antd';
import Button from 'antd/lib/button';
import Modal from 'antd/lib/modal';
import { omit } from 'lodash';

import { CombinedState } from 'reducers/interfaces';
import { changeAnnotationsFilters, fetchAnnotationsAsync, showFilters } from 'actions/annotation-actions';

const { FieldDropdown } = AntdWidgets;

const FILTERS_HISTORY = 'filtersHistory';

interface Props {
    visible: boolean;
}

interface StoredFilter {
    id: string;
    logic: JsonLogicTree;
}

export default function FiltersModalComponent(props: Props): JSX.Element {
    const { visible } = props;
    const { labels } = useSelector((state: CombinedState) => state.annotation.job);
    const { filters: activeFilters } = useSelector((state: CombinedState) => state.annotation.annotations);

    const getConvertedInputType = (inputType: string): string => {
        switch (inputType) {
            case 'checkbox':
                return 'boolean';
            case 'radio':
                return 'select';
            default:
                return inputType;
        }
    };

    const getAttributesSubfields = (): Record<string, any> => {
        const subfields: Record<string, any> = {};
        labels.forEach((label: any): void => {
            subfields[label.name] = {
                type: '!struct', // nested complex field
                label: label.name,
                subfields: {},
            };

            const labelSubfields = subfields[label.name].subfields;
            label.attributes.forEach((attr: any): void => {
                labelSubfields[attr.name] = {
                    label: attr.name,
                    type: getConvertedInputType(attr.inputType),
                };
                if (labelSubfields[attr.name].type === 'select') {
                    labelSubfields[attr.name] = {
                        ...labelSubfields[attr.name],
                        fieldSettings: {
                            listValues: attr.values,
                        },
                    };
                }
            });
        });

        return subfields;
    };

    const config: Config = {
        ...AntdConfig,
        fields: {
            label: {
                label: 'Label',
                type: 'select',
                valueSources: ['value'],
                fieldSettings: {
                    listValues: labels.map((label: any) => label.name),
                },
            },
            type: {
                label: 'Type',
                type: 'select',
                fieldSettings: {
                    listValues: [
                        { value: 'shape', title: 'Shape' },
                        { value: 'track', title: 'Track' },
                        { value: 'tag', title: 'Tag' },
                    ],
                },
            },
            shape: {
                label: 'Shape',
                type: 'select',
                fieldSettings: {
                    listValues: [
                        { value: 'rectangle', title: 'Rectangle' },
                        { value: 'points', title: 'Points' },
                        { value: 'polyline', title: 'Polyline' },
                        { value: 'polygon', title: 'Polygon' },
                        { value: 'cuboids', title: 'Cuboids' },
                    ],
                },
            },
            occluded: {
                label: 'Occluded',
                type: 'boolean',
            },
            width: {
                label: 'Width',
                type: 'number',
                fieldSettings: { min: 0 },
            },
            height: {
                label: 'Height',
                type: 'number',
                fieldSettings: { min: 0 },
            },
            clientID: {
                label: 'ObjectID',
                type: 'number',
                hideForCompare: true,
                fieldSettings: { min: 0 },
            },
            serverID: {
                label: 'ServerID',
                type: 'number',
                hideForCompare: true,
                fieldSettings: { min: 0 },
            },
            attr: {
                label: 'Attributes',
                type: '!struct',
                subfields: getAttributesSubfields(),
                fieldSettings: {
                    treeSelectOnlyLeafs: true,
                },
            },
        },
        settings: {
            ...AntdConfig.settings,
            renderField: (_props: any) => (
                <FieldDropdown {...omit(_props)} customProps={omit(_props.customProps, 'showSearch')} />
            ),
            // using FieldDropdown because we cannot use antd because of antd-related bugs
            // https://github.com/ukrbublik/react-awesome-query-builder/issues/224
        },
    };

    const initialState = {
        tree: QbUtils.checkTree(
            QbUtils.loadTree({ id: QbUtils.uuid(), type: 'group' }),
            config as Config,
        ) as ImmutableTree,
        config,
    };

    const dispatch = useDispatch();
    const [state, setState] = useState(initialState);
    const [filters, setFilters] = useState([] as StoredFilter[]);

    useEffect(() => {
        const filtersHistory = window.localStorage.getItem(FILTERS_HISTORY)?.trim() || '[]';
        try {
            setFilters(JSON.parse(filtersHistory));
        } catch (_) {
            setFilters([]);
        }
    }, []);

    useEffect(() => {
        window.localStorage.setItem(FILTERS_HISTORY, JSON.stringify(filters));
    }, [filters]);

    useEffect(() => {
        if (visible) {
            const treeFromActiveFilters = activeFilters.length ?
                QbUtils.checkTree(QbUtils.loadFromJsonLogic(activeFilters[0], config), config) :
                null;
            setState({
                tree: treeFromActiveFilters || initialState.tree,
                config,
            });
        }
    }, [visible]);

    const applyFilters = (filtersData: any[]): void => {
        dispatch(changeAnnotationsFilters(filtersData));
        dispatch(fetchAnnotationsAsync());
        dispatch(showFilters(false));
    };

    const confirmModal = (): void => {
        const currentFilter: StoredFilter = {
            id: QbUtils.uuid(),
            logic: QbUtils.jsonLogicFormat(state.tree, config).logic || {},
        };
        const updatedFilters = filters.filter(
            (filter) => JSON.stringify(filter.logic) !== JSON.stringify(currentFilter.logic),
        );
        setFilters([currentFilter, ...updatedFilters].slice(0, 10));
        applyFilters([QbUtils.jsonLogicFormat(state.tree, config).logic]);
    };

    const isModalConfirmable = (): boolean =>
        QbUtils.queryString(state.tree, config)?.trim().length > 0 && QbUtils.isValidTree(state.tree);

    const renderBuilder = (builderProps: any): JSX.Element => (
        <div className='query-builder-container'>
            <div className='query-builder qb-lite'>
                <Builder {...builderProps} />
            </div>
        </div>
    );

    const onChange = (tree: ImmutableTree): void => {
        setState({ tree, config });
    };

    const menu = (
        <Menu>
            {filters
                .filter((filter: StoredFilter) => {
                    const tree = QbUtils.loadFromJsonLogic(filter.logic, config);
                    return !!QbUtils.queryString(tree, config);
                })
                .map((filter: StoredFilter) => {
                    const tree = QbUtils.loadFromJsonLogic(filter.logic, config);
                    return (
                        <Menu.Item key={filter.id} onClick={() => setState({ tree, config })}>
                            {QbUtils.queryString(tree, config)}
                        </Menu.Item>
                    );
                })}
        </Menu>
    );

    return (
        <Modal
            className='cvat-filters-modal'
            visible={visible}
            closable={false}
            width={800}
            centered
            onCancel={() => dispatch(showFilters(false))}
            footer={[
                <Button key='clear' disabled={!activeFilters.length} onClick={() => applyFilters([])}>
                    Clear filters
                </Button>,
                <Button key='cancel' onClick={() => dispatch(showFilters(false))}>
                    Cancel
                </Button>,
                <Button key='submit' type='primary' disabled={!isModalConfirmable()} onClick={confirmModal}>
                    Submit
                </Button>,
            ]}
        >
            <div
                key='used'
                className='recently-used-wrapper'
                style={{ display: filters.length ? 'inline-block' : 'none' }}
            >
                <Dropdown overlay={menu}>
                    <Button type='text'>
                        Recently used
                        {' '}
                        <DownOutlined />
                    </Button>
                </Dropdown>
            </div>
            <Query {...config} value={state.tree} onChange={onChange} renderBuilder={renderBuilder} />
        </Modal>
    );
}
