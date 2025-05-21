/* eslint-disable react/jsx-key */
import React, { useCallback, useState, useEffect } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";

import {
  FaUser,
  FaClock,
  FaCreditCard,
  FaUsers,
} from "react-icons/fa";


import RequestDetails from "@/components/RequestDetails";

import Sidebar from "@/components/Sidebar";
import HradminNavbar from "@/components/HradminNavbar";

import { useSelector, useDispatch } from "react-redux";
import { fetchEmployees } from "@/redux/slices/employeeSlice";
import withAuth from "@/components/withAuth";
import { toast } from "sonner";
import axios from "axios";
import { getItemFromSessionStorage } from "@/redux/slices/sessionStorageSlice";
import getConfig from "next/config";
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A28BFE",
  "#82CA9D",
];

const Overview = () => {

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [showCharts, setShowCharts] = useState(false);

  const [activeIndex, setActiveIndex] = useState(null);

  const [showRequestDetails, setShowRequestDetails] = useState(false); // New state

  const [activeTab, setActiveTab] = useState("leaveRequests");

  const [profileUpdates, setProfileUpdates] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingCompOffs, setPendingCompOffs] = useState([]);

  const dispatch = useDispatch();
  const { employees, loading } = useSelector((state) => state.employees);

  const {publicRuntimeConfig} = getConfig();
  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleOpenRequestsClick = () => {
    setShowRequestDetails((prevShowRequestDetails) => !prevShowRequestDetails); // Toggle Request Details

    setShowCharts(false); // Ensure Charts are hidden
  };

  const fetchProfileUpdates = useCallback(async () => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const company = localStorage.getItem("selectedCompanyId");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      const response = await fetch(
        `${publicRuntimeConfig.apiURL}/hradmin/company/${company}/update-requests`,
        { headers }
      );
      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status} ${response.statusText}`
        );
      }
      const data = await response.json();
      setProfileUpdates(data);
    } catch (error) {
      toast.error(`Failed to fetch profile updates: ${error.message}`);
      setProfileUpdates([]);
    }
  }, [publicRuntimeConfig.apiURL]); // No dependencies; update if needed
  
  const fetchPendingRequests = useCallback(async () => {
    try {
      const token = getItemFromSessionStorage("token", null);
      const company = localStorage.getItem("selectedCompanyId");
      const response = await axios.get(
        `${publicRuntimeConfig.apiURL}/leave/status/${company}/Pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      if (response.data && Array.isArray(response.data.leaves)) {
        const regularLeaves = response.data.leaves.filter(
          (leave) => leave.leaveName !== "Comp-Off"
        );
        const compOffLeaves = response.data.leaves.filter(
          (leave) => leave.leaveName === "Comp-Off"
        );
  
        setPendingLeaves(regularLeaves);
        setPendingCompOffs(compOffLeaves);
      } else {
        setPendingLeaves([]);
        setPendingCompOffs([]);
      }
    } catch (error) {
      setPendingLeaves([]);
      setPendingCompOffs([]);
    }
  }, [publicRuntimeConfig.apiURL]); // No dependencies; update if needed
  
  useEffect(() => {
    fetchPendingRequests();
    fetchProfileUpdates();
  }, [fetchPendingRequests, fetchProfileUpdates]);

  const data = [
    { name: "Mon", present: 80, absent: 10, leave: 5 },

    { name: "Tue", present: 85, absent: 8, leave: 4 },

    { name: "Wed", present: 82, absent: 12, leave: 3 },

    { name: "Thu", present: 84, absent: 9, leave: 5 },

    { name: "Fri", present: 78, absent: 15, leave: 6 },
  ];

  const departmentData = [
    { name: "Engineering", value: 25 },

    { name: "Sales", value: 18 },

    { name: "Marketing", value: 12 },

    { name: "HR", value: 8 },

    { name: "Finance", value: 10 },

    { name: "Product", value: 15 },
  ];

  const overviewData = [
    {
      icon: <FaUser className="h-6 w-6 text-blue-500" />,
      label: "Total Employees",
      count: employees?.length ?? 0,
    },

    {
      icon: <FaClock className="h-6 w-6 text-yellow-500" />,
      label: "Pending Tasks",
      count:
        (profileUpdates.length || 0) + (pendingLeaves.length || 0) + (pendingCompOffs.length || 0),
    },

    {
      icon: <FaCreditCard className="h-6 w-6 text-purple-500" />,
      label: "Payroll Status",
      count: "Processed",
    },
  ];

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}

      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
        currentRole={"hr"}
      />

      {/* Main Content */}

      <div
        className={`flex-1 ${
          isSidebarCollapsed ? "ml-16" : "ml-64"
        } transition-all duration-300`}
      >
        {/* Navbar */}

        <HradminNavbar />

        {/* Page Content */}

        <div className="pt-24 px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 text-left">
              Company Overview Dashboard
            </h1>
          </div>

          {/* Overview Cards */}

          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 mb-6">
              {overviewData

                .filter((item) => item.label !== "Payroll Status")

                .map((item, index) =>
                  item.label === "Total Employees" ? (
                    <div
                      key={index}
                      className="p-8 bg-white shadow-lg rounded-xl flex flex-col justify-between items-start hover:shadow-2xl hover:scale-105 transform transition-all duration-300 cursor-pointer border border-gray-100"
                      style={{ height: "250px", width: "350px" }}
                    >
                      <div className="flex justify-between items-center w-full mb-8">
                        <p className="text-xl font-semibold text-gray-800">
                          {item.label}
                        </p>
                        <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-full">
                          <FaUsers className="text-blue-600 text-2xl" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-5xl font-bold text-gray-900">
                          {item.count}
                        </p>
                        <div className="flex items-center text-gray-600">
                          <p className="text-sm">Active employees</p>
                          <div className="ml-2 px-2 py-1 bg-blue-50 rounded-full">
                            <span className="text-xs text-blue-600 font-medium">
                              +12 from last month
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : item.label === "Pending Tasks" ? (
                    <div
                      key={index}
                      className="p-8 bg-white shadow-lg rounded-xl flex flex-col justify-between items-start hover:shadow-2xl hover:scale-105 transform transition-all duration-300 cursor-pointer border border-gray-100"
                      style={{ height: "250px", width: "350px" }}
                      onClick={handleOpenRequestsClick}
                    >
                      <div className="flex justify-between items-center w-full mb-8">
                        <p className="text-xl font-semibold text-gray-800">
                          {item.label}
                        </p>
                        <div className="p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-full">
                          <FaClock className="text-yellow-600 text-2xl" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-5xl font-bold text-gray-900">
                          {item.count}
                        </p>
                        <div className="flex items-center text-gray-600">
                          <p className="text-sm">Tasks pending</p>
                          <div className="ml-2 px-2 py-1 bg-yellow-50 rounded-full">
                            <span className="text-xs text-yellow-600 font-medium">
                              High priority
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={index}
                      className="p-8 bg-white shadow-lg rounded-xl flex flex-col justify-between items-start hover:shadow-2xl hover:scale-105 transform transition-all duration-300 cursor-pointer border border-gray-100"
                      style={{ height: "250px", width: "350px" }}
                    >
                      <div className="flex justify-between items-center w-full mb-8">
                        <p className="text-xl font-semibold text-gray-800">
                          {item.label}
                        </p>
                        <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-full">
                          <FaCreditCard className="text-purple-600 text-2xl" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-5xl font-bold text-gray-900">
                          {item.count}
                        </p>
                        <div className="flex items-center text-gray-600">
                          <p className="text-sm">Current status</p>
                          <div className="ml-2 px-2 py-1 bg-purple-50 rounded-full">
                            <span className="text-xs text-purple-600 font-medium">
                              March 2024
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
            </div>
          </div>

          {showCharts && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 shadow-md rounded-lg hover:shadow-[0_4px_10px_rgba(0,0,0,0.1)] transition-shadow duration-300">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Weekly Attendance
                </h2>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data}>
                    <XAxis
                      dataKey="name"
                      stroke="#6b7280"
                      tick={{
                        fontSize: 14,
                        fill: "#374151",
                        fontWeight: "bold",
                      }}
                      tickLine={false}
                      axisLine={false}
                    />

                    <YAxis
                      stroke="#d1d5db"
                      tick={{
                        fontSize: 14,
                        fill: "#374151",
                        fontWeight: "bold",
                      }}
                      tickFormatter={(value) => `${value}%`}
                      tickLine={false}
                      axisLine={false}
                    />

                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={false}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",

                        border: "1px solid #e5e7eb",

                        borderRadius: "8px",

                        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",

                        width: "200px",

                        padding: "10px",
                      }}
                      labelStyle={{
                        color: "#000000",

                        fontSize: "14px",

                        fontWeight: "bold",

                        marginBottom: "8px",
                      }}
                      itemStyle={{
                        color: "#374151",

                        fontSize: "12px",

                        display: "flex",

                        alignItems: "center",

                        gap: "8px",
                      }}
                      formatter={(value, name) => {
                        if (value !== undefined) {
                          return [
                            <span className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor:
                                    name === "present"
                                      ? "rgb(74, 222, 128)"
                                      : name === "absent"
                                      ? "rgb(248, 113, 113)"
                                      : "#FFBB28",
                                }}
                              ></span>

                              <span className="text-gray-600">
                                {name.charAt(0).toUpperCase() + name.slice(1)}
                              </span>
                            </span>,

                            <span className="font-bold">{value}%</span>,
                          ];
                        }

                        return null;
                      }}
                    />

                    <Bar
                      dataKey="present"
                      fill="rgb(74, 222, 128)"
                      barSize={40}
                      radius={[4, 4, 0, 0]}
                    />

                    <Bar
                      dataKey="absent"
                      fill="rgb(248, 113, 113)"
                      barSize={40}
                      radius={[4, 4, 0, 0]}
                    />

                    <Bar
                      dataKey="leave"
                      fill="#FFBB28"
                      barSize={40}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 shadow-md rounded-lg">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Department Distribution
                </h2>

                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={departmentData}
                      cx="35%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      // onMouseEnter={(data, index) => setActiveIndex(index)}

                      onMouseLeave={() => setActiveIndex(null)}
                    >
                      {departmentData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="none"
                        />
                      ))}
                    </Pie>

                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      wrapperStyle={{ paddingLeft: "20px" }}
                      content={() => (
                        <div>
                          {departmentData.map((entry, index) => (
                            <div key={index} className="flex items-center mb-3">
                              <span
                                className="w-3 h-3 rounded-full mr-2"
                                style={{
                                  backgroundColor:
                                    COLORS[index % COLORS.length],
                                }}
                              ></span>
                            </div>
                          ))}
                        </div>
                      )}
                    />

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {showRequestDetails && ( // Replace requestToggle with showRequestDetails
            <RequestDetails
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default withAuth(Overview);
