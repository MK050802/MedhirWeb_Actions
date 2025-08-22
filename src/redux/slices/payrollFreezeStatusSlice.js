import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { getItemFromSessionStorage } from "./sessionStorageSlice";
import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();

// Async thunk to check payroll freeze status
export const checkPayrollFreezeStatus = createAsyncThunk(
  "payrollFreezeStatus/check",
  async ({ companyId, year, month }, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);

      
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Get API URL with fallback
      const apiURL = publicRuntimeConfig?.apiURL || "http://localhost:8083";

      
      const fullURL = `${apiURL}/api/payroll-freeze-status/check/${companyId}/${year}/${month}`;


      const response = await axios.get(fullURL, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });


      return response.data;
    } catch (error) {
      if (error.response) {
        // Server responded with error status
        return rejectWithValue({
          message: error.response.data?.message || "Failed to check payroll freeze status",
          status: error.response.status,
          data: error.response.data,
        });
      } else if (error.request) {
        // Request made but no response received
        return rejectWithValue({
          message: "No response from server. Please check your connection.",
          status: 0,
        });
      } else {
        // Something else happened
        return rejectWithValue({
          message: error.message || "An unexpected error occurred",
          status: 0,
        });
      }
    }
  }
);

// Async thunk to create/update payroll freeze status
export const createPayrollFreezeStatus = createAsyncThunk(
  "payrollFreezeStatus/create",
  async (freezeStatusData, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Get API URL with fallback
      const apiURL = publicRuntimeConfig?.apiURL || "http://localhost:8083";
      const fullURL = `${apiURL}/api/payroll-freeze-status`;

      const response = await axios.post(fullURL, freezeStatusData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        // Server responded with error status
        return rejectWithValue({
          message: error.response.data?.message || "Failed to create payroll freeze status",
          status: error.response.status,
          data: error.response.data,
        });
      } else if (error.request) {
        // Request made but no response received
        return rejectWithValue({
          message: "No response from server. Please check your connection.",
          status: 0,
        });
      } else {
        // Something else happened
        return rejectWithValue({
          message: error.message || "An unexpected error occurred",
          status: 0,
        });
      }
    }
  }
);

// Initial state
const initialState = {
  // Check freeze status
  checkLoading: false,
  checkError: null,
  freezeStatus: null,
  
  // Create/Update freeze status
  createLoading: false,
  createError: null,
  createSuccess: false,
  createdFreezeStatus: null,
  
  // General state
  loading: false,
  error: null,
  success: false,
};

// Create the slice
const payrollFreezeStatusSlice = createSlice({
  name: "payrollFreezeStatus",
  initialState,
  reducers: {
    // Clear errors
    clearError: (state) => {
      state.error = null;
      state.checkError = null;
      state.createError = null;
    },
    
    // Clear success
    clearSuccess: (state) => {
      state.success = false;
      state.createSuccess = false;
    },
    
    // Reset state
    resetState: (state) => {
      state.checkLoading = false;
      state.checkError = null;
      state.freezeStatus = null;
      state.createLoading = false;
      state.createError = null;
      state.createSuccess = false;
      state.createdFreezeStatus = null;
      state.loading = false;
      state.error = null;
      state.success = false;
    },
    
    // Clear freeze status
    clearFreezeStatus: (state) => {
      state.freezeStatus = null;
      state.checkError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check payroll freeze status
      .addCase(checkPayrollFreezeStatus.pending, (state) => {
        state.checkLoading = true;
        state.checkError = null;
        state.loading = true;
        state.error = null;
      })
      .addCase(checkPayrollFreezeStatus.fulfilled, (state, action) => {

        
        state.checkLoading = false;
        state.checkError = null;
        state.freezeStatus = action.payload;
        state.loading = false;
        state.error = null;
        state.success = true;
        

      })
      .addCase(checkPayrollFreezeStatus.rejected, (state, action) => {
        state.checkLoading = false;
        state.checkError = action.payload || {
          message: "Failed to check payroll freeze status",
          status: 0,
        };
        state.loading = false;
        state.error = action.payload || {
          message: "Failed to check payroll freeze status",
          status: 0,
        };
        state.success = false;
      })
      
      // Create payroll freeze status
      .addCase(createPayrollFreezeStatus.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
        state.loading = true;
        state.error = null;
      })
      .addCase(createPayrollFreezeStatus.fulfilled, (state, action) => {
        state.createLoading = false;
        state.createError = null;
        state.createSuccess = true;
        state.createdFreezeStatus = action.payload;
        state.loading = false;
        state.error = null;
        state.success = true;
      })
      .addCase(createPayrollFreezeStatus.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload || {
          message: "Failed to create payroll freeze status",
          status: 0,
        };
        state.loading = false;
        state.error = action.payload || {
          message: "Failed to create payroll freeze status",
          status: 0,
        };
        state.success = false;
      });
  },
});

// Export actions
export const {
  clearError,
  clearSuccess,
  resetState,
  clearFreezeStatus,
} = payrollFreezeStatusSlice.actions;

// Export selectors
export const selectPayrollFreezeStatus = (state) => state.payrollFreezeStatus;

// Export reducer
export default payrollFreezeStatusSlice.reducer;
