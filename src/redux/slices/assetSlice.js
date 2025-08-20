import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import getConfig from 'next/config';
import { getItemFromSessionStorage } from './sessionStorageSlice';
const { publicRuntimeConfig } = getConfig();

const ASSET_API_BASE = publicRuntimeConfig.apiURL + "/api/assets";

/**
 * ASSET MANAGEMENT ENDPOINTS (Based on AssetController.java):
 * 
 * 1. GET /api/assets
 *    - Get all assets
 *    - Used by: fetchAllAssets()
 * 
 * 2. GET /api/assets/detailed
 *    - Get all assets with detailed information
 *    - Used by: fetchAllAssetsDetailed()
 * 
 * 3. GET /api/assets/{id}
 *    - Get asset by MongoDB ID
 *    - Used by: fetchAssetById()
 * 
 * 4. GET /api/assets/asset/{assetId}
 *    - Get asset by Asset ID (auto-generated ID like D-03-3001)
 *    - Used by: fetchAssetByAssetId()
 * 
 * 5. GET /api/assets/asset/{assetId}/detailed
 *    - Get asset by Asset ID with detailed information
 *    - Used by: fetchAssetByAssetIdDetailed()
 * 
 * 6. PATCH /api/assets/asset/{assetId}
 *    - Partially update asset by Asset ID (JSON only)
 *    - Used by: patchAssetByAssetId()
 * 
 * 7. POST /api/assets
 *    - Create a new asset with optional invoice scan upload
 *    - Used by: createAsset()
 * 
 * 8. POST /api/assets/create
 *    - Create a new asset with DTO validation and category integration
 *    - Used by: createAssetWithDTO()
 * 
 * 9. PATCH /api/assets/{id}
 *    - Partially update an existing asset (JSON only)
 *    - Used by: patchAssetJson()
 * 
 * 10. PATCH /api/assets/{id} (multipart)
 *     - Partially update an existing asset with file upload
 *     - Used by: patchAssetWithFile()
 * 
 * 11. PUT /api/assets/{id}
 *     - Completely replace an existing asset
 *     - Used by: updateAsset()
 * 
 * 12. DELETE /api/assets/{id}
 *     - Delete an asset
 *     - Used by: deleteAsset()
 * 
 * 13. GET /api/assets/{id}/invoice-url
 *     - Get asset invoice file URL
 *     - Used by: getAssetInvoiceUrl()
 * 
 * 14. GET /api/assets/{id}/invoice-download
 *     - Download asset invoice file
 *     - Used by: downloadAssetInvoice()
 * 
 * 15. GET /api/assets/category/{categoryId}
 *     - Get assets by category ID
 *     - Used by: fetchAssetsByCategory()
 * 
 * 16. GET /api/assets/{assetId}/with-custom-forms
 *     - Get asset with custom form data
 *     - Used by: fetchAssetWithCustomForms()
 * 
 * 17. PATCH /api/assets/{assetId}/custom-fields
 *     - Update asset custom fields
 *     - Used by: updateAssetCustomFields()
 * 
 * 18. GET /api/assets/{assetId}/validate
 *     - Validate asset against category requirements
 *     - Used by: validateAsset()
 */

