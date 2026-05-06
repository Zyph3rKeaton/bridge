const config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json', useESM: false }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testMatch: [
    '<rootDir>/__tests__/ocrParser.test.ts',
    '<rootDir>/__tests__/newSession.test.tsx',
    '<rootDir>/__tests__/settings.test.tsx',
  ],
  testPathIgnorePatterns: ['<rootDir>/tests/'],
};

export default config;
