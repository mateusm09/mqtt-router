// eslint-disable-next-line no-undef
module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
    parserOptions: {
        ecmaVersion: 11,
        sourceType: 'module',
    },
    rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        'prefer-template': 1,
    },
    ignorePatterns: ['build/**/*.js'],
};
