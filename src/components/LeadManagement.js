import React, { useState, useMemo, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaFilter,
  FaUserTie,
  FaPaintBrush,
  FaExclamationTriangle,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { jwtDecode } from "jwt-decode";
import ConvertLeadModal from "./Sales/ConvertLeadModal";
import LostLeadModal from "./LostLeadModal";
import JunkReasonModal from "./JunkReasonModal";
import {
  fetchLeads,
  fetchLeadById,
  createLead,
  updateLead,
} from "../redux/slices/leadsSlice";

// Default lead structure includes status and reasonForLost
const defaultLeadData = {
  name: "",
  contactNumber: "",
  email: "",
  propertyType: "",
  projectAddress: "",
  expectedBudget: "",
  status: "New", // Default status
  salesRep: null,
  designer: null,
  callDescription: null,
  callHistory: [],
  nextCall: null,
  quotedAmount: null,
  finalQuotation: null,
  signupAmount: null,
  paymentDate: null,
  paymentMode: null,
  panNumber: null,
  projectTimeline: null,
  discount: null,
  reasonForLost: null,
  reasonForJunk: null,
  submittedBy: null, // Added submittedBy for My Submitted Leads
  // New fields to store file names (or URLs after upload)
  paymentDetailsFileName: null,
  bookingFormFileName: null,
};

const LeadManagement = ({ role }) => {
  const dispatch = useDispatch();

  const { leads, loading, error } = useSelector((state) => state.leads);

  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formData, setFormData] = useState(defaultLeadData);
  const [initialFormDataOnEdit, setInitialFormDataOnEdit] = useState(null);
  const [filterText, setFilterText] = useState("");

  const isManager = role === "MANAGER"; // Check if role is 'MANAGER'
  const isSales = role === "EMPLOYEE"; // Check if role is 'sales'

  const propertyTypes = [
    "2 BHK Flat",
    "3 BHK Flat",
    "4 BHK Flat",
    "2 BHK Villa",
    "3 BHK Villa",
    "4 BHK Villa",
    "Cave Dwelling",
    "Tree House",
    "Unknown", // Added types from sample data
  ];

  // Updated tabs based on recent PRDs
  const managerTabs = [
    "New",
    "Assigned",
    "In Progress",
    "Verified",
    "Converted",
    "Lost",
    "Junk",
  ];
  const salesTabs = [
    "Assigned Leads",
    "In Progress",
    "Verified",
    "Converted",
    "Lost",
    "Junk",
  ]; // Ensure all statuses are covered
  const salesReps = ["Alice", "Bob", "Charlie"]; // Example data
  const designers = ["David", "Eve", "Frank"]; // Example data

  // Default to 'Assigned Leads' for sales if available, otherwise first tab
  const [activeTab, setActiveTab] = useState(
    isManager
      ? "New"
      : isSales
      ? salesTabs.includes("Assigned Leads")
        ? "Assigned Leads"
        : salesTabs[0]
      : ""
  );
  const [showLostReasonModal, setShowLostReasonModal] = useState(false);
  const [leadToMarkLost, setLeadToMarkLost] = useState(null);
  const [isFormReadOnly, setIsFormReadOnly] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "" });
  // Add state for Convert modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [leadToConvertId, setLeadToConvertId] = useState(null);
  // State for Junk Reason Modal (optional, if needed)
  const [showJunkReasonModal, setShowJunkReasonModal] = useState(false);
  const [leadToMarkJunkId, setLeadToMarkJunkId] = useState(null);
  // State to track expanded rows for call history
  const [expandedRows, setExpandedRows] = useState(new Set());

  const { items } = useSelector((state) => state.sessionStorage);

  // Fetch user info only if the role is 'sales'
  useEffect(() => {
    if (isSales) {
      const getUserInfo = () => {
        try {
          const token = items?.token;
          if (token) {
            const decodedToken = jwtDecode(token);
            setUserInfo({
              name: decodedToken.name || "User",
            });
          }
        } catch (error) {
          setUserInfo({ name: "Error User" });
        }
      };
      getUserInfo();
    }
  }, [items, isSales]); // Rerun if items or isSales changes

  // Reset expanded rows when activeTab changes
  useEffect(() => {
    setExpandedRows(new Set());
  }, [activeTab]);

  // Fetch leads on component mount
  useEffect(() => {
    dispatch(fetchLeads());
  }, [dispatch]);

  // Filtering Logic
  const filteredLeads = useMemo(() => {
    let processedLeads = [...leads];

    // Apply tab filtering only for manager or sales roles
    if (isManager || isSales) {
      const statusMap = {
        "Assigned Leads": "Assigned",
        "In Progress": "In Progress",
        Verified: "Verified",
        Converted: "Converted",
        Lost: "Lost",
        Junk: "Junk",
      };
      // Determine the status to filter by based on the active tab
      const currentFilterStatus = isManager ? activeTab : statusMap[activeTab];

      if (isManager && activeTab === "New") {
        processedLeads = processedLeads.filter((lead) => lead.status === "New");
      } else if (isSales && activeTab === "My Submitted Leads") {
        // Keep My Submitted Leads logic if needed
        processedLeads = processedLeads.filter(
          (lead) => lead.submittedBy === userInfo.name
        );
      } else if (currentFilterStatus) {
        // Filter based on the mapped status for the active tab
        processedLeads = processedLeads.filter(
          (lead) => lead.status === currentFilterStatus
        );
      }
      // If no specific filter matches (e.g., 'My Submitted Leads' not in map), show all? Or handle explicitly.
      // Current logic will show all if currentFilterStatus is undefined.
    }

    // Apply text filter regardless of role
    if (filterText) {
      processedLeads = processedLeads.filter((lead) =>
        Object.entries(lead).some(([key, value]) => {
          // Exclude complex objects like callHistory from simple string search
          if (key === "id" || key === "callHistory") return false;
          return String(value).toLowerCase().includes(filterText.toLowerCase());
        })
      );
    }

    return processedLeads;
  }, [leads, filterText, activeTab, isManager, isSales, userInfo.name]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // If this is a sales rep or designer assignment
    if ((name === "salesRep" || name === "designer") && value) {
      // Only update status to "Assigned" if the current status is "New"
      if (formData.status === "New") {
        setFormData((prev) => ({ 
          ...prev, 
          [name]: value,
          status: "Assigned" 
        }));
        return;
      }
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for Sales: 'In Progress' -> 'Verified'
  const handleMarkVerified = (lead) => {
    dispatch(
      updateLead({
        leadId: lead.leadId,
        status: "Verified",
        name: lead.name,
        contactNumber: lead.contactNumber,
        email: lead.email,
        propertyType: lead.propertyType,
        projectAddress: lead.projectAddress,
        expectedBudget: lead.expectedBudget,
        salesRep: lead.salesRep,
        designer: lead.designer,
        callDescription: lead.callDescription,
        nextCall: lead.nextCall
      })
    ).then(() => {
      dispatch(fetchLeads()); // Refresh leads after update
      if (editingLead?.leadId === lead.leadId) {
        setShowForm(false);
        setEditingLead(null);
      }
      setActiveTab("Verified");
    });
  };

  // Handler for marking lead as Junk
  const promptMarkJunk = (leadId) => {
    setLeadToMarkJunkId(leadId);
    setShowJunkReasonModal(true);
    if (editingLead?.leadId === leadId) {
      setShowForm(false);
      setEditingLead(null);
    }
  };

  const handleJunkSubmit = (leadId, reason) => {
    const leadToMarkJunk = leads.find((lead) => lead.leadId === leadId);
    if (!leadToMarkJunk) {
      return;
    }
    
    dispatch(updateLead({ 
      leadId: leadId, 
      status: "Junk", 
      reasonForJunk: reason,
      name: leadToMarkJunk.name,
      contactNumber: leadToMarkJunk.contactNumber,
      email: leadToMarkJunk.email,
      propertyType: leadToMarkJunk.propertyType,
      projectAddress: leadToMarkJunk.projectAddress,
      expectedBudget: leadToMarkJunk.expectedBudget,
      salesRep: leadToMarkJunk.salesRep,
      designer: leadToMarkJunk.designer,
      callDescription: leadToMarkJunk.callDescription,
      nextCall: leadToMarkJunk.nextCall
    })).then(() => {
      dispatch(fetchLeads());
      setShowJunkReasonModal(false);
      setLeadToMarkJunkId(null);
      setActiveTab("Junk");
    });
  };

  // Submits the Lost reason
  const handleLostSubmit = (leadId, reason) => {
    const leadToMarkLost = leads.find((lead) => lead.leadId === leadId);
    dispatch(updateLead({ 
      leadId: leadId, 
      status: "Lost", 
      reasonForLost: reason, 
      name: leadToMarkLost.name,
      contactNumber: leadToMarkLost.contactNumber,
      email: leadToMarkLost.email,
      propertyType: leadToMarkLost.propertyType,
      projectAddress: leadToMarkLost.projectAddress,
      expectedBudget: leadToMarkLost.expectedBudget,
    })).then(() => {
      dispatch(fetchLeads()); // Refresh leads after update
      setShowLostReasonModal(false);
      setLeadToMarkLost(null);
      setActiveTab("Lost");
    });
  };

  // handleSubmit - Handles saving form data (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingLead && !hasFormChanged && !isFormReadOnly) {
      setShowForm(false);
      setEditingLead(null);
      setInitialFormDataOnEdit(null);
      return;
    }
    if (isFormReadOnly) {
      return;
    }

    try {
      // Create a clean payload with only non-empty values
      const cleanPayload = Object.entries(formData).reduce(
        (acc, [key, value]) => {
          // Skip empty strings, null, undefined, and empty arrays
          if (
            value !== "" &&
            value !== null &&
            value !== undefined &&
            !(Array.isArray(value) && value.length === 0)
          ) {
            // Convert numeric fields
            if (
              [
                "expectedBudget",
                "quotedAmount",
                "finalQuotation",
                "signupAmount",
              ].includes(key)
            ) {
              acc[key] = value === "" ? null : parseFloat(value);
            } else {
              acc[key] = value;
            }
          }
          return acc;
        },
        {}
      );

      // Ensure name is present
      if (!cleanPayload.name) {
        alert("Name is required");
        return;
      }

      // Set default status for new leads
      if (!editingLead) {
        cleanPayload.status = "New";
        if (isSales) {
          cleanPayload.submittedBy = userInfo.name;
        }
      }

      if (editingLead) {
        // Update existing lead
        const updatePayload = {
          ...cleanPayload,
          leadId: editingLead.leadId, // Ensure we're using leadId for updates
        };
        await dispatch(updateLead(updatePayload)).unwrap();
      } else {
        // Create new lead
        await dispatch(createLead(cleanPayload)).unwrap();
      }

      // Refresh the leads list after successful create/update
      await dispatch(fetchLeads());

      setShowForm(false);
      setEditingLead(null);
      setFormData(defaultLeadData);
      setInitialFormDataOnEdit(null);
      setIsFormReadOnly(false);
    } catch (error) {
      alert("Failed to save lead. Please try again.");
    }
  };

  // handleEdit - Prepares form for viewing/editing a lead
  const handleEdit = (lead) => {
    setExpandedRows(new Set()); // Collapse rows before showing form
    setEditingLead(lead);
    const formValues = { ...defaultLeadData }; // Start with default structure
    // Populate formValues with lead data, handling types and nulls
    for (const key in formValues) {
      if (lead.hasOwnProperty(key)) {
        if (
          typeof lead[key] === "number" &&
          (key.toLowerCase().includes("budget") ||
            key.toLowerCase().includes("amount"))
        ) {
          formValues[key] = String(lead[key]); // Convert numeric currency/amount fields to string for input
        } else if (key === "nextCall" && lead[key]) {
          // Ensure datetime-local input gets the correct format if editing
          try {
            // Attempt to format for datetime-local input
            formValues[key] = new Date(lead[key]).toISOString().slice(0, 16);
          } catch (e) {
            formValues[key] = lead[key]; // Fallback if formatting fails
          }
        } else {
          formValues[key] = lead[key] ?? ""; // Use empty string for null/undefined
        }
      }
    }
    // Explicitly set callHistory for potential display in form (even if not directly editable yet)
    formValues.callHistory = lead.callHistory || [];

    setFormData(formValues);
    setInitialFormDataOnEdit(JSON.parse(JSON.stringify(formValues))); // Deep copy for accurate change detection

    // Determine read-only state based on role and lead status (as per PRD)
    let readOnly = false;
    if (isManager && ["Lost", "Junk"].includes(lead.status)) {
      readOnly = true; // Manager Lost/Junk view is read-only
    } else if (isSales) {
      // Sales: Lost & Junk are read-only
      if (["Lost", "Junk"].includes(lead.status)) {
        readOnly = true;
      }
      // Sales: Verified & Converted rows ARE clickable and open an EDITABLE form per PRD.
      // 'Contacted' was previously read-only for sales, let's assume it should be editable too if Verified/Converted are.
      // 'In Progress' is editable. 'Assigned Leads' are editable (to start working).
      // So, only Lost/Junk are read-only for Sales when opening the form.
    }

    setIsFormReadOnly(readOnly);
    setShowForm(true);
  };

  const hasFormChanged = useMemo(() => {
    if (!editingLead || !initialFormDataOnEdit) return false;
    // More robust check needed if handling complex objects like callHistory
    return JSON.stringify(formData) !== JSON.stringify(initialFormDataOnEdit);
  }, [formData, initialFormDataOnEdit, editingLead]);

  const handleDelete = (leadId) => {
    // Consider adding confirmation
    dispatch(deleteLead(leadId));
  };

  // Function to toggle row expansion
  const toggleRowExpansion = (leadId) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  // getColumns - Updated based on PRD sections 1 & 2
  const getColumns = () => {
    let baseColumns = [
      { key: "leadId", label: "Lead ID" },
      { key: "name", label: "Name" },
      { key: "contactNumber", label: "Contact" },
      { key: "email", label: "Email" },
      { key: "propertyType", label: "Project Type" },
      { key: "projectAddress", label: "Project Address" },
      { key: "expectedBudget", label: "Budget" },
    ];

    // --- Sales Role Columns ---
    if (isSales) {
      switch (activeTab) {
        case "Assigned Leads":
          return [
            { key: "leadId", label: "Lead ID" },
            { key: "name", label: "Name" },
            { key: "contactNumber", label: "Contact" },
            { key: "email", label: "Email" },
            { key: "propertyType", label: "Project Type" },
            { key: "projectAddress", label: "Project Address" },
            { key: "expectedBudget", label: "Budget" },
          ];
        case "In Progress": // PRD Sec 2: Add Sales Rep/Designer
          return [
            { key: "leadId", label: "Lead ID" },
            { key: "name", label: "Name" },
            { key: "contactNumber", label: "Contact" },
            { key: "email", label: "Email" },
            { key: "projectAddress", label: "Project Address" },
            { key: "callDescription", label: "Latest Call Desc." },
            { key: "nextCall", label: "Next Follow Up" },
            { key: "salesRep", label: "Sales Rep" }, // Added
            { key: "designer", label: "Designer" }, // Added
            {
              key: "actions",
              label: "Actions",
              render: (lead) => (
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkVerified(lead);
                    }}
                    className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    ✅ Mark as Verified
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      promptMarkJunk(lead.leadId);
                    }}
                    className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    ❌ Mark as Junk
                  </button>
                </div>
              ),
            },
          ];
        case "Verified": // PRD Sec 2: Add Sales Rep/Designer
          return [
            { key: "leadId", label: "Lead ID" },
            { key: "name", label: "Name" },
            { key: "contactNumber", label: "Contact" },
            { key: "email", label: "Email" },
            { key: "propertyType", label: "Project Type" },
            { key: "callDescription", label: "Latest Call Desc." },
            { key: "nextCall", label: "Next Follow Up" },
            { key: "salesRep", label: "Sales Rep" }, // Added
            { key: "designer", label: "Designer" }, // Added
            {
              key: "actions",
              label: "Actions",
              render: (lead) => (
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkConverted(lead.leadId);
                    }}
                    className="text-xs bg-teal-100 text-teal-700 hover:bg-teal-200 px-3 py-1.5 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    ✅ Convert
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      promptMarkLost(lead.leadId);
                    }}
                    className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    ❌ Lost
                  </button>
                </div>
              ),
            },
          ];
        case "Converted": // PRD Sec 2: Add Sales Rep/Designer (Confirm they exist)
          // Check if Sales Rep/Designer are already present from previous edits
          let convertedColsSales = [
            { key: "leadId", label: "Lead ID" },
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "contactNumber", label: "Contact" },
            { key: "propertyType", label: "Project Type" },
            { key: "projectAddress", label: "Project Address" },
            { key: "expectedBudget", label: "Budget" },
            { key: "quotedAmount", label: "Initial Quote" },
            { key: "finalQuotation", label: "Final Quotation" },
            { key: "signupAmount", label: "Sign-up Amt" },
            { key: "paymentDate", label: "Payment Date" },
            { key: "paymentMode", label: "Payment Mode" },
            { key: "panNumber", label: "PAN" },
            { key: "projectTimeline", label: "Timeline" },
            // Ensure Sales Rep and Designer are included
            { key: "salesRep", label: "Sales Rep" },
            { key: "designer", label: "Designer" },
            { key: "discount", label: "Discount" },
            // Add columns for file status indicators
            { key: "paymentDetailsFileName", label: "Payment Docs" },
            { key: "bookingFormFileName", label: "Booking Form" },
            // No actions column per PRD
          ];
          // Remove duplicates just in case
          convertedColsSales = convertedColsSales.filter(
            (col, index, self) =>
              index === self.findIndex((c) => c.key === col.key)
          );
          return convertedColsSales;
        case "Lost":
          return [
            { key: "leadId", label: "Lead ID" },
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "contactNumber", label: "Contact Number" },
            { key: "reasonForLost", label: "Reason" },
          ];
        case "Junk":
          return [
            { key: "leadId", label: "Lead ID" },
            { key: "name", label: "Name" },
            { key: "contactNumber", label: "Contact Info" },
            { key: "callDescription", label: "Latest Call Desc." },
            { key: "reasonForJunk", label: "Reason for Junk" },
          ];
        default:
          return baseColumns.slice(0, 7);
      }
    }

    // --- Manager Role Columns ---
    if (isManager) {
      switch (activeTab) {
        case "New":
          return [
            { key: "leadId", label: "Lead ID" },
            ...baseColumns.slice(1, 7),
          ];
        case "Assigned":
          return [
            { key: "leadId", label: "Lead ID" },
            ...baseColumns.slice(1, 7),
            { key: "salesRep", label: "Sales Rep" },
            { key: "designer", label: "Designer" },
          ];
        case "In Progress": // PRD Sec 1: Remove Action; PRD Sec 2: Add Sales Rep/Designer
          return [
            // Match Sales 'In Progress' data columns
            { key: "leadId", label: "Lead ID" },
            { key: "name", label: "Name" },
            { key: "contactNumber", label: "Contact" },
            { key: "email", label: "Email" },
            { key: "projectAddress", label: "Project Address" },
            { key: "callDescription", label: "Latest Call Desc." },
            { key: "nextCall", label: "Next Follow Up" },
            // Add Sales Rep/Designer
            { key: "salesRep", label: "Sales Rep" },
            { key: "designer", label: "Designer" },
            // NO 'actions' column per PRD Sec 1
          ];
        case "Verified": // PRD Sec 1: Remove Action; PRD Sec 2: Add Sales Rep/Designer
          return [
            // Match Sales 'Verified' data columns
            { key: "leadId", label: "Lead ID" },
            { key: "name", label: "Name" },
            { key: "contactNumber", label: "Contact" },
            { key: "email", label: "Email" },
            { key: "propertyType", label: "Project Type" },
            { key: "callDescription", label: "Latest Call Desc." },
            { key: "nextCall", label: "Next Follow Up" },
            // Add Sales Rep/Designer
            { key: "salesRep", label: "Sales Rep" },
            { key: "designer", label: "Designer" },
            // NO 'actions' column per PRD Sec 1
          ];
        case "Converted": // PRD Sec 2: Add Sales Rep/Designer (Confirm they exist)
          let convertedColsManager = [
            { key: "leadId", label: "Lead ID" },
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "contactNumber", label: "Contact" },
            { key: "propertyType", label: "Project Type" },
            { key: "projectAddress", label: "Project Address" },
            { key: "expectedBudget", label: "Budget" },
            { key: "quotedAmount", label: "Initial Quote" },
            { key: "finalQuotation", label: "Final Quotation" },
            { key: "signupAmount", label: "Sign-up Amt" },
            { key: "paymentDate", label: "Payment Date" },
            { key: "paymentMode", label: "Payment Mode" },
            { key: "panNumber", label: "PAN" },
            { key: "projectTimeline", label: "Timeline" },
            // Ensure Sales Rep and Designer are included
            { key: "salesRep", label: "Sales Rep" },
            { key: "designer", label: "Designer" },
            { key: "discount", label: "Discount" },
            // No actions column for Manager in Converted either? PRD doesn't specify removal, but implies data columns. Assuming no actions.
          ];
          // Remove duplicates just in case
          convertedColsManager = convertedColsManager.filter(
            (col, index, self) =>
              index === self.findIndex((c) => c.key === col.key)
          );
          return convertedColsManager;
        case "Lost":
          return [
            { key: "leadId", label: "Lead ID" },
            { key: "name", label: "Name" },
            { key: "salesRep", label: "Sales Rep" },
            { key: "designer", label: "Designer" },
            { key: "reasonForLost", label: "Reason for Lost" },
          ];
        case "Junk":
          return [
            { key: "leadId", label: "Lead ID" },
            { key: "name", label: "Name" },
            { key: "salesRep", label: "Sales Rep" },
            { key: "designer", label: "Designer" },
          ];
        default:
          return baseColumns.slice(0, 7);
      }
    }
    return baseColumns.slice(0, 7);
  };

  const columns = getColumns();

  // renderCell - Ensure SalesRep/Designer display correctly
  const renderCell = (lead, columnKey) => {
    const value = lead[columnKey];
    const columnDef = columns.find((col) => col.key === columnKey);

    if (columnDef && columnDef.render) return columnDef.render(lead);

    switch (columnKey) {
      case "expectedBudget":
      case "quotedAmount":
      case "finalQuotation":
      case "signupAmount":
        const numericValue = parseFloat(value);
        return !isNaN(numericValue)
          ? numericValue.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })
          : "-";
      case "callDescription":
        const latestDesc = String(lead.callDescription || "-");
        const history = lead.callHistory || [];
        const hasHistory = history.length > 0;
        const isExpanded = expandedRows.has(lead.leadId);

        return (
          <div className="text-sm text-gray-600">
            <div className="flex items-start justify-between">
              <span title={latestDesc} className="flex-grow pr-2">
                {latestDesc.substring(0, 50)}
                {latestDesc.length > 50 ? "..." : ""}
              </span>
              {hasHistory && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRowExpansion(lead.leadId);
                  }}
                  className="text-blue-500 hover:text-blue-700 focus:outline-none text-xs flex-shrink-0"
                  aria-expanded={isExpanded}
                  title={isExpanded ? "Collapse history" : "Expand history"}
                >
                  {isExpanded ? (
                    <FaChevronUp size={12} />
                  ) : (
                    <FaChevronDown size={12} />
                  )}
                </button>
              )}
            </div>
            {isExpanded && hasHistory && (
              <div className="mt-2 pl-2 border-l-2 border-gray-200 space-y-1 max-h-32 overflow-y-auto text-xs text-gray-500">
                {[...history].reverse().map((entry, index) => (
                  <div
                    key={index}
                    className="pb-1 mb-1 border-b border-dashed border-gray-200 last:border-b-0"
                  >
                    <p className="font-medium text-gray-600">
                      {entry.text || "No description"}
                    </p>
                    <p>
                      <span className="italic">
                        {entry.date || "N/A"} {entry.timestamp || ""}
                      </span>
                      {entry.nextFollowUp && (
                        <span className="ml-2 font-semibold text-red-600">
                          Next: {new Date(entry.nextFollowUp).toLocaleString()}
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "salesRep":
      case "designer":
        // Display name or "Not Assigned"
        return (
          value || (
            <span className="text-xs text-gray-400 italic">Not Assigned</span>
          )
        );
      case "projectAddress":
      case "reasonForLost":
      case "reasonForJunk":
        const textToShow = String(value || "-");
        return (
          <span title={textToShow}>
            {textToShow.substring(0, 50)}
            {textToShow.length > 50 ? "..." : ""}
          </span>
        );
      case "nextCall":
        try {
          return value ? new Date(value).toLocaleString() : "-";
        } catch {
          return String(value || "-");
        }
      case "contactNumber":
        return value ?? "-";
      case "paymentDetailsFileName":
        return value ? (
          <span className="text-green-600 text-xs" title={value}>
            Payment Uploaded
          </span>
        ) : (
          "-"
        );
      case "bookingFormFileName":
        return value ? (
          <span className="text-green-600 text-xs" title={value}>
            Booking Form Uploaded
          </span>
        ) : (
          "-"
        );
      default:
        if (columnKey === "email") {
          return value ? (
            <a
              href={`mailto:${value}`}
              onClick={(e) => e.stopPropagation()}
              className="text-blue-600 hover:underline"
            >
              {value}
            </a>
          ) : (
            "-"
          );
        }
        return value ?? "-";
    }
  };

  // Action Handler: 'Assigned' -> 'In Progress'
  const handleStartWorking = (leadId) => {
    dispatch(
      updateLead({
        leadId: leadId,
        name: editingLead.name,
        contactNumber: editingLead.contactNumber,
        email: editingLead.email,
        propertyType: editingLead.propertyType,
        projectAddress: editingLead.projectAddress,
        expectedBudget: editingLead.expectedBudget,
        status: "In Progress",
      })
    ).then(() => {
      dispatch(fetchLeads()); // Refresh leads after update
      if (editingLead?.leadId === leadId) {
        setShowForm(false);
        setEditingLead(null);
      }
      setActiveTab("In Progress");
    });
  };

  // Handler potentially triggered by Sales form ('Contacted' -> 'Converted') or Manager
  const handleMarkConverted = (leadId) => {
    // Uses the promptMarkConverted -> ConvertLeadModal flow
    promptMarkConverted(leadId);
  };

  // Opens Convert Modal
  const promptMarkConverted = (leadId) => {
    const leadToConvert = leads.find((lead) => lead.leadId === leadId);
    if (leadToConvert) {
      setLeadToConvertId({
        leadId: leadId,
        initialQuote: leadToConvert.quotedAmount,
      });
      setShowConvertModal(true);
      if (editingLead?.leadId === leadId) {
        /* ... close form ... */
      }
    } else {
      console.error("Lead not found for conversion:", leadId);
    }
  };

  // Opens Lost Reason Modal
  const promptMarkLost = (leadId) => {
    setLeadToMarkLost(leadId);
    setShowLostReasonModal(true);
    if (editingLead?.leadId === leadId) {
      // Close form if open
      setShowForm(false);
      setEditingLead(null);
      setFormData(defaultLeadData); // Reset form data
      setInitialFormDataOnEdit(null);
    }
  };

  // Submits Convert Modal data - Handle finalQuotation
  const handleConvertSubmit = (leadId, conversionData) => {
    // Find the current lead to get basic details
    const currentLead = leads.find(lead => lead.leadId === leadId);
    
    if (!currentLead) {
      return;
    }

    // Create update payload with basic details and conversion data
    const updatePayload = {
      leadId: leadId,
      status: "Converted",
      // Include basic details
      name: currentLead.name,
      contactNumber: currentLead.contactNumber,
      email: currentLead.email,
      propertyType: currentLead.propertyType,
      projectAddress: currentLead.projectAddress,
      expectedBudget: currentLead.expectedBudget,
      salesRep: currentLead.salesRep,
      designer: currentLead.designer,
      // Include conversion details
      finalQuotation: parseFloat(conversionData.finalQuotation) || null,
      signupAmount: parseFloat(conversionData.signupAmount) || null,
      paymentDate: conversionData.paymentDate || null,
      paymentMode: conversionData.paymentMode || null,
      panNumber: conversionData.panNumber || null,
      projectTimeline: conversionData.projectTimeline || null,
      discount: conversionData.discount || null,
      paymentDetailsFileName: conversionData.paymentDetailsFile?.name || null,
      bookingFormFileName: conversionData.bookingFormFile?.name || null,
    };

    dispatch(updateLead(updatePayload)).then(() => {
      dispatch(fetchLeads()); // Refresh leads after update
      setShowConvertModal(false);
      setLeadToConvertId(null);
      setActiveTab("Converted");
    });
  };

  // Add this function near the top of the component
  const isFieldEditable = (fieldName) => {
    if (isFormReadOnly) return false;

    // If editing an existing lead
    if (editingLead) {
      // Lost and Junk leads are always read-only
      if (["Lost", "Junk"].includes(editingLead.status)) return false;

      // Sales role specific rules
      if (isSales) {
        // Sales can only edit certain fields in Verified/Converted status
        if (["Verified", "Converted"].includes(editingLead.status)) {
          return [
            "name",
            "contactNumber",
            "email",
            "propertyType",
            "projectAddress",
            "expectedBudget",
          ].includes(fieldName);
        }
        // Sales can edit all fields in other statuses
        return true;
      }

      // Manager can edit all fields except in Lost/Junk status
      return true;
    }

    // For new leads, all fields are editable
    return true;
  };

  return (
    <div className="p-6 pt-24 bg-gray-50 min-h-screen">
      {/* Title, Filter, Add Button */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Lead Management ({role})
        </h1>
        <div className="max-w-xs w-full">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 pointer-events-none">
              <FaFilter />
            </span>
            <input
              type="text"
              placeholder={`Filter leads...`}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Add Button - Below Title/Filter (Visible for Manager, Sales) */}
      {(isManager || isSales) && (
        <div className="mb-4">
          <button
            onClick={() => {
              setEditingLead(null);
              setFormData(defaultLeadData);
              setIsFormReadOnly(false);
              setShowForm(true);
              setInitialFormDataOnEdit(null);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition duration-150 ease-in-out"
          >
            <FaPlus /> Add Lead
          </button>
        </div>
      )}

      {/* Sales Tabs */}
      {isSales && (
        <div className="mb-4 border-b border-gray-200">
          <nav
            className="-mb-px flex space-x-6 overflow-x-auto"
            aria-label="Tabs"
          >
            {salesTabs.map((tab) => {
              let count = 0;
              const statusMap = {
                "Assigned Leads": "Assigned",
                "In Progress": "In Progress",
                Verified: "Verified",
                Converted: "Converted",
                Lost: "Lost",
                Junk: "Junk",
              };
              if (statusMap[tab]) {
                count = leads.filter(
                  (lead) => lead.status === statusMap[tab]
                ).length;
              }

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-3 px-2 border-b-2 font-medium text-sm focus:outline-none transition duration-150 ease-in-out`}
                >
                  {tab}{" "}
                  <span className="ml-1 text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5">
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Manager Tabs */}
      {isManager && (
        <div className="mb-4 border-b border-gray-200">
          <nav
            className="-mb-px flex space-x-6 overflow-x-auto"
            aria-label="Tabs"
          >
            {managerTabs.map((tab) => {
              let count = leads.filter((l) => l.status === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-3 px-2 border-b-2 font-medium text-sm focus:outline-none transition duration-150 ease-in-out`}
                >
                  {tab}{" "}
                  <span className="ml-1 text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5">
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* No Tabs for generic 'employee' role */}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-xl my-8 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingLead
                  ? `${isFormReadOnly ? "View" : "Edit"} Lead (ID: ${
                      editingLead.leadId
                    }) ${editingLead.status ? `[${editingLead.status}]` : ""}`
                  : "Add New Lead"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingLead(null);
                  setInitialFormDataOnEdit(null);
                  setIsFormReadOnly(false);
                  setExpandedRows(new Set());
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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

            <form
              onSubmit={handleSubmit}
              className="space-y-4 overflow-y-auto pr-2 flex-grow"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                    disabled={!isFieldEditable("name")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                    disabled={!isFieldEditable("contactNumber")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email ID
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={!isFieldEditable("email")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Project Type
                  </label>
                  <select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={!isFieldEditable("propertyType")}
                  >
                    <option value="">Select Project Type</option>
                    {propertyTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Project Address
                  </label>
                  <textarea
                    name="projectAddress"
                    value={formData.projectAddress}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={!isFieldEditable("projectAddress")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Expected Project Budget (₹)
                  </label>
                  <input
                    type="number"
                    name="expectedBudget"
                    value={formData.expectedBudget}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    min="0"
                    step="any"
                    disabled={!isFieldEditable("expectedBudget")}
                  />
                </div>
              </div>

              {/* Assignment Dropdowns (Only Manager can assign/edit assignment) */}
              {isManager && (
                <>
                  <hr className="my-4" />
                  <h3 className="text-md font-semibold text-gray-600 mb-2">
                    Assignment
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="salesRep"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Sales Representative
                      </label>
                      <select
                        id="salesRep"
                        name="salesRep"
                        value={formData.salesRep || ""}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={!isFieldEditable("salesRep")}
                      >
                        <option value="">Assign/Change Sales Rep</option>
                        {salesReps.map((rep) => (
                          <option key={rep} value={rep}>
                            {rep}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="designer"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Designer
                      </label>
                      <select
                        id="designer"
                        name="designer"
                        value={formData.designer || ""}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={!isFieldEditable("designer")}
                      >
                        <option value="">Assign/Change Designer</option>
                        {designers.map((des) => (
                          <option key={des} value={des}>
                            {des}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Display Assigned Reps (Visible to Sales if assigned, Readonly) */}
              {isSales &&
                editingLead &&
                (editingLead.salesRep || editingLead.designer) && (
                  <>
                    <hr className="my-4" />
                    <h3 className="text-md font-semibold text-gray-600 mb-2">
                      Assigned To
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {editingLead.salesRep && (
                        <div className="bg-gray-100 p-2 rounded border border-gray-200">
                          <p className="text-xs font-medium text-gray-500">
                            Sales Rep
                          </p>
                          <p className="text-sm font-semibold">
                            {editingLead.salesRep}
                          </p>
                        </div>
                      )}
                      {editingLead.designer && (
                        <div className="bg-gray-100 p-2 rounded border border-gray-200">
                          <p className="text-xs font-medium text-gray-500">
                            Designer
                          </p>
                          <p className="text-sm font-semibold">
                            {editingLead.designer}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

              {/* Call Description / Next Call Fields */}
              {editingLead &&
                (isSales
                  ? ["In Progress", "Verified"]
                  : ["In Progress"]
                ).includes(editingLead.status) &&
                !isFormReadOnly && (
                  <>
                    <hr className="my-4" />
                    <h3 className="text-md font-semibold text-gray-600 mb-2">
                      Follow-up Details
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Add/Edit Latest Call Description
                      </label>
                      <textarea
                        name="callDescription"
                        value={formData.callDescription || ""}
                        onChange={handleInputChange}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Next Call Date/Time
                      </label>
                      <input
                        type="datetime-local"
                        name="nextCall"
                        value={formData.nextCall || ""}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

              {/* Converted Fields (Only relevant for 'Converted' status) */}
              {editingLead &&
                editingLead.status === "Converted" &&
                !isFormReadOnly && (
                  <>
                    <hr className="my-4" />
                    <h3 className="text-md font-semibold text-gray-600 mb-2">
                      Conversion Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries({
                        quotedAmount: "Initial Quote",
                        finalQuotation: "Final Quotation",
                        signupAmount: "Sign-up Amount (₹)",
                        paymentDate: "Payment Date",
                        paymentMode: "Payment Mode",
                        panNumber: "PAN Number",
                        projectTimeline: "Project Timeline",
                        discount: "Discount (%)",
                      }).map(([key, label]) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700">
                            {label}
                          </label>
                          <input
                            type={
                              key === "paymentDate"
                                ? "date"
                                : key.includes("Amount")
                                ? "number"
                                : "text"
                            }
                            name={key}
                            value={formData[key] || ""}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            min="0"
                            step={key.includes("Amount") ? "any" : undefined}
                            placeholder={
                              key === "discount" ? "e.g., 10 or 5000" : ""
                            }
                            disabled={!isFieldEditable(key)}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              {/* Lost Reason (Display only) */}
              {editingLead && editingLead.status === "Lost" && (
                <>
                  <hr className="my-4" />
                  <h3 className="text-md font-semibold text-gray-600 mb-2">
                    Reason for Lost
                  </h3>
                  <div>
                    <textarea
                      value={formData.reasonForLost || "No reason provided."}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
                      disabled
                    />
                  </div>
                </>
              )}
              {/* Junk Reason (Display only - Placeholder) */}
              {editingLead && editingLead.status === "Junk" && (
                <>
                  <hr className="my-4" />
                  <h3 className="text-md font-semibold text-gray-600 mb-2">
                    Reason for Junk (Optional)
                  </h3>
                  <div>
                    <textarea
                      value={formData.reasonForJunk || "Marked as Junk."}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
                      disabled
                    />
                  </div>
                </>
              )}

              {/* Display Call History Read-only in Form? */}
              {editingLead &&
                formData.callHistory &&
                formData.callHistory.length > 0 && (
                  <>
                    <hr className="my-4" />
                    <h3 className="text-md font-semibold text-gray-600 mb-2">
                      Call History
                    </h3>
                    <div className="mt-2 pl-2 border-l-2 border-gray-200 space-y-1 max-h-40 overflow-y-auto text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      {[...formData.callHistory]
                        .reverse()
                        .map((entry, index) => (
                          <div
                            key={index}
                            className="pb-1 mb-1 border-b border-dashed border-gray-300 last:border-b-0"
                          >
                            <p className="font-medium text-gray-700">
                              {entry.text || "No description"}
                            </p>
                            <p>
                              <span className="italic">
                                {entry.date || "N/A"} {entry.timestamp || ""}
                              </span>
                              {entry.nextFollowUp && (
                                <span className="ml-2 font-semibold text-red-700">
                                  Next:{" "}
                                  {new Date(
                                    entry.nextFollowUp
                                  ).toLocaleString()}
                                </span>
                              )}
                            </p>
                          </div>
                        ))}
                    </div>
                  </>
                )}

              {/* Status Change Actions Footer (Conditional) */}
              {editingLead && !isFormReadOnly && (
                <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap justify-start gap-3 items-center">
                  <span className="text-sm font-medium text-gray-500 mr-2">
                    Actions:
                  </span>
                  {isManager &&
                    ["Assigned", "Verified", "In Progress"].includes(
                      editingLead.status
                    ) && (
                      <>
                        <button
                          type="button"
                          onClick={() => promptMarkLost(editingLead.leadId)}
                          className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          Mark Lost
                        </button>
                        <button
                          type="button"
                          onClick={() => promptMarkJunk(editingLead.leadId)}
                          className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          Mark as Junk
                        </button>
                      </>
                    )}
                  {isSales && editingLead.status === "Assigned" && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          handleStartWorking(editingLead.leadId);
                          setShowForm(false);
                        }}
                        className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Start Working
                      </button>
                      <button
                        type="button"
                        onClick={() => promptMarkJunk(editingLead.leadId)}
                        className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        Mark as Junk
                      </button>
                    </>
                  )}
                  {isSales && editingLead.status === "Verified" && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          promptMarkConverted(editingLead.leadId);
                        }}
                        className="text-xs bg-teal-100 text-teal-700 hover:bg-teal-200 px-3 py-1.5 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        Convert
                      </button>
                      <button
                        type="button"
                        onClick={() => promptMarkLost(editingLead.leadId)}
                        className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        Lost
                      </button>
                      <button
                        type="button"
                        onClick={() => promptMarkJunk(editingLead.leadId)}
                        className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        Mark as Junk
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Submit/Cancel Buttons Area (Sticky Footer within Modal) */}
              <div className="mt-auto pt-4 border-t border-gray-200 flex justify-end gap-4 bg-white sticky bottom-0 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingLead(null);
                    setInitialFormDataOnEdit(null);
                    setIsFormReadOnly(false);
                    setExpandedRows(new Set());
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                {!isFormReadOnly && (
                  <button
                    type="submit"
                    disabled={editingLead && !hasFormChanged}
                    className={`px-4 py-2 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ease-in-out ${
                      editingLead && !hasFormChanged
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                    }`}
                  >
                    {editingLead ? "Save Changes" : "Add Lead"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert Lead Modal */}
      <ConvertLeadModal
        isOpen={showConvertModal}
        onClose={() => {
          setShowConvertModal(false);
          setLeadToConvertId(null); // Reset object state
        }}
        onSubmit={handleConvertSubmit}
        leadData={leadToConvertId}
      />

      {/* Lost Lead Modal */}
      <LostLeadModal
        isOpen={showLostReasonModal}
        onClose={() => {
          setShowLostReasonModal(false);
          setLeadToMarkLost(null);
        }}
        onSubmit={handleLostSubmit}
        leadId={leadToMarkLost}
      />

      {/* Add JunkReasonModal */}
      <JunkReasonModal
        isOpen={showJunkReasonModal}
        onClose={() => {
          setShowJunkReasonModal(false);
          setLeadToMarkJunkId(null);
        }}
        onSubmit={handleJunkSubmit}
        leadId={leadToMarkJunkId}
      />

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    col.key === "leadId"
                      ? "w-24"
                      : col.key === "name"
                      ? "w-40"
                      : col.key === "contactNumber"
                      ? "w-32"
                      : col.key === "email"
                      ? "w-48"
                      : col.key === "projectAddress"
                      ? "w-64"
                      : col.key === "callDescription"
                      ? "w-64"
                      : col.key === "nextCall"
                      ? "w-40"
                      : "w-auto"
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLeads.map((lead) => {
              let isRowClickable = false;
              if (isManager && !["Lost", "Junk"].includes(lead.status)) {
                isRowClickable = true;
              } else if (isSales) {
                if (
                  ["Assigned", "In Progress", "Verified", "Converted"].includes(
                    lead.status
                  )
                ) {
                  const statusMap = {
                    "Assigned Leads": "Assigned",
                    "In Progress": "In Progress",
                    Verified: "Verified",
                    Converted: "Converted",
                    Lost: "Lost",
                    Junk: "Junk",
                  };
                  const statusForTab = statusMap[activeTab];
                  if (lead.status === statusForTab) {
                    isRowClickable = true;
                  }
                }
              }

              return (
                <tr
                  key={lead.leadId}
                  className={`${
                    isRowClickable
                      ? "hover:bg-gray-50 cursor-pointer"
                      : "bg-white"
                  } transition duration-150 ease-in-out`}
                  onClick={isRowClickable ? () => handleEdit(lead) : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-sm ${
                        col.key === "callDescription" ? "align-top" : ""
                      } ${
                        col.key === "name"
                          ? "text-gray-900 font-medium"
                          : "text-gray-600"
                      } truncate`}
                      title={!col.render ? lead[col.key] : ""}
                    >
                      <div
                        onClick={(e) => {
                          if (col.key === "email") e.stopPropagation();
                        }}
                      >
                        {renderCell(lead, col.key)}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
            {filteredLeads.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-10 text-center text-gray-500 italic"
                >
                  No leads found matching the current criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadManagement;
