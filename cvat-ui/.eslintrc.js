// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

module.exports = {
    env: {
        node: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaVersion: 6,
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
    },
    plugins: ['@typescript-eslint', 'import', 'prettier'],
    extends: [
        'plugin:@typescript-eslint/recommended',
        'airbnb-typescript',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
        'prettier',
        'prettier/react',
    ],
    ignorePatterns: ['.eslintrc.js'],
    rules: {
        '@typescript-eslint/indent': ['off', 4],
        '@typescript-eslint/lines-between-class-members': 0,
        'react/static-property-placement': ['error', 'static public field'],
        'react/jsx-indent': ['warn', 4],
        'react/jsx-indent-props': ['warn', 4],
        'react/jsx-props-no-spreading': 0,
        'react/jsx-wrap-multilines': ['error', {'declaration': false, 'assignment': false}],
        'implicit-arrow-linebreak': 0,
        'jsx-quotes': ['error', 'prefer-single'],
        'arrow-parens': ['error', 'always'],
        '@typescript-eslint/no-explicit-any': [0],
        '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true }],
        'no-restricted-syntax': [0, { selector: 'ForOfStatement' }],
        'no-plusplus': [0],
        'lines-between-class-members': [0],
        'react/no-did-update-set-state': 0, // https://github.com/airbnb/javascript/issues/1875
        quotes: ['error', 'single'],
        'max-len': ['error', { code: 120, ignoreStrings: true }],
        'func-names': ['warn', 'never'],
        'react/require-default-props': 'off',
        'react/no-unused-prop-types': 'off',
        'react/no-array-index-key': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/ban-types': [
            'error',
            {
                types: {
                    '{}': false, // TODO: try to fix with Record<string, unknown>
                    object: false, // TODO: try to fix with Record<string, unknown>
                    Function: false, // TODO: try to fix somehow
                },
            },
        ],
        'prettier/prettier': ['error'],
        'import/order': [
            'error',
            {
                'groups': ['builtin', 'external', 'internal'],
            }
        ]
    },
    settings: {
        'import/resolver': {
            node: {
                paths: ['src', `${__dirname}/src`],
            },
        },
    },
};
