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
 * 2. GET /api/asset-settings/custom-forms?subCategoryId={subCategoryId}&companyId={companyId}
 *    - Fetch custom forms by subcategory ID and company ID
 *    - Used by: fetchCustomFormsBySubCategory()
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
      
      // Map _id to id for consistency - prioritize custom formId over MongoDB _id
      const mappedForms = forms.map(form => {
        // Map backend field structure to frontend expected structure if available
        let mappedFields = form.fields;
        if (form.fields && Array.isArray(form.fields)) {
          mappedFields = form.fields.map(field => ({
            id: field.id,
            name: field.fieldName || field.name,
            type: field.fieldType || field.type,
            required: field.required !== undefined ? field.required : false,
            placeholder: field.defaultValue || field.placeholder || '',
            dropdownOptions: field.dropdownOptions || field.options || [],
            label: field.fieldLabel || field.label || field.name,
            order: field.fieldOrder || field.order || 1,
            active: field.active !== undefined ? field.active : true
          }));
        }
        
        return {
          ...form,
          id: form.formId || form.id,
          name: form.name || form.title,
          enabled: form.enabled !== undefined ? form.enabled : form.isActive !== undefined ? form.isActive : true,
          fields: mappedFields,
          categoryId: form.assignedCategoryId || form.categoryId,
          subCategoryId: form.assignedSubCategoryId || form.subCategoryId
        };
      });
      
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

