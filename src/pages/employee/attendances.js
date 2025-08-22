import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CheckCircle2, Clock, CalendarIcon, Calendar, Play, X } from "lucide-react";
import HradminNavbar from "../../components/HradminNavbar";
import Sidebar from "../../components/Sidebar";
import withAuth from "@/components/withAuth";
import { toast } from "sonner";
import { getItemFromSessionStorage } from "@/redux/slices/sessionStorageSlice";
import { Badge } from "@/components/ui/badge";
import { useDispatch, useSelector } from "react-redux";
import {
  applyLeave,
  fetchLeaveHistory,
  clearErrors,
  applyCompOffLeave,
} from "@/redux/slices/leaveSlice";
import {
  fetchLeaveBalance,
  resetLeaveBalanceState,
} from "@/redux/slices/leaveBalanceSlice";
import { fetchOneEmployeeAttendanceOneMonth } from "@/redux/slices/attendancesSlice";
import { fetchEmployeeLeavePolicy } from "@/redux/slices/leavePolicySlice";
import { checkPayrollFreezeStatus } from "@/redux/slices/payrollFreezeStatusSlice";
import { fetchEmployeeDetails } from "@/redux/slices/payslipSlice";
import CustomDatePicker from "@/components/CustomDatePicker";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const API_BASE_URL = publicRuntimeConfig.attendanceURL;

function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return "0";
  return Number(num) % 1 === 0 ? Number(num) : Number(num).toFixed(2);
}

function calculateRequestedDays(dates) {
  return dates.reduce((total, date) => {
    const shift = date.shiftType || date.timeSlot;
    const dayValue =
      shift === "FIRST_HALF" || shift === "SECOND_HALF" ? 0.5 : 1;
    return total + dayValue;
  }, 0);
}

