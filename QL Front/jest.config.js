module.exports = {
  preset: 'react-native',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  testPathIgnorePatterns: ['/node_modules/', '/build/'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
};