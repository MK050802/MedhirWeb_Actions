import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getItemFromSessionStorage } from "./sessionStorageSlice";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const API_BASE_URL = publicRuntimeConfig.apiURL + "/payments";

// fetch payments
export const fetchPayments = createAsyncThunk(
    "payments/fetchPayments",
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
            return rejectWithValue(data.message || "Something went wrong");
        }
        return data;
        } catch (error) {
        return rejectWithValue(error.message || "Network Error");
        }
    }
    );

// fetch payments of vendor
export const fetchPaymentsOfVendor = createAsyncThunk(
    "vendorPayments/fetchPaymentsOfVendor",
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
            return rejectWithValue(data.message || "Something went wrong");
        }
        return { vendorId, payments: data };
        } catch (error) {
        return rejectWithValue(error.message || "Network Error");
        }
    }
);

// add payment
export const addPayment = createAsyncThunk(
    "payments/addPayment",
    async (payment, { rejectWithValue }) => {
        try {
        const token = getItemFromSessionStorage("token", null);
        const companyId = sessionStorage.getItem('employeeCompanyId');
        
        if (!companyId) {
            return rejectWithValue('Company ID not found in session storage');
        }
        
        // Add companyId to the payment data if not already present
        const paymentData = new FormData();
        const paymentJson = JSON.parse(payment.get('payment'));
        paymentJson.companyId = companyId;
        
        // Re-append the updated payment data
        paymentData.append('payment', JSON.stringify(paymentJson));
        
        // Append all other form data
        for (let [key, value] of payment.entries()) {
            if (key !== 'payment') {
                paymentData.append(key, value);
            }
        }
        
        const response = await fetch(`${API_BASE_URL}`, {
            method: "POST",
            headers: {
            Authorization: `Bearer ${token}`,
            },
            body: paymentData,
        });
        const data = await response.json();
        if (!response.ok) {
            return rejectWithValue(data.message || "Something went wrong");
        }
        
        // Handle different response formats from backend
        let paymentResult = null;
        
        if (data && data.payment) {
            // Backend returned complete payment data
            paymentResult = data.payment;
        } else if (data && data.data) {
            // Backend returned data in nested structure
            paymentResult = data.data;
        } else if (data && data.success) {
            // Backend only returned success message, construct payment object from request
            paymentResult = {
                ...paymentJson,
                paymentId: `PAY-${Date.now()}`, // Generate temporary ID
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'Active'
            };
        } else {
            // Backend returned raw data or unexpected format
            paymentResult = data;
        }
        
        return paymentResult;
        } catch (error) {
        return rejectWithValue(error.message || "Network Error");
        }
    }
);

// update payment
export const updatePayment = createAsyncThunk(
    "payments/updatePayment",
    async ({ paymentId, payment }, { rejectWithValue }) => {
        try {
        const token = getItemFromSessionStorage("token", null);
        const companyId = sessionStorage.getItem('employeeCompanyId');
        
        if (!companyId) {
            return rejectWithValue('Company ID not found in session storage');
        }
        
        // Add companyId to the payment data if not already present
        const paymentData = new FormData();
        const paymentJson = JSON.parse(payment.get('payment'));
        paymentJson.companyId = companyId;
        
        // Re-append the updated payment data
        paymentData.append('payment', JSON.stringify(paymentJson));
        
        // Append all other form data
        for (let [key, value] of payment.entries()) {
            if (key !== 'payment') {
                paymentData.append(key, value);
            }
        }
        
        const response = await fetch(`${API_BASE_URL}/${paymentId}`, {
            method: "PUT",
            headers: {
            Authorization: `Bearer ${token}`,
            },
            body: paymentData,
        });
        const data = await response.json();
        if (!response.ok) {
            return rejectWithValue(data.message || "Something went wrong");
        }
        
        // Handle different response formats from backend
        let paymentResult = null;
        
        if (data && data.payment) {
            // Backend returned complete payment data
            paymentResult = data.payment;
        } else if (data && data.data) {
            // Backend returned data in nested structure
            paymentResult = data.data;
        } else if (data && data.success) {
            // Backend only returned success message, construct payment object from request
            paymentResult = {
                ...paymentJson,
                paymentId: paymentId,
                updatedAt: new Date().toISOString()
            };
        } else {
            // Backend returned raw data or unexpected format
            paymentResult = data;
        }
        
        return paymentResult;
        } catch (error) {
        return rejectWithValue(error.message || "Network Error");
        }
    }
);

const paymentSlice = createSlice({
    name: "payments",
    initialState: {
        payments: [],
        vendorPayments: {}, // Store vendor payments by vendorId
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchPayments.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchPayments.fulfilled, (state, action) => {
            state.loading = false;
            state.payments = action.payload;
        });
        builder.addCase(fetchPayments.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
        builder.addCase(fetchPaymentsOfVendor.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchPaymentsOfVendor.fulfilled, (state, action) => {
            state.loading = false;
            state.vendorPayments[action.payload.vendorId] = action.payload.payments;
        });
        builder.addCase(fetchPaymentsOfVendor.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
        builder.addCase(addPayment.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(addPayment.fulfilled, (state, action) => {
            state.loading = false;
            state.payments.push(action.payload);
        });
        builder.addCase(addPayment.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
        builder.addCase(updatePayment.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(updatePayment.fulfilled, (state, action) => {
            state.loading = false;
            const index = state.payments.findIndex(p => p.id === action.payload.id);
            if (index !== -1) {
                state.payments[index] = action.payload;
            }
        });
        builder.addCase(updatePayment.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
    },
});

export default paymentSlice.reducer;