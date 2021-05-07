// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

/// <reference types="cypress" />

import { taskName } from '../../support/const';

context('Shortcuts window.', () => {
    const caseId = '71';
    const keyCodeF1 = 112;
    let shortcutsTableTrCount = 0;

    before(() => {
        cy.openTask(taskName);
    });

    describe(`Testing case "${caseId}"`, () => {
        it('Press "F1" from a task. Shortcuts window be visible. Closing the modal window by button "OK".', () => {
            cy.get('body').trigger('keydown', { keyCode: keyCodeF1 });
            cy.get('.cvat-shortcuts-modal-window')
                .should('exist')
                .and('be.visible')
                .within(() => {
                    cy.get('.cvat-shortcuts-modal-window-table').within(() => {
                        cy.get('tr')
                            .should('exist')
                            .then(($shortcutsTableTrCount) => {
                                shortcutsTableTrCount = $shortcutsTableTrCount.length;
                            });
                    });
                    cy.contains('button', 'OK').click();
                });
            cy.get('.cvat-shortcuts-modal-window').should('not.be.visible');
        });

        it('Open a job. Press "F1". Shortcuts window be visible. Closing the modal window by F1.', () => {
            cy.openJob();
            cy.get('body').trigger('keydown', { keyCode: keyCodeF1 });
            cy.get('.cvat-shortcuts-modal-window')
                .should('exist')
                .and('be.visible')
                .within(() => {
                    cy.get('.cvat-shortcuts-modal-window-table').within(() => {
                        cy.get('tr')
                            .should('exist')
                            .then(($shortcutsTableTrCount) => {
                                expect($shortcutsTableTrCount.length).to.be.gt(shortcutsTableTrCount);
                            });
                    });
                });
            cy.get('body').trigger('keydown', { keyCode: keyCodeF1 });
            cy.get('.cvat-shortcuts-modal-window').should('not.be.visible');
        });
    });
});
