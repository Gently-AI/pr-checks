import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/', 'lib/', 'node_modules/', 'coverage/', '**/*.js'],
  },
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['src/*.test.ts'],
          defaultProject: 'tsconfig.test.json',
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
);
