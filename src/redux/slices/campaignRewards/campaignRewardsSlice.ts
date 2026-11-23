import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CampaignCertificateData } from '../../../components/campaignCertificate/campaignCertificate.types';

export const CURRENT_STUDENT_CERTIFICATE_KEY = '__current_student__';

type CampaignRewardsState = {
  studentId: string | null;
  hasUnseenCertificate: boolean;
  isProfileSelectionInProgress: boolean;
  pendingCertificates: Record<string, CampaignCertificateData>;
};

const initialState: CampaignRewardsState = {
  studentId: null,
  hasUnseenCertificate: false,
  isProfileSelectionInProgress: false,
  pendingCertificates: {},
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
    setCertificateProfileSelectionInProgress: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.isProfileSelectionInProgress = action.payload;
    },
    queueCampaignCertificate: (
      state,
      action: PayloadAction<CampaignCertificateData>,
    ) => {
      const certificate = action.payload;
      const studentKey =
        certificate.studentId ?? CURRENT_STUDENT_CERTIFICATE_KEY;
      state.pendingCertificates[studentKey] = certificate;
    },
    clearPendingCampaignCertificate: (state, action: PayloadAction<string>) => {
      delete state.pendingCertificates[action.payload];
    },
  },
});

export const {
  clearPendingCampaignCertificate,
  clearUnseenCertificate,
  queueCampaignCertificate,
  setCertificateProfileSelectionInProgress,
  setCampaignRewardsState,
} = campaignRewardsSlice.actions;
export default campaignRewardsSlice.reducer;
