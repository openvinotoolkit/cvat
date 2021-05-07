// Copyright (C) 2019-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React, { useEffect, useState } from 'react';
import Autocomplete from 'antd/lib/auto-complete';
import { SelectValue } from 'antd/lib/select';

import getCore from 'cvat-core-wrapper';

const core = getCore();

type Props = {
    value: number | null;
    excludeId?: number;
    onSelect: (id: number | null) => void;
};

type Project = {
    id: number;
    name: string;
};

export default function ProjectSearchField(props: Props): JSX.Element {
    const { value, excludeId, onSelect } = props;
    const [searchPhrase, setSearchPhrase] = useState('');

    const [projects, setProjects] = useState<Project[]>([]);

    const handleSearch = (searchValue: string): void => {
        if (searchValue) {
            core.projects.searchNames(searchValue).then((result: Project[]) => {
                if (result) {
                    setProjects(result);
                }
            });
        } else {
            setProjects([]);
        }
        setSearchPhrase(searchValue);
        onSelect(null);
    };

    const handleFocus = (open: boolean): void => {
        if (!projects.length && open) {
            core.projects.searchNames().then((result: Project[]) => {
                const projectsResponse = result.filter((project) => project.id !== excludeId);
                if (projectsResponse) {
                    setProjects(projectsResponse);
                }
            });
        }
        if (!open && !value && searchPhrase) {
            setSearchPhrase('');
        }
    };

    const handleSelect = (_value: SelectValue): void => {
        setSearchPhrase(projects.filter((proj) => proj.id === +_value)[0].name);
        onSelect(_value ? +_value : null);
    };

    useEffect(() => {
        if (value) {
            if (!projects.filter((project) => project.id === value).length) {
                core.projects.get({ id: value }).then((result: Project[]) => {
                    const [project] = result;
                    setProjects([
                        ...projects,
                        {
                            id: project.id,
                            name: project.name,
                        },
                    ]);
                    setSearchPhrase(project.name);
                    onSelect(project.id);
                });
            }
        } else {
            setSearchPhrase('');
        }
    }, [value]);

    return (
        <Autocomplete
            value={searchPhrase}
            placeholder='Select project'
            onSearch={handleSearch}
            onSelect={handleSelect}
            className='cvat-project-search-field'
            onDropdownVisibleChange={handleFocus}
            options={projects.map((proj) => ({
                value: proj.id.toString(),
                label: proj.name,
            }))}
        />
    );
}
