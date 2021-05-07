// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

/// <reference types="cypress" />

context('Reset password notification.', () => {
    const caseId = '73';
    const dummyEmail = 'admin@local.local';

    before(() => {
        cy.visit('auth/login');
    });

    describe(`Testing case "${caseId}"`, () => {
        it('"Forgot password?" link available.', () => {
            cy.get('a[href="/auth/password/reset"]').should('exist').and('be.visible').click();
        });

        it('Sending a password reset request', () => {
            cy.get('#email').type(dummyEmail);
            cy.get('.cvat-reset-password-form-button').click();
            cy.contains('Check your email').should('be.visible');
        });
    });
});
