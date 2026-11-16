import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type CampaignRewardsState = {
  studentId: string | null;
  hasUnseenCertificate: boolean;
};

const initialState: CampaignRewardsState = {
  studentId: null,
  hasUnseenCertificate: false,
};

export const campaignRewardsSlice = createSlice({
  name: 'campaignRewards',
  initialState,
  reducers: {
    setCampaignRewardsState: (
      state,
      action: PayloadAction<{
        studentId: string;
        hasUnseenCertificate: boolean;
      }>,
    ) => {
      state.studentId = action.payload.studentId;
      state.hasUnseenCertificate = action.payload.hasUnseenCertificate;
    },
    clearUnseenCertificate: (state, action: PayloadAction<string>) => {
      if (state.studentId === action.payload)
        state.hasUnseenCertificate = false;
    },
  },
});

export const { clearUnseenCertificate, setCampaignRewardsState } =
  campaignRewardsSlice.actions;
export default campaignRewardsSlice.reducer;
