import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import astroPlugin from 'eslint-plugin-astro';
import * as astroEslintParser from 'astro-eslint-parser';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

// Patch to trim whitespace from global keys
function safeTrimGlobals(obj) {
    if (!obj) return {};
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.trim(), v]));
}

export default [
    // Ignore build output and other non-source files
    {
        ignores: [
            'dist/',
            'public/',
            'node_modules/',
            'playwright-report/',
            'test-results/',
            '**/*.min.js',
            '**/*.min.css',
            '**/package-lock.json',
            '**/yarn.lock',
            '**/pnpm-lock.yaml',
            '.astro/**',
            // Claude Code worktrees are full checkouts of this repository (#191).
            '.claude/worktrees/',
        ],
    },

    // Base JS & TypeScript Config
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...safeTrimGlobals(globals.browser),
                ...safeTrimGlobals(globals.node),
                ...safeTrimGlobals(globals.es2021),
            },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-unused-expressions': 'off',
            'no-empty': ['error', { allowEmptyCatch: true }],
            '@typescript-eslint/no-this-alias': 'off',
            'no-prototype-builtins': 'off',
            'no-constant-binary-expression': 'off',
            'no-cond-assign': 'off',
            'no-setter-return': 'off',
            'no-control-regex': 'off',
        },
    },

    // Astro config
    {
        files: ['**/*.astro'],
        languageOptions: {
            parser: astroEslintParser,
            parserOptions: {
                parser: tseslint.parser, // Uses the typed parser from the import
                extraFileExtensions: ['.astro'],
            },
            globals: {
                ...safeTrimGlobals(globals.browser),
                ...safeTrimGlobals(globals.node),
                ...safeTrimGlobals(globals.es2021),
            },
        },
        plugins: {
            astro: astroPlugin,
        },
        rules: {
            ...astroPlugin.configs.recommended.rules,
            ...astroPlugin.configs['jsx-a11y-recommended'].rules,
        },
    },

    // Prettier should be last to override other formatting rules
    prettier,
];
