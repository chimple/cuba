/* Manual Jest mock for @capacitor/geolocation
   - Exports `Geolocation` with mocked methods used in the codebase:
     - checkPermissions, requestPermissions, watchPosition, clearWatch
   - Provides `__watches` and `__emit` helpers tests can use to simulate location updates
*/

export const __watches: Record<string, any> = {};

export const Geolocation = {
  checkPermissions: jest.fn(async () => ({ location: "granted" })),
  requestPermissions: jest.fn(async () => ({ location: "granted" })),

  // watchPosition resolves with an id and stores the callback so tests can invoke it
  watchPosition: jest.fn(async (options: any, cb: (pos: any, err?: any) => void) => {
    const id = `mock-${Object.keys(__watches).length + 1}`;
    __watches[id] = { options, cb };
    return id;
  }),

  clearWatch: jest.fn(({ id }: { id: string }) => {
    delete __watches[id];
  }),

  // Helper for tests to emit a position to the saved watcher
  __emit(id: string, position: any) {
    if (__watches[id] && typeof __watches[id].cb === "function") {
      __watches[id].cb(position);
    }
  },
};
