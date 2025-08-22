import React, {
  useCallback,
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Search, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllEmployeeAttendanceOneMonth,
  fetchOneEmployeeAttendanceOneMonth,
  fetchEmployeeAttendanceHistory,
} from "@/redux/slices/attendancesSlice";
import {
  markSingleEmployeeMonthAttendance,
  markAllEmployeesDateAttendance,
  markManualAttendance,
  clearError,
  clearSuccess,
} from "@/redux/slices/manualAttendanceSlice";
import { toast } from "sonner";
import AttendanceTable from "./AttendanceTable";
import LeaveTable from "./LeaveTable";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

// Utility to convert dateStatusMap to API payload for markManualAttendance (all 9 statuses)
function buildManualAttendancePayload(employeeId, dateStatusMap) {
  return {
    employeeId,
    dateStatusMap,
  };
}

function AttendanceTracker({
  employees = [],
  employeesLoading = false,
  role,
  initialSelectedDate = null,
  initialSelectedMonth = null,
  initialSelectedYear = null,
  initialSelectedStatuses = [],
  isPayrollFrozen = false,
}) {
  const dispatch = useDispatch();

  // Helper function to convert month name to month number
  const getMonthNumber = (monthName) => {
    const monthMap = {
      January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
      July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
    };
    return monthMap[monthName] || 1;
  };

  // Constants for month mappings
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const SHORT_MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Constants for year range
  const MIN_YEAR = 2024;
  const getCurrentYear = () => new Date().getFullYear();

  // Constants for attendance statuses
  const EDITABLE_STATUSES = ["P", "A", "P/A", null, undefined, ""];
  const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
  const MAX_FUTURE_YEARS = 10;

  const { attendance, attendanceHistory, historyLoading, historyError, loading, err } = useSelector(
    (state) => state.attendances
  );

  const {
    loading: manualAttendanceLoading,
    error: manualAttendanceError,
    success: manualAttendanceSuccess,
    message: manualAttendanceMessage,
  } = useSelector((state) => state.manualAttendance);

  // Payroll freeze status is now passed as a prop from the parent component

  // State variables
  const [searchInput, setSearchInput] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    initialSelectedMonth ||
      new Date().toLocaleString("default", { month: "long" })
  );
  const [selectedYear, setSelectedYear] = useState(
    initialSelectedYear || new Date().getFullYear().toString()
  );
  const [activeTab, setActiveTab] = useState("Attendance Tracker");
  const [dates, setDates] = useState([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState(
    initialSelectedStatuses
  );
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const statusFilterRef = useRef(null);
  const calendarRef = useRef(null);
  const departmentFilterRef = useRef(null);

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(
    initialSelectedDate || today.getDate()
  );

  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [isDepartmentFilterOpen, setIsDepartmentFilterOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Separate state for Single Employee Month Modal dropdowns
  const [singleEmployeeMarkAsStatus, setSingleEmployeeMarkAsStatus] =
    useState("");
  const [singleEmployeeApplyToScope, setSingleEmployeeApplyToScope] =
    useState("");

  // Separate state for All Employees Date Modal dropdowns
  const [allEmployeesMarkAsStatus, setAllEmployeesMarkAsStatus] = useState("");
  const [allEmployeesApplyToScope, setAllEmployeesApplyToScope] = useState("");

  // Add state for employee dropdown
  const [employeeDropdownSearch, setEmployeeDropdownSearch] = useState("");
  const [employeeDropdownInput, setEmployeeDropdownInput] = useState("");

  // Add state for employee selection dropdown
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const employeeDropdownRef = useRef(null);

  // Attendance cell popover state
  const [cellPopoverOpen, setCellPopoverOpen] = useState(false);
  const [cellPopoverEmployee, setCellPopoverEmployee] = useState(null);
  const [cellPopoverDate, setCellPopoverDate] = useState(null);
  const [cellPopoverStatus, setCellPopoverStatus] = useState("");
  const [cellPopoverPosition, setCellPopoverPosition] = useState({
    top: 0,
    left: 0,
  });
  const cellPopoverAnchorRef = useRef(null);
  const [popoverOpenCell, setPopoverOpenCell] = useState(null);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  // Ref to track if we're currently fetching employee data
  const isFetchingEmployeeDataRef = useRef(false);
  
  // Ref to track previous modal state for auto-refresh
  const prevModalStateRef = useRef({
    singleEmployee: false,
    allEmployees: false
  });

  // Universal close function for all modals and popups
  const closeAllModals = () => {
    setIsSingleEmployeeModalOpen(false);
    setIsAllEmployeesDateModalOpen(false);
    setSelectedEmployeeForMonth(null);
    setMonthAttendanceData({});
    setOriginalMonthAttendanceData({});
    setAllEmployeesAttendanceData({});
    setOriginalAllEmployeesAttendanceData({});
    setAllEmployeesSearch("");
    setSingleEmployeeMarkAsStatus("");
    setSingleEmployeeApplyToScope("");
    setAllEmployeesMarkAsStatus("");
    setAllEmployeesApplyToScope("");
    setEmployeeDropdownSearch("");
    setEmployeeDropdownInput("");
    setIsEmployeeDropdownOpen(false);
    setIsCalendarOpen(false);
    setIsStatusFilterOpen(false);
    setIsDepartmentFilterOpen(false);
    setPopoverOpenCell(null);
    setCellPopoverOpen(false);
    // Reset fetching state
    isFetchingEmployeeDataRef.current = false;
    // Reset selected date for All Employees modal
    setSelectedDateForAll(null);
  };

  // Function to switch between tabs without losing data
  const switchToSingleEmployeeTab = () => {
    setIsAllEmployeesDateModalOpen(false);
    setIsSingleEmployeeModalOpen(true);
  };

  const switchToAllEmployeesTab = () => {
    setIsSingleEmployeeModalOpen(false);
    setIsAllEmployeesDateModalOpen(true);
    
    // Set the appropriate date for better UX when switching to All Employees Date view
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    
    // Check if we're viewing the current month
    const selectedMonthIndex = new Date(`${selectedMonth} 1, ${selectedYear}`).getMonth();
    const selectedYearNum = parseInt(selectedYear);
    
    let dateToSelect;
    if (selectedYearNum === currentYear && selectedMonthIndex === currentMonth) {
      // Current month: select today's date for better UX
      dateToSelect = currentDay;
    } else if (selectedYearNum > currentYear || (selectedYearNum === currentYear && selectedMonthIndex > currentMonth)) {
      // Future month: select the first date of that month
      dateToSelect = 1;
    } else {
      // Past month: select the last date of that month
      const daysInSelectedMonth = new Date(selectedYearNum, selectedMonthIndex + 1, 0).getDate();
      dateToSelect = daysInSelectedMonth;
    }
    
    // Update the main view selected date
    setSelectedDate(dateToSelect);
    
    // Update the All Employees Date modal date to match the main view
    // Convert the selected date to YYYY-MM-DD format for the modal
    const monthIndex = selectedMonthIndex + 1; // getMonth() returns 0-11, so add 1
    const formattedDate = `${selectedYearNum}-${monthIndex.toString().padStart(2, '0')}-${dateToSelect.toString().padStart(2, '0')}`;
    setSelectedDateForAll(formattedDate);
  };

  // Function to check if there are changes in Single Employee Month modal
  const hasSingleEmployeeChanges = () => {
    const currentKeys = Object.keys(monthAttendanceData);
    const originalKeys = Object.keys(originalMonthAttendanceData);

    // Check if any keys are different
    if (currentKeys.length !== originalKeys.length) return true;

    // Check if any values are different
    for (const key of currentKeys) {
      if (monthAttendanceData[key] !== originalMonthAttendanceData[key]) {
        return true;
      }
    }

    return false;
  };

  // Function to check if there are changes in All Employees Date modal
  const hasAllEmployeesChanges = () => {
    const currentKeys = Object.keys(allEmployeesAttendanceData);
    const originalKeys = Object.keys(originalAllEmployeesAttendanceData);

    // Check if any keys are different
    if (currentKeys.length !== originalKeys.length) return true;

    // Check if any values are different
    for (const key of currentKeys) {
      if (
        allEmployeesAttendanceData[key] !==
        originalAllEmployeesAttendanceData[key]
      ) {
        return true;
      }
    }

    return false;
  };

  // Single Employee Month Modal State
  const [isSingleEmployeeModalOpen, setIsSingleEmployeeModalOpen] =
    useState(false);
  const [selectedEmployeeForMonth, setSelectedEmployeeForMonth] =
    useState(null);
  const [monthAttendanceData, setMonthAttendanceData] = useState({});
  const [originalMonthAttendanceData, setOriginalMonthAttendanceData] =
    useState({}); // Track original data for change detection
  const [monthYear, setMonthYear] = useState({
    month: initialSelectedMonth || new Date().toLocaleString("default", { month: "long" }),
    year: initialSelectedYear || new Date().getFullYear().toString(),
  });

  // All Employees Date Modal State
  const [isAllEmployeesDateModalOpen, setIsAllEmployeesDateModalOpen] =
    useState(false);
  const [selectedDateForAll, setSelectedDateForAll] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [allEmployeesAttendanceData, setAllEmployeesAttendanceData] = useState(
    {}
  );
  const [
    originalAllEmployeesAttendanceData,
    setOriginalAllEmployeesAttendanceData,
  ] = useState({}); // Track original data for change detection
  const [allEmployeesSearch, setAllEmployeesSearch] = useState("");

  // Constants/Options
  const statusOptions = [
    { value: "P", label: "Present", color: "#CCFFCC" },
    { value: "L", label: "Approved Leave", color: "#E5E5CC" },
    { value: "P/A", label: "Half Day", color: "#FFFFCC" },
    { value: "P/L", label: "Approved half day Leave", color: "#ffcc80" },
    { value: "A", label: "Absent", color: "#FFCCCC" },
    { value: "H", label: "Holiday", color: "#E0E0E0" },
  ];

  // Filtered status options for dropdown menus (only Present, Absent, Half Day)
  const dropdownStatusOptions = [
    { value: "P", label: "Present", color: "#CCFFCC" },
    { value: "A", label: "Absent", color: "#FFCCCC" },
    { value: "P/A", label: "Half Day", color: "#FFFFCC" },
  ];

  const applyToOptions = [
    { value: "all", label: "All Days" },
    { value: "except_holiday", label: "All Except Holidays" },
    { value: "unmarked", label: "All Unmarked Days" },
    { value: "working", label: "All Working Days" },
    { value: "weekends", label: "All Weekends" },
  ];

  // Function to get dynamic Apply To options based on selected status
  const getSingleEmployeeApplyToOptions = (selectedStatus) => {
    // For all editable statuses (P, A, P/A), show the same options
    return [
      { value: "unmarked", label: "All Unmarked Days" },
      { value: "working", label: "All Working Days" },
    ];
  };

  // Separate Apply To options for All Employees Date (applying to employees)
  const allEmployeesApplyToOptions = [
    { value: "all", label: "All Employees" },
    { value: "unmarked", label: "All Unmarked Employees" },
    { value: "except_holiday", label: "All Except Holiday Status" },
  ];

  // Combined useEffect for click outside handling
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        statusFilterRef.current &&
        !statusFilterRef.current.contains(event.target)
      ) {
        setIsStatusFilterOpen(false);
      }

      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }

      if (
        departmentFilterRef.current &&
        !departmentFilterRef.current.contains(event.target)
      ) {
        setIsDepartmentFilterOpen(false);
      }

      // Close employee dropdown when clicking outside
      if (
        employeeDropdownRef.current &&
        !employeeDropdownRef.current.contains(event.target)
      ) {
        setIsEmployeeDropdownOpen(false);
      }

      // Close cell popover when clicking outside
      if (cellPopoverOpen) {
        const popoverElement = document.querySelector("[data-cell-popover]");
        const clickedElement = event.target;

        // Check if click is outside the popover
        if (popoverElement && !popoverElement.contains(clickedElement)) {
          // Don't close if clicking on dropdown elements
          const isDropdownElement =
            clickedElement.closest("[data-radix-popper-content-wrapper]") ||
            clickedElement.closest("[data-radix-popper-trigger]") ||
            clickedElement.closest('[role="menuitemradio"]');

          if (!isDropdownElement) {
            closePopover();
          }
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [cellPopoverOpen]);

  // Reset apply scope when status changes
  useEffect(() => {
    if (singleEmployeeMarkAsStatus) {
      const availableOptions = getSingleEmployeeApplyToOptions(
        singleEmployeeMarkAsStatus
      );
      const currentScopeExists = availableOptions.some(
        (opt) => opt.value === singleEmployeeApplyToScope
      );

      // If current scope is not applicable for the new status, reset to first available option
      if (!currentScopeExists && availableOptions.length > 0) {
        setSingleEmployeeApplyToScope(availableOptions[0].value);
      }
    }
  }, [singleEmployeeMarkAsStatus, singleEmployeeApplyToScope]);

  // Effects
  useEffect(() => {
    try {
      const generateDates = () => {
        const dates = [];
        const monthIndex = new Date(
          `${selectedMonth} 1, ${selectedYear}`
        ).getMonth();
        const daysInMonth = new Date(selectedYear, monthIndex + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
          const date = new Date(selectedYear, monthIndex, i);
          dates.push({
            day: i,
            weekday: date.toLocaleString("default", { weekday: "short" }),
          });
        }
        return dates;
      };
      setDates(generateDates());
    } catch (err) {
      setError("Error generating dates");
    }
  }, [selectedMonth, selectedYear]);

  // Call API on component mount with initial date
  useEffect(() => {
    // Convert month name to numeric month (1-12)
    const monthIndex = new Date(
      `${selectedMonth} 1, ${selectedYear}`
    ).getMonth();
    const numericMonth = monthIndex + 1; // getMonth() returns 0-11, so add 1
    const year = selectedYear;

    // Prepare API parameters
    let apiParams = { month: numericMonth, year, role, date: selectedDate };

    // Add status filter if any statuses are selected
    if (selectedStatuses.length > 0) {
      apiParams.status = selectedStatuses.join(",");
    }

    dispatch(fetchAllEmployeeAttendanceOneMonth(apiParams));
  }, [
    dispatch,
    selectedMonth,
    selectedYear,
    selectedDate,
    selectedStatuses,
    role,
  ]);

  // Handle manual attendance success and error messages
  useEffect(() => {
    if (manualAttendanceSuccess) {
      toast.success(manualAttendanceMessage);
      dispatch(clearSuccess());
    }
    if (manualAttendanceError) {
      toast.error(manualAttendanceError);
      dispatch(clearError());
    }
  }, [
    manualAttendanceSuccess,
    manualAttendanceError,
    manualAttendanceMessage,
    dispatch,
  ]);

  // Auto-refresh attendance data when returning from modals
  useEffect(() => {
    // Check if we're returning from a modal (both were closed and at least one was previously open)
    const wasAnyModalOpen = prevModalStateRef.current.singleEmployee || prevModalStateRef.current.allEmployees;
    const isAnyModalOpen = isSingleEmployeeModalOpen || isAllEmployeesDateModalOpen;
    
    if (!isAnyModalOpen && wasAnyModalOpen) {
      // Convert month name to numeric month (1-12)
      const monthIndex = new Date(
        `${selectedMonth} 1, ${selectedYear}`
      ).getMonth();
      const numericMonth = monthIndex + 1;
      const year = selectedYear;
      
      // Prepare API parameters with current filters
      let apiParams = { month: numericMonth, year, role };
      
      // Add date filter if a specific date is selected
      if (selectedDate) {
        apiParams.date = selectedDate;
      }
      
      // Add status filter if any statuses are selected
      if (selectedStatuses.length > 0) {
        apiParams.status = selectedStatuses.join(",");
      }
      
      dispatch(fetchAllEmployeeAttendanceOneMonth(apiParams));
    }
    
    // Update the ref to track current modal state
    prevModalStateRef.current = {
      singleEmployee: isSingleEmployeeModalOpen,
      allEmployees: isAllEmployeesDateModalOpen
    };
  }, [
    isSingleEmployeeModalOpen,
    isAllEmployeesDateModalOpen,
    selectedMonth,
    selectedYear,
    selectedDate,
    selectedStatuses,
    role,
    dispatch,
  ]);

  // Always keep monthYear in sync with main selectedMonth/selectedYear
  useEffect(() => {
    setMonthYear({
      month: selectedMonth,
      year: selectedYear
    });
  }, [selectedMonth, selectedYear]);

  // Synchronize monthYear state with main selectedMonth/selectedYear when single employee modal opens
  useEffect(() => {
    if (isSingleEmployeeModalOpen) {
      setMonthYear({
        month: selectedMonth,
        year: selectedYear
      });
    }
  }, [isSingleEmployeeModalOpen, selectedMonth, selectedYear]);

  // Close cell popover when switching views or opening modals
  useEffect(() => {
    if (
      isSingleEmployeeModalOpen ||
      isAllEmployeesDateModalOpen ||
      activeTab !== "Attendance Tracker"
    ) {
      setCellPopoverOpen(false);
      setPopoverOpenCell(null);
    }
  }, [isSingleEmployeeModalOpen, isAllEmployeesDateModalOpen, activeTab]);

  // Handle window resize to reposition popup if needed
  useEffect(() => {
    const handleResize = () => {
      if (cellPopoverOpen && cellPopoverAnchorRef.current) {
        // Reposition popup on window resize
        const cellRect = cellPopoverAnchorRef.current.getBoundingClientRect();
        const popoverWidth = getPopupDimensions().width;
        const popoverHeight = getPopupDimensions().maxHeight;
        const minMargin = 16;
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let left = cellRect.left + (cellRect.width / 2) - (popoverWidth / 2);
        let top = cellRect.top - popoverHeight - 8;
        
        // Adjust position if needed
        if (top < minMargin) {
          top = cellRect.bottom + 8;
        }
        if (top + popoverHeight > viewportHeight - minMargin) {
          top = cellRect.top - (popoverHeight / 2) - 8;
        }
        if (left < minMargin) {
          left = minMargin;
        }
        if (left + popoverWidth > viewportWidth - minMargin) {
          left = viewportWidth - popoverWidth - minMargin;
        }
        
        setCellPopoverPosition({ top, left });
      }
    };

    const handleClickOutside = (event) => {
      if (cellPopoverOpen && !event.target.closest('[data-cell-popover]') && !event.target.closest('[data-employee]')) {
        closePopover();
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [cellPopoverOpen]);

  // Fetch employee attendance data when month/year changes in Single Employee modal
  useEffect(() => {
    if (
      selectedEmployeeForMonth &&
      isSingleEmployeeModalOpen &&
      monthYear.month &&
      monthYear.year &&
      !isFetchingEmployeeDataRef.current
    ) {
      isFetchingEmployeeDataRef.current = true;

      // Fetch existing attendance data for this employee and month/year
      dispatch(
        fetchOneEmployeeAttendanceOneMonth({
          employeeId: selectedEmployeeForMonth.id,
          month: monthYear.month,
          year: monthYear.year,
        })
      )
        .then((result) => {
          isFetchingEmployeeDataRef.current = false;

          if (!result.error && result.payload) {
            // Merge API response data with employee data
            const attendanceData = result.payload;
            const updatedEmployee = {
              ...selectedEmployeeForMonth,
              weeklyOffDays: attendanceData.weeklyOffDays || [],
              statusCounts: attendanceData.statusCounts || {},
            };

            // Only update employee if the data actually changed
            if (
              JSON.stringify(updatedEmployee) !==
              JSON.stringify(selectedEmployeeForMonth)
            ) {
              setSelectedEmployeeForMonth(updatedEmployee);
            }

            // Initialize attendance data with existing data
            const dates = generateMonthDates(monthYear.month, monthYear.year);
            const initialData = {};

            // Helper function to get attendance status for a specific date
            const getAttendanceStatusForDate = (dayNumber) => {
              if (!attendanceData) return null; // Return null if no attendance data

              // Handle new format with days object
              if (attendanceData.days) {
                if (attendanceData.days[dayNumber]) {
                  return attendanceData.days[dayNumber].statusCode;
                }
                return null; // Return null if no status code is available (empty box)
              }

              // Fallback to old format
              const monthIndex = new Date(
                `${monthYear.month} 1, ${monthYear.year}`
              ).getMonth();
              const dateString = `${monthYear.year}-${String(
                monthIndex + 1
              ).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;

              // Check present dates
              if (attendanceData.presentDates?.includes(dateString)) {
                return "P";
              }

              // Check full leave dates
              if (attendanceData.fullLeaveDates?.includes(dateString)) {
                return "L";
              }

              // Check half day leave dates
              if (attendanceData.halfDayLeaveDates?.includes(dateString)) {
                return "P/A";
              }

              // Check full comp-off dates
              if (attendanceData.fullCompoffDates?.includes(dateString)) {
                return "P";
              }

              // Check half comp-off dates
              if (attendanceData.halfCompoffDates?.includes(dateString)) {
                return "P/A";
              }

              // Check weekly off dates
              if (attendanceData.weeklyOffDates?.includes(dateString)) {
                return "H";
              }

              // Check absent dates
              if (attendanceData.absentDates?.includes(dateString)) {
                return "A";
              }

              return null; // Return null if no status found (empty box)
            };

            dates.forEach(({ day }) => {
              const status = getAttendanceStatusForDate(day.toString());
              initialData[day] = status || null; // Use null instead of empty string
            });

            setMonthAttendanceData(initialData);
            setOriginalMonthAttendanceData(initialData); // Set original data for change tracking
          } else {
            // If no existing data, initialize with empty values
            const dates = generateMonthDates(monthYear.month, monthYear.year);
            const initialData = {};
            dates.forEach(({ day }) => {
              initialData[day] = null; // Use null instead of empty string
            });

            setMonthAttendanceData(initialData);
            setOriginalMonthAttendanceData(initialData); // Set original data for change tracking
          }
        })
        .catch((error) => {
          isFetchingEmployeeDataRef.current = false;

          // Initialize with empty values on error
          const dates = generateMonthDates(monthYear.month, monthYear.year);
          const initialData = {};
          dates.forEach(({ day }) => {
            initialData[day] = null; // Use null instead of empty string
          });

          setMonthAttendanceData(initialData);
          setOriginalMonthAttendanceData(initialData); // Set original data for change tracking
        });
    }
  }, [
    monthYear.month,
    monthYear.year,
    selectedEmployeeForMonth?.id,
    isSingleEmployeeModalOpen,
    dispatch,
  ]);

  // Fetch attendance data when selected date changes in All Employees Date modal
  useEffect(() => {
    if (isAllEmployeesDateModalOpen && selectedDateForAll) {
      const selectedDate = new Date(selectedDateForAll);
      const month = selectedDate.getMonth() + 1; // getMonth() returns 0-11
      const year = selectedDate.getFullYear();

      // Fetch attendance data for the selected month/year
      dispatch(
        fetchAllEmployeeAttendanceOneMonth({
          month,
          year,
          role,
        })
      );
    }
  }, [selectedDateForAll, isAllEmployeesDateModalOpen, dispatch, role]);

  // Callbacks
  const generateAttendanceData = useCallback(
    (employee) => {
      // Handle new response format with monthlyAttendance array
      let attendanceRecord = null;

      if (attendance && attendance.monthlyAttendance) {
        attendanceRecord = attendance.monthlyAttendance.find(
          (record) => record.employeeId === employee.employeeId
        );
      } else if (Array.isArray(attendance)) {
        // Fallback to old format
        attendanceRecord = attendance.find(
          (record) => record.employeeId === employee.employeeId
        );
      }

      // If no attendance record found, return employee data with empty attendance
      if (!attendanceRecord) {
        return {
          id: employee.employeeId || employee.id,
          name: employee.employeeName || employee.name,
          department: employee.departmentName || employee.department,
          p_twd: "0/0",
          attendance: Array(dates.length).fill({ value: null, label: null }),
        };
      }

      // Helper function to determine attendance status for a given date
      const getAttendanceStatusForDate = (dayNumber) => {
        // Handle new format with days object
        if (attendanceRecord.days) {
          if (attendanceRecord.days[dayNumber]) {
            return attendanceRecord.days[dayNumber].statusCode;
          }
          return null; // Return null if no status code is available (empty box)
        }

        // Fallback to old format
        const attendanceData = attendanceRecord.attendance;
        if (!attendanceData) return null; // Return null if no attendance data

        const monthIndex = new Date(
          `${selectedMonth} 1, ${selectedYear}`
        ).getMonth();
        const dateString = `${selectedYear}-${String(monthIndex + 1).padStart(
          2,
          "0"
        )}-${String(dayNumber).padStart(2, "0")}`;

        // Check present dates
        if (attendanceData.presentDates?.includes(dateString)) {
          return "P";
        }

        // Check full leave dates
        if (attendanceData.fullLeaveDates?.includes(dateString)) {
          return "L";
        }

        // Check half day leave dates
        if (attendanceData.halfDayLeaveDates?.includes(dateString)) {
          return "P/A";
        }

        // Check full comp-off dates
        if (attendanceData.fullCompoffDates?.includes(dateString)) {
          return "P";
        }

        // Check half comp-off dates
        if (attendanceData.halfCompoffDates?.includes(dateString)) {
          return "P/A";
        }

        // Check weekly off dates
        if (attendanceData.weeklyOffDates?.includes(dateString)) {
          return "H";
        }

        // Check absent dates
        if (attendanceData.absentDates?.includes(dateString)) {
          return "A";
        }

        return null; // Return null if no status found (empty box)
      };

      const attendanceArray = Array(dates.length)
        .fill(null)
        .map((_, index) => {
          const day = index + 1;
          const status = getAttendanceStatusForDate(day.toString());

          // If status is null, return empty object
          if (status === null) {
            return { value: null, label: null };
          }

          let value;
          switch (status.toUpperCase()) {
            case "P":
              value = true;
              break;
            case "L":
              value = true;
              break;
            case "A":
              value = false;
              break;
            case "P/A":
              value = "half";
              break;
            case "H":
              value = "holiday";
              break;
            case "P/L":
              value = "half";
              break;
            default:
              value = null;
          }
          return { value, label: status };
        });

      return {
        id: employee.employeeId || employee.id,
        name: employee.employeeName || employee.name,
        department: employee.departmentName || employee.department,
        p_twd: `${attendanceRecord.paidDays || 0}/${
          attendanceRecord.workingDays || 0
        }`,
        attendance: attendanceArray,
      };
    },
    [dates.length, attendance, selectedMonth, selectedYear]
  );

  const generateLeaveData = useCallback(
    (employee) => {
      const attendanceRecord = Array.isArray(attendance)
        ? attendance.find((record) => record.employeeId === employee.employeeId)
        : null;

      if (!attendanceRecord) {
        return {
          id: employee.employeeId,
          name: employee.name,
          department: employee.departmentName || "",
          noOfPayableDays: "0",
          leavesTaken: "0",
          leavesEarned: "0",
          leavesFromPreviousYear: "0",
          compOffEarned: "0",
          compOffCarriedForward: "0",
          netLeaves: "0",
        };
      }

      return {
        id: employee.employeeId,
        name: employee.name,
        department:
          attendanceRecord.departmentName || employee.departmentName || "",
      };
    },
    [attendance]
  );

  const getAttendanceColor = useCallback((status) => {
    if (status === null) return "bg-gray-100";
    const upperStatus = status.toUpperCase();
    if (upperStatus === "P") return "bg-[#CCFFCC]";
    if (upperStatus === "L") return "bg-[#E5E5CC]";
    if (upperStatus === "P/A") return "bg-[#FFFFCC]";
    if (upperStatus === "A") return "bg-[#FFCCCC]";
    if (upperStatus === "H") return "bg-[#E0E0E0]";
    if (upperStatus === "P/L") return "bg-[#ffcc80]";
    if (upperStatus === "WEEKEND") return "bg-gray-300";
    return "";
  }, []);

  const toggleStatus = useCallback((status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  }, []);

  const handleDateClick = useCallback((day) => {
    setSelectedDate((prevDate) => (prevDate === day ? null : day));
    setSelectedEmployeeId(null);
    
    // Call API when a date is selected
    if (day) {
      // Convert month name to numeric month (1-12)
      const monthIndex = new Date(
        `${selectedMonth} 1, ${selectedYear}`
      ).getMonth();
      const numericMonth = monthIndex + 1; // getMonth() returns 0-11, so add 1
      const year = selectedYear;

      // Prepare API parameters
      let apiParams = { month: numericMonth, year, role, date: day };

      // Add status filter if any statuses are selected
      if (selectedStatuses.length > 0) {
        apiParams.status = selectedStatuses.join(",");
      }

      dispatch(fetchAllEmployeeAttendanceOneMonth(apiParams));
    }
  }, [selectedMonth, selectedYear, selectedStatuses, role, dispatch]);

  const toggleDepartment = useCallback((department) => {
    setSelectedDepartments((prev) =>
      prev.includes(department)
        ? prev.filter((d) => d !== department)
        : [...prev, department]
    );
  }, []);

  const toggleCalendar = useCallback(
    () => setIsCalendarOpen(!isCalendarOpen),
    [isCalendarOpen]
  );

  const handleMonthSelection = useCallback((month, year) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();

    // Get the month index for the selected month
    const monthIndex = new Date(`${month} 1, ${year}`).getMonth();

    // Determine the date to select immediately
    let dateToSelect;
    if (year === currentYear.toString() && monthIndex === currentMonth) {
      // Coming back to current month - always select current date
      dateToSelect = currentDay;
    } else {
      // Going to a different month - always select the last date of that month
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      dateToSelect = daysInMonth;
    }

    // Update all states immediately
    setSelectedMonth(month);
    setSelectedYear(year);
    setSelectedDate(dateToSelect);
    setIsCalendarOpen(false);
    setSelectedEmployeeId(null);

    // Trigger API call to fetch new month's attendance data
    const numericMonth = monthIndex + 1; // getMonth() returns 0-11, so add 1
    const apiParams = { month: numericMonth, year, role };
    dispatch(fetchAllEmployeeAttendanceOneMonth(apiParams));
  }, [dispatch, role]);

  const handleEmployeeRowClick = useCallback((employeeId) => {
    setSelectedEmployeeId((prevId) => {
      const nextId = prevId === employeeId ? null : employeeId;
      if (nextId === null) {
        // Deselecting employee: keep currently selected month/year
        // and set date to today if current month, otherwise last day of that month
        const now = new Date();
        const selectedMonthIndex = new Date(`${selectedMonth} 1, ${selectedYear}`).getMonth();
        const selectedYearNum = parseInt(selectedYear);
        if (
          selectedYearNum === now.getFullYear() &&
          selectedMonthIndex === now.getMonth()
        ) {
          setSelectedDate(now.getDate());
        } else {
          const daysInSelectedMonth = new Date(selectedYearNum, selectedMonthIndex + 1, 0).getDate();
          setSelectedDate(daysInSelectedMonth);
        }
      } else {
        // Selecting an employee: clear specific date so employee month view shows
        setSelectedDate(null);
      }
      return nextId;
    });
  }, [selectedMonth, selectedYear]);

  // Helper to determine if a color is light or dark (for text contrast)
  function isColorLight(hex) {
    if (!hex) return true;
    // Remove # if present
    hex = hex.replace("#", "");
    // Convert 3-digit to 6-digit
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((x) => x + x)
        .join("");
    }
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    // Perceived brightness
    return r * 0.299 + g * 0.587 + b * 0.114 > 186;
  }

  // Memoized values - Use monthlyAttendance from API response instead of employees prop
  const filteredEmployees = useMemo(
    () => {
      // Use monthlyAttendance from API response if available, otherwise fallback to employees prop
      const employeeList = attendance?.monthlyAttendance || employees;
      
      return employeeList
        .filter(
          (employee) => {
            const name = employee.employeeName || employee.name || "";
            const employeeId = employee.employeeId || employee.id || "";
            const department = employee.departmentName || employee.department || "";
            
            return (
              name.toLowerCase().includes(searchInput.toLowerCase()) ||
              employeeId.toLowerCase().includes(searchInput.toLowerCase()) ||
              department.toLowerCase().includes(searchInput.toLowerCase())
            );
          }
        )
        .map(generateAttendanceData);
    },
    [searchInput, attendance, employees, generateAttendanceData]
  );

  // Load existing data when All Employees Date modal opens
  useEffect(() => {
    if (isAllEmployeesDateModalOpen && !selectedDateForAll) {
      // Only set today's date as default when modal opens and no date is selected
      const today = new Date();
      const todayString = today.toISOString().slice(0, 10); // Format as YYYY-MM-DD
      setSelectedDateForAll(todayString);
    }
  }, [isAllEmployeesDateModalOpen, selectedDateForAll]);

  // Synchronize selectedDateForAll with main view when month changes and modal is open
  useEffect(() => {
    if (isAllEmployeesDateModalOpen && selectedDate) {
      // Convert the main view selected date to YYYY-MM-DD format for the modal
      const selectedMonthIndex = new Date(`${selectedMonth} 1, ${selectedYear}`).getMonth();
      const selectedYearNum = parseInt(selectedYear);
      const monthIndex = selectedMonthIndex + 1; // getMonth() returns 0-11, so add 1
      const formattedDate = `${selectedYearNum}-${monthIndex.toString().padStart(2, '0')}-${selectedDate.toString().padStart(2, '0')}`;
      setSelectedDateForAll(formattedDate);
    }
  }, [isAllEmployeesDateModalOpen, selectedDate, selectedMonth, selectedYear]);

  // Populate attendance data when attendance data is fetched for All Employees Date modal
  useEffect(() => {
    if (
      isAllEmployeesDateModalOpen &&
      selectedDateForAll &&
      attendance &&
      attendance.monthlyAttendance
    ) {
      const selectedDate = new Date(selectedDateForAll);
      const selectedDay = selectedDate.getDate();

      const initialData = {};
      filteredEmployees.forEach((employee) => {
        // Check if we have attendance data for this employee and date
        let existingStatus = null;

        const employeeAttendance = attendance.monthlyAttendance.find(
          (attRec) => attRec.employeeId === employee.id
        );

        if (employeeAttendance && employeeAttendance.days) {
          existingStatus =
            employeeAttendance.days[selectedDay.toString()]?.statusCode || null;
        }

        initialData[employee.id] = existingStatus;
      });

      setAllEmployeesAttendanceData(initialData);
      setOriginalAllEmployeesAttendanceData(initialData);
    }
  }, [
    attendance,
    selectedDateForAll,
    isAllEmployeesDateModalOpen,
    filteredEmployees,
  ]);

  const departmentOptions = useMemo(() => {
    const departments = new Set();
    const employeeList = attendance?.monthlyAttendance || employees;
    
    employeeList.forEach((employee) => {
      const department = employee.departmentName || employee.department;
      if (department) {
        departments.add(department);
      }
    });
    return Array.from(departments).map((dept) => ({
      value: dept,
      label: dept,
    }));
  }, [attendance, employees]);

  // Single Employee Month Modal Functions
  const generateMonthDates = useCallback((month, year) => {
    const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const dates = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, monthIndex, i);
      dates.push({
        day: i,
        weekday: date.toLocaleString("default", { weekday: "short" }),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isFuture: date > new Date(),
      });
    }
    return dates;
  }, []);

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployeeForMonth(employee);

    // Reset fetching state to allow the useEffect to handle data fetching
    isFetchingEmployeeDataRef.current = false;
  };

  const setAllDaysStatus = (status) => {
    // Check if payroll is frozen for current month
    if (isPayrollFrozen(getMonthNumber(monthYear.month), parseInt(monthYear.year))) {
      toast.error("Cannot edit attendance. Payroll is frozen.");
      return;
    }
    
    const dates = generateMonthDates(monthYear.month, monthYear.year);
    const newData = {};
    dates.forEach(({ day }) => {
      newData[day] = status;
    });
    setMonthAttendanceData(newData);
  };

  const setDayStatus = (day, status) => {
    // Check if payroll is frozen for current month
    if (isPayrollFrozen(getMonthNumber(monthYear.month), parseInt(monthYear.year))) {
      toast.error("Cannot edit attendance. Payroll is frozen.");
      return;
    }
    
    // Check if this date is outside the editable range
    const dateString = `${monthYear.year}-${String(new Date(`${monthYear.month} 1, ${monthYear.year}`).getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    
    if (!isDateEditable(dateString)) {
      toast.error("Cannot edit dates outside the editable range");
      return;
    }
    
    setMonthAttendanceData((prev) => ({
      ...prev,
      [day]: status,
    }));
  };

  const handleSaveMonthAttendance = () => {
    // Check if payroll is frozen for current month
    if (isPayrollFrozen(getMonthNumber(monthYear.month), parseInt(monthYear.year))) {
      toast.error("Cannot mark attendance. Payroll is frozen.");
      return;
    }
    
    if (!selectedEmployeeForMonth) {
      toast.error("Please select an employee");
      return;
    }

    // Build dateStatusMap for only changed days
    const dateStatusMap = {};
    const monthIndex = new Date(
      `${monthYear.month} 1, ${monthYear.year}`
    ).getMonth();
    
    Object.entries(monthAttendanceData).forEach(([day, status]) => {
      if (status) {
        // Format date without timezone issues
        const date = `${monthYear.year}-${String(monthIndex + 1).padStart(
          2,
          "0"
        )}-${String(parseInt(day)).padStart(2, "0")}`;
        
        // Only include if status has changed from original
        const originalStatus = originalMonthAttendanceData[day];
        if (status !== originalStatus) {
        dateStatusMap[date] = status;
        }
      }
    });

    // Check if there are any changes
    if (Object.keys(dateStatusMap).length === 0) {
      toast.error("No changes detected");
      return;
    }

    // Check if any dates are outside the editable range
    const invalidDates = Object.keys(dateStatusMap).filter(date => !isDateEditable(date));
    if (invalidDates.length > 0) {
      toast.error(`Cannot save changes for dates outside editable range: ${invalidDates.join(', ')}`);
      return;
    }

    const payload = buildManualAttendancePayload(
      selectedEmployeeForMonth.id,
      dateStatusMap
    );

    dispatch(markManualAttendance(payload)).then((result) => {
      if (!result.error) {
        setIsSingleEmployeeModalOpen(false);
        setSelectedEmployeeForMonth(null);
        setMonthAttendanceData({});
        setOriginalMonthAttendanceData({}); // Reset original data after successful save
        // Refresh attendance data
        dispatch(
          fetchAllEmployeeAttendanceOneMonth({
            month: monthIndex + 1,
            year: monthYear.year,
            role,
          })
        );
      }
    });
  };

  // All Employees Date Modal Functions
  const handleDateSelectForAll = (date) => {
    // Ensure we store only the date part (YYYY-MM-DD)
    let dateToStore = date;
    if (date && date.includes("T")) {
      dateToStore = date.split("T")[0];
    }

    setSelectedDateForAll(dateToStore);

    // Clear existing data first - it will be populated when the useEffect fetches new data
    const initialData = {};
    filteredEmployees.forEach((employee) => {
      initialData[employee.id] = null;
    });

    setAllEmployeesAttendanceData(initialData);
    setOriginalAllEmployeesAttendanceData(initialData);
  };

  const setAllEmployeesStatus = (status) => {
    // Check if payroll is frozen for current month
    if (isPayrollFrozen(getMonthNumber(selectedMonth), parseInt(selectedYear))) {
      toast.error("Cannot edit attendance. Payroll is frozen.");
      return;
    }
    
    const newData = {};
    filteredEmployees.forEach((employee) => {
      newData[employee.id] = status;
    });
    setAllEmployeesAttendanceData(newData);
  };

  const setEmployeeStatus = (employeeId, status) => {
    // Check if payroll is frozen for current month
    if (isPayrollFrozen(getMonthNumber(selectedMonth), parseInt(selectedYear))) {
      toast.error("Cannot edit attendance. Payroll is frozen.");
      return;
    }
    
    // Check if the selected date is outside the editable range
    if (selectedDateForAll && !isDateEditable(selectedDateForAll)) {
      toast.error("Cannot edit attendance for dates outside the editable range");
      return;
    }
    
    setAllEmployeesAttendanceData((prev) => ({
      ...prev,
      [employeeId]: status,
    }));
  };

  const handleSaveAllEmployeesAttendance = () => {
    // Check if payroll is frozen for current month
    if (isPayrollFrozen(getMonthNumber(selectedMonth), parseInt(selectedYear))) {
      toast.error("Cannot mark attendance. Payroll is frozen.");
      return;
    }
    
    // Default to today's date if no date is selected
    let dateToUse = selectedDateForAll;
    if (!dateToUse) {
      const today = new Date();
      dateToUse = today.toISOString().slice(0, 10); // Format as YYYY-MM-DD
    }

    // Ensure we only send the date part (YYYY-MM-DD) to the API
    // If dateToUse is a full ISO string, extract just the date part
    if (dateToUse && dateToUse.includes("T")) {
      dateToUse = dateToUse.split("T")[0];
    }

    // Check if selected date is in the future
    const selectedDate = new Date(dateToUse);
    selectedDate.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

    if (selectedDate > today) {
      toast.error("Cannot mark attendance for future dates");
      return;
    }

    // Check if the selected date is outside the editable range
    if (!isDateEditable(dateToUse)) {
      toast.error("Cannot mark attendance for dates outside editable range (current month + previous month only)");
      return;
    }

    // Prepare data in new API format - only changed statuses
    const employeeStatuses = [];

    Object.entries(allEmployeesAttendanceData).forEach(
      ([employeeId, status]) => {
        if (status) {
          // Only include if status has changed from original
          const originalStatus = originalAllEmployeesAttendanceData[employeeId];
          if (status !== originalStatus) {
          employeeStatuses.push({
            employeeId,
            statusCode: status,
          });
          }
        }
      }
    );

    // If no employees are marked or no changes detected, show error
    if (employeeStatuses.length === 0) {
      toast.error("No changes detected. Please mark attendance for at least one employee or make changes to existing attendance.");
      return;
    }

    // Create payload in the new format
    const payload = {
      date: dateToUse,
      employeeStatuses,
    };

    dispatch(markAllEmployeesDateAttendance(payload)).then((result) => {
      if (!result.error) {
        setIsAllEmployeesDateModalOpen(false);
        setAllEmployeesAttendanceData({});
        setOriginalAllEmployeesAttendanceData({}); // Reset original data after successful save
        setAllEmployeesSearch("");
        toast.success("Attendance marked successfully for all employees");
        // Refresh attendance data
        dispatch(
          fetchAllEmployeeAttendanceOneMonth({
            month: new Date(dateToUse).getMonth() + 1,
            year: new Date(dateToUse).getFullYear(),
            role,
          })
        );
      }
    });
  };

  const filteredEmployeesForModal = useMemo(() => {
    return filteredEmployees.filter(
      (employee) =>
        employee.name
          .toLowerCase()
          .includes(allEmployeesSearch.toLowerCase()) ||
        employee.id.toLowerCase().includes(allEmployeesSearch.toLowerCase()) ||
        (employee.department &&
          employee.department
            .toLowerCase()
            .includes(allEmployeesSearch.toLowerCase()))
    );
  }, [filteredEmployees, allEmployeesSearch]);

  const filteredAndSearchedLeaveData = useMemo(() => {
    let data = employees.map(generateLeaveData);

    if (selectedDepartments.length > 0) {
      data = data.filter((leave) =>
        selectedDepartments.includes(leave.department)
      );
    }

    if (searchInput) {
      data = data.filter(
        (leave) =>
          leave.name.toLowerCase().includes(searchInput.toLowerCase()) ||
          leave.id.toLowerCase().includes(searchInput.toLowerCase()) ||
          (leave.department &&
            leave.department.toLowerCase().includes(searchInput.toLowerCase()))
      );
    }

    return data;
  }, [searchInput, selectedDepartments, employees, generateLeaveData]);

  const calculateAttendanceSummary = useCallback(
    (employeesData, dateToSummarize = null) => {
      let totalPresent = 0;
      let totalAbsent = 0;
      let totalHalfDay = 0;
      let totalHoliday = 0;
      let totalHalfDayOnHoliday = 0;
      let totalApprovedLeave = 0;

      const dataForSummary =
        dateToSummarize !== null
          ? employeesData.filter((employee) => {
              const dayIndex = dateToSummarize - 1;
              return (
                employee.attendance &&
                employee.attendance.length > dayIndex &&
                employee.attendance[dayIndex].label !== null
              );
            })
          : employeesData;

      dataForSummary.forEach((employee) => {
        if (dateToSummarize !== null) {
          const dayIndex = dateToSummarize - 1;
          if (employee.attendance && employee.attendance.length > dayIndex) {
            const att = employee.attendance[dayIndex];
            switch (att.label.toUpperCase()) {
              case "P":
                totalPresent++;
                break;
              case "L":
                totalApprovedLeave++;
                break;
              case "A":
                totalAbsent++;
                break;
              case "P/A":
                totalHalfDay++;
                break;
              case "H":
                totalHoliday++;
                break;
              case "P/L":
                totalHalfDayOnHoliday++;
                break;
            }
          }
        } else {
          employee.attendance.forEach((att) => {
            if (att.label !== null && att.label !== "") {
              switch (att.label.toUpperCase()) {
                case "P":
                  totalPresent++;
                  break;
                case "L":
                  totalApprovedLeave++;
                  break;
                case "A":
                  totalAbsent++;
                  break;
                case "P/A":
                  totalHalfDay++;
                  break;
                case "H":
                  totalHoliday++;
                  break;
                case "P/L":
                  totalHalfDayOnHoliday++;
                  break;
              }
            }
          });
        }
      });

      return {
        totalPresent,
        totalAbsent,
        totalHalfDay,
        totalHoliday,
        totalHalfDayOnHoliday,
        totalApprovedLeave,
      };
    },
    []
  );

  const calculateLeaveSummary = useCallback(() => {
    let totalLeavesTaken = 0;
    let totalLeavesEarned = 0;
    let totalNetLeaveBalance = 0;

    filteredAndSearchedLeaveData.forEach((leave) => {
      totalLeavesTaken += parseFloat(leave.leavesTaken);
      totalLeavesEarned += parseFloat(leave.leavesEarned);
      totalNetLeaveBalance += parseFloat(leave.netLeaves);
    });

    return {
      totalLeavesTaken: totalLeavesTaken.toFixed(1),
      totalLeavesEarned: totalLeavesEarned.toFixed(1),
      totalNetLeaveBalance: totalNetLeaveBalance.toFixed(1),
    };
  }, [filteredAndSearchedLeaveData]);

  const currentDay = today.getDate();
  const currentMonthShort = today.toLocaleString("default", { month: "short" });
  const currentYearFull = today.getFullYear().toString();

  const summaryDate =
    selectedDate !== null
      ? selectedDate
      : selectedMonth.slice(0, 3) === currentMonthShort &&
        selectedYear === currentYearFull
      ? currentDay
      : null;

  const summary = useMemo(() => {
    if (selectedEmployeeId) {
      const emp = filteredEmployees.find((e) => e.id === selectedEmployeeId);
      if (!emp) return calculateAttendanceSummary([], null);
      return calculateAttendanceSummary([emp], null);
    } else {
      return calculateAttendanceSummary(filteredEmployees, summaryDate);
    }
  }, [
    filteredEmployees,
    calculateAttendanceSummary,
    summaryDate,
    selectedEmployeeId,
  ]);

  // Handler to open popover from AttendanceTable
  const handleCellClick = (employee, date, status, event) => {
    // Edge case: Check if employee and date are valid
    if (!employee || !employee.id || !date) {
      return;
    }

    // Edge case: Check if event target exists
    if (!event || !event.target) {
      return;
    }

    setCellPopoverEmployee({
      ...employee,
      originalStatus: status // Store the original status for comparison
    });
    setCellPopoverDate(date);
    setCellPopoverStatus(status);
    setCellPopoverOpen(true);
    setPopoverOpenCell(`${employee.id}-${date}`);
    
    // Reset history state when opening new popup
    setIsHistoryExpanded(false);
    
    // Prevent background scrolling when popup is open
    document.body.style.overflow = 'hidden';
    
    // Position popover with viewport-aware positioning
    const cellRect = event.target.getBoundingClientRect();
    const tableContainer = document.getElementById(
      "attendance-table-container"
    );
    let containerRect = { left: 0, top: 0 };
    if (tableContainer) {
      containerRect = tableContainer.getBoundingClientRect();
    }
    
    // Dynamic popover size based on content and viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const minMargin = 24; // Increased margin for better spacing
    
    // Calculate optimal popup size based on viewport
    const maxPopupWidth = Math.min(450, viewportWidth - (minMargin * 2));
    const maxPopupHeight = Math.min(500, viewportHeight - (minMargin * 2));
    
    // Try multiple positioning strategies with dynamic sizing
    let left, top;
    const strategies = [
      // Strategy 1: Center of viewport (most reliable)
      () => ({
        left: (viewportWidth - maxPopupWidth) / 2,
        top: (viewportHeight - maxPopupHeight) / 2
      }),
      // Strategy 2: Above the cell, centered
      () => ({
        left: cellRect.left + (cellRect.width / 2) - (maxPopupWidth / 2),
        top: Math.max(minMargin, cellRect.top - maxPopupHeight - 8)
      }),
      // Strategy 3: Below the cell, centered
      () => ({
        left: cellRect.left + (cellRect.width / 2) - (maxPopupWidth / 2),
        top: Math.min(viewportHeight - maxPopupHeight - minMargin, cellRect.bottom + 8)
      }),
      // Strategy 4: Right of the cell
      () => ({
        left: Math.min(viewportWidth - maxPopupWidth - minMargin, cellRect.right + 8),
        top: cellRect.top + (cellRect.height / 2) - (maxPopupHeight / 2)
      }),
      // Strategy 5: Left of the cell
      () => ({
        left: Math.max(minMargin, cellRect.left - maxPopupWidth - 8),
        top: cellRect.top + (cellRect.height / 2) - (maxPopupHeight / 2)
      })
    ];

    // Try each strategy until we find one that fits
    for (const strategy of strategies) {
      const position = strategy();
      left = position.left;
      top = position.top;
      
      // Check if this position works
      if (left >= minMargin && 
          top >= minMargin && 
          left + maxPopupWidth <= viewportWidth - minMargin && 
          top + maxPopupHeight <= viewportHeight - minMargin) {
        break;
      }
    }
    
    // Final safety check: ensure popup is always within viewport
    left = Math.max(minMargin, Math.min(left, viewportWidth - maxPopupWidth - minMargin));
    top = Math.max(minMargin, Math.min(top, viewportHeight - maxPopupHeight - minMargin));
    
    setCellPopoverPosition({ top, left });
    cellPopoverAnchorRef.current = event.target;
  };

  // Check if a date is editable based on payroll freeze status
  const isDateEditable = (dateString) => {
    if (!dateString) return false;
    
    // If payroll is frozen for current month, no dates are editable
    if (isPayrollFrozen(getMonthNumber(selectedMonth), parseInt(selectedYear))) {
      return false;
    }
    
    const targetDate = new Date(dateString);
    const currentDate = new Date();
    
    // Get current month and year
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11
    
    // Get target month and year
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth(); // 0-11
    
    // When not frozen, allow current month and previous month
    if (targetYear === currentYear) {
      // Same year: allow current month and previous month
      return targetMonth >= currentMonth - 1;
    } else if (targetYear === currentYear - 1) {
      // Previous year: only allow if it's December (previous month)
      return targetMonth === 11 && currentMonth === 0;
    }
    
    return false;
  };

  // Check if the current month is editable (for button disabling)
  const isCurrentMonthEditable = () => {
    // If payroll is frozen for current month, no months are editable
    if (isPayrollFrozen(getMonthNumber(selectedMonth), parseInt(selectedYear))) {
      return false;
    }
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11
    
    // Get selected month and year
    const selectedMonthIndex = new Date(`${selectedMonth} 1, ${selectedYear}`).getMonth();
    const selectedYearNum = parseInt(selectedYear);
    
    // When not frozen, allow current month and previous month
    if (selectedYearNum === currentYear) {
      // Same year: allow current month and previous month
      return selectedMonthIndex >= currentMonth - 1;
    } else if (selectedYearNum === currentYear - 1) {
      // Previous year: only allow if it's December (previous month)
      return selectedMonthIndex === 11 && currentMonth === 0;
    }
    
    return false;
  };

  // Check if the current cell is editable
  const isCurrentCellEditable = () => {
    const statusEditable = EDITABLE_STATUSES.includes(cellPopoverStatus);
    
    // Also check if the date is within editable range
    return statusEditable && isDateEditable(cellPopoverDate);
  };

  // Calculate optimal popup dimensions based on viewport
  const getPopupDimensions = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 48; // Increased margin for better safety
    
    const baseWidth = isHistoryExpanded ? 450 : 350;
    const baseHeight = isHistoryExpanded ? 500 : 300;
    
    return {
      width: Math.min(baseWidth, viewportWidth - margin),
      height: Math.min(baseHeight, viewportHeight - margin),
      maxWidth: Math.min(baseWidth, viewportWidth - margin),
      maxHeight: Math.min(baseHeight, viewportHeight - margin)
    };
  };

  // When closing popover, clear popoverOpenCell
  const closePopover = () => {
    setCellPopoverOpen(false);
    setPopoverOpenCell(null);
    setIsHistoryExpanded(false);
    
    // Restore background scrolling
    document.body.style.overflow = 'auto';
    
    // Clear any potential memory leaks by resetting refs
    if (cellPopoverAnchorRef.current) {
      cellPopoverAnchorRef.current = null;
    }
  };

  const handleViewHistory = () => {
    // Edge case: Check if required data exists
    if (!cellPopoverEmployee || !cellPopoverEmployee.id || !cellPopoverDate) {
      return;
    }
    
    // Edge case: Validate date format (YYYY-MM-DD)
    if (!DATE_REGEX.test(cellPopoverDate)) {
      return;
    }
    
    // Extract date components from cellPopoverDate (format: YYYY-MM-DD)
    const [year, month, day] = cellPopoverDate.split('-');
    
    // Edge case: Validate date components
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    
    if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) {
      return;
    }
    
    const currentYear = getCurrentYear();
    if (yearNum < MIN_YEAR || yearNum > currentYear + MAX_FUTURE_YEARS || monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
      return;
    }
    
    dispatch(fetchEmployeeAttendanceHistory({
      employeeId: cellPopoverEmployee.id,
      year: yearNum,
      month: monthNum,
      day: dayNum
    }));
    
    setIsHistoryExpanded(true);
  };

  // Handler to save status change
  const handleCellPopoverSave = () => {
    // Check if payroll is frozen for current month
    if (isPayrollFrozen(getMonthNumber(selectedMonth), parseInt(selectedYear))) {
      toast.error("Cannot mark attendance. Payroll is frozen.");
      return;
    }
    
    if (!cellPopoverEmployee || !cellPopoverDate) return;
    const employeeId = cellPopoverEmployee.id;
    const date = cellPopoverDate;
    const status = cellPopoverStatus;
    
    // Get the original status for this cell
    const originalStatus = cellPopoverEmployee.originalStatus || null;
    
    // Only send if status has actually changed
    if (status === originalStatus) {
      toast.error("No changes detected");
      return;
    }
    
    // Build dateStatusMap for this single change
    const dateStatusMap = { [date]: status };
    const payload = buildManualAttendancePayload(employeeId, dateStatusMap);
    dispatch(markManualAttendance(payload)).then(() => {
      setCellPopoverOpen(false);
      const monthIndex = new Date(
        `${selectedMonth} 1, ${selectedYear}`
      ).getMonth();
      const numericMonth = monthIndex + 1;
      const year = selectedYear;
      let apiParams = { month: numericMonth, year, role };
      dispatch(fetchAllEmployeeAttendanceOneMonth(apiParams));
    });
  };

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 mt-16" onClick={() => setIsEmployeeDropdownOpen(false)}>
      {/* Header with Search and Title */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-800">
          Attendance Management
        </h1>
      </div>





      {/* Combined Controls Row: action buttons + tabs in one line */}
      {!isSingleEmployeeModalOpen && !isAllEmployeesDateModalOpen && (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          {/* Left: action buttons */}
          <div className="flex items-center gap-4">
            <div className="relative" ref={employeeDropdownRef}>
              <button
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                  isPayrollFrozen(getMonthNumber(selectedMonth), parseInt(selectedYear)) || !isCurrentMonthEditable()
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
                onClick={(e) => {
                  if (isPayrollFrozen(getMonthNumber(selectedMonth), parseInt(selectedYear)) || !isCurrentMonthEditable()) return;
                  e.stopPropagation();
                  setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen);
                }}
                disabled={isPayrollFrozen(getMonthNumber(selectedMonth), parseInt(selectedYear)) || !isCurrentMonthEditable()}
                title={
                  isPayrollFrozen(getMonthNumber(selectedMonth), parseInt(selectedYear))
                    ? "Payroll is frozen"
                    : !isCurrentMonthEditable()
                    ? "Cannot edit attendance for this month - outside editable range"
                    : "Edit attendance for a single employee"
                }
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>Single Employee Month</span>
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isEmployeeDropdownOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-[350px] bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-3 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800">Select Employee</h3>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-3 px-2 py-1.5 bg-gray-50 rounded-md">
                      <Search className="h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search employees..."
                        value={employeeDropdownInput}
                        onChange={(e) => setEmployeeDropdownInput(e.target.value)}
                        className="w-full px-2 py-1 border-none outline-none bg-transparent text-gray-800 text-xs"
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                      {filteredEmployees
                        .filter(
                          (e) =>
                            e.name.toLowerCase().includes(employeeDropdownInput.toLowerCase()) ||
                            e.id.toLowerCase().includes(employeeDropdownInput.toLowerCase()) ||
                            (e.department && e.department.toLowerCase().includes(employeeDropdownInput.toLowerCase()))
                        )
                        .map((employee) => (
                          <button
                            key={employee.id}
                            className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-blue-50 cursor-pointer transition-all border-b border-gray-50 last:border-b-0"
                            onClick={() => {
                              setEmployeeDropdownSearch(employee.id);
                              setIsEmployeeDropdownOpen(false);
                              setSelectedEmployeeForMonth(employee);
                              switchToSingleEmployeeTab();
                              isFetchingEmployeeDataRef.current = false;
                            }}
                          >
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center font-semibold text-white text-xs">
                              {employee.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-800 truncate text-sm">{employee.name}</div>
                              <div className="text-xs text-gray-500 truncate">{employee.id} • {employee.department}</div>
                            </div>
                          </button>
                        ))}
                      {filteredEmployees.filter(
                        (e) =>
                          e.name.toLowerCase().includes(employeeDropdownInput.toLowerCase()) ||
                          e.id.toLowerCase().includes(employeeDropdownInput.toLowerCase()) ||
                          (e.department && e.department.toLowerCase().includes(employeeDropdownInput.toLowerCase()))
                      ).length === 0 && (
                        <div className="text-gray-400 text-center py-4 text-xs">No employees found</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                isPayrollFrozen(getMonthNumber(selectedMonth), parseInt(selectedYear)) || !isCurrentMonthEditable()
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
              onClick={() => {
                if (isPayrollFrozen(getMonthNumber(selectedMonth), parseInt(selectedYear)) || !isCurrentMonthEditable()) return;
                switchToAllEmployeesTab();
              }}
              disabled={isPayrollFrozen(getMonthNumber(selectedMonth), parseInt(selectedYear)) || !isCurrentMonthEditable()}
              title={
                isPayrollFrozen(getMonthNumber(selectedMonth), parseInt(selectedYear))
                  ? "Payroll is frozen"
                  : !isCurrentMonthEditable()
                  ? "Cannot edit attendance for this month - outside editable range"
                  : "Edit attendance for all employees on a specific date"
              }
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-6 0 2 2 0 016 0z" />
              </svg>
              <span>All Employees Date</span>
            </button>
          </div>
          


          {/* Right: tabs */}
          <div className="flex items-center gap-6">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "Attendance Tracker" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-blue-600"
              }`}
              onClick={() => setActiveTab("Attendance Tracker")}
            >
              Attendance Tracker
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "Leave Tracker" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-blue-600"
              }`}
              onClick={() => setActiveTab("Leave Tracker")}
            >
              Leave Tracker
            </button>
          </div>
        </div>
      )}

      {/* Content Area (relative for overlays) */}
      <div className="relative" id="attendance-table-container">
        {isSingleEmployeeModalOpen ? (
          <div className="bg-white rounded-2xl shadow-xl p-4 w-full h-[85vh] flex flex-col border border-gray-100 z-40">
            {/* Modern Header - More Compact */}
            <div className="pb-4 mb-4 border-b border-gray-100">
              {/* Employee Info Row - Top */}
              <div className="flex items-center justify-between mb-4">
                {selectedEmployeeForMonth ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center font-semibold text-white text-xs">
                      {selectedEmployeeForMonth.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-gray-800 text-base">
                      {selectedEmployeeForMonth.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {selectedEmployeeForMonth.id} •{" "}
                      {selectedEmployeeForMonth.department}
                    </span>
                  </div>
                ) : (
                  <div></div> // Empty div to maintain flex layout
                )}

                {/* Back and Close Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={closeAllModals}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Divider between employee info and controls */}
              <div className="border-t border-gray-200 mb-4"></div>

              {/* Controls Row - Only show when employee is selected */}
              {selectedEmployeeForMonth && (
                <div className="flex items-center gap-3 mb-4">
                  {/* Month Selector */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">
                      Month
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs font-medium transition-colors h-[28px]">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span>
                            {monthYear.month} {monthYear.year}
                          </span>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="w-64 p-3 rounded-lg shadow-lg border border-gray-200"
                      >
                        {/* Year Selector */}
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                          <div className="text-sm font-medium text-gray-700">
                            {monthYear.year}
                          </div>
                          <select
                            value={monthYear.year}
                            onChange={(e) => {
                              const newYear = parseInt(e.target.value);
                              const currentYear = new Date().getFullYear();

                              // Check if selected year is in the future
                              if (newYear > currentYear) {
                                toast.error(
                                  "Cannot select future years for attendance"
                                );
                                return;
                              }

                              setMonthYear((prev) => ({
                                ...prev,
                                year: newYear.toString(),
                              }));
                            }}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {(() => {
                              const currentYear = getCurrentYear();
                              const years = [];
                              // Only show current year and past years
                              for (
                                let year = currentYear;
                                year >= MIN_YEAR;
                                year--
                              ) {
                                years.push(year);
                              }
                              return years.map((year) => (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              ));
                            })()}
                          </select>
                        </div>

                        {/* Month Grid */}
                        <div className="grid grid-cols-3 gap-1">
                          {SHORT_MONTH_NAMES.map((month, index) => {
                            const fullMonthName = MONTH_NAMES[index];
                            const isSelected =
                              monthYear.month === fullMonthName;

                            // Check if this month/year combination is editable based on payroll settings
                            const currentDate = new Date();
                            const currentYear = currentDate.getFullYear();
                            const currentMonth = currentDate.getMonth();
                            const currentDay = currentDate.getDate();
                            
                            // Check if payroll is frozen for month selection
                            let isEditableMonth = true;
                            if (isPayrollFrozen(monthYear.month, monthYear.year)) {
                              // If payroll is frozen for this month, no months are editable
                              isEditableMonth = false;
                            } else {
                              // When not frozen, use month range logic
                              if (parseInt(monthYear.year) === currentYear) {
                                if (index === currentMonth) {
                                  // Current month: always editable
                                  isEditableMonth = true;
                                } else if (index === currentMonth - 1) {
                                  // Previous month: editable when not frozen
                                  isEditableMonth = true;
                                } else {
                                  // Other months: not editable
                                  isEditableMonth = false;
                                }
                              } else if (parseInt(monthYear.year) === currentYear - 1) {
                                // Previous year: only allow if it's December and current month is January
                                isEditableMonth = index === 11 && currentMonth === 0;
                              } else {
                                isEditableMonth = false;
                              }
                            }

                            return (
                              <button
                                key={month}
                                onClick={() => {
                                  if (!isEditableMonth) {
                                    toast.error(
                                      "Cannot select month outside editable range"
                                    );
                                    return;
                                  }
                                  setMonthYear((prev) => ({
                                    ...prev,
                                    month: fullMonthName,
                                  }));
                                }}
                                className={`p-2 text-sm rounded-md transition-colors ${
                                  isSelected
                                    ? "bg-blue-100 text-blue-600 font-medium"
                                    : !isEditableMonth
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "hover:bg-gray-100 text-gray-700"
                                }`}
                                disabled={!isEditableMonth}
                                title={
                                  !isEditableMonth
                                    ? "Cannot select month outside editable range"
                                    : ""
                                }
                              >
                                {month}
                              </button>
                            );
                          })}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Mark As Dropdown */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">
                      Mark As
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="px-3 py-1 border border-gray-300 rounded-md text-xs bg-white shadow-sm flex items-center justify-between min-w-[120px] hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors h-[28px]">
                          <span className="flex items-center gap-2 text-gray-700 truncate">
                            {singleEmployeeMarkAsStatus ? (
                              <span
                                className="inline-block w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor: statusOptions.find(
                                    (opt) =>
                                      opt.value === singleEmployeeMarkAsStatus
                                  )?.color,
                                }}
                              ></span>
                            ) : null}
                            {singleEmployeeMarkAsStatus
                              ? statusOptions.find(
                                  (opt) =>
                                    opt.value === singleEmployeeMarkAsStatus
                                )?.label
                              : "Select"}
                          </span>
                          <svg
                            className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="w-[240px] rounded-md shadow-lg border border-gray-200 bg-white"
                      >
                        <DropdownMenuRadioGroup
                          value={singleEmployeeMarkAsStatus}
                          onValueChange={(value) => {
                            setSingleEmployeeMarkAsStatus(value);
                          }}
                        >
                          {dropdownStatusOptions.map((opt) => (
                            <DropdownMenuRadioItem
                              key={opt.value}
                              value={opt.value}
                              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSingleEmployeeMarkAsStatus(opt.value);
                              }}
                            >
                              <span
                                className="inline-block w-3 h-3 rounded-full"
                                style={{ backgroundColor: opt.color }}
                              ></span>
                              {opt.label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Apply To Dropdown */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">
                      Apply To
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="px-3 py-1 border border-gray-300 rounded-md text-xs bg-white shadow-sm flex items-center justify-between min-w-[120px] hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors h-[28px]">
                          <span className="text-gray-700 truncate">
                            {singleEmployeeApplyToScope
                              ? getSingleEmployeeApplyToOptions(
                                  singleEmployeeMarkAsStatus
                                ).find(
                                  (opt) =>
                                    opt.value === singleEmployeeApplyToScope
                                )?.label
                              : "Select"}
                          </span>
                          <svg
                            className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="w-[240px] rounded-md shadow-lg border border-gray-200 bg-white"
                      >
                        <DropdownMenuRadioGroup
                          value={singleEmployeeApplyToScope}
                          onValueChange={setSingleEmployeeApplyToScope}
                        >
                          {getSingleEmployeeApplyToOptions(
                            singleEmployeeMarkAsStatus
                          ).map((opt) => (
                            <DropdownMenuRadioItem
                              key={opt.value}
                              value={opt.value}
                              className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                            >
                              {opt.label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Apply Changes Button */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">
                      &nbsp;
                    </label>
                    <button
                      className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs font-medium transition-colors shadow-sm h-[28px]"
                      onClick={() => {
                        const status = singleEmployeeMarkAsStatus;
                        const scope = singleEmployeeApplyToScope;
                        if (!status || !scope) {
                          toast.error("Please select both status and scope.");
                          return;
                        }
                        const dates = generateMonthDates(
                          monthYear.month,
                          monthYear.year
                        );
                        let daysToApply = [];
                        // Only apply filters to editable statuses: Present, Absent, Half Day, and empty cells
                        const editableStatuses = EDITABLE_STATUSES;
                        
                        if (scope === "all") {
                          daysToApply = dates
                            .filter((d) => {
                              const currentStatus = monthAttendanceData[d.day];
                              return editableStatuses.includes(currentStatus) && currentStatus !== "NA";
                            })
                            .map((d) => d.day);
                        } else if (scope === "except_holiday") {
                          daysToApply = dates
                            .filter(
                              (d) => {
                                const currentStatus = monthAttendanceData[d.day];
                                return editableStatuses.includes(currentStatus) && 
                                       currentStatus !== "H" && 
                                       currentStatus !== "NA";
                              }
                            )
                            .map((d) => d.day);
                        } else if (scope === "unmarked") {
                          daysToApply = dates
                            .filter(
                              (d) => {
                                const currentStatus = monthAttendanceData[d.day];
                                return editableStatuses.includes(currentStatus) && 
                                       !currentStatus && 
                                       currentStatus !== "NA" &&
                                       !d.isFuture;
                              }
                            )
                            .map((d) => d.day);
                        } else if (scope === "working") {
                          // Get employee's weekly off days from API response
                          const employeeWeeklyOffDays =
                            selectedEmployeeForMonth?.weeklyOffDays || [];

                          // Create mapping from full day names to abbreviated day names
                          const dayNameMapping = {
                            Monday: WEEKDAY_NAMES[1],
                            Tuesday: WEEKDAY_NAMES[2],
                            Wednesday: WEEKDAY_NAMES[3],
                            Thursday: WEEKDAY_NAMES[4],
                            Friday: WEEKDAY_NAMES[5],
                            Saturday: WEEKDAY_NAMES[6],
                            Sunday: WEEKDAY_NAMES[0],
                          };

                          daysToApply = dates
                            .filter((d) => {
                              const currentStatus = monthAttendanceData[d.day];
                              // Check if this day is not a weekly off day for this employee
                                                                const isWeeklyOffDay = employeeWeeklyOffDays.some(
                                (offDay) => {
                                  const mappedDay = dayNameMapping[offDay];
                                  return mappedDay === d.weekday;
                                }
                              );
                              return (
                                editableStatuses.includes(currentStatus) &&
                                !isWeeklyOffDay &&
                                !d.isFuture &&
                                currentStatus !== "NA"
                              );
                            })
                            .map((d) => d.day);
                        } else if (scope === "weekends") {
                          daysToApply = dates
                            .filter(
                              (d) => {
                                const currentStatus = monthAttendanceData[d.day];
                                return (d.weekday === "Sun" || d.weekday === "Sat") &&
                                       editableStatuses.includes(currentStatus) &&
                                       currentStatus !== "NA";
                              }
                            )
                            .map((d) => d.day);
                        } else if (scope === "holidays") {
                          // Get employee's weekly off days from API response
                          const employeeWeeklyOffDays =
                            selectedEmployeeForMonth?.weeklyOffDays || [];

                          // Create mapping from full day names to abbreviated day names
                          const dayNameMapping = {
                            Monday: WEEKDAY_NAMES[1],
                            Tuesday: WEEKDAY_NAMES[2],
                            Wednesday: WEEKDAY_NAMES[3],
                            Thursday: WEEKDAY_NAMES[4],
                            Friday: WEEKDAY_NAMES[5],
                            Saturday: WEEKDAY_NAMES[6],
                            Sunday: WEEKDAY_NAMES[0],
                          };

                          daysToApply = dates
                            .filter((d) => {
                              const currentStatus = monthAttendanceData[d.day];
                              // Check if this day is a weekly off day for this employee
                              const isWeeklyOffDay = employeeWeeklyOffDays.some(
                                (offDay) => {
                                  const mappedDay = dayNameMapping[offDay];
                                  return mappedDay === d.weekday;
                                }
                              );

                              // Check if it's already marked as holiday in attendance data
                              const isMarkedHoliday =
                                monthAttendanceData[d.day] === "H";

                              // Include if it's a weekly off or marked holiday, but only if it's editable
                              return (
                                editableStatuses.includes(currentStatus) &&
                                (isWeeklyOffDay || isMarkedHoliday) &&
                                currentStatus !== "NA"
                              );
                            })
                            .map((d) => d.day);
                        }
                        const newData = { ...monthAttendanceData };
                        daysToApply.forEach((day) => {
                          newData[day] = status;
                        });
                        setMonthAttendanceData(newData);
                      }}
                    >
                      Apply Changes
                    </button>
                  </div>

                  {/* Cancel Changes Button - Only visible when filters are applied */}
                  {hasSingleEmployeeChanges() && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-600">
                        &nbsp;
                      </label>
                      <button
                        onClick={() => {
                          // Undo changes by resetting to original data
                          setMonthAttendanceData({...originalMonthAttendanceData});
                        }}
                        className="px-4 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-xs font-medium transition-colors shadow-sm h-[28px]"
                      >
                        Cancel Changes
                      </button>
                    </div>
                  )}

                  {/* Finalize Changes Button */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">
                      &nbsp;
                    </label>
                    <button
                      onClick={handleSaveMonthAttendance}
                      disabled={
                        manualAttendanceLoading || !hasSingleEmployeeChanges()
                      }
                      className="px-4 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs font-medium transition-colors shadow-sm h-[28px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {manualAttendanceLoading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-1 h-3 w-3 text-white inline"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        "Finalize Changes"
                      )}
                    </button>
                  </div>


                </div>
              )}
            </div>

            {/* Show calendar directly since employee is already selected */}
            <div className="animate-fade-in-up space-y-3 flex-1 overflow-y-auto custom-scrollbar">
              {/* Compact Calendar Grid */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <h4 className="font-semibold text-gray-800 text-sm mb-2">
                  Mark Attendance for {monthYear.month} {monthYear.year}
                </h4>
                <div className="grid grid-cols-7 gap-2">
                  {/* Day Headers */}
                  {WEEKDAY_NAMES.map(
                    (day) => (
                      <div
                        key={day}
                        className="text-center text-sm font-semibold text-gray-600 py-2"
                      >
                        {day}
                      </div>
                    )
                  )}
                  {/* Calendar Days */}
                  {(() => {
                    const dates = generateMonthDates(
                      monthYear.month,
                      monthYear.year
                    );
                    const firstDate = new Date(
                      `${monthYear.year}-${String(
                        new Date(
                          `${monthYear.month} 1, ${monthYear.year}`
                        ).getMonth() + 1
                      ).padStart(2, "0")}-01`
                    );
                    const firstDayOfWeek = firstDate.getDay();
                    const daysInMonth = dates.length;
                    const totalCells =
                      Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;
                    const cells = [];
                    let dateIdx = 0;
                    for (let i = 0; i < totalCells; i++) {
                      if (i < firstDayOfWeek || dateIdx >= daysInMonth) {
                        // Blank cell
                        cells.push(
                          <div
                            key={`empty-${i}`}
                            className="p-4 min-h-[60px] bg-white border border-gray-200 rounded"
                          />
                        );
                      } else {
                        const { day, isWeekend, isFuture, weekday } =
                          dates[dateIdx];
                        // Use selectedEmployeeForMonth.weeklyOffDays (array of weekday names) for week offs
                        const weeklyOffDays =
                          selectedEmployeeForMonth?.weeklyOffDays || [];

                        // Create mapping from full day names to abbreviated day names
                        const dayNameMapping = {
                          Monday: WEEKDAY_NAMES[1],
                          Tuesday: WEEKDAY_NAMES[2],
                          Wednesday: WEEKDAY_NAMES[3],
                          Thursday: WEEKDAY_NAMES[4],
                          Friday: WEEKDAY_NAMES[5],
                          Saturday: WEEKDAY_NAMES[6],
                          Sunday: WEEKDAY_NAMES[0],
                        };

                        const isWeekOff = weeklyOffDays.some((offDay) => {
                          const mappedDay = dayNameMapping[offDay];
                          return mappedDay === weekday;
                        });

                        // Get existing attendance data for this day
                        let value = monthAttendanceData[day] || null;

                        // If no existing data and it's a week off, set to Holiday
                        if (!value && isWeekOff) {
                          value =
                            statusOptions.find((opt) => opt.value === "H")
                              ?.value || null;
                        }

                        // If value changed for week off, update state (only on first render for that day)
                        if (isWeekOff && !monthAttendanceData[day]) {
                          setTimeout(() => setDayStatus(day, value), 0);
                        }
                        cells.push(
                          <div
                            key={day}
                            className={`flex flex-col items-center justify-center p-2 border rounded min-h-[60px] transition-all ${
                              isFuture
                                ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100"
                                : isWeekOff
                                ? "bg-blue-50 border-blue-200 hover:border-blue-300"
                                : "bg-white border-gray-200 hover:border-blue-400 hover:shadow-sm"
                            }`}
                          >
                            <div className="font-bold text-gray-800 text-base mb-2">
                              {day}
                            </div>
                            {!isFuture && value !== "NA" && (() => {
                              // Check if this cell has read-only statuses (from backend)
                              // Only Present, Absent, Half Day, and empty cells can be edited
                              const isReadOnlyStatus = value && !EDITABLE_STATUSES.includes(value);
                              
                              // Check if this date is outside the editable range
                              const dateString = `${monthYear.year}-${String(new Date(`${monthYear.month} 1, ${monthYear.year}`).getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                              const isDateOutsideRange = !isDateEditable(dateString);
                              
                              if (isReadOnlyStatus || isDateOutsideRange) {
                                // Render read-only cell (like NA but with original color)
                                const selected = statusOptions.find((opt) => opt.value === value);
                                const bgColor = selected ? selected.color : "#fff";
                                return (
                                  <div 
                                    className="w-full flex items-center justify-between px-2 py-2 border border-gray-300 rounded-md text-sm shadow-sm cursor-not-allowed opacity-75"
                                    style={{ backgroundColor: bgColor }}
                                    title={isDateOutsideRange ? "Date outside editable range" : "Read only"}
                                  >
                                    <span className="flex items-center gap-2">
                                      {selected ? (
                                        <span
                                          className="inline-block w-3 h-3 rounded-full"
                                          style={{
                                            backgroundColor: selected.color,
                                          }}
                                        ></span>
                                      ) : (
                                        <span className="text-gray-400 text-xs">
                                          □
                                        </span>
                                      )}
                                      <span>
                                        {selected ? selected.label : "Empty"}
                                      </span>
                                    </span>
                                  </div>
                                );
                              }
                              
                              return (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  {(() => {
                                    const selected = statusOptions.find(
                                      (opt) => opt.value === value
                                    );
                                    const bgColor = selected
                                      ? selected.color
                                      : "#fff";
                                    return (
                                      <button
                                        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                        style={{ backgroundColor: bgColor }}
                                      >
                                        <span className="flex items-center gap-2">
                                          {selected ? (
                                            <span
                                              className="inline-block w-3 h-3 rounded-full"
                                              style={{
                                                backgroundColor: selected.color,
                                              }}
                                            ></span>
                                          ) : (
                                            <span className="text-gray-400 text-xs">
                                              □
                                            </span>
                                          )}
                                          <span>
                                            {selected
                                              ? selected.label
                                              : "Empty"}
                                          </span>
                                        </span>
                                        <svg
                                          className={`w-4 h-4 ml-2 flex-shrink-0 ${
                                            isColorLight(bgColor)
                                              ? "text-gray-600"
                                              : "text-white"
                                          }`}
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                          />
                                        </svg>
                                      </button>
                                    );
                                  })()}
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  side="top"
                                  className="w-[280px] rounded-md shadow-lg border border-gray-200 bg-white max-h-64 overflow-y-auto"
                                >
                                  <DropdownMenuRadioGroup
                                    value={value || ""}
                                    onValueChange={(val) => {
                                      setDayStatus(day, val || null);
                                    }}
                                  >
                                    <DropdownMenuRadioItem
                                      value=""
                                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer text-gray-400"
                                    >
                                      Empty
                                    </DropdownMenuRadioItem>
                                    {dropdownStatusOptions
                                      .filter((opt) => opt.value !== "NA")
                                      .map((opt) => (
                                        <DropdownMenuRadioItem
                                          key={opt.value}
                                          value={opt.value}
                                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDayStatus(day, opt.value);
                                          }}
                                        >
                                          <span
                                            className="inline-block w-3 h-3 rounded-full"
                                            style={{
                                              backgroundColor: opt.color,
                                            }}
                                          ></span>
                                          {opt.label}
                                        </DropdownMenuRadioItem>
                                      ))}
                                  </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              );
                            })()}
                            {!isFuture && value === "NA" && (
                              <div className="w-full flex items-center justify-between px-2 py-2 border border-gray-300 rounded-md text-sm shadow-sm bg-gray-50 text-gray-900 cursor-not-allowed opacity-75">
                                <span className="flex items-center gap-2">
                                  <span className="text-gray-900 font-medium">
                                    NA
                                  </span>
                                  <span>Not Applicable</span>
                                </span>
                              </div>
                            )}
                          </div>
                        );
                        dateIdx++;
                      }
                    }
                    return cells;
                  })()}
                </div>
              </div>

              {/* Compact Footer */}

            </div>
          </div>
        ) : activeTab === "Attendance Tracker" ? (
          <AttendanceTable
            dates={dates}
            statusOptions={statusOptions}
            selectedStatuses={selectedStatuses}
            isStatusFilterOpen={isStatusFilterOpen}
            toggleStatus={toggleStatus}
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            selectedDate={selectedDate}
            handleDateClick={handleDateClick}
            filteredEmployees={filteredEmployees}
            getAttendanceColor={getAttendanceColor}
            attendance={attendance}
            summaryDate={summaryDate}
            summary={summary}
            selectedEmployeeId={selectedEmployeeId}
            handleEmployeeRowClick={handleEmployeeRowClick}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            statusFilterRef={statusFilterRef}
            setIsStatusFilterOpen={setIsStatusFilterOpen}
            onCellClick={(employee, date, status, event) =>
              handleCellClick(employee, date, status, event)
            }
            setSelectedStatuses={setSelectedStatuses}
            popoverOpenCell={popoverOpenCell}
            // Calendar props
            isCalendarOpen={isCalendarOpen}
            toggleCalendar={toggleCalendar}
            calendarRef={calendarRef}
            handleMonthSelection={handleMonthSelection}
            isSingleEmployeeModalOpen={isSingleEmployeeModalOpen}
            isDateEditable={isDateEditable}
            isCurrentMonthEditable={isCurrentMonthEditable()}
          />
        ) : (
          <LeaveTable
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            departmentOptions={departmentOptions}
            selectedDepartments={selectedDepartments}
            isDepartmentFilterOpen={isDepartmentFilterOpen}
            toggleDepartment={toggleDepartment}
            filteredAndSearchedLeaveData={filteredAndSearchedLeaveData}
            calculateLeaveSummary={calculateLeaveSummary}
            selectedEmployeeId={selectedEmployeeId}
            setSelectedEmployeeId={setSelectedEmployeeId}
            departmentFilterRef={departmentFilterRef}
            setIsDepartmentFilterOpen={setIsDepartmentFilterOpen}
            setSelectedDepartments={setSelectedDepartments}
          />
        )}

        {/* All Employees Date Playcard - moved here! */}
        {isAllEmployeesDateModalOpen && (
          <div className="absolute inset-0 flex flex-col w-full h-[85vh] bg-white rounded-2xl shadow-xl border border-gray-100 animate-fade-in-up z-40">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              {/* Title */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center font-semibold text-white text-xs">
                  A
                </div>
                <span className="font-semibold text-gray-800 text-base">
                  All Employees Date
                </span>
              </div>

              {/* Close Button */}
              <button
                onClick={closeAllModals}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Controls Section */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-100">
              {/* Date Selector */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">
                  Date
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs font-medium transition-colors h-[28px]">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>
                        {selectedDateForAll
                          ? new Date(selectedDateForAll).toLocaleDateString()
                          : "Select Date"}
                      </span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-64 p-3 rounded-lg shadow-lg border border-gray-200"
                  >
                    {/* Year Selector */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                      <div className="text-sm font-medium text-gray-700">
                        {selectedDateForAll
                          ? new Date(selectedDateForAll).getFullYear()
                          : new Date().getFullYear()}
                      </div>
                      <select
                        value={
                          selectedDateForAll
                            ? new Date(selectedDateForAll).getFullYear()
                            : new Date().getFullYear()
                        }
                        onChange={(e) => {
                          const newYear = parseInt(e.target.value);
                          const currentYear = new Date().getFullYear();

                          // Check if selected year is in the future
                          if (newYear > currentYear) {
                            toast.error(
                              "Cannot select future years for attendance"
                            );
                            return;
                          }

                          const currentDate = selectedDateForAll
                            ? new Date(selectedDateForAll)
                            : new Date();

                          // Get the current day, but ensure it's valid for the new year/month
                          let currentDay = currentDate.getDate();
                          const currentMonth = currentDate.getMonth();

                          // Check if the current day exists in the new year/month combination
                          const daysInNewMonth = new Date(
                            newYear,
                            currentMonth + 1,
                            0
                          ).getDate();
                          if (currentDay > daysInNewMonth) {
                            // If the current day doesn't exist in the new month, use the last day of that month
                            currentDay = daysInNewMonth;
                          }

                          const newDate = new Date(
                            newYear,
                            currentMonth,
                            currentDay
                          );

                          // Format date without timezone issues
                          const formattedDate = `${newYear}-${String(
                            newDate.getMonth() + 1
                          ).padStart(2, "0")}-${String(
                            newDate.getDate()
                          ).padStart(2, "0")}`;
                          handleDateSelectForAll(formattedDate);
                        }}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {(() => {
                          const currentYear = getCurrentYear();
                          const years = [];
                          // Only show current year and past years
                          for (let year = currentYear; year >= MIN_YEAR; year--) {
                            years.push(year);
                          }
                          return years.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ));
                        })()}
                      </select>
                    </div>

                    {/* Month Grid */}
                    <div className="grid grid-cols-3 gap-1">
                                              {SHORT_MONTH_NAMES.map((month, index) => {
                        const isSelected =
                          selectedDateForAll &&
                          new Date(selectedDateForAll).getMonth() === index;

                        // Check if this month/year combination is editable based on payroll settings
                        const currentDate = new Date();
                        const currentYear = currentDate.getFullYear();
                        const currentMonth = currentDate.getMonth();
                        const currentDay = currentDate.getDate();
                        const selectedYear = selectedDateForAll
                          ? new Date(selectedDateForAll).getFullYear()
                          : currentYear;
                        
                        // Check if payroll is frozen for month selection
                        let isEditableMonth = true;
                        if (isPayrollFrozen(getMonthNumber(selectedMonth), parseInt(selectedYear))) {
                          // If payroll is frozen for this month, no months are editable
                          isEditableMonth = false;
                        } else {
                          // When not frozen, use month range logic
                          if (selectedYear === currentYear) {
                            if (index === currentMonth) {
                              // Current month: always editable
                              isEditableMonth = true;
                            } else if (index === currentMonth - 1) {
                              // Previous month: editable when not frozen
                              isEditableMonth = true;
                            } else {
                              // Other months: not editable
                              isEditableMonth = false;
                            }
                          } else if (selectedYear === currentYear - 1) {
                            // Previous year: only allow if it's December and current month is January
                            isEditableMonth = index === 11 && currentMonth === 0;
                          } else {
                            isEditableMonth = false;
                          }
                        }

                        return (
                          <button
                            key={month}
                            onClick={() => {
                              if (!isEditableMonth) {
                                toast.error(
                                  "Cannot select month outside editable range"
                                );
                                return;
                              }
                              const currentDate = selectedDateForAll
                                ? new Date(selectedDateForAll)
                                : new Date();

                              // Get the current day, but ensure it's valid for the new month
                              let currentDay = currentDate.getDate();
                              const currentYear = currentDate.getFullYear();

                              // Check if the current day exists in the new month
                              const daysInNewMonth = new Date(
                                currentYear,
                                index + 1,
                                0
                              ).getDate();
                              if (currentDay > daysInNewMonth) {
                                // If the current day doesn't exist in the new month, use the last day of that month
                                currentDay = daysInNewMonth;
                              }

                              const newDate = new Date(
                                currentYear,
                                index,
                                currentDay
                              );

                              // Format date without timezone issues
                              const formattedDate = `${newDate.getFullYear()}-${String(
                                newDate.getMonth() + 1
                              ).padStart(2, "0")}-${String(
                                newDate.getDate()
                              ).padStart(2, "0")}`;

                              handleDateSelectForAll(formattedDate);
                            }}
                            className={`p-2 text-sm rounded-md transition-colors ${
                              isSelected
                                ? "bg-blue-100 text-blue-600 font-medium"
                                : !isEditableMonth
                                ? "text-gray-300 cursor-not-allowed"
                                : "hover:bg-gray-100 text-gray-700"
                            }`}
                            disabled={!isEditableMonth}
                            title={
                              !isEditableMonth ? "Cannot select month outside editable range" : ""
                            }
                          >
                            {month}
                          </button>
                        );
                      })}
                    </div>

                    {/* Day Selector */}
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Day
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {(() => {
                          const currentDate = selectedDateForAll
                            ? new Date(selectedDateForAll)
                            : new Date();
                          const year = currentDate.getFullYear();
                          const month = currentDate.getMonth();
                          const daysInMonth = new Date(
                            year,
                            month + 1,
                            0
                          ).getDate();
                          const days = [];

                          for (let day = 1; day <= daysInMonth; day++) {
                            const isSelected =
                              selectedDateForAll &&
                              new Date(selectedDateForAll).getDate() === day;

                            // Check if this date is in the future
                            const currentDate = new Date();
                            currentDate.setHours(0, 0, 0, 0); // Reset time to start of day
                            const buttonDate = new Date(year, month, day);
                            buttonDate.setHours(0, 0, 0, 0); // Reset time to start of day
                            const isFutureDate = buttonDate > currentDate;

                            days.push(
                              <button
                                key={day}
                                onClick={() => {
                                  if (isFutureDate) {
                                    toast.error(
                                      "Cannot select future dates for attendance"
                                    );
                                    return;
                                  }
                                  const newDate = new Date(year, month, day);
                                  // Format date without timezone issues
                                  const formattedDate = `${year}-${String(
                                    month + 1
                                  ).padStart(2, "0")}-${String(day).padStart(
                                    2,
                                    "0"
                                  )}`;
                                  handleDateSelectForAll(formattedDate);
                                }}
                                className={`p-1 text-xs rounded transition-colors ${
                                  isSelected
                                    ? "bg-blue-100 text-blue-600 font-medium"
                                    : isFutureDate
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "hover:bg-gray-100 text-gray-700"
                                }`}
                                disabled={isFutureDate}
                                title={
                                  isFutureDate
                                    ? "Cannot select future dates"
                                    : ""
                                }
                              >
                                {day}
                              </button>
                            );
                          }
                          return days;
                        })()}
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {/* Mark As Dropdown */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">
                  Mark As
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="px-3 py-1 border border-gray-300 rounded-md text-xs bg-white shadow-sm flex items-center justify-between min-w-[120px] hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors h-[28px]">
                      <span className="flex items-center gap-2 text-gray-700 truncate">
                        {allEmployeesMarkAsStatus ? (
                          <span
                            className="inline-block w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: statusOptions.find(
                                (opt) => opt.value === allEmployeesMarkAsStatus
                              )?.color,
                            }}
                          ></span>
                        ) : null}
                        {allEmployeesMarkAsStatus
                          ? statusOptions.find(
                              (opt) => opt.value === allEmployeesMarkAsStatus
                            )?.label
                          : "Select"}
                      </span>
                      <svg
                        className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[240px] rounded-md shadow-lg border border-gray-200 bg-white"
                  >
                    <DropdownMenuRadioGroup
                      value={allEmployeesMarkAsStatus}
                      onValueChange={(value) => {
                        setAllEmployeesMarkAsStatus(value);
                      }}
                    >
                      {dropdownStatusOptions.map((opt) => (
                        <DropdownMenuRadioItem
                          key={opt.value}
                          value={opt.value}
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAllEmployeesMarkAsStatus(opt.value);
                          }}
                        >
                          <span
                            className="inline-block w-3 h-3 rounded-full"
                            style={{ backgroundColor: opt.color }}
                          ></span>
                          {opt.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Apply Changes Button */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">
                  &nbsp;
                </label>
                <button
                  className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs font-medium transition-colors shadow-sm h-[28px]"
                  onClick={() => {
                    const status = allEmployeesMarkAsStatus;

                    if (!status) {
                      toast.error("Please select a status.");
                      return;
                    }

                    // Apply the selected status to all employees except those with read-only statuses
                    const editableStatuses = EDITABLE_STATUSES;
                    const newData = { ...allEmployeesAttendanceData };
                    filteredEmployeesForModal.forEach((employee) => {
                      const currentStatus =
                        allEmployeesAttendanceData[employee.id];
                      // Only apply if the current status is editable (not read-only)
                      if (editableStatuses.includes(currentStatus)) {
                        newData[employee.id] = status;
                      }
                    });

                    setAllEmployeesAttendanceData(newData);
                    toast.success(
                      `Applied ${
                        statusOptions.find((opt) => opt.value === status)?.label
                      } to all employees`
                    );
                  }}
                >
                  Apply Changes
                </button>
              </div>

              {/* Cancel Changes Button - Only visible when filters are applied */}
              {hasAllEmployeesChanges() && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">
                    &nbsp;
                  </label>
                  <button
                    onClick={() => {
                      // Undo changes by resetting to original data
                      setAllEmployeesAttendanceData({...originalAllEmployeesAttendanceData});
                    }}
                    className="px-4 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-xs font-medium transition-colors shadow-sm h-[28px]"
                  >
                    Cancel Changes
                  </button>
                </div>
              )}

              {/* Finalize Changes Button */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">
                  &nbsp;
                </label>
                <button
                  onClick={handleSaveAllEmployeesAttendance}
                  disabled={
                    manualAttendanceLoading || !hasAllEmployeesChanges()
                  }
                  className="px-4 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs font-medium transition-colors shadow-sm h-[28px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {manualAttendanceLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-1 h-3 w-3 text-white inline"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    "Finalize Changes"
                  )}
                </button>
              </div>


            </div>

            {/* Employee List and Attendance Grid */}
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              {/* Search Bar */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={allEmployeesSearch}
                  onChange={(e) => setAllEmployeesSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Employee Attendance Grid */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-white border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white z-10 shadow-sm">
                    <tr className="border-b border-gray-200">
                      <th className="py-2 px-2 text-left font-semibold text-gray-700 bg-white">
                        Employee
                      </th>
                      <th className="py-2 px-2 text-left font-semibold text-gray-700 bg-white">
                        Department
                      </th>
                      <th className="py-2 px-2 text-left font-semibold text-gray-700 bg-white">
                        Attendance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="p-3">
                    {filteredEmployeesForModal.map((employee) => (
                      <tr
                        key={employee.id}
                        className="border-b border-gray-100"
                      >
                        <td className="py-2 px-2 flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center font-semibold text-white text-xs">
                            {employee.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 truncate text-sm">
                              {employee.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {employee.id}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-xs text-gray-600">
                          {employee.department}
                        </td>
                        <td className="py-2 px-2">
                          {(() => {
                            const value =
                              allEmployeesAttendanceData[employee.id] || null;
                            const isNaStatus = value === "NA";

                            // Check if this cell has read-only statuses (from backend)
                            // Only Present, Absent, Half Day, and empty cells can be edited
                            const isReadOnlyStatus = value && !EDITABLE_STATUSES.includes(value);
                            
                            if (isNaStatus || isReadOnlyStatus) {
                              // Render read-only cell (like NA but with original color for non-NA statuses)
                              const selected = statusOptions.find((opt) => opt.value === value);
                              const bgColor = selected ? selected.color : "#f3f4f6";
                              const displayText = isNaStatus ? "NA" : (selected ? selected.label : "Empty");
                              const subText = isNaStatus ? "Not Applicable" : "";
                              
                              return (
                                <div 
                                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm cursor-not-allowed opacity-75"
                                  style={{ backgroundColor: bgColor }}
                                  title="Read only"
                                >
                                  <span className="flex items-center gap-2">
                                    {selected ? (
                                      <span
                                        className="inline-block w-3 h-3 rounded-full"
                                        style={{
                                          backgroundColor: selected.color,
                                        }}
                                      ></span>
                                    ) : (
                                      <span className="text-gray-400 text-xs">
                                        □
                                      </span>
                                    )}
                                    <span className="font-medium">
                                      {displayText}
                                    </span>
                                    {subText && <span>{subText}</span>}
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  {(() => {
                                    const selected = statusOptions.find(
                                      (opt) => opt.value === value
                                    );
                                    const bgColor = selected
                                      ? selected.color
                                      : "#fff";
                                    return (
                                      <button
                                        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                        style={{ backgroundColor: bgColor }}
                                      >
                                        <span className="flex items-center gap-2">
                                          {selected ? (
                                            <span
                                              className="inline-block w-3 h-3 rounded-full"
                                              style={{
                                                backgroundColor: selected.color,
                                              }}
                                            ></span>
                                          ) : (
                                            <span className="text-gray-400 text-xs">
                                              □
                                            </span>
                                          )}
                                          <span>
                                            {selected
                                              ? selected.label
                                              : "Empty"}
                                          </span>
                                        </span>
                                        <svg
                                          className={`w-4 h-4 ml-2 flex-shrink-0 ${
                                            isColorLight(bgColor)
                                              ? "text-gray-600"
                                              : "text-white"
                                          }`}
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                          />
                                        </svg>
                                      </button>
                                    );
                                  })()}
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  side="top"
                                  className="w-[280px] rounded-md shadow-lg border border-gray-200 bg-white max-h-64 overflow-y-auto"
                                >
                                  <DropdownMenuRadioGroup
                                    value={
                                      allEmployeesAttendanceData[employee.id] ||
                                      ""
                                    }
                                    onValueChange={(val) => {
                                      setEmployeeStatus(
                                        employee.id,
                                        val || null
                                      );
                                    }}
                                  >
                                    <DropdownMenuRadioItem
                                      value=""
                                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer text-gray-400"
                                    >
                                      Empty
                                    </DropdownMenuRadioItem>
                                    {dropdownStatusOptions
                                      .filter((opt) => opt.value !== "NA")
                                      .map((opt) => (
                                        <DropdownMenuRadioItem
                                          key={opt.value}
                                          value={opt.value}
                                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEmployeeStatus(
                                              employee.id,
                                              opt.value
                                            );
                                          }}
                                        >
                                          <span
                                            className="inline-block w-3 h-3 rounded-full"
                                            style={{
                                              backgroundColor: opt.color,
                                            }}
                                          ></span>
                                          {opt.label}
                                        </DropdownMenuRadioItem>
                                      ))}
                                  </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
        {/* Attendance Cell Popover */}
        {cellPopoverOpen && cellPopoverEmployee && cellPopoverEmployee.id && cellPopoverDate && (
          <div
            data-cell-popover
            style={{
              position: "fixed",
              top: cellPopoverPosition.top,
              left: cellPopoverPosition.left,
              zIndex: 9999,
              width: getPopupDimensions().width,
              minWidth: getPopupDimensions().width * 0.9,
              maxWidth: getPopupDimensions().maxWidth,
              maxHeight: getPopupDimensions().maxHeight,
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex flex-col items-center"
          >
                        {!isHistoryExpanded ? (
              <>
            <div className="text-sm font-bold text-gray-800 mb-1">
                   {cellPopoverEmployee.name || "Unknown Employee"} ({cellPopoverEmployee.id})
            </div>
            <div className="text-sm font-bold text-gray-700 mb-2">
                   {cellPopoverDate || "Invalid Date"}
            </div>
                 


            {/* Current Status */}
                 <div className="flex items-center gap-2 mb-3">
              {cellPopoverStatus ? (
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: statusOptions.find(
                      (opt) => opt.value === cellPopoverStatus
                    )?.color,
                  }}
                ></span>
              ) : null}
              <span className="text-sm font-medium text-gray-800">
                {cellPopoverStatus
                  ? statusOptions.find((opt) => opt.value === cellPopoverStatus)
                          ?.label || `Unknown Status (${cellPopoverStatus})`
                  : "No attendance marked"}
              </span>
            </div>

                                 {/* Change to Dropdown - Only show if cell is editable */}
                 {isCurrentCellEditable() ? (
                   <div className="w-full mb-3">
              <label className="block text-xs text-gray-500 mb-1">
                Change to:
              </label>
              <select
                value={cellPopoverStatus}
                onChange={(e) => setCellPopoverStatus(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white shadow-sm hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="">Select status...</option>
                {dropdownStatusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
                  </div>
                                                 ) : (
                  <div className="w-full mb-3">
                    <div className="text-xs text-gray-500 mb-1">
                      Status: <span className="text-gray-700 font-medium">
                        {cellPopoverStatus 
                          ? statusOptions.find((opt) => opt.value === cellPopoverStatus)?.label || `Unknown Status (${cellPopoverStatus})`
                          : "No attendance marked"
                        }
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      {!isDateEditable(cellPopoverDate) 
                        ? "Cannot edit. Click 'View History' to see details."
                        : "This attendance record cannot be modified. Click 'View History' to see details."
                      }
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* History View Header */}
                <div className="text-sm font-bold text-gray-800 mb-1">
                  {cellPopoverEmployee.name || "Unknown Employee"} ({cellPopoverEmployee.id})
                </div>
                <div className="text-sm font-bold text-gray-700 mb-2">
                  {cellPopoverDate || "Invalid Date"} - History
            </div>

                {/* History Content */}
                {historyLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading history...</span>
                  </div>
                ) : historyError ? (
                  <div className="text-sm text-gray-600 py-2">
                    No history found
                  </div>
                ) : attendanceHistory ? (
                                     <div className="w-full space-y-2">
                    {/* Current Status */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Current Status:</span>
                      <span className="text-sm">
                        {cellPopoverStatus
                          ? statusOptions.find((opt) => opt.value === cellPopoverStatus)?.label
                          : "No attendance marked"}
                      </span>
                    </div>

                                         {/* Attendance Details */}
                     <div className="bg-gray-50 rounded p-2 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">First Check In:</span>
                        <span className="text-xs font-medium">
                          {attendanceHistory.firstCheckIn ? 
                            (() => {
                              try {
                                return new Date(attendanceHistory.firstCheckIn).toLocaleTimeString();
                              } catch (error) {
                                return "Invalid Time";
                              }
                            })() : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Last Check Out:</span>
                        <span className="text-xs font-medium">
                          {attendanceHistory.lastCheckOut ? 
                            (() => {
                              try {
                                return new Date(attendanceHistory.lastCheckOut).toLocaleTimeString();
                              } catch (error) {
                                return "Invalid Time";
                              }
                            })() : "-"}
                        </span>
                      </div>
                                             <div className="flex justify-between items-center">
                         <span className="text-xs text-gray-600">Working Hours:</span>
                         <span className="text-xs font-medium">
                           {attendanceHistory.workingHours > 0 ? attendanceHistory.workingHours : "-"}
                         </span>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="text-xs text-gray-600">Leave Utilized:</span>
                         <span className="text-xs font-medium">
                           {attendanceHistory.leaveUtilized > 0 ? attendanceHistory.leaveUtilized : "-"}
                         </span>
                       </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Holiday:</span>
                        <span className="text-xs font-medium">
                          {attendanceHistory.holiday ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>

                                         {/* Activity History */}
                     {attendanceHistory.activity && attendanceHistory.activity.length > 0 && (
                       <div className="border border-gray-200 rounded p-2">
                         <h4 className="text-xs font-semibold text-gray-700 mb-1">Activity History</h4>
                         <div className="space-y-1">
                          {attendanceHistory.activity.map((activity, index) => (
                            <div key={index} className="border-l-2 border-gray-300 pl-2 py-1">
                              <div className="flex justify-between items-start text-xs">
                                <div>
                                  <div className="text-gray-700 font-medium">
                                    {activity.type === "manual" ? "Manual Update" : activity.type}
                                  </div>
                                  <div className="text-gray-500">
                                    by {activity.updatedBy}
                                  </div>
                                </div>
                                                                 <div className="text-right">
                                   <div className="font-semibold text-gray-800">
                                     {activity.hours && !isNaN(activity.hours) ? activity.hours : "N/A"}
                                   </div>
                                   <div className="text-gray-500 text-xs">
                                     {activity.updatedAt ? 
                                       (() => {
                                         try {
                                           // Handle both timestamp (number) and date string formats
                                           let date;
                                           if (typeof activity.updatedAt === 'number') {
                                             date = new Date(activity.updatedAt * 1000);
                                           } else {
                                             date = new Date(activity.updatedAt);
                                           }
                                           return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                                         } catch (error) {
                                           return "Invalid Date";
                                         }
                                       })() : "N/A"}
                                   </div>
                                 </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 py-2">
                    No history found
                  </div>
                )}
              </>
            )}

                        <div className="flex justify-between items-center mt-1 w-full">
              {!isHistoryExpanded ? (
                <button
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    !isCurrentCellEditable() 
                      ? "bg-blue-500 text-white hover:bg-blue-600 border border-blue-500" 
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                  onClick={handleViewHistory}
                >
                  {!isCurrentCellEditable() ? "View History" : "View History"}
                </button>
              ) : (
                <button
                  className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded border border-gray-200 hover:bg-gray-100 text-xs font-medium"
                  onClick={() => setIsHistoryExpanded(false)}
                >
                  Back to Edit
                </button>
              )}
              <div className="flex gap-2">
              <button
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                onClick={closePopover}
              >
                Cancel
              </button>
                {!isHistoryExpanded && isCurrentCellEditable() && (
              <button
                className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                onClick={() => {
                  handleCellPopoverSave();
                  closePopover();
                }}
              >
                Save
              </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendanceTracker;