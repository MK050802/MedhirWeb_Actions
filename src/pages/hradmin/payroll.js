import React, { useCallback, useState, useEffect, useMemo } from "react";
import { Search, Calendar, Check, X, Pencil } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import HradminNavbar from "@/components/HradminNavbar";
import { Badge } from "@/components/ui/badge";
import { useDispatch, useSelector } from "react-redux";
import { fetchEmployees } from "@/redux/slices/employeeSlice";
import withAuth from "@/components/withAuth";
import { toast } from "sonner";
import { getItemFromSessionStorage } from "@/redux/slices/sessionStorageSlice";
import getConfig from "next/config";
import { fetchAllEmployeeAttendanceOneMonth } from "@/redux/slices/attendancesSlice";
import { generatePayroll, getPayroll, sendPayslips, clearPayroll } from "@/redux/slices/payrollSlice";
import { createOrUpdateEmployeeAdvance, fetchCompanyEmployeeAdvances, clearError, clearSuccess } from "@/redux/slices/employeeAdvanceSlice";
import { updateArrearsPaid, updateArrearsDeducted, fetchCompanyArrears } from "@/redux/slices/arrearsSlice";
import { fetchPayrollFreezeSettings } from "@/redux/slices/payrollSettingsSlice";

function PayrollManagement() {
  debugger
  const selectedCompanyId = sessionStorage.getItem("employeeCompanyId");
  const dispatch = useDispatch();

  const { attendance } = useSelector((state) => state.attendances);
  const { payroll } = useSelector((state) => state.payroll);
  const { 
    loading: advanceLoading, 
    error: advanceError, 
    success: advanceSuccess, 
    message: advanceMessage,
    companyAdvances,
    companyAdvancesLoading,
    companyAdvancesError
  } = useSelector((state) => state.employeeAdvance);
  
  const { 
    loading: arrearsLoading, 
    error: arrearsError, 
    success: arrearsSuccess,
    companyArrears,
    companyArrearsLoading,
    companyArrearsError
  } = useSelector((state) => state.arrears);
  
  const { payrollFreezeData } = useSelector((state) => state.payrollSettings);
  const [selectedSection, setSelectedSection] = useState("Salary Statement");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isCalculatePayrollClicked, setIsCalculatePayrollClicked] =
    useState(false);
  const [payrollErrorDetails, setPayrollErrorDetails] = useState(null);
  const [isCalculatingPayroll, setIsCalculatingPayroll] = useState(false);
  const [hasAttemptedCalculate, setHasAttemptedCalculate] = useState(false);
  const [isFetchingView, setIsFetchingView] = useState(false);
  const [dataLastUpdated, setDataLastUpdated] = useState(null);
  const [isApiCallInProgress, setIsApiCallInProgress] = useState(false);
  const [editingArrears, setEditingArrears] = useState({});
  const [apiCallTimeoutId, setApiCallTimeoutId] = useState(null);
  const [arrearsValues, setArrearsValues] = useState([]);
  const [originalArrearsValues, setOriginalArrearsValues] = useState({});
  const [editingArrearsDeducted, setEditingArrearsDeducted] = useState({});
  const [arrearsDeductedValues, setArrearsDeductedValues] = useState({});
  const [originalArrearsDeductedValues, setOriginalArrearsDeductedValues] = useState({});
  const [editingAdvance, setEditingAdvance] = useState({});
  const [advanceValues, setAdvanceValues] = useState({});
  const [originalAdvanceValues, setOriginalAdvanceValues] = useState({});
    const [selectedMonth, setSelectedMonth] = useState(() => {
    const currentDate = new Date();
    const latestAvailableMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    return latestAvailableMonth.toLocaleString("default", { month: "long" });
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    const currentDate = new Date();
    const latestAvailableMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    return latestAvailableMonth.getFullYear().toString();
  });

  // Add logging for state changes
  useEffect(() => {
    console.log('📅 selectedMonth changed to:', selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    console.log('📅 selectedYear changed to:', selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    console.log('🏢 selectedCompanyId changed to:', selectedCompanyId);
  }, [selectedCompanyId]);

  const { employees, loading, err } = useSelector((state) => state.employees);

  const toggleCalendar = () => setIsCalendarOpen(!isCalendarOpen);
  const { publicRuntimeConfig } = getConfig();

  // Helper function to format time as "X mins back"
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes === 1) return "1 min back";
    if (diffInMinutes < 60) return `${diffInMinutes} mins back`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return "1 hour back";
    if (diffInHours < 24) return `${diffInHours} hours back`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day back";
    return `${diffInDays} days back`;
  };

  // Memoize the params object to prevent unnecessary re-renders
  const memoizedParams = useMemo(() => {
    if (!selectedCompanyId || !selectedMonth || !selectedYear) {
      return null;
    }

    const monthMap = {
      January: 1,
      February: 2,
      March: 3,
      April: 4,
      May: 5,
      June: 6,
      July: 7,
      August: 8,
      September: 9,
      October: 10,
      November: 11,
      December: 12,
    };

    return {
      companyId: selectedCompanyId,
      year: parseInt(selectedYear),
      month: monthMap[selectedMonth],
    };
  }, [selectedCompanyId, selectedMonth, selectedYear]);

  // Helper functions for arrears editing
  const handleArrearsEdit = (employeeId) => {
    // Only allow editing for current month and when not frozen
    if (!isCurrentMonth() || isPayrollFrozen()) {
      toast.error("Arrears can only be edited for the current month when payroll is active");
      return;
    }
    setEditingArrears(prev => ({ ...prev, [employeeId]: true }));
    // Store original value before editing starts
    const currentValue = arrearsValues[employeeId] !== undefined 
      ? arrearsValues[employeeId] 
      : (getEmployeeArrears(employeeId)?.arrearsPaid || 0);
    setOriginalArrearsValues(prev => ({ ...prev, [employeeId]: currentValue }));
    // Start with empty input field for better user experience
    setArrearsValues(prev => ({ ...prev, [employeeId]: '' }));
  };

  const handleArrearsSave = async (employeeId) => {
    const inputValue = arrearsValues[employeeId];
    
    if (!inputValue || inputValue === '' || inputValue === '-') {
      toast.error("Please enter a valid amount");
      return;
    }
    
    const numericValue = parseFloat(inputValue);
    
    if (isNaN(numericValue) || numericValue <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    try {
      // Check if user is authenticated
      const token = sessionStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required. Please login again.");
        return;
      }

      // Check if company ID exists
      if (!selectedCompanyId) {
        toast.error("Company ID not found. Please refresh the page.");
        return;
      }

      const monthMap = {
        January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
        July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
      };
      
      const month = monthMap[selectedMonth];
      const year = parseInt(selectedYear);
      
      const payload = {
        employeeId,
        companyId: selectedCompanyId,
        month,
        year,
        arrearsPaid: numericValue,
        arrearsDeducted: getEmployeeArrears(employeeId)?.arrearsDeducted || 0
      };

      const result = await dispatch(updateArrearsPaid(payload)).unwrap();
      
      if (result) {
        setEditingArrears(prev => ({ ...prev, [employeeId]: false }));
        setArrearsValues(prev => ({ ...prev, [employeeId]: numericValue }));
        toast.success(`Arrears paid updated to ₹${numericValue} for employee ${employeeId}`);
        
        // Clear any previous errors
        dispatch(clearError());
        
        // Auto-refresh arrears data to show updated values
        if (selectedCompanyId && selectedMonth && selectedYear) {
          const monthMap = {
            January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
            July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
          };
          const month = monthMap[selectedMonth];
          const year = parseInt(selectedYear);
          dispatch(fetchCompanyArrears({ companyId: selectedCompanyId, month, year }));
        }
      }
    } catch (error) {
      console.error("Failed to update arrears paid:", error);
      const errorMessage = error.message || "Failed to update arrears paid. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleArrearsCancel = (employeeId) => {
    setEditingArrears(prev => ({ ...prev, [employeeId]: false }));
    // Reset to original value that was stored before editing started
    const originalValue = originalArrearsValues[employeeId] || 0;
    setArrearsValues(prev => ({ ...prev, [employeeId]: originalValue }));
  };

  const handleArrearsChange = (employeeId, value) => {
    // Keep the raw input value to allow for partial typing (like "-" or "123.")
    setArrearsValues(prev => ({ ...prev, [employeeId]: value }));
  };

  // Helper functions for arrears deducted editing
  const handleArrearsDeductedEdit = (employeeId) => {
    // Only allow editing for current month and when not frozen
    if (!isCurrentMonth() || isPayrollFrozen()) {
      toast.error("Arrears deducted can only be edited for the current month when payroll is active");
      return;
    }
    setEditingArrearsDeducted(prev => ({ ...prev, [employeeId]: true }));
    // Store original value before editing starts
    const currentValue = arrearsDeductedValues[employeeId] !== undefined 
      ? arrearsDeductedValues[employeeId] 
      : (getEmployeeArrears(employeeId)?.arrearsDeducted || 0);
    setOriginalArrearsDeductedValues(prev => ({ ...prev, [employeeId]: currentValue }));
    // Start with empty input field for better user experience
    setArrearsDeductedValues(prev => ({ ...prev, [employeeId]: '' }));
  };

  const handleArrearsDeductedSave = async (employeeId) => {
    const inputValue = arrearsDeductedValues[employeeId];
    
    if (!inputValue || inputValue === '' || inputValue === '-') {
      toast.error("Please enter a valid amount");
      return;
    }
    
    const numericValue = parseFloat(inputValue);
    
    if (isNaN(numericValue) || numericValue <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    try {
      // Check if user is authenticated
      const token = sessionStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required. Please login again.");
        return;
      }

      // Check if company ID exists
      if (!selectedCompanyId) {
        toast.error("Company ID not found. Please refresh the page.");
        return;
      }

      const monthMap = {
        January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
        July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
      };
      
      const month = monthMap[selectedMonth];
      const year = parseInt(selectedYear);
      
      const payload = {
        employeeId,
        companyId: selectedCompanyId,
        month,
        year,
        arrearsDeducted: numericValue,
        arrearsPaid: getEmployeeArrears(employeeId)?.arrearsPaid || 0
      };

      const result = await dispatch(updateArrearsDeducted(payload)).unwrap();
      
      if (result) {
        setEditingArrearsDeducted(prev => ({ ...prev, [employeeId]: false }));
        setArrearsDeductedValues(prev => ({ ...prev, [employeeId]: numericValue }));
        toast.success(`Arrears deducted updated to ₹${numericValue} for employee ${employeeId}`);
        
        // Clear any previous errors
        dispatch(clearError());
        
        // Auto-refresh arrears data to show updated values
        if (selectedCompanyId && selectedMonth && selectedYear) {
          const monthMap = {
            January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
            July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
          };
          const month = monthMap[selectedMonth];
          const year = parseInt(selectedYear);
          dispatch(fetchCompanyArrears({ companyId: selectedCompanyId, month, year }));
        }
      }
    } catch (error) {
      console.error("Failed to update arrears deducted:", error);
      const errorMessage = error.message || "Failed to update arrears deducted. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleArrearsDeductedCancel = (employeeId) => {
    setEditingArrearsDeducted(prev => ({ ...prev, [employeeId]: false }));
    // Reset to original value that was stored before editing started
    const originalValue = originalArrearsDeductedValues[employeeId] || 0;
    setArrearsDeductedValues(prev => ({ ...prev, [employeeId]: originalValue }));
  };

  const handleArrearsDeductedChange = (employeeId, value) => {
    // Keep the raw input value to allow for partial typing (like "-" or "123.")
    setArrearsDeductedValues(prev => ({ ...prev, [employeeId]: value }));
  };

  // Helper functions for advance editing (positive values only)
  const handleAdvanceEdit = (employeeId, field) => {
    // Only allow editing for current month and when not frozen
    if (!isCurrentMonth() || isPayrollFrozen()) {
      toast.error("Advance fields can only be edited for the current month when payroll is active");
      return;
    }
    const key = `${employeeId}_${field}`;
    setEditingAdvance(prev => ({ ...prev, [key]: true }));
    // Store original value before editing starts
    const advanceData = companyAdvances?.find(advance => advance.employeeId === employeeId);
    const currentValue = field === 'thisMonth' 
      ? advanceData?.thisMonthAdvance || 0
      : advanceData?.deductedThisMonth || 0;
    setOriginalAdvanceValues(prev => ({ ...prev, [key]: currentValue }));
    // Start with empty input field for better user experience
    setAdvanceValues(prev => ({ ...prev, [key]: '' }));
  };

  const handleAdvanceSave = async (employeeId, field) => {
    const key = `${employeeId}_${field}`;
    const inputValue = advanceValues[key];
    
    // Check if amount is entered
    if (!inputValue || inputValue === '' || parseFloat(inputValue) === 0) {
      toast.error("No amount entered. Please enter an amount to save.");
      return;
    }
    
    // Convert string input to positive number for saving
    const numericValue = Math.max(0, parseFloat(inputValue) || 0);
    
    // Get current month and year for API call
    const monthMap = {
      January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
      July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
    };
    
    const month = monthMap[selectedMonth];
    const year = parseInt(selectedYear);
    
    try {
      // Call API to update employee advance
      // Get existing advance data for this employee to preserve other fields
      const existingAdvanceData = companyAdvances?.find(
        (advance) => advance.employeeId === employeeId
      );
      
      const payload = {
        companyId: selectedCompanyId,
        employeeId,
        month,
        year,
        // Preserve existing values and update only the field being edited
        oldAdvance: existingAdvanceData?.oldAdvance || 0,
        thisMonthAdvance: field === 'thisMonth' ? numericValue : (existingAdvanceData?.thisMonthAdvance || 0),
        deductedThisMonth: field === 'deduct' ? numericValue : (existingAdvanceData?.deductedThisMonth || 0)
      };
      
      await dispatch(createOrUpdateEmployeeAdvance(payload)).unwrap();
      
      // Update local state only after successful API call
      setAdvanceValues(prev => ({ ...prev, [key]: numericValue }));
      setEditingAdvance(prev => ({ ...prev, [key]: false }));
      
      // Fetch fresh company advances data after successful update
      fetchCompanyAdvances();
      
    } catch (error) {
      console.error("Failed to update employee advance:", error);
      // Don't update local state if API fails
    }
  };

  const handleAdvanceCancel = (employeeId, field) => {
    const key = `${employeeId}_${field}`;
    setEditingAdvance(prev => ({ ...prev, [key]: false }));
    // Reset to original value that was stored before editing started
    const originalValue = originalAdvanceValues[key] || 0;
    setAdvanceValues(prev => ({ ...prev, [key]: originalValue }));
  };

  const handleAdvanceChange = (employeeId, field, value) => {
    const key = `${employeeId}_${field}`;
    // Only allow positive numbers - prevent negative input
    if (value.startsWith('-')) return; // Block negative input
    setAdvanceValues(prev => ({ ...prev, [key]: value }));
  };

  // Handle arrears API responses
  useEffect(() => {
    if (arrearsError) {
      toast.error(arrearsError);
    }
  }, [arrearsError]);

  // Handle company arrears API responses
  useEffect(() => {
    if (companyArrearsError) {
      toast.error(companyArrearsError);
    }
  }, [companyArrearsError]);



  // Clear arrears errors when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);



  // Fetch company arrears when Arrears tab is selected
  useEffect(() => {
    if (selectedSection === "Arrears" && selectedCompanyId && selectedMonth && selectedYear) {
      const monthMap = {
        January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
        July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
      };
      
      const month = monthMap[selectedMonth];
      const year = parseInt(selectedYear);
      
      dispatch(fetchCompanyArrears({ companyId: selectedCompanyId, month, year }));
    }
  }, [selectedSection, selectedCompanyId, selectedMonth, selectedYear, dispatch]);

  // Helper function to get arrears data for a specific employee
  const getEmployeeArrears = (employeeId) => {
    return companyArrears.find(arrears => arrears.employeeId === employeeId);
  };

  // Check if selected month is the latest available month (current month - 1)
  const isLatestAvailableMonth = () => {
    const currentDate = new Date();
    const latestAvailableMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    const latestMonth = latestAvailableMonth.toLocaleString("default", {
      month: "long",
    });
    const latestYear = latestAvailableMonth.getFullYear().toString();
    return selectedMonth === latestMonth && selectedYear === latestYear;
  };

  // Check if selected month is the current month for payroll editing (current month - 1)
  const isCurrentMonth = () => {
    const currentDate = new Date();
    const payrollCurrentMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    const payrollMonth = payrollCurrentMonth.toLocaleString("default", { month: "long" });
    const payrollYear = payrollCurrentMonth.getFullYear().toString();
    return selectedMonth === payrollMonth && selectedYear === payrollYear;
  };

  // Check if payroll is currently frozen based on freeze settings
  const isPayrollFrozen = () => {
    if (!payrollFreezeData) return false;
    
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const enablementDay = payrollFreezeData.payrollEnablementDate || 1;
    const freezeAfterDays = payrollFreezeData.freezeAfterDays || 16;
    const freezeDay = enablementDay + freezeAfterDays;
    
    // Check if current date is within the freeze period
    if (currentDay >= enablementDay && currentDay < freezeDay) {
      return false; // Payroll is active
    }
    
    return true; // Payroll is frozen
  };

  // Check if current month is the previous month (for editing restrictions)
  const isPreviousMonth = () => {
    const currentDate = new Date();
    const previousMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    const previousMonthName = previousMonth.toLocaleString("default", { month: "long" });
    const previousMonthYear = previousMonth.getFullYear().toString();
    return selectedMonth === previousMonthName && selectedYear === previousMonthYear;
  };

  const handleMonthSelection = (month, year) => {
    // Convert short month name to full month name
    const monthMap = {
      Jan: "January",
      Feb: "February",
      Mar: "March",
      Apr: "April",
      May: "May",
      Jun: "June",
      Jul: "July",
      Aug: "August",
      Sep: "September",
      Oct: "October",
      Nov: "November",
      Dec: "December",
    };

    const fullMonthName = monthMap[month] || month;
    setSelectedMonth(fullMonthName);
    setSelectedYear(year);
    setIsCalendarOpen(false);
    
    // Check if the selected month is accessible based on freeze settings
    if (payrollFreezeData) {
      const currentDate = new Date();
      const selectedDate = new Date(year, monthMap[fullMonthName] - 1, 1);
      const monthsDiff = (currentDate.getFullYear() - selectedDate.getFullYear()) * 12 + (currentDate.getMonth() - selectedDate.getMonth());
      
      // If trying to access months beyond the current month, show warning
      if (monthsDiff > 1) {
        toast.warning("You can only access the current month and previous month for payroll management.");
        return;
      }
    }
    
    // Reset state when month changes
    setIsCalculatePayrollClicked(false);
    setHasAttemptedCalculate(false);
    setShowCheckboxes(false);
    setSelectedEmployees([]);
    setPayrollErrorDetails(null);
    setDataLastUpdated(null);
    setEditingArrears({});
    setArrearsValues({});
    setOriginalArrearsValues({});
    setEditingArrearsDeducted({});
    setArrearsDeductedValues({});
    setOriginalArrearsDeductedValues({});
    setEditingAdvance({});
    setAdvanceValues({});
    setOriginalAdvanceValues({});
  };

  useEffect(() => {
    dispatch(
      fetchAllEmployeeAttendanceOneMonth({
        month: selectedMonth,
        year: selectedYear,
        role: "HRADMIN",
      })
    );
  }, [dispatch, selectedMonth, selectedYear]);

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchPayrollFreezeSettings());
  }, [dispatch]);



  useEffect(() => {
    console.log('🔍 Payroll useEffect triggered with:', { 
      selectedCompanyId, 
      selectedMonth, 
      selectedYear,
      timestamp: new Date().toISOString()
    });
    
    // Only fetch payroll data if we have valid memoized params
    if (!memoizedParams) {
      console.log('❌ No memoized params, skipping API call');
      return;
    }

    // Prevent multiple simultaneous API calls
    if (isApiCallInProgress) {
      console.log('⏸️ API call already in progress, skipping');
      return;
    }

    console.log('📡 About to make API call with params:', memoizedParams);

    // Clear any existing timeout
    if (apiCallTimeoutId) {
      clearTimeout(apiCallTimeoutId);
    }

    // Add a small delay to prevent rapid successive calls
    const timeoutId = setTimeout(() => {
      console.log('⏰ Timeout executed, making API call');
      
      // Set flag to prevent multiple calls
      setIsApiCallInProgress(true);
      
      // First clear any stale error and fetch; hide UI until resolved
      setPayrollErrorDetails(null);
      setIsFetchingView(true);
      (async () => {
        try {
          await dispatch(getPayroll(memoizedParams)).unwrap();
          setPayrollErrorDetails(null);
          // If payroll data exists, automatically set as calculated
          if (payroll && Array.isArray(payroll) && payroll.length > 0) {
            setIsCalculatePayrollClicked(true);
            setDataLastUpdated(new Date());
          }
        } catch (error) {
          setPayrollErrorDetails(error);
          dispatch(clearPayroll()); // Clear payroll state when there's an error
          // Reset calculation state when there's an error
          setIsCalculatePayrollClicked(false);
          setDataLastUpdated(null);
          setEditingArrears({});
          setArrearsValues({});
          setOriginalArrearsValues({});
          setEditingArrearsDeducted({});
          setArrearsDeductedValues({});
          setOriginalArrearsDeductedValues({});
          setEditingAdvance({});
          setAdvanceValues({});
          setOriginalAdvanceValues({});
        } finally {
          setIsFetchingView(false);
          setIsApiCallInProgress(false); // Reset flag
        }
      })();
    }, 500); // Increased to 500ms for better debouncing

    // Store the timeout ID for cleanup
    setApiCallTimeoutId(timeoutId);

    // Cleanup timeout on unmount or dependency change
    return () => {
      console.log('🧹 Cleaning up timeout');
      clearTimeout(timeoutId);
    };
  }, [dispatch, memoizedParams, isApiCallInProgress, apiCallTimeoutId]);

  // Initialize arrears values when payroll data is loaded
  useEffect(() => {
    if (payroll && Array.isArray(payroll) && payroll.length > 0) {
      const initialArrearsValues = {};
      const initialArrearsDeductedValues = {};
      payroll.forEach(item => {
        initialArrearsValues[item.employeeId] = item.arrearsPaid;
        initialArrearsDeductedValues[item.employeeId] = item.arrearsDeducted;
      });
      setArrearsValues(initialArrearsValues);
      setArrearsDeductedValues(initialArrearsDeductedValues);
      // Also set original values for cancel functionality
      setOriginalArrearsValues(initialArrearsValues);
      setOriginalArrearsDeductedValues(initialArrearsDeductedValues);
    }
  }, [payroll]);

  // Initialize advance values when employees data is loaded
  useEffect(() => {
    if (employees && Array.isArray(employees) && employees.length > 0) {
      const initialAdvanceValues = {};
      employees.forEach(employee => {
        // Find corresponding advance data for this employee
        const advanceData = companyAdvances?.find(
          (advance) => advance.employeeId === employee.employeeId
        );
        
        initialAdvanceValues[`${employee.employeeId}_thisMonth`] = advanceData?.thisMonthAdvance ?? employee.thisMonthAdvance ?? 0;
        initialAdvanceValues[`${employee.employeeId}_deduct`] = advanceData?.deductedThisMonth ?? employee.deductInThisMonth ?? 0;
      });
      setAdvanceValues(initialAdvanceValues);
      // Also set original values for cancel functionality
      setOriginalAdvanceValues(initialAdvanceValues);
    }
  }, [employees, companyAdvances]);

  // Handle employee advance error messages
  useEffect(() => {
    if (advanceError) {
      toast.error(advanceError);
      dispatch(clearError());
    }
  }, [advanceError, dispatch]);

  // Function to fetch company employee advances
  const fetchCompanyAdvances = useCallback(() => {
    const monthMap = {
      January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
      July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
    };
    
    const month = monthMap[selectedMonth];
    const year = parseInt(selectedYear);
    
    dispatch(fetchCompanyEmployeeAdvances({
      companyId: selectedCompanyId,
      month,
      year
    }));
  }, [dispatch, selectedCompanyId, selectedMonth, selectedYear]);

  // Fetch company advances when Advance tab is selected
  useEffect(() => {
    if (selectedSection === "Advance") {
      fetchCompanyAdvances();
    }
  }, [selectedSection, fetchCompanyAdvances]);

  // Fetch company advances when month/year changes (if Advance tab is active)
  useEffect(() => {
    if (selectedSection === "Advance") {
      fetchCompanyAdvances();
    }
  }, [selectedMonth, selectedYear, selectedSection, fetchCompanyAdvances]);

  console.log(payroll);

  const renderPayrollTable = () => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      <div className="max-h-[calc(100vh-280px)] overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0">
            <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
              {showCheckboxes && (
                <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-gray-100">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.length === (payroll && Array.isArray(payroll) ? payroll.length : 0)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEmployees(
                          payroll && Array.isArray(payroll) ? payroll.map((item) => item.employeeId) : []
                        );
                      } else {
                        setSelectedEmployees([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              <th className="py-3 px-1 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-blue-100">
                EMPLOYEE <br /> ID
              </th>
              <th className="py-3 px-1 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-blue-100">
                NAME
              </th>
              <th className="py-3 px-1 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-blue-100">
                MONTHLY <br /> CTC
              </th>
              <th className="py-3 px-1 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-green-100">
                PAID DAYS
              </th>
              <th className="py-3 px-1 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-green-100">
                THIS MONTH <br /> SALARY
              </th>
              <th className="py-3 px-1 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-green-100">
                BASIC
              </th>
              <th className="py-3 px-1 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-green-100">
                HRA
              </th>
              <th className="py-3 px-1 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-green-100">
                OTHER <br /> ALLOWANCES
              </th>
              <th className="py-3 px-1 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-green-100">
                Fuel <br /> REIMB.
              </th>
              <th className="py-3 px-1 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-green-100">
                Phone <br /> REIMB.
              </th>

              <th className="py-3 px-1 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-red-100">
                EMPLOYEE <br /> PF
              </th>
              <th className="py-3 px-1 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-red-100">
                EMPLOYER <br /> PF
              </th>
              <th className="py-3 px-1 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-red-100">
                DEDUCTIONS
              </th>
              <th className="py-3 px-1 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-blue-100">
                NET PAY
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payroll && Array.isArray(payroll) && payroll.length > 0 ? (
              payroll
                .filter((payrollItem) => {
                  if (!searchQuery) return true;
                  // Find the employee name for this payroll item
                  const employee = employees.find(emp => emp.employeeId === payrollItem.employeeId);
                  return (
                    employee?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    payrollItem.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                })
                .map((payrollItem, index) => {
                  // Find corresponding employee data for this payroll item
                  const employee = employees.find(emp => emp.employeeId === payrollItem.employeeId);

                  return (
                    <tr key={index} className="hover:bg-blue-50 transition-colors duration-150">
                      {showCheckboxes && (
                        <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-gray-50">
                          <input
                            type="checkbox"
                            checked={selectedEmployees.includes(
                              payrollItem.employeeId
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEmployees([
                                  ...selectedEmployees,
                                  payrollItem.employeeId,
                                ]);
                              } else {
                                setSelectedEmployees(
                                  selectedEmployees.filter(
                                    (id) => id !== payrollItem.employeeId
                                  )
                                );
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                      )}
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-gray-50 font-medium">
                        {payrollItem.employeeId}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-gray-50 font-medium">
                        {employee?.name || 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-gray-50">
                        ₹{payrollItem.monthlyCTC || 0}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-green-50">
                        {payrollItem.paidDays || 0}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-green-50">
                        ₹{payrollItem.thisMonthSalary || 0}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-green-50">
                        ₹{payrollItem.basicThisMonth || 0}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-green-50">
                        ₹{payrollItem.hraThisMonth || 0}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-green-50">
                        ₹{payrollItem.otherAllowancesThisMonth || 0}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-green-50">
                        ₹{payrollItem.fuelReimbursementThisMonth || 0}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-green-50">
                        ₹{payrollItem.phoneReimbursementThisMonth || 0}
                      </td>
                      
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-red-50">
                        ₹{payrollItem.employeePFThisMonth || 0}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-red-50">
                        ₹{payrollItem.employerPFThisMonth || 0}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-red-50">
                        ₹{payrollItem.otherDeductions || 0}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-red-50">
                        ₹{payrollItem.netPay || 0}
                      </td>
                    </tr>
                  );
                })
            ) : (
              <tr>
                <td colSpan={showCheckboxes ? 15 : 14} className="py-12 text-center">
                  {isFetchingView ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                      <span className="text-gray-600 font-medium">Loading payroll data...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-gray-300 mb-4">
                        <svg className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-xl font-semibold mb-2">No employee found</p>
                      <p className="text-gray-400 text-sm">No payroll data available for the selected period</p>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDeductionsTable = () => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      <div className="max-h-[calc(100vh-280px)] overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0">
            <tr className="bg-gradient-to-r from-red-50 to-pink-50">
              {showCheckboxes && (
                <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-gray-100">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.length === (payroll && Array.isArray(payroll) ? payroll.length : 0)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEmployees(
                          payroll && Array.isArray(payroll) ? payroll.map((item) => item.employeeId) : []
                        );
                      } else {
                        setSelectedEmployees([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-blue-100">
                Employee ID
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-blue-100">
                Name
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-blue-100">
                Department
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-red-100">
                Employee PF
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-red-100">
                Employer PF
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-red-100">
                Professional Tax
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-red-100">
                Advance Adjusted
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-blue-100">
                Net Deductions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payroll && Array.isArray(payroll) && payroll.length > 0 ? (
              payroll
                .filter((payrollItem) => {
                  if (!searchQuery) return true;
                  // Find the employee name for this payroll item
                  const employee = employees.find(emp => emp.employeeId === payrollItem.employeeId);
                  return (
                    employee?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    payrollItem.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                })
                .map((payrollItem, index) => {
                  // Find corresponding employee data for this payroll item
                  const employee = employees.find(emp => emp.employeeId === payrollItem.employeeId);

                  return (
                    <tr key={index} className="hover:bg-red-50 transition-colors duration-150">
                      {showCheckboxes && (
                        <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-gray-50">
                          <input
                            type="checkbox"
                            checked={selectedEmployees.includes(
                              payrollItem.employeeId
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEmployees([
                                  ...selectedEmployees,
                                  payrollItem.employeeId,
                                ]);
                              } else {
                                setSelectedEmployees(
                                  selectedEmployees.filter(
                                    (id) => id !== payrollItem.employeeId
                                  )
                                );
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                      )}
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-gray-50 font-medium">
                        {payrollItem.employeeId}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-gray-50 font-medium">
                        {employee?.name || 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-gray-50">
                        {employee?.departmentName || 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-red-50">
                        ₹{payrollItem.employeePFThisMonth || 0}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-red-50">
                        ₹{payrollItem.employerPFThisMonth || 0}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-red-50">
                        ₹{payrollItem.professionalTax || 0}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-red-50">
                        ₹{payrollItem.advanceAdjusted || 0}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-blue-50 font-semibold">
                        ₹{(
                          (payrollItem.employeePFThisMonth || 0) +
                          (payrollItem.employerPFThisMonth || 0) +
                          (payrollItem.professionalTax || 0)
                        )}
                      </td>
                    </tr>
                  );
                })
            ) : (
              <tr>
                <td colSpan={showCheckboxes ? 10 : 9} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-gray-300 mb-4">
                      <svg className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-xl font-semibold mb-2">No employee found</p>
                    <p className="text-gray-400 text-sm">No payroll data available for the selected period</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAdvanceTable = () => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      {companyAdvancesLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading advance data...</span>
        </div>
      )}
      {companyAdvancesError && (
        <div className="p-4 text-center text-red-600">
          Error loading advance data: {companyAdvancesError}
        </div>
      )}
            {!companyAdvancesLoading && !companyAdvancesError && (
        <div className="max-h-[calc(100vh-280px)] overflow-auto">

          <table className="w-full border-collapse">
          <thead className="sticky top-0">
            <tr className="bg-gradient-to-r from-yellow-50 to-orange-50">
              {showCheckboxes && (
                <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-gray-100">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.length === (payroll && Array.isArray(payroll) ? payroll.length : 0)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEmployees(
                          payroll && Array.isArray(payroll) ? payroll.map((item) => item.employeeId) : []
                        );
                      } else {
                        setSelectedEmployees([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-blue-100">
                Employee ID
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-blue-100">
                Name
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-blue-100">
                Department
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-green-100">
                Old Advance
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-yellow-100">
                This Month Advance
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-yellow-100">
                Deduct in This Month
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-green-100">
                Balance for Next Month
              </th>
            </tr>
          </thead>
                    <tbody className="divide-y divide-gray-200">
            {payroll && Array.isArray(payroll) && payroll.length > 0 ? (
              payroll
                .filter((payrollItem) => {
                  if (!searchQuery) return true;
                  // Find the employee name for this payroll item
                  const employee = employees.find(emp => emp.employeeId === payrollItem.employeeId);
                  return (
                    employee?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    payrollItem.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                })
                .map((payrollItem, index) => {
                  // Find corresponding employee data for this payroll item
                  const employee = employees.find(emp => emp.employeeId === payrollItem.employeeId);
                  // Find corresponding advance data for this employee
                  const advanceData = companyAdvances?.find(
                    (advance) => advance.employeeId === payrollItem.employeeId
                  );
                  
                  return (
                    <tr key={index} className="hover:bg-yellow-50 transition-colors duration-150">
                    {showCheckboxes && (
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(
                            payrollItem.employeeId
                          )}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployees([
                                ...selectedEmployees,
                                payrollItem.employeeId,
                              ]);
                            } else {
                              setSelectedEmployees(
                                selectedEmployees.filter(
                                  (id) => id !== payrollItem.employeeId
                                )
                              );
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-gray-50 font-medium">
                      {payrollItem.employeeId}
                    </td>
                    <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-gray-50 font-medium">
                      {employee?.name || 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-gray-50">
                      {employee?.departmentName || 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-green-50">
                      ₹{advanceData?.oldAdvance || employee?.oldAdvance || 0}
                    </td>
                    <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-yellow-50">
                      {editingAdvance[`${payrollItem.employeeId}_thisMonth`] ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={advanceValues[`${payrollItem.employeeId}_thisMonth`] ?? ''}
                            onChange={(e) => handleAdvanceChange(payrollItem.employeeId, 'thisMonth', e.target.value)}
                            className="w-32 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            step="0.01"
                            placeholder="Enter amount"
                            autoFocus
                          />
                          <button
                            onClick={() => handleAdvanceSave(payrollItem.employeeId, 'thisMonth')}
                            disabled={advanceLoading}
                            className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Save"
                          >
                            {advanceLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleAdvanceCancel(payrollItem.employeeId, 'thisMonth')}
                            className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between group">
                          <span>
                            ₹{advanceValues[`${payrollItem.employeeId}_thisMonth`] !== undefined 
                              ? (typeof advanceValues[`${payrollItem.employeeId}_thisMonth`] === 'number' 
                                  ? advanceValues[`${payrollItem.employeeId}_thisMonth`] 
                                  : parseFloat(advanceValues[`${payrollItem.employeeId}_thisMonth`]) || 0)
                              : (advanceData?.thisMonthAdvance || employee?.thisMonthAdvance || 0)}
                          </span>
                          {isCurrentMonth() && !isPayrollFrozen() && (
                            <button
                              onClick={() => handleAdvanceEdit(payrollItem.employeeId, 'thisMonth')}
                              className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-all"
                              title="Edit This Month Advance"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-yellow-50">
                      {editingAdvance[`${payrollItem.employeeId}_deduct`] ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={advanceValues[`${payrollItem.employeeId}_deduct`] ?? ''}
                            onChange={(e) => handleAdvanceChange(payrollItem.employeeId, 'deduct', e.target.value)}
                            className="w-32 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            step="0.01"
                            placeholder="Enter amount"
                            autoFocus
                          />
                        <button
                          onClick={() => handleAdvanceSave(payrollItem.employeeId, 'deduct')}
                          disabled={advanceLoading}
                          className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Save"
                        >
                          {advanceLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleAdvanceCancel(payrollItem.employeeId, 'deduct')}
                          className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between group">
                        <span>
                          ₹{advanceValues[`${payrollItem.employeeId}_deduct`] !== undefined 
                            ? (typeof advanceValues[`${payrollItem.employeeId}_deduct`] === 'number' 
                                ? advanceValues[`${payrollItem.employeeId}_deduct`] 
                                : parseFloat(advanceValues[`${payrollItem.employeeId}_deduct`]) || 0)
                              : (advanceData?.deductedThisMonth || employee?.deductInThisMonth || 0)}
                        </span>
                        {isCurrentMonth() && !isPayrollFrozen() && (
                          <button
                            onClick={() => handleAdvanceEdit(payrollItem.employeeId, 'deduct')}
                            className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-all"
                            title="Edit Deduct This Month"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-green-50 font-semibold">
                    <span className={advanceData?.balanceForNextMonth < 0 ? 'text-red-600' : ''}>
                      ₹{advanceData?.balanceForNextMonth || employee?.balanceForNextMonth || 0}
                    </span>
                  </td>
                </tr>
                  );
                })
            ) : (
              <tr>
                <td colSpan={showCheckboxes ? 9 : 8} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-gray-300 mb-4">
                      <svg className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-xl font-semibold mb-2">No employee found</p>
                    <p className="text-gray-400 text-sm">No payroll data available for the selected period</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          </table>
                </div>
      )}
    </div>
  );

  const renderReimbursementTable = () => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      <div className="max-h-[calc(100vh-280px)] overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0">
            <tr className="bg-gradient-to-r from-purple-50 to-indigo-50">
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-blue-100">
                Employee ID
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-blue-100">
                Name
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-blue-100">
                Department
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-purple-100">
                Type
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-purple-100">
                Category
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-purple-100">
                Description
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-purple-100">
                Amount
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-purple-100">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {employees
              .filter((employee) =>
                employee.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((employee, index) => (
                <tr key={index} className="hover:bg-purple-50 transition-colors duration-150">
                  <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-gray-50 font-medium">
                    {employee.employeeId}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-gray-50 font-medium">
                    {employee.name}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-gray-50">
                    {employee.departmentName}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-purple-50">
                    {employee.type}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-purple-50">
                    {employee.category}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-purple-50">
                    {employee.description}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-purple-50">
                    ₹{employee.reimbursementAmount}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-purple-50">
                    {employee.status}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPaymentHistoryTable = () => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      <div className="max-h-[calc(100vh-280px)] overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0">
            <tr className="bg-gradient-to-r from-emerald-50 to-teal-50">
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-blue-100">
                Employee ID
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-blue-100">
                Name
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-blue-100">
                Department
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-emerald-100">
                Payment Date
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-emerald-100">
                Amount
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-emerald-100">
                Payment Mode
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-emerald-100">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {employees
              .filter((employee) =>
                employee.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((employee, index) => (
                <tr key={index} className="hover:bg-emerald-50 transition-colors duration-150">
                  <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-gray-50 font-medium">
                    {employee.employeeId}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-gray-50 font-medium">
                    {employee.name}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-gray-50">
                    {employee.departmentName}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-emerald-50">
                    {employee.paymentDate}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-emerald-50">
                    ₹{employee.amount}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-emerald-50">
                    {employee.paymentMode}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-emerald-50">
                    {employee.status}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderArrearsTable = () => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      {/* Loading indicator */}
      {companyArrearsLoading && (
        <div className="p-4 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Loading arrears data...</span>
          </div>
        </div>
      )}
      
      <div className="max-h-[calc(100vh-280px)] overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0">
            <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-blue-100">
                Employee ID
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-blue-100">
                Name
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-blue-100">
                Department
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-green-100">
                Arrears Paid
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border border-gray-300 bg-red-100">
                Arrears Deducted
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payroll && Array.isArray(payroll) && payroll.length > 0 ? (
              payroll
                .filter((payrollItem) => {
                  if (!searchQuery) return true;
                  // Find the employee name for this payroll item
                  const employee = employees.find(emp => emp.employeeId === payrollItem.employeeId);
                  return (
                    employee?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    payrollItem.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                })
                .map((payrollItem, index) => {
                  // Find corresponding employee data for this payroll item
                  const employee = employees.find(emp => emp.employeeId === payrollItem.employeeId);

                  console.log(arrearsValues)

                  return (
                    <tr key={index} className="hover:bg-blue-50 transition-colors duration-150">
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-gray-50 font-medium">
                        {payrollItem.employeeId}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-gray-50 font-medium">
                        {employee?.name || 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-gray-50">
                        {employee?.departmentName || 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-green-50">
                        {editingArrears[payrollItem.employeeId] ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={arrearsValues[payrollItem.employeeId] || ''}
                              onChange={(e) => handleArrearsChange(payrollItem.employeeId, e.target.value)}
                              className="w-32 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Enter amount"
                              min="0"
                              step="0.01"
                            />
                            <button
                              onClick={() => handleArrearsSave(payrollItem.employeeId)}
                              disabled={arrearsLoading}
                              className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Save"
                            >
                              {arrearsLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => handleArrearsCancel(payrollItem.employeeId)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Cancel"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between group">
                            <span>₹{arrearsValues[payrollItem.employeeId] !== undefined 
                              ? arrearsValues[payrollItem.employeeId]
                              : (getEmployeeArrears(payrollItem.employeeId)?.arrearsPaid || 0)}</span>
                            {isCurrentMonth() && !isPayrollFrozen() && (
                              <button
                                onClick={() => handleArrearsEdit(payrollItem.employeeId)}
                                className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-all"
                                title="Edit arrears paid"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 border border-gray-300 bg-red-50">
                        {editingArrearsDeducted[payrollItem.employeeId] ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={arrearsDeductedValues[payrollItem.employeeId] || ''}
                              onChange={(e) => handleArrearsDeductedChange(payrollItem.employeeId, e.target.value)}
                              className="w-32 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-blue-500"
                              placeholder="Enter amount"
                              min="0"
                              step="0.01"
                            />
                            <button
                              onClick={() => handleArrearsDeductedSave(payrollItem.employeeId)}
                              disabled={arrearsLoading}
                              className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Save"
                            >
                              {arrearsLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => handleArrearsDeductedCancel(payrollItem.employeeId)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Cancel"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between group">
                            <span>₹{arrearsDeductedValues[payrollItem.employeeId] !== undefined 
                              ? arrearsDeductedValues[payrollItem.employeeId] 
                              : (getEmployeeArrears(payrollItem.employeeId)?.arrearsDeducted || 0)}</span>
                            {isCurrentMonth() && !isPayrollFrozen() && (
                              <button
                                onClick={() => handleArrearsDeductedEdit(payrollItem.employeeId)}
                                className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-all"
                                title="Edit arrears deducted"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.6 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                            )}

                                                </div>
                      )}
                    </td>
                  </tr>
                  );
                })
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-gray-300 mb-4">
                      <svg className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-xl font-semibold mb-2">No employee found</p>
                    <p className="text-gray-400 text-sm">No payroll data available for the selected period</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div
        className={`flex-1 relative ${
          isSidebarCollapsed ? "ml-16" : "ml-56"
        } transition-all duration-300 overflow-hidden`}
      >
        <HradminNavbar />

        <div className="p-6 mt-16 h-[calc(100vh-64px)] overflow-y-auto">
          {/* Header with Search and Title */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              {/* Left Arrow - Before Payroll Management */}
              <button
                onClick={() => {
                  const monthMap = {
                    January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
                    July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
                  };
                  const currentMonthIndex = monthMap[selectedMonth];
                  const currentYear = parseInt(selectedYear);
                  
                  let newMonthIndex, newYear;
                  if (currentMonthIndex === 0) {
                    // January -> December of previous year
                    newMonthIndex = 11;
                    newYear = currentYear - 1;
                  } else {
                    newMonthIndex = currentMonthIndex - 1;
                    newYear = currentYear;
                  }
                  
                  const monthNames = ["January", "February", "March", "April", "May", "June",
                                    "July", "August", "September", "October", "November", "December"];
                  const newMonth = monthNames[newMonthIndex];
                  
                  setSelectedMonth(newMonth);
                  setSelectedYear(newYear.toString());
                }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center text-gray-600 font-bold text-lg border border-gray-200"
                title="Previous month"
              >
                &lt;
              </button>
              
              <h1 className="text-2xl font-bold text-gray-800">
                Payroll Management
              </h1>
              
              <button
                disabled={!isLatestAvailableMonth() || isCalculatingPayroll || isPayrollFrozen()}
                onClick={async () => {
                  if (isLatestAvailableMonth() && !isCalculatingPayroll) {
                    setHasAttemptedCalculate(true);
                    setIsCalculatingPayroll(true);
                    // Hide tables while we recalculate and fetch fresh data
                    setIsFetchingView(true);
                    // Clear previous error while we attempt
                    setPayrollErrorDetails(null);

                    try {
                      console.log("Starting payroll calculation...");

                      // Convert month name to month number
                      const monthMap = {
                        January: 1,
                        February: 2,
                        March: 3,
                        April: 4,
                        May: 5,
                        June: 6,
                        July: 7,
                        August: 8,
                        September: 9,
                        October: 10,
                        November: 11,
                        December: 12,
                      };

                      const requestBody = {
                        companyId: selectedCompanyId,
                        year: parseInt(selectedYear),
                        month: monthMap[selectedMonth],
                      };

                      console.log("Calling generatePayroll API with:", requestBody);

                      // Try to generate payroll (POST). If it fails, we'll still query view to surface exact message
                      await dispatch(generatePayroll(requestBody)).unwrap();
                      console.log("Generate payroll succeeded");
                      toast.success("Payroll calculation completed!");
                      
                      // Then, fetch the generated payroll data (GET request)
                      const params = {
                        companyId: selectedCompanyId,
                        year: parseInt(selectedYear),
                        month: monthMap[selectedMonth],
                      };

                      console.log("Calling getPayroll API with:", params);
                      setIsFetchingView(true);
                      await dispatch(getPayroll(params)).unwrap();
                      setIsFetchingView(false);
                      setPayrollErrorDetails(null);
                      setIsCalculatePayrollClicked(true);
                      setDataLastUpdated(new Date());
                      toast.success("Payroll data loaded successfully!");
                      
                    } catch (error) {
                      console.error("Payroll generation failed:", error);
                      // Only call getPayroll if generatePayroll actually failed
                      // This prevents duplicate API calls
                      try {
                        const monthMap = {
                          January: 1,
                          February: 2,
                          March: 3,
                          April: 4,
                          May: 5,
                          June: 6,
                          July: 7,
                          August: 8,
                          September: 9,
                          October: 10,
                          November: 11,
                          December: 12,
                        };
                        const params = {
                          companyId: selectedCompanyId,
                          year: parseInt(selectedYear),
                          month: monthMap[selectedMonth],
                        };
                        // Only fetch if we need to show error details
                        await dispatch(getPayroll(params)).unwrap();
                        setPayrollErrorDetails(null);
                      } catch (viewError) {
                        setPayrollErrorDetails(viewError);
                      }
                    } finally {
                      setIsCalculatingPayroll(false);
                      setIsFetchingView(false);
                    }
                  }
                }}
                className={`px-6 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                  isLatestAvailableMonth() && !isCalculatingPayroll && !isPayrollFrozen()
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-400 text-gray-600 cursor-not-allowed opacity-50"
                }`}
              >
                {isCalculatingPayroll 
                  ? "Calculating..." 
                  : isLatestAvailableMonth() && !isPayrollFrozen() && (isCalculatePayrollClicked || (payroll && Array.isArray(payroll) && payroll.length > 0))
                    ? "Recalculate Payroll"
                    : "Calculate Payroll"
                }
              </button>
              
              {showCheckboxes && (
                <button
                  onClick={() => {
                    setShowCheckboxes(false);
                    setSelectedEmployees([]);
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-md font-medium text-sm transition-colors duration-200 hover:bg-red-600"
                >
                  Cancel Payslip
                </button>
              )}
              
              {isLatestAvailableMonth() && !isPayrollFrozen() && (isCalculatePayrollClicked || (payroll && Array.isArray(payroll) && payroll.length > 0)) && (
                <button
                  onClick={() => {
                    if (showCheckboxes) {
                      setShowConfirmationModal(true);
                    } else {
                      setShowCheckboxes(true);
                      setSelectedEmployees(
                        employees.map((emp) => emp.employeeId)
                      );
                    }
                  }}
                  disabled={payroll?.sendPayslipsLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md font-medium text-sm transition-all duration-200 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {showCheckboxes ? "Finalize Payslip" : "Send Payslip"}
                </button>
              )}
              
              {/* Right Arrow - After action buttons */}
              {!isLatestAvailableMonth() && (
                <button
                  onClick={() => {
                    const monthMap = {
                      January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
                      July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
                    };
                    const currentMonthIndex = monthMap[selectedMonth];
                    const currentYear = parseInt(selectedYear);
                    
                    let newMonthIndex, newYear;
                    if (currentMonthIndex === 11) {
                      // December -> January of next year
                      newMonthIndex = 0;
                      newYear = currentYear + 1;
                    } else {
                      newMonthIndex = currentMonthIndex + 1;
                      newYear = currentYear;
                    }
                    
                    const monthNames = ["January", "February", "March", "April", "May", "June",
                                      "July", "August", "September", "October", "November", "December"];
                    const newMonth = monthNames[newMonthIndex];
                    
                    setSelectedMonth(newMonth);
                    setSelectedYear(newYear.toString());
                  }}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center text-gray-600 font-bold text-lg border border-gray-200"
                  title="Next month"
                >
                  &gt;
                </button>
              )}
              
            </div>
            <div className="flex gap-4">
              {(!isLatestAvailableMonth() || isCalculatePayrollClicked || (payroll && Array.isArray(payroll) && payroll.length > 0)) && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full md:w-72 pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
              )}
              <div className="relative">
                <Badge
                  variant="outline"
                  className="px-6 py-2 cursor-pointer bg-blue-500 hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2 text-white"
                  onClick={toggleCalendar}
                >
                  <Calendar className="h-5 w-5" />
                  <span className="font-medium text-base">
                    {selectedYear}-
                    {selectedMonth.toLocaleString("default", { month: "long" })}
                  </span>
                </Badge>
                {isCalendarOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="p-3 border-b">
                      <div className="text-sm font-medium text-gray-700">
                        {selectedYear}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 p-3">
                      {[
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec",
                      ]
                        .slice(0, new Date().getMonth())
                        .map((month) => (
                          <button
                            key={month}
                            className={`p-3 text-sm rounded-md transition-colors duration-200 ${
                              month ===
                              selectedMonth
                                .toLocaleString("default", { month: "long" })
                                .slice(0, 3)
                                ? "bg-blue-50 text-blue-600 font-medium hover:bg-blue-100"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                            onClick={() =>
                              handleMonthSelection(month, selectedYear)
                            }
                          >
                            {month}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Minimal centered message before calculate */}
          {payrollErrorDetails && !hasAttemptedCalculate && !isFetchingView && (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="text-center max-w-lg px-4">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Payroll Not Available</h3>
                  <p className="text-gray-600 mb-3">
                    The payroll for {selectedMonth} {selectedYear} hasn&apos;t been generated yet.
                  </p>
                  <p className="text-gray-700 font-medium">
                    Click the &quot;Calculate Payroll&quot; button above to generate payroll.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actionable panel after calculate attempt */}
          {payrollErrorDetails && hasAttemptedCalculate && !isFetchingView && (
            <div className="mt-4">
              <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-semibold text-red-600 mb-3">
                  Payroll Generation Failed
                </h3>
                <div className="mb-3">
                  <p className="text-gray-700 mb-1">
                    <strong>Reason:</strong> Attendance records incomplete for {payrollErrorDetails?.validationErrors?.failedEmployeeIds?.split(',').length || 0} employees.
                  </p>
                  <p className="text-sm text-gray-600">
                    Complete attendance data for {selectedMonth} {selectedYear} to generate payroll.
                  </p>
                </div>
                {payrollErrorDetails?.validationErrors?.failedEmployeeIds && (
                  <>
                    <p className="text-sm font-medium text-gray-700 mb-2">Affected Employees:</p>
                    <div className="bg-gray-50 border border-gray-200 rounded p-2 max-h-24 overflow-y-auto">
                      <div className="flex flex-wrap gap-1">
                        {payrollErrorDetails.validationErrors.failedEmployeeIds
                          .split(',')
                          .map((id, index) => (
                            <span
                              key={index}
                              className="text-xs bg-white px-2 py-1 border rounded"
                            >
                              {id.trim()}
                            </span>
                          ))}
                      </div>
                    </div>
                  </>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      setPayrollErrorDetails(null);
                      window.location.href = '/hradmin/attendance';
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Go to Attendance
                  </button>
                  <button
                    onClick={() => {
                      setPayrollErrorDetails(null);
                      setHasAttemptedCalculate(false);
                      setIsCalculatePayrollClicked(false);
                      dispatch(clearPayroll()); // Clear payroll state from Redux
                    }}
                    className="px-3 py-1.5 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Professional reminder message */}
          {(isCalculatePayrollClicked || (payroll && Array.isArray(payroll) && payroll.length > 0)) && (
            <div className="mb-4 text-sm text-blue-600 bg-blue-50 px-4 py-2 rounded-md border border-blue-200 max-w-2xl">
              <span className="font-medium">Note:</span> After calculating or recalculating payroll, please remember to send payslips to employees.
            </div>
          )}



          {/* Tabs - Only show when there's valid data or payroll has been calculated */}
          {!payrollErrorDetails && !isFetchingView && ((payroll && Array.isArray(payroll) && payroll.length > 0) || isCalculatePayrollClicked) && (
            <div className="bg-gray-50 overflow-x-auto scrollbar-thin">
              <div className="flex min-w-max">
                {                [
                  "Salary Statement",
                  "Deductions",
                  "Advance",
                  "Arrears",
                  "Reimbursement",
                  "Payment History",
                ].map((section) => {
                  const isDisabled =
                    section === "Reimbursement" ||
                    section === "Payment History";
                  return (
                    <button
                      key={section}
                      className={`px-8 py-4 text-sm font-medium transition-colors relative ${
                        isDisabled
                          ? "text-gray-400 cursor-not-allowed opacity-50"
                          : selectedSection === section
                          ? "text-blue-600 bg-white shadow-[0_-1px_4px_rgba(0,0,0,0.1)] rounded-t-lg"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => !isDisabled && setSelectedSection(section)}
                      disabled={isDisabled}
                    >
                      {section}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!payrollErrorDetails && !isFetchingView && ((payroll && Array.isArray(payroll) && payroll.length > 0) || isCalculatePayrollClicked) && (
            <>
              {selectedSection === "Salary Statement" && renderPayrollTable()}
              {selectedSection === "Deductions" && renderDeductionsTable()}
              {selectedSection === "Advance" && renderAdvanceTable()}
              {selectedSection === "Arrears" && renderArrearsTable()}
              {selectedSection === "Reimbursement" &&
                renderReimbursementTable()}
              {selectedSection === "Payment History" &&
                renderPaymentHistoryTable()}
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Confirm Send Payslip
              </h2>
              <button
                onClick={() => setShowConfirmationModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to send payslips to the selected
                employees?
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmationModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedEmployees || selectedEmployees.length === 0) {
                    return;
                  }
                  
                  try {
                    const result = await dispatch(sendPayslips(selectedEmployees));
                    
                    if (result.meta.requestStatus === 'fulfilled') {
                      setShowConfirmationModal(false);
                      setShowCheckboxes(false);
                      setSelectedEmployees([]);
                    }
                    
                  } catch (error) {
                    console.error("Failed to send payslips:", error);
                  }
                }}
                disabled={payroll?.sendPayslipsLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {payroll?.sendPayslipsLoading ? "Sending..." : "Send Payslips"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(PayrollManagement);