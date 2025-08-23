import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getItemFromSessionStorage } from "./sessionStorageSlice";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const API_BASE_URL = publicRuntimeConfig.apiURL + "/purchase-orders";

// fetch purchase orders
export const fetchPurchaseOrders = createAsyncThunk(
    "purchase-orders/fetchPurchaseOrders",
    async (_, { rejectWithValue }) => {
        try {
            const token = getItemFromSessionStorage("token", null);
            const response = await fetch(`${API_BASE_URL}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            const data = await response.json();
            if (!response.ok) {
                return rejectWithValue(data.message);
            }
            return data;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

// create purchase order
export const createPurchaseOrder = createAsyncThunk(
    "purchase-orders/createPurchaseOrder",
    async (purchaseOrder, { rejectWithValue }) => {
        try {
            const token = getItemFromSessionStorage("token", null);
            const response = await fetch(`${API_BASE_URL}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: purchaseOrder,
            });
            const data = await response.json();
            if (!response.ok) {
                return rejectWithValue(data.message);
            }
            return data;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

// update purchase order
export const updatePurchaseOrder = createAsyncThunk(
    "purchase-orders/updatePurchaseOrder",
    async ({ purchaseOrderId, purchaseOrder }, { rejectWithValue }) => {
        try {
            const token = getItemFromSessionStorage("token", null);
            const response = await fetch(`${API_BASE_URL}/${purchaseOrderId}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: purchaseOrder,
            });
            const data = await response.json();
            if (!response.ok) {
                return rejectWithValue(data.message);
            }
            return data;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

// fetch purchase orders of vendor
export const fetchPurchaseOrdersOfVendor = createAsyncThunk(
    "vendorPurchaseOrders/fetchPurchaseOrdersOfVendor",
    async ({ vendorId, companyId }, { rejectWithValue }) => {
        try {
            const token = getItemFromSessionStorage("token", null);
            const response = await fetch(`${API_BASE_URL}?companyId=${companyId}&vendorId=${vendorId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
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

// Purchase Order Numbering Thunks
export const getNextPurchaseOrderNumber = createAsyncThunk(
  "purchase-orders/getNextPurchaseOrderNumber",
  async (companyId, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const response = await fetch(`${publicRuntimeConfig.apiURL}/api/settings/account/document-numbering/company/${companyId}/preview-purchase-order-number`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to preview next PO number");
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

export const generateNextPurchaseOrderNumber = createAsyncThunk(
  "purchase-orders/generateNextPurchaseOrderNumber",
  async (companyId, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const response = await fetch(`${publicRuntimeConfig.apiURL}/api/settings/account/document-numbering/company/${companyId}/generate-purchase-order-number`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to generate next PO number");
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

export const purchaseOrderSlice = createSlice({
    name: "purchase-orders",
    initialState: {
        purchaseOrders: [],
        vendorPurchaseOrders: {}, // Store vendor purchase orders by vendorId
        loading: false,
        error: null,
        nextPurchaseOrderNumber: null,
    },
    extraReducers: (builder) => {
        builder.addCase(fetchPurchaseOrders.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(fetchPurchaseOrders.fulfilled, (state, action) => {
            state.loading = false;
            state.purchaseOrders = action.payload;
        });
        builder.addCase(fetchPurchaseOrders.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
        builder.addCase(createPurchaseOrder.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(createPurchaseOrder.fulfilled, (state, action) => {
            state.loading = false;
            state.purchaseOrders.push(action.payload);
        });
        builder.addCase(createPurchaseOrder.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
        builder.addCase(updatePurchaseOrder.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(updatePurchaseOrder.fulfilled, (state, action) => {
            state.loading = false;
            const index = state.purchaseOrders.findIndex(po => po.purchaseOrderId === action.payload.purchaseOrderId);
            if (index !== -1) {
                state.purchaseOrders[index] = action.payload;
            }
        });
        builder.addCase(updatePurchaseOrder.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
        builder.addCase(fetchPurchaseOrdersOfVendor.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchPurchaseOrdersOfVendor.fulfilled, (state, action) => {
            state.loading = false;
            state.vendorPurchaseOrders[action.payload.vendorId] = action.payload.purchaseOrders;
        });
        builder.addCase(fetchPurchaseOrdersOfVendor.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
        builder
      .addCase(getNextPurchaseOrderNumber.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getNextPurchaseOrderNumber.fulfilled, (state, action) => {
        state.loading = false;
        state.nextPurchaseOrderNumber = action.payload.nextPurchaseOrderNumber;
      })
      .addCase(getNextPurchaseOrderNumber.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(generateNextPurchaseOrderNumber.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateNextPurchaseOrderNumber.fulfilled, (state, action) => {
        state.loading = false;
        state.nextPurchaseOrderNumber = action.payload.nextPurchaseOrderNumber;
      })
      .addCase(generateNextPurchaseOrderNumber.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    },
});

export default purchaseOrderSlice.reducer;