// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import vulnerabilitiesReducer from './vulnerabilitiesSlice';

export const store = configureStore({
  reducer: {
    vulnerabilities: vulnerabilitiesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Disable serializable check -- 236k records in state would make
      // this check extremely slow on every dispatch
      serializableCheck: false,
      immutabilityCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;