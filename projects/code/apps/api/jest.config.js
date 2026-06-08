/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '../tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@psiclinica/types$': '<rootDir>/../../packages/types/src',
  },
  collectCoverageFrom: ['**/*.ts', '!**/*.module.ts', '!**/main.ts'],
  coverageDirectory: '../coverage',
}
