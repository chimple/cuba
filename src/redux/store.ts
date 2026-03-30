import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, PersistConfig } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authreducer, { authTransform } from './slices/auth/authSlice';
import growthbookReducer from './slices/growthbook/growthbookSlice';
import { GrowthBookAttributes } from '../common/constants';

const rootReducer = combineReducers({
  auth: authreducer,
  growthbook: growthbookReducer,
});

const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  storage,
  version: 1,
  whitelist: ['auth', 'growthbook'],
  transforms: [authTransform],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create the Redux store with the persisted reducer
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

let lastSerializedGrowthbookState = '';
store.subscribe(() => {
  try {
    const growthbookState = store.getState().growthbook;
    if (!growthbookState) return;

    const serialized = JSON.stringify({
      ...growthbookState.attributes,
      __featureValues: growthbookState.featureValues,
    });

    if (serialized === lastSerializedGrowthbookState) return;
    lastSerializedGrowthbookState = serialized;
    localStorage.setItem(GrowthBookAttributes, serialized);
  } catch {
    // Ignore persistence failures; Redux remains the runtime source of truth.
  }
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
