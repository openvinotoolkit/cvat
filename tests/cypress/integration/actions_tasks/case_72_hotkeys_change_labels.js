// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

/// <reference types="cypress" />

context('Hotkeys to change labels feature.', () => {
    const caseId = '72';
    const labelName = `Case ${caseId}`;
    const taskName = labelName;
    const attrName = `Attr for ${labelName}`;
    const textDefaultValue = 'Some default value for type Text';
    const imagesCount = 1;
    const imageFileName = `image_${labelName.replace(' ', '_').toLowerCase()}`;
    const width = 800;
    const height = 800;
    const posX = 10;
    const posY = 10;
    const color = 'gray';
    const archiveName = `${imageFileName}.zip`;
    const archivePath = `cypress/fixtures/${archiveName}`;
    const imagesFolder = `cypress/fixtures/${imageFileName}`;
    const directoryToArchive = imagesFolder;
    const secondLabel = `Case ${caseId} second`;
    let firstLabelCurrentVal = '';
    let secondLabelCurrentVal = '';

    function testCheckingAlwaysShowObjectDetails(check) {
        cy.openSettings();
        cy.get('.cvat-settings-modal').within(() => {
            cy.contains('Workspace').click();
            cy.get('.cvat-workspace-settings-show-text-always').within(() => {
                check
                    ? cy.get('[type="checkbox"]').check().should('be.checked')
                    : cy.get('[type="checkbox"]').uncheck().should('not.be.checked');
            });
        });
        cy.closeSettings();
    }

    before(() => {
        cy.visit('auth/login');
        cy.login();
        cy.imageGenerator(imagesFolder, imageFileName, width, height, color, posX, posY, labelName, imagesCount);
        cy.createZipArchive(directoryToArchive, archivePath);
        cy.createAnnotationTask(taskName, labelName, attrName, textDefaultValue, archiveName);
        cy.openTask(taskName);
        cy.addNewLabel(secondLabel);
        cy.openJob();
    });

    after(() => {
        cy.goToTaskList();
        cy.deleteTask(taskName);
    });

    describe(`Testing case "${caseId}"`, () => {
        // Collect labels text. Since the server can return them in reverse order.
        it('Collect label values relative to hotkeys.', () => {
            cy.get('.cvat-objects-sidebar-tabs').within(() => {
                cy.contains('[role="tab"]', 'Labels').click();
            });
            cy.get('.cvat-objects-sidebar-label-item').then(($objectsSidebarLabelItem) => {
                firstLabelCurrentVal = $objectsSidebarLabelItem[0].innerText.slice(0, -2);
                secondLabelCurrentVal = $objectsSidebarLabelItem[1].innerText.slice(0, -2);
            });
            cy.get('.cvat-objects-sidebar-tabs').within(() => {
                cy.contains('[role="tab"]', 'Objects').click();
            });
        });

        it('Changing a label for a shape using hotkey.', () => {
            const createPolygonShape = {
                reDraw: false,
                type: 'Shape',
                labelName: firstLabelCurrentVal,
                pointsMap: [
                    { x: 200, y: 200 },
                    { x: 300, y: 200 },
                    { x: 300, y: 300 },
                ],
                complete: true,
                numberOfPoints: null,
            };
            // Set settings "Always show object details" to check issue 3083
            testCheckingAlwaysShowObjectDetails(true);
            cy.createPolygon(createPolygonShape);
            cy.get('#cvat-objects-sidebar-state-item-1')
                .find('.cvat-objects-sidebar-state-item-label-selector')
                .should('have.text', firstLabelCurrentVal);
            cy.get('.cvat-canvas-container').click(270, 260);
            cy.get('#cvat_canvas_shape_1').should('have.class', 'cvat_canvas_shape_activated');
            cy.contains('tspan', `${firstLabelCurrentVal} 1 (manual)`).should('be.visible');
            cy.get('body').type('{Ctrl}2');
            cy.get('#cvat-objects-sidebar-state-item-1')
                .find('.cvat-objects-sidebar-state-item-label-selector')
                .should('have.text', secondLabelCurrentVal);
            cy.contains('tspan', `${secondLabelCurrentVal} 1 (manual)`).should('be.visible');
            // Unset settings "Always show object details"
            testCheckingAlwaysShowObjectDetails();
        });

        it('Changing default label before drawing a shape.', () => {
            cy.interactControlButton('draw-rectangle');
            cy.switchLabel(firstLabelCurrentVal, 'draw-rectangle');
            cy.get('.cvat-draw-rectangle-popover-visible').within(() => {
                cy.contains('button', 'Shape').click();
            });
            cy.get('body').type('{Ctrl}2');
            cy.contains(`Default label was changed to "${secondLabelCurrentVal}"`).should('exist');
            cy.get('.cvat-canvas-container').click(500, 500).click(600, 600);
            cy.get('#cvat-objects-sidebar-state-item-2')
                .find('.cvat-objects-sidebar-state-item-label-selector')
                .should('have.text', secondLabelCurrentVal);
        });

        it('Check changing shortcut for a label.', () => {
            // Go to a labels tab
            cy.get('.cvat-objects-sidebar-tabs').within(() => {
                cy.contains('[role="tab"]', 'Labels').click();
            });
            cy.contains('.cvat-label-item-setup-shortcut-button', '1').click();
            cy.get('.cvat-label-item-setup-shortcut-popover')
                .should('be.visible')
                .within(() => {
                    cy.get('[type="button"]').then(($btn) => {
                        expect($btn[0].innerText).to.be.equal(`1:${firstLabelCurrentVal}`);
                        expect($btn[1].innerText).to.be.equal(`2:${secondLabelCurrentVal}`);
                        expect($btn[2].innerText).to.be.equal('3:None');
                        // Click to "3" button
                        cy.get($btn[2]).click();
                    });
                });
            cy.get('.cvat-label-item-setup-shortcut-popover')
                .should('be.visible')
                .within(() => {
                    cy.get('[type="button"]').then(($btn) => {
                        // Buttons 1 and 3 have changed values
                        expect($btn[0].innerText).to.be.equal('1:None');
                        expect($btn[2].innerText).to.be.equal(`3:${firstLabelCurrentVal}`);
                    });
                });
            cy.contains('.cvat-label-item-setup-shortcut-button', '3').should('exist');
            cy.get('.cvat-canvas-container').click(); // Hide shortcut popover
            // Go to "Objects" tab
            cy.get('.cvat-objects-sidebar-tabs').within(() => {
                cy.contains('[role="tab"]', 'Objects').click();
            });
            // Checking the label change via the new hotkey value
            cy.get('.cvat-canvas-container').click(270, 260);
            cy.get('#cvat_canvas_shape_1').should('have.class', 'cvat_canvas_shape_activated');
            cy.get('body').type('{Ctrl}3');
            cy.contains('tspan', `${firstLabelCurrentVal} 1 (manual)`).should('be.visible');
            cy.get('#cvat-objects-sidebar-state-item-1')
                .find('.cvat-objects-sidebar-state-item-label-selector')
                .should('have.text', firstLabelCurrentVal);
        });
    });
});
