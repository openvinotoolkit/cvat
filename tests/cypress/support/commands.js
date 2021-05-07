// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

/// <reference types="cypress" />

require('cypress-file-upload');
require('../plugins/imageGenerator/imageGeneratorCommand');
require('../plugins/createZipArchive/createZipArchiveCommand');
require('cypress-localstorage-commands');
require('../plugins/compareImages/compareImagesCommand');

let selectedValueGlobal = '';

Cypress.Commands.add('login', (username = Cypress.env('user'), password = Cypress.env('password')) => {
    cy.get('[placeholder="Username"]').type(username);
    cy.get('[placeholder="Password"]').type(password);
    cy.get('[type="submit"]').click();
    cy.url().should('match', /\/tasks$/);
    cy.document().then((doc) => {
        const loadSettingFailNotice = Array.from(doc.querySelectorAll('.cvat-notification-notice-load-settings-fail'));
        loadSettingFailNotice.length > 0 ? cy.closeNotification('.cvat-notification-notice-load-settings-fail') : null;
    });
});

Cypress.Commands.add('logout', (username = Cypress.env('user')) => {
    cy.get('.cvat-right-header').within(() => {
        cy.get('.cvat-header-menu-dropdown').should('have.text', username).trigger('mouseover', { which: 1 });
    });
    cy.get('span[aria-label="logout"]').click();
    cy.url().should('include', '/auth/login');
    cy.visit('/auth/login'); // clear query parameter "next"
    cy.closeModalUnsupportedPlatform();
});

Cypress.Commands.add('userRegistration', (firstName, lastName, userName, emailAddr, password) => {
    cy.get('#firstName').type(firstName);
    cy.get('#lastName').type(lastName);
    cy.get('#username').type(userName);
    cy.get('#email').type(emailAddr);
    cy.get('#password1').type(password);
    cy.get('#password2').type(password);
    cy.get('.register-form-button').click();
    if (Cypress.browser.family === 'chromium') {
        cy.url().should('include', '/tasks');
    }
});

Cypress.Commands.add('deletingRegisteredUsers', (accountToDelete) => {
    cy.request({
        method: 'POST',
        url: '/api/v1/auth/login',
        body: {
            username: Cypress.env('user'),
            email: Cypress.env('email'),
            password: Cypress.env('password'),
        },
    }).then((responce) => {
        const authKey = responce['body']['key'];
        cy.request({
            url: '/api/v1/users?page_size=all',
            headers: {
                Authorization: `Token ${authKey}`,
            },
        }).then((responce) => {
            const responceResult = responce['body']['results'];
            for (const user of responceResult) {
                const userId = user['id'];
                const userName = user['username'];
                for (const account of accountToDelete) {
                    if (userName === account) {
                        cy.request({
                            method: 'DELETE',
                            url: `/api/v1/users/${userId}`,
                            headers: {
                                Authorization: `Token ${authKey}`,
                            },
                        });
                    }
                }
            }
        });
    });
});

Cypress.Commands.add(
    'createAnnotationTask',
    (
        taskName = 'New annotation task',
        labelName = 'Some label',
        attrName = 'Some attr name',
        textDefaultValue = 'Some default value for type Text',
        image = 'image.png',
        multiAttrParams,
        advancedConfigurationParams,
        forProject = false,
        attachToProject = false,
        projectName,
        expectedResult = 'success',
    ) => {
        cy.get('#cvat-create-task-button').click({ force: true });
        cy.url().should('include', '/tasks/create');
        cy.get('[id="name"]').type(taskName);
        if (!forProject) {
            cy.get('.cvat-constructor-viewer-new-item').click();
            cy.get('[placeholder="Label name"]').type(labelName);
            cy.get('.cvat-new-attribute-button').click();
            cy.get('[placeholder="Name"]').type(attrName);
            cy.get('.cvat-attribute-type-input').click();
            cy.get('.cvat-attribute-type-input-text').click();
            cy.get('[placeholder="Default value"]').type(textDefaultValue);
            if (multiAttrParams) {
                cy.updateAttributes(multiAttrParams);
            }
            cy.contains('button', 'Done').click();
        } else {
            if (attachToProject) {
                cy.get('.cvat-project-search-field').click();
                cy.get('.ant-select-dropdown')
                    .not('.ant-select-dropdown-hidden')
                    .within(() => {
                        cy.get(`.ant-select-item-option[title="${projectName}"]`).click();
                    });
            }
            cy.get('.cvat-project-search-field').within(() => {
                cy.get('[type="search"]').should('have.value', projectName);
            });
            cy.get('.cvat-constructor-viewer-new-item').should('not.exist');
        }
        cy.get('input[type="file"]').attachFile(image, { subjectType: 'drag-n-drop' });
        if (advancedConfigurationParams) {
            cy.advancedConfiguration(advancedConfigurationParams);
        }
        cy.contains('button', 'Submit').click();
        if (expectedResult === 'success') {
            cy.contains('The task has been created');
        }
        if (!forProject) {
            cy.goToTaskList();
        } else {
            cy.goToProjectsList();
        }
    },
);

