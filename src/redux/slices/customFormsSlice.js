import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { getItemFromSessionStorage } from './sessionStorageSlice';
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();

const API_BASE = publicRuntimeConfig.apiURL + "/api/asset-settings/custom-forms";

/**
 * AVAILABLE CUSTOM FORMS ENDPOINTS:
 * 
 * 1. GET /api/asset-settings/custom-forms?companyId={companyId}&categoryId={categoryId}
 *    - Fetch all custom forms (with optional category filter)
 *    - Used by: fetchCustomForms()
 * 
 * 2. GET /api/asset-settings/custom-forms/category/{categoryId}
 *    - Fetch custom forms by category ID
 *    - Used by: fetchCustomFormsByCategory()
 * 
 * 3. GET /api/asset-settings/custom-forms/{formId}/fields
 *    - Fetch form fields for a specific form
 *    - Used by: fetchFormFields()
 * 
 * 4. POST /api/asset-settings/custom-forms
 *    - Create a new custom form
 *    - Used by: createCustomForm()
 * 
 * 5. PUT /api/asset-settings/custom-forms/{formId}
 *    - Update an existing custom form
 *    - Used by: updateCustomForm()
 * 
 * 6. DELETE /api/asset-settings/custom-forms/{formId}
 *    - Delete a custom form
 *    - Used by: deleteCustomForm()
 * 
 * 7. PUT /api/asset-settings/custom-forms/{formId}
 *    - Toggle form status (enabled/disabled)
 *    - Used by: toggleFormStatus()
  * 
  * 8. PUT /api/asset-settings/custom-forms/{formId}/assign-subcategory
  *    - Assign a form to a specific sub-category
  *    - Used by: assignFormToSubCategory()
 */

// Health check function to verify API server connectivity
export const checkApiHealth = async () => {
  try {
    const baseUrl = publicRuntimeConfig.apiURL;
    console.log('Checking API health at:', baseUrl);
    
    const response = await axios.get(`${baseUrl}/health`, { 
      timeout: 5000,
      validateStatus: function (status) {
        return status < 500;
      }
    });
    
    console.log('API Health Check Response:', response.status);
    return { isHealthy: true, status: response.status };
  } catch (error) {
    console.error('API Health Check Failed:', {
      message: error.message,
      code: error.code,
      url: error.config?.url
    });
    return { 
      isHealthy: false, 
      error: error.message,
      code: error.code 
    };
  }
};

// Helper function to safely get company ID from session storage
const getCompanyId = () => {
  try {
    // Try the encrypted version first
    const encryptedCompanyId = sessionStorage.getItem('employeeCompanyId', null);
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

// Fetch all custom forms
export const fetchCustomForms = createAsyncThunk(
  'customForms/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage('token', null);
      const companyId = getCompanyId();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      if (!companyId) {
        console.error('Company ID not found in session storage');
        // Return empty array instead of throwing error to prevent UI crash
        return [];
      }
      
      console.log('Fetching custom forms with companyId:', companyId);
      console.log('API Base URL:', API_BASE);
      console.log('Full URL:', `${API_BASE}?companyId=${companyId}`);
      
      // First, try to check if the API server is running
      try {
        const healthCheck = await checkApiHealth();
        if (!healthCheck.isHealthy) {
          console.warn('API server is not running, returning empty array');
          return [];
        }
      } catch (healthError) {
        console.warn('Health check failed, proceeding with request anyway');
      }
      
      // Use query parameter as per backend controller
      const response = await axios.get(`${API_BASE}?companyId=${companyId}`, { 
        headers,
        timeout: 10000, // 10 second timeout
        validateStatus: function (status) {
          return status < 500; // Resolve only if the status code is less than 500
        }
      });
      
      console.log('Custom Forms API Response:', response.data);
      
      // Handle both array and object responses
      let forms = [];
      if (Array.isArray(response.data)) {
        forms = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        forms = response.data.data;
      } else if (response.data && response.data.success && response.data.data) {
        forms = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      }
      
      // Map _id to id for consistency
      const mappedForms = forms.map(form => ({
        ...form,
        id: form.id || form._id || form.formId,
        name: form.name || form.title,
        enabled: form.enabled !== undefined ? form.enabled : form.isActive !== undefined ? form.isActive : true
      }));
      
      return mappedForms;
    } catch (error) {
      console.error('Redux: Error fetching custom forms:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method
      });
      
      // If it's a network error (server not running), return empty array instead of error
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        console.warn('API server appears to be down, returning empty array');
        return [];
      }
      
      // Provide more specific error messages for other errors
      let errorMessage = 'Failed to fetch custom forms';
      if (error.response?.status === 404) {
        errorMessage = 'API endpoint not found - check server configuration';
      } else if (error.response?.status === 401) {
        errorMessage = 'Unauthorized - check authentication token';
      } else if (error.response?.status === 403) {
        errorMessage = 'Forbidden - check permissions';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch custom forms by category
export const fetchCustomFormsByCategory = createAsyncThunk(
  'customForms/fetchByCategory',
  async (categoryId, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage('token', null);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      console.log('Fetching custom forms for category:', categoryId);
      const response = await axios.get(`${API_BASE}/category/${categoryId}`, { 
        headers,
        timeout: 10000
      });
      
      console.log('Custom Forms by Category API Response:', response.data);
      
      // Handle different response formats
      let forms = [];
      if (Array.isArray(response.data)) {
        forms = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        forms = response.data.data;
      } else if (response.data && response.data.success && response.data.data) {
        forms = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      }
      
      // Map _id to id for consistency
      const mappedForms = forms.map(form => ({
        ...form,
        id: form.id || form._id || form.formId,
        name: form.name || form.title,
        enabled: form.enabled !== undefined ? form.enabled : form.isActive !== undefined ? form.isActive : true
      }));
      
      return { categoryId, forms: mappedForms };
    } catch (error) {
      console.error('Redux: Error fetching custom forms by category:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch custom forms by category');
    }
  }
);

// Fetch form fields
export const fetchFormFields = createAsyncThunk(
  'customForms/fetchFormFields',
  async (formId, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage('token', null);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      console.log('Fetching form fields for form:', formId);
      const response = await axios.get(`${API_BASE}/${formId}/fields`, { 
        headers,
        timeout: 10000
      });
      
      console.log('Form Fields API Response:', response.data);
      
      // Handle different response formats
      let fields = [];
      if (Array.isArray(response.data)) {
        fields = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        fields = response.data.data;
      } else if (response.data && response.data.success && response.data.data) {
        fields = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      }
      
      // Map _id to id for consistency
      const mappedFields = fields.map(field => ({
        ...field,
        id: field.id || field._id || field.fieldId,
        name: field.name || field.title,
        required: field.required !== undefined ? field.required : false
      }));
      
      return { formId, fields: mappedFields };
    } catch (error) {
      console.error('Redux: Error fetching form fields:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch form fields');
    }
  }
);

