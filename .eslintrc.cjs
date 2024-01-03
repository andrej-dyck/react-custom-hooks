module.exports = {
  root: true,
  env: {browser: true, es2022: true},
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'vite.config.ts'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    /* formatting */
    indent: ['warn', 2, {'SwitchCase': 1}],
    quotes: ['warn', 'single'],
    semi: ['warn', 'never'],
    'comma-dangle': ['warn', { arrays: 'always-multiline', objects: 'always-multiline', imports: 'only-multiline', functions: 'never' }],
    'space-unary-ops': ['warn'],
    'consistent-return': ['warn'],
    'eol-last': ['warn'],
    'no-else-return': ['warn'],
    'no-empty-function': ['warn'],
    'no-multiple-empty-lines': ['warn', {max: 1}],
    'no-trailing-spaces': ['warn'],
    'object-curly-spacing': ['warn', 'always'],
    /* react */
    'react-refresh/only-export-components': [
      'warn',
      {allowConstantExport: true},
    ],
  },
  overrides: [{
    files: ['**/*.ts', '**/*.tsx'],
    plugins: ['@typescript-eslint'],
    extends: [
      'plugin:@typescript-eslint/strict-type-checked',
      'plugin:@typescript-eslint/stylistic-type-checked',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: ['./**/tsconfig.json'],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-confusing-void-expression': [
        'error',
        {ignoreArrowShorthand: true},
      ],
      '@typescript-eslint/prefer-readonly': ['warn'],
      '@typescript-eslint/space-before-blocks': ['error'],
      '@typescript-eslint/switch-exhaustiveness-check': ['warn'],
      '@typescript-eslint/type-annotation-spacing': [
        'error',
        {
          before: false,
          after: true,
          overrides: {arrow: {before: true, after: true}},
        },
      ],
    },
  }],
}
