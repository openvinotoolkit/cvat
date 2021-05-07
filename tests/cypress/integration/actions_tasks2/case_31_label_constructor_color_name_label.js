// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

/// <reference types="cypress" />

import { taskName } from '../../support/const';

context('Label constructor. Color label. Label name editing', () => {
    const caseId = '31';
    const labelColor = {
        redHex: 'ff0000',
        greenHex: '00ff00',
        blueHex: '0000ff',
        yellowHex: 'fcbe03',
        redRgb: '255, 0, 0',
        greenRgb: '0, 255, 0',
        blueRgb: '0, 0, 255',
        yellowRgb: '252, 190, 3',
    };
    const colorRed = 'Color red';
    const colorGreen = 'Color green';
    const colorBlue = 'Color blue';
    const colorYellow = 'Color yellow';
    const labelAdditionalAttrs = false;

    const createRectangleShape2Points = {
        points: 'By 2 Points',
        type: 'Shape',
        labelName: colorRed,
        firstX: 100,
        firstY: 350,
        secondX: 200,
        secondY: 450,
    };
    const createRectangleShape2PointsSecond = {
        points: createRectangleShape2Points.points,
        type: createRectangleShape2Points.type,
        labelName: colorGreen,
        firstX: createRectangleShape2Points.firstX + 150,
        firstY: createRectangleShape2Points.firstY,
        secondX: createRectangleShape2Points.secondX + 150,
        secondY: createRectangleShape2Points.secondY,
    };

    const createRectangleShape2PointsThird = {
        points: createRectangleShape2Points.points,
        type: createRectangleShape2Points.type,
        labelName: colorBlue,
        firstX: createRectangleShape2PointsSecond.firstX + 150,
        firstY: createRectangleShape2PointsSecond.firstY,
        secondX: createRectangleShape2PointsSecond.secondX + 150,
        secondY: createRectangleShape2PointsSecond.secondY,
    };

    before(() => {
        cy.openTask(taskName);
    });

    describe(`Testing case "${caseId}"`, () => {
        it('To add multiple labels with a color change.', () => {
            cy.addNewLabel(colorRed, labelAdditionalAttrs, labelColor.redHex);
            cy.addNewLabel(colorGreen, labelAdditionalAttrs, labelColor.greenHex);
            cy.addNewLabel(colorBlue, labelAdditionalAttrs, labelColor.blueHex);
        });

        it('Check color for created labels.', () => {
            cy.get('.cvat-constructor-viewer-item').then((label) => {
                for (let i = 0; i < label.length; i++) {
                    if (label[i].textContent === colorRed) {
                        cy.get(label[i]).should('have.attr', 'style').and('contain', labelColor.redRgb);
                    } else if (label[i].textContent === colorGreen) {
                        cy.get(label[i]).should('have.attr', 'style').and('contain', labelColor.greenRgb);
                    } else if (label[i].textContent === colorBlue) {
                        cy.get(label[i]).should('have.attr', 'style').and('contain', labelColor.blueRgb);
                    }
                }
            });
        });

        it('Open the job. Create an objects.', () => {
            cy.openJob();
            cy.createRectangle(createRectangleShape2Points);
            cy.createRectangle(createRectangleShape2PointsSecond);
            cy.createRectangle(createRectangleShape2PointsThird);
        });

        it('Created objects and objects on the side panel should have the same solor as label.', () => {
            cy.get('#cvat_canvas_shape_1').should('have.attr', 'stroke', `#${labelColor.redHex}`);
            cy.get('#cvat_canvas_shape_2').should('have.attr', 'stroke', `#${labelColor.greenHex}`);
            cy.get('#cvat_canvas_shape_3').should('have.attr', 'stroke', `#${labelColor.blueHex}`);
            cy.get('#cvat-objects-sidebar-state-item-1')
                .should('have.attr', 'style')
                .and('contain', `background-color: rgba(${labelColor.redRgb}`);
            cy.get('#cvat-objects-sidebar-state-item-2')
                .should('have.attr', 'style')
                .and('contain', `background-color: rgba(${labelColor.greenRgb}`);
            cy.get('#cvat-objects-sidebar-state-item-3')
                .should('have.attr', 'style')
                .and('contain', `background-color: rgba(${labelColor.blueRgb}`);
        });

        it('Save job and change color and name for a label.', () => {
            cy.saveJob();
            cy.goToTaskList();
            cy.openTask(taskName);
            cy.contains('.cvat-constructor-viewer-item', colorRed).within(() => {
                cy.get('[data-icon="edit"]').click();
            });
            cy.get('.cvat-change-task-label-color-button').click();
            cy.changeColorViaBadge(labelColor.yellowHex);
            cy.get('[placeholder="Label name"]').clear().type(colorYellow); // Check PR 2806
            cy.contains('button', 'Done').click();
        });

        it('Open the job. Existing objects with this label have changed their color and name.', () => {
            cy.openJob(0, false);
            cy.getObjectIdNumberByLabelName(colorYellow).then((objectId) => {
                cy.get(`#cvat_canvas_shape_${objectId}`).should('have.attr', 'stroke', `#${labelColor.yellowHex}`);
                cy.get(`#cvat-objects-sidebar-state-item-${objectId}`)
                    .should('have.attr', 'style')
                    .and('contain', `background-color: rgba(${labelColor.yellowRgb}`);
                cy.get(`#cvat-objects-sidebar-state-item-${objectId}`).within(() => {
                    cy.get('.cvat-objects-sidebar-state-item-label-selector').should('have.text', colorYellow);
                });
            });
        });

        it('Cancel/reset button interaction when changing color of the label.', () => {
            cy.goToTaskList();
            cy.openTask(taskName);
            // Adding a label without setting a color
            cy.addNewLabel(`Case ${caseId}`);
            cy.get('.cvat-constructor-viewer').should('be.visible');
            cy.contains('.cvat-constructor-viewer-item', `Case ${caseId}`)
                .invoke('attr', 'style')
                .then(($labelColor) => {
                    // Change the label color and press "Cancel"
                    cy.contains('.cvat-constructor-viewer-item', `Case ${caseId}`).find('[data-icon="edit"]').click();
                    cy.get('.cvat-change-task-label-color-badge')
                        .children()
                        .invoke('attr', 'style')
                        .then(($labelBadgeColor) => {
                            expect($labelBadgeColor).to.be.equal($labelColor);
                        });
                    cy.get('.cvat-change-task-label-color-button').click();
                    cy.get('.cvat-label-color-picker')
                        .not('.ant-popover-hidden')
                        .within(() => {
                            cy.contains('hex').prev().clear().type(labelColor.yellowHex);
                            cy.contains('button', 'Cancel').click();
                        });
                    cy.get('.cvat-change-task-label-color-badge')
                        .children()
                        .invoke('attr', 'style')
                        .then(($labelBadgeColor) => {
                            expect($labelBadgeColor).to.be.equal($labelColor);
                        });

                    // Change the label color
                    cy.get('.cvat-change-task-label-color-button').click();
                    cy.changeColorViaBadge(labelColor.yellowHex);

                    // Reset the label color
                    cy.get('.cvat-change-task-label-color-button').click();
                    cy.get('.cvat-label-color-picker')
                        .not('.ant-popover-hidden')
                        .within(() => {
                            cy.contains('button', 'Reset').click();
                        });
                    cy.get('.cvat-change-task-label-color-badge')
                        .children()
                        .should('have.attr', 'style')
                        .and('contain', 'rgb(179, 179, 179)');
                    cy.get('.cvat-label-constructor-updater').contains('button', 'Done').click();
                    cy.contains('.cvat-constructor-viewer-item', `Case ${caseId}`)
                        .should('have.attr', 'style')
                        .and('contain', $labelColor);
                });
        });
    });
});
