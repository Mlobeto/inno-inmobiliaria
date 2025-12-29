module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src/__tests__'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.js$',
  moduleFileExtensions: ['js', 'json', 'node'],
};