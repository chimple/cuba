import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GrowthBookAttributes } from '../../../common/constants';

export interface GrowthbookState {
  attributes: Record<string, any>;
  featureValues: Record<string, any>;
}

const getInitialState = (): GrowthbookState => {
  try {
    const raw = localStorage.getItem(GrowthBookAttributes);
    const parsed = raw ? JSON.parse(raw) : {};
    const { __featureValues, ...attributes } = parsed ?? {};

    return {
      attributes:
        attributes && typeof attributes === 'object' ? attributes : {},
      featureValues:
        __featureValues && typeof __featureValues === 'object'
          ? __featureValues
          : {},
    };
  } catch {
    return {
      attributes: {},
      featureValues: {},
    };
  }
};

const initialState: GrowthbookState = getInitialState();

export const growthbookSlice = createSlice({
  name: 'growthbook',
  initialState,
  reducers: {
    mergeGrowthbookAttributes: (
      state,
      action: PayloadAction<Record<string, any>>,
    ) => {
      state.attributes = {
        ...state.attributes,
        ...action.payload,
      };
    },
    setGrowthbookFeatureValue: (
      state,
      action: PayloadAction<{ key: string; value: any }>,
    ) => {
      state.featureValues[action.payload.key] = action.payload.value;
    },
  },
});

export const { mergeGrowthbookAttributes, setGrowthbookFeatureValue } =
  growthbookSlice.actions;

export default growthbookSlice.reducer;
