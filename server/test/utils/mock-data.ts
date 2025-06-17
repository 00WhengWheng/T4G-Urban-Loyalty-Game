export function createMockScanData() {
  return {
    userId: 'mock-user-id',
    nfcTagId: 'mock-nfc-tag-id',
    timestamp: new Date().toISOString(),
  };
}
