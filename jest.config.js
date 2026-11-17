// Jest configuration. It lives here (not in package.json) so the project has a single place for it;
// do not also add a "jest" key to package.json.
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  collectCoverageFrom: ['src/utils/**/*.ts', 'src/constants/**/*.ts', 'src/services/users.ts'],
};