Cypress.Commands.add('openTask', (taskName) => {
    cy.contains('strong', taskName).parents('.cvat-tasks-list-item').contains('a', 'Open').click({ force: true });
    cy.get('.cvat-task-details').should('exist');
});

Cypress.Commands.add('saveJob', (method = 'PATCH', status = 200, as = 'saveJob') => {
    cy.intercept(method, '/api/v1/jobs/**').as(as);
    cy.get('button').contains('Save').click({ force: true });
    cy.wait(`@${as}`).its('response.statusCode').should('equal', status);
});

Cypress.Commands.add('getJobNum', (jobID) => {
    cy.get('.cvat-task-jobs-table')
        .contains(/^0-/)
        .parents('.cvat-task-jobs-table-row')
        .find('td')
        .eq(0)
        .invoke('text')
        .then(($tdText) => {
            return Number($tdText.match(/\d+/g)) + jobID;
        });
});

Cypress.Commands.add('openJob', (jobID = 0, removeAnnotations = true, expectedFail = false) => {
    cy.getJobNum(jobID).then(($job) => {
        cy.get('.cvat-task-jobs-table-row').contains('a', `Job #${$job}`).click();
    });
    cy.url().should('include', '/jobs');
    expectedFail
        ? cy.get('.cvat-canvas-container').should('not.exist')
        : cy.get('.cvat-canvas-container').should('exist');
    if (removeAnnotations) {
        cy.document().then((doc) => {
            const objects = Array.from(doc.querySelectorAll('.cvat_canvas_shape'));
            if (typeof objects !== 'undefined' && objects.length > 0) {
                cy.removeAnnotations();
                cy.saveJob('PUT');
            }
        });
    }
});

Cypress.Commands.add('openTaskJob', (taskName, jobID = 0, removeAnnotations = true, expectedFail = false) => {
    cy.openTask(taskName);
    cy.openJob(jobID, removeAnnotations, expectedFail);
});

Cypress.Commands.add('interactControlButton', (objectType) => {
    cy.get('body').focus();
    cy.get(`.cvat-${objectType}-control`).trigger('mouseleave').trigger('mouseout').trigger('mouseover');
});

Cypress.Commands.add('createRectangle', (createRectangleParams) => {
    cy.interactControlButton('draw-rectangle');
    cy.switchLabel(createRectangleParams.labelName, 'draw-rectangle');
    cy.get('.cvat-draw-rectangle-popover-visible').within(() => {
        cy.get('.ant-select-selection-item').then(($labelValue) => {
            selectedValueGlobal = $labelValue.text();
        });
        cy.contains('.ant-radio-wrapper', createRectangleParams.points).click();
        cy.contains('button', createRectangleParams.type).click();
    });
    cy.get('.cvat-canvas-container')
        .click(createRectangleParams.firstX, createRectangleParams.firstY)
        .click(createRectangleParams.secondX, createRectangleParams.secondY);
    if (createRectangleParams.points === 'By 4 Points') {
        cy.get('.cvat-canvas-container')
            .click(createRectangleParams.thirdX, createRectangleParams.thirdY)
            .click(createRectangleParams.fourthX, createRectangleParams.fourthY);
    }
    cy.checkObjectParameters(createRectangleParams, 'RECTANGLE');
});

Cypress.Commands.add('switchLabel', (labelName, objectType) => {
    cy.get(`.cvat-${objectType}-popover-visible`).find('.ant-select-selection-item').click();
    cy.get('.ant-select-dropdown')
        .not('.ant-select-dropdown-hidden')
        .find(`.ant-select-item-option[title="${labelName}"]`)
        .click();
});

