import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type BadgeProgressState = {
  studentId: string | null;
  hasUnseenBadge: boolean;
};

const initialState: BadgeProgressState = {
  studentId: null,
  hasUnseenBadge: false,
};

export const badgeProgressSlice = createSlice({
  name: 'badgeProgress',
  initialState,
  reducers: {
    setBadgeProgress: (
      state,
      action: PayloadAction<{ studentId: string; hasUnseenBadge: boolean }>,
    ) => {
      // Keep the unseen flag scoped to the active child profile.
      state.studentId = action.payload.studentId;
      state.hasUnseenBadge = action.payload.hasUnseenBadge;
    },
    clearBadgeProgress: (state, action: PayloadAction<string>) => {
      // Ignore stale clear actions from a different child profile.
      if (state.studentId === action.payload) {
        state.hasUnseenBadge = false;
      }
    },
  },
});

export const { clearBadgeProgress, setBadgeProgress } =
  badgeProgressSlice.actions;
export default badgeProgressSlice.reducer;
