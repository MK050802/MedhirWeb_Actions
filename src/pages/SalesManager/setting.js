import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { fetchLeads, updateLead, createLead } from "@/redux/slices/leadsSlice";
import {
  fetchPipelines,
  createPipeline,
  deletePipeline,
} from "@/redux/slices/pipelineSlice";
import { fetchManagerEmployees } from "@/redux/slices/managerEmployeeSlice";
import MainLayout from "@/components/MainLayout";
import { toast } from "sonner";
import ConvertLeadModal from "@/components/Sales/ConvertLeadModal";
import LostLeadModal from "@/components/Sales/LostLeadModal";
import JunkReasonModal from "@/components/Sales/JunkReasonModal";
import AddLeadModal from "@/components/Sales/AddLeadModal";
import AdvancedScheduleActivityModal from "@/components/Sales/AdvancedScheduleActivityModal";
import KanbanBoard from "@/components/Sales/KanbanBoard";
import {
  FaPlus,
  FaCog,
  FaSearch,
  FaThLarge,
  FaListUl,
  FaCalendarAlt,
  FaChartBar,
  FaMapMarkerAlt,
  FaClock,
  FaChevronDown,
  FaTrash,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaStar,
  FaRegStar,
  FaRegCheckCircle,
  FaRegClock,
  FaRegSmile,
  FaRegFrown,
  FaRegMeh,
  FaRegAngry,
  FaRegSurprise,
  FaRegHeart,
  FaRegComment,
  FaRegBookmark,
  FaRegShareSquare,
  FaRegThumbsUp,
  FaRegThumbsDown,
  FaRegEye,
  FaRegEyeSlash,
  FaRegBell,
  FaRegBellSlash,
  FaRegCalendar,
  FaRegCalendarAlt,
  FaRegCalendarCheck,
  FaRegCalendarMinus,
  FaRegCalendarPlus,
  FaRegCalendarTimes,
  FaRegHourglass,
  FaRegHourglassHalf,
  FaRegHourglassStart,
  FaRegHourglassEnd,
  FaRegStopwatch,
  FaRegTimer,
  FaRegAlarmClock,
  FaRegAlarmExclamation,
  FaRegAlarmSnooze,
  FaRegAlarmPlus,
  FaRegAlarmOff,
  FaRegAlarmOn,
  FaRegAlarmCheck,
  FaRegAlarmEdit,
  FaStream,
  FaTasks,
  FaUserShield,
  FaSitemap,
  FaRobot,
  FaEnvelopeOpenText,
  FaPlay,
  FaQuestionCircle,
  FaRocket,
} from "react-icons/fa";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tooltip } from "recharts";
import withAuth from "@/components/withAuth";


const defaultLeadData = {
  name: "",
  contactNumber: "",
  email: "",
  propertyType: "",
  propertyType: "",
  address: "",
  area: "",
  budget: "",
  designStyle: "",
  leadSource: "",
  preferredContact: "",
  notes: "",
  status: "New",
  rating: 0,
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
  discount: null,
  reasonForLost: null,
  reasonForJunk: null,
  submittedBy: null,
  paymentDetailsFileName: null,
  bookingFormFileName: null,
};