Cypress.Commands.add('checkObjectParameters', (objectParameters, objectType) => {
    cy.get('.cvat-draw-shape-popover').should('be.hidden');
    let listCanvasShapeId = [];
    cy.document().then((doc) => {
        const listCanvasShape = Array.from(doc.querySelectorAll('.cvat_canvas_shape'));
        for (let i = 0; i < listCanvasShape.length; i++) {
            listCanvasShapeId.push(listCanvasShape[i].id.match(/\d+$/));
        }
        const maxId = Math.max(...listCanvasShapeId);
        cy.get(`#cvat_canvas_shape_${maxId}`).should('exist').and('be.visible');
        cy.get(`#cvat-objects-sidebar-state-item-${maxId}`)
            .should('contain', maxId)
            .and('contain', `${objectType} ${objectParameters.type.toUpperCase()}`)
            .within(() => {
                cy.get('.ant-select-selection-item').should('have.text', selectedValueGlobal);
            });
    });
});

Cypress.Commands.add('createPoint', (createPointParams) => {
    cy.interactControlButton('draw-points');
    cy.switchLabel(createPointParams.labelName, 'draw-points');
    cy.get('.cvat-draw-points-popover-visible').within(() => {
        cy.get('.ant-select-selection-item').then(($labelValue) => {
            selectedValueGlobal = $labelValue.text();
        });
        if (createPointParams.numberOfPoints) {
            createPointParams.complete = false;
            cy.get('.ant-input-number-input').clear().type(createPointParams.numberOfPoints);
        }
        cy.contains('button', createPointParams.type).click();
    });
    createPointParams.pointsMap.forEach((element) => {
        cy.get('.cvat-canvas-container').click(element.x, element.y);
    });
    if (createPointParams.complete) {
        const keyCodeN = 78;
        cy.get('.cvat-canvas-container')
            .trigger('keydown', { keyCode: keyCodeN })
            .trigger('keyup', { keyCode: keyCodeN });
    }
    cy.checkObjectParameters(createPointParams, 'POINTS');
});

Cypress.Commands.add('changeAppearance', (colorBy) => {
    cy.get('.cvat-appearance-color-by-radio-group').within(() => {
        cy.get('[type="radio"]').check(colorBy, { force: true });
    });
});

Cypress.Commands.add('shapeGrouping', (firstX, firstY, lastX, lastY) => {
    const keyCodeG = 71;
    cy.get('.cvat-canvas-container')
        .trigger('keydown', { keyCode: keyCodeG })
        .trigger('keyup', { keyCode: keyCodeG })
        .trigger('mousedown', firstX, firstY, { which: 1 })
        .trigger('mousemove', lastX, lastY)
        .trigger('mouseup', lastX, lastY)
        .trigger('keydown', { keyCode: keyCodeG })
        .trigger('keyup', { keyCode: keyCodeG });
});

Cypress.Commands.add('createPolygon', (createPolygonParams) => {
    if (!createPolygonParams.reDraw) {
        cy.interactControlButton('draw-polygon');
        cy.switchLabel(createPolygonParams.labelName, 'draw-polygon');
        cy.get('.cvat-draw-polygon-popover-visible').within(() => {
            cy.get('.ant-select-selection-item').then(($labelValue) => {
                selectedValueGlobal = $labelValue.text();
            });
            if (createPolygonParams.numberOfPoints) {
                createPolygonParams.complete = false;
                cy.get('.ant-input-number-input').clear().type(createPolygonParams.numberOfPoints);
            }
            cy.contains('button', createPolygonParams.type).click();
        });
    }
    createPolygonParams.pointsMap.forEach((element) => {
        cy.get('.cvat-canvas-container').click(element.x, element.y);
    });
    if (createPolygonParams.complete) {
        const keyCodeN = 78;
        cy.get('.cvat-canvas-container')
            .trigger('keydown', { keyCode: keyCodeN })
            .trigger('keyup', { keyCode: keyCodeN });
    }
    cy.checkObjectParameters(createPolygonParams, 'POLYGON');
});

Cypress.Commands.add('openSettings', () => {
    cy.get('.cvat-right-header').find('.cvat-header-menu-dropdown').trigger('mouseover', { which: 1 });
    cy.get('.anticon-setting').click();
    cy.get('.cvat-settings-modal').should('be.visible');
});

Cypress.Commands.add('closeSettings', () => {
    cy.get('.cvat-settings-modal').within(() => {
        cy.contains('button', 'Close').click();
    });
    cy.get('.cvat-settings-modal').should('not.be.visible');
});

Cypress.Commands.add('saveSettings', () => {
    cy.get('.cvat-settings-modal').within(() => {
        cy.contains('button', 'Save').click();
    });
});

