import React, { useState, useEffect, useRef } from "react";
import HradminNavbar from "../../components/HradminNavbar";
import Sidebar from "../../components/Sidebar";
import { X } from "lucide-react";
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
import { fetchPublicHolidays } from "@/redux/slices/publicHolidaySlice";
import { fetchEmployeeDetails } from "@/redux/slices/payslipSlice";
import { toast } from "sonner";
import CustomDatePicker from "@/components/CustomDatePicker";
import { getItemFromSessionStorage } from "@/redux/slices/sessionStorageSlice";
import withAuth from "@/components/withAuth";
import { fetchEmployeeLeavePolicy } from "@/redux/slices/leavePolicySlice";
import { checkPayrollFreezeStatus } from "@/redux/slices/payrollFreezeStatusSlice";

// Helper to format numbers: show two decimals only if not whole
function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return "0";
  return Number(num) % 1 === 0 ? Number(num) : Number(num).toFixed(2);
}

// Helper to calculate requested days based on shift type
function calculateRequestedDays(dates) {
  return dates.reduce((total, date) => {
    const shift = date.shiftType || date.timeSlot;
    const dayValue =
      shift === "FIRST_HALF" || shift === "SECOND_HALF" ? 0.5 : 1;
    return total + dayValue;
  }, 0);
}

