// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

/// <reference types="cypress" />

context('Overlap size.', () => {
    const caseId = '75';
    const labelName = `Case ${caseId}`;
    const taskName = labelName;
    const attrName = `Attr for ${labelName}`;
    const textDefaultValue = 'Some default value for type Text';
    const imagesCount = 10;
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
    const advancedConfigurationParams = {
        multiJobs: true,
        segmentSize: 5,
        overlapSize: 3,
    };
    const calculatedOverlapSize = advancedConfigurationParams.segmentSize - advancedConfigurationParams.overlapSize;

    before(() => {
        cy.visit('auth/login');
        cy.login();
        cy.imageGenerator(imagesFolder, imageFileName, width, height, color, posX, posY, labelName, imagesCount);
        cy.createZipArchive(directoryToArchive, archivePath);
        cy.createAnnotationTask(
            taskName,
            labelName,
            attrName,
            textDefaultValue,
            archiveName,
            false,
            advancedConfigurationParams,
        );
        cy.openTask(taskName);
    });

    after(() => {
        cy.goToTaskList();
        cy.deleteTask(taskName);
    });

    describe(`Testing case "${caseId}"`, () => {
        it('The task parameters is correct.', () => {
            cy.get('.cvat-task-parameters').within(() => {
                cy.get('table')
                    .find('tr')
                    .last()
                    .find('td')
                    .then(($taskParameters) => {
                        expect(Number($taskParameters[0].innerText)).equal(calculatedOverlapSize);
                        expect(Number($taskParameters[1].innerText)).equal(advancedConfigurationParams.segmentSize);
                    });
            });
        });

        it('The range of frame values corresponds to the parameters.', () => {
            cy.getJobNum(0).then(($job) => {
                cy.contains('a', `Job #${$job}`)
                    .parents('tr')
                    .find('.cvat-job-item-frames')
                    .then(($frameRange) => {
                        expect(Number($frameRange.text().split('-')[1])).equal(
                            advancedConfigurationParams.segmentSize - 1,
                        ); // expected 4 to equal 4
                    });
            });
            cy.getJobNum(1).then(($job) => {
                cy.contains('a', `Job #${$job}`)
                    .parents('tr')
                    .find('.cvat-job-item-frames')
                    .then(($frameRange) => {
                        expect(Number($frameRange.text().split('-')[0])).equal(
                            advancedConfigurationParams.segmentSize - 2,
                        ); // expected 3 to equal 3
                    });
            });
        });

        it('The range of frame values in a job corresponds to the parameters.', () => {
            cy.openJob(0);
            cy.get('.cvat-player-frame-selector').find('input[role="spinbutton"]').should('have.value', '0');
            cy.get('.cvat-player-last-button').click();
            cy.get('.cvat-player-frame-selector')
                .find('input[role="spinbutton"]')
                .should('have.value', advancedConfigurationParams.segmentSize - 1); // expected <input.ant-input-number-input> to have value '4'
            cy.interactMenu('Open the task');
            cy.openJob(1);
            cy.get('.cvat-player-frame-selector')
                .find('input[role="spinbutton"]')
                .should('have.value', advancedConfigurationParams.segmentSize - calculatedOverlapSize); // expected <input.ant-input-number-input> to have value '3'
            cy.get('.cvat-player-last-button').click();
            cy.get('.cvat-player-frame-selector')
                .find('input[role="spinbutton"]')
                .should('have.value', advancedConfigurationParams.segmentSize + calculatedOverlapSize); // expected <input.ant-input-number-input> to have value '7'
        });
    });
});
