import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from './utils/axiosClient'


export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/user/register', userData);
      return response.data; // { message, email }
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      return rejectWithValue(message);
    }
  }
);

// New: Resend OTP Thunk
export const resendOTP = createAsyncThunk(
  'auth/resendOTP',
  async (email, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/user/resendOTP', { email });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to resend OTP";
      return rejectWithValue(message);
    }
  }
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/user/verifyOTP', { email, otp });
      return response.data.user;
    } catch (error) {
      const message = error.response?.data?.message || "OTP verification failed";
      return rejectWithValue(message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/user/login', credentials);
      return response.data.user;
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      return rejectWithValue(message);
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/check',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get('/user/check');
      return data.user;
    } catch (error) {
      if (error.response?.status === 401) return rejectWithValue(null);
      return rejectWithValue(error);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await axiosClient.post('/user/logout');
      return null;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    authChecked: false,
    pendingVerificationEmail: localStorage.getItem("pendingEmail") || null,
    isNewlyRegistered: false
  },
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
    //updated
    setUser: (state, action) => {
      state.user = action.payload;
    },
    clearPendingUser: (state) => {
      state.pendingVerificationEmail = null;
      localStorage.removeItem("pendingEmail");
    }
  },
  extraReducers: (builder) => {
    builder
      // Register User Cases
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.authChecked = true; 
        state.pendingVerificationEmail = action.payload.email;
        // Persist the email so refresh doesn't break the flow
        localStorage.setItem("pendingEmail", action.payload.email);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Registration failed";
        state.isAuthenticated = false;
        state.user = null;
        state.authChecked = true;
      })
  

      // --- RESEND OTP ---
      .addCase(resendOTP.pending, (state) => {
        state.resendLoading = true;
        state.error = null;
      })
      .addCase(resendOTP.fulfilled, (state) => {
        state.resendLoading = false;
      })
      .addCase(resendOTP.rejected, (state, action) => {
        state.resendLoading = false;
        state.error = action.payload;
      })





      //otp verification

      .addCase(verifyOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = !!action.payload;
        state.user = action.payload;
        state.pendingVerificationEmail = null;
        state.authChecked = true;
        state.isNewlyRegistered = true;
        localStorage.removeItem("pendingEmail");
      })

      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })



      // Login User Cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = !!action.payload;
        state.user = action.payload;
        state.authChecked = true;
        state.isNewlyRegistered = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Something went wrong';
        state.isAuthenticated = false;
        state.user = null;
        state.authChecked = true;
      })
  


      // Check Auth Cases
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = !!action.payload;
        state.user = action.payload;
        state.authChecked = true;
        state.isNewlyRegistered = false;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        // state.error = action.payload?.message || 'Something went wrong';
        state.error = null;
        state.isAuthenticated = false;
        state.user = null;
        state.authChecked = true;
      })
  


      // Logout User Cases
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.authChecked = true;
        state.isNewlyRegistered = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
        state.isAuthenticated = false;
        state.user = null;
        state.authChecked = true; 
      });
  }
});

export default authSlice.reducer;
export const { resetError, setUser, clearPendingUser } = authSlice.actions;