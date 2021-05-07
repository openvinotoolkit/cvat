// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

/// <reference types="cypress" />

import { taskName } from '../../support/const';

context('Drag canvas.', () => {
    const caseId = '74';
    let topBefore;
    let leftBefore;

    before(() => {
        cy.openTaskJob(taskName);
    });

    describe(`Testing case "${caseId}"`, () => {
        it('Drag canvas', () => {
            cy.get('#cvat_canvas_background')
                .invoke('attr', 'style')
                .then(($style) => {
                    topBefore = Number($style.split(';')[0].split(' ')[1].replace('px', ''));
                    leftBefore = Number($style.split(';')[1].split(' ')[2].replace('px', ''));
                });
            cy.get('.cvat-move-control').click(); // Without this action, the function is not covered
            cy.get('.cvat-canvas-container').trigger('mousedown', { button: 0 }).trigger('mousemove', 500, 500);
        });

        it('Top and left style perameters is changed.', () => {
            cy.get('#cvat_canvas_background')
                .invoke('attr', 'style')
                .then(($style) => {
                    expect(topBefore).not.equal(Number($style.split(';')[0].split(' ')[1].replace('px', ''))); // expected 20 to not equal 95
                    expect(leftBefore).not.equal(Number($style.split(';')[1].split(' ')[2].replace('px', ''))); // expected 73 to not equal 95
                });
        });

        it('Duble click on canvas. Parameters returned to their original value', () => {
            cy.get('.cvat-canvas-container').dblclick();
            cy.get('#cvat_canvas_background')
                .invoke('attr', 'style')
                .then(($style) => {
                    expect(topBefore).equal(Number($style.split(';')[0].split(' ')[1].replace('px', ''))); // expected 20 to equal 20
                    expect(leftBefore).equal(Number($style.split(';')[1].split(' ')[2].replace('px', ''))); // expected 73 to equal 73
                });
        });
    });
});
