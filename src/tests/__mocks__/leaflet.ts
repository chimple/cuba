/* Minimal mock for leaflet used in tests.
   Provides `Icon.Default.prototype`, `Icon.Default.mergeOptions` and `latLngBounds`.
*/

const Icon = {
  Default: {
    prototype: {},
    mergeOptions: jest.fn(),
  },
};

export const latLngBounds = (arr: any) => arr;

const L = {
  Icon,
  latLngBounds,
};

export default L;
