module.exports = {
  // ...other ESLint settings
  plugins: [
    'import',
    '@typescript-eslint'
  ],
  extends: [
    // ...other extensions
    'plugin:import/recommended',
    'plugin:import/typescript'
  ],
  rules: {
    'import/no-unresolved': 'error'
  },
  settings: {
    'import/resolver': {
      typescript: true,
      node: true,
    }
  }
};
