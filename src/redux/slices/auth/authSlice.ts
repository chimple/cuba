import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TableTypes } from "../../../common/constants";
import { RoleType } from "../../../interface/modelInterfaces";
import { createTransform } from "redux-persist";

export interface AuthErrors {
  phone: string | null;
  student: string | null;
  email: string | null;
  otp: string | null;
  general: string | null;
}

export interface AuthState {
  authUser: any | null; // Supabase auth user
  user: TableTypes<"user"> | null; // App DB user
  refreshToken: string | null;
  isOpsUser: boolean;
  roles: string[];
  loading: boolean;
  error: AuthErrors;
}

const initialErrorState: AuthErrors = {
  phone: null,
  student: null,
  email: null,
  otp: null,
  general: null,
};

const initialState: AuthState = {
  authUser: null,
  user: null,
  refreshToken: null,
  isOpsUser: false,
  roles: [],
  loading: false,
  error: initialErrorState,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Allows setting a specific error by key
    setAuthError: (
      state,
      action: PayloadAction<{ key: keyof AuthErrors; message: string | null }>,
    ) => {
      state.error[action.payload.key] = action.payload.message;
    },

    // Clear all errors (useful when switching tabs or logging out)
    clearAllAuthErrors: (state) => {
      state.error = initialErrorState;
    },

    setAuthUser: (state, action: PayloadAction<any | null>) => {
      state.authUser = action.payload;
    },

    setUser: (state, action: PayloadAction<TableTypes<"user"> | null>) => {
      state.user = action.payload;
    },

    setRefreshToken: (state, action: PayloadAction<string | null>) => {
      state.refreshToken = action.payload;
    },

    setRoles: (state, action: PayloadAction<string[]>) => {
      state.roles = action.payload;
    },

    addRole: (state, action: PayloadAction<RoleType>) => {
      if (!state.roles.includes(action.payload)) {
        state.roles.push(action.payload);
      }
    },

    setIsOpsUser: (state, action: PayloadAction<boolean>) => {
      state.isOpsUser = action.payload;
    },

    logout: (state) => {
      state.authUser = null;
      state.user = null;
      state.refreshToken = null;
      state.roles = [];
      state.isOpsUser = false;
      state.loading = false;
      state.error = initialErrorState;
    },
  },
});

export const authTransform = createTransform(
  (inboundState: any) => {
    const { error, ...rest } = inboundState;
    return rest; // remove error before persisting
  },
  (outboundState: any) => ({
    ...outboundState,
    error: {
      phone: null,
      student: null,
      email: null,
      otp: null,
      general: null,
    },
    loading: false,
  }),
  { whitelist: ["auth"] },
);

export const {
  setAuthLoading,
  setAuthError,
  setAuthUser,
  setUser,
  setRefreshToken,
  setRoles,
  addRole,
  setIsOpsUser,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