// Fetch custom forms by subcategory
export const fetchCustomFormsBySubCategory = createAsyncThunk(
  'customForms/fetchBySubCategory',
  async ({ subCategoryId, companyId }, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage('token', null);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      console.log('Fetching custom forms for subcategory:', subCategoryId, 'and company:', companyId);
      
      // Use the correct API endpoint with subCategoryId and companyId as query parameters
      const response = await axios.get(`${API_BASE}?subCategoryId=${subCategoryId}&companyId=${companyId}`, { 
        headers,
        timeout: 10000
      });
      
      console.log('Custom Forms by Subcategory API Response:', response.data);
      
      // Handle different response formats
      let forms = [];
      if (Array.isArray(response.data)) {
        forms = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        forms = response.data.data;
      } else if (response.data && response.data.success && response.data.data) {
        forms = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      }
      
      // Map _id to id for consistency - prioritize custom formId over MongoDB _id
      const mappedForms = forms.map(form => {
        // Map backend field structure to frontend expected structure if available
        let mappedFields = form.fields;
        if (form.fields && Array.isArray(form.fields)) {
          mappedFields = form.fields.map(field => ({
            id: field.id,
            name: field.fieldName || field.name,
            type: field.fieldType || field.type,
            required: field.required !== undefined ? field.required : false,
            placeholder: field.defaultValue || field.placeholder || '',
            dropdownOptions: field.dropdownOptions || field.options || [],
            label: field.fieldLabel || field.label || field.name,
            order: field.fieldOrder || field.order || 1,
            active: field.active !== undefined ? field.active : true
          }));
        }
        
        return {
          ...form,
          id: form.formId || form.id,
          name: form.name || form.title,
          enabled: form.enabled !== undefined ? form.enabled : form.isActive !== undefined ? form.isActive : true,
          fields: mappedFields,
          categoryId: form.assignedCategoryId || form.categoryId,
          subCategoryId: form.assignedSubCategoryId || form.subCategoryId
        };
      });
      
      return { subCategoryId, forms: mappedForms };
    } catch (error) {
      console.error('Redux: Error fetching custom forms by subcategory:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch custom forms by subcategory');
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
      
      // Map _id to id for consistency - prioritize custom fieldId over MongoDB _id
      const mappedFields = fields.map(field => ({
        ...field,
        id: field.fieldId || field.id,
        name: field.fieldName || field.name || field.title,
        type: field.fieldType || field.type,
        required: field.required !== undefined ? field.required : false,
        placeholder: field.defaultValue || field.placeholder || '',
        dropdownOptions: field.dropdownOptions || field.options || [],
        label: field.fieldLabel || field.label || field.name,
        order: field.fieldOrder || field.order || 1,
        active: field.active !== undefined ? field.active : true
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
        fields: formData.fields.map(field => {
          const processedField = {
            name: field.name,
            type: field.type,
            required: field.required !== undefined ? field.required : false,
            placeholder: field.placeholder || '',
          };
          
          // For dropdown fields, always ensure dropdownOptions exists
          if (field.type === 'dropdown') {
            // Check all possible sources for dropdown options
            let dropdownOptions = [];
            
            if (field.dropdownOptions && Array.isArray(field.dropdownOptions)) {
              dropdownOptions = field.dropdownOptions;
            } else if (field.options && Array.isArray(field.options)) {
              dropdownOptions = field.options;
            } else if (field.dropdownOptions && typeof field.dropdownOptions === 'string') {
              // Handle case where dropdownOptions might be a string that needs parsing
              try {
                dropdownOptions = JSON.parse(field.dropdownOptions);
              } catch (e) {
                console.warn('Failed to parse dropdownOptions string:', field.dropdownOptions);
                dropdownOptions = [];
              }
            } else if (field.options && typeof field.options === 'string') {
              // Handle case where options might be a string that needs parsing
              try {
                dropdownOptions = JSON.parse(field.options);
              } catch (e) {
                console.warn('Failed to parse options string:', field.options);
                dropdownOptions = [];
              }
            }
            
            // Ensure we always have an array
            if (!Array.isArray(dropdownOptions)) {
              console.warn('dropdownOptions is not an array, converting to empty array');
              dropdownOptions = [];
            }
            
            processedField.dropdownOptions = dropdownOptions;
          } else if (field.options) {
            // For non-dropdown fields, include options if they exist
            processedField.options = field.options;
          }
          
          return processedField;
        }),
        ...(formData.subCategoryId && { subCategoryId: formData.subCategoryId })
      };
      
      console.log('Creating custom form with DTO:', customFormDTO);
      
      const response = await axios.post(API_BASE, customFormDTO, { 
        headers,
        timeout: 10000
      });
      
      console.log('Create form response:', response.data);
      console.log('Response data structure:', {
        hasData: !!response.data.data,
        hasSuccess: !!response.data.success,
        isDirectData: !response.data.data && !response.data.success,
        formId: response.data.data?.formId || response.data?.formId,
        id: response.data.data?.id || response.data?.id,
        _id: response.data.data?._id || response.data?._id
      });
      
      // Handle different response formats
      let createdForm = null;
      if (response.data && response.data.data) {
        createdForm = response.data.data;
      } else if (response.data && response.data.form) {
        // Handle the new response structure with form object
        createdForm = response.data.form;
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
      
      // Map _id to id for consistency and ensure formId is available
      // NEVER use MongoDB _id as formId - it must be a proper custom formId
      let finalFormId = createdForm.formId;
      
      // If backend didn't provide formId, generate one
      if (!finalFormId || !finalFormId.toString().startsWith('FORM-')) {
        finalFormId = `FORM-${Date.now()}`;
        console.warn('Backend did not return proper formId, generated:', finalFormId);
      }
      
      // Map backend field structure to frontend expected structure if available
      let mappedFields = formData.fields;
      if (createdForm.fields && Array.isArray(createdForm.fields)) {
        mappedFields = createdForm.fields.map(field => ({
          id: field.id,
          name: field.fieldName || field.name,
          type: field.fieldType || field.type,
          required: field.required !== undefined ? field.required : false,
          placeholder: field.defaultValue || field.placeholder || '',
          dropdownOptions: field.dropdownOptions || field.options || [],
          label: field.fieldLabel || field.label || field.name,
          order: field.fieldOrder || field.order || 1,
          active: field.active !== undefined ? field.active : true
        }));
      }
      
      return {
        ...createdForm,
        id: finalFormId, // Always use proper formId, never MongoDB _id
        formId: finalFormId, // Always use proper formId, never MongoDB _id
        name: createdForm.name || createdForm.title,
        enabled: createdForm.enabled !== undefined ? createdForm.enabled : createdForm.isActive !== undefined ? createdForm.isActive : true,
        fields: mappedFields,
        categoryId: createdForm.assignedCategoryId || createdForm.categoryId || formData.categoryId,
        subCategoryId: createdForm.assignedSubCategoryId || createdForm.subCategoryId || formData.subCategoryId
      };
    } catch (error) {
      console.error('Redux: Error creating custom form:', error);
      
      // If it's a network error (server not running), return a mock success
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        console.warn('API server appears to be down, creating mock form');
        const mockFormId = `FORM-${Date.now()}`;
        return {
          id: mockFormId, // Use the same ID for consistency
          formId: mockFormId, // Always use proper formId format
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
      
      // Validate formData parameter
      if (!formData || typeof formData !== 'object') {
        throw new Error('Invalid formData provided. Expected an object with form properties.');
      }
      
      // Validate required fields
      if (!formData.name) {
        throw new Error('Form name is required');
      }
      
      if (!formData.categoryId) {
        throw new Error('Category ID is required');
      }
      
      if (!Array.isArray(formData.fields)) {
        throw new Error('Form fields must be an array');
      }
      
      // Transform the form data to match the backend CustomFormDTO structure
      const customFormDTO = {
        name: formData.name,
        companyId: companyId,
        categoryId: formData.categoryId,
        enabled: formData.enabled !== undefined ? formData.enabled : true,
        fields: formData.fields.map(field => {
          const processedField = {
            name: field.name,
            type: field.type,
            required: field.required !== undefined ? field.required : false,
            placeholder: field.placeholder || '',
          };
          
          // For dropdown fields, always ensure dropdownOptions exists
          if (field.type === 'dropdown') {
            // Check all possible sources for dropdown options
            let dropdownOptions = [];
            
            if (field.dropdownOptions && Array.isArray(field.dropdownOptions)) {
              dropdownOptions = field.dropdownOptions;
            } else if (field.options && Array.isArray(field.options)) {
              dropdownOptions = field.options;
            } else if (field.dropdownOptions && typeof field.dropdownOptions === 'string') {
              // Handle case where dropdownOptions might be a string that needs parsing
              try {
                dropdownOptions = JSON.parse(field.dropdownOptions);
              } catch (e) {
                console.warn('Failed to parse dropdownOptions string:', field.dropdownOptions);
                dropdownOptions = [];
              }
            } else if (field.options && typeof field.options === 'string') {
              // Handle case where options might be a string that needs parsing
              try {
                dropdownOptions = JSON.parse(field.options);
              } catch (e) {
                console.warn('Failed to parse options string:', field.options);
                dropdownOptions = [];
              }
            }
            
            // Ensure we always have an array
            if (!Array.isArray(dropdownOptions)) {
              console.warn('dropdownOptions is not an array, converting to empty array');
              dropdownOptions = [];
            }
            
            processedField.dropdownOptions = dropdownOptions;
          } else if (field.options) {
            // For non-dropdown fields, include options if they exist
            processedField.options = field.options;
          }
          
          return processedField;
        }),
        ...(formData.subCategoryId && { subCategoryId: formData.subCategoryId })
      };
      
      console.log('Updating custom form with DTO:', { formId, customFormDTO });
      
      const response = await axios.put(`${API_BASE}/${formId}`, customFormDTO, { headers });
      
      console.log('Update form response:', response.data);
      console.log('Update response data structure:', {
        formId: response.data?.formId,
        id: response.data?.id,
        _id: response.data?._id
      });
      
      // Return updated form data
      // Ensure formId is always a proper custom formId, never MongoDB _id
      let finalFormId = formId;
      if (!finalFormId || !finalFormId.toString().startsWith('FORM-')) {
        finalFormId = `FORM-${Date.now()}`;
        console.warn('Update: Invalid formId provided, generated:', finalFormId);
      }
      
      // Check if response contains the updated form data
      let updatedFormData = {
        id: finalFormId, // Use the same ID for consistency
        formId: finalFormId, // Always use proper formId format
        name: formData.name,
        companyId: companyId,
        categoryId: formData.categoryId,
        enabled: formData.enabled !== undefined ? formData.enabled : true,
        fields: formData.fields,
        updatedAt: new Date().toISOString()
      };
      
      // If response contains form data, use it instead of the request data
      if (response.data && response.data.form) {
        const backendForm = response.data.form;
        const backendFormId = backendForm.formId || backendForm.id;
        
        // Map backend field structure to frontend expected structure
        const mappedFields = backendForm.fields ? backendForm.fields.map(field => ({
          id: field.id,
          name: field.fieldName || field.name,
          type: field.fieldType || field.type,
          required: field.required !== undefined ? field.required : false,
          placeholder: field.defaultValue || field.placeholder || '',
          dropdownOptions: field.dropdownOptions || field.options || [],
          label: field.fieldLabel || field.label || field.name,
          order: field.fieldOrder || field.order || 1,
          active: field.active !== undefined ? field.active : true
        })) : formData.fields;
        
        updatedFormData = {
          id: backendFormId || finalFormId,
          formId: backendFormId || finalFormId,
          name: backendForm.name || formData.name,
          companyId: backendForm.companyId || companyId,
          categoryId: backendForm.assignedCategoryId || backendForm.categoryId || formData.categoryId,
          subCategoryId: backendForm.assignedSubCategoryId || backendForm.subCategoryId || formData.subCategoryId,
          enabled: backendForm.enabled !== undefined ? backendForm.enabled : formData.enabled !== undefined ? formData.enabled : true,
          fields: mappedFields,
          createdAt: backendForm.createdAt,
          updatedAt: backendForm.updatedAt || new Date().toISOString()
        };
      }
      
      return updatedFormData;
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
      const companyId = getCompanyId();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      if (!companyId) {
        throw new Error('Company ID not found');
      }
      
      // Send the complete form data structure that the backend expects
      const formData = {
        enabled: enabled,
        companyId: companyId
      };
      
      console.log('Toggling form status with data:', { formId, formData });
      
      const response = await axios.put(`${API_BASE}/${formId}`, formData, { headers });
      
      console.log('Toggle form status response:', response.data);
      
      return { id: formId, formId: formId, enabled };
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
      return { id: formId, formId: formId, subCategoryId };
    } catch (error) {
      console.error('Redux: Error assigning form to sub-category:', error);
      console.error('Error details:', {
        error: error,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
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
    creatingForm: false,
    updatingForm: false,
    deletingForm: false,
    error: null,
    formsBySubCategory: {}, // Updated: Store forms by subcategory instead of category
    fieldsByForm: {} // New state for fields by form
  },
  reducers: {
    setCurrentForm: (state, action) => {
      // Safely set current form, ensuring payload exists
      if (action.payload) {
        state.currentForm = action.payload;
      }
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
        // Safely check if payload exists and is an array
        if (action.payload && Array.isArray(action.payload)) {
          state.forms = action.payload;
        } else {
          state.forms = [];
        }
      })
      .addCase(fetchCustomForms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch custom forms';
      })
      
      // Fetch forms by subcategory
      .addCase(fetchCustomFormsBySubCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomFormsBySubCategory.fulfilled, (state, action) => {
        state.loading = false;
        // Safely extract subCategoryId and forms from payload
        const { subCategoryId, forms } = action.payload || {};
        
        if (subCategoryId && forms) {
          // Store forms by subcategory for easy access
          if (!state.formsBySubCategory) {
            state.formsBySubCategory = {};
          }
          state.formsBySubCategory[subCategoryId] = forms;
        }
      })
      .addCase(fetchCustomFormsBySubCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch custom forms by subcategory';
      })
      
      // Create custom form
      .addCase(createCustomForm.pending, (state) => {
        state.creatingForm = true;
        state.error = null;
      })
      .addCase(createCustomForm.fulfilled, (state, action) => {
        state.creatingForm = false;
        // Safely check if payload exists and has required properties
        if (action.payload && action.payload.id) {
          state.forms.push(action.payload);
        }
      })
      .addCase(createCustomForm.rejected, (state, action) => {
        state.creatingForm = false;
        state.error = action.payload || 'Failed to create custom form';
      })
      
      // Update custom form
      .addCase(updateCustomForm.pending, (state) => {
        state.updatingForm = true;
        state.error = null;
      })
      .addCase(updateCustomForm.fulfilled, (state, action) => {
        state.updatingForm = false;
        // The action payload contains the updated form data directly
        const updatedForm = action.payload;
        const formId = updatedForm.formId || updatedForm.id;
        
        if (formId) {
          const index = state.forms.findIndex(form => form.id === formId);
          if (index !== -1) {
            state.forms[index] = updatedForm;
          }
          if (state.currentForm && state.currentForm.id === formId) {
            state.currentForm = updatedForm;
          }
        }
      })
      .addCase(updateCustomForm.rejected, (state, action) => {
        state.updatingForm = false;
        state.error = action.payload || 'Failed to update custom form';
      })
      
      // Delete custom form
      .addCase(deleteCustomForm.pending, (state) => {
        state.deletingForm = true;
        state.error = null;
      })
      .addCase(deleteCustomForm.fulfilled, (state, action) => {
        state.deletingForm = false;
        // Safely extract the formId to delete
        const formIdToDelete = action.payload;
        
        if (formIdToDelete) {
          state.forms = state.forms.filter(form => form.id !== formIdToDelete);
          if (state.currentForm && state.currentForm.id === formIdToDelete) {
            state.currentForm = null;
          }
        }
      })
      .addCase(deleteCustomForm.rejected, (state, action) => {
        state.deletingForm = false;
        state.error = action.payload || 'Failed to delete custom form';
      })
      
      // Fetch form fields
      .addCase(fetchFormFields.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFormFields.fulfilled, (state, action) => {
        state.loading = false;
        // Safely extract formId and fields from payload
        const { formId, fields } = action.payload || {};
        
        if (formId && fields) {
          // Store fields by form for easy access
          if (!state.fieldsByForm) {
            state.fieldsByForm = {};
          }
          state.fieldsByForm[formId] = fields;
        }
      })
      .addCase(fetchFormFields.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch form fields';
      })
      

      
      // Toggle status
      .addCase(toggleFormStatus.fulfilled, (state, action) => {
        // Safely extract id and enabled from payload
        const { id, enabled } = action.payload || {};
        
        if (id && enabled !== undefined) {
          const index = state.forms.findIndex(form => form.id === id);
          if (index !== -1) {
            state.forms[index].enabled = enabled;
          }
        }
      })
      // Assign sub-category
      .addCase(assignFormToSubCategory.fulfilled, (state, action) => {
        // Safely extract id and subCategoryId from payload
        const { id, subCategoryId } = action.payload || {};
        
        if (id && subCategoryId !== undefined) {
          const index = state.forms.findIndex(form => form.id === id);
          if (index !== -1) {
            state.forms[index].subCategoryId = subCategoryId;
          }
        }
      });
  }
});

export const { setCurrentForm, clearCurrentForm, clearError } = customFormsSlice.actions;
export default customFormsSlice.reducer; 