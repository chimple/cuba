type GrowthBookMockState = {
  attributes: Record<string, unknown>;
  features: Record<string, unknown>;
  flags: Record<string, boolean>;
};

const growthBookMockGlobal = globalThis as typeof globalThis & {
  __growthBookMockState__?: GrowthBookMockState;
};

const state =
  growthBookMockGlobal.__growthBookMockState__ ??
  (growthBookMockGlobal.__growthBookMockState__ = {
    attributes: {},
    features: {},
    flags: {},
  });

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

export const useGrowthBook = jest.fn(() => ({
  setAttributes: jest.fn((attributes: Record<string, unknown>) => {
    state.attributes = attributes;
  }),
  getFeatureValue: (key: string, fallback: unknown) =>
    Object.prototype.hasOwnProperty.call(state.features, key)
      ? state.features[key]
      : fallback,
  getAttributes: () => state.attributes,
}));

export const useFeatureIsOn = jest.fn((key: string) =>
  Boolean(state.flags[key]),
);

export const useFeatureValue = jest.fn((key: string, fallback: unknown) =>
  Object.prototype.hasOwnProperty.call(state.features, key)
    ? state.features[key]
    : fallback,
);
