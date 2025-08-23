import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import {
  FaUsers,
  FaMoneyCheckAlt,
  FaCog,
  FaBuilding,
  FaCalendarAlt,
  FaAngleLeft,
  FaAngleRight,
  FaTasks,
  FaUserTie,
  FaChartLine,
  FaFileInvoiceDollar,
  FaHandshake,
  FaBoxes,
  FaClipboardList,
  FaUserCog,
  FaShieldAlt,
  FaChartBar,
  FaCrown,
  FaTimes,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";
import {
  Briefcase,
  Calendar,
  ChartColumnIncreasing,
  Clock,
  CreditCard,
  ReceiptIcon,
  Users,
  Wallet,
  Settings,
  BarChart3,
  FileText,
  Building2,
  UserCheck,
  Shield,
  TrendingUp,
  Database,
  Layers,
  List,
  Building,
} from "lucide-react";
import Link from "next/link";
import { getItemFromSessionStorage } from "@/redux/slices/sessionStorageSlice";
import { jwtDecode } from "jwt-decode";
import version from "../version";

// Define modular menu structure outside component to avoid recreation
const modularMenus = {
  // HR Module
  MOD_HR: {
    label: "Human Resources",
    icon: <Users className="w-5 h-5" />,
    items: [
      {
        label: "Dashboard",
        icon: <ChartColumnIncreasing className="w-4 h-4" />,
        link: "/hradmin/dashboard",
      },
      {
        label: "Employees",
        icon: <Users className="w-4 h-4" />,
        link: "/hradmin/employees",
      },
      {
        label: "Attendance",
        icon: <Clock className="w-4 h-4" />,
        link: "/hradmin/attendance",
      },
      {
        label: "Payroll",
        icon: <ReceiptIcon className="w-4 h-4" />,
        link: "/hradmin/payroll",
      },
      {
        label: "Settings",
        icon: <Settings className="w-4 h-4" />,
        hasSubmenu: true,
        menuKey: "hr-settings",
        subItems: [
          {
            label: "Organization",
            icon: <FaBuilding className="w-4 h-4" />,
            link: "/hradmin/settings/organization",
          },
          {
            label: "Payroll Settings",
            icon: <FaMoneyCheckAlt className="w-4 h-4" />,
            link: "/hradmin/settings/payrollsettings",
          },
          {
            label: "Leave Management",
            icon: <FaCalendarAlt className="w-4 h-4" />,
            link: "/hradmin/settings/leave",
          },
        ],
      },
    ],
  },

  // Sales Module
  MOD_SALES: {
    label: "Sales & Marketing",
    icon: <FaHandshake className="w-5 h-5" />,
    items: [
      {
        label: "Dashboard",
        icon: <ChartColumnIncreasing className="w-4 h-4" />,
        link: "/Sales/dashboard"
      },
      {
        label: "My Leads",
        icon: <FaTasks className="w-4 h-4" />,
        link: "/Sales/LeadManagement",
      },
      {
        label: "All Leads",
        icon: <FaUsers className="w-4 h-4" />,
        link: "/SalesManager/Manager",
      },
      {
        label: "Lost & Junk Leads",
        icon: <FaTimes className="w-4 h-4" />,
        link: "/Sales/lostJunk",
      },
      {
        label: "Converted Leads",
        icon: <FaCheckCircle className="w-4 h-4" />,
        link: "/Sales/closedConverted",
      },
      // {
      //   label: "Sales Settings",
      //   icon: <Settings className="w-4 h-4" />,
      //   link: "/SalesManager/setting",
      //   disabled: true,
      // },
    ],
  },

  // Accounting Module
  MOD_ACCOUNTANT: {
    label: "Accounting & Finance",
    icon: <FaFileInvoiceDollar className="w-5 h-5" />,
    items: [
      {
        label: "Dashboard",
        icon: <ChartColumnIncreasing className="w-4 h-4" />,
        link: "/account/dashboard",
      },
      {
        label: "Sales",
        icon: <FaUsers className="w-4 h-4" />,
        link: "/account/customers",
      },
      {
        label: "Purchases",
        icon: <FaBuilding className="w-4 h-4" />,
        link: "/account/vendor",
      },
      {
        label: "Reimbursements",
        icon: <FaUserTie className="w-4 h-4" />,
        link: "/account/employee",
      },
      {
        label: "Account Settings",
        icon: <Settings className="w-4 h-4" />,
        link: "/account/settings",
      },
    ],
  },

  MOD_ASSETS: {
    label: "Asset Management",
    icon: <FaBoxes className="w-5 h-5" />,
    items: [
      {
        label: "Home",
        icon: <FaBuilding className="w-4 h-4" />,
        link: "/asset-management",
      },
      {
        label: "Settings",
        icon: <Settings className="w-4 h-4" />,
        link: "/asset-management/settings",
      },
    ],
  },


  // Employee Module
  EMPLOYEE: {
    label: "My Portal",
    icon: <FaUserCog className="w-5 h-5" />,
    items: [
      {
        label: "Dashboard",
        icon: <ChartColumnIncreasing className="w-4 h-4" />,
        link: "/employee/dashboard",
      },
      {
        label: "Leave Management",
        icon: <Calendar className="w-4 h-4" />,
        link: "/employee/leaves",
      },
      {
        label: "Attendance",
        icon: <Clock className="w-4 h-4" />,
        link: "/employee/attendances",
      },
      {
        label: "My Payslips",
        icon: <ReceiptIcon className="w-4 h-4" />,
        link: "/employee/mypayslip",
      },
      {
        label: "Profile",
        icon: <FaUserTie className="w-4 h-4" />,
        link: "/employee/profile",
      },
    ],
  },

  // Manager Module
  MANAGER: {
    label: "My Team",
    icon: <Briefcase className="w-5 h-5" />,
    items: [
      {
        label: "Manager Dashboard",
        icon: <ChartColumnIncreasing className="w-4 h-4" />,
        link: "/manager/dashboard",
      },
      {
        label: "Team Overview",
        icon: <Users className="w-4 h-4" />,
        link: "/manager/team",
      },
      {
        label: "Team Attendance",
        icon: <Clock className="w-4 h-4" />,
        link: "/manager/attendance",
      },
    ],
  },
};

const Sidebar = ({ isCollapsed, toggleSidebar, autoExpand = true }) => {
  const [currentRole, setCurrentRole] = useState("");
  const [expandedMenus, setExpandedMenus] = useState({});
  const [department, setDepartment] = useState("");
  const [userRoles, setUserRoles] = useState([]);
  const [userModules, setUserModules] = useState([]);
  const router = useRouter();

  // Helper functions defined as regular functions instead of useCallback
  const hasAdminRole = () => {
    return userRoles.some(role => 
      role === "ADMIN" || 
      role === "COMPANY_HEAD" || 
      role.includes("ADMIN")
    );
  };

  const hasManagerRole = () => {
    return userRoles.some(role => 
      role === "MANAGER" || 
      role === "COMPANY_HEAD" ||
      role.includes("MANAGER")
    );
  };

  const isActiveLink = (link) => {
    if (!link) return false;
    
    // Special handling for asset management routes
    if (link === "/asset-management") {
      // Home should only be active on exact match, not on subpages
      return router.pathname === link;
    }
    
    // Special handling for employees route to include addNewEmployee
    if (link === "/hradmin/employees") {
      return router.pathname === link || router.pathname.startsWith("/hradmin/addNewEmployee");
    }
    
    // For other routes, use the existing logic
    return router.pathname === link || router.pathname.startsWith(link);
  };

  const isActiveParent = (item) => {
    if (!item.hasSubmenu) return false;
    return item.subItems.some((subItem) =>
      router.pathname.startsWith(subItem.link)
    );
  };

  // Get available modules based on roles and moduleIds
  const getAvailableModules = () => {
    const modules = [];
    const addedModules = new Set(); // To prevent duplicates
    
    // Check if user has COMPANY_HEAD role with empty moduleIds
    const isCompanyHead = userRoles.includes("COMPANY_HEAD") && userModules.length === 0;
    
    if (isCompanyHead) {
      // Show all modules for COMPANY_HEAD with empty moduleIds
      Object.entries(modularMenus).forEach(([key, module]) => {
        if (!addedModules.has(key)) {
          // Filter out Settings menu if user doesn't have admin role
          if (key === "MOD_HR") {
            const filteredModule = {
              ...module,
              items: module.items.filter(item => 
                item.label !== "Settings" || hasAdminRole()
              )
            };
            modules.push({ key, ...filteredModule });
          } else if (key === "MOD_SALES") {
            const isManagerOrAdmin = hasManagerRole() || hasAdminRole();
            const filteredItems = module.items.filter(item => {
              if (item.label === "Sales Settings") {
                return hasAdminRole();
              }
              if (item.label === "My Leads") {
                return !isManagerOrAdmin; // Hide My Leads for manager/admin
              }
              if (item.label === "All Leads") {
                return isManagerOrAdmin; // Show All Leads only for manager/admin
              }
              // Keep Dashboard for everyone
              return true;
            });
          
            const filteredModule = {
              ...module,
              items: filteredItems
            };
          
            modules.push({ key, ...filteredModule });
          } else if (key === "MOD_ACCOUNTANT") {
            // Filter out Account Settings menu if user doesn't have admin role
            const filteredModule = {
              ...module,
              items: module.items.filter(item => 
                item.label !== "Account Settings" || hasAdminRole()
              )
            };
            modules.push({ key, ...filteredModule });
          } else if (key === "MOD_ASSETS") {
            // Filter out Settings menu if user doesn't have admin role
            modules.push({ key, ...module });
          } else {
            modules.push({ key, ...module });
          }
          addedModules.add(key);
        }
      });
    } else {
      // Show modules based on moduleIds array
      userModules.forEach((moduleId) => {
        if (modularMenus[moduleId] && !addedModules.has(moduleId)) {
          // Filter out Settings menu if user doesn't have admin role
          if (moduleId === "MOD_HR") {
            const filteredModule = {
              ...modularMenus[moduleId],
              items: modularMenus[moduleId].items.filter(item => 
                item.label !== "Settings" || hasAdminRole()
              )
            };
            modules.push({ key: moduleId, ...filteredModule });
          } else if (moduleId === "MOD_SALES") {
            const isManagerOrAdmin = hasManagerRole() || hasAdminRole();
            // Filter Sales items: Dashboard for all; My Leads only for non-manager/non-admin; All Leads for manager/admin
            const filteredItems = modularMenus[moduleId].items.filter(item => {
              if (item.label === "Sales Settings") {
                return hasAdminRole();
              }
              if (item.label === "My Leads") {
                return !isManagerOrAdmin; // Hide My Leads for manager/admin
              }
              if (item.label === "All Leads") {
                return isManagerOrAdmin; // Show All Leads only for manager/admin
              }
              return true; // Dashboard
            });
          
            const filteredModule = {
              ...modularMenus[moduleId],
              items: filteredItems
            };
          
            modules.push({ key: moduleId, ...filteredModule });
          } else if (moduleId === "MOD_ACCOUNTANT") {
            // Filter out Account Settings menu if user doesn't have admin role
            const filteredModule = {
              ...modularMenus[moduleId],
              items: modularMenus[moduleId].items.filter(item => 
                item.label !== "Account Settings" || hasAdminRole()
              )
            };
            modules.push({ key: moduleId, ...filteredModule });
          } else if (moduleId === "MOD_ASSETS") {
            // Filter out Settings menu if user doesn't have admin role
            modules.push({ key: moduleId, ...modularMenus[moduleId] });
          } else {
            modules.push({ key: moduleId, ...modularMenus[moduleId] });
          }
          addedModules.add(moduleId);
        }
      });
      
      // Show role-specific modules based on user roles
      userRoles.forEach((role) => {
        if (modularMenus[role] && !addedModules.has(role)) {
          // Only show MANAGER module if user has MANAGER role
          if (role === "MANAGER" || role.includes("MANAGER")) {
            if (hasManagerRole()) {
              modules.push({ key: role, ...modularMenus[role] });
              addedModules.add(role);
            }
          } else {
            // Show other role-specific modules (like EMPLOYEE)
            modules.push({ key: role, ...modularMenus[role] });
            addedModules.add(role);
          }
        }
      });
    }

    return modules;
  };

  const isModuleActive = (module) => {
    return module.items.some((item) => {
      if (item.hasSubmenu) {
        return item.subItems.some((subItem) =>
          router.pathname.startsWith(subItem.link)
        );
      }
      return isActiveLink(item.link);
    });
  };

  useEffect(() => {
    const role = sessionStorage.getItem("currentRole");
    const dept = sessionStorage.getItem("departmentName");
    const token = getItemFromSessionStorage("token");
    
    setCurrentRole(role);
    setDepartment(dept);

    // Decode JWT token to get roles and moduleIds
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        if (decodedToken) {
          setUserRoles(decodedToken.roles || []);
          setUserModules(decodedToken.module_ids || []);
          console.log(decodedToken.module_ids);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }

    // Initialize Settings menu as expanded
    setExpandedMenus((prev) => ({
      ...prev,
      settings: true,
    }));
  }, []);

  // Auto-expand sidebar and select correct module based on current route
  useEffect(() => {
    if (userRoles.length > 0 && userModules.length >= 0 && router.pathname) {
      // Special case: if on /hradmin/addNewEmployee, force expand MOD_HR and select Employees
      if (router.pathname === "/hradmin/addNewEmployee") {
        setExpandedMenus((prev) => ({
          ...prev,
          MOD_HR: true,
        }));
        return;
      }
      // Calculate available modules here
      const availableModules = getAvailableModules();
      const currentPath = router.pathname;
      // Find which module contains the current route
      const activeModule = availableModules.find(module => 
        module.items.some(item => {
          if (item.hasSubmenu) {
            return item.subItems.some(subItem => 
              currentPath.startsWith(subItem.link)
            );
          }
          return currentPath.startsWith(item.link);
        })
      );
      if (activeModule) {
        // Expand the active module
        setExpandedMenus(prev => ({
          ...prev,
          [activeModule.key]: true
        }));
        // Also expand any submenus that contain the current route
        activeModule.items.forEach(item => {
          if (item.hasSubmenu) {
            const hasActiveSubItem = item.subItems.some(subItem => 
              currentPath.startsWith(subItem.link)
            );
            if (hasActiveSubItem) {
              setExpandedMenus(prev => ({
                ...prev,
                [item.menuKey]: true
              }));
            }
          }
        });
      }
    }
  }, [userRoles, userModules, router.pathname]);

  // Auto-expand modules when sidebar is collapsed
  useEffect(() => {
    if (isCollapsed && userRoles.length > 0) {
      const availableModules = getAvailableModules();
      const expandedModules = {};
      availableModules.forEach((module) => {
        expandedModules[module.key] = true;
        // Only expand submenus if they contain the active route
        module.items.forEach((item) => {
          if (item.menuKey && isActiveParent(item)) {
            expandedModules[item.menuKey] = true;
          }
        });
      });
      setExpandedMenus(expandedModules);
    }
  }, [isCollapsed, userRoles, userModules]);

  const toggleMenu = (menuKey) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey], // Toggle between true and false
    }));
  };

  return (
    <aside
      className={`fixed top-16 left-0 h-[calc(100vh-64px)] bg-white shadow-md transition-all duration-300 ease-in-out flex flex-col z-40 ${
        isCollapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Collapse/Expand Button */}
      <div className="absolute -right-4 top-3 z-50">
        <button
          onClick={toggleSidebar}
          className={`
            flex items-center justify-center w-8 h-8 
            rounded-full bg-white text-gray-600
            hover:text-blue-600 hover:bg-blue-50 shadow-md 
            transition-all duration-300 ease-in-out
            border border-gray-200
            transform hover:scale-105 active:scale-95 z-[9999]
          `}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <div className={`transform transition-transform duration-300 ease-in-out ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}>
            <FaAngleRight className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* Sidebar Header */}
      <div className="flex-shrink-0 pt-4 pb-2">
        <div className="px-4">
          {!isCollapsed && (
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {userRoles.includes("COMPANY_HEAD") && userModules.length === 0 
                ? "All Modules" 
                : "Available Modules"}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto sidebar-nav min-h-0">
        <ul className="space-y-1 px-2 pb-4">
          {getAvailableModules().map((module, moduleIndex) => {
            const isModuleExpanded = expandedMenus[module.key] || false;
            const isActive = isModuleActive(module);

            return (
              <li key={moduleIndex} className="relative">
                {/* Module Header */}
                <div
                  onClick={() => toggleMenu(module.key)}
                  className={`group flex items-center px-2 py-3 cursor-pointer transition-all duration-300 ease-in-out rounded-md ${
                    isCollapsed ? "justify-center" : "gap-3"
                  } ${
                    isActive
                      ? "text-blue-600 bg-blue-50 border-r-2 border-blue-600"
                      : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <span
                    className={`text-lg flex-shrink-0 ${
                      isActive
                        ? "text-blue-600"
                        : "group-hover:text-blue-600"
                    }`}
                  >
                    {module.icon}
                  </span>
                  {!isCollapsed && (
                    <>
                      <span className="text-sm font-medium flex-1 min-w-0 truncate">
                        {module.label}
                      </span>
                      <span className="transform transition-transform duration-200 flex-shrink-0">
                        {isModuleExpanded ? (
                          <FaAngleLeft className="w-3 h-3" />
                        ) : (
                          <FaAngleRight className="w-3 h-3" />
                        )}
                      </span>
                    </>
                  )}
                </div>

                {/* Module Items */}
                <div
                  className={`
                    ${isCollapsed ? "pl-0" : "pl-4"} 
                    mt-1 
                    transition-all duration-300 ease-in-out
                    overflow-hidden
                    ${isModuleExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
                  `}
                >
                  {module.items.map((item, itemIndex) => {
                    const isActive = isActiveLink(item.link);
                    const isParentActive = isActiveParent(item);
                    const isExpanded = item.menuKey
                      ? expandedMenus[item.menuKey]
                      : false;

                    return (
                      <div key={itemIndex}>
                        {item.hasSubmenu ? (
                          <div>
                            <div
                              onClick={() => toggleMenu(item.menuKey)}
                              className={`group flex items-center px-2 py-2 cursor-pointer transition-all duration-300 ease-in-out rounded-md ${
                                isCollapsed ? "justify-center" : "gap-3"
                              } ${
                                isParentActive
                                  ? "text-blue-600 bg-blue-50"
                                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                              }`}
                            >
                              <span
                                className={`text-base flex-shrink-0 ${
                                  isParentActive
                                    ? "text-blue-600"
                                    : "group-hover:text-blue-600"
                                }`}
                              >
                                {item.icon}
                              </span>
                              {!isCollapsed && (
                                <>
                                  <span className="text-sm flex-1 min-w-0 truncate">
                                    {item.label}
                                  </span>
                                  <span className="transform transition-transform duration-200 flex-shrink-0">
                                    {isExpanded ? (
                                      <FaAngleLeft className="w-3 h-3" />
                                    ) : (
                                      <FaAngleRight className="w-3 h-3" />
                                    )}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Submenu items */}
                            <div
                              className={`
                                ${isCollapsed ? "pl-0" : "pl-4"} 
                                mt-1 
                                transition-all duration-300 ease-in-out
                                overflow-hidden
                                ${isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
                              `}
                            >
                              {item.subItems.map((subItem, subIndex) => {
                                const isSubActive = isActiveLink(subItem.link);

                                return (
                                  <Link
                                    key={subIndex}
                                    href={subItem.link}
                                    prefetch={true}
                                    className={`
                                      flex items-center px-2 py-2 
                                      transition-all duration-200 
                                      rounded-md
                                      ${isCollapsed ? "justify-center" : "gap-3"}
                                      ${
                                        isSubActive
                                          ? "text-blue-600 bg-blue-50"
                                          : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                                      }
                                    `}
                                  >
                                    <span
                                      className={`text-sm flex-shrink-0 ${
                                        isSubActive ? "text-blue-600" : ""
                                      }`}
                                    >
                                      {subItem.icon}
                                    </span>
                                    {!isCollapsed && (
                                      <span className="text-xs min-w-0 truncate">
                                        {subItem.label}
                                      </span>
                                    )}
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`
                              group flex items-center px-2 py-2 
                              transition-all duration-300 ease-in-out
                              rounded-md
                              ${isCollapsed ? "justify-center" : "gap-3"}
                              ${
                                isActive
                                  ? "text-blue-600 bg-blue-50"
                                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                              }
                              ${item.disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
                            `}
                            aria-label={item.label}
                            title={item.disabled ? "This feature is in progress" : ""}
                            onClick={(e) => {
                              if (item.disabled) {
                                e.preventDefault();
                                e.stopPropagation();
                                return;
                              }
                              // For non-disabled items, navigate to the link
                              router.push(item.link);
                            }}
                          >
                            <span
                              className={`text-base flex-shrink-0 ${
                                isActive
                                  ? "text-blue-600"
                                  : "group-hover:text-blue-600"
                              }`}
                            >
                              {item.icon}
                            </span>
                            {!isCollapsed && (
                              <span className="text-sm min-w-0 truncate">{item.label}</span>
                            )}
                            {item.disabled ? (
                              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                                This feature is in progress
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* App Version at the bottom */}
      <div className="absolute bottom-4 right-0 w-full px-4 text-right">
        <span className="text-xs text-gray-400 font-mono select-none">v{version.version}</span>
      </div>
    </aside>
  );
};

export default Sidebar;