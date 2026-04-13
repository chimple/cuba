// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { mockAuthHandler } from './tests/__mocks__/serviceConfigMock';

jest.mock('@testing-library/react', () => {
  const originalModule = jest.requireActual('@testing-library/react');
  const React = require('react');
  const { Provider } = require('react-redux');
  const { configureStore } = require('@reduxjs/toolkit');
  const authreducer = require('./redux/slices/auth/authSlice').default;

  return {
    ...originalModule,
    render: (ui: any, options: any = {}) => {
      const growthbookReducer =
        require('./redux/slices/growthbook/growthbookSlice').default;
      const store =
        options?.store ??
        configureStore({
          reducer: { auth: authreducer, growthbook: growthbookReducer },
          middleware: (getDefaultMiddleware: any) =>
            getDefaultMiddleware({ serializableCheck: false }),
        });
      const OriginalWrapper = options?.wrapper;
      const Wrapper = ({ children }: any) => {
        const providerContent = React.createElement(
          Provider,
          { store },
          children,
        );
        return OriginalWrapper
          ? React.createElement(OriginalWrapper, null, providerContent)
          : providerContent;
      };

      return originalModule.render(ui, { ...options, wrapper: Wrapper });
    },
  };
});

/* -----------------------------
   Browser API mocks
----------------------------- */

Object.defineProperty(window, 'matchMedia', {
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
jest.mock('./services/ServiceConfig', () => ({
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
jest.mock('./growthbook/Growthbook', () => ({
  GbProvider: ({ children }: any) => children,
  useGbContext: () => ({ gbUpdated: false, setGbUpdated: jest.fn() }),
  updateLocalAttributes: jest.fn(),
  setCachedGrowthBookFeatureValue: jest.fn(),
  getCachedGrowthBookFeatureValue: jest.fn(),
}));

// Jest runs in CommonJS mode and cannot parse import.meta.url worker constructors.
// Mock worker clients so tests can execute main-thread fallback logic safely.
jest.mock('./workers/backgroundWorkerClient', () => {
  const runBackgroundWorkerTask = jest.fn(
    async (type: string, payload: any) => {
      switch (type) {
        case 'PREPARE_BINARY_FROM_BASE64': {
          const base64 = payload?.base64 ?? '';
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
          }
          return {
            byteLength: bytes.byteLength,
            sha256Hex: '',
            arrayBuffer: bytes.buffer,
          };
        }
        case 'PLAN_HOT_UPDATE_FILES':
          return { copyFromPreviousPaths: [], downloadFromServerPaths: [] };
        case 'PREPARE_GROWTHBOOK_ATTRIBUTES':
          return payload?.attributes ?? {};
        case 'PREPARE_SYNC_BATCHES':
          return { tableBatches: {}, rowCountByTable: {}, payloadSizeBytes: 0 };
        case 'PREPARE_BULK_UPLOAD_PAYLOAD':
          return [];
        case 'PARSE_XLSX_SHEETS':
          return { sheetNames: [], sheets: {} };
        case 'BUILD_XLSX_FILE':
          return { fileBuffer: new ArrayBuffer(0) };
        case 'DOWNLOAD_STICKER_BOOK_SVG': {
          const response = await fetch(payload?.url ?? '');
          return {
            svgText: await response.text(),
          };
        }
        default:
          return {};
      }
    },
  );

  return {
    runBackgroundWorkerTask,
    runBackgroundWorkerTaskWithProgress: runBackgroundWorkerTask,
  };
});

jest.mock('./workers/mediaCompressionWorkerClient', () => ({
  runMediaCompressionTask: jest.fn(async (_type: string, file: File) => file),
  terminateMediaCompressionWorker: jest.fn(),
}));
