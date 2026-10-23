const pluginCypress = require('eslint-plugin-cypress');

module.exports = [
  pluginCypress.configs.recommended,
  {
    languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
    rules: { 'cypress/no-unnecessary-waiting': 'error' },
  },
];
module.exports.push({ files: ['*.config.js'], languageOptions: { sourceType: 'commonjs' } });
module.exports.push({ files: ['scripts/**/*.mjs'], languageOptions: { sourceType: 'module', globals: { process: 'readonly', console: 'readonly' } } });
