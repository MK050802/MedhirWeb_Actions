import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import getConfig from "next/config";
import { getItemFromSessionStorage } from "./sessionStorageSlice";

const { publicRuntimeConfig } = getConfig();
const API_BASE_URL = publicRuntimeConfig.apiURL + "/invoices";

// Helper to get token
function getTokenOrThrow() {
  const token = getItemFromSessionStorage("token", null);
  if (!token) throw new Error("Authentication token not found. Please log in again.");
  return token;
}

// Fetch all invoices
export const fetchInvoices = createAsyncThunk(
  "invoices/fetchInvoices",
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
      if (!response.ok) return rejectWithValue(data.message || "Failed to fetch invoices");
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Fetch invoice by number
export const fetchInvoiceByNumber = createAsyncThunk(
  "invoices/fetchInvoiceByNumber",
  async (invoiceNumber, { rejectWithValue }) => {
    try {
      const token = getTokenOrThrow();
      const response = await fetch(`${API_BASE_URL}/${invoiceNumber}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to fetch invoice");
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Fetch invoices by project
export const fetchInvoicesByProject = createAsyncThunk(
  "invoices/fetchInvoicesByProject",
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
      if (!response.ok) return rejectWithValue(data.message || "Failed to fetch project invoices");
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Create a new invoice
export const createInvoice = createAsyncThunk(
  "invoices/createInvoice",
  async (invoiceData, { rejectWithValue }) => {
    try {
      const token = getTokenOrThrow();
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to create invoice");
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Get next invoice number (preview only, no increment)
export const getNextInvoiceNumber = createAsyncThunk(
  "invoices/getNextInvoiceNumber",
  async (companyId, { rejectWithValue }) => {
    try {
      const token = getTokenOrThrow();
      const response = await fetch(`${publicRuntimeConfig.apiURL}/api/settings/account/document-numbering/company/${companyId}/preview-invoice-number`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to get next invoice number");
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Generate next invoice number (increments counter)
export const generateNextInvoiceNumber = createAsyncThunk(
  "invoices/generateNextInvoiceNumber",
  async (companyId, { rejectWithValue }) => {
    try {
      const token = getTokenOrThrow();
      const response = await fetch(`${publicRuntimeConfig.apiURL}/api/settings/account/document-numbering/company/${companyId}/generate-invoice-number`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to generate next invoice number");
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

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

// Slice
const invoiceSlice = createSlice({
  name: "invoices",
  initialState: {
    invoices: [],
    invoiceDetails: {},
    projectInvoices: {},
    projectCustomerList: [],
    nextInvoiceNumber: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // All invoices
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Single invoice
      .addCase(fetchInvoiceByNumber.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoiceByNumber.fulfilled, (state, action) => {
        state.loading = false;
        state.invoiceDetails = action.payload;
      })
      .addCase(fetchInvoiceByNumber.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Project invoices
      .addCase(fetchInvoicesByProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoicesByProject.fulfilled, (state, action) => {
        state.loading = false;
        if (action.meta && action.meta.arg) {
          state.projectInvoices[action.meta.arg] = action.payload;
        }
      })
      .addCase(fetchInvoicesByProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create invoice
      .addCase(createInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.loading = false;
        // Optionally push created invoice or just show success message
      })
      .addCase(createInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get next invoice number
      .addCase(getNextInvoiceNumber.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getNextInvoiceNumber.fulfilled, (state, action) => {
        state.loading = false;
        state.nextInvoiceNumber = action.payload.nextInvoiceNumber;
      })
      .addCase(getNextInvoiceNumber.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

       .addCase(fetchProjectCustomerList.fulfilled, (state, action) => {
              state.loading = false;
              state.projectCustomerList = action.payload;
            })
         .addCase(fetchProjectCustomerList.rejected, (state, action) => {
              state.loading = false;
              state.error = action.payload;
            })
         .addCase(generateNextInvoiceNumber.pending, (state) => {
           state.loading = true;
           state.error = null;
         })
         .addCase(generateNextInvoiceNumber.fulfilled, (state, action) => {
           state.loading = false;
           state.nextInvoiceNumber = action.payload.nextInvoiceNumber;
         })
         .addCase(generateNextInvoiceNumber.rejected, (state, action) => {
           state.loading = false;
           state.error = action.payload;
         });
  },
});

export default invoiceSlice.reducer;