/**
 * Registers path aliases → dist/* for `node dist/main/server.js`.
 * (TypeScript path mappings point at src/*; compiled JS lives under dist/.)
 */
const path = require('node:path');
const { register } = require('tsconfig-paths');

register({
  baseUrl: path.join(__dirname),
  paths: {
    '@domain/*': ['dist/domain/*'],
    '@data/*': ['dist/data/*'],
    '@infra/*': ['dist/infra/*'],
    '@presentation/*': ['dist/presentation/*'],
    '@validation/*': ['dist/validation/*'],
    '@main/*': ['dist/main/*'],
  },
});
