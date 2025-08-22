import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { getItemFromSessionStorage } from "./sessionStorageSlice";
import getConfig from "next/config";
const {publicRuntimeConfig} = getConfig();

// Async thunk for fetching TDS settings
export const fetchTDS = createAsyncThunk(
  "payrollSettings/fetchTDS",
  async (_, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const company = sessionStorage.getItem("employeeCompanyId");
      const response = await axios.get(
        `${publicRuntimeConfig.apiURL}/tds-settings/company/${company}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      return rejectWithValue(error.response?.data?.message || "Failed to fetch TDS settings");
    }
  }
);

// Async thunk for fetching Professional Tax settings from main payroll settings
export const fetchPTAX = createAsyncThunk(
  "payrollSettings/fetchPTAX",
  async (_, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const company = sessionStorage.getItem("employeeCompanyId");
      const response = await axios.get(
        `${publicRuntimeConfig.apiURL}/api/settings/payroll/company/${company}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Extract professional tax data from the response
      if (response.data && response.data.professionalTaxThreshold !== undefined) {
        return {
          monthlySalaryThreshold: response.data.professionalTaxThreshold,
          amountAboveThreshold: response.data.professionalTaxAmountAboveThreshold,
          amountBelowThreshold: response.data.professionalTaxAmountBelowThreshold,
          description: response.data.description || "",
        };
      }
      return null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      return rejectWithValue(error.response?.data?.message || "Failed to fetch Professional Tax settings");
    }
  }
);

// Async thunk for fetching Pay Structure settings from main payroll settings
export const fetchPayStructureSettings = createAsyncThunk(
  "payrollSettings/fetchPayStructureSettings",
  async (_, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const company = sessionStorage.getItem("employeeCompanyId");
      const response = await axios.get(
        `${publicRuntimeConfig.apiURL}/api/settings/payroll/company/${company}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Extract pay structure data from the response
      if (response.data && response.data.basicPercentage !== undefined) {
        return {
          basicPercentage: response.data.basicPercentage,
          hraPercentage: response.data.hraPercentage,
          employerPfPercentage: response.data.employerPfPercentage,
          employeePfPercentage: response.data.employeePfPercentage,
          pfCap: response.data.pfCap,
          professionalTaxThreshold: response.data.professionalTaxThreshold || 0,
          professionalTaxAmountAboveThreshold: response.data.professionalTaxAmountAboveThreshold || 0,
          professionalTaxAmountBelowThreshold: response.data.professionalTaxAmountBelowThreshold || 0,
          description: response.data.description || "",
        };
      }
      return null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      return rejectWithValue(error.response?.data?.message || "Failed to fetch Pay Structure settings");
    }
  }
);

// Async thunk for fetching Payroll Freeze Settings
export const fetchPayrollFreezeSettings = createAsyncThunk(
  "payrollSettings/fetchPayrollFreezeSettings",
  async (_, { rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const company = sessionStorage.getItem("employeeCompanyId");
      const response = await axios.get(
        `${publicRuntimeConfig.apiURL}/api/settings/payroll/company/${company}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      return rejectWithValue(error.response?.data?.message || "Failed to fetch Payroll Freeze settings");
    }
  }
);

