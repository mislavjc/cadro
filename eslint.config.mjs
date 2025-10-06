import prettierPlugin from 'eslint-plugin-prettier';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tsparser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

const eslintConfig = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsparser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'react-hooks': reactHooksPlugin,
      'simple-import-sort': simpleImportSortPlugin,
      prettier: prettierPlugin,
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Import sorting
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Packages `react` related packages come first.
            ['^react', '^@?\\w'],
            // Database
            ['^(|db)(/.*|$)'],
            // Server actions
            ['^(|actions)(/.*|$)'],
            // UI components
            ['^(|ui)(/.*|$)'],
            // Internal packages.
            ['^(|components)(/.*|$)'],
            // hooks
            ['^(|hooks)(/.*|$)'],
            // Lib
            ['^(|lib)(/.*|$)'],
            // APi
            ['^(|api)(/.*|$)'],
            // Utils
            ['^(|utils)(/.*|$)'],
            // Types
            ['^(|types)(/.*|$)'],
            // Public files
            ['^(|public)(/.*|$)'],
            // Side effect imports.
            ['^\\u0000'],
            // Parent imports. Put `..` last.
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            // Other relative imports. Put same-folder imports and `.` last.
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            // Style imports.
            ['^.+\\.?(css)$'],
          ],
        },
      ],

      // Prettier
      'prettier/prettier': 'error',

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
];

export default eslintConfig;
