import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import HradminNavbar from "@/components/HradminNavbar";
import { useRouter } from "next/router";
import withAuth from "@/components/withAuth";
import AttendanceTracker from "@/components/Attendance/AttendanceTracker";
import { useDispatch, useSelector } from "react-redux";
import { fetchManagerEmployees } from "@/redux/slices/managerEmployeeSlice";
import { checkPayrollFreezeStatus } from "@/redux/slices/payrollFreezeStatusSlice";

function Attendance() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
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

  const { employees = [], loading: employeesLoading } = useSelector(
    (state) => state.managerEmployee || {}
  );
  
  const [freezeCheckedMonth, setFreezeCheckedMonth] = useState(null);
  const [freezeCheckedYear, setFreezeCheckedYear] = useState(null);
  
  const { 
    freezeStatus, 
    checkLoading: freezeStatusLoading 
  } = useSelector((state) => state.payrollFreezeStatus);

  useEffect(() => {
    setIsLoading(false);
  }, []);

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
      
      // If API returns true, it means the month we checked is frozen
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

  useEffect(() => {
    dispatch(fetchManagerEmployees()).catch((err) => {
      setError("Failed to fetch employees");
      console.error("Error fetching employees:", err);
    });
  }, [dispatch]);

  // Check payroll freeze status when component mounts or month/year changes
  useEffect(() => {
    const companyId = sessionStorage.getItem("employeeCompanyId");
    if (companyId && selectedMonth && selectedYear) {
      const monthMap = {
        January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
        July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
      };
      
      const month = monthMap[selectedMonth];
      const year = parseInt(selectedYear);
      
      // Set the month/year being checked for freeze status
      setFreezeCheckedMonth(month);
      setFreezeCheckedYear(year);
      
      dispatch(checkPayrollFreezeStatus({
        companyId: companyId,
        year,
        month
      }));
    }
  }, [selectedMonth, selectedYear, dispatch]);

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
          role="MANAGER"
          isPayrollFrozen={isPayrollFrozen}
        />
      </div>
    </div>
  );
}

export default withAuth(Attendance);
