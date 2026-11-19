/* Minimal mock for leaflet used in tests.
   Provides `Icon.Default.prototype`, `Icon.Default.mergeOptions`, `latLngBounds` and `icon`.
*/

const Icon = {
  Default: {
    prototype: {},
    mergeOptions: jest.fn(),
  },
};

export const icon = (options: unknown) => ({ options });

export const latLngBounds = (arr: any) => arr;

const L = {
  icon,
  Icon,
  latLngBounds,
};

export default L;
