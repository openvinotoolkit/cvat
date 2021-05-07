// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

/// <reference types="cypress" />

import { taskName } from '../../support/const_canvas3d';

context('Canvas 3D functionality. Control button. Mouse interaction.', () => {
    const caseId = '63';
    const screenshotsPath =
        'cypress/screenshots/canvas3d_functionality/case_63_canvas3d_functionality_control_button_mouse_interaction.js';

    function testPerspectiveChangeOnButtonClick(
        button,
        expectedTooltipText,
        screenshotNameBefore,
        screenshotNameAfter,
        arrow,
    ) {
        cy.get('.cvat-canvas3d-perspective').screenshot(screenshotNameBefore);
        arrow ? cy.get(button).click() : cy.contains('button', new RegExp(`^${button}$`)).click();
        cy.contains(expectedTooltipText).should('exist').and('be.visible'); // Check tooltip
        arrow
            ? cy.get(button).trigger('mouseout')
            : cy.contains('button', new RegExp(`^${button}$`)).trigger('mouseout');
        cy.contains(expectedTooltipText).should('not.exist');
        cy.get('.cvat-canvas3d-perspective').screenshot(screenshotNameAfter);
        cy.compareImagesAndCheckResult(
            `${screenshotsPath}/${screenshotNameBefore}.png`,
            `${screenshotsPath}/${screenshotNameAfter}.png`,
        );
    }

    before(() => {
        cy.openTaskJob(taskName);
    });

    describe(`Testing case "${caseId}"`, () => {
        it('Testing perspective visual regressions by clicking on the buttons with the mouse.', () => {
            testPerspectiveChangeOnButtonClick(
                '[aria-label="arrow-up"]',
                'Arrow Up',
                'before_click_uparrow',
                'after_click_uparrow',
                true,
            );
            testPerspectiveChangeOnButtonClick(
                '[aria-label="arrow-down"]',
                'Arrow Bottom',
                'before_click_bottomarrow',
                'after_click_bottomarrow',
                true,
            );
            testPerspectiveChangeOnButtonClick(
                '[aria-label="arrow-left"]',
                'Arrow Left',
                'before_click_leftarrow',
                'after_click_leftarrow',
                true,
            );
            testPerspectiveChangeOnButtonClick(
                '[aria-label="arrow-right"]',
                'Arrow Right',
                'before_click_rightarrow',
                'after_click_rightarrow',
                true,
            );
            testPerspectiveChangeOnButtonClick('U', 'Alt+U', 'before_click_move_up', 'after_click_move_up');
            testPerspectiveChangeOnButtonClick('O', 'Alt+O', 'before_click_move_down', 'after_click_move_down');
            testPerspectiveChangeOnButtonClick('I', 'Alt+I', 'before_click_zoom_in', 'after_click_zoom_in');
            testPerspectiveChangeOnButtonClick('K', 'Alt+K', 'before_click_zoom_out', 'after_click_zoom_out');
            testPerspectiveChangeOnButtonClick('J', 'Alt+J', 'before_click_move_left', 'after_click_move_left');
            testPerspectiveChangeOnButtonClick('L', 'Alt+L', 'before_click_move_right', 'after_click_move_right');
        });
    });
});
