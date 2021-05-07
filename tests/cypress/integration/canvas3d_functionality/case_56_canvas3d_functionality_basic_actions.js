// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

/// <reference types="cypress" />

import { taskName } from '../../support/const_canvas3d';

// Firefox does not yet support WebGL in headless mode: https://bugzilla.mozilla.org/show_bug.cgi?id=1375585 (disabled in the cypress_cron_type.json)
context('Canvas 3D functionality. Basic actions.', () => {
    const caseId = '56';
    const screenshotsPath =
        'cypress/screenshots/canvas3d_functionality/case_56_canvas3d_functionality_basic_actions.js';

    function testPerspectiveChangeOnKeyPress(key, screenshotNameBefore, screenshotNameAfter) {
        cy.get('.cvat-canvas3d-perspective').trigger('mouseover').screenshot(screenshotNameBefore);
        cy.get('body').type(`{alt}${key}`);
        cy.get('.cvat-canvas3d-perspective').screenshot(screenshotNameAfter);
        cy.compareImagesAndCheckResult(
            `${screenshotsPath}/${screenshotNameBefore}.png`,
            `${screenshotsPath}/${screenshotNameAfter}.png`,
        );
    }

    function testPerspectiveChangeOnArrowKeyPress(key, screenshotNameBefore, screenshotNameAfter) {
        cy.get('.cvat-canvas3d-perspective').trigger('mouseover').screenshot(screenshotNameBefore);
        cy.get('body').type(key);
        cy.get('.cvat-canvas3d-perspective').screenshot(screenshotNameAfter);
        cy.compareImagesAndCheckResult(
            `${screenshotsPath}/${screenshotNameBefore}.png`,
            `${screenshotsPath}/${screenshotNameAfter}.png`,
        );
    }

    function testPerspectiveChangeOnWheel(screenshotNameBefore, screenshotNameAfter) {
        cy.get('.cvat-canvas3d-perspective').screenshot(screenshotNameBefore);
        for (let i = 0; i < 3; i++) {
            cy.get('.cvat-canvas3d-perspective').trigger('wheel', { deltaY: -50 });
        }
        cy.get('.cvat-canvas3d-perspective').screenshot(screenshotNameAfter);
        cy.compareImagesAndCheckResult(
            `${screenshotsPath}/${screenshotNameBefore}.png`,
            `${screenshotsPath}/${screenshotNameAfter}.png`,
        );
    }

    function testTopSideFrontChangeOnWheel(element, screenshotNameBefore, screenshotNameAfter) {
        cy.get(element).find('.cvat-canvas3d-fullsize').screenshot(screenshotNameBefore);
        for (let i = 0; i < 3; i++) {
            cy.get(element).trigger('wheel', { deltaY: -100 });
        }
        cy.get(element).find('.cvat-canvas3d-fullsize').screenshot(screenshotNameAfter);
        cy.compareImagesAndCheckResult(
            `${screenshotsPath}/${screenshotNameBefore}.png`,
            `${screenshotsPath}/${screenshotNameAfter}.png`,
        );
    }

    function testContextImage() {
        cy.get('.cvat-context-image-wrapper img').should('exist').and('be.visible');
        cy.get('.cvat-context-image-switcher').click(); // Context image hide
        cy.get('.cvat-context-image-wrapper img').should('not.exist');
        cy.get('.cvat-context-image-switcher').click(); // Context image show
    }

    function testControlButtonTooltip(button, expectedTooltipText) {
        cy.get(button).trigger('mouseover');
        cy.contains(expectedTooltipText).should('exist').and('be.visible'); // Check tooltip
        cy.get(button).trigger('mouseout');
        cy.contains(expectedTooltipText).should('not.exist');
    }

    before(() => {
        cy.openTaskJob(taskName);
    });

    describe(`Testing case "${caseId}"`, () => {
        it('Check existing of elements.', () => {
            cy.get('.cvat-canvas3d-perspective')
                .should('exist')
                .and('be.visible')
                .within(() => {
                    cy.get('.cvat-canvas3d-perspective-arrow-directions')
                        .should('exist')
                        .and('be.visible')
                        .within(() => {
                            cy.get('[aria-label="arrow-up"]').should('exist').and('be.visible');
                            cy.get('[aria-label="arrow-left"]').should('exist').and('be.visible');
                            cy.get('[aria-label="arrow-down"]').should('exist').and('be.visible');
                            cy.get('[aria-label="arrow-right"]').should('exist').and('be.visible');
                        });
                    cy.get('.cvat-canvas3d-perspective-directions')
                        .should('exist')
                        .and('be.visible')
                        .within(() => {
                            cy.contains('button', 'U').should('exist').and('be.visible');
                            cy.contains('button', 'I').should('exist').and('be.visible');
                            cy.contains('button', 'O').should('exist').and('be.visible');
                            cy.contains('button', 'J').should('exist').and('be.visible');
                            cy.contains('button', 'K').should('exist').and('be.visible');
                            cy.contains('button', 'L').should('exist').and('be.visible');
                        });
                });
            cy.get('.cvat-canvas3d-topview').should('exist').and('be.visible');
            cy.get('.cvat-canvas3d-sideview').should('exist').and('be.visible');
            cy.get('.cvat-canvas3d-frontview').should('exist').and('be.visible');
            cy.get('.cvat-canvas-controls-sidebar')
                .find('[role="img"]')
                .then(($controlButtons) => {
                    expect($controlButtons.length).to.be.equal(3);
                });
            cy.get('.cvat-canvas-controls-sidebar')
                .should('exist')
                .and('be.visible')
                .within(() => {
                    cy.get('.cvat-move-control').should('exist').and('be.visible');
                    cy.get('.cvat-cursor-control').should('exist').and('be.visible');
                    cy.get('.cvat-draw-cuboid-control').should('exist').and('be.visible');
                });
            [
                ['.cvat-move-control', 'Move the image'],
                ['.cvat-cursor-control', 'Cursor [Esc]'],
            ].forEach(([button, tooltip]) => {
                testControlButtonTooltip(button, tooltip);
            });
        });

        it('Check workspace selector.', () => {
            // Try to click on the disabled workspace selectors. The value of the selector should not changed.
            cy.get('.cvat-workspace-selector').should('contain.text', 'Standard 3D').click();
            for (const dropdownItems of [
                '[title="Attribute annotation"]',
                '[title="Tag annotation"]',
                '[title="Review"]',
            ]) {
                cy.get('.cvat-workspace-selector-dropdown')
                    .not('.ant-select-dropdown-hidden')
                    .within(() => {
                        cy.get(dropdownItems).click();
                    });
                cy.get('.cvat-workspace-selector').should('contain.text', 'Standard 3D');
            }
        });

        it('Interaction with the frame change buttons.', () => {
            cy.get('.cvat-player-last-button').click();
            cy.checkFrameNum(2);
            cy.get('.cvat-player-filename-wrapper').should('contain.text', '000003.pcd');
            testContextImage(); // Check context image on the last frame
            cy.get('.cvat-player-first-button').click();
            cy.checkFrameNum(0);
            cy.get('.cvat-player-filename-wrapper').should('contain.text', '000001.pcd');
            testContextImage(); // Check context image on the firts frame
            cy.get('.cvat-player-forward-button').click();
            cy.checkFrameNum(2);
            cy.get('.cvat-player-filename-wrapper').should('contain.text', '000003.pcd');
            cy.get('.cvat-player-backward-button').click();
            cy.checkFrameNum(0);
            cy.get('.cvat-player-filename-wrapper').should('contain.text', '000001.pcd');
            cy.get('.cvat-player-next-button').click();
            cy.checkFrameNum(1);
            cy.get('.cvat-player-filename-wrapper').should('contain.text', '000002.pcd');
            testContextImage(); // Check context image on the second frame
            cy.get('.cvat-player-previous-button').click();
            cy.checkFrameNum(0);
            cy.get('.cvat-player-filename-wrapper').should('contain.text', '000001.pcd');
            cy.get('.cvat-player-play-button').click();
            cy.checkFrameNum(2);
            cy.get('.cvat-player-filename-wrapper').should('contain.text', '000003.pcd');
            cy.get('.cvat-player-first-button').click(); // Return to first frame
        });

        it('Testing perspective visual regressions.', () => {
            testPerspectiveChangeOnKeyPress('u', 'before_press_altU', 'after_press_altU');
            testPerspectiveChangeOnKeyPress('o', 'before_press_altO', 'after_press_altO');
            testPerspectiveChangeOnKeyPress('i', 'before_press_altI', 'after_press_altI');
            testPerspectiveChangeOnKeyPress('k', 'before_press_altK', 'after_press_altK');
            testPerspectiveChangeOnKeyPress('j', 'before_press_altJ', 'after_press_altJ');
            testPerspectiveChangeOnKeyPress('l', 'before_press_altL', 'after_press_altL');
            testPerspectiveChangeOnArrowKeyPress('{uparrow}', 'before_press_uparrow', 'after_press_uparrow');
            testPerspectiveChangeOnArrowKeyPress('{downarrow}', 'before_press_downarrow', 'after_press_downarrow');
            testPerspectiveChangeOnArrowKeyPress('{leftarrow}', 'before_press_leftarrow', 'after_press_leftarrow');
            testPerspectiveChangeOnArrowKeyPress('{rightarrow}', 'before_press_rightarrow', 'after_press_rightarrow');
            testPerspectiveChangeOnWheel('perspective_before_wheel', 'perspective_after_wheel');
        });

        it('Testing top/side/front views visual regressions.', () => {
            testTopSideFrontChangeOnWheel('.cvat-canvas3d-topview', 'topview_before_wheel', 'topview_after_wheel');
            testTopSideFrontChangeOnWheel('.cvat-canvas3d-sideview', 'sideview_before_wheel', 'sideview_after_wheel');
            testTopSideFrontChangeOnWheel(
                '.cvat-canvas3d-frontview',
                'frontview_before_wheel',
                'frontview_after_wheel',
            );
        });
    });
});
