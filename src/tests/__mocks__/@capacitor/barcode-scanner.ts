export const BarcodeScanner = {
  checkPermission: jest.fn().mockResolvedValue({ granted: true }),
  startScan: jest.fn().mockResolvedValue({ hasContent: false }),
  stopScan: jest.fn(),
};
