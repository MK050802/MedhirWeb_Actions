import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import HradminNavbar from "@/components/HradminNavbar";
import { useRouter } from "next/router";
import withAuth from "@/components/withAuth";
import AttendanceTracker from "@/components/Attendance/AttendanceTracker";
import { useDispatch, useSelector } from "react-redux";
import { fetchEmployees } from "@/redux/slices/employeeSlice";
import { checkPayrollFreezeStatus } from "@/redux/slices/payrollFreezeStatusSlice";

function Attendance() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get query parameters for filtering
  const { selectedDate, selectedMonth, selectedYear, selectedStatuses } = router.query;

  const { employees = [], loading: employeesLoading } = useSelector(
    (state) => state.employees || {}
  );

  // Get payroll freeze status from Redux
  const { freezeStatus, checkLoading: freezeStatusLoading } = useSelector(
    (state) => state.payrollFreezeStatus
  );
  
  // Store which month/year was checked for freeze status
  const [freezeCheckedMonth, setFreezeCheckedMonth] = useState(null);
  const [freezeCheckedYear, setFreezeCheckedYear] = useState(null);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    dispatch(fetchEmployees()).catch((err) => {
      setError("Failed to fetch employees");

    });
    
    // Check payroll freeze status instead of fetching payroll settings
    const companyId = sessionStorage.getItem("employeeCompanyId");
    if (companyId) {
      // Get current month - 1 (previous month) for payroll freeze check
      const currentDate = new Date();
      const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const month = previousMonth.getMonth() + 1; // getMonth() returns 0-11, so add 1
      const year = previousMonth.getFullYear();
      

      
      // Store which month/year we're checking for freeze status
      setFreezeCheckedMonth(month);
      setFreezeCheckedYear(year);
      
      dispatch(checkPayrollFreezeStatus({
        companyId,
        year,
        month
      }));
    }
  }, [dispatch]);

  // Check if payroll is currently frozen for a specific month
  const isPayrollFrozen = (month = null, year = null) => {

    
    if (freezeStatusLoading) {

      return false;
    }
    
    if (freezeStatus !== undefined && freezeStatus !== null) {

      
      // Handle different possible API response formats
      let frozen = false;
      if (typeof freezeStatus === 'boolean') {
        // Direct boolean response: true/false
        frozen = freezeStatus === true;
      } else if (typeof freezeStatus === 'object' && freezeStatus !== null) {
        // Object response: { "isFrozen": true } or similar
        frozen = freezeStatus.isFrozen === true || freezeStatus.frozen === true || freezeStatus.status === true;
      } else if (typeof freezeStatus === 'string') {
        // String response: "true"/"false"
        frozen = freezeStatus.toLowerCase() === 'true';
      } else if (typeof freezeStatus === 'number') {
        // Number response: 1/0
        frozen = freezeStatus === 1;
      }
      

      
      // If API returns true, it means the month we checked (July 2025) is frozen
      // So we should freeze that specific month, not calculate a different month
      if (frozen && month !== null && year !== null) {
        // Use the month/year that was actually checked by the API
        const apiMonth = freezeCheckedMonth;
        const apiYear = freezeCheckedYear;
        
        if (apiMonth !== null && apiYear !== null) {
          const shouldFreeze = (month === apiMonth && year === apiYear);

          
          return shouldFreeze;
        }
      }
      
      return false;
    }
    
    // Fallback: if API is not working, assume payroll is not frozen

    return false;
  };

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div
        className={`flex-1 ${
          isSidebarCollapsed ? "ml-16" : "ml-56"
        } transition-all duration-300`}
      >
        <HradminNavbar />
        <AttendanceTracker
          employees={employees}
          employeesLoading={employeesLoading}
          role="HRADMIN"
          initialSelectedDate={selectedDate ? parseInt(selectedDate) : null}
          initialSelectedMonth={selectedMonth || null}
          initialSelectedYear={selectedYear || null}
          initialSelectedStatuses={selectedStatuses ? selectedStatuses.split(',') : []}
          isPayrollFrozen={isPayrollFrozen}
        />
      </div>
    </div>
  );
}

export default withAuth(Attendance);