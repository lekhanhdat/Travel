module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      files: ['genimg.js', 'genimgsvg.js'],
      parser: 'espree',
      parserOptions: {ecmaVersion: 2020},
    },
  ],
  rules: {
    'prettier/prettier': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    semi: 'off',
    'react-native/no-inline-styles': 'off',
  },
};