const DeletePipelineModal = ({ isOpen, onClose, stages, onDeleteStages }) => {
  const [selectedStages, setSelectedStages] = useState([]);

  const handleStageToggle = (stage) => {
    setSelectedStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]
    );
  };

  const handleDelete = () => {
    if (selectedStages.length === 0) {
      toast.error("Please select at least one stage to delete");
      return;
    }
    onDeleteStages(selectedStages);
    setSelectedStages([]);
    onClose();
  };

  const handleSelectAll = () => {
    setSelectedStages(stages);
  };

  const handleDeselectAll = () => {
    setSelectedStages([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            Delete Pipeline Stages
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Select the pipeline stages you want to delete. This action cannot be
            undone.
          </p>

          <div className="flex gap-2 mb-4">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Deselect All
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {stages.map((stage) => (
              <label
                key={stage}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedStages.includes(stage)}
                  onChange={() => handleStageToggle(stage)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium">{stage}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-3 flex justify-end items-center gap-2 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={selectedStages.length === 0}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Delete{" "}
            {selectedStages.length > 0 ? `(${selectedStages.length})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
};

// MOCK DATA: Replace with your own if needed
const MOCK_LEADS = [
  {
    leadId: "LEAD101",
    name: "John Doe",
    contactNumber: "1234567890",
    email: "john@example.com",
    propertyType: "Residential",
    propertyType: "Apartment",
    address: "123 Main St",
    area: "1200",
    budget: "1500000",
    designStyle: "Modern",
    leadSource: "Website",
    preferredContact: "Phone",
    notes: "Interested in 2BHK",
    status: "New",
    rating: 2,
    salesRep: "Alice",
    designer: "Bob",
    callDescription: null,
    callHistory: [],
    nextCall: null,
    quotedAmount: null,
    finalQuotation: null,
    signupAmount: null,
    paymentDate: null,
    paymentMode: null,
    panNumber: null,
    discount: null,
    reasonForLost: null,
    reasonForJunk: null,
    submittedBy: "MANAGER",
    paymentDetailsFileName: null,
    bookingFormFileName: null,
    createdAt: "2024-05-10T09:00:00Z",
    activities: [
      {
        id: 1,
        type: "task",
        summary: "Follow-up call",
        dueDate: "2024-05-15",
        status: "done",
      },
      {
        id: 2,
        type: "meeting",
        summary: "Client meeting",
        dueDate: "2024-07-30",
        status: "pending",
      },
    ],
  },
  {
    leadId: "LEAD102",
    name: "Jane Smith",
    contactNumber: "9876543210",
    email: "jane@example.com",
    propertyType: "Commercial",
    propertyType: "Office",
    address: "456 Market St",
    area: "2000",
    budget: "3000000",
    designStyle: "Contemporary",
    leadSource: "Referral",
    preferredContact: "Email",
    notes: "Needs open workspace",
    status: "Contacted",
    rating: 3,
    salesRep: "Charlie",
    designer: "Dana",
    callDescription: null,
    callHistory: [],
    nextCall: null,
    quotedAmount: null,
    finalQuotation: null,
    signupAmount: null,
    paymentDate: null,
    paymentMode: null,
    panNumber: null,
    discount: null,
    reasonForLost: null,
    reasonForJunk: null,
    submittedBy: "MANAGER",
    paymentDetailsFileName: null,
    bookingFormFileName: null,
    createdAt: "2024-05-20T11:30:00Z",
    activities: [
      {
        id: 3,
        type: "call",
        summary: "Initial call",
        dueDate: "2024-05-21",
        status: "done",
      },
      {
        id: 4,
        type: "task",
        summary: "Send quote",
        dueDate: "2024-05-25",
        status: "pending",
      },
    ],
  },
  {
    leadId: "LEAD103",
    name: "Emily Davis",
    contactNumber: "1112223333",
    email: "emily@example.com",
    propertyType: "Residential",
    propertyType: "Villa",
    address: "789 Pine Ln",
    area: "2500",
    budget: "4000000",
    designStyle: "Minimalist",
    leadSource: "Social Media",
    preferredContact: "Email",
    notes: "Wants a minimalist design for a new villa.",
    status: "Qualified",
    rating: 3,
    salesRep: "Alice",
    designer: "Frank",
    callDescription: null,
    callHistory: [],
    nextCall: null,
    quotedAmount: null,
    finalQuotation: null,
    signupAmount: null,
    paymentDate: null,
    paymentMode: null,
    panNumber: null,
    discount: null,
    reasonForLost: null,
    reasonForJunk: null,
    submittedBy: "MANAGER",
    paymentDetailsFileName: null,
    bookingFormFileName: null,
    createdAt: "2024-06-01T14:00:00Z",
    activities: [],
  },
];

const LeadsTable = ({ leads }) => (
  <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Sales Rep</TableHead>
          <TableHead>Designer</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.leadId}>
            <TableCell className="font-medium">{lead.name}</TableCell>
            <TableCell>{lead.contactNumber}</TableCell>
            <TableCell>{lead.email}</TableCell>
            <TableCell>{lead.status}</TableCell>
            <TableCell>
              {lead.salesRep || (
                <span className="text-gray-400">Unassigned</span>
              )}
            </TableCell>
            <TableCell>
              {lead.designer || (
                <span className="text-gray-400">Unassigned</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

// Add these new components before the SettingsPage component

const PermissionsSettings = () => {
  const [roles, setRoles] = useState([
    {
      id: 1,
      name: "Sales Manager",
      permissions: [
        "view_all_leads",
        "edit_all_leads",
        "delete_leads",
        "manage_pipeline",
        "assign_leads",
        "view_reports",
      ],
    },
    {
      id: 2,
      name: "Sales Executive",
      permissions: [
        "view_own_leads",
        "edit_own_leads",
        "create_leads",
        "schedule_activities",
      ],
    },
    {
      id: 3,
      name: "Designer",
      permissions: [
        "view_assigned_leads",
        "edit_assigned_leads",
        "upload_designs",
      ],
    },
  ]);

  const [newRoleName, setNewRoleName] = useState("");
  const [isAddingRole, setIsAddingRole] = useState(false);

  const allPermissions = [
    { id: "view_all_leads", name: "View All Leads", category: "Leads" },
    { id: "view_own_leads", name: "View Own Leads", category: "Leads" },
    {
      id: "view_assigned_leads",
      name: "View Assigned Leads",
      category: "Leads",
    },
    { id: "edit_all_leads", name: "Edit All Leads", category: "Leads" },
    { id: "edit_own_leads", name: "Edit Own Leads", category: "Leads" },
    {
      id: "edit_assigned_leads",
      name: "Edit Assigned Leads",
      category: "Leads",
    },
    { id: "create_leads", name: "Create New Leads", category: "Leads" },
    { id: "delete_leads", name: "Delete Leads", category: "Leads" },
    {
      id: "assign_leads",
      name: "Assign Leads to Team",
      category: "Management",
    },
    {
      id: "manage_pipeline",
      name: "Manage Pipeline Stages",
      category: "Management",
    },
    {
      id: "view_reports",
      name: "View Reports & Analytics",
      category: "Reports",
    },
    {
      id: "schedule_activities",
      name: "Schedule Activities",
      category: "Activities",
    },
    { id: "upload_designs", name: "Upload Design Files", category: "Design" },
  ];

  const handleAddRole = () => {
    if (newRoleName.trim()) {
      const newRole = {
        id: Date.now(),
        name: newRoleName.trim(),
        permissions: [],
      };
      setRoles((prev) => [...prev, newRole]);
      setNewRoleName("");
      setIsAddingRole(false);
      toast.success("Role added successfully");
    }
  };

  const handlePermissionToggle = (roleId, permissionId) => {
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id === roleId) {
          const hasPermission = role.permissions.includes(permissionId);
          return {
            ...role,
            permissions: hasPermission
              ? role.permissions.filter((p) => p !== permissionId)
              : [...role.permissions, permissionId],
          };
        }
        return role;
      })
    );
  };

  const handleDeleteRole = (roleId) => {
    setRoles((prev) => prev.filter((role) => role.id !== roleId));
    toast.success("Role deleted successfully");
  };

  const permissionsByCategory = allPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div></div>
        <button
          onClick={() => setIsAddingRole(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <FaPlus /> Add Role
        </button>
      </div>

      {isAddingRole && (
        <div className="p-6 bg-gray-50 rounded-lg border">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Name
              </label>
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="Enter role name"
                className="border p-2 rounded-md w-full"
                autoFocus
              />
            </div>
            <button
              onClick={handleAddRole}
              className="px-4 py-2 bg-green-600 text-white rounded-md h-10"
            >
              Save Role
            </button>
            <button
              onClick={() => setIsAddingRole(false)}
              className="px-4 py-2 border rounded-md h-10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h4 className="text-xl font-bold text-gray-800">{role.name}</h4>
                <button
                  onClick={() => handleDeleteRole(role.id)}
                  className="text-gray-400 hover:text-red-600 p-2 rounded-full transition-colors duration-200"
                  title="Delete Role"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                {Object.entries(permissionsByCategory).map(
                  ([category, permissions]) => (
                    <div key={category} className="space-y-4">
                      <h5 className="font-semibold text-gray-700 text-base">
                        {category}
                      </h5>
                      <div className="space-y-3">
                        {permissions.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex items-center gap-3 cursor-pointer group"
                          >
                            <input
                              type="checkbox"
                              checked={role.permissions.includes(permission.id)}
                              onChange={() =>
                                handlePermissionToggle(role.id, permission.id)
                              }
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600 group-hover:text-gray-900">
                              {permission.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const WorkflowSettings = () => {
  const [workflows, setWorkflows] = useState([
    {
      id: 1,
      name: "Lead Conversion Approval",
      description: "Approval required before converting leads to customers",
      stages: [
        { id: 1, role: "Sales Executive", action: "Submit for Approval" },
        { id: 2, role: "Sales Manager", action: "Review & Approve" },
        { id: 3, role: "Admin", action: "Final Approval" },
      ],
      isActive: true,
    },
  ]);

  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    stages: [{ id: 1, role: "", action: "" }],
  });
  const [isAddingWorkflow, setIsAddingWorkflow] = useState(false);

  const availableRoles = [
    "Sales Executive",
    "Sales Manager",
    "Designer",
    "Admin",
  ];

  const handleAddWorkflow = () => {
    if (
      newWorkflow.name.trim() &&
      newWorkflow.stages.every((s) => s.role && s.action)
    ) {
      const workflow = {
        ...newWorkflow,
        id: Date.now(),
        isActive: true,
      };
      setWorkflows((prev) => [...prev, workflow]);
      setNewWorkflow({
        name: "",
        description: "",
        stages: [{ id: 1, role: "", action: "" }],
      });
      setIsAddingWorkflow(false);
      toast.success("Workflow created successfully");
    } else {
      toast.error("Please fill all required fields");
    }
  };

  const addStageToNewWorkflow = () => {
    setNewWorkflow((prev) => ({
      ...prev,
      stages: [...prev.stages, { id: Date.now(), role: "", action: "" }],
    }));
  };

  const updateNewWorkflowStage = (stageId, field, value) => {
    setNewWorkflow((prev) => ({
      ...prev,
      stages: prev.stages.map((stage) =>
        stage.id === stageId ? { ...stage, [field]: value } : stage
      ),
    }));
  };

  const removeStageFromNewWorkflow = (stageId) => {
    setNewWorkflow((prev) => ({
      ...prev,
      stages: prev.stages.filter((stage) => stage.id !== stageId),
    }));
  };

  const toggleWorkflowStatus = (workflowId) => {
    setWorkflows((prev) =>
      prev.map((workflow) =>
        workflow.id === workflowId
          ? { ...workflow, isActive: !workflow.isActive }
          : workflow
      )
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div></div>
        <button
          onClick={() => setIsAddingWorkflow(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <FaPlus /> Create Workflow
        </button>
      </div>

      {isAddingWorkflow && (
        <div className="bg-gray-50 border rounded-lg p-6">
          <h4 className="font-semibold mb-4 text-lg">Create New Workflow</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workflow Name
              </label>
              <input
                type="text"
                value={newWorkflow.name}
                onChange={(e) =>
                  setNewWorkflow((prev) => ({ ...prev, name: e.target.value }))
                }
                className="border p-2 rounded-md w-full"
                placeholder="e.g., High-Budget Lead Approval"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={newWorkflow.description}
                onChange={(e) =>
                  setNewWorkflow((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="border p-2 rounded-md w-full h-20"
                placeholder="Briefly describe what this workflow is for"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Approval Stages
                </label>
                <button
                  onClick={addStageToNewWorkflow}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Add Stage
                </button>
              </div>

              <div className="space-y-3">
                {newWorkflow.stages.map((stage, index) => (
                  <div
                    key={stage.id}
                    className="flex items-center gap-3 p-3 bg-white border rounded"
                  >
                    <span className="text-sm font-medium text-gray-500 w-8">
                      #{index + 1}
                    </span>
                    <select
                      value={stage.role}
                      onChange={(e) =>
                        updateNewWorkflowStage(stage.id, "role", e.target.value)
                      }
                      className="border p-2 rounded flex-1"
                    >
                      <option value="">Select Role</option>
                      {availableRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={stage.action}
                      onChange={(e) =>
                        updateNewWorkflowStage(
                          stage.id,
                          "action",
                          e.target.value
                        )
                      }
                      placeholder="Action description (e.g., Review Quote)"
                      className="border p-2 rounded flex-1"
                    />
                    {newWorkflow.stages.length > 1 && (
                      <button
                        onClick={() => removeStageFromNewWorkflow(stage.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddWorkflow}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Save Workflow
              </button>
              <button
                onClick={() => setIsAddingWorkflow(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className="bg-white border border-gray-200 rounded-xl shadow-sm"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-bold text-gray-800">
                    {workflow.name}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {workflow.description}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      workflow.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {workflow.isActive ? "Active" : "Inactive"}
                  </span>
                  <button
                    onClick={() => toggleWorkflowStatus(workflow.id)}
                    className="px-4 py-2 text-sm border rounded-md hover:bg-gray-100"
                  >
                    {workflow.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {workflow.stages.map((stage, index) => (
                  <React.Fragment key={stage.id}>
                    <div className="flex-shrink-0">
                      <div className="bg-gray-100 border text-gray-800 px-4 py-3 rounded-lg text-center">
                        <div className="font-bold text-sm">{stage.role}</div>
                        <div className="text-xs mt-1 text-gray-600">
                          {stage.action}
                        </div>
                      </div>
                    </div>
                    {index < workflow.stages.length - 1 && (
                      <FaChevronRight className="text-gray-300 flex-shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AutomationSettings = () => {
  const [rules, setRules] = useState([
    {
      id: 1,
      name: "New Lead Alert",
      trigger: "lead_created",
      conditions: [
        {
          id: 1,
          field: "leadSource",
          operator: "equals",
          value: "Website",
        },
      ],
      actions: [
        {
          id: 1,
          type: "send_notification",
          target: "sales_team",
          message: "New website lead received",
        },
      ],
      isActive: true,
    },
  ]);

  const [newRule, setNewRule] = useState(null); // Becomes object on "Create Rule"
  const [isAddingRule, setIsAddingRule] = useState(false);

  const triggers = [
    { id: "lead_created", name: "When Lead is Created" },
    { id: "lead_updated", name: "When Lead is Updated" },
    { id: "status_changed", name: "When Status Changes" },
    { id: "activity_overdue", name: "When Activity is Overdue" },
  ];

  const conditionFields = [
    { id: "leadSource", name: "Lead Source", type: "text" },
    { id: "propertyType", name: "Project Type", type: "text" },
    { id: "budget", name: "Budget", type: "number" },
    { id: "status", name: "Status", type: "text" },
    { id: "rating", name: "Rating", type: "number" },
  ];

  const operators = {
    text: [
      { id: "equals", name: "Equals" },
      { id: "not_equals", name: "Not Equals" },
      { id: "contains", name: "Contains" },
    ],
    number: [
      { id: "equals", name: "Equals" },
      { id: "not_equals", name: "Not Equals" },
      { id: "greater_than", name: "Greater Than" },
      { id: "less_than", name: "Less Than" },
    ],
  };

  const actionTypes = [
    { id: "send_notification", name: "Send Notification" },
    { id: "send_email", name: "Send Email" },
    { id: "assign_lead", name: "Assign Lead" },
    { id: "update_field", name: "Update Field" },
  ];

  const handleCreateRule = () => {
    setNewRule({
      id: `new_${Date.now()}`,
      name: "",
      trigger: "",
      conditions: [],
      actions: [],
      isActive: true,
    });
    setIsAddingRule(true);
  };

  const handleSaveRule = () => {
    if (!newRule.name || !newRule.trigger) {
      toast.error("Rule Name and Trigger are required.");
      return;
    }
    setRules((prev) => [...prev, { ...newRule, id: Date.now() }]);
    setIsAddingRule(false);
    setNewRule(null);
    toast.success("Automation rule created successfully");
  };

  const updateNewRule = (field, value) => {
    setNewRule((prev) => ({ ...prev, [field]: value }));
  };

  const addCondition = () => {
    updateNewRule("conditions", [
      ...newRule.conditions,
      { id: Date.now(), field: "", operator: "", value: "" },
    ]);
  };

  const updateCondition = (id, field, value) => {
    updateNewRule(
      "conditions",
      newRule.conditions.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      )
    );
  };

  const removeCondition = (id) => {
    updateNewRule(
      "conditions",
      newRule.conditions.filter((c) => c.id !== id)
    );
  };

  const addAction = () => {
    updateNewRule("actions", [
      ...newRule.actions,
      { id: Date.now(), type: "", target: "", message: "" },
    ]);
  };

  const updateAction = (id, field, value) => {
    updateNewRule(
      "actions",
      newRule.actions.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const removeAction = (id) => {
    updateNewRule(
      "actions",
      newRule.actions.filter((a) => a.id !== id)
    );
  };

  const toggleRuleStatus = (ruleId) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
      )
    );
  };

  const RuleBlock = ({ title, icon, children }) => (
    <div className="bg-white border rounded-lg">
      <div className="p-3 border-b bg-gray-50/50">
        <h5 className="font-semibold text-gray-700 flex items-center gap-2">
          {icon} {title}
        </h5>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );

  const renderRule = (rule) => {
    const trigger = triggers.find((t) => t.id === rule.trigger);
    return (
      <div className="space-y-4">
        <RuleBlock title="WHEN" icon={<FaPlay className="text-gray-400" />}>
          <p className="text-sm font-medium">
            {trigger?.name || "No trigger set"}
          </p>
        </RuleBlock>

        <RuleBlock
          title="IF"
          icon={<FaQuestionCircle className="text-gray-400" />}
        >
          {rule.conditions.length === 0 ? (
            <p className="text-sm text-gray-500">No conditions set.</p>
          ) : (
            rule.conditions.map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-sm">
                <span className="font-medium">
                  {conditionFields.find((f) => f.id === c.field)?.name}
                </span>
                <span className="text-gray-500">
                  {
                    (
                      operators[
                        conditionFields.find((f) => f.id === c.field)?.type
                      ] || []
                    ).find((o) => o.id === c.operator)?.name
                  }
                </span>
                <span className="font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {c.value}
                </span>
              </div>
            ))
          )}
        </RuleBlock>

        <RuleBlock title="THEN" icon={<FaRocket className="text-gray-400" />}>
          {rule.actions.length === 0 ? (
            <p className="text-sm text-gray-500">No actions set.</p>
          ) : (
            rule.actions.map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-sm">
                <span className="font-medium">
                  {actionTypes.find((t) => t.id === a.type)?.name}
                </span>
                <span className="text-gray-500">{a.target}</span>
                <span className="italic text-gray-600">
                  &quot;{a.message}&quot;
                </span>
              </div>
            ))
          )}
        </RuleBlock>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div></div>
        <button
          onClick={handleCreateRule}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <FaRobot /> Create Rule
        </button>
      </div>

      {isAddingRule && newRule && (
        <div className="bg-gray-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg space-y-6">
          <input
            type="text"
            value={newRule.name}
            onChange={(e) => updateNewRule("name", e.target.value)}
            placeholder="Enter Rule Name"
            className="w-full text-xl font-bold p-2 border-b-2 focus:outline-none focus:border-blue-500"
          />

          <RuleBlock title="WHEN" icon={<FaPlay className="text-gray-400" />}>
            <select
              value={newRule.trigger}
              onChange={(e) => updateNewRule("trigger", e.target.value)}
              className="border p-2 rounded-md w-full"
            >
              <option value="">Select a trigger...</option>
              {triggers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </RuleBlock>

          <RuleBlock
            title="IF"
            icon={<FaQuestionCircle className="text-gray-400" />}
          >
            {newRule.conditions.map((c) => {
              const selectedField = conditionFields.find(
                (f) => f.id === c.field
              );
              return (
                <div key={c.id} className="flex items-center gap-2">
                  <select
                    value={c.field}
                    onChange={(e) =>
                      updateCondition(c.id, "field", e.target.value)
                    }
                    className="border p-2 rounded"
                  >
                    <option value="">Field...</option>
                    {conditionFields.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={c.operator}
                    onChange={(e) =>
                      updateCondition(c.id, "operator", e.target.value)
                    }
                    className="border p-2 rounded"
                    disabled={!selectedField}
                  >
                    <option value="">Operator...</option>
                    {selectedField &&
                      operators[selectedField.type].map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                  </select>
                  <input
                    type={selectedField?.type || "text"}
                    value={c.value}
                    onChange={(e) =>
                      updateCondition(c.id, "value", e.target.value)
                    }
                    placeholder="Value"
                    className="border p-2 rounded flex-1"
                  />
                  <button
                    onClick={() => removeCondition(c.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <FaTrash />
                  </button>
                </div>
              );
            })}
            <button
              onClick={addCondition}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add Condition
            </button>
          </RuleBlock>

          <RuleBlock title="THEN" icon={<FaRocket className="text-gray-400" />}>
            {newRule.actions.map((a) => (
              <div key={a.id} className="flex items-center gap-2">
                <select
                  value={a.type}
                  onChange={(e) => updateAction(a.id, "type", e.target.value)}
                  className="border p-2 rounded"
                >
                  <option value="">Action...</option>
                  {actionTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={a.target}
                  onChange={(e) => updateAction(a.id, "target", e.target.value)}
                  placeholder="Target (e.g., role, email)"
                  className="border p-2 rounded flex-1"
                />
                <input
                  type="text"
                  value={a.message}
                  onChange={(e) =>
                    updateAction(a.id, "message", e.target.value)
                  }
                  placeholder="Message"
                  className="border p-2 rounded flex-1"
                />
                <button
                  onClick={() => removeAction(a.id)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
            <button
              onClick={addAction}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add Action
            </button>
          </RuleBlock>

          <div className="flex gap-3">
            <button
              onClick={handleSaveRule}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Save Rule
            </button>
            <button
              onClick={() => setIsAddingRule(false)}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="bg-white border border-gray-200 rounded-xl shadow-sm"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h4 className="text-xl font-bold text-gray-800">{rule.name}</h4>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      rule.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {rule.isActive ? "Active" : "Inactive"}
                  </span>
                  <button
                    onClick={() => toggleRuleStatus(rule.id)}
                    className="px-4 py-2 text-sm border rounded-md hover:bg-gray-100"
                  >
                    {rule.isActive ? "Disable" : "Enable"}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50/30">{renderRule(rule)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TemplatesSettings = () => {
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: "Welcome Email",
      type: "email",
      subject: "Welcome to ArunMedhir Interior Design",
      content:
        "Dear {name}, Thank you for your interest in our interior design services...",
      isActive: true,
    },
    {
      id: 2,
      name: "Follow-up SMS",
      type: "sms",
      subject: "",
      content:
        "Hi {name}, Following up on your interior design inquiry. Call us at {phone} for a free consultation.",
      isActive: true,
    },
  ]);

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    type: "email",
    subject: "",
    content: "",
  });
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [activeTab, setActiveTab] = useState("email");

  const handleAddTemplate = () => {
    if (newTemplate.name.trim() && newTemplate.content.trim()) {
      const template = {
        ...newTemplate,
        id: Date.now(),
        isActive: true,
      };
      setTemplates((prev) => [...prev, template]);
      setNewTemplate({ name: "", type: "email", subject: "", content: "" });
      setIsAddingTemplate(false);
      toast.success("Template created successfully");
    }
  };

  const toggleTemplateStatus = (templateId) => {
    setTemplates((prev) =>
      prev.map((template) =>
        template.id === templateId
          ? { ...template, isActive: !template.isActive }
          : template
      )
    );
  };

  const deleteTemplate = (templateId) => {
    setTemplates((prev) =>
      prev.filter((template) => template.id !== templateId)
    );
    toast.success("Template deleted successfully");
  };

  const emailTemplates = templates.filter((t) => t.type === "email");
  const smsTemplates = templates.filter((t) => t.type === "sms");

  const availableVariables = [
    "{name}",
    "{email}",
    "{phone}",
    "{propertyType}",
    "{budget}",
    "{address}",
    "{salesRep}",
    "{designer}",
  ];

  const renderTemplateList = (templateArray) => (
    <div className="space-y-4">
      {templateArray.map((template) => (
        <div key={template.id} className="border rounded-lg">
          <div className="p-4 border-b">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-800">{template.name}</h4>
                {template.subject && (
                  <p className="text-sm text-gray-600 font-medium mt-1">
                    Subject: {template.subject}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    template.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {template.isActive ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={() => toggleTemplateStatus(template.id)}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                >
                  {template.isActive ? "Disable" : "Enable"}
                </button>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="text-gray-400 hover:text-red-600 p-1"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-b-lg text-sm text-gray-700 whitespace-pre-wrap">
            {template.content}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div></div>
        <button
          onClick={() => setIsAddingTemplate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <FaEnvelopeOpenText /> Create Template
        </button>
      </div>

      {isAddingTemplate && (
        <div className="bg-gray-50 border rounded-lg p-6">
          <h4 className="font-semibold mb-4 text-lg">Create New Template</h4>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) =>
                    setNewTemplate((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="border p-2 rounded-md w-full"
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={newTemplate.type}
                  onChange={(e) =>
                    setNewTemplate((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                  className="border p-2 rounded-md w-full"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
            </div>

            {newTemplate.type === "email" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={newTemplate.subject}
                  onChange={(e) =>
                    setNewTemplate((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  className="border p-2 rounded-md w-full"
                  placeholder="Enter email subject"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                value={newTemplate.content}
                onChange={(e) =>
                  setNewTemplate((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                className="border p-2 rounded-md w-full h-32"
                placeholder="Enter template content. Use variables like {name}."
              />
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">
                  Click to insert variable:
                </p>
                <div className="flex flex-wrap gap-1">
                  {availableVariables.map((variable) => (
                    <button
                      key={variable}
                      onClick={() =>
                        setNewTemplate((prev) => ({
                          ...prev,
                          content: prev.content + ` ${variable} `,
                        }))
                      }
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                    >
                      {variable}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddTemplate}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Save Template
              </button>
              <button
                onClick={() => setIsAddingTemplate(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("email")}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === "email"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              Email Templates ({emailTemplates.length})
            </button>
            <button
              onClick={() => setActiveTab("sms")}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === "sms"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              SMS Templates ({smsTemplates.length})
            </button>
          </nav>
        </div>

        <div className="pt-6">
          {activeTab === "email" && renderTemplateList(emailTemplates)}
          {activeTab === "sms" && renderTemplateList(smsTemplates)}
        </div>
      </div>
    </div>
  );
};

// Add this new component after the other settings components

const StageDependentFormsSettings = ({ stages }) => {
  // Simplified state management
  const [selectedStage, setSelectedStage] = useState("");
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [activeTab, setActiveTab] = useState("builder");
  const [formConfig, setFormConfig] = useState({
    formName: "",
    description: "",
    fields: [],
  });
  const [selectedField, setSelectedField] = useState(null);
  const [previewData, setPreviewData] = useState({});

  const availableStages = stages;

  // Simplified field types - removed technical fields
  const fieldCategories = useMemo(
    () => ({
      "Basic Fields": [
        {
          type: "text",
          label: "Text Input",
          icon: "📝",
          description: "Single-line text field",
          defaultLabel: "Your answer",
        },
        {
          type: "textarea",
          label: "Textarea",
          icon: "📄",
          description: "Multi-line text area",
          defaultLabel: "Your detailed response",
        },
        {
          type: "number",
          label: "Number",
          icon: "🔢",
          description: "Numeric input",
          defaultLabel: "Enter number",
        },
        {
          type: "email",
          label: "Email",
          icon: "📧",
          description: "Email address field",
          defaultLabel: "Email address",
        },
        {
          type: "tel",
          label: "Phone",
          icon: "📞",
          description: "Phone number input",
          defaultLabel: "Phone number",
        },
        {
          type: "url",
          label: "Website URL",
          icon: "🔗",
          description: "Website address field",
          defaultLabel: "Website URL",
        },
        {
          type: "password",
          label: "Password",
          icon: "🔒",
          description: "Password input field",
          defaultLabel: "Password",
        },
      ],
      "Date/Time Fields": [
        {
          type: "date",
          label: "Date",
          icon: "📅",
          description: "Date picker",
          defaultLabel: "Select date",
        },
        {
          type: "datetime-local",
          label: "Date & Time",
          icon: "🕒",
          description: "Date and time picker",
          defaultLabel: "Select date and time",
        },
        {
          type: "time",
          label: "Time",
          icon: "⏰",
          description: "Time picker",
          defaultLabel: "Select time",
        },
      ],
      "Selection Fields": [
        {
          type: "select",
          label: "Dropdown",
          icon: "📋",
          description: "Single selection dropdown",
          defaultLabel: "Please select",
          defaultOptions: ["Option 1", "Option 2", "Option 3"],
        },
        {
          type: "radio",
          label: "Radio Buttons",
          icon: "🔘",
          description: "Single selection with radio buttons",
          defaultLabel: "Choose one option",
          defaultOptions: ["Option 1", "Option 2", "Option 3"],
        },
        {
          type: "checkbox",
          label: "Checkbox",
          icon: "☑️",
          description: "Yes/No checkbox",
          defaultLabel: "Check if applicable",
        },
        {
          type: "multiselect",
          label: "Multiple Choice",
          icon: "📑",
          description: "Select multiple options",
          defaultLabel: "Select all that apply",
          defaultOptions: ["Option 1", "Option 2", "Option 3"],
        },
        {
          type: "toggle",
          label: "Toggle Switch",
          icon: "🔄",
          description: "On/Off toggle switch",
          defaultLabel: "Enable option",
        },
      ],
      "File & Media": [
        {
          type: "file",
          label: "File Upload",
          icon: "📎",
          description: "Upload documents or files",
          defaultLabel: "Choose file",
        },
        {
          type: "image",
          label: "Image Upload",
          icon: "🖼️",
          description: "Upload images or photos",
          defaultLabel: "Upload image",
        },
      ],
      "Interactive Fields": [
        {
          type: "range",
          label: "Range Slider",
          icon: "🎚️",
          description: "Select value from a range",
          defaultLabel: "Select value",
        },
        {
          type: "color",
          label: "Color Picker",
          icon: "🎨",
          description: "Pick a color",
          defaultLabel: "Pick a color",
        },
        {
          type: "rating",
          label: "Star Rating",
          icon: "⭐",
          description: "Rate with stars (1-5)",
          defaultLabel: "Rate this",
        },
      ],
      "Layout Elements": [
        {
          type: "heading",
          label: "Section Heading",
          icon: "📖",
          description: "Add section titles to organize your form",
          defaultLabel: "Section Title",
        },
        {
          type: "separator",
          label: "Divider Line",
          icon: "➖",
          description: "Add a line to separate sections",
          defaultLabel: "",
        },
      ],
    }),
    []
  );

  // Simple field creation
  const createField = useCallback(
    (type) => {
      const fieldType = Object.values(fieldCategories)
        .flat()
        .find((f) => f.type === type);

      const newField = {
        id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        label: fieldType.defaultLabel,
        placeholder: "",
        required: false,
        helpText: "",
        options: fieldType.defaultOptions || [],
        // Additional properties for specific field types
        min: type === "range" ? 0 : undefined,
        max: type === "range" ? 100 : undefined,
        step: type === "range" ? 1 : undefined,
        accept: type === "image" ? "image/*" : undefined,
        multiple: false,
        rows: type === "textarea" ? 4 : undefined,
        maxRating: type === "rating" ? 5 : undefined,
      };

      setFormConfig((prev) => ({
        ...prev,
        fields: [...prev.fields, newField],
      }));
      setSelectedField(newField);
    },
    [fieldCategories]
  );

  // Simple field operations
  const updateField = useCallback(
    (fieldId, updates) => {
      setFormConfig((prev) => ({
        ...prev,
        fields: prev.fields.map((field) =>
          field.id === fieldId ? { ...field, ...updates } : field
        ),
      }));

      if (selectedField?.id === fieldId) {
        setSelectedField((prev) => ({ ...prev, ...updates }));
      }
    },
    [selectedField]
  );

  const removeField = useCallback(
    (fieldId) => {
      setFormConfig((prev) => ({
        ...prev,
        fields: prev.fields.filter((field) => field.id !== fieldId),
      }));
      if (selectedField?.id === fieldId) {
        setSelectedField(null);
      }
    },
    [selectedField]
  );

  const moveField = useCallback((fieldId, direction) => {
    setFormConfig((prev) => {
      const fields = [...prev.fields];
      const currentIndex = fields.findIndex((f) => f.id === fieldId);
      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (newIndex >= 0 && newIndex < fields.length) {
        [fields[currentIndex], fields[newIndex]] = [
          fields[newIndex],
          fields[currentIndex],
        ];
      }

      return { ...prev, fields };
    });
  }, []);

  // Enhanced Field Palette with Categories
  const SimpleFieldPalette = () => (
    <div className="w-80 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-800 mb-1">📋 Add Fields</h3>
        <p className="text-sm text-gray-600">
          Click on any field type to add it to your form
        </p>
      </div>

      <div className="p-4 space-y-6">
        {Object.entries(fieldCategories).map(([category, fields]) => (
          <div key={category}>
            <h4 className="font-medium text-gray-700 mb-3 text-sm uppercase tracking-wide border-b pb-1">
              {category}
            </h4>
            <div className="space-y-2">
              {fields.map((field) => (
                <button
                  key={field.type}
                  onClick={() => createField(field.type)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{field.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 group-hover:text-blue-600 mb-1 text-sm">
                        {field.label}
                      </div>
                      <div className="text-xs text-gray-600 leading-tight">
                        {field.description}
                      </div>
                    </div>
                    <div className="text-blue-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      + Add
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Enhanced Field Preview with all field types
  const SimpleFieldPreview = ({ field, isLive = false }) => {
    const fieldValue = isLive ? previewData[field.id] : "";
    const setValue = (value) => {
      if (isLive) {
        setPreviewData((prev) => ({ ...prev, [field.id]: value }));
      }
    };

    const renderField = () => {
      switch (field.type) {
        case "text":
        case "email":
        case "tel":
        case "url":
        case "password":
          return (
            <input
              type={field.type}
              placeholder={
                field.placeholder || `Enter your ${field.label.toLowerCase()}`
              }
              value={fieldValue}
              onChange={(e) => setValue(e.target.value)}
              required={field.required}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              disabled={!isLive}
            />
          );

        case "number":
          return (
            <input
              type="number"
              placeholder={field.placeholder || "Enter a number"}
              value={fieldValue}
              onChange={(e) => setValue(e.target.value)}
              required={field.required}
              min={field.min}
              max={field.max}
              step={field.step}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              disabled={!isLive}
            />
          );

        case "textarea":
          return (
            <textarea
              placeholder={
                field.placeholder || `Enter your ${field.label.toLowerCase()}`
              }
              value={fieldValue}
              onChange={(e) => setValue(e.target.value)}
              required={field.required}
              rows={field.rows || 4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              disabled={!isLive}
            />
          );

        case "date":
        case "datetime-local":
        case "time":
          return (
            <input
              type={field.type}
              value={fieldValue}
              onChange={(e) => setValue(e.target.value)}
              required={field.required}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              disabled={!isLive}
            />
          );

        case "radio":
          return (
            <div className="space-y-2">
              {(field.options || []).map((option, idx) => (
                <label key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={field.id}
                    value={option}
                    checked={fieldValue === option}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={!isLive}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          );

        case "checkbox":
          return (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!fieldValue}
                onChange={(e) => setValue(e.target.checked)}
                disabled={!isLive}
                className="w-4 h-4 text-blue-600"
              />
              <span>{field.label}</span>
            </label>
          );

        case "multiselect":
          return (
            <div className="space-y-2">
              {(field.options || []).map((option, idx) => (
                <label key={idx} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={option}
                    checked={
                      Array.isArray(fieldValue)
                        ? fieldValue.includes(option)
                        : false
                    }
                    onChange={(e) => {
                      if (isLive) {
                        const currentValues = Array.isArray(fieldValue)
                          ? fieldValue
                          : [];
                        if (e.target.checked) {
                          setValue([...currentValues, option]);
                        } else {
                          setValue(currentValues.filter((v) => v !== option));
                        }
                      }
                    }}
                    disabled={!isLive}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          );

        case "select":
          return (
            <select
              value={fieldValue}
              onChange={(e) => setValue(e.target.value)}
              required={field.required}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              disabled={!isLive}
            >
              <option value="">Please select...</option>
              {(field.options || []).map((option, idx) => (
                <option key={idx} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );

        case "toggle":
          return (
            <label className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={!!fieldValue}
                  onChange={(e) => setValue(e.target.checked)}
                  disabled={!isLive}
                  className="sr-only"
                />
                <div
                  className={`w-11 h-6 rounded-full transition-colors ${
                    fieldValue ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition-transform m-0.5 ${
                      fieldValue ? "translate-x-5" : "translate-x-0"
                    }`}
                  ></div>
                </div>
              </div>
              <span>{field.label}</span>
            </label>
          );

        case "file":
        case "image":
          return (
            <input
              type="file"
              accept={field.accept}
              multiple={field.multiple}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              disabled={!isLive}
            />
          );

        case "range":
          return (
            <div>
              <input
                type="range"
                min={field.min || 0}
                max={field.max || 100}
                step={field.step || 1}
                value={fieldValue || field.min || 0}
                onChange={(e) => setValue(e.target.value)}
                className="w-full"
                disabled={!isLive}
              />
              <div className="text-sm text-center text-gray-600 mt-1">
                {fieldValue || field.min || 0}
              </div>
            </div>
          );

        case "color":
          return (
            <input
              type="color"
              value={fieldValue || "#000000"}
              onChange={(e) => setValue(e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-md"
              disabled={!isLive}
            />
          );

        case "rating":
          return (
            <div className="flex gap-1">
              {[...Array(field.maxRating || 5)].map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => isLive && setValue(idx + 1)}
                  className={`text-2xl ${
                    idx < (fieldValue || 0)
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                  disabled={!isLive}
                >
                  ⭐
                </button>
              ))}
            </div>
          );

        case "separator":
          return <hr className="border-gray-300 w-full my-4" />;

        case "heading":
          return (
            <h3 className="text-lg font-semibold text-gray-800">
              {field.label}
            </h3>
          );

        default:
          return <div className="text-gray-500">Unknown field type</div>;
      }
    };

    return (
      <div className="space-y-2">
        {!["separator", "heading"].includes(field.type) && (
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        {renderField()}
        {field.helpText && (
          <p className="text-sm text-gray-600">{field.helpText}</p>
        )}
      </div>
    );
  };

  // Enhanced Properties Panel with field-specific settings
  const SimplePropertiesPanel = () => {
    if (!selectedField) {
      return (
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          <div className="text-center text-gray-500">
            <div className="text-3xl mb-2">⚙️</div>
            <p className="mb-4">Select a field to edit its settings</p>
            <div className="text-left space-y-2 text-sm">
              <p>
                💡 <strong>Quick Tips:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>
                  Click &quot;Edit&quot; on any field to change its settings
                </li>
                <li>Use ⬆️⬇️ arrows to reorder fields</li>
                <li>Switch to Preview to see how your form looks</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    const fieldType = Object.values(fieldCategories)
      .flat()
      .find((f) => f.type === selectedField.type);

    return (
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-800">✏️ Edit Field</h3>
          <p className="text-sm text-gray-600">{fieldType?.label}</p>
        </div>

        <div className="p-4 space-y-4">
          {/* Basic Settings */}
          {!["separator"].includes(selectedField.type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedField.type === "heading"
                  ? "Section Title"
                  : "Question/Label"}
              </label>
              <input
                type="text"
                value={selectedField.label}
                onChange={(e) =>
                  updateField(selectedField.id, { label: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your question"
              />
            </div>
          )}

          {/* Placeholder for input fields */}
          {[
            "text",
            "textarea",
            "email",
            "tel",
            "number",
            "url",
            "password",
          ].includes(selectedField.type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Placeholder Text
              </label>
              <input
                type="text"
                value={selectedField.placeholder || ""}
                onChange={(e) =>
                  updateField(selectedField.id, { placeholder: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Hint text for users"
              />
            </div>
          )}

          {/* Required field setting */}
          {!["separator", "heading", "progress", "computed"].includes(
            selectedField.type
          ) && (
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedField.required || false}
                  onChange={(e) =>
                    updateField(selectedField.id, {
                      required: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Required field
                </span>
              </label>
            </div>
          )}

          {/* Help text */}
          {!["separator", "heading"].includes(selectedField.type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Help Text (Optional)
              </label>
              <textarea
                value={selectedField.helpText || ""}
                onChange={(e) =>
                  updateField(selectedField.id, { helpText: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="Additional instructions for users"
              />
            </div>
          )}

          {/* Options for choice fields */}
          {["radio", "multiselect", "select"].includes(selectedField.type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options
              </label>
              <div className="space-y-2">
                {(selectedField.options || []).map((option, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(selectedField.options || [])];
                        newOptions[idx] = e.target.value;
                        updateField(selectedField.id, { options: newOptions });
                      }}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder={`Option ${idx + 1}`}
                    />
                    <button
                      onClick={() => {
                        const newOptions = selectedField.options.filter(
                          (_, i) => i !== idx
                        );
                        updateField(selectedField.id, { options: newOptions });
                      }}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newOptions = [
                      ...(selectedField.options || []),
                      `Option ${(selectedField.options?.length || 0) + 1}`,
                    ];
                    updateField(selectedField.id, { options: newOptions });
                  }}
                  className="w-full py-2 px-3 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:text-gray-800"
                >
                  + Add Option
                </button>
              </div>
            </div>
          )}

          {/* Range settings */}
          {selectedField.type === "range" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Value
                  </label>
                  <input
                    type="number"
                    value={selectedField.min || 0}
                    onChange={(e) =>
                      updateField(selectedField.id, {
                        min: parseInt(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Value
                  </label>
                  <input
                    type="number"
                    value={selectedField.max || 100}
                    onChange={(e) =>
                      updateField(selectedField.id, {
                        max: parseInt(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Step Size
                </label>
                <input
                  type="number"
                  value={selectedField.step || 1}
                  onChange={(e) =>
                    updateField(selectedField.id, {
                      step: parseInt(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* Rating settings */}
          {selectedField.type === "rating" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Rating
              </label>
              <input
                type="number"
                value={selectedField.maxRating || 5}
                onChange={(e) =>
                  updateField(selectedField.id, {
                    maxRating: parseInt(e.target.value),
                  })
                }
                min="1"
                max="10"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Textarea rows */}
          {selectedField.type === "textarea" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Rows
              </label>
              <input
                type="number"
                value={selectedField.rows || 4}
                onChange={(e) =>
                  updateField(selectedField.id, {
                    rows: parseInt(e.target.value),
                  })
                }
                min="2"
                max="10"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* File upload settings */}
          {["file", "image"].includes(selectedField.type) && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accepted File Types
                </label>
                <input
                  type="text"
                  value={selectedField.accept || ""}
                  onChange={(e) =>
                    updateField(selectedField.id, { accept: e.target.value })
                  }
                  placeholder="e.g., .pdf,.doc,.docx or image/*"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedField.multiple || false}
                    onChange={(e) =>
                      updateField(selectedField.id, {
                        multiple: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Allow multiple files
                  </span>
                </label>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Simple Form Builder
  const SimpleFormBuilder = () => (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="p-6">
        {/* Form Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Form Title
              </label>
              <input
                type="text"
                value={formConfig.formName}
                onChange={(e) =>
                  setFormConfig((prev) => ({
                    ...prev,
                    formName: e.target.value,
                  }))
                }
                placeholder="Enter your form title"
                className="w-full text-lg font-medium border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Form Description (Optional)
              </label>
              <textarea
                value={formConfig.description}
                onChange={(e) =>
                  setFormConfig((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Add a description to help people understand your form"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {formConfig.fields.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Start Building Your Form
              </h3>
              <p className="text-gray-600">
                Click on any field type from the left panel to add it to your
                form
              </p>
            </div>
          ) : (
            formConfig.fields.map((field, index) => (
              <SimpleFieldEditor key={field.id} field={field} index={index} />
            ))
          )}
        </div>
      </div>
    </div>
  );

  // Simple Field Editor
  const SimpleFieldEditor = ({ field, index }) => {
    const isSelected = selectedField?.id === field.id;

    // FIX: Properly find field type from nested fieldCategories object
    const fieldType = Object.values(fieldCategories)
      .flat()
      .find((f) => f.type === field.type);

    return (
      <div
        className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 ${
          isSelected
            ? "border-blue-500 ring-2 ring-blue-200"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        {/* Field Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-lg">{fieldType?.icon}</span>
            <div>
              <div className="font-medium text-gray-800">
                {fieldType?.label}
              </div>
              <div className="text-sm text-gray-600">{field.label}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Move buttons */}
            <button
              onClick={() => moveField(field.id, "up")}
              disabled={index === 0}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              title="Move up"
            >
              ⬆️
            </button>
            <button
              onClick={() => moveField(field.id, "down")}
              disabled={index === formConfig.fields.length - 1}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              title="Move down"
            >
              ⬇️
            </button>
            {/* Edit button */}
            <button
              onClick={() => setSelectedField(field)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {isSelected ? "Editing" : "Edit"}
            </button>
            {/* Delete button */}
            <button
              onClick={() => removeField(field.id)}
              className="p-1 text-red-400 hover:text-red-600"
              title="Delete field"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Field Preview */}
        <div className="p-4">
          <SimpleFieldPreview field={field} />
        </div>
      </div>
    );
  };

  // Simple Form Preview
  const SimpleFormPreview = () => (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
          {/* Form Header */}
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {formConfig.formName || "Untitled Form"}
            </h1>
            {formConfig.description && (
              <p className="text-gray-600">{formConfig.description}</p>
            )}
          </div>

          {/* Form Fields */}
          <div className="p-6 space-y-6">
            {formConfig.fields.map((field) => (
              <SimpleFieldPreview key={field.id} field={field} isLive={true} />
            ))}
          </div>

          {/* Submit Button */}
          {formConfig.fields.length > 0 && (
            <div className="p-6 border-t">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Submit Form
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Handle create form
  const handleCreateForm = useCallback(() => {
    if (!selectedStage || !formConfig.formName.trim()) {
      toast.error("Please select a stage and enter a form name");
      return;
    }

    if (formConfig.fields.length === 0) {
      toast.error("Please add at least one field to the form");
      return;
    }

    console.log("Simple Form Configuration:", {
      stageId: selectedStage,
      formConfig,
    });

    toast.success("Form created successfully!");
    setIsCreatingForm(false);
    setFormConfig({
      formName: "",
      description: "",
      fields: [],
    });
    setSelectedField(null);
    setPreviewData({});
  }, [selectedStage, formConfig]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            📋 Advanced Form Builder
          </h3>
          <p className="text-sm text-gray-600">
            Create professional forms with comprehensive field types - no
            technical knowledge required!
          </p>
        </div>
        <button
          onClick={() => setIsCreatingForm(true)}
          className="px-6 py-3 text-sm rounded-md flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 font-medium shadow-lg transition-all duration-200"
        >
          <FaPlus /> Create New Form
        </button>
      </div>

      {/* Stage availability check */}
      {availableStages.length === 0 && !isCreatingForm && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ No pipeline stages available. Please add pipeline stages first.
          </p>
        </div>
      )}

      {/* Form Builder Interface */}
      {isCreatingForm && (
        <div className="bg-white border rounded-lg overflow-hidden shadow-xl">
          {/* Header */}
          <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-xl text-gray-800">
                📋 Build Your Form
              </h4>
              <button
                onClick={() => {
                  setIsCreatingForm(false);
                  setFormConfig({ formName: "", description: "", fields: [] });
                  setSelectedField(null);
                  setPreviewData({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Which stage will use this form?
              </label>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="border border-gray-300 p-3 rounded-md w-full focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a stage</option>
                {availableStages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab("builder")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                  activeTab === "builder"
                    ? "border-blue-600 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                🛠️ Build Form
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                  activeTab === "preview"
                    ? "border-blue-600 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                👁️ Preview ({formConfig.fields.length} fields)
              </button>
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="h-[700px] flex">
            {activeTab === "builder" ? (
              <>
                <SimpleFieldPalette />
                <SimpleFormBuilder />
                <SimplePropertiesPanel />
              </>
            ) : (
              <SimpleFormPreview />
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50 flex gap-3 justify-between">
            <div className="text-sm text-gray-600">
              ✨ Click field types to add them • Click &quot;Edit&quot; to
              customize • Use ⬆️⬇️ to reorder
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsCreatingForm(false);
                  setFormConfig({ formName: "", description: "", fields: [] });
                  setSelectedField(null);
                  setPreviewData({});
                }}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-100 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateForm}
                className="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Create Form ✅
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isCreatingForm && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            Advanced Form Builder
          </h3>
          <p className="text-gray-600 mb-6">
            Create professional forms with comprehensive field types - no
            technical knowledge required!
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-2xl mb-3">🎯</div>
              <h4 className="font-semibold text-gray-800 mb-2">
                Comprehensive Field Types
              </h4>
              <p className="text-sm text-gray-600">
                Text, email, phone, multiple choice, checkboxes, and more, all
                organized into clear categories
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-2xl mb-3">📝</div>
              <h4 className="font-semibold text-gray-800 mb-2">Live Preview</h4>
              <p className="text-sm text-gray-600">
                See exactly how your form will look as you build it
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-2xl mb-3">👁️</div>
              <h4 className="font-semibold text-gray-800 mb-2">
                Customizable Settings
              </h4>
              <p className="text-sm text-gray-600">
                Add, remove, or reorder fields, set validation rules, and more
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Update the SettingsPage component to include the new tab
const SettingsPage = ({
  leads,
  kanbanStatuses,
  onAddStage,
  onReorderStages,
  onDeleteStages,
}) => {
  const [activeSettingsPage, setActiveSettingsPage] =
    useState("pipelineStages");

  const settingsPages = [
    {
      id: "pipelineStages",
      label: "Sales Settings",
      icon: FaStream,
      description: "Pipelines configuration",
    },
    {
      id: "stageForms",
      label: "Stage Dependent Forms",
      icon: FaTasks,
      description: "Create custom forms required for specific pipeline stages.",
    },
    {
      id: "permissions",
      label: "User Roles & Permissions",
      icon: FaUserShield,
      description:
        "Define what each user role can see and do within this module.",
      frozen: true,
    },
    {
      id: "workflow",
      label: "Approval Workflow",
      icon: FaSitemap,
      description:
        "Set up a sequence of roles that must approve a lead to proceed.",
      frozen: true,
    },
    {
      id: "automation",
      label: "Automation Rules",
      icon: FaRobot,
      description:
        "Create IF-THEN rules to automate tasks like alerts and notifications.",
      frozen: true,
    },
    {
      id: "templates",
      label: "Email & SMS Templates",
      icon: FaEnvelopeOpenText,
      description:
        "Create and manage standardized templates for your team to use.",
      frozen: true,
    },
  ];

  const activePage = settingsPages.find((p) => p.id === activeSettingsPage);

  const renderSettingsContent = () => {
    switch (activeSettingsPage) {
      case "pipelineStages":
        return (
          <PipelineSettings
            stages={kanbanStatuses}
            leads={leads}
            onAddStage={onAddStage}
            onReorderStages={onReorderStages}
            onDeleteStages={onDeleteStages}
          />
        );
      case "stageForms":
        return <StageDependentFormsSettings stages={kanbanStatuses} />;
      case "permissions":
        return <PermissionsSettings />;
      case "workflow":
        return <WorkflowSettings />;
      case "automation":
        return <AutomationSettings />;
      case "templates":
        return <TemplatesSettings />;
      default:
        return (
          <div className="text-center text-gray-500">
            Select a setting to configure.
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Horizontal Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto scrollbar-hide">
            {settingsPages.map((page) => (
              <button
                key={page.id}
                onClick={() => !page.frozen && setActiveSettingsPage(page.id)}
                disabled={page.frozen}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${
                  page.frozen
                    ? "border-transparent text-gray-400 cursor-not-allowed opacity-60"
                    : activeSettingsPage === page.id
                    ? "border-blue-600 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
                }`}
                title={page.frozen ? "This feature is coming soon" : ""}
              >
                <page.icon className="w-5 h-5 flex-shrink-0" />
                <span>{page.label}</span>
                {page.frozen && (
                  <span className="ml-1 text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">
                    Soon
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Active Page Content */}
        <div className="p-8">
          {activePage && (
            <>
              <div className="mb-8 pb-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <activePage.icon className="w-7 h-7 text-gray-400" />
                  {activePage.label}
                </h3>
                <p className="mt-2 text-base text-gray-600">
                  {activePage.description}
                </p>
              </div>
              {renderSettingsContent()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const PipelineSettings = ({
  stages,
  leads,
  onAddStage,
  onReorderStages,
  onDeleteStages,
}) => {
  const dispatch = useDispatch();
  const [newStageName, setNewStageName] = useState("");
  const [newStageIsForm, setNewStageIsForm] = useState(false);
  const [newStageColor, setNewStageColor] = useState("#3b82f6");
  const [newStageFormType, setNewStageFormType] = useState("");
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stageToDelete, setStageToDelete] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  // Refresh data when component mounts
  useEffect(() => {
    dispatch(fetchPipelines());
  }, [dispatch]);

  const handleAddStage = () => {
    if (!newStageName) {
      toast.error("Stage name is required");
      return;
    }
    if (newStageIsForm && !newStageFormType) {
      toast.error("Form type is required when 'Is Form' is enabled");
      return;
    }

    const newStage = {
      name: newStageName,
      color: newStageColor,
      isFormRequired: newStageIsForm,
      formType: newStageIsForm ? newStageFormType : null,
    };

    onAddStage(newStage);
    setNewStageName("");
    setNewStageColor("#3b82f6");
    setNewStageIsForm(false);
    setNewStageFormType("");
    setIsAddingStage(false);
    toast.success("Stage added successfully");

    // Auto-refresh after adding stage
    setTimeout(() => {
      dispatch(fetchPipelines());
    }, 100);
  };

  const handleDeleteStage = (stage) => {
    // Check if the stage has any leads
    const stageHasLeads = leads.some((lead) => lead.status === stage.name);

    console.log("Checking stage for leads:", {
      stageName: stage.name,
      totalLeads: leads.length,
      stageLeads: leads.filter((lead) => lead.status === stage.name),
      stageHasLeads,
    });

    if (stageHasLeads) {
      setWarningMessage(
        `Cannot delete: The pipeline stage "${stage.name}" contains leads. Please move the leads to other pipeline stages and try again.`
      );
      setShowWarningModal(true);
    } else {
      setStageToDelete(stage);
      setShowDeleteModal(true);
    }
  };

  const confirmDeleteStage = async () => {
    if (stageToDelete) {
      try {
        await onDeleteStages([stageToDelete.name]);
        setStageToDelete(null);
        setShowDeleteModal(false);
        toast.success("Pipeline stage deleted successfully");

        // Auto-refresh after deleting stage
        setTimeout(() => {
          dispatch(fetchPipelines());
        }, 100);
      } catch (error) {
        console.log("Error caught in confirmDeleteStage:", error);
        // Check if it's the specific backend error about leads in the stage
        if (
          error.message &&
          error.message.includes("lead(s) are currently in this stage")
        ) {
          setWarningMessage(error.message);
          setShowWarningModal(true);
          setStageToDelete(null);
          setShowDeleteModal(false);
        } else {
          toast.error("Failed to delete pipeline stage");
        }
      }
    }
  };

  const StageItem = ({ stage }) => {
    return (
      <div className="relative group bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 min-w-[200px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div
              className="w-5 h-5 rounded-full shadow-sm"
              style={{ backgroundColor: stage.color }}
            />
            <div className="flex flex-col">
              <span className="font-semibold text-gray-800 text-sm">
                {stage.name}
              </span>
              {stage.isFormRequired && (
                <span className="text-xs text-blue-600 font-medium">
                  Form Required
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => handleDeleteStage(stage)}
            className="ml-2 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors duration-200"
            title="Delete Stage"
          >
            <FaTrash className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => setIsAddingStage(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <FaPlus /> Add Pipeline
        </button>
      </div>

      {isAddingStage && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-30">
          <div
            className="w-full max-w-md bg-gray-50 rounded-xl shadow-xl p-6 m-8 flex flex-col"
            style={{ minHeight: "auto", maxHeight: "90vh" }}
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Add Pipeline
              </h3>
              <div className="flex flex-col gap-3">
                <label className="text-xs font-medium text-gray-700">
                  Pipeline Name
                </label>
                <input
                  type="text"
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  placeholder="Enter pipeline name..."
                  className="p-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {newStageName === "" && (
                  <span className="text-xs text-red-500 mt-1">
                    Pipeline name is required.
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-3 mt-3">
                <label className="text-xs font-medium text-gray-700">
                  Pipeline Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    "#3b82f6",
                    "#6366f1",
                    "#10b981",
                    "#f59e42",
                    "#22d3ee",
                    "#ef4444",
                    "#a3a3a3",
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewStageColor(color)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-150 ${
                        newStageColor === color
                          ? "border-blue-600 ring-2 ring-blue-200"
                          : "border-gray-200"
                      }`}
                      style={{ background: color }}
                      aria-label={`Select color ${color}`}
                    >
                      {newStageColor === color && (
                        <span className="w-3 h-3 bg-white rounded-full border border-blue-600"></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <label className="text-xs font-medium text-gray-700">
                  Is Form
                </label>
                <button
                  type="button"
                  onClick={() => setNewStageIsForm((prev) => !prev)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                    newStageIsForm ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  aria-pressed={newStageIsForm}
                >
                  <span
                    className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${
                      newStageIsForm ? "translate-x-6" : ""
                    }`}
                  ></span>
                </button>
                <span className="text-xs text-gray-500">
                  {newStageIsForm ? "Yes" : "No"}
                </span>
              </div>
              {newStageIsForm && (
                <div className="flex flex-col gap-3 mt-3">
                  <label className="text-xs font-medium text-gray-700">
                    Form Type
                  </label>
                  <select
                    value={newStageFormType}
                    onChange={(e) => setNewStageFormType(e.target.value)}
                    className="p-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">Select form type...</option>
                    <option value="CONVERTED">Converted</option>
                    <option value="JUNK">Junk</option>
                    <option value="LOST">Lost</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="SEMI">Semi Contacted</option>
                    <option value="POTENTIAL">Potential</option>
                    <option value="HIGHPOTENTIAL">High Potential</option>
                    <option value="ONBOARDING">Onboarding</option>
                    <option value="APPROVAL">Approval</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                  {newStageFormType === "" && (
                    <span className="text-xs text-red-500 mt-1">
                      Form type is required.
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => {
                  setNewStageName("");
                  setNewStageIsForm(false);
                  setNewStageColor("#3b82f6");
                  setNewStageFormType("");
                  setIsAddingStage(false);
                }}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStage}
                disabled={
                  !newStageName || (newStageIsForm && !newStageFormType)
                }
                className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stages.map((stage) => (
          <StageItem key={stage.id} stage={stage} />
        ))}
      </div>

      {stages.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FaStream className="mx-auto text-3xl mb-2" />
          <p>No pipeline stages configured</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                Delete Pipeline Stage
              </h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setStageToDelete(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete the pipeline stage &quot;
                {stageToDelete?.name}&quot;? This action cannot be undone.
              </p>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end items-center gap-2 rounded-b-lg">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setStageToDelete(null);
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteStage}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                Cannot Delete Pipeline Stage
              </h2>
              <button
                onClick={() => {
                  setShowWarningModal(false);
                  setWarningMessage("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 p-3 rounded bg-red-100 border border-red-300 text-red-700 text-sm font-semibold">
                {warningMessage}
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end items-center gap-2 rounded-b-lg">
              <button
                onClick={() => {
                  setShowWarningModal(false);
                  setWarningMessage("");
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingContent = ({ role }) => {
  const router = useRouter();
  const dispatch = useDispatch();

  // Get data from Redux store instead of local state
  const { leads: allLeads } = useSelector((state) => state.leads);
  const { pipelines } = useSelector((state) => state.pipelines);
  const { employees: managerEmployees, loading: managerEmployeesLoading } =
    useSelector((state) => state.managerEmployee);

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchPipelines());
    dispatch(fetchLeads()); // Assuming fetchLeads gets all leads
    dispatch(fetchManagerEmployees());
  }, [dispatch]);

  // Map Redux pipeline structure to the one expected by the settings components
  const kanbanStatuses = useMemo(() => {
    return (pipelines || []).map((p) => ({
      ...p,
      id: p.stageId,
      isForm: p.isFormRequired,
    }));
  }, [pipelines]);

  // Deduplicate leads by leadId (keep first occurrence)
  const dedupedLeads = React.useMemo(() => {
    const seen = new Set();
    return (allLeads || []).filter((lead) => {
      if (lead && lead.leadId && !seen.has(lead.leadId)) {
        seen.add(lead.leadId);
        return true;
      }
      return false;
    });
  }, [allLeads]);

  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [filterText, setFilterText] = useState("");

  // Modal states
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [leadToConvertId, setLeadToConvertId] = useState(null);
  const [showLostReasonModal, setShowLostReasonModal] = useState(false);
  const [leadToMarkLost, setLeadToMarkLost] = useState(null);
  const [showJunkReasonModal, setShowJunkReasonModal] = useState(false);
  const [leadToMarkJunkId, setLeadToMarkJunkId] = useState(null);
  const [newStageName, setNewStageName] = useState("");
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [showPipelineDropdown, setShowPipelineDropdown] = useState(false);
  const [showDeletePipelineModal, setShowDeletePipelineModal] = useState(false);
  const [viewMode, setViewMode] = useState("kanban"); // 'kanban' or 'table'
  const [mainView, setMainView] = useState("settings"); // New state for main view
  const [pendingConversion, setPendingConversion] = useState(null); // {lead, fromStatus}
  const [pendingLost, setPendingLost] = useState(null); // {lead, fromStatus}
  const [pendingJunk, setPendingJunk] = useState(null); // {lead, fromStatus}
  const [showScheduleActivityModal, setShowScheduleActivityModal] =
    useState(false);
  const [leadToScheduleActivity, setLeadToScheduleActivity] = useState(null);

  // Add state for new stage options
  const [newStageIsForm, setNewStageIsForm] = useState(false);
  const [newStageColor, setNewStageColor] = useState("#3b82f6");

  useEffect(() => {
    if (router.query.view === "settings") {
      setMainView("settings");
    }
  }, [router.query]);

  // All lead operations now update local state
  const leadsByStatus = useMemo(() => {
    const grouped = {};
    kanbanStatuses.forEach((status) => {
      grouped[status.name] = [];
    });
    const filteredLeads = dedupedLeads.filter((lead) =>
      Object.values(lead).some((value) =>
        String(value).toLowerCase().includes(filterText.toLowerCase())
      )
    );
    filteredLeads.forEach((lead) => {
      if (grouped[lead.status]) {
        grouped[lead.status].push(lead);
      } else {
        if (!grouped[lead.status]) {
          grouped[lead.status] = [];
        }
        grouped[lead.status].push(lead);
      }
    });
    return grouped;
  }, [dedupedLeads, filterText, kanbanStatuses]);

  const handleViewChange = (view) => {
    setMainView(view);
    if (view === "settings") {
      router.push("?view=settings", undefined, { shallow: true });
    } else {
      router.push(router.pathname, undefined, { shallow: true });
    }
  };



  const handleEdit = (lead) => {
    setEditingLead(lead);
    setShowAddLeadModal(true);
  };

  const handleConvert = (lead) => {
    setLeadToConvertId(lead.leadId);
    setShowConvertModal(true);
  };

  const handleMarkLost = (lead) => {
    setLeadToMarkLost(lead);
    setShowLostReasonModal(true);
  };

  const handleMarkJunk = (lead) => {
    setLeadToMarkJunkId(lead.leadId);
    setShowJunkReasonModal(true);
  };

  const handleOpenAddLeadForm = (status) => {
    const newLeadData = { ...defaultLeadData };
    if (typeof status === "string") {
      newLeadData.status = status;
    }
    setEditingLead(newLeadData);
    setShowAddLeadModal(true);
  };

  const handleAddLeadSubmit = (formData) => {
    const leadData = {
      ...defaultLeadData,
      ...formData,
      status: formData.status || "New",
      submittedBy: role,
    };
    if (editingLead && editingLead.leadId) {
      dispatch(updateLead({ ...editingLead, ...leadData }));
    } else {
      dispatch(createLead(leadData));
    }
    setShowAddLeadModal(false);
  };

  const handleAddStage = (newStage) => {
    dispatch(
      createPipeline({
        name: newStage.name,
        color: newStage.color,
        isFormRequired: newStage.isFormRequired,
        formType: newStage.isFormRequired ? newStage.formType : null,
      })
    ).then(() => {
      // Auto-refresh after adding stage
      dispatch(fetchPipelines());
      dispatch(fetchLeads());
    });
  };

  const handleReorderStages = (reorderedStages) => {
    const stageIds = reorderedStages.map((s) => s.id);
    dispatch(reorderPipelines(stageIds));
  };

  const handleCancelAddStage = () => {
    setNewStageName("");
    setIsAddingStage(false);
  };

  const handlePipelineAction = (action) => {
    setShowPipelineDropdown(false);
    if (action === "add") {
      setIsAddingStage(true);
    } else if (action === "delete") {
      setShowDeletePipelineModal(true);
    }
  };

  const handleDeleteStages = async (stagesToDelete) => {
    const stagesData = stagesToDelete
      .map((name) => kanbanStatuses.find((s) => s.name === name))
      .filter(Boolean);

    if (stagesData.length > 0) {
      try {
        console.log("Attempting to delete stages:", stagesToDelete);

        // Try to delete each stage and check for errors
        for (const stage of stagesData) {
          const result = await dispatch(deletePipeline(stage.stageId));

          // Check if the action was rejected
          if (deletePipeline.rejected.match(result)) {
            console.log("Delete pipeline rejected:", result.payload);

            // Check if it's the specific backend error about leads
            if (
              result.payload &&
              result.payload.message &&
              result.payload.message.includes(
                "lead(s) are currently in this stage"
              )
            ) {
              throw new Error(result.payload.message);
            }

            // If it's a different error, show toast and return
            toast.error("Failed to delete pipeline stage");
            return;
          }
        }

        // Auto-refresh after deleting stages
        dispatch(fetchPipelines());
        dispatch(fetchLeads());
        toast.success(`Deleted ${stagesToDelete.length} stage(s) successfully`);
      } catch (error) {
        console.log("Error in handleDeleteStages:", error);
        // Check if it's the specific backend error about leads in the stage
        if (
          error.message &&
          error.message.includes("lead(s) are currently in this stage")
        ) {
          console.log("Throwing backend error about leads");
          // This will be handled by the calling component
          throw error;
        } else {
          toast.error("Failed to delete pipeline stage");
        }
      }
    }
  };

  const handleConvertModalClose = () => {
    setShowConvertModal(false);
    setLeadToConvertId(null);
    setPendingConversion(null);
  };

  const handleConvertSuccess = (updatedLead) => {
    dispatch(updateLead(updatedLead));
    setPendingConversion(null);
    setShowConvertModal(false);
  };

  const handleLostModalClose = () => {
    setShowLostReasonModal(false);
    setLeadToMarkLost(null);
    setPendingLost(null);
  };

  const handleLostSuccess = (updatedLead) => {
    dispatch(updateLead(updatedLead));
    setPendingLost(null);
    setShowLostReasonModal(false);
  };

  const handleJunkModalClose = () => {
    setShowJunkReasonModal(false);
    setLeadToMarkJunkId(null);
    setPendingJunk(null);
  };

  const handleJunkSuccess = (updatedLead) => {
    dispatch(updateLead(updatedLead));
    setPendingJunk(null);
    setShowJunkReasonModal(false);
  };

  const handleScheduleActivity = (lead) => {
    setLeadToScheduleActivity(lead);
    setShowScheduleActivityModal(true);
  };

  const handleScheduleActivitySuccess = (activity) => {
    const leadId = activity.leadId;
    dispatch(
      updateLead({
        ...dedupedLeads.find((l) => l.leadId === leadId),
        activities: [
          ...(dedupedLeads.find((l) => l.leadId === leadId)?.activities || []),
          activity,
        ],
      })
    );
    setShowScheduleActivityModal(false);
    setLeadToScheduleActivity(null);
    toast.success("Activity scheduled successfully");
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Pipeline View */}
      {mainView === "pipeline" && (
        <>
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
            {/* Left side: New button */}
            <div className="flex items-center gap-4">
              {kanbanStatuses.length > 0 ? (
                <button
                  onClick={() => handleOpenAddLeadForm()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-all duration-200"
                >
                  <FaPlus /> New
                </button>
              ) : (
                <Tooltip content="Please add pipeline stages first">
                  <button
                    disabled
                    className="bg-gray-300 text-gray-500 px-4 py-2 rounded-md font-medium flex items-center gap-2 cursor-not-allowed"
                  >
                    <FaPlus /> New
                  </button>
                </Tooltip>
              )}
            </div>

            {/* Center: Sales Manager Pipeline */}
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                Sales Manager - Lead Pipeline
              </h1>
              <div className="relative">
                <button
                  onClick={() => setShowPipelineDropdown(!showPipelineDropdown)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-all duration-200"
                  title="Pipeline Settings"
                >
                  <FaCog />
                </button>
                {showPipelineDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handlePipelineAction("add")}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <FaPlus /> Add Stage
                      </button>
                      <button
                        onClick={() => handlePipelineAction("delete")}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        disabled={kanbanStatuses.length === 0}
                      >
                        <FaTrash /> Delete Stages
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Search, View toggles, and Settings */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>

              {/* View Toggle */}
              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    viewMode === "kanban"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                  title="Kanban View"
                >
                  <FaThLarge />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-2 text-sm font-medium transition-all duration-200 border-l border-gray-300 ${
                    viewMode === "table"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                  title="Table View"
                >
                  <FaListUl />
                </button>
              </div>

              {/* Settings Button */}
              <button
                onClick={() => handleViewChange("settings")}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-2 transition-all duration-200"
              >
                <FaCog /> Settings
              </button>
            </div>
          </div>

          {/* Add Stage Form */}
          {isAddingStage && (
            <div className="mb-6 p-4 bg-white rounded-lg shadow border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add New Pipeline Stage
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stage Name
                  </label>
                  <input
                    type="text"
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    placeholder="Enter stage name"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <input
                    type="color"
                    value={newStageColor}
                    onChange={(e) => setNewStageColor(e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="requireForm"
                      checked={newStageIsForm}
                      onChange={(e) => setNewStageIsForm(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm">Require form</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleAddStage({
                        name: newStageName,
                        isForm: newStageIsForm,
                        color: newStageColor,
                      })
                    }
                    disabled={!newStageName.trim()}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-all duration-200"
                  >
                    Add Stage
                  </button>
                  <button
                    onClick={() => setIsAddingStage(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          {viewMode === "kanban" ? (
            <KanbanBoard
              leadsByStatus={leadsByStatus}
              kanbanStatuses={kanbanStatuses}

              onEdit={handleEdit}
              onConvert={handleConvert}
              onMarkLost={handleMarkLost}
              onMarkJunk={handleMarkJunk}
              onScheduleActivity={handleScheduleActivity}
              onAddLead={handleOpenAddLeadForm}
            />
          ) : (
            <LeadsTable leads={dedupedLeads} />
          )}
        </>
      )}

      {/* Settings View */}
      {mainView === "settings" && (
        <div className="space-y-6">
          {/* Settings Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Sales Manager Settings
              </h1>
              <p className="text-sm text-gray-600">
                Customize your sales pipeline, workflows, and team permissions
              </p>
            </div>
            {/* <button
              onClick={() => handleViewChange("pipeline")}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <FaChevronLeft /> Back to Pipeline
            </button> */}
          </div>

          <SettingsPage
            leads={dedupedLeads}
            kanbanStatuses={kanbanStatuses}
            onAddStage={handleAddStage}
            onReorderStages={handleReorderStages}
            onDeleteStages={handleDeleteStages}
          />
        </div>
      )}

      {/* Modals */}
      <AddLeadModal
        isOpen={showAddLeadModal}
        onClose={() => {
          setShowAddLeadModal(false);
          setEditingLead(null);
        }}
        onSubmit={handleAddLeadSubmit}
        editingLead={editingLead}
        salesPersons={managerEmployees}
        designers={managerEmployees}
        salesPersonsLoading={managerEmployeesLoading}
        designersLoading={managerEmployeesLoading}
        kanbanStatuses={kanbanStatuses}
      />

      <ConvertLeadModal
        isOpen={showConvertModal}
        onClose={handleConvertModalClose}
        leadId={leadToConvertId}
        onSuccess={handleConvertSuccess}
        leads={dedupedLeads}
      />

      <LostLeadModal
        isOpen={showLostReasonModal}
        onClose={handleLostModalClose}
        lead={leadToMarkLost}
        onSuccess={handleLostSuccess}
      />

      {showJunkReasonModal && (
        <JunkReasonModal
          onClose={handleJunkModalClose}
          lead={
            leadToMarkJunkId
              ? dedupedLeads.find((l) => l.leadId === leadToMarkJunkId)
              : null
          }
          onSuccess={handleJunkSuccess}
        />
      )}

      <DeletePipelineModal
        isOpen={showDeletePipelineModal}
        onClose={() => setShowDeletePipelineModal(false)}
        stages={kanbanStatuses.map((s) => s.name)}
        onDeleteStages={handleDeleteStages}
      />

      <AdvancedScheduleActivityModal
        isOpen={showScheduleActivityModal}
        onClose={() => {
          setShowScheduleActivityModal(false);
          setLeadToScheduleActivity(null);
        }}
        lead={leadToScheduleActivity}
        onSuccess={handleScheduleActivitySuccess}
      />
    </div>
  );
};

const Setting = () => {
  const [currentRole, setCurrentRole] = useState("");

  useEffect(() => {
    // Get role from sessionStorage
    const role = sessionStorage.getItem("currentRole");
    setCurrentRole(role || "SALESMANAGER");
  }, []);

  return (
    <MainLayout>
      <SettingContent role={currentRole} />
    </MainLayout>
  );
};

export default withAuth(Setting);
