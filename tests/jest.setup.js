/**
 * Jest setup file for Claude Code integration tests
 */

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock console methods to reduce noise during testing
const originalConsole = console;

beforeAll(() => {
  // Only show errors and warnings during tests
  console.log = jest.fn();
  console.info = jest.fn();
  console.debug = jest.fn();
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

afterAll(() => {
  // Restore console methods
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
});

// Global test utilities
global.delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
global.waitForCondition = async (condition, timeout = 5000, interval = 100) => {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return true;
    }
    await global.delay(interval);
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
};

// Environment checks
const checkEnvironment = () => {
  const requiredEnvVars = [
    // Add required environment variables here
  ];
  
  const missing = requiredEnvVars.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
    console.warn('Some tests may be skipped');
  }
};

// Network connectivity check
const checkConnectivity = async () => {
  // Basic connectivity check for integration tests
  try {
    // This could ping the server or check internet connectivity
    return true;
  } catch (error) {
    console.warn('Network connectivity issues detected');
    return false;
  }
};

// Initialize test environment
beforeAll(async () => {
  checkEnvironment();
  await checkConnectivity();
});

// Clean up after tests
afterEach(() => {
  // Clean up any test artifacts
  jest.clearAllTimers();
});