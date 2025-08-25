import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getItemFromSessionStorage } from "./sessionStorageSlice";
import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();
const API_BASE_URL = publicRuntimeConfig.apiURL + "/receipts";

// Helper to get token and throw if missing
function getTokenOrThrow() {
  const token = getItemFromSessionStorage("token", null);
  if (!token) throw new Error("Authentication token not found. Please log in again.");
  return token;
}

// Fetch all receipts
export const fetchReceipts = createAsyncThunk(
  "receipts/fetchReceipts",
  async (companyId, { rejectWithValue }) => {
    try {
      const token = getTokenOrThrow();
      const response = await fetch(
        `${API_BASE_URL}?companyId=${companyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Failed to fetch receipts");
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Fetch receipt by number
export const fetchReceiptByNumber = createAsyncThunk(
  "receipts/fetchReceiptByNumber",
  async (receiptNumber, { rejectWithValue }) => {
    try {
      const token = getTokenOrThrow();
      const response = await fetch(`${API_BASE_URL}/${receiptNumber}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Failed to fetch receipt");
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Fetch receipts by project
export const fetchReceiptsByProject = createAsyncThunk(
  "receipts/fetchReceiptsByProject",
  async (projectId, { rejectWithValue }) => {
    try {
      const token = getTokenOrThrow();
      const response = await fetch(`${API_BASE_URL}/project/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Failed to fetch receipts by project");
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Fetch unallocated receipts by project
export const fetchUnallocatedReceipts = createAsyncThunk(
  "receipts/fetchUnallocatedReceipts",
  async (projectId, { rejectWithValue }) => {
    try {
      const token = getTokenOrThrow();
      const response = await fetch(`${API_BASE_URL}/unallocated/project/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Failed to fetch unallocated receipts");
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Get next receipt number (preview only, no increment)
export const getNextReceiptNumber = createAsyncThunk(
  "receipts/getNextReceiptNumber",
  async (companyId, { rejectWithValue }) => {
    try {
      const token = getTokenOrThrow();
      const response = await fetch(`${publicRuntimeConfig.apiURL}/api/settings/account/document-numbering/company/${companyId}/preview-receipt-number`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.error || "Failed to get next receipt number");
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Generate next receipt number (increments counter)
export const generateNextReceiptNumber = createAsyncThunk(
  "receipts/generateNextReceiptNumber",
  async (companyId, { rejectWithValue }) => {
    try {
      const token = getTokenOrThrow();
      const response = await fetch(`${publicRuntimeConfig.apiURL}/api/settings/account/document-numbering/company/${companyId}/generate-receipt-number`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.error || "Failed to generate next receipt number");
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Add a receipt
export const addReceipt = createAsyncThunk(
  "receipts/addReceipt",
  async (receiptData, { rejectWithValue }) => {
    try {
      const token = getTokenOrThrow();
      
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      
      // Don't set Content-Type for FormData, let browser handle it
      const isFormData = receiptData instanceof FormData;
      if (!isFormData) {
        headers["Content-Type"] = "application/json";
      }
      
      const response = await fetch(`${API_BASE_URL}`, {
        method: "POST",
        headers,
        body: isFormData ? receiptData : JSON.stringify(receiptData),
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Failed to add receipt");
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network error");
    }
  }
);

// Fetch all project-customer info (projectName, leadId, customerName)
export const fetchProjectCustomerList = createAsyncThunk(
  "receipts/fetchProjectCustomerList",
  async (companyId, { rejectWithValue }) => {
    try {
      const token = getTokenOrThrow();
      const response = await fetch(
        `${publicRuntimeConfig.apiURL}/leads/project-customer/all?companyId=${companyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch invoices by project
export const fetchInvoicesByProject = createAsyncThunk(
  "receipts/fetchInvoicesByProject",
  async (projectId, { rejectWithValue }) => {
    try {
      const token = getTokenOrThrow();
      const response = await fetch(`${publicRuntimeConfig.apiURL}/invoices/project/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Failed to fetch invoices by project");
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);




const receiptSlice = createSlice({
  name: "receipts",
  initialState: {
    receipts: [],
    projectCustomerList: [],
    invoicesByProject: {}, // Add this to store invoices by projectId
    receiptsByProject: [], // Add this to store receipts by project name
    nextReceiptNumber: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReceipts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReceipts.fulfilled, (state, action) => {
        state.loading = false;
        state.receipts = action.payload;
      })
      .addCase(fetchReceipts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addReceipt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addReceipt.fulfilled, (state, action) => {
        state.loading = false;
        // You may want to refetch all receipts or push the new one
        // state.receipts.push(action.payload);
      })
      .addCase(addReceipt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
       .addCase(fetchProjectCustomerList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectCustomerList.fulfilled, (state, action) => {
        state.loading = false;
        state.projectCustomerList = action.payload;
      })
      .addCase(fetchProjectCustomerList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchInvoicesByProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoicesByProject.fulfilled, (state, action) => {
        state.loading = false;
        if (action.meta && action.meta.arg) {
          state.invoicesByProject[action.meta.arg] = action.payload;
        }
      })
      .addCase(fetchInvoicesByProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchReceiptsByProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReceiptsByProject.fulfilled, (state, action) => {
        state.loading = false;
        state.receiptsByProject = action.payload;
      })
      .addCase(fetchReceiptsByProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getNextReceiptNumber.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getNextReceiptNumber.fulfilled, (state, action) => {
        state.loading = false;
        state.nextReceiptNumber = action.payload.nextReceiptNumber;
      })
      .addCase(getNextReceiptNumber.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(generateNextReceiptNumber.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateNextReceiptNumber.fulfilled, (state, action) => {
        state.loading = false;
        state.nextReceiptNumber = action.payload.nextReceiptNumber;
      })
      .addCase(generateNextReceiptNumber.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    
  },
});
// export { fetchProjectCustomerList };
export default receiptSlice.reducer;