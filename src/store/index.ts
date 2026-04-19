// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import vulnerabilitiesReducer, { vulnerabilitiesInitialState } from './vulnerabilitiesSlice';
import comparisonReducer, { comparisonInitialState } from './comparisonSlice';
import preferencesReducer, {
  loadPersistedPreferences,
  createPreferencesPersistMiddleware,
  createSortSyncMiddleware,
} from './preferencesSlice';

const persistedPreferences = loadPersistedPreferences();

export const store = configureStore({
  reducer: {
    vulnerabilities: vulnerabilitiesReducer,
    comparison: comparisonReducer,
    preferences: preferencesReducer,
  },
  preloadedState: {
    preferences: persistedPreferences,
    vulnerabilities: {
      ...vulnerabilitiesInitialState,
      filters: {
        ...vulnerabilitiesInitialState.filters,
        sortField: persistedPreferences.defaultSortField,
        sortDirection: persistedPreferences.defaultSortDirection,
      },
    },
    comparison: comparisonInitialState,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Disable serializable check -- 236k records in state would make
      // this check extremely slow on every dispatch
      serializableCheck: false,
      immutabilityCheck: false,
    })
      .concat(createSortSyncMiddleware())
      .concat(createPreferencesPersistMiddleware()),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;