// Async thunk for saving/updating TDS settings
export const saveTDS = createAsyncThunk(
  "payrollSettings/saveTDS",
  async (tdsData, { getState, rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const companyId = sessionStorage.getItem("employeeCompanyId");
      const { isTdsConfigured } = getState().payrollSettings;
      
      const url = isTdsConfigured 
        ? `${publicRuntimeConfig.apiURL}/tds-settings/company/${companyId}`
        : `${publicRuntimeConfig.apiURL}/tds-settings`;

      const method = isTdsConfigured ? "put" : "post";

      const response = await axios({
        method,
        url,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: {
          tdsRate: parseFloat(tdsData.tdsRate),
          description: tdsData.description,
          companyId: companyId,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to save TDS settings");
    }
  }
);

// Async thunk for saving/updating Professional Tax settings
export const savePTAX = createAsyncThunk(
  "payrollSettings/savePTAX",
  async (ptaxData, { getState, rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const companyId = sessionStorage.getItem("employeeCompanyId");
      const { isPtaxConfigured, payrollFreezeData, payStructureData } = getState().payrollSettings;
      
      // Prepare the data for the payroll settings API
      const payrollSettingsData = {
        companyId: companyId,
        professionalTaxThreshold: parseFloat(ptaxData.monthlySalaryThreshold),
        professionalTaxAmountAboveThreshold: parseFloat(ptaxData.amountAboveThreshold),
        professionalTaxAmountBelowThreshold: parseFloat(ptaxData.amountBelowThreshold),
        description: ptaxData.description || "",
      };

      // If payroll freeze settings exist, include them
      if (payrollFreezeData) {
        payrollSettingsData.payrollEnablementDate = payrollFreezeData.payrollEnablementDate || payrollFreezeData.payrollEnablementDay;
        payrollSettingsData.freezeAfterDays = payrollFreezeData.freezeAfterDays;
      }

      // If pay structure settings exist, include them
      if (payStructureData) {
        payrollSettingsData.basicPercentage = payStructureData.basicPercentage;
        payrollSettingsData.hraPercentage = payStructureData.hraPercentage;
        payrollSettingsData.employerPfPercentage = payStructureData.employerPfPercentage;
        payrollSettingsData.employeePfPercentage = payStructureData.employeePfPercentage;
        payrollSettingsData.pfCap = payStructureData.pfCap;
      }

      let url, method;
      
      if (isPtaxConfigured && payrollFreezeData?.settingsId) {
        // Update existing settings
        url = `${publicRuntimeConfig.apiURL}/api/settings/payroll/update/${payrollFreezeData.settingsId}`;
        method = "put";
      } else {
        // Create new settings
        url = `${publicRuntimeConfig.apiURL}/api/settings/payroll/create`;
        method = "post";
      }

      const response = await axios({
        method,
        url,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: payrollSettingsData,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to save Professional Tax settings");
    }
  }
);

// Async thunk for saving/updating Payroll Freeze Settings
export const savePayrollFreezeSettings = createAsyncThunk(
  "payrollSettings/savePayrollFreezeSettings",
  async (freezeData, { getState, rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const companyId = sessionStorage.getItem("employeeCompanyId");
      const { isPayrollFreezeConfigured, payrollFreezeData, ptaxData, payStructureData } = getState().payrollSettings;
      
      // Prepare the data for the payroll settings API
      const payrollSettingsData = {
        companyId: companyId,
        payrollEnablementDate: parseInt(freezeData.payrollEnablementDay),
        freezeAfterDays: parseInt(freezeData.freezeAfterDays),
      };

      // If professional tax settings exist, include them
      if (ptaxData) {
        payrollSettingsData.professionalTaxThreshold = ptaxData.monthlySalaryThreshold;
        payrollSettingsData.professionalTaxAmountAboveThreshold = ptaxData.amountAboveThreshold;
        payrollSettingsData.professionalTaxAmountBelowThreshold = ptaxData.amountBelowThreshold;
        payrollSettingsData.description = ptaxData.description || "";
      }

      // If pay structure settings exist, include them
      if (payStructureData) {
        payrollSettingsData.basicPercentage = payStructureData.basicPercentage;
        payrollSettingsData.hraPercentage = payStructureData.hraPercentage;
        payrollSettingsData.employerPfPercentage = payStructureData.employerPfPercentage;
        payrollSettingsData.employeePfPercentage = payStructureData.employeePfPercentage;
        payrollSettingsData.pfCap = payStructureData.pfCap;
        payrollSettingsData.description = payStructureData.description || "";
      }
      
      let url, method;
      
      if (isPayrollFreezeConfigured && payrollFreezeData?.settingsId) {
        // Update existing settings using the settingsId
        url = `${publicRuntimeConfig.apiURL}/api/settings/payroll/update/${payrollFreezeData.settingsId}`;
        method = "put";
      } else {
        // Create new settings
        url = `${publicRuntimeConfig.apiURL}/api/settings/payroll/create`;
        method = "post";
      }

      const response = await axios({
        method,
        url,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: payrollSettingsData,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to save Payroll Freeze settings");
    }
  }
);

// Async thunk for saving/updating Pay Structure Settings
export const savePayStructureSettings = createAsyncThunk(
  "payrollSettings/savePayStructureSettings",
  async (payStructureData, { getState, rejectWithValue }) => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const companyId = sessionStorage.getItem("employeeCompanyId");
      const { isPayStructureConfigured, payrollFreezeData, ptaxData } = getState().payrollSettings;
      
      // Prepare the data for the payroll settings API
      const payrollSettingsData = {
        companyId: companyId,
        basicPercentage: parseFloat(payStructureData.basicPercentage),
        hraPercentage: parseFloat(payStructureData.hraPercentage),
        employerPfPercentage: parseFloat(payStructureData.employerPfPercentage),
        employeePfPercentage: parseFloat(payStructureData.employeePfPercentage),
        pfCap: parseFloat(payStructureData.pfCap),
        professionalTaxThreshold: parseFloat(payStructureData.professionalTaxThreshold),
        professionalTaxAmountAboveThreshold: parseFloat(payStructureData.professionalTaxAmountAboveThreshold),
        professionalTaxAmountBelowThreshold: parseFloat(payStructureData.professionalTaxAmountBelowThreshold),
        description: payStructureData.description || "",
      };

      // If payroll freeze settings exist, include them
      if (payrollFreezeData) {
        payrollSettingsData.payrollEnablementDate = payrollFreezeData.payrollEnablementDate || payrollFreezeData.payrollEnablementDay;
        payrollSettingsData.freezeAfterDays = payrollFreezeData.freezeAfterDays;
      }

      // If professional tax settings exist, include them
      if (ptaxData) {
        payrollSettingsData.professionalTaxThreshold = ptaxData.monthlySalaryThreshold;
        payrollSettingsData.professionalTaxAmountAboveThreshold = ptaxData.amountAboveThreshold;
        payrollSettingsData.professionalTaxAmountBelowThreshold = ptaxData.amountBelowThreshold;
      }

      let url, method;
      
      if (isPayStructureConfigured && payrollFreezeData?.settingsId) {
        // Update existing settings
        url = `${publicRuntimeConfig.apiURL}/api/settings/payroll/update/${payrollFreezeData.settingsId}`;
        method = "put";
      } else {
        // Create new settings
        url = `${publicRuntimeConfig.apiURL}/api/settings/payroll/create`;
        method = "post";
      }

      const response = await axios({
        method,
        url,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: payrollSettingsData,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to save Pay Structure settings");
    }
  }
);

export const fetchPayrollSettings = createAsyncThunk(
    "payrollSettings/fetchPayrollSettings",
    async (companyId, { rejectWithValue }) => {
        try {
            const token = getItemFromSessionStorage("token", null);
            
            const response = await fetch(`${publicRuntimeConfig.apiURL}/api/settings/payroll/company/${companyId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.status === 404) {
                // Handle 404 gracefully - return null instead of throwing error
                return null;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        
        } catch (error) {
            return rejectWithValue(error.message || "Failed to fetch payroll settings");
        }
    }
);

const initialState = {
  tdsData: null,
  ptaxData: null,
  payrollFreezeData: null,
  payStructureData: null,
  loading: false,
  error: null,
  isTdsConfigured: false,
  isPtaxConfigured: false,
  isPayrollFreezeConfigured: false,
  isPayStructureConfigured: false,
  settings: null,
};

const payrollSettingsSlice = createSlice({
  name: "payrollSettings",
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null;
    },
    resetTdsForm: (state) => {
      state.tdsData = null;
      state.isTdsConfigured = false;
    },
    resetPtaxForm: (state) => {
      state.ptaxData = null;
      state.isPtaxConfigured = false;
    },
    resetPayrollFreezeForm: (state) => {
      state.payrollFreezeData = null;
      state.isPayrollFreezeConfigured = false;
    },
    resetPayStructureForm: (state) => {
      state.payStructureData = null;
      state.isPayStructureConfigured = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // TDS reducers
      .addCase(fetchTDS.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTDS.fulfilled, (state, action) => {
        state.loading = false;
        state.tdsData = action.payload;
        state.isTdsConfigured = !!action.payload;
      })
      .addCase(fetchTDS.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isTdsConfigured = false;
      })
      // PTAX reducers
      .addCase(fetchPTAX.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPTAX.fulfilled, (state, action) => {
        state.loading = false;
        state.ptaxData = action.payload;
        state.isPtaxConfigured = !!action.payload;
      })
      .addCase(fetchPTAX.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isPtaxConfigured = false;
      })
      // Payroll Freeze Settings reducers
      .addCase(fetchPayrollFreezeSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayrollFreezeSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.payrollFreezeData = action.payload;
        state.isPayrollFreezeConfigured = !!action.payload;
      })
      .addCase(fetchPayrollFreezeSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isPayrollFreezeConfigured = false;
      })
      // Pay Structure Settings reducers
      .addCase(fetchPayStructureSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayStructureSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.payStructureData = action.payload;
        state.isPayStructureConfigured = !!action.payload;
      })
      .addCase(fetchPayStructureSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isPayStructureConfigured = false;
      })
      // Save TDS reducers
      .addCase(saveTDS.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveTDS.fulfilled, (state, action) => {
        state.loading = false;
        state.tdsData = action.payload;
        state.isTdsConfigured = true;
      })
      .addCase(saveTDS.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Save PTAX reducers
      .addCase(savePTAX.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(savePTAX.fulfilled, (state, action) => {
        state.loading = false;
        state.ptaxData = action.payload;
        state.isPtaxConfigured = true;
      })
      .addCase(savePTAX.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Save Payroll Freeze Settings reducers
      .addCase(savePayrollFreezeSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(savePayrollFreezeSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.payrollFreezeData = action.payload;
        state.isPayrollFreezeConfigured = true;
      })
      .addCase(savePayrollFreezeSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Save Pay Structure Settings reducers
      .addCase(savePayStructureSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(savePayStructureSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.payStructureData = action.payload;
        state.isPayStructureConfigured = true;
      })
      .addCase(savePayStructureSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchPayrollSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayrollSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchPayrollSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearErrors, resetTdsForm, resetPtaxForm, resetPayrollFreezeForm, resetPayStructureForm } = payrollSettingsSlice.actions;
export default payrollSettingsSlice.reducer; 