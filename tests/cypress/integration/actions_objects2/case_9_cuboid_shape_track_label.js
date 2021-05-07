// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

/// <reference types="cypress" />

import { taskName, labelName } from '../../support/const';

context('Actions on Cuboid', () => {
    const caseId = '9';
    const newLabelName = `New label for case ${caseId}`;
    const createCuboidShape2Points = {
        points: 'From rectangle',
        type: 'Shape',
        labelName: labelName,
        firstX: 250,
        firstY: 350,
        secondX: 350,
        secondY: 450,
    };
    const createCuboidShape4Points = {
        points: 'By 4 Points',
        type: 'Shape',
        labelName: labelName,
        firstX: 400,
        firstY: 350,
        secondX: 500,
        secondY: 350,
        thirdX: 500,
        thirdY: 450,
        fourthX: 400,
        fourthY: 450,
    };
    const createCuboidTrack2Points = {
        points: 'From rectangle',
        type: 'Track',
        labelName: labelName,
        firstX: createCuboidShape2Points.firstX,
        firstY: createCuboidShape2Points.firstY - 150,
        secondX: createCuboidShape2Points.secondX,
        secondY: createCuboidShape2Points.secondY - 150,
    };
    const createCuboidTrack4Points = {
        points: 'By 4 Points',
        type: 'Track',
        labelName: labelName,
        firstX: createCuboidShape4Points.firstX,
        firstY: createCuboidShape4Points.firstY - 150,
        secondX: createCuboidShape4Points.secondX - 100,
        secondY: createCuboidShape4Points.secondY - 50,
        thirdX: createCuboidShape4Points.thirdX,
        thirdY: createCuboidShape4Points.thirdY - 150,
        fourthX: createCuboidShape4Points.fourthX,
        fourthY: createCuboidShape4Points.fourthY - 150,
    };
    const createCuboidShape2PointsNewLabel = {
        labelName: newLabelName,
        points: 'From rectangle',
        type: 'Shape',
        firstX: createCuboidShape2Points.firstX,
        firstY: createCuboidShape2Points.firstY + 150,
        secondX: createCuboidShape2Points.secondX,
        secondY: createCuboidShape2Points.secondY + 150,
    };
    const createCuboidShape4PointsNewLabel = {
        labelName: newLabelName,
        points: 'By 4 Points',
        type: 'Shape',
        firstX: createCuboidShape4Points.firstX,
        firstY: createCuboidShape4Points.firstY + 150,
        secondX: createCuboidShape4Points.secondX,
        secondY: createCuboidShape4Points.secondY + 150,
        thirdX: createCuboidShape4Points.thirdX,
        thirdY: createCuboidShape4Points.thirdY + 150,
        fourthX: createCuboidShape4Points.fourthX,
        fourthY: createCuboidShape4Points.fourthY + 150,
    };

    before(() => {
        cy.openTask(taskName);
        cy.addNewLabel(newLabelName);
        cy.openJob();
    });

    describe(`Testing case "${caseId}"`, () => {
        it('Draw a Cuboid shape in two ways (From rectangle, by 4 points)', () => {
            cy.createCuboid(createCuboidShape2Points);
            cy.get('.cvat-canvas-container').trigger('mousemove', 300, 400);
            cy.get('#cvat_canvas_shape_1').should('have.class', 'cvat_canvas_shape_activated')

            // Increase code coverage for cvat-canvas/src/typescript/svg.patch.ts. Block start
            // Checking for changes in the size and orientation of the shape is based on
            // checking the occurrence of the "cvat_canvas_selected_point" class
            cy.get('.cvat-canvas-container') // DR
                .trigger('mouseenter', 360, 340);
            cy.get('.cvat_canvas_selected_point').should('exist');
            cy.get('.cvat-canvas-container')
                .trigger('mousedown', 360, 340, {button: 0})
                .trigger('mousemove', 360, 240)
                .trigger('mouseup', 360, 240);

            cy.get('.cvat-canvas-container') // drCenter
                .trigger('mouseenter', 360, 340);
            cy.get('.cvat_canvas_selected_point').should('exist');
            cy.get('.cvat-canvas-container')
                .trigger('mousedown', 360, 340, {which: 1})
                .trigger('mousemove', 430, 340)
                .trigger('mouseup', 430, 340);

            cy.get('.cvat-canvas-container') // FL
                .trigger('mouseenter', 250, 250);
            cy.get('.cvat_canvas_selected_point').should('exist');
            cy.get('.cvat-canvas-container')
                .trigger('mousedown', 250, 250, {button: 0})
                .trigger('mousemove', 200, 250)
                .trigger('mouseup', 200, 250);

            cy.get('.cvat-canvas-container') // FR
                .trigger('mouseenter', 350, 250);
            cy.get('.cvat_canvas_selected_point').should('exist');
            cy.get('.cvat-canvas-container')
                .trigger('mousedown', 350, 250, {button: 0})
                .trigger('mousemove', 300, 250)
                .trigger('mouseup', 300, 250);

            cy.get('.cvat-canvas-container') // flCenter
                .trigger('mouseenter', 200, 350);
            cy.get('.cvat_canvas_selected_point').should('exist');
            cy.get('.cvat-canvas-container')
                .trigger('mousedown', 200, 350, {which: 1})
                .trigger('mousemove', 150, 350)
                .trigger('mouseup', 150, 350);

            cy.get('.cvat-canvas-container') // Orientation to right. drCenter.hide()
                .trigger('mouseenter', 300, 200)
                .trigger('mousedown', 300, 200, {which: 1})
                .trigger('mousemove', 150, 200)
                .trigger('mouseup', 150, 200);

            cy.get('.cvat-canvas-container') // dlCenter
                .trigger('mouseenter', 85, 270);
            cy.get('.cvat_canvas_selected_point').should('exist');
            cy.get('.cvat-canvas-container')
                .trigger('mousedown', 85, 270, {which: 1})
                .trigger('mousemove', 120, 270)
                .trigger('mouseup', 120, 270);

            cy.get('.cvat-canvas-container') // DL
                .trigger('mouseenter', 120, 410);
            cy.get('.cvat_canvas_selected_point').should('exist');
            cy.get('.cvat-canvas-container')
                .trigger('mousedown', 120, 410, {button: 0})
                .trigger('mousemove', 120, 350)
                .trigger('mouseup', 120, 350);

            cy.get('.cvat-canvas-container') // this.face
                .trigger('mouseenter', 230, 300)
                .trigger('mousedown', 230, 300, {which: 1})
                .trigger('mousemove', 200, 300)
                .trigger('mouseup', 200, 300);

            cy.get('.cvat-canvas-container') // this.right
                .trigger('mouseenter', 250, 240)
                .trigger('mousedown', 250, 240, {which: 1})
                .trigger('mousemove', 280, 200)
                .trigger('mouseup', 280, 200);

            cy.get('.cvat-canvas-container') // computeSideEdgeConstraints()
                .trigger('mouseenter', 90, 215);
            cy.get('.cvat_canvas_selected_point').should('exist');
            cy.get('.cvat-canvas-container')
                .trigger('mousedown', 90, 215, {button: 0, shiftKey: true})
                .trigger('mousemove', 90, 270, {shiftKey: true})
                .trigger('mouseup', 90, 270);

            cy.get('.cvat-appearance-cuboid-projections-checkbox').click(); // if (v === true)
            cy.get('.cvat_canvas_cuboid_projections').should('be.visible');
            cy.get('.cvat-canvas-container').trigger('mouseover', 80, 305); // updateThickness() this.on('mouseover', () => {
            cy.get('.cvat-canvas-container').trigger('mouseout', 80, 305); // updateThickness() on('mouseout', () => {
            cy.get('.cvat-appearance-cuboid-projections-checkbox').click(); // Hide projections.
            cy.get('.cvat_canvas_cuboid_projections').should('not.be.visible');

            cy.get('.cvat-canvas-container') // Moving the shape for further testing convenience
                .trigger('mouseenter', 150, 305)
                .trigger('mousedown', 230, 300, {which: 1})
                .trigger('mousemove', 400, 200)
                .trigger('mouseup', 400, 200);

            cy.get('.cvat-canvas-container') // if (this.cuboidModel.orientation === Orientation.LEFT) ecle{}
                .trigger('mouseenter', 260, 250);
            cy.get('.cvat_canvas_selected_point').should('exist');
            cy.get('.cvat-canvas-container')
                .dblclick(260, 250, {shiftKey: true})

            cy.get('.cvat-canvas-container') // Change orientation to left
                .trigger('mouseenter', 300, 130)
                .trigger('mousedown', 300, 130, {which: 1})
                .trigger('mousemove', 500, 100)
                .trigger('mouseup', 500, 100);

            cy.get('.cvat-canvas-container') // frCenter
                .trigger('mouseenter', 465, 180)
            cy.get('.cvat_canvas_selected_point').should('exist');
            cy.get('.cvat-canvas-container')
                .trigger('mousedown', 465, 180, {which: 1})
                .trigger('mousemove', 500, 180)
                .trigger('mouseup', 500, 180);

            cy.get('.cvat-canvas-container') // ftCenter
                .trigger('mouseenter', 395, 125)
            cy.get('.cvat_canvas_selected_point').should('exist');
            cy.get('.cvat-canvas-container')
                .trigger('mousedown', 395, 125, {which: 1})
                .trigger('mousemove', 395, 150)
                .trigger('mouseup', 395, 150);

            cy.get('.cvat-canvas-container') // fbCenter
                .trigger('mouseenter', 400, 265)
            cy.get('.cvat_canvas_selected_point').should('exist');
            cy.get('.cvat-canvas-container')
                .trigger('mousedown', 400, 265, {which: 1})
                .trigger('mousemove', 400, 250)
                .trigger('mouseup', 400, 250);

            cy.get('.cvat-canvas-container') // if (this.cuboidModel.orientation === Orientation.LEFT)
                .trigger('mouseenter', 600, 180)
            cy.get('.cvat_canvas_selected_point').should('exist');
            cy.get('.cvat-canvas-container')
                .trigger('mousedown', 600, 180, {button: 0, shiftKey: true})
                .trigger('mousemove', 600, 150, {shiftKey: true})
                .trigger('mouseup', 600, 150)
                .dblclick(600, 150, {shiftKey: true});

            cy.get('.cvat-canvas-container') // this.left
                .trigger('mouseenter', 400, 130)
                .trigger('mousedown', 400, 130, {which: 1})
                .trigger('mousemove', 400, 100)
                .trigger('mouseup', 400, 100)
                .trigger('mouseout', 400, 100);
            // Increase code coverage for cvat-canvas/src/typescript/svg.patch.ts. Block end.

            cy.createCuboid(createCuboidShape4Points);
        });

        it('Draw a Cuboid track in two ways (From rectangle, by 4 points)', () => {
            cy.createCuboid(createCuboidTrack2Points);
            cy.createCuboid(createCuboidTrack4Points);
        });

        it('Draw a new Cuboid shape in two ways (From rectangle, by 4 points) with second label', () => {
            cy.createCuboid(createCuboidShape2PointsNewLabel);
            cy.createCuboid(createCuboidShape4PointsNewLabel);
        });
    });
});