Cypress.Commands.add('changeWorkspace', (mode, labelName) => {
    cy.get('.cvat-workspace-selector').click();
    cy.get('.cvat-workspace-selector-dropdown').within(() => {
        cy.get(`.ant-select-item-option[title="${mode}"]`).click();
    });

    cy.get('.cvat-workspace-selector').should('contain.text', mode);
    cy.changeLabelAAM(labelName);
});

Cypress.Commands.add('changeLabelAAM', (labelName) => {
    cy.get('.cvat-workspace-selector').then((value) => {
        const cvatWorkspaceSelectorValue = value.text();
        if (cvatWorkspaceSelectorValue.includes('Attribute annotation')) {
            cy.get('.cvat-attribute-annotation-sidebar-basics-editor').within(() => {
                cy.get('.ant-select-selector').click();
            });
            cy.get('.ant-select-dropdown')
                .not('.ant-select-dropdown-hidden')
                .within(() => {
                    cy.get(`.ant-select-item-option[title="${labelName}"]`).click();
                });
        }
    });
});

Cypress.Commands.add('createCuboid', (createCuboidParams) => {
    cy.interactControlButton('draw-cuboid');
    cy.switchLabel(createCuboidParams.labelName, 'draw-cuboid');
    cy.get('.cvat-draw-cuboid-popover-visible').within(() => {
        cy.get('.ant-select-selection-item').then(($labelValue) => {
            selectedValueGlobal = $labelValue.text();
        });
        cy.contains(createCuboidParams.points).click();
        cy.contains('button', createCuboidParams.type).click();
    });
    cy.get('.cvat-canvas-container').click(createCuboidParams.firstX, createCuboidParams.firstY);
    cy.get('.cvat-canvas-container').click(createCuboidParams.secondX, createCuboidParams.secondY);
    if (createCuboidParams.points === 'By 4 Points') {
        cy.get('.cvat-canvas-container').click(createCuboidParams.thirdX, createCuboidParams.thirdY);
        cy.get('.cvat-canvas-container').click(createCuboidParams.fourthX, createCuboidParams.fourthY);
    }
    cy.checkObjectParameters(createCuboidParams, 'CUBOID');
});

Cypress.Commands.add('updateAttributes', (multiAttrParams) => {
    let cvatAttributeInputsWrapperId = [];
    cy.get('.cvat-new-attribute-button').click();
    cy.document().then((doc) => {
        const cvatAttributeInputsWrapperList = Array.from(doc.querySelectorAll('.cvat-attribute-inputs-wrapper'));
        for (let i = 0; i < cvatAttributeInputsWrapperList.length; i++) {
            cvatAttributeInputsWrapperId.push(cvatAttributeInputsWrapperList[i].getAttribute('cvat-attribute-id'));
        }

        const minId = Math.min(...cvatAttributeInputsWrapperId);

        cy.get(`[cvat-attribute-id="${minId}"]`).within(() => {
            cy.get('.cvat-attribute-name-input').type(multiAttrParams.additionalAttrName);
            cy.get('.cvat-attribute-type-input').click();
        });
        cy.get('.ant-select-dropdown')
            .not('.ant-select-dropdown-hidden')
            .within(() => {
                cy.get(`.ant-select-item-option[title="${multiAttrParams.typeAttribute}"]`).click();
            });

        if (multiAttrParams.typeAttribute === 'Text' || multiAttrParams.typeAttribute === 'Number') {
            cy.get(`[cvat-attribute-id="${minId}"]`).within(() => {
                if (multiAttrParams.additionalValue !== '') {
                    cy.get('.cvat-attribute-values-input').type(multiAttrParams.additionalValue);
                } else {
                    cy.get('.cvat-attribute-values-input').clear();
                }
            });
        } else if (multiAttrParams.typeAttribute === 'Radio') {
            cy.get(`[cvat-attribute-id="${minId}"]`).within(() => {
                cy.get('.cvat-attribute-values-input').type(`${multiAttrParams.additionalValue}{Enter}`);
            });
        } else if (multiAttrParams.typeAttribute === 'Checkbox') {
            cy.get(`[cvat-attribute-id="${minId}"]`).within(() => {
                cy.get('.cvat-attribute-values-input').click();
            });
            cy.get('.ant-select-dropdown')
                .not('.ant-select-dropdown-hidden')
                .within(() => {
                    cy.get(`.ant-select-item-option[title="${multiAttrParams.additionalValue}"]`).click();
                });
        }
        if (multiAttrParams.mutable) {
            cy.get('.cvat-attribute-mutable-checkbox')
                .find('[type="checkbox"]')
                .should('not.be.checked')
                .check()
                .should('be.checked');
        }
    });
});

