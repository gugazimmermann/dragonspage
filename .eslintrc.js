module.exports = {
    env: {
      browser: true,
      es2020: true,
    },
    extends: ['plugin:@typescript-eslint/recommended', 'prettier/@typescript-eslint', 'plugin:prettier/recommended'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 11,
      sourceType: 'module',
      project: './tsconfig.json',
    },
    plugins: ['@typescript-eslint'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: true,
          },
        },
      ],
      '@typescript-eslint/no-floating-promises': ['error'],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  };