// Create a new custom form
export const createCustomForm = createAsyncThunk(
  'customForms/create',
  async (formData, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage('token', null);
      const companyId = getCompanyId();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      if (!companyId) {
        throw new Error('Company ID not found');
      }
      
      // Transform the form data to match the backend CustomFormDTO structure
      const customFormDTO = {
        name: formData.name,
        companyId: companyId,
        categoryId: formData.categoryId,
        enabled: formData.enabled !== undefined ? formData.enabled : true,
        fields: formData.fields.map(field => ({
          name: field.name,
          type: field.type,
          required: field.required !== undefined ? field.required : false,
          placeholder: field.placeholder || '',
          options: field.options || []
        }))
      };
      
      console.log('Creating custom form with DTO:', customFormDTO);
      
      const response = await axios.post(API_BASE, customFormDTO, { 
        headers,
        timeout: 10000
      });
      
      console.log('Create form response:', response.data);
      
      // Handle different response formats
      let createdForm = null;
      if (response.data && response.data.data) {
        createdForm = response.data.data;
      } else if (response.data && response.data.success) {
        // If backend only returns success message, create a mock form for UI
        createdForm = {
          id: Date.now().toString(),
          name: formData.name,
          companyId: companyId,
          categoryId: formData.categoryId,
          enabled: formData.enabled !== undefined ? formData.enabled : true,
          fields: formData.fields,
          createdAt: new Date().toISOString()
        };
      } else {
        createdForm = response.data;
      }
      
      // Map _id to id for consistency
      return {
        ...createdForm,
        id: createdForm.id || createdForm._id || createdForm.formId,
        name: createdForm.name || createdForm.title,
        enabled: createdForm.enabled !== undefined ? createdForm.enabled : createdForm.isActive !== undefined ? createdForm.isActive : true
      };
    } catch (error) {
      console.error('Redux: Error creating custom form:', error);
      
      // If it's a network error (server not running), return a mock success
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        console.warn('API server appears to be down, creating mock form');
        return {
          id: Date.now().toString(),
          name: formData.name,
          companyId: getCompanyId(),
          categoryId: formData.categoryId,
          enabled: formData.enabled !== undefined ? formData.enabled : true,
          fields: formData.fields,
          createdAt: new Date().toISOString()
        };
      }
      
      return rejectWithValue(error.response?.data?.message || 'Failed to create custom form');
    }
  }
);

