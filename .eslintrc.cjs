/**
 * ESLint 配置 - 水果分选包装车间监控面板
 * 采用 Vue3 + TypeScript 推荐规则集，确保代码规范一致性
 */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Vue 规则
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'off',
    'vue/require-default-prop': 'off',
    'vue/attribute-hyphenation': 'off',
    'vue/v-on-event-hyphenation': 'off',
    'vue/custom-event-name-camelcase': 'off',
    'vue/no-unused-properties': 'off',
    // 纯样式类规则放宽为警告，避免过度干扰
    'vue/max-attributes-per-line': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/html-self-closing': 'off',
    'vue/attributes-order': 'warn',
    'vue/html-indent': 'off',
    'vue/html-closing-bracket-newline': 'off',
    // TypeScript 规则
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    // 基础规则交由 TypeScript 处理
    'no-unused-vars': 'off',
    'no-undef': 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.config.js', 'eslint.config.cjs'],
}
