import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getItemFromSessionStorage } from "./sessionStorageSlice";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const API_BASE_URL = publicRuntimeConfig.apiURL + "/customers";

// Fetch customers
export const fetchCustomers = createAsyncThunk(
  "customers/fetchCustomers",
  async (_, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const companyId = sessionStorage.getItem("employeeCompanyId");
      
      const response = await fetch(`${API_BASE_URL}?companyId=${companyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Something went wrong");
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Add customer
export const addCustomer = createAsyncThunk(
  "customers/addCustomer",
  async (customer, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const companyId = sessionStorage.getItem("employeeCompanyId");
      
      const customerWithCompany = {
        ...customer,
        companyId: companyId
      };
      
      const response = await fetch(`${API_BASE_URL}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerWithCompany),
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Something went wrong");
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Update customer
export const updateCustomer = createAsyncThunk(
  "customers/updateCustomer",
  async (customer, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const companyId = sessionStorage.getItem("employeeCompanyId");
      
      const customerWithCompany = {
        ...customer,
        companyId: companyId
      };
      
      const response = await fetch(`${API_BASE_URL}/${customer.customerId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerWithCompany),
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Something went wrong");
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Get customer by ID
export const getCustomerById = createAsyncThunk(
  "customers/getCustomerById",
  async (customerId, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const companyId = sessionStorage.getItem("employeeCompanyId");
      
      const response = await fetch(`${API_BASE_URL}/${customerId}?companyId=${companyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Something went wrong");
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Search customers by name
export const searchCustomersByName = createAsyncThunk(
  "customers/searchCustomersByName",
  async (customerName, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const companyId = sessionStorage.getItem("employeeCompanyId");
      
      const response = await fetch(`${API_BASE_URL}/search/name?customerName=${encodeURIComponent(customerName)}&companyId=${companyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Something went wrong");
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Search customers by email
export const searchCustomersByEmail = createAsyncThunk(
  "customers/searchCustomersByEmail",
  async (email, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const companyId = sessionStorage.getItem("employeeCompanyId");
      
      const response = await fetch(`${API_BASE_URL}/search/email?email=${encodeURIComponent(email)}&companyId=${companyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Something went wrong");
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Get customer by email
export const getCustomerByEmail = createAsyncThunk(
  "customers/getCustomerByEmail",
  async (email, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const companyId = sessionStorage.getItem("employeeCompanyId");
      
      const response = await fetch(`${API_BASE_URL}/email/${encodeURIComponent(email)}?companyId=${companyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Something went wrong");
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Check if customer exists by email
export const customerExistsByEmail = createAsyncThunk(
  "customers/customerExistsByEmail",
  async (email, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const companyId = sessionStorage.getItem("employeeCompanyId");
      
      const response = await fetch(`${API_BASE_URL}/exists/email/${encodeURIComponent(email)}?companyId=${companyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Something went wrong");
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Get customers by lead ID
export const getCustomersByLeadId = createAsyncThunk(
  "customers/getCustomersByLeadId",
  async (leadId, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const companyId = sessionStorage.getItem("employeeCompanyId");
      
      const response = await fetch(`${API_BASE_URL}/lead/${leadId}?companyId=${companyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Something went wrong");
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

export const customerSlice = createSlice({
  name: "customers",
  initialState: {
    customers: [],
    selectedCustomer: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch customers
    builder.addCase(fetchCustomers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCustomers.fulfilled, (state, action) => {
      state.loading = false;
      state.customers = action.payload;
    });
    builder.addCase(fetchCustomers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Add customer
    builder.addCase(addCustomer.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addCustomer.fulfilled, (state, action) => {
      state.loading = false;
      state.customers.push(action.payload);
    });
    builder.addCase(addCustomer.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Update customer
    builder.addCase(updateCustomer.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateCustomer.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.customers.findIndex(c => c.customerId === action.payload.customerId);
      if (index !== -1) {
        state.customers[index] = action.payload;
      }
    });
    builder.addCase(updateCustomer.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Get customer by ID
    builder.addCase(getCustomerById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getCustomerById.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedCustomer = action.payload;
    });
    builder.addCase(getCustomerById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Search customers by name
    builder.addCase(searchCustomersByName.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(searchCustomersByName.fulfilled, (state, action) => {
      state.loading = false;
      state.customers = action.payload;
    });
    builder.addCase(searchCustomersByName.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Search customers by email
    builder.addCase(searchCustomersByEmail.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(searchCustomersByEmail.fulfilled, (state, action) => {
      state.loading = false;
      state.customers = action.payload;
    });
    builder.addCase(searchCustomersByEmail.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Get customer by email
    builder.addCase(getCustomerByEmail.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getCustomerByEmail.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedCustomer = action.payload;
    });
    builder.addCase(getCustomerByEmail.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Customer exists by email
    builder.addCase(customerExistsByEmail.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(customerExistsByEmail.fulfilled, (state, action) => {
      state.loading = false;
      // This action returns a boolean, so we don't update customers array
    });
    builder.addCase(customerExistsByEmail.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Get customers by lead ID
    builder.addCase(getCustomersByLeadId.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getCustomersByLeadId.fulfilled, (state, action) => {
      state.loading = false;
      state.customers = action.payload;
    });
    builder.addCase(getCustomersByLeadId.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { clearSelectedCustomer, clearError } = customerSlice.actions;
export default customerSlice.reducer;