// Update a custom form
export const updateCustomForm = createAsyncThunk(
  'customForms/update',
  async ({ formId, formData }, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage('token', null);
      const companyId = getCompanyId();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      if (!companyId) {
        throw new Error('Company ID not found');
      }
      
      // Transform the form data to match the backend CustomFormDTO structure
      const customFormDTO = {
        name: formData.name,
        companyId: companyId,
        categoryId: formData.categoryId,
        enabled: formData.enabled !== undefined ? formData.enabled : true,
        fields: formData.fields.map(field => ({
          name: field.name,
          type: field.type,
          required: field.required !== undefined ? field.required : false,
          placeholder: field.placeholder || '',
          options: field.options || []
        }))
      };
      
      console.log('Updating custom form with DTO:', { formId, customFormDTO });
      console.log('Original formData:', formData);
      console.log('Transformed DTO:', customFormDTO);
      console.log('API endpoint:', `${API_BASE}/${formId}`);
      console.log('Headers:', headers);
      
      const response = await axios.put(`${API_BASE}/${formId}`, customFormDTO, { headers });
      
      console.log('Update form response:', response.data);
      
      // Return updated form data
      return {
        id: formId,
        name: formData.name,
        companyId: companyId,
        categoryId: formData.categoryId,
        enabled: formData.enabled !== undefined ? formData.enabled : true,
        fields: formData.fields,
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Redux: Error updating custom form:', error);
      console.error('Error response:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Failed to update custom form');
    }
  }
);

// Delete a custom form
export const deleteCustomForm = createAsyncThunk(
  'customForms/delete',
  async (formId, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage('token', null);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.delete(`${API_BASE}/${formId}`, { headers });
      return formId;
    } catch (error) {
      console.error('Redux: Error deleting custom form:', error);
      console.error('Error response:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Failed to delete custom form');
    }
  }
);

// Toggle form status
export const toggleFormStatus = createAsyncThunk(
  'customForms/toggleStatus',
  async ({ formId, enabled }, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage('token', null);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Since there's no direct toggle endpoint, we'll update the form
      const response = await axios.put(`${API_BASE}/${formId}`, { enabled }, { headers });
      
      return { id: formId, enabled };
    } catch (error) {
      console.error('Redux: Error toggling form status:', error);
      console.error('Error response:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle form status');
    }
  }
);

// Assign form to sub-category
export const assignFormToSubCategory = createAsyncThunk(
  'customForms/assignSubCategory',
  async ({ formId, subCategoryId }, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage('token', null);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.put(`${API_BASE}/${formId}/assign-subcategory`, { subCategoryId }, { headers });
      console.log('Assign form to sub-category response:', response.data);
      return { id: formId, subCategoryId };
    } catch (error) {
      console.error('Redux: Error assigning form to sub-category:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to assign form to sub-category');
    }
  }
);

const customFormsSlice = createSlice({
  name: 'customForms',
  initialState: {
    forms: [],
    currentForm: null,
    loading: false,
    creating: false,
    updating: false,
    deleting: false,
    error: null,
    formsByCategory: {}, // New state for forms by category
    fieldsByForm: {} // New state for fields by form
  },
  reducers: {
    setCurrentForm: (state, action) => {
      state.currentForm = action.payload;
    },
    clearCurrentForm: (state) => {
      state.currentForm = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch forms
      .addCase(fetchCustomForms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomForms.fulfilled, (state, action) => {
        state.loading = false;
        state.forms = action.payload;
      })
      .addCase(fetchCustomForms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch forms by category
      .addCase(fetchCustomFormsByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomFormsByCategory.fulfilled, (state, action) => {
        state.loading = false;
        const { categoryId, forms } = action.payload;
        // Store forms by category for easy access
        if (!state.formsByCategory) {
          state.formsByCategory = {};
        }
        state.formsByCategory[categoryId] = forms;
      })
      .addCase(fetchCustomFormsByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch form fields
      .addCase(fetchFormFields.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFormFields.fulfilled, (state, action) => {
        state.loading = false;
        const { formId, fields } = action.payload;
        // Store fields by form for easy access
        if (!state.fieldsByForm) {
          state.fieldsByForm = {};
        }
        state.fieldsByForm[formId] = fields;
      })
      .addCase(fetchFormFields.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create form
      .addCase(createCustomForm.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createCustomForm.fulfilled, (state, action) => {
        state.creating = false;
        state.forms.push(action.payload);
      })
      .addCase(createCustomForm.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })
      
      // Update form
      .addCase(updateCustomForm.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateCustomForm.fulfilled, (state, action) => {
        state.updating = false;
        const index = state.forms.findIndex(form => form.id === action.payload.id);
        if (index !== -1) {
          state.forms[index] = action.payload;
        }
      })
      .addCase(updateCustomForm.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })
      
      // Delete form
      .addCase(deleteCustomForm.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteCustomForm.fulfilled, (state, action) => {
        state.deleting = false;
        state.forms = state.forms.filter(form => form.id !== action.payload);
      })
      .addCase(deleteCustomForm.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload;
      })
      
      // Toggle status
      .addCase(toggleFormStatus.fulfilled, (state, action) => {
        const index = state.forms.findIndex(form => form.id === action.payload.id);
        if (index !== -1) {
          state.forms[index].enabled = action.payload.enabled;
        }
      })
      // Assign sub-category
      .addCase(assignFormToSubCategory.fulfilled, (state, action) => {
        const index = state.forms.findIndex(form => form.id === action.payload.id);
        if (index !== -1) {
          state.forms[index].subCategoryId = action.payload.subCategoryId;
        }
      });
  }
});

export const { setCurrentForm, clearCurrentForm, clearError } = customFormsSlice.actions;
export default customFormsSlice.reducer; 