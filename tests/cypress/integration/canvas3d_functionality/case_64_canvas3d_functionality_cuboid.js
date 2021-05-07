// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

/// <reference types="cypress" />

import { taskName } from '../../support/const_canvas3d';

context('Canvas 3D functionality. Add cuboid.', () => {
    const caseId = '64';

    const screenshotsPath = 'cypress/screenshots/canvas3d_functionality/case_64_canvas3d_functionality_cuboid.js';

    before(() => {
        cy.openTaskJob(taskName);
        // Prepare screenshots to compare
        cy.get('.cvat-canvas3d-perspective').screenshot('canvas3d_perspective_before_all');
        ['topview', 'sideview', 'frontview'].forEach((view) => {
            cy.get(`.cvat-canvas3d-${view}`).find('.cvat-canvas3d-fullsize').screenshot(`canvas3d_${view}_before_all`);
        });
    });

    describe(`Testing case "${caseId}"`, () => {
        it('Add cuboid.', () => {
            cy.get('.cvat-draw-cuboid-control').trigger('mouseover');
            cy.get('.cvat-draw-shape-popover').find('button').click();
            cy.get('.cvat-canvas3d-perspective').dblclick();
            cy.wait(1000);
            cy.get('.cvat-canvas3d-perspective').screenshot('canvas3d_perspective_after_add_cuboid'); // The cuboid displayed
            cy.compareImagesAndCheckResult(
                `${screenshotsPath}/canvas3d_perspective_before_all.png`,
                `${screenshotsPath}/canvas3d_perspective_after_add_cuboid.png`,
            );
        });

        it('Cuboid interaction by mouse.', () => {
            // The cuboid does not have time to change color so we make the mouse movement 3 times.
            cy.get('.cvat-canvas3d-perspective')
                .trigger('mousemove', 500, 200)
                .trigger('mousemove', 400, 200)
                .trigger('mousemove', 300, 200); // The cuboid should change a color after movement cursor from it
            cy.wait(1000);
            cy.get('.cvat-canvas3d-perspective').screenshot('canvas3d_perspective_after_cursor_movements_from_cuboid');
            cy.compareImagesAndCheckResult(
                `${screenshotsPath}/canvas3d_perspective_after_add_cuboid.png`,
                `${screenshotsPath}/canvas3d_perspective_after_cursor_movements_from_cuboid.png`,
            );

            // Move cursor to the cuboid. The cuboid does not have time to change color so we make the mouse movement 3 times
            cy.get('.cvat-canvas3d-perspective').trigger('mousemove').trigger('mousemove').trigger('mousemove');
            cy.wait(1000);
            cy.get('.cvat-canvas3d-perspective').screenshot('canvas3d_perspective_after_cursor_movements_to_cuboid');
            // The cuboid changed a color
            cy.compareImagesAndCheckResult(
                `${screenshotsPath}/canvas3d_perspective_after_cursor_movements_from_cuboid.png`,
                `${screenshotsPath}/canvas3d_perspective_after_cursor_movements_to_cuboid.png`,
            );
        });

        it('Top/side/front views should be changed afer dblclick on the cuboid on perspective view because of the drawing of the cuboid.', () => {
            cy.get('.cvat-canvas3d-perspective').dblclick(); // Dblclick on the cuboid
            // On the perspective view the cuboid should change a color also.
            cy.get('.cvat-canvas3d-perspective').screenshot('canvas3d_perspective_after_dblclick_on_cuboid');
            cy.compareImagesAndCheckResult(
                `${screenshotsPath}/canvas3d_perspective_after_cursor_movements_to_cuboid.png`,
                `${screenshotsPath}/canvas3d_perspective_after_dblclick_on_cuboid.png`,
            );

            ['topview', 'sideview', 'frontview'].forEach((view) => {
                cy.get(`.cvat-canvas3d-${view}`)
                    .find('.cvat-canvas3d-fullsize')
                    .screenshot(`canvas3d_${view}_show_cuboid`);
            });
            [
                ['canvas3d_topview_before_all.png', 'canvas3d_topview_show_cuboid.png'],
                ['canvas3d_sideview_before_all.png', 'canvas3d_sideview_show_cuboid.png'],
                ['canvas3d_frontview_before_all.png', 'canvas3d_frontview_show_cuboid.png'],
            ].forEach(([viewBefore, viewAfter]) => {
                cy.compareImagesAndCheckResult(`${screenshotsPath}/${viewBefore}`, `${screenshotsPath}/${viewAfter}`);
            });
        });
    });
});
