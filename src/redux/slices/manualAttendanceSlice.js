import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import getConfig from "next/config";
import { getItemFromSessionStorage } from "./sessionStorageSlice";

const { publicRuntimeConfig } = getConfig();

// Async thunk for manual bulk checkin
export const markManualAttendance = createAsyncThunk(
  "manualAttendance/markManualAttendance",
  async (attendanceData, { rejectWithValue }) => {
    try {
      // Get the HR employee ID from session storage
      const hrEmployeeId = sessionStorage.getItem("employeeId");
      
      // Get the authentication token
      const token = getItemFromSessionStorage("token", null);
      if (!token) {
        return rejectWithValue("Authentication token not found");
      }
      
      // Use the new API endpoint with HR employee ID in the URL path
      const response = await fetch(
        `${publicRuntimeConfig.attendanceURL}/attendance/bulk-employee/${hrEmployeeId}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(attendanceData), // Keep the original payload structure
        }
      );

      // Handle both text and JSON responses
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // Handle plain text response
        const textData = await response.text();
        data = { message: textData };
      }

      if (!response.ok) {
        return rejectWithValue(data.message || "Failed to mark attendance");
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network error");
    }
  }
);

// Async thunk for single employee month attendance
export const markSingleEmployeeMonthAttendance = createAsyncThunk(
  "manualAttendance/markSingleEmployeeMonthAttendance",
  async (attendanceData, { rejectWithValue }) => {
    try {
      // Get the HR employee ID from session storage
      const hrEmployeeId = sessionStorage.getItem("employeeId");
      
      // Get the authentication token
      const token = getItemFromSessionStorage("token", null);
      if (!token) {
        return rejectWithValue("Authentication token not found");
      }
      
      // Use the new API endpoint with HR employee ID in the URL path
      const response = await fetch(
        `${publicRuntimeConfig.attendanceURL}/attendance/bulk-employee/${hrEmployeeId}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(attendanceData), // Keep the original payload structure
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || "Failed to mark attendance");
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network error");
    }
  }
);

// Async thunk for all employees specific date attendance
export const markAllEmployeesDateAttendance = createAsyncThunk(
  "manualAttendance/markAllEmployeesDateAttendance",
  async (attendanceData, { rejectWithValue }) => {
    try {
      // Get the HR employee ID from session storage
      const hrEmployeeId = sessionStorage.getItem("employeeId");
      
      // Get the authentication token
      const token = getItemFromSessionStorage("token", null);
      if (!token) {
        return rejectWithValue("Authentication token not found");
      }
      
      // Use the new API endpoint with HR employee ID in the URL path
      const response = await fetch(
        `${publicRuntimeConfig.attendanceURL}/attendance/bulk-date/${hrEmployeeId}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(attendanceData), // Keep the original payload structure
        }
      );

      // Handle both text and JSON responses
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // Handle plain text response
        const textData = await response.text();
        data = { message: textData };
      }

      if (!response.ok) {
        return rejectWithValue(data.message || "Failed to mark attendance");
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network error");
    }
  }
);

const initialState = {
  loading: false,
  error: null,
  success: false,
  message: "",
};

const manualAttendanceSlice = createSlice({
  name: "manualAttendance",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
      state.message = "";
    },
    resetState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Mark Manual Attendance
      .addCase(markManualAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(markManualAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message || "Attendance marked successfully";
      })
      .addCase(markManualAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to mark attendance";
        state.success = false;
      })
      // Single Employee Month Attendance
      .addCase(markSingleEmployeeMonthAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(markSingleEmployeeMonthAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message || "Month attendance marked successfully";
      })
      .addCase(markSingleEmployeeMonthAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to mark month attendance";
        state.success = false;
      })
      // All Employees Date Attendance
      .addCase(markAllEmployeesDateAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(markAllEmployeesDateAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message || "Date attendance marked successfully";
      })
      .addCase(markAllEmployeesDateAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to mark date attendance";
        state.success = false;
      });
  },
});

export const { clearError, clearSuccess, resetState } = manualAttendanceSlice.actions;

export default manualAttendanceSlice.reducer; 