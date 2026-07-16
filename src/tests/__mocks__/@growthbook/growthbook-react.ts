type GrowthBookMockState = {
  attributes: Record<string, unknown>;
  features: Record<string, unknown>;
  flags: Record<string, boolean>;
};

const state: GrowthBookMockState = {
  attributes: {},
  features: {},
  flags: {},
};

export const __resetGrowthBookMock = () => {
  state.attributes = {};
  state.features = {};
  state.flags = {};
};

export const __setGrowthBookMock = (partial: Partial<GrowthBookMockState>) => {
  state.attributes = partial.attributes ?? state.attributes;
  state.features = partial.features ?? state.features;
  state.flags = partial.flags ?? state.flags;
};

export const __getGrowthBookMock = () => state;

export const useGrowthBook = () => ({
  setAttributes: jest.fn((attributes: Record<string, unknown>) => {
    state.attributes = attributes;
  }),
  getFeatureValue: (key: string, fallback: unknown) =>
    Object.prototype.hasOwnProperty.call(state.features, key)
      ? state.features[key]
      : fallback,
  getAttributes: () => state.attributes,
});

export const useFeatureIsOn = (key: string) => Boolean(state.flags[key]);

export const useFeatureValue = (key: string, fallback: unknown) =>
  Object.prototype.hasOwnProperty.call(state.features, key)
    ? state.features[key]
    : fallback;
