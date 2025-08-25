import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getItemFromSessionStorage } from "./sessionStorageSlice";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const API_BASE_URL = `${publicRuntimeConfig.apiURL}/api/vendorProfileTags`;

// Fetch all tags for a company
export const fetchVendorTags = createAsyncThunk(
  "vendorTags/fetchVendorTags",
  async (companyId, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const response = await fetch(`${API_BASE_URL}/${companyId}`, {
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

// Add a new tag
export const addVendorTag = createAsyncThunk(
  "vendorTags/addVendorTag",
  async ({ companyId, tagName }, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const response = await fetch(`${API_BASE_URL}/${companyId}?tagName=${encodeURIComponent(tagName)}`, {
        method: "POST",
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

// Edit a tag
export const editVendorTag = createAsyncThunk(
  "vendorTags/editVendorTag",
  async ({ companyId, tagId, tagName }, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const response = await fetch(`${API_BASE_URL}/${companyId}/${tagId}?tagName=${encodeURIComponent(tagName)}`, {
        method: "PUT",
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

// Delete a tag
export const deleteVendorTag = createAsyncThunk(
  "vendorTags/deleteVendorTag",
  async ({ companyId, tagId }, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const response = await fetch(`${API_BASE_URL}/${companyId}/${tagId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const data = await response.json();
        return rejectWithValue(data.message || "Something went wrong");
      }
      return tagId;
    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

// Get a tag by ID
export const fetchVendorTagById = createAsyncThunk(
  "vendorTags/fetchVendorTagById",
  async ({ companyId, tagId }, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const response = await fetch(`${API_BASE_URL}/${companyId}/tags/${tagId}`, {
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

export const VendorTagSlice = createSlice({
  name: "vendorTags",
  initialState: {
    tags: [],
    selectedTag: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendorTags.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVendorTags.fulfilled, (state, action) => {
        state.loading = false;
        state.tags = action.payload;
      })
      .addCase(fetchVendorTags.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addVendorTag.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addVendorTag.fulfilled, (state, action) => {
        state.loading = false;
        state.tags.push(action.payload);
      })
      .addCase(addVendorTag.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(editVendorTag.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editVendorTag.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.tags.findIndex(tag => tag.tagId === action.payload.tagId);
        if (idx !== -1) state.tags[idx] = action.payload;
      })
      .addCase(editVendorTag.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteVendorTag.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteVendorTag.fulfilled, (state, action) => {
        state.loading = false;
        state.tags = state.tags.filter(tag => tag.tagId !== action.payload);
      })
      .addCase(deleteVendorTag.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchVendorTagById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVendorTagById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTag = action.payload;
      })
      .addCase(fetchVendorTagById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default VendorTagSlice.reducer;