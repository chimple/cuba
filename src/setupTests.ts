// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { mockAuthHandler } from "./tests/__mocks__/serviceConfigMock"

/* -----------------------------
   Browser API mocks
----------------------------- */

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ServiceConfig to avoid initializing real API handlers during tests
jest.mock("./services/ServiceConfig", () => ({
  ServiceConfig: {
    getI: () => ({
      apiHandler: {},
      authHandler: mockAuthHandler,
      switchMode: jest.fn(),
    }),
    getInstance: () => ({
      apiHandler: {},
      authHandler: mockAuthHandler,
    }),
  },
}));

// Mock our local Growthbook provider/hooks so components don't throw in tests
jest.mock("./growthbook/Growthbook", () => ({
  GbProvider: ({ children }: any) => children,
  useGbContext: () => ({ gbUpdated: false, setGbUpdated: jest.fn() }),
  updateLocalAttributes: jest.fn(),
}));