Cypress.Commands.add('createPolyline', (createPolylineParams) => {
    cy.interactControlButton('draw-polyline');
    cy.switchLabel(createPolylineParams.labelName, 'draw-polyline');
    cy.get('.cvat-draw-polyline-popover-visible').within(() => {
        cy.get('.ant-select-selection-item').then(($labelValue) => {
            selectedValueGlobal = $labelValue.text();
        });
        if (createPolylineParams.numberOfPoints) {
            createPolylineParams.complete = false;
            cy.get('.ant-input-number-input').clear().type(createPolylineParams.numberOfPoints);
        }
        cy.contains('button', createPolylineParams.type).click();
    });
    createPolylineParams.pointsMap.forEach((element) => {
        cy.get('.cvat-canvas-container').click(element.x, element.y);
    });
    if (createPolylineParams.complete) {
        const keyCodeN = 78;
        cy.get('.cvat-canvas-container')
            .trigger('keydown', { keyCode: keyCodeN })
            .trigger('keyup', { keyCode: keyCodeN });
    }
    cy.checkObjectParameters(createPolylineParams, 'POLYLINE');
});

Cypress.Commands.add('deleteTask', (taskName) => {
    let taskId = '';
    cy.contains('.cvat-item-task-name', taskName)
        .parents('.cvat-task-item-description')
        .find('.cvat-item-task-id')
        .then(($taskId) => {
            taskId = $taskId.text().replace(/[^\d]/g, '');
            cy.contains('.cvat-item-task-name', taskName)
                .parents('.cvat-tasks-list-item')
                .find('.cvat-menu-icon')
                .trigger('mouseover');
            cy.get('.cvat-actions-menu').contains('Delete').click();
            cy.get('.cvat-modal-confirm-delete-task')
                .should('contain', `The task ${taskId} will be deleted`)
                .within(() => {
                    cy.contains('button', 'Delete').click();
                });
        });
});

Cypress.Commands.add('advancedConfiguration', (advancedConfigurationParams) => {
    cy.contains('Advanced configuration').click();
    if (advancedConfigurationParams.multiJobs) {
        cy.get('#segmentSize').type(advancedConfigurationParams.segmentSize);
    }
    if (advancedConfigurationParams.sssFrame) {
        cy.get('#startFrame').type(advancedConfigurationParams.startFrame);
        cy.get('#stopFrame').type(advancedConfigurationParams.stopFrame);
        cy.get('#frameStep').type(advancedConfigurationParams.frameStep);
    }
    if (advancedConfigurationParams.chunkSize) {
        cy.get('#dataChunkSize').type(advancedConfigurationParams.chunkSize);
    }

    if (advancedConfigurationParams.overlapSize) {
        cy.get('#overlapSize').type(advancedConfigurationParams.overlapSize);
    }
});

Cypress.Commands.add('removeAnnotations', () => {
    cy.contains('.cvat-annotation-header-button', 'Menu').click();
    cy.get('.cvat-annotation-menu').within(() => {
        cy.contains('Remove annotations').click();
    });
    cy.get('.cvat-modal-confirm-remove-annotation').within(() => {
        cy.contains('button', 'Delete').click();
    });
});

Cypress.Commands.add('goToTaskList', () => {
    cy.get('a[value="tasks"]').click();
    cy.url().should('include', '/tasks');
});

Cypress.Commands.add('changeColorViaBadge', (labelColor) => {
    cy.get('.cvat-label-color-picker')
        .not('.ant-popover-hidden')
        .within(() => {
            cy.contains('hex').prev().clear().type(labelColor);
            cy.contains('button', 'Ok').click();
        });
});

Cypress.Commands.add('collectLabelsName', () => {
    let listCvatConstructorViewerItemText = [];
    cy.get('.cvat-constructor-viewer').should('exist');
    cy.document().then((doc) => {
        const labels = Array.from(doc.querySelectorAll('.cvat-constructor-viewer-item'));
        for (let i = 0; i < labels.length; i++) {
            listCvatConstructorViewerItemText.push(labels[i].textContent);
        }
        return listCvatConstructorViewerItemText;
    });
});

