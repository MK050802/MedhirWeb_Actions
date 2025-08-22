import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getItemFromSessionStorage } from "./sessionStorageSlice";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const API_BASE_URL = publicRuntimeConfig.apiURL + "/vendors";

// Helper function to safely get company ID from session storage
const getCompanyId = () => {
  try {
    // Try the encrypted version first
    const encryptedCompanyId = sessionStorage.getItem('employeeCompanyId');
    if (encryptedCompanyId) return encryptedCompanyId;
    
    // If that fails, try direct session storage access
    if (typeof window !== 'undefined') {
      const rawCompanyId = sessionStorage.getItem('employeeCompanyId');
      if (rawCompanyId) {
        // Try to parse as JSON, if it fails, use the raw string
        try {
          return JSON.parse(rawCompanyId);
        } catch {
          return rawCompanyId;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting company ID:', error);
    return null;
  }
};

// Fetch vendors
export const fetchVendors = createAsyncThunk(
  "vendors/fetchVendors",
  async (_, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const companyId = getCompanyId();
      
      if (!companyId) {
        console.error('Company ID not found in session storage');
        return rejectWithValue('Company ID not found in session storage');
      }
      
      console.log('Fetching vendors with companyId:', companyId);
      console.log('API Base URL:', API_BASE_URL);
      console.log('Full URL:', `${API_BASE_URL}?companyId=${companyId}`);
      
      const response = await fetch(`${API_BASE_URL}?companyId=${companyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Something went wrong"); // backend error
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Add vendor
export const addVendor = createAsyncThunk(
  "vendors/addVendor",
  async (vendor, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const companyId = getCompanyId();
      
      if (!companyId) {
        return rejectWithValue('Company ID not found in session storage');
      }
      
      // Create FormData for multipart/form-data
      const formData = new FormData();
      
      // Create a clean version of vendor data without file objects for JSON
      const cleanVendorData = { ...vendor, companyId };
      delete cleanVendorData.gstDocument;
      delete cleanVendorData.bankPassbook;
      
      formData.append('vendor', JSON.stringify(cleanVendorData));
      
      // Add GST document if it exists
      if (vendor.gstDocument) {
        formData.append('gstDocument', vendor.gstDocument);
      }
      
      // Add bank passbook if it exists
      if (vendor.bankPassbook) {
        formData.append('bankPassbook', vendor.bankPassbook);
      }
      
      const response = await fetch(`${API_BASE_URL}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Remove Content-Type header to let browser set it automatically for FormData
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Something went wrong"); // backend error
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Update vendor
export const updateVendor = createAsyncThunk(
  "vendors/updateVendor",
  async (vendor, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const companyId = getCompanyId();
      
      if (!companyId) {
        return rejectWithValue('Company ID not found in session storage');
      }
      
      // Create FormData for multipart/form-data
      const formData = new FormData();
      
      // Create a clean version of vendor data without file objects for JSON
      const cleanVendorData = { ...vendor, companyId };
      delete cleanVendorData.gstDocument;
      delete cleanVendorData.bankPassbook;
      
      formData.append('vendor', JSON.stringify(cleanVendorData));
      
      // Add GST document if it exists
      if (vendor.gstDocument) {
        formData.append('gstDocument', vendor.gstDocument);
      }
      
      // Add bank passbook if it exists
      if (vendor.bankPassbook) {
        formData.append('bankPassbook', vendor.bankPassbook);
      }
      
      const response = await fetch(`${API_BASE_URL}/${vendor.vendorId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // Remove Content-Type header to let browser set it automatically for FormData
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Something went wrong"); // backend error
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// add vendorBills
export const addVendorBills = createAsyncThunk(
  "vendors/addVendorBills",
  async (vendorBills, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const companyId = getCompanyId();
      
      if (!companyId) {
        return rejectWithValue('Company ID not found in session storage');
      }
      
      const response = await fetch(`${API_BASE_URL}/bills?companyId=${companyId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...vendorBills, companyId }),
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Something went wrong"); // backend error
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// update vendor credit for vendor
export const updateVendorCredit = createAsyncThunk(
  "vendors/updateVendorCredit",
  async (vendorCredit, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const companyId = getCompanyId();
      
      if (!companyId) {
        return rejectWithValue('Company ID not found in session storage');
      }
      
      const response = await fetch(`${API_BASE_URL}/${vendorCredit.vendorId}/credits?companyId=${companyId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...vendorCredit, companyId }),
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Something went wrong"); // backend error
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Fetch vendor bills
export const fetchVendorBills = createAsyncThunk(
  "vendors/fetchVendorBills",
  async (vendorId, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const companyId = getCompanyId();
      
      if (!companyId) {
        return rejectWithValue('Company ID not found in session storage');
      }
      
      const response = await fetch(`${publicRuntimeConfig.apiURL}/bills/Vendors?companyId=${companyId}&vendorId=${vendorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Something went wrong");
      }
      return { vendorId, bills: data };
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Fetch vendor payments
export const fetchVendorPayments = createAsyncThunk(
  "vendors/fetchVendorPayments",
  async (vendorId, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const companyId = getCompanyId();
      
      if (!companyId) {
        return rejectWithValue('Company ID not found in session storage');
      }
      
      const response = await fetch(`${publicRuntimeConfig.apiURL}/payments/Vendors?companyId=${companyId}&vendorId=${vendorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Something went wrong");
      }
      return { vendorId, payments: data };
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Fetch vendor purchase orders
export const fetchVendorPurchaseOrders = createAsyncThunk(
  "vendors/fetchVendorPurchaseOrders",
  async (vendorId, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const companyId = getCompanyId();
      
      if (!companyId) {
        return rejectWithValue('Company ID not found in session storage');
      }
      
      const response = await fetch(`${publicRuntimeConfig.apiURL}/purchase-orders/Vendors?companyId=${companyId}&vendorId=${vendorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Something went wrong");
      }
      return { vendorId, purchaseOrders: data };
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

export const vendorSlice = createSlice({
  name: "vendor",
  initialState: {
    vendors: [],
    vendorBills: {}, // Store vendor bills by vendorId
    vendorPayments: {}, // Store vendor payments by vendorId
    vendorPurchaseOrders: {}, // Store vendor purchase orders by vendorId
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchVendors.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchVendors.fulfilled, (state, action) => {
      state.loading = false;
      state.vendors = action.payload;
    });
    builder.addCase(fetchVendors.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    builder.addCase(addVendor.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(addVendor.fulfilled, (state, action) => {
      state.loading = false;
      state.vendors.push(action.payload);
    });
    builder.addCase(addVendor.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    builder.addCase(updateVendor.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(updateVendor.fulfilled, (state, action) => {
      state.loading = false;
      // Update the vendor in the vendors array
      const index = state.vendors.findIndex(v => v.vendorId === action.payload.vendorId);
      if (index !== -1) {
        state.vendors[index] = action.payload;
      }
    });
    builder.addCase(updateVendor.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    builder.addCase(fetchVendorBills.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchVendorBills.fulfilled, (state, action) => {
      state.loading = false;
      const { vendorId, bills } = action.payload;
      state.vendorBills[vendorId] = bills;
    });
    builder.addCase(fetchVendorBills.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    
    // Add new cases for vendor payments
    builder.addCase(fetchVendorPayments.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchVendorPayments.fulfilled, (state, action) => {
      state.loading = false;
      const { vendorId, payments } = action.payload;
      state.vendorPayments[vendorId] = payments;
    });
    builder.addCase(fetchVendorPayments.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    
    // Add new cases for vendor purchase orders
    builder.addCase(fetchVendorPurchaseOrders.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchVendorPurchaseOrders.fulfilled, (state, action) => {
      state.loading = false;
      const { vendorId, purchaseOrders } = action.payload;
      state.vendorPurchaseOrders[vendorId] = purchaseOrders;
    });
    builder.addCase(fetchVendorPurchaseOrders.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export default vendorSlice.reducer;