const EmployeeAttendance = () => {
  const employeeId = sessionStorage.getItem("employeeId");
  const dispatch = useDispatch();
  const { attendance, loading, error } = useSelector(
    (state) => state.attendances
  );
  const {
    balance: leaveBalance,
    loading: isLoadingBalance,
    error: balanceError,
  } = useSelector((state) => state.leaveBalance);
  const { leaveHistory, historyLoading, historyError } = useSelector(
    (state) => state.leave
  );
  const { employeeData } = useSelector((state) => state.payslip);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [date, setDate] = useState(null); // State to manage selected date
  const [attendanceData, setAttendanceData] = useState([]); // State for attendance data for the calendar
  const [showReasonForm, setShowReasonForm] = useState(false); // State to control reason form visibility
  const [reason, setReason] = useState(""); // State to store the reason
  const [showToast, setShowToast] = useState(false); // State to control toast visibility
  const [reasonSubmitted, setReasonSubmitted] = useState(false); // State to track if reason was submitted
  const [monthlySummary, setMonthlySummary] = useState({}); // State to store monthly attendance summary counts
  const calendarRef = useRef(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date()); // State for real-time updates
  const [dailyAttendanceData, setDailyAttendanceData] = useState(null); // State for daily attendance data
  const prevErrorRef = useRef();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ dates: [], reason: "", shiftType: "FULL_DAY" });
  const [leavePolicy, setLeavePolicy] = useState(null);
  const [weeklyOffs, setWeeklyOffs] = useState([]);
  const [requestedDays, setRequestedDays] = useState(0);
  // Get current date info
  const today = new Date();
  const currentMonth = today.toLocaleString("default", { month: "short" });
  const currentYear = today.getFullYear().toString();

  // Initialize with current month and year
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Add useEffect for calendar click outside handling
  useEffect(() => {
    const handleCalendarClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleCalendarClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleCalendarClickOutside);
    };
  }, []);

  // Update current time every second for real-time calculations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleCalendar = useCallback(
    () => setIsCalendarOpen(!isCalendarOpen),
    [isCalendarOpen]
  );

  const handleMonthSelection = useCallback(
    (month, year) => {
      setSelectedMonth(month);
      setSelectedYear(year);
      setIsCalendarOpen(false);

      // Get employee ID from session storage
      const employeeId = sessionStorage.getItem("employeeId");
      if (!employeeId) {
        toast.error("Employee ID not found in session storage.");
        return;
      }

      // Fetch employee details for joining date (if not already loaded)
      if (!employeeData) {
        dispatch(fetchEmployeeDetails(employeeId));
      }

      // Dispatch the action to fetch attendance data
      dispatch(
        fetchOneEmployeeAttendanceOneMonth({
          employeeId,
          month,
          year,
        })
      );
    },
    [dispatch, employeeData]
  );

  useEffect(() => {
    dispatch(fetchLeaveBalance(employeeId));
  }, [dispatch, employeeId]);

  // Initial data fetch when component mounts
  useEffect(() => {
    const employeeId = sessionStorage.getItem("employeeId");
    if (!employeeId) {
      toast.error("Employee ID not found in session storage.");
      return;
    }

    // Fetch employee details for joining date
    dispatch(fetchEmployeeDetails(employeeId));

    // Fetch data for current month and year
    dispatch(
      fetchOneEmployeeAttendanceOneMonth({
        employeeId,
        month: currentMonth,
        year: currentYear,
      })
    );
  }, [dispatch, currentMonth, currentYear]);

  // Update attendance data when Redux store changes
  useEffect(() => {
    if (attendance && !loading && !error) {
      const monthIndex = new Date(
        `${selectedMonth} 1, ${selectedYear}`
      ).getMonth();
      const daysInMonth = new Date(
        parseInt(selectedYear),
        monthIndex + 1,
        0
      ).getDate();

      const formattedData = [];
      // Initialize summary counts from the response statusCounts
      const summaryCounts = {
        Present: attendance.statusCounts?.P || 0,
        "Approved Leave": attendance.statusCounts?.L || 0, // Changed from AL to L

        "Half Day": 0, // Will be calculated from days
        "Approved half day Leave": 0, // Will be calculated from days
        "On Leave": 0,
        Holiday: attendance.statusCounts?.H || 0,
        Weekend: 0,
        Absent: attendance.statusCounts?.A || 0,
      };

      // Helper function to determine attendance status for a given date
      const getAttendanceStatusForDate = (dayNumber) => {
        // Check if the day exists in the days object
        if (attendance.days && attendance.days[dayNumber]) {
          return attendance.days[dayNumber].statusCode;
        }
        
        // Return null if no status code is available (empty box)
        return null;
      };

      for (let day = 1; day <= daysInMonth; day++) {
        // Get status code for the current day
        const status = getAttendanceStatusForDate(day.toString());

        let fullStatus = "No Data";
        let leaveType = null;

        // Only process status if it's not null
        if (status) {
          switch (status) {
            case "P":
              fullStatus = "Present";
              break;
            case "L":
              fullStatus = "Approved Leave";
              break;
            case "A":
              fullStatus = "Absent";
              break;
            case "H":
              fullStatus = "Holiday";
              break;
            case "W":
              fullStatus = "Weekend";
              break;

            case "P/A":
              fullStatus = "Half Day";
              leaveType = "Half Day";
              break;
            case "P/L":
              fullStatus = "Approved half day Leave";
              leaveType = "Approved half day Leave";
              break;
            default:
              fullStatus = "No Data"; // Keep as "No Data" for unknown status codes
          }
        }

        formattedData.push({
          date: new Date(parseInt(selectedYear), monthIndex, day),
          status: fullStatus,
          isLate: false,
          checkIn: null,
          checkOut: null,
          leaveType: leaveType,
          checkinTimes: attendance?.checkinTimes || [],
          checkoutTimes: attendance?.checkoutTimes || [],
          totalWorkingMinutes: attendance?.totalWorkingMinutes || 0,
        });

        // Update summary counts for statuses that need to be calculated from days
        if (fullStatus === "Half Day" || 
            fullStatus === "Approved half day Leave") {
          summaryCounts[fullStatus] = (summaryCounts[fullStatus] || 0) + 1;
        }
      }
      setAttendanceData(formattedData);
      setMonthlySummary(summaryCounts);
    } else if (error && prevErrorRef.current !== error) {
      // Don't show toast for 404 errors (no data found)
      if (!error.includes('404')) {
        toast.error(`Failed to fetch attendance data: ${error}`);
      }
      prevErrorRef.current = error;
      setAttendanceData([]);
      setMonthlySummary({});
    }
  }, [attendance, loading, error, selectedMonth, selectedYear]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  const openModal = async () => {
    await dispatch(fetchEmployeeLeavePolicy(employeeId));
    
    // Check payroll freeze status for date restrictions
    const companyId = sessionStorage.getItem("employeeCompanyId");
    if (companyId) {
      // Get current month - 1 (previous month) for payroll freeze check
      const currentDate = new Date();
      const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const month = previousMonth.getMonth() + 1; // getMonth() returns 0-11, so add 1
      const year = previousMonth.getFullYear();
      

      
      dispatch(checkPayrollFreezeStatus({
        companyId,
        year,
        month
      }));
    }
    
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setLeaveForm({ dates: [], reason: "", shiftType: "FULL_DAY" });
    setLeavePolicy(null);
    setWeeklyOffs([]);
  };

  const generateCalendarDays = () => {
    const monthIndex = new Date(
      `${selectedMonth} 1, ${selectedYear}`
    ).getMonth();
    const year = parseInt(selectedYear);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    let daysArray = [];

    for (let day = 1; day <= daysInMonth; day++) {
      daysArray.push(new Date(year, monthIndex, day));
    }

    return daysArray;
  };

  const handleSubmitReason = (e) => {
    e.preventDefault();

    // Show toast notification
    setShowToast(true);

    // Mark reason as submitted
    setReasonSubmitted(true);

    // Close form and reset reason
    setShowReasonForm(false);
    setReason("");
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();

    // Convert selected dates to ISO string format and sort them
    const leaveDates = leaveForm.dates
      .map((date) => date.date.toISOString().split("T")[0])
      .sort();

    const formData = {
      leaveDates: leaveDates,
      shiftType:
        leaveForm.dates[0]?.timeSlot ||
        leaveForm.dates[0]?.shiftType ||
        "FULL_DAY",
      reason: leaveForm.reason || "", // Allow empty reason
    };

    if (!formData.leaveDates.length) {
      toast.error("Please select at least one date");
      return;
    }

    try {
      const resultAction = await dispatch(applyLeave(formData));
      if (applyLeave.fulfilled.match(resultAction)) {
        toast.success("Leave application submitted successfully");
        closeModal();
        dispatch(fetchLeaveHistory());
        dispatch(fetchLeaveBalance(employeeId));
      } else {
        throw new Error(
          resultAction.error.message || "Failed to apply for leave"
        );
      }
    } catch (error) {
      toast.error(error.message || "Failed to apply for leave");
    }
  };

  const handleLeaveDatesChange = (dates) => {
    const totalDays = calculateRequestedDays(dates);
    setRequestedDays(totalDays);

    setLeaveForm((prev) => ({ ...prev, dates }));
  };
  const handleShiftTypeChange = (e) => {
    setLeaveForm((prev) => ({ ...prev, shiftType: e.target.value }));
  };
  const handleLeaveFormChange = (e) => {
    const { name, value } = e.target;
    setLeaveForm((prev) => ({ ...prev, [name]: value }));
  };

  const getDisabledDates = () => {
    if (!leaveHistory || !Array.isArray(leaveHistory)) return [];

    const disabledDates = [];
    leaveHistory.forEach((leave) => {
      if (leave.leaveDates && Array.isArray(leave.leaveDates)) {
        leave.leaveDates.forEach((dateString) => {
          // Convert date string to Date object and add to disabled dates
          const date = new Date(dateString);
          if (!isNaN(date.getTime())) {
            disabledDates.push(date);
          }
        });
      }
    });


    return disabledDates;
  };


  // Function to fetch attendance data for a specific date
  const fetchAttendanceData = async (selectedDate) => {
    try {
      const employeeId = sessionStorage.getItem("employeeId");
      const token = getItemFromSessionStorage("token", null);

      if (!employeeId || !token) {
        toast.error("Employee ID or token not found in session storage.");
        return;
      }

      // Fix: Format date properly without timezone conversion
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      // Construct the URL in the new format: /attendance/employee/{employeeId}/date/{year}/{month}/{day}
      const url = `${API_BASE_URL}/attendance/employee/${employeeId}/date/${year}/${parseInt(month)}/${parseInt(day)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Handle 404 gracefully - no data found, set empty data
          setDailyAttendanceData(null);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Store the daily attendance data
      setDailyAttendanceData(data);

      // Update state with fetched data while preserving status and color information
      setAttendanceData((prevData) => {
        const updatedData = prevData.map((d) => {
          if (d.date.toDateString() === selectedDate.toDateString()) {
            return {
              ...d,
              // Store the new API response data
              dailyAttendanceData: data,
              // Preserve the status and other display properties
              status: d.status,
              isLate: d.isLate,
              leaveType: d.leaveType,
            };
          }
          return d;
        });
        return updatedData;
      });
    } catch (error) {
      // Don't show toast for 404 errors (no data found)
      if (!error.message.includes('404')) {
        toast.error(`Failed to fetch attendance data: ${error.message}`);
      }
    }
  };

  // Update the onClick handler for each date
  const handleDateClick = (day) => {
    setDate(day);
    
    // Fetch daily attendance data for all dates (not just present dates)
    fetchAttendanceData(day);
  };

  const calendarDays = generateCalendarDays();

  // Helper function to format time in AM/PM
  const formatTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getDayName = (dateObj) => {
    return dateObj.toLocaleDateString("en-US", { weekday: "long" });
  };

  // Helper function to parse time duration string (HH:MM:SS) to minutes
  const parseTimeDuration = (timeString) => {
    if (!timeString) return 0;
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return hours * 60 + minutes + seconds / 60;
  };

  // Helper function to calculate additional time since latest checkin
  const calculateAdditionalTimeFromLatestCheckin = (latestCheckin) => {
    if (!latestCheckin) return 0;
    const latestCheckinTime = new Date(latestCheckin);
    const timeDiff = currentTime.getTime() - latestCheckinTime.getTime();
    return timeDiff / (1000 * 60); // Convert to minutes
  };

  // Helper function to format live working hours (using latestCheckin)
  const formatLiveWorkingHours = (workingHoursTillNow, latestCheckin) => {
    const baseMinutes = parseTimeDuration(workingHoursTillNow);
    const additionalMinutes = calculateAdditionalTimeFromLatestCheckin(latestCheckin);
    const totalMinutes = baseMinutes + additionalMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return `${hours}h ${minutes}m`;
  };

  // Helper function to format workingHoursTillNow string to xh ym format
  const formatWorkingHoursString = (workingHoursString) => {
    if (!workingHoursString) return "0h 0m";
    const [hours, minutes, seconds] = workingHoursString.split(':').map(Number);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <div
        className={`flex-1 ${
          isSidebarCollapsed ? "ml-16" : "ml-56"
        } transition-all duration-300`}
      >
        {/* Navbar */}
        <HradminNavbar />

        {/* Content */}
        <div className="p-6 space-y-6 mt-16">
          {" "}
          {/* Increased mt-16 for more spacing */}
          {/* Monthly Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Monthly Summary</CardTitle>
              <CardDescription>
                Your attendance statistics for this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {/* Present */}
                  <div className="flex flex-col bg-[#CCFFCC] p-3 rounded-lg">
                    <span className="font-medium text-green-800">
                      Present (P)
                    </span>
                    <span className="text-2xl font-bold">
                      {monthlySummary["Present"] || 0}
                    </span>
                  </div>
                  {/* Approved Leave */}
                  <div className="flex flex-col bg-[#E5E5CC] p-3 rounded-lg">
                    <span className="font-medium text-yellow-800">
                      Approved Leave (L)
                    </span>
                    <span className="text-2xl font-bold">
                      {monthlySummary["Approved Leave"] || 0}
                    </span>
                  </div>
                  {/* Half Day */}
                  <div className="flex flex-col bg-[#FFFFCC] p-3 rounded-lg">
                    <span className="font-medium text-yellow-800">
                      Half Day (P/A)
                    </span>
                    <span className="text-2xl font-bold">
                      {monthlySummary["Half Day"] || 0}
                    </span>
                  </div>
                  {/* Approved half day Leave */}
                  <div className="flex flex-col bg-[#ffcc80] p-3 rounded-lg">
                    <span className="font-medium text-orange-800">
                      Approved half day Leave (P/L)
                    </span>
                    <span className="text-2xl font-bold">
                      {monthlySummary["Approved half day Leave"] || 0}
                    </span>
                  </div>
                  {/* Absent */}
                  <div className="flex flex-col bg-[#FFCCCC] p-3 rounded-lg">
                    <span className="font-medium text-red-900">Absent (A)</span>
                    <span className="text-2xl font-bold">
                      {monthlySummary["Absent"] || 0}
                    </span>
                  </div>
                  {/* Holiday */}
                  <div className="flex flex-col bg-[#E0E0E0] p-3 rounded-lg">
                    <span className="font-medium text-gray-700">
                      Holiday (H)
                    </span>
                    <span className="text-2xl font-bold">
                      {monthlySummary["Holiday"] || 0}
                    </span>
                  </div>


                </div>
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Attendance Calendar */}
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  {/* Left Side: Month Navigation with Calendar */}
                  <div className="flex items-center gap-4">
                    {/* Left Arrow - Previous Month */}
                    <button
                      onClick={() => {
                        const currentDate = new Date(`${selectedMonth} 1, ${selectedYear}`);
                        const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
                        const prevMonthName = prevMonth.toLocaleString("default", { month: "short" });
                        const prevYear = prevMonth.getFullYear().toString();
                        handleMonthSelection(prevMonthName, prevYear);
                      }}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors duration-200 text-blue-600 hover:text-blue-800"
                      title="Previous Month"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                                        {/* Calendar Button */}
                    <div className="relative" ref={calendarRef}>
                      <Badge
                        variant="outline"
                        className="px-4 py-2 cursor-pointer bg-blue-500 hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2 text-white"
                        onClick={toggleCalendar}
                      >
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium text-sm">
                          {selectedYear}-{selectedMonth}
                        </span>
                      </Badge>
                      {isCalendarOpen && (
                        <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-30">
                          {/* Existing calendar content */}
                          <div className="p-3 border-b flex justify-between items-center">
                            <div className="text-sm font-medium text-gray-700">
                              {selectedYear}
                            </div>
                            <select
                              value={selectedYear}
                              onChange={(e) => {
                                const newYear = e.target.value;
                                setSelectedYear(newYear);

                                // Set default month based on year
                                if (newYear === "2024") {
                                  setSelectedMonth("Aug");
                                  // Fetch data for August 2024
                                  const employeeId =
                                    sessionStorage.getItem("employeeId");
                                  if (employeeId) {
                                    dispatch(
                                      fetchOneEmployeeAttendanceOneMonth({
                                        employeeId,
                                        month: "Aug",
                                        year: newYear,
                                      })
                                    );
                                  }
                                } else {
                                  setSelectedMonth("Jan");
                                  // Fetch data for January 2025
                                  const employeeId =
                                    sessionStorage.getItem("employeeId");
                                  if (employeeId) {
                                    dispatch(
                                      fetchOneEmployeeAttendanceOneMonth({
                                        employeeId,
                                        month: "Jan",
                                        year: newYear,
                                      })
                                    );
                                  }
                                }
                              }}
                              className="ml-2 border rounded px-2 py-1 text-sm"
                            >
                              {[2024, 2025].map((year) => (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 p-3">
                            {(() => {
                              const currentYear = new Date().getFullYear();
                              const currentMonthIdx = new Date().getMonth(); // 0-based
                              let months = [
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
                              ];

                              // Determine which months to show based on year
                              let startIdx = 0;
                              let endIdx = 11;

                              if (parseInt(selectedYear) === 2024) {
                                startIdx = 7; // August (0-based)
                                endIdx = 11; // December
                              } else if (parseInt(selectedYear) === 2025) {
                                startIdx = 0; // January
                                endIdx =
                                  currentYear === 2025 ? currentMonthIdx : 11;
                              }

                              return months
                                .slice(startIdx, endIdx + 1)
                                .map((month) => (
                                  <button
                                    key={month}
                                    className={`p-3 text-sm rounded-md transition-colors duration-200 ${
                                      month === selectedMonth
                                        ? "bg-blue-50 text-blue-600 font-medium hover:bg-blue-100"
                                        : "hover:bg-gray-50 text-gray-700"
                                    }`}
                                    onClick={() =>
                                      handleMonthSelection(month, selectedYear)
                                    }
                                  >
                                    {month}
                                  </button>
                                ));
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Arrow - Next Month */}
                    <button
                      onClick={() => {
                        const currentDate = new Date(`${selectedMonth} 1, ${selectedYear}`);
                        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
                        const nextMonthName = nextMonth.toLocaleString("default", { month: "short" });
                        const nextYear = nextMonth.getFullYear().toString();
                        handleMonthSelection(nextMonthName, nextYear);
                      }}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors duration-200 text-blue-600 hover:text-blue-800"
                      title="Next Month"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  <button
                className={`px-4 py-2 rounded-lg transition ${
                  balanceError 
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                onClick={openModal}
                disabled={!!balanceError}
              >
                Apply for Leave
              </button>
                </div>


              </CardHeader>

              <CardContent>
                {/* Calendar Days */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                    <p>Loading attendance data...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                    <CalendarIcon className="h-8 w-8  text-muted-foreground/60" />
                    <p className="text-lg font-medium">
                      Error loading attendance data
                    </p>
                    <p className="text-sm text-muted-foreground/80">{error}</p>
                  </div>
                ) : !attendance ||
                  (!attendance.days && !attendance.statusCounts) ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                    <CalendarIcon className="h-8 w-8 mb-2 text-muted-foreground/60" />
                    <p className="text-lg font-medium">
                      No attendance data available
                    </p>
                    <p className="text-sm text-muted-foreground/80">
                      There is no attendance data for the selected month.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1 border rounded-md p-2">
                    {calendarDays.map((day, index) => {
                      // Find attendance status for the current day
                      const dayData = attendanceData.find(
                        (d) => d.date.toDateString() === day.toDateString()
                      );
                      const status = dayData?.status;
                      const dayNumber = day.getDate();

                      // Determine background color based on status
                      let bgColorClass = "hover:bg-gray-200";
                      if (dayData) {
                        switch (status) {
                          case "Present":
                            bgColorClass =
                              "bg-[#CCFFCC] hover:bg-[#B8FFB8] text-green-800";
                            break;
                          case "Approved Leave":
                            bgColorClass =
                              "bg-[#E5E5CC] hover:bg-[#D4D4B8] text-yellow-800";
                            break;
                          case "Absent":
                            bgColorClass =
                              "bg-[#FFCCCC] hover:bg-[#FFB8B8] text-red-900";
                            break;
                          case "Half Day":
                            bgColorClass =
                              "bg-[#FFFFCC] hover:bg-[#FFFFB8] text-yellow-800";
                            break;
                          case "Holiday":
                            bgColorClass =
                              "bg-[#E0E0E0] hover:bg-[#D4D4D4] text-gray-700";
                            break;

                          case "Half Day on Holiday":
                            bgColorClass =
                              "bg-[#ffcc80] hover:bg-[#FFB74D] text-orange-800";
                            break;
                          case "Loss of Pay":
                            bgColorClass =
                              "bg-[#e57373] hover:bg-[#EF5350] text-white";
                            break;
                          case "Present Half Day on Loss of Pay":
                            bgColorClass =
                              "bg-[#A89EF6] hover:bg-[#9C7CF6] text-white";
                            break;
                          case "Weekend":
                            bgColorClass =
                              "bg-gray-300 hover:bg-gray-400 text-gray-600";
                            break;
                          case "No Data":
                            bgColorClass =
                              "bg-white hover:bg-gray-50 text-gray-400 border border-gray-200";
                            break;
                          default:
                            bgColorClass = "hover:bg-gray-200";
                        }
                      }

                      return (
                        <div
                          key={index}
                          onClick={() => handleDateClick(day)}
                          className={`w-[6.5%] text-center p-2 cursor-pointer rounded-md transition ${bgColorClass}`}
                        >
                          {dayNumber}
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Legend Table removed */}
              </CardContent>
            </Card>

            {/* Attendance Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">
                  {date ? (
                    <>
                      {date.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                      <div className="text-base font-semibold text-gray-800 mt-1">
                        {getDayName(date)}
                      </div>
                    </>
                  ) : (
                    "Select a date"
                  )}
                </CardTitle>
                <CardDescription>Attendance details</CardDescription>
              </CardHeader>
              <CardContent>
                {date ? (
                  (() => {
                    // Find attendance details for the selected date
                    const selectedDayData = attendanceData.find(
                      (d) => d.date.toDateString() === date.toDateString()
                    );

                    if (!selectedDayData) {
                      return (
                        <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                          <p>No attendance data for this date.</p>
                        </div>
                      );
                    }

                    const {
                      status,
                      checkinTimes,
                      checkoutTimes,
                      totalWorkingMinutes,
                      dailyAttendanceData,
                    } = selectedDayData;

                    // Calculate total working hours
                    const totalWorkingHours = (
                      totalWorkingMinutes / 60
                    ).toFixed(1);

                    // Check if this is a present date and has daily attendance data
                    const isPresentDate = (status === "Present" || status === "Approved half day Leave") && (dailyAttendanceData || (date && dailyAttendanceData));
                    
                    // Get check-in and check-out times for present dates
                    const attendanceDataForDate = dailyAttendanceData || selectedDayData?.dailyAttendanceData;
                    const checkInTime = isPresentDate ? attendanceDataForDate?.firstCheckin : null;
                    const checkOutTime = isPresentDate ? attendanceDataForDate?.lastCheckout : null;
                    const workingHoursTillNow = isPresentDate ? attendanceDataForDate?.workingHoursTillNow : null;
                    
                    // Get new API response fields
                    const firstCheckIn = attendanceDataForDate?.firstCheckIn;
                    const lastCheckOut = attendanceDataForDate?.lastCheckOut;
                    const workingHours = attendanceDataForDate?.workingHours || 0.0;
                    const isHoliday = attendanceDataForDate?.holiday || false;
                    const leaveUtilized = attendanceDataForDate?.leaveUtilized || 0.0;
                    
                    // Determine if employee is currently checked in (has latest check-in after last check-out)
                    const isCurrentlyCheckedIn = isPresentDate && 
                      attendanceDataForDate?.latestCheckin && 
                      attendanceDataForDate?.lastCheckout &&
                      new Date(attendanceDataForDate.latestCheckin) > new Date(attendanceDataForDate.lastCheckout);

                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Status:</span>
                          <span
                            className={`${
                              status === "Present"
                                ? "bg-[#CCFFCC] text-green-800"
                                : status === "Approved Leave"
                                ? "bg-[#E5E5CC] text-yellow-800"
                                : status === "Absent"
                                ? "bg-[#FFCCCC] text-red-900"
                                : status === "Half Day"
                                ? "bg-[#FFFFCC] text-yellow-800"
                                : status === "Holiday"
                                ? "bg-[#E0E0E0] text-gray-700"
                                : status === "Approved half day Leave"
                                ? "bg-[#ffcc80] text-orange-800"
                                : status === "No Data"
                                ? "bg-white text-gray-400 border border-gray-200"
                                : "bg-gray-100 text-gray-700"
                            } text-xs font-semibold px-2 py-1 rounded-full`}
                          >
                            {status}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" /> First Check In
                          </span>
                          <span className="text-sm">
                            {firstCheckIn ? formatTime(firstCheckIn) : "-"}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" /> Last Check Out
                          </span>
                          <span className="text-sm">
                            {lastCheckOut ? formatTime(lastCheckOut) : "-"}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Total Hours:</span>
                          <span className="text-sm font-medium">
                            {workingHours > 0 ? workingHours : "-"}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Leave Utilized:</span>
                          <span className="text-sm font-medium">
                            {leaveUtilized > 0 ? leaveUtilized : "-"}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Holiday:</span>
                          <span className="text-sm">
                            {isHoliday ? "Yes" : "No"}
                          </span>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                    <CalendarIcon className="h-8 w-8 mb-2 text-muted-foreground/60" />
                    <p>Select a date to view attendance details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Reason Form Modal */}
      {showReasonForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Submit Reason for Unapproved Absence
            </h3>
            <form onSubmit={handleSubmitReason}>
              <div className="mb-4">
                <label
                  htmlFor="reason"
                  className="block text-sm font-medium mb-2"
                >
                  Reason for unapproved absence
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  rows="4"
                  placeholder="Please provide a reason for your unapproved absence..."
                  required
                ></textarea>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReasonForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-400 text-white rounded-md hover:bg-teal-500"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

                {/* Improved Leave Modal */}
                {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 transform transition-all duration-300 scale-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Apply for Leave
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors duration-200"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmitLeave} className="space-y-6">
                  <div>
                    <CustomDatePicker
                      selectedDates={leaveForm.dates}
                      onChange={handleLeaveDatesChange}
                      maxDays={5}
                      shiftType={leaveForm.shiftType}
                      onShiftTypeChange={handleShiftTypeChange}
                      leavePolicy={leavePolicy}
                      weeklyOffs={weeklyOffs}
                      disabledDates={getDisabledDates()}
                      joiningDate={employeeData?.joiningDate}
                    />
                    {/* {getDisabledDates().length > 0 && (
                      <div className="mt-2 text-xs text-gray-500 flex items-center">
                        <span className="mr-1">ℹ️</span>
                        Dates with existing leave requests are disabled
                      </div>
                    )} */}
                    {leaveForm.dates.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        Requested:{" "}
                        {requestedDays % 1 === 0
                          ? requestedDays
                          : requestedDays.toFixed(1)}{" "}
                        day(s) | Available Balance:{" "}
                        {formatNumber(leaveBalance?.totalAvailableBalance || 0)}{" "}
                        day(s)
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Leave (Optional)
                    </label>
                    <textarea
                      name="reason"
                      value={leaveForm.reason}
                      onChange={handleLeaveFormChange}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                      placeholder="Please provide a reason for your leave request (optional)..."
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
                    >
                      Submit Request
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-50 flex items-center">
          <CheckCircle2 className="h-5 w-5 mr-2" />
          <span>Reason saved successfully!</span>
        </div>
      )}
    </div>
  );
};

export default withAuth(EmployeeAttendance);