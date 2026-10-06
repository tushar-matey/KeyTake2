module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn'
  },
  overrides: [
    {
      files: ['client/**/*.ts', 'client/**/*.tsx'],
      extends: [
        'plugin:react-hooks/recommended'
      ]
    }
  ]
};
