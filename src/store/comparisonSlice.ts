// src/store/comparisonSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const MAX_COMPARE_SELECTION = 5;

interface ComparisonState {
  ids: string[];
}

export const comparisonInitialState: ComparisonState = {
  ids: [],
};

const comparisonSlice = createSlice({
  name: 'comparison',
  initialState: comparisonInitialState,
  reducers: {
    compareIdToggled(state, action: PayloadAction<string>) {
      const id = action.payload;
      const idx = state.ids.indexOf(id);
      if (idx >= 0) {
        state.ids.splice(idx, 1);
      } else if (state.ids.length < MAX_COMPARE_SELECTION) {
        state.ids.push(id);
      }
    },
    compareIdRemoved(state, action: PayloadAction<string>) {
      state.ids = state.ids.filter((i) => i !== action.payload);
    },
    compareSelectionCleared(state) {
      state.ids = [];
    },
  },
});

export const { compareIdToggled, compareIdRemoved, compareSelectionCleared } =
  comparisonSlice.actions;

export default comparisonSlice.reducer;
