// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

/// <reference types="cypress" />

Cypress.Commands.add('сheckFiltersModalOpened', () => {
    cy.document().then((doc) => {
        const filterModal = Array.from(doc.querySelectorAll('.cvat-filters-modal-visible'));
        if (filterModal.length === 0) {
            cy.contains('.cvat-annotation-header-button', 'Filters').click();
        }
    });
});

Cypress.Commands.add('collectGroupID', () => {
    let groupDataID = [];
    cy.get('.group').then(($group) => {
        for (let i = 0; i < $group.length; i++) {
            groupDataID.push($group[i].dataset.id);
        }
        return groupDataID;
    });
});

Cypress.Commands.add('collectRuleID', () => {
    let ruleDataID = [];
    cy.get('.rule').then(($rule) => {
        for (let i = 0; i < $rule.length; i++) {
            ruleDataID.push($rule[i].dataset.id);
        }
        return ruleDataID;
    });
});

Cypress.Commands.add('clearFilters', () => {
    cy.сheckFiltersModalOpened();
    cy.contains('button', 'Clear filters').click();
});

Cypress.Commands.add('addFiltersGroup', (groupIndex) => {
    cy.сheckFiltersModalOpened();
    cy.collectGroupID().then((groupIdIndex) => {
        cy.get(`[data-id="${groupIdIndex[groupIndex]}"]`).contains('button', 'Add group').first().click();
    });
});

Cypress.Commands.add('addFiltersRule', (groupIndex) => {
    cy.сheckFiltersModalOpened();
    cy.collectGroupID().then((groupIdIndex) => {
        cy.get(`[data-id="${groupIdIndex[groupIndex]}"]`).contains('button', 'Add rule').click();
    });
});

Cypress.Commands.add('setGroupCondition', (groupIndex, condition) => {
    cy.сheckFiltersModalOpened();
    cy.collectGroupID().then((groupIdIndex) => {
        cy.get(`[data-id="${groupIdIndex[groupIndex]}"]`).within(() => {
            cy.get('.group--header').first().trigger('mouseover');
            cy.contains('button', condition).click({ force: true });
        });
    });
});

Cypress.Commands.add(
    'setFilter',
    ({ groupIndex, ruleIndex, field, operator, valueSource, value, label, labelAttr, submit }) => {
        cy.сheckFiltersModalOpened();
        cy.collectGroupID().then((groupIdIndex) => {
            cy.collectRuleID().then((ruleIdIndex) => {
                cy.get(`[data-id="${groupIdIndex[groupIndex]}"]`)
                    .find(`[data-id="${ruleIdIndex[ruleIndex]}"]`)
                    .within(() => {
                        cy.contains('button', 'Select field').click();
                    });
                if (field === 'Attributes') {
                    cy.get('.ant-dropdown')
                        .not('.ant-dropdown-hidden')
                        .contains('[role="menuitem"]', field)
                        .trigger('mouseover');
                    cy.get('.ant-dropdown-menu-sub').contains(label).trigger('mouseover');
                    cy.contains('.ant-dropdown-menu-item-only-child', labelAttr).click();
                } else {
                    cy.get('.ant-dropdown').not('.ant-dropdown-hidden').contains('[role="menuitem"]', field).click();
                }
                cy.get(`[data-id="${groupIdIndex[groupIndex]}"]`)
                    .find(`[data-id="${ruleIdIndex[ruleIndex]}"]`)
                    .within(() => {
                        cy.get('[type="search"]').first().click({ force: true });
                    });
                cy.get(`[label="${operator}"]`).last().click();
                if (valueSource) {
                    cy.get(`[data-id="${groupIdIndex[groupIndex]}"]`)
                        .find(`[data-id="${ruleIdIndex[ruleIndex]}"]`)
                        .within(() => {
                            cy.get('[aria-label="ellipsis"]').trigger('mouseover');
                        });
                    cy.contains('Select value source').parents('[role="tooltip"]').contains(valueSource).click();
                }
                cy.get(`[data-id="${groupIdIndex[groupIndex]}"]`)
                    .find(`[data-id="${ruleIdIndex[ruleIndex]}"]`)
                    .within(() => {
                        if (field === 'Attributes') {
                            cy.get('[placeholder="Enter string"]').last().type(`${value}{Enter}`);
                        } else {
                            if (!valueSource) {
                                if (field === 'ObjectID' || field === 'Width' || field === 'Height') {
                                    cy.get('[placeholder="Enter number"]').type(`${value}{Enter}`);
                                } else {
                                    cy.get('[type="search"]').last().type(`${value}{Enter}`);
                                }
                            } else {
                                cy.contains('[type="button"]', 'Select field ').click();
                            }
                        }
                    });
                if (valueSource) {
                    cy.get('.ant-dropdown').not('.ant-dropdown-hidden').contains('[role="menuitem"]', value).click();
                }
                cy.get('.cvat-filters-modal').within(() => {
                    submit ? cy.contains('button', 'Submit').click() : null;
                });
            });
        });
    },
);

Cypress.Commands.add('selectFilterValue', (filterValue) => {
    cy.сheckFiltersModalOpened();
    cy.get('.recently-used-wrapper').trigger('mouseover');
    cy.get('.ant-dropdown')
        .not('.ant-dropdown-hidden')
        .within(() => {
            cy.contains('[role="menuitem"]', new RegExp(`^${filterValue}$`)).click();
        });
    cy.get('.cvat-filters-modal').within(() => {
        cy.contains('button', 'Submit').click();
    });
});
