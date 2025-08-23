import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getItemFromSessionStorage } from "./sessionStorageSlice";
import getConfig from "next/config";
import axios from 'axios';
const { publicRuntimeConfig } = getConfig();
const API_BASE_URL = publicRuntimeConfig.apiURL;

const getAuthHeaders = () => {
const token = getItemFromSessionStorage("token", null);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get first date of current month + 1 day
const currentDate = new Date();
const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 2).toISOString().split('T')[0];
// Get last date of current month + 1 day
const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toISOString().split('T')[0];

export const fetchLeads = createAsyncThunk(
  'leads/fetchLeads',
  async (params = {}, { rejectWithValue }) => {
    try {
        const companyId = sessionStorage.getItem("employeeCompanyId");
        
        let url = `${API_BASE_URL}/leads/kanban-cards/${companyId}`;

        console.log('startDate', startDate);
        console.log('endDate', endDate);
        
        // Only add employeeId filter if explicitly provided (for Lead Management)
        // Manager pages will call fetchLeads() without params to get all leads
        if (params.employeeId) {
          url += `?assignedSalesRep=${params.employeeId}`;
        }

        if (!params.all) {
          const separator = params.employeeId ? '&' : '?';
          url += `${separator}startDate=${startDate}&endDate=${endDate}`;
        }
        
        const res = await axios.get(url, {
          headers: getAuthHeaders(),
        });
        return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);



export const fetchLeadById = createAsyncThunk(
    "leads/fetchLeadById",
    async (id, { rejectWithValue }) => {
        try {
            const token = getItemFromSessionStorage("token", null);

            const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch lead by ID");
            }
            return await response.json();

        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const createLead = createAsyncThunk(
    "leads/createLead",
    async (leadData, { rejectWithValue }) => {
        try {
            const token = getItemFromSessionStorage("token", null);
            const response = await fetch(`${API_BASE_URL}/leads`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(leadData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to create lead");
            }
            return await response.json();

        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateLead = createAsyncThunk(
    "leads/updateLead",
    async (leadData, { rejectWithValue }) => {
        try {
            const token = getItemFromSessionStorage("token", null);
            const leadId = leadData.leadId; // Handle both id and leadId
            console.log('updateLead - Input data:', leadData);

            if (!leadId) {
                throw new Error("Lead ID is required for update");
            }

            console.log('updateLead - Making API call to:', `${API_BASE_URL}/leads/${leadId}`);
            console.log('updateLead - Request body:', JSON.stringify(leadData, null, 2));

            const response = await fetch(`${API_BASE_URL}/leads/${leadId}`, {
                method: "PUT",  
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(leadData)
            });

            console.log('updateLead - Response status:', response.status);
            console.log('updateLead - Response ok:', response.ok);

            if (!response.ok) {
                const errorData = await response.json();
                console.log('updateLead - Error response:', errorData);
                throw new Error(errorData.message || "Failed to update lead");
            }
            
            const result = await response.json();
            console.log('updateLead - Success response:', result);
            return result;

        } catch (error) {
            console.log('updateLead - Error:', error);
            return rejectWithValue(error.message);
        }
    }
);

export const moveLeadToPipeline = createAsyncThunk(
  'leads/moveToPipeline',
  async ({ leadId, newPipelineId }, { dispatch, rejectWithValue }) => {
    try {
      console.log(`Moving lead ${leadId} to stage ${newPipelineId}`);
      
      const response = await axios.patch(`${API_BASE_URL}/leads/${leadId}/stage/${newPipelineId}`, {}, {
        headers: getAuthHeaders(),
      });
      
      console.log('Move lead response:', response.data);
      
      // Refetch all leads after move to get updated grouped format (silent to avoid UI blinking)
      dispatch(fetchLeads({ silent: true }));
      
      return { leadId, newPipelineId };
    } catch (error) {
      console.error('Error moving lead:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const leadsSlice = createSlice({
    name: "leads",
    initialState: {
        leads: [],
        lead: null,
        loading: false,
        error: null,
        status: 'idle',
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchLeads.pending, (state, action) => {
                // Avoid UI blinking during background refreshes
                if (action?.meta?.arg?.silent) {
                    return;
                }
                state.loading = true;
                state.error = null;
                state.status = 'loading';
            })
            .addCase(fetchLeads.fulfilled, (state, action) => {
                // Always update data, but avoid toggling loading/status on silent refresh
                if (action?.meta?.arg?.silent) {
                    state.leads = action.payload;
                    return;
                }
                state.loading = false;
                state.leads = action.payload;
                state.status = 'succeeded';
            })
            .addCase(fetchLeads.rejected, (state, action) => {
                if (action?.meta?.arg?.silent) {
                    // Keep previous UI state on silent errors
                    return;
                }
                state.loading = false;
                state.error = action.payload || action.error.message;
                state.status = 'failed';
            })

            .addCase(updateLead.pending, (state) => {
                // Do not toggle global list loading during mutations to avoid page-level spinners
                state.error = null;
            })
            .addCase(updateLead.fulfilled, (state, action) => {
                state.error = null;
                // Update the lead in the leads array (handle both grouped and flat formats)
                if (Array.isArray(state.leads) && state.leads.length > 0) {
                    // Check if leads are in grouped format (with stageId and leads properties)
                    if (state.leads[0].stageId && state.leads[0].leads) {
                        // Grouped format: search through all stage groups
                        state.leads.forEach(stageGroup => {
                            if (stageGroup.leads) {
                                const leadIndex = stageGroup.leads.findIndex(lead => lead.leadId === action.payload.leadId);
                                if (leadIndex !== -1) {
                                    stageGroup.leads[leadIndex] = action.payload;
                                }
                            }
                        });
                    } else {
                        // Flat format: direct array of leads
                        const index = state.leads.findIndex(lead => lead.leadId === action.payload.leadId);
                        if (index !== -1) {
                            state.leads[index] = action.payload;
                        }
                    }
                }
            })
            .addCase(updateLead.rejected, (state, action) => {
                state.error = action.error.message;
            })

            .addCase(createLead.pending, (state) => {
                // Do not toggle global list loading during create to avoid page-level spinners
            })
            .addCase(createLead.fulfilled, (state, action) => {
                // Add the new lead to the leads array
                state.leads.push(action.payload);
            })
            .addCase(createLead.rejected, (state, action) => {
                state.error = action.error.message;
            })

            .addCase(fetchLeadById.pending, (state) => {
                state.loading = true;
                state.lead = null;
            })
            .addCase(fetchLeadById.fulfilled, (state, action) => {
                state.loading = false;
                state.lead = action.payload;
            })
            .addCase(fetchLeadById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
                state.lead = null;
            })
            .addCase(moveLeadToPipeline.pending, (state) => {
                // Keep UI stable during move; avoid global loading flips
                state.error = null;
            })
            .addCase(moveLeadToPipeline.fulfilled, (state, action) => {
                state.error = null;
                // The leads will be refreshed by fetchLeads, so no need to update here
            })
            .addCase(moveLeadToPipeline.rejected, (state, action) => {
                state.error = action.payload || action.error.message;
            })
    }
});

export default leadsSlice.reducer;