Cypress.Commands.add('addNewLabel', (newLabelName, additionalAttrs, labelColor) => {
    cy.collectLabelsName().then((labelsNames) => {
        if (labelsNames.indexOf(newLabelName) === -1) {
            cy.contains('button', 'Add label').click();
            cy.get('[placeholder="Label name"]').type(newLabelName);
            if (labelColor) {
                cy.get('.cvat-change-task-label-color-badge').click();
                cy.changeColorViaBadge(labelColor);
            }
            if (additionalAttrs) {
                for (let i = 0; i < additionalAttrs.length; i++) {
                    cy.updateAttributes(additionalAttrs[i]);
                }
            }
            cy.contains('button', 'Done').click();
        }
    });
});

Cypress.Commands.add('addNewLabelViaContinueButton', (additionalLabels) => {
    cy.collectLabelsName().then((labelsNames) => {
        if (additionalLabels.some((el) => labelsNames.indexOf(el) === -1)) {
            cy.get('.cvat-constructor-viewer-new-item').click();
            for (let j = 0; j < additionalLabels.length; j++) {
                cy.get('[placeholder="Label name"]').type(additionalLabels[j]);
                if (j !== additionalLabels.length - 1) {
                    cy.contains('button', 'Continue').click();
                } else {
                    cy.contains('button', 'Done').click();
                }
            }
        }
    });
});

Cypress.Commands.add('createTag', (labelName) => {
    cy.interactControlButton('setup-tag');
    cy.switchLabel(labelName, 'setup-tag');
    cy.get('.cvat-setup-tag-popover-visible').within(() => {
        cy.get('button').click();
    });
});

Cypress.Commands.add('sidebarItemSortBy', (sortBy) => {
    cy.get('.cvat-objects-sidebar-ordering-selector').click();
    cy.get('.cvat-objects-sidebar-ordering-dropdown').within(() => {
        cy.get(`.ant-select-item-option[title="${sortBy}"]`).click();
    });
});

Cypress.Commands.add('goToRegisterPage', () => {
    cy.get('a[href="/auth/register"]').click();
    cy.url().should('include', '/auth/register');
});

Cypress.Commands.add('getScaleValue', () => {
    cy.get('#cvat_canvas_background')
        .should('have.attr', 'style')
        .then(($styles) => {
            return Number($styles.match(/scale\((\d\.\d+)\)/m)[1]);
        });
});

Cypress.Commands.add('goCheckFrameNumber', (frameNum) => {
    cy.get('.cvat-player-frame-selector').within(() => {
        cy.get('input[role="spinbutton"]')
            .clear({ force: true })
            .type(`${frameNum}{Enter}`, { force: true })
            .should('have.value', frameNum);
    });
});

Cypress.Commands.add('checkFrameNum', (frameNum) => {
    cy.get('.cvat-player-frame-selector').within(() => {
        cy.get('input[role="spinbutton"]').should('have.value', frameNum);
    });
});

Cypress.Commands.add('goToNextFrame', (expectedFrameNum) => {
    cy.get('.cvat-player-next-button').click();
    cy.checkFrameNum(expectedFrameNum);
});

Cypress.Commands.add('goToPreviousFrame', (expectedFrameNum) => {
    cy.get('.cvat-player-previous-button').click();
    cy.checkFrameNum(expectedFrameNum);
});

Cypress.Commands.add('interactMenu', (choice) => {
    cy.contains('.cvat-annotation-header-button', 'Menu').click();
    cy.get('.cvat-annotation-menu').within(() => {
        cy.contains(new RegExp(`^${choice}$`, 'g')).click();
    });
});

Cypress.Commands.add('closeNotification', (className) => {
    cy.get(className).find('span[aria-label="close"]').click();
    cy.get(className).should('not.exist');
});

Cypress.Commands.add('getObjectIdNumberByLabelName', (labelName) => {
    cy.document().then((doc) => {
        const stateItemLabelSelectorList = Array.from(
            doc.querySelectorAll('.cvat-objects-sidebar-state-item-label-selector'),
        );
        for (let i = 0; i < stateItemLabelSelectorList.length; i++) {
            if (stateItemLabelSelectorList[i].textContent === labelName) {
                cy.get(stateItemLabelSelectorList[i])
                    .parents('.cvat-objects-sidebar-state-item')
                    .should('have.attr', 'id')
                    .then((id) => {
                        return Number(id.match(/\d+$/));
                    });
            }
        }
    });
});

Cypress.Commands.add('closeModalUnsupportedPlatform', () => {
    if (Cypress.browser.family !== 'chromium') {
        cy.get('.cvat-modal-unsupported-platform-warning').within(() => {
            cy.contains('button', 'OK').click();
        });
    }
});
