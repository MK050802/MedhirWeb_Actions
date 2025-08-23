import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getItemFromSessionStorage } from "./sessionStorageSlice";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const API_BASE_URL = publicRuntimeConfig.apiURL + "/bills";

// fetch bills
export const fetchBills = createAsyncThunk(
  "bills/fetchBills",
  async (_, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const response = await fetch(`${API_BASE_URL}`, {
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

// fetch bills of vendor
export const fetchBillsOfVendor = createAsyncThunk(
  "vendorBills/fetchBillsOfVendor",
  async ({ vendorId, companyId }, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const response = await fetch(`${API_BASE_URL}?companyId=${companyId}&vendorId=${vendorId}`, {
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


// add bill
export const addBill = createAsyncThunk(
  "bills/addBill",
  async (bill, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const response = await fetch(`${API_BASE_URL}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: bill,
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Something went wrong"); // backend error
      }
      
      // Handle different response formats from backend
      let billData = null;
      
      if (data && data.bill) {
        // Backend returned complete bill data
        billData = data.bill;
      } else if (data && data.data) {
        // Backend returned data in nested structure
        billData = data.data;
      } else if (data && data.success) {
        // Backend only returned success message, construct bill object from request
        const billJson = JSON.parse(bill.get('bill'));
        billData = {
          ...billJson,
          billId: `BILL-${Date.now()}`, // Generate temporary ID
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'Active'
        };
      } else {
        // Backend returned raw data or unexpected format
        billData = data;
      }
      
      return billData;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// update bill
export const updateBill = createAsyncThunk(
  "bills/updateBill",
  async ({ formData, billId }, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const response = await fetch(`${API_BASE_URL}/${billId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Something went wrong"); // backend error
      }
      
      // Handle different response formats from backend
      let billData = null;
      
      if (data && data.bill) {
        // Backend returned complete bill data
        billData = data.bill;
      } else if (data && data.data) {
        // Backend returned data in nested structure
        billData = data.data;
      } else if (data && data.success) {
        // Backend only returned success message, construct bill object from request
        const billJson = JSON.parse(formData.get('bill'));
        billData = {
          ...billJson,
          billId: billId,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Backend returned raw data or unexpected format
        billData = data;
      }
      
      return billData;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

export const BillSlice = createSlice({
  name: "bills",
  initialState: {
    bills: [],
    vendorBills: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchBills.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBills.fulfilled, (state, action) => {
      state.loading = false;
      state.bills = action.payload;
    });
    builder.addCase(fetchBills.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    builder.addCase(fetchBillsOfVendor.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBillsOfVendor.fulfilled, (state, action) => {
      state.loading = false;
      state.vendorBills = action.payload;
    });
    builder.addCase(fetchBillsOfVendor.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    builder.addCase(addBill.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addBill.fulfilled, (state, action) => {
      state.loading = false;
      state.bills.push(action.payload);
    });
    builder.addCase(addBill.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    builder.addCase(updateBill.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateBill.fulfilled, (state, action) => {
      state.loading = false;
      // Update the bill in the bills array
      const index = state.bills.findIndex(b => b.billId === action.payload.billId);
      if (index !== -1) {
        state.bills[index] = action.payload;
      }
    });
    builder.addCase(updateBill.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export default BillSlice.reducer;