// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

/// <reference types="cypress" />

import { taskName } from '../../support/const';

context('Search task feature.', () => {
    const caseId = '35';

    function searchTask(option, result) {
        cy.intercept('GET', '/api/v1/tasks**').as('searchTask');
        cy.get('.cvat-task-page-search-task').find('[placeholder="Search"]').clear().type(`${option}{Enter}`);
        cy.wait('@searchTask').its('response.statusCode').should('equal', 200);
        cy.contains('.cvat-item-task-name', taskName).should(result);
    }

    before(() => {
        cy.openTask(taskName);
        cy.assignTaskToUser(Cypress.env('user'));
        cy.goToTaskList();
    });

    after(() => {
        cy.goToTaskList();
        cy.openTask(taskName);
        cy.assignTaskToUser('');
    });

    describe(`Testing case "${caseId}"`, () => {
        it('Tooltip task filter contain all the possible options.', () => {
            cy.get('.cvat-task-page-search-task').trigger('mouseover');
            cy.get('.cvat-tasks-search-tooltip').should('be.visible').invoke('text').then(($tooltipText) => {
                for (const i of ['owner: admin', 'assignee: employee', 'name: training', 'mode: annotation', 'status: annotation', 'id: 5']) {
                    expect($tooltipText).contain(i);
                }
            });
        });

        it('Type to task search some filter and check result.', () => {
            searchTask(`${taskName.substring(0, 3)}`, 'exist');
            searchTask('121212', 'not.exist');
            searchTask(`owner: ${Cypress.env('user')}`, 'exist');
            searchTask(`mode: annotation AND assignee: ${Cypress.env('user')}`, 'exist');
            searchTask('status: annotation', 'exist');
            searchTask(`mode: interpolation AND owner: ${Cypress.env('user')}`, 'not.exist');
        });
    });
});