// Fetch all assets with enhanced response
export const fetchAllAssets = createAsyncThunk(
  'assets/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage('token', null);
      
      // Try standard endpoint first (GET requests don't need special content type)
      let response;
      try {
        console.log('Trying standard endpoint...');
        response = await axios.get(`${ASSET_API_BASE}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        console.log('Standard endpoint succeeded');
      } catch (standardError) {
        console.log('Standard endpoint failed, trying enhanced endpoint...');
        response = await axios.get(`${ASSET_API_BASE}/enhanced`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        console.log('Enhanced endpoint succeeded');
      }
      
      console.log('Fetch all assets response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching all assets:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch assets');
    }
  }
);

// Fetch all assets with detailed information
export const fetchAllAssetsDetailed = createAsyncThunk(
  'assets/fetchAllDetailed',
  async (_, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage('token', null);
      const response = await axios.get(`${ASSET_API_BASE}/detailed`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      console.log('Fetch all assets detailed response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching all assets detailed:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch detailed assets');
    }
  }
);

// Fetch asset by MongoDB ID
export const fetchAssetById = createAsyncThunk(
  'assets/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage('token', null);
      const response = await axios.get(`${ASSET_API_BASE}/${id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      console.log('Fetch asset by ID response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching asset by ID:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch asset');
    }
  }
);

// Fetch asset by Asset ID (auto-generated ID like D-03-3001)
export const fetchAssetByAssetId = createAsyncThunk(
  'assets/fetchByAssetId',
  async (assetId, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage('token', null);
      const response = await axios.get(`${ASSET_API_BASE}/asset/${assetId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      console.log('Fetch asset by Asset ID response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching asset by Asset ID:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch asset');
    }
  }
);

// Fetch asset by Asset ID with detailed information
export const fetchAssetByAssetIdDetailed = createAsyncThunk(
  'assets/fetchByAssetIdDetailed',
  async (assetId, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage('token', null);
      const response = await axios.get(`${ASSET_API_BASE}/asset/${assetId}/detailed`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      console.log('Fetch asset by Asset ID detailed response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching asset by Asset ID detailed:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch detailed asset');
    }
  }
);

// Create asset with enhanced API structure
export const createAssetWithDTO = createAsyncThunk(
  'assets/createWithDTO',
  async ({ asset, invoiceScan }, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage('token', null);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      console.log('Creating asset with data:', asset);
      console.log('Asset data structure:', {
        hasCompanyId: !!asset.companyId,
        hasCategoryId: !!asset.categoryId,
        hasAssetId: !!asset.assetId,
        hasCreatedBy: !!asset.createdBy,
        hasFormData: !!asset.formData,
        formDataKeys: asset.formData ? Object.keys(asset.formData) : []
      });
      
      const formData = new FormData();
      formData.append('asset', JSON.stringify(asset));
      if (invoiceScan) {
        formData.append('invoiceScan', invoiceScan);
      }
      
      // Log the FormData contents
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      
      // Send the complete asset data, not just minimal fields
      console.log('Complete asset data to send:', asset);
      
      let response;
      
      // First try: JSON with /create endpoint (for endpoints that accept JSON)
      try {
        console.log('Trying JSON with /create endpoint...');
        response = await axios.post(`${ASSET_API_BASE}/create`, asset, { 
          headers: { 
            ...headers,
            'Content-Type': 'application/json'
          } 
        });
        console.log('Asset created successfully with JSON + /create endpoint');
      } catch (jsonCreateError) {
        console.log('JSON + /create failed:', jsonCreateError.response?.data);
        
        // Second try: FormData with /create endpoint (if file upload is needed)
        if (invoiceScan) {
          try {
            console.log('Trying FormData with /create endpoint for file upload...');
            const formData = new FormData();
            formData.append('asset', JSON.stringify(asset));
            formData.append('invoiceScan', invoiceScan);
            
            response = await axios.post(`${ASSET_API_BASE}/create`, formData, { 
              headers: { 
                ...headers,
                'Content-Type': 'multipart/form-data'
              } 
            });
            console.log('Asset created successfully with FormData + /create endpoint');
          } catch (formDataCreateError) {
            console.log('FormData + /create failed:', formDataCreateError.response?.data);
            
            // Third try: JSON with base endpoint
            try {
              console.log('Trying JSON with base endpoint...');
              response = await axios.post(`${ASSET_API_BASE}`, asset, { 
                headers: { 
                  ...headers,
                  'Content-Type': 'application/json'
                } 
              });
              console.log('Asset created successfully with JSON + base endpoint');
            } catch (jsonBaseError) {
              console.log('JSON + base failed:', jsonBaseError.response?.data);
              throw jsonBaseError;
            }
          }
        } else {
          // No file upload needed, try base endpoint
          try {
            console.log('Trying JSON with base endpoint...');
            response = await axios.post(`${ASSET_API_BASE}`, asset, { 
              headers: { 
                ...headers,
                'Content-Type': 'application/json'
              } 
            });
            console.log('Asset created successfully with JSON + base endpoint');
          } catch (jsonBaseError) {
            console.log('JSON + base failed:', jsonBaseError.response?.data);
            throw jsonBaseError;
          }
        }
      }
      
      console.log('Asset creation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating asset:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      return rejectWithValue(
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.message || 
        'Failed to create asset'
      );
    }
  }
);

// Patch asset by Asset ID (JSON only)
export const patchAssetByAssetId = createAsyncThunk(
  'assets/patchByAssetId',
  async ({ assetId, assetData }, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage('token', null);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.patch(`${ASSET_API_BASE}/asset/${assetId}`, assetData, { 
        headers: { 
          ...headers,
          'Content-Type': 'application/json'
        } 
      });
      
      console.log('Patch asset by Asset ID response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error patching asset by Asset ID:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to update asset');
    }
  }
);

// Delete asset
export const deleteAsset = createAsyncThunk(
  'assets/delete',
  async (id, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage('token', null);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.delete(`${ASSET_API_BASE}/${id}`, { headers });
      
      console.log('Delete asset response:', id);
      return id;
    } catch (error) {
      console.error('Error deleting asset:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to delete asset');
    }
  }
);

// Fetch assets by category ID
export const fetchAssetsByCategory = createAsyncThunk(
  'assets/fetchByCategory',
  async (categoryId, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage('token', null);
      const response = await axios.get(`${ASSET_API_BASE}/category/${categoryId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      console.log('Fetch assets by category response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching assets by category:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch assets by category');
    }
  }
);

// Fetch asset with custom forms
export const fetchAssetWithCustomForms = createAsyncThunk(
  'assets/fetchWithCustomForms',
  async (assetId, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage('token', null);
      const response = await axios.get(`${ASSET_API_BASE}/${assetId}/with-custom-forms`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      console.log('Fetch asset with custom forms response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching asset with custom forms:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch asset with custom forms');
    }
  }
);

// Update asset custom fields
export const updateAssetCustomFields = createAsyncThunk(
  'assets/updateCustomFields',
  async ({ assetId, customFields }, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage('token', null);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.patch(`${ASSET_API_BASE}/${assetId}/custom-fields`, customFields, { 
        headers: { 
          ...headers,
          'Content-Type': 'application/json'
        } 
      });
      
      console.log('Update asset custom fields response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating asset custom fields:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to update asset custom fields');
    }
  }
);

// Validate asset
export const validateAsset = createAsyncThunk(
  'assets/validate',
  async (assetId, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage('token', null);
      const response = await axios.get(`${ASSET_API_BASE}/${assetId}/validate`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      console.log('Validate asset response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error validating asset:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to validate asset');
    }
  }
);

// Get asset invoice URL
export const getAssetInvoiceUrl = createAsyncThunk(
  'assets/getInvoiceUrl',
  async (id, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage('token', null);
      const response = await axios.get(`${ASSET_API_BASE}/${id}/invoice-url`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      console.log('Get asset invoice URL response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting asset invoice URL:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to get invoice URL');
    }
  }
);

const assetSlice = createSlice({
  name: 'assets',
  initialState: {
    assets: [],
    detailedAssets: [],
    currentAsset: null,
    loading: false,
    error: null,
    creatingAsset: false,
    updatingAsset: false,
    deletingAsset: false,
    validatingAsset: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentAsset: (state) => {
      state.currentAsset = null;
    },
    setCurrentAsset: (state, action) => {
      state.currentAsset = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all assets
      .addCase(fetchAllAssets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllAssets.fulfilled, (state, action) => {
        state.loading = false;
        state.assets = action.payload;
      })
      .addCase(fetchAllAssets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch all assets detailed
      .addCase(fetchAllAssetsDetailed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllAssetsDetailed.fulfilled, (state, action) => {
        state.loading = false;
        state.detailedAssets = action.payload;
      })
      .addCase(fetchAllAssetsDetailed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch asset by ID
      .addCase(fetchAssetById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssetById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAsset = action.payload;
      })
      .addCase(fetchAssetById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch asset by Asset ID
      .addCase(fetchAssetByAssetId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssetByAssetId.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAsset = action.payload;
      })
      .addCase(fetchAssetByAssetId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch asset by Asset ID detailed
      .addCase(fetchAssetByAssetIdDetailed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssetByAssetIdDetailed.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAsset = action.payload;
      })
      .addCase(fetchAssetByAssetIdDetailed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create asset with DTO
      .addCase(createAssetWithDTO.pending, (state) => {
        state.creatingAsset = true;
        state.error = null;
      })
      .addCase(createAssetWithDTO.fulfilled, (state, action) => {
        state.creatingAsset = false;
        // Add the new asset to the list
        if (action.payload.asset) {
          state.assets.push(action.payload.asset);
        }
      })
      .addCase(createAssetWithDTO.rejected, (state, action) => {
        state.creatingAsset = false;
        state.error = action.payload;
      })
      
      // Patch asset by Asset ID
      .addCase(patchAssetByAssetId.pending, (state) => {
        state.updatingAsset = true;
        state.error = null;
      })
      .addCase(patchAssetByAssetId.fulfilled, (state, action) => {
        state.updatingAsset = false;
        // Update the asset in the list
        const index = state.assets.findIndex(asset => asset.assetId === action.payload.assetId);
        if (index !== -1) {
          state.assets[index] = { ...state.assets[index], ...action.payload };
        }
        // Update current asset if it's the one being edited
        if (state.currentAsset && state.currentAsset.assetId === action.payload.assetId) {
          state.currentAsset = { ...state.currentAsset, ...action.payload };
        }
      })
      .addCase(patchAssetByAssetId.rejected, (state, action) => {
        state.updatingAsset = false;
        state.error = action.payload;
      })
      
      // Delete asset
      .addCase(deleteAsset.pending, (state) => {
        state.deletingAsset = true;
        state.error = null;
      })
      .addCase(deleteAsset.fulfilled, (state, action) => {
        state.deletingAsset = false;
        // Remove the asset from the list
        state.assets = state.assets.filter(asset => asset.id !== action.payload);
        if (state.currentAsset && state.currentAsset.id === action.payload) {
          state.currentAsset = null;
        }
      })
      .addCase(deleteAsset.rejected, (state, action) => {
        state.deletingAsset = false;
        state.error = action.payload;
      })
      
      // Fetch assets by category
      .addCase(fetchAssetsByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssetsByCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.assets = action.payload;
      })
      .addCase(fetchAssetsByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch asset with custom forms
      .addCase(fetchAssetWithCustomForms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssetWithCustomForms.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAsset = action.payload;
      })
      .addCase(fetchAssetWithCustomForms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update asset custom fields
      .addCase(updateAssetCustomFields.pending, (state) => {
        state.updatingAsset = true;
        state.error = null;
      })
      .addCase(updateAssetCustomFields.fulfilled, (state, action) => {
        state.updatingAsset = false;
        // Update the asset in the list
        const index = state.assets.findIndex(asset => asset.assetId === action.payload.assetId);
        if (index !== -1) {
          state.assets[index] = action.payload.asset;
        }
        if (state.currentAsset && state.currentAsset.assetId === action.payload.assetId) {
          state.currentAsset = action.payload.asset;
        }
      })
      .addCase(updateAssetCustomFields.rejected, (state, action) => {
        state.updatingAsset = false;
        state.error = action.payload;
      })
      
      // Validate asset
      .addCase(validateAsset.pending, (state) => {
        state.validatingAsset = true;
        state.error = null;
      })
      .addCase(validateAsset.fulfilled, (state, action) => {
        state.validatingAsset = false;
        // Store validation result in current asset
        if (state.currentAsset) {
          state.currentAsset.validationResult = action.payload;
        }
      })
      .addCase(validateAsset.rejected, (state, action) => {
        state.validatingAsset = false;
        state.error = action.payload;
      })
      
      // Get asset invoice URL
      .addCase(getAssetInvoiceUrl.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAssetInvoiceUrl.fulfilled, (state, action) => {
        state.loading = false;
        // Store invoice URL in current asset
        if (state.currentAsset) {
          state.currentAsset.invoiceUrl = action.payload.invoiceUrl;
        }
      })
      .addCase(getAssetInvoiceUrl.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentAsset, setCurrentAsset } = assetSlice.actions;

export default assetSlice.reducer; 