const Leaves = () => {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = getItemFromSessionStorage("token");
    setToken(storedToken);
  }, []);

  const dispatch = useDispatch();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompOffModalOpen, setIsCompOffModalOpen] = useState(false);

  const { leaves, loading, error } = useSelector((state) => state.leave);
  const { leaveHistory, historyLoading, historyError } = useSelector(
    (state) => state.leave
  );

  const {
    balance: leaveBalance,
    loading: isLoadingBalance,
    error: balanceError,
  } = useSelector((state) => state.leaveBalance);
  const {
    holidays,
    loading: holidayLoading,
    error: holidayError,
  } = useSelector((state) => state.publicHoliday);
  const { employeeData } = useSelector((state) => state.payslip);
  const calendarRef = useRef(null);

  const [requestedDays, setRequestedDays] = useState(0);

  const employeeId = sessionStorage.getItem("employeeId"); // Retrieve the employee ID from sessionStorage

  // Simplified form states
  const [leaveForm, setLeaveForm] = useState({
    dates: [],
    reason: "",
    shiftType: "FULL_DAY",
  });

  const [compOffForm, setCompOffForm] = useState({
    dates: [],
    description: "",
    shiftType: "FULL_DAY",
  });

  // Add debug log to check state structure
  const state = useSelector((state) => {
    return state;
  });

  // Add state for leave policy and weekly offs
  const [leavePolicy, setLeavePolicy] = useState(null);
  const [weeklyOffs, setWeeklyOffs] = useState([]);

  const [expandedRow, setExpandedRow] = useState(null);

  // Get employee leave policy from Redux state
  const {
    employeeLeavePolicy,
    employeePolicyError,
  } = useSelector((state) => state.leavePolicy);

  // Update local state when Redux state changes
  useEffect(() => {
    if (employeeLeavePolicy) {
      setLeavePolicy(employeeLeavePolicy);
      setWeeklyOffs(Array.isArray(employeeLeavePolicy.weeklyOffs) ? employeeLeavePolicy.weeklyOffs : []);
    }
  }, [employeeLeavePolicy]);

  // Handle employee policy error
  useEffect(() => {
    if (employeePolicyError) {
      toast.error("Could not fetch leave policy");
    }
  }, [employeePolicyError]);

  // Extract all leave dates from leaveHistory to disable them in the calendar
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

  useEffect(() => {
    dispatch(fetchLeaveHistory());
    dispatch(fetchLeaveBalance(employeeId)); // Pass employeeId to fetchLeaveBalance action
    dispatch(fetchPublicHolidays());
    dispatch(fetchEmployeeLeavePolicy(employeeId));
    dispatch(fetchEmployeeDetails(employeeId)); // Fetch employee details for joining date

    return () => {
      dispatch(clearErrors());
      dispatch(resetLeaveBalanceState());
    };
  }, [dispatch, employeeId]);

  // Add click outside handler for calendar
  useEffect(() => {
    const handleClickOutside = (event) => {
      const calendar = document.querySelector(".react-calendar");
      if (
        calendar &&
        !calendar.contains(event.target) &&
        !event.target.closest(".custom-date-picker-input")
      ) {
        // Find and close the calendar by clicking the close button
        const closeButton = calendar.parentElement.querySelector("button");
        if (closeButton) {
          closeButton.click();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
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

  const openCompOffModal = async () => {
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
    
    setIsCompOffModalOpen(true);
  };
  const closeCompOffModal = () => {
    setIsCompOffModalOpen(false);
    setCompOffForm({ dates: [], description: "", shiftType: "FULL_DAY" });
    setLeavePolicy(null);
    setWeeklyOffs([]);
  };

  const handleLeaveFormChange = (e) => {
    const { name, value } = e.target;
    setLeaveForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleShiftTypeChange = (e) => {
    setLeaveForm((prev) => ({ ...prev, shiftType: e.target.value }));
  };

  const handleLeaveDatesChange = (dates) => {
    const totalDays = calculateRequestedDays(dates);
    setRequestedDays(totalDays);

    setLeaveForm((prev) => ({ ...prev, dates }));
  };

  const handleCompOffFormChange = (e) => {
    const { name, value } = e.target;
    setCompOffForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCompOffSubmit = async (e) => {
    e.preventDefault();

    if (!compOffForm.dates.length) {
      toast.error("Please select a date");
      return;
    }

    try {
      // Convert selected dates to ISO string format
      const leaveDates = compOffForm.dates
        .map((date) => date.date.toISOString().split("T")[0])
        .sort();

      const formData = {
        leaveDates: leaveDates,
        shiftType:
          compOffForm.dates[0]?.timeSlot ||
          compOffForm.dates[0]?.shiftType ||
          "FULL_DAY",
        reason: compOffForm.description || "", // Allow empty description
      };

      const resultAction = await dispatch(applyCompOffLeave(formData));
      if (applyCompOffLeave.fulfilled.match(resultAction)) {
        toast.success("Comp-off application submitted successfully");
        closeCompOffModal();
        // Refresh both leave history and balance
        dispatch(fetchLeaveHistory());
        dispatch(fetchLeaveBalance(employeeId)); // Pass employeeId to fetchLeaveBalance action
      } else {
        throw new Error(
          resultAction.error.message || "Failed to apply for comp-off"
        );
      }
    } catch (error) {
      toast.error(error.message || "Failed to submit comp-off request");
    }
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

  return (
    <div className="flex h-screen">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <div
        className={`flex-1 ${
          isSidebarCollapsed ? "ml-16" : "ml-56"
        } transition-all duration-300`}
      >
        <HradminNavbar />

        {/* Main Content Area */}
        <div className="p-5 bg-gray-100 h-full">
          {/* Page Heading */}
          <div className="mb-6 pt-16 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Leave Management
            </h1>
            <div className="flex gap-4">
              <button
                className={`px-4 py-2 rounded-lg transition ${
                  balanceError 
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                onClick={openCompOffModal}
                disabled={!!balanceError}
              >
                Apply for Comp-off
              </button>
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
          </div>

          {/* Leave Balance and History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7 mb-7">
            {/* Leave Balance */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Leave Balance</h2>
              {isLoadingBalance ? (
                <div className="text-center py-4">Loading leave balance...</div>
              ) : balanceError ? (
                (typeof balanceError === "string" &&
                  balanceError.includes("400")) ||
                (typeof balanceError === "object" &&
                  balanceError?.status === 400) ? (
                  <div className="text-center py-4 text-gray-500">
                    Your leave balance will be available once your profile is configured.
                  </div>
                ) : (
                  <div className="text-center py-4 text-red-500">
                    {typeof balanceError === "string"
                      ? balanceError
                      : balanceError?.message || "Failed to load leave balance"}
                  </div>
                )
              ) : leaveBalance ? (
                <div className="space-y-4">
                  {/* Total Balance - First and Prominent */}
                  <div className="flex items-center py-3">
                    <span className="text-gray-600 font-medium flex-1">Total Available Balance</span>
                    <span className="text-gray-600 mx-4">-</span>
                    <span className="text-3xl font-bold text-gray-900 flex-1 text-right">
                      {formatNumber(leaveBalance.totalAvailableBalance)}
                    </span>
                  </div>

                  {/* Formula explanation - Just above the horizontal line */}
                  <div className="text-center pb-2">
                    <p className="text-xs text-gray-500">
                       Total = Leaves(carried & earned) + Comp-off (carried & earned) - Taken leaves
                    </p>
                  </div>

                  {/* Separator Line */}
                  <hr className="border-gray-300" />

                  {/* Detailed Breakdown - Simple List */}
                  <div className="space-y-3">
                    <div className="flex items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 flex-1">Leaves earned in this month</span>
                      <span className="text-gray-600 mx-4">-</span>
                      <span className="font-semibold text-gray-900 flex-1 text-right">
                        {formatNumber(leaveBalance.leavesEarnedInThisMonth)}
                      </span>
                    </div>
                    
                    <div className="flex items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 flex-1">Comp-Off earned in this month</span>
                      <span className="text-gray-600 mx-4">-</span>
                      <span className="font-semibold text-gray-900 flex-1 text-right">
                        {formatNumber(leaveBalance.compOffEarnedInThisMonth)}
                      </span>
                    </div>
                    
                    <div className="flex items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 flex-1">Leaves carried forward</span>
                      <span className="text-gray-600 mx-4">-</span>
                      <span className="font-semibold text-gray-900 flex-1 text-right">
                        {formatNumber(leaveBalance.leavesCarryForwardedFromPreviousMonth)}
                      </span>
                    </div>
                    
                    <div className="flex items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 flex-1">Comp-off carried forward</span>
                      <span className="text-gray-600 mx-4">-</span>
                      <span className="font-semibold text-gray-900 flex-1 text-right">
                        {formatNumber(leaveBalance.compOffCarryForwardedFromPreviousMonth)}
                      </span>
                    </div>
                    
                    <div className="flex items-center py-2">
                      <span className="text-gray-600 flex-1">Leaves taken in this month</span>
                      <span className="text-gray-600 mx-4">-</span>
                      <span className="font-semibold text-gray-900 flex-1 text-right">
                        {formatNumber(leaveBalance.leavesTakenInThisMonth)}
                      </span>
                    </div>
                  </div>


                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No leave balance data available
                </div>
              )}
            </div>

            {/* Leave History */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Leave History</h2>
              <div className="divide-y divide-gray-200 max-h-[300px] overflow-y-auto">
                {historyLoading ? (
                  <div className="py-4 text-center text-gray-500">
                    Loading leave history...
                  </div>
                ) : historyError ? (
                  <div className="py-4 text-center text-red-500">
                    {typeof historyError === "string"
                      ? historyError
                      : historyError.message || "Error loading leave history"}
                  </div>
                ) : leaveHistory && leaveHistory.length > 0 ? (
                  <div>
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-50 text-xs">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                            Request Type
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                            Shift Type
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                            Reason
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 text-xs">
                        {[...leaveHistory]
                          .sort(
                            (a, b) =>
                              new Date(b.leaveDates?.[0] || 0) -
                              new Date(a.leaveDates?.[0] || 0)
                          )
                          .map((leave, index) => {
                            const isExpandable =
                              (leave.leaveDates &&
                                leave.leaveDates.length > 1) ||
                              (leave.reason && leave.reason.length > 30);
                            return (
                              <React.Fragment key={leave.leaveId || index}>
                                <tr
                                  onMouseEnter={() => setExpandedRow(index)}
                                  onMouseLeave={() => setExpandedRow(null)}
                                >
                                  <td className="px-4 py-2 whitespace-nowrap cursor-pointer text-xs max-w-[120px] overflow-hidden text-ellipsis">
                                    {leave.leaveDates &&
                                    leave.leaveDates.length > 0
                                      ? new Date(
                                          leave.leaveDates[0]
                                        ).toLocaleDateString()
                                      : "-"}
                                    {leave.leaveDates &&
                                      leave.leaveDates.length > 1 && (
                                        <>
                                          {" "}
                                          +{leave.leaveDates.length - 1} more
                                        </>
                                      )}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-xs">
                                    <span
                                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${
                                      leave.leaveName === "Comp-Off"
                                        ? "bg-purple-100 text-purple-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                                    >
                                      {leave.leaveName || "Leave"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-xs">
                                    {(() => {
                                      switch (leave.shiftType) {
                                        case "FULL_DAY":
                                        case "Full Day":
                                          return "Full Day";
                                        case "FIRST_HALF":
                                        case "First Half (Morning)":
                                          return "First Half (Morning)";
                                        case "SECOND_HALF":
                                        case "Second Half (Evening)":
                                          return "Second Half (Evening)";
                                        default:
                                          return leave.shiftType || "-";
                                      }
                                    })()}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-xs">
                                    <span
                                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${
                                      leave.status === "Approved"
                                        ? "bg-green-100 text-green-800"
                                        : leave.status === "Rejected"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                    >
                                      {leave.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 max-w-[160px] overflow-hidden text-ellipsis">
                                    {leave.reason || "-"}
                                  </td>
                                </tr>
                                {expandedRow === index && isExpandable && (
                                  <tr>
                                    <td
                                      colSpan={5}
                                      className="px-4 py-2 bg-gray-50 text-xs text-gray-700"
                                    >
                                      <div className="flex flex-wrap gap-2 mb-1">
                                        {leave.leaveDates &&
                                          leave.leaveDates.length > 1 &&
                                          leave.leaveDates.map((d, i) => (
                                            <span
                                              key={i}
                                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded"
                                            >
                                              {new Date(d).toLocaleDateString()}
                                            </span>
                                          ))}
                                      </div>
                                      {leave.reason &&
                                        leave.reason.length > 30 && (
                                          <div className="mt-1 text-xs text-gray-700">
                                            <b>Reason:</b> {leave.reason}
                                          </div>
                                        )}
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-4 text-center text-gray-500">
                    No leave history found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Leave Policies and Public Holidays */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {/* Leave Policies */}
            <div className="bg-white shadow-md rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Leave Policies</h2>
              <div className="mb-4 bg-gray-50 shadow-md rounded-lg p-3 max-h-60 overflow-y-auto pr-2">
                <h3 className="text-md font-semibold text-gray-800">
                  Annual Leave Policy
                </h3>
                <ul className="list-disc list-inside text-gray-600 text-sm">
                  <li>
                    All employees are entitled to 18 days of annual leave per
                    year
                  </li>
                  <li>Unused leave can be carried forward to the next year</li>
                </ul>
              </div>
              <div className="bg-gray-50 shadow-md rounded-lg p-3 max-h-60 overflow-y-auto pr-2">
                <h3 className="text-md font-semibold text-gray-800">
                  Comp-off Leave Policy
                </h3>
                <ul className="list-disc list-inside text-gray-600 text-sm">
                  <li>
                    When applying for leave, it will first be deducted from
                    available comp-off balance
                  </li>
                  <li>
                    If comp-off balance is exhausted, remaining days will be
                    deducted from annual leave
                  </li>
                  <li>
                    Unused comp-off can be carried forward to the next month
                  </li>
                </ul>
              </div>
            </div>

            {/* Public Holidays */}
            <div className="bg-white shadow-md rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Public Holidays</h2>
              <div className="bg-gray-50 shadow-md rounded-lg p-3">
                {holidayLoading ? (
                  <div className="text-center py-4">Loading holidays...</div>
                ) : holidayError ? (
                  <div className="text-center py-4 text-red-500">
                    {holidayError}
                  </div>
                ) : holidays.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No public holidays found
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {holidays.map((holiday) => (
                      <div
                        key={holiday.holidayId}
                        className="border-b border-gray-200 pb-2 last:border-b-0"
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="text-md font-semibold text-gray-800">
                            {holiday.holidayName}
                          </h3>
                          <span className="text-sm text-gray-600">
                            {new Date(holiday.date).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </div>
                        {holiday.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {holiday.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

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

          {/* Improved Comp-off Modal */}
          {isCompOffModalOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 transform transition-all duration-300 scale-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Apply for Comp-off
                  </h2>
                  <button
                    onClick={closeCompOffModal}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors duration-200"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCompOffSubmit} className="space-y-6">
                  <div>
                    <CustomDatePicker
                      selectedDates={compOffForm.dates}
                      onChange={(dates) => {
                        setCompOffForm((prev) => ({
                          ...prev,
                          dates: dates.map((d) => ({
                            date:
                              d.date instanceof Date
                                ? d.date
                                : new Date(d.date),
                            shiftType: d.shiftType,
                            timeSlot: d.timeSlot,
                          })),
                        }));
                      }}
                      isCompOff={true}
                      maxDays={1}
                      shiftType={compOffForm.shiftType}
                      onShiftTypeChange={(e) => {
                        setCompOffForm((prev) => ({
                          ...prev,
                          shiftType: e.target.value,
                        }));
                      }}
                      disabledDates={getDisabledDates()}
                      joiningDate={employeeData?.joiningDate}
                    />
                    {/* {getDisabledDates().length > 0 && (
                      <div className="mt-2 text-xs text-gray-500 flex items-center">
                        <span className="mr-1">ℹ️</span>
                        Dates with existing leave requests are disabled
                      </div>
                    )} */}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      name="description"
                      value={compOffForm.description}
                      onChange={handleCompOffFormChange}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                      placeholder="Please provide details about your comp-off request (optional)..."
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={closeCompOffModal}
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
        </div>
      </div>
    </div>
  );
};

export default withAuth(Leaves);