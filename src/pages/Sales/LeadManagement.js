import React, { useState, useMemo, useEffect } from "react";
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
  FaMagic,
  FaFilter,
} from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import ConvertLeadModal from "@/components/Sales/ConvertLeadModal";
import LostLeadModal from "@/components/Sales/LostLeadModal";
import JunkReasonModal from "@/components/Sales/JunkReasonModal";
import LostJunkLeadsModal from "@/components/Sales/LostJunkLeadsModal";
import AddLeadModal from "@/components/Sales/AddLeadModal";
import AssignLeadModal from "@/components/Sales/AssignLeadModal";
import SemiContactedModal from "@/components/Sales/SemiContactedModal";
import PotentialModal from "@/components/Sales/PotentialModal";
import HighPotentialModal from "@/components/Sales/HighPotentialModal";
import KanbanBoardClientOnly from "@/components/Sales/KanbanBoardClientOnly";
import {
  fetchLeads,
  updateLead,
  createLead,
  moveLeadToPipeline,
} from "@/redux/slices/leadsSlice";
import {
  addStage,
  removeStage,
  fetchPipelines,
  createPipeline,
  deletePipeline,
  initializePipelineStages,
} from "@/redux/slices/pipelineSlice";
import { fetchManagerEmployees } from "@/redux/slices/managerEmployeeSlice";
import MainLayout from "@/components/MainLayout";
import { toast } from "sonner";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import AdvancedScheduleActivityModal from "@/components/Sales/AdvancedScheduleActivityModal";
import Tooltip from "@/components/ui/ToolTip";
import withAuth from "@/components/withAuth";
import SearchBar from "@/components/Sales/SearchBar";
import ViewToggle from "@/components/Sales/ViewToggle";

import LeadsTable from "@/components/Sales/LeadsTable";

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

const DeletePipelineModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { pipelines } = useSelector((state) => state.pipelines);
  const { leads } = useSelector((state) => state.leads);
  const [selectedStages, setSelectedStages] = useState([]);
  const [warning, setWarning] = useState("");

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchPipelines());
      setSelectedStages([]);
      setWarning("");
    }
  }, [isOpen, dispatch]);

  // Check if any selected stage has leads
  useEffect(() => {
    if (selectedStages.length > 0) {
      const hasLeads = selectedStages.some((stageId) =>
        leads.some((lead) => lead.stageId === stageId)
      );
      if (hasLeads) {
        setWarning(
          "Cannot delete: One or more selected pipeline stages contain leads. Please move or delete all leads in these stages first."
        );
      } else {
        setWarning("");
      }
    } else {
      setWarning("");
    }
  }, [selectedStages, leads]);

  const handleStageToggle = (stageId) => {
    setSelectedStages((prev) =>
      prev.includes(stageId)
        ? prev.filter((id) => id !== stageId)
        : [...prev, stageId]
    );
  };

  const handleDelete = async () => {
    // Prevent deletion if warning is present
    if (warning) return;
    if (selectedStages.length === 0) return;
    const results = await Promise.all(
      selectedStages.map((id) => dispatch(deletePipeline(id)))
    );
    let hadLeadsError = false;
    results.forEach((result) => {
      if (result.type && result.type.endsWith("rejected")) {
        const errorMsg = result.payload || result.error?.message || "";
        if (
          typeof errorMsg === "string" &&
          errorMsg.toLowerCase().includes("lead")
        ) {
          hadLeadsError = true;
        }
      }
    });
    if (hadLeadsError) {
      toast.error(
        "Cannot delete pipeline: it contains leads. Please move or delete all leads in this stage first."
      );
    }
    setSelectedStages([]);
    onClose();
    dispatch(fetchPipelines());
    // Refresh leads to get the updated grouped format
    const employeeId = sessionStorage.getItem("employeeId");
    dispatch(fetchLeads({ employeeId, silent: true }));
  };

  const handleSelectAll = () => {
    setSelectedStages(pipelines.map((p) => p.stageId));
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
            Select one or more pipeline stages to delete. This action cannot be
            undone.
          </p>
          {warning && (
            <div className="mb-4 p-3 rounded bg-red-100 border border-red-300 text-red-700 text-sm font-semibold">
              {warning}
            </div>
          )}
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
            {pipelines.map((stage) => (
              <label
                key={stage.stageId}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedStages.includes(stage.stageId)}
                  onChange={() => handleStageToggle(stage.stageId)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium">{stage.name}</span>
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
            disabled={selectedStages.length === 0 || !!warning}
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

const LeadManagementContent = ({ role }) => {
  const dispatch = useDispatch();
  const { pipelines } = useSelector((state) => state.pipelines);
  const { leads, loading: leadsLoading } = useSelector((state) => state.leads);
  const { employees: managerEmployees, loading: managerEmployeesLoading } = useSelector((state) => state.managerEmployee);

  const [filterText, setFilterText] = useState("");
  const [viewMode, setViewMode] = useState("kanban");
  const [unassignedOnly, setUnassignedOnly] = useState(false);


  // Add pipeline modal state
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newStageColor, setNewStageColor] = useState("#3b82f6");
  const [newStageIsForm, setNewStageIsForm] = useState(false);
  const [newStageFormType, setNewStageFormType] = useState("");


  // Delete pipeline modal state
  const [showDeletePipelineModal, setShowDeletePipelineModal] = useState(false);
  const [selectedPipelinesToDelete, setSelectedPipelinesToDelete] = useState(
    []
  );

  // Add lead modal state
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showPipelineDropdown, setShowPipelineDropdown] = useState(false);

  // Pipeline action confirmation modal state
  const [pipelineAction, setPipelineAction] = useState(null); // 'add' or 'delete' or null

  // Advanced Schedule Activity Modal state
  const [showAdvancedScheduleModal, setShowAdvancedScheduleModal] =
    useState(false);
  const [selectedLeadForActivity, setSelectedLeadForActivity] = useState(null);

  // Modal states for formType pipelines
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showJunkModal, setShowJunkModal] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLeadForAssignment, setSelectedLeadForAssignment] = useState(null);
  const [targetPipelineId, setTargetPipelineId] = useState(null);

  // Semi contacted modal state
  const [showSemiContactedModal, setShowSemiContactedModal] = useState(false);
  const [selectedLeadForSemiContacted, setSelectedLeadForSemiContacted] = useState(null);
  const [targetPipelineIdForSemiContacted, setTargetPipelineIdForSemiContacted] = useState(null);

  // Potential modal state
  const [showPotentialModal, setShowPotentialModal] = useState(false);
  const [selectedLeadForPotential, setSelectedLeadForPotential] = useState(null);
  const [targetPipelineIdForPotential, setTargetPipelineIdForPotential] = useState(null);

  // High potential modal state
  const [showHighPotentialModal, setShowHighPotentialModal] = useState(false);
  const [selectedLeadForHighPotential, setSelectedLeadForHighPotential] = useState(null);
  const [targetPipelineIdForHighPotential, setTargetPipelineIdForHighPotential] = useState(null);

  // Initialize pipeline state
  const [isInitializing, setIsInitializing] = useState(false);

  // Fetch pipelines and all leads on mount
  useEffect(() => {
    dispatch(fetchPipelines());
    // For Lead Management (Sales role), filter by employeeId
    // For Manager role, fetch all leads without filtering
    const employeeId = sessionStorage.getItem("employeeId");
    dispatch(fetchLeads({ employeeId, silent: true }));
    dispatch(fetchManagerEmployees());
  }, [dispatch]);

  // Live refresh: periodically refetch leads and on window focus/visibility change
  useEffect(() => {
    const REFRESH_INTERVAL_MS = 2000; // 20s

    const refetchLeads = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      const employeeId = sessionStorage.getItem("employeeId");
      dispatch(fetchLeads({ employeeId, silent: true }));
    };

    const onFocus = () => refetchLeads();
    if (typeof window !== "undefined") {
      window.addEventListener("focus", onFocus);
    }
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", refetchLeads);
    }

    const intervalId = setInterval(refetchLeads, REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", onFocus);
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", refetchLeads);
      }
    };
  }, [dispatch]);


  const dedupedLeads = useMemo(() => {
    const seen = new Set();
    let flatLeads = [];
    
    if (Array.isArray(leads) && leads.length > 0 && leads[0].stageId && Array.isArray(leads[0].leads)) {
      // New grouped format: leads grouped by stageId
      leads.forEach((stageGroup) => {
        if (Array.isArray(stageGroup.leads)) {
          // Find the pipeline/stage for this stageId
          const pipeline = pipelines.find(p => 
            p.stageId === stageGroup.stageId || p.pipelineId === stageGroup.stageId
          );
          
          const stageName = pipeline ? pipeline.name : `Stage-${stageGroup.stageId?.slice(-8)}`;
          const stageId = stageGroup.stageId;
          
          // Add stage information to each lead
          const leadsWithStage = stageGroup.leads.map(lead => ({
            ...lead,
            stageId: stageId,
            stageName: stageName
          }));
          
          flatLeads = flatLeads.concat(leadsWithStage);
        }
      });
    } else if (Array.isArray(leads)) {
      // Old flat format: individual leads with pipelineId/stageId
      flatLeads = leads.map(lead => {
        const pipeline = pipelines.find(p => 
          p.stageId === (lead.pipelineId || lead.stageId) || 
          p.pipelineId === (lead.pipelineId || lead.stageId)
        );
        
        return {
          ...lead,
          stageId: lead.pipelineId || lead.stageId,
          stageName: pipeline ? pipeline.name : 'Unknown Stage'
        };
      });
    }
    
    // Deduplicate by leadId
    return flatLeads.filter((lead) => {
      if (lead && lead.leadId && !seen.has(lead.leadId)) {
        seen.add(lead.leadId);
        return true;
      }
      return false;
    });
  }, [leads, pipelines]);

  // Group leads by pipelineId for Kanban board
  const leadsByStatus = useMemo(() => {
    const grouped = {};

    // Include all pipelines including "New" stage
    const filteredPipelines = pipelines;

    // Check if leads is in the new grouped format
    if (Array.isArray(leads) && leads.length > 0 && leads[0].stageId && leads[0].leads) {
      // New format: leads grouped by stageId
      leads.forEach((stageGroup) => {
        const stageId = stageGroup.stageId;
        const stageLeads = stageGroup.leads || [];
        
        // Find the pipeline/stage name for this stageId
        const pipeline = filteredPipelines.find(p => 
          p.stageId === stageId || p.pipelineId === stageId
        );
        
        if (pipeline) {
          // Add stage information to each lead
          const leadsWithStageInfo = stageLeads.map(lead => ({
            ...lead,
            stageName: pipeline.name,
            formType: pipeline.formType
          }));
          grouped[pipeline.name] = leadsWithStageInfo;
        } else {
          // Create a fallback name if pipeline not found
          const originalPipeline = pipelines.find(p => 
            p.stageId === stageId || p.pipelineId === stageId
          );
          if (originalPipeline) {
            const leadsWithStageInfo = stageLeads.map(lead => ({
              ...lead,
              stageName: originalPipeline.name,
              formType: originalPipeline.formType
            }));
            grouped[`Stage-${stageId.slice(-8)}`] = leadsWithStageInfo;
          }
        }
      });
    } else {
      // Old format: individual leads with pipelineId/stageId
      const usedLeadIds = new Set();

      filteredPipelines.forEach((pipeline) => {
        const matchingLeads = leads.filter((lead) => {
          if (usedLeadIds.has(lead.leadId)) {
            return false;
          }

          const leadPipelineId = lead.pipelineId || lead.stageId;
          const pipelineId = pipeline.pipelineId || pipeline.stageId;
          const isMatch = String(leadPipelineId) === String(pipelineId);

          if (isMatch) {
            usedLeadIds.add(lead.leadId);
          }

          return isMatch;
        });

        // Add stage information to each lead
        const leadsWithStageInfo = matchingLeads.map(lead => ({
          ...lead,
          stageName: pipeline.name,
          formType: pipeline.formType
        }));

        grouped[pipeline.name] = leadsWithStageInfo;
      });

      // Handle leads without pipelineId - assign to first stage
      const leadsWithoutPipeline = leads.filter((lead) => {
        if (usedLeadIds.has(lead.leadId)) {
          return false;
        }
        const leadPipelineId = lead.pipelineId || lead.stageId;
        return !leadPipelineId || leadPipelineId === null || leadPipelineId === undefined;
      });

      if (leadsWithoutPipeline.length > 0) {
        const firstStage = filteredPipelines[0];
        if (firstStage) {
          // Add stage information to leads without pipeline
          const leadsWithStageInfo = leadsWithoutPipeline.map(lead => ({
            ...lead,
            stageName: firstStage.name,
            formType: firstStage.formType
          }));
          
          if (!grouped[firstStage.name]) {
            grouped[firstStage.name] = [];
          }
          grouped[firstStage.name] = [...grouped[firstStage.name], ...leadsWithStageInfo];
        }
      }
    }

    return grouped;
  }, [pipelines, leads]);

  console.log(dedupedLeads)

  // Add pipeline handler
  const handleAddStage = () => {
    if (!newStageName) {
      toast.error("Stage name is required");
      return;
    }
    if (newStageIsForm && !newStageFormType) {
      toast.error("Form type is required when 'Is Form' is enabled");
      return;
    }
    dispatch(
      createPipeline({
        name: newStageName,
        color: newStageColor,
        isFormRequired: newStageIsForm,
        formType: newStageIsForm ? newStageFormType : null,
      })
    );
    setNewStageName("");
    setNewStageColor("#3b82f6");
    setNewStageIsForm(false);
    setNewStageFormType("");
    setIsAddingStage(false);
    // Refresh leads to get the updated grouped format
    const employeeId = sessionStorage.getItem("employeeId");
    dispatch(fetchLeads({ employeeId, silent: true }));
  };

  // Delete pipeline handler
  const handleDeleteStages = (pipelineIds) => {
    pipelineIds.forEach((id) => {
      dispatch(deletePipeline(id));
    });
    dispatch(fetchPipelines());
    // Refresh leads to get the updated grouped format
    const employeeId = sessionStorage.getItem("employeeId");
    dispatch(fetchLeads({ employeeId, silent: true }));
    setShowDeletePipelineModal(false);
    setSelectedPipelinesToDelete([]);
  };

  // Handle schedule activity
  const handleScheduleActivity = (lead) => {
    setSelectedLeadForActivity(lead);
    setShowAdvancedScheduleModal(true);
  };

  // Handle initialize pipeline stages
  const handleInitializePipeline = async () => {
    setIsInitializing(true);
    try {
      await dispatch(initializePipelineStages());
      toast.success("Default pipeline stages initialized successfully!");
      dispatch(fetchPipelines());
      const employeeId = sessionStorage.getItem("employeeId");
      dispatch(fetchLeads({ employeeId, silent: true }));
    } catch (error) {
      toast.error("Failed to initialize pipeline stages");
    } finally {
      setIsInitializing(false);
    }
  };



  // Confirmation modal for pipeline actions
  const PipelineActionConfirmModal = () =>
    pipelineAction && (
      <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {pipelineAction === "add" ? "Add Pipeline" : "Delete Pipeline"}
          </h3>
          <p className="mb-6 text-gray-700">
            {pipelineAction === "add"
              ? "Do you want to add a new pipeline stage?"
              : "Do you want to delete pipeline stages?"}
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setPipelineAction(null)}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (pipelineAction === "add") setIsAddingStage(true);
                if (pipelineAction === "delete")
                  setShowDeletePipelineModal(true);
                setPipelineAction(null);
              }}
              className={`px-4 py-2 text-sm rounded-md ${
                pipelineAction === "add"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-red-600 text-white hover:bg-red-700"
              } font-semibold shadow`}
            >
              {pipelineAction === "add" ? "Add Pipeline" : "Delete Pipeline"}
            </button>
          </div>
        </div>
      </div>
    );

  // Add lead handler for AddLeadModal
  const handleAddLead = async (leadData) => {
    await dispatch(createLead(leadData));
    // Refresh leads to get the updated grouped format
    const employeeId = sessionStorage.getItem("employeeId");
    dispatch(fetchLeads({ employeeId }));
  };

  // Assignment handler for AssignLeadModal
  const handleAssignLead = async (assignmentData) => {
    try {
      // Update the lead with sales rep and designer assignments
      await dispatch(updateLead({
        leadId: assignmentData.leadId,
        salesRep: assignmentData.salesRep,
        designer: assignmentData.designer
      }));
      
      // Move the lead to the target pipeline
      await dispatch(moveLeadToPipeline({
        leadId: assignmentData.leadId,
        newPipelineId: targetPipelineId
      }));
      
      // Refresh leads to get the updated grouped format
      const employeeId = sessionStorage.getItem("employeeId");
      dispatch(fetchLeads({ employeeId, silent: true }));
    } catch (error) {
      console.error("Assignment error:", error);
      throw error;
    }
  };

  // Team assignment handler for LeadCard
  const handleTeamAssign = async (assignmentData) => {
    try {
      console.log('LeadManagement - handleTeamAssign called with:', assignmentData);
      
      // Update the lead with sales rep and designer assignments
      const updatePayload = {
        leadId: assignmentData.leadId,
        assignSalesPersonEmpId: assignmentData.salesRep,
        assignDesignerEmpId: assignmentData.designer
      };
      
      console.log('LeadManagement - Update payload:', updatePayload);
      
      const result = await dispatch(updateLead(updatePayload));
      console.log('LeadManagement - Update result:', result);
      
      // Refresh leads to get the updated grouped format
      const employeeId = sessionStorage.getItem("employeeId");
      dispatch(fetchLeads({ employeeId, silent: true }));
    } catch (error) {
      console.error("Team assignment error:", error);
      throw error;
    }
  };

  // Semi contacted handler
  const handleSemiContactedSuccess = async (formData) => {
    try {
      // Update the lead with semi contacted data
      await dispatch(updateLead({
        leadId: formData.leadId,
        floorPlan: formData.floorPlan,
        estimatedBudget: formData.estimatedBudget,
        firstMeetingDate: formData.firstMeetingDate,
        priority: formData.priority
      }));
      
      // Move the lead to the target pipeline
      await dispatch(moveLeadToPipeline({
        leadId: formData.leadId,
        newPipelineId: targetPipelineIdForSemiContacted
      }));
      
      // Refresh leads to get the updated grouped format
      const employeeId = sessionStorage.getItem("employeeId");
      dispatch(fetchLeads({ employeeId, silent: true }));
    } catch (error) {
      console.error("Semi contacted update error:", error);
      throw error;
    }
  };

  // Potential handler
  const handlePotentialSuccess = async (formData) => {
    try {
      // Update the lead with potential data
      await dispatch(updateLead({
        leadId: formData.leadId,
        firstMeetingDate: formData.firstMeetingDate,
        requirements: formData.requirements,
        priority: formData.priority,
        initialQuote: formData.initialQuote
      }));
      
      // Move the lead to the target pipeline
      await dispatch(moveLeadToPipeline({
        leadId: formData.leadId,
        newPipelineId: targetPipelineIdForPotential
      }));
      
      // Refresh leads to get the updated grouped format
      const employeeId = sessionStorage.getItem("employeeId");
      dispatch(fetchLeads({ employeeId, silent: true }));
    } catch (error) {
      console.error("Potential update error:", error);
      throw error;
    }
  };

  // High potential handler
  const handleHighPotentialSuccess = async (formData) => {
    try {
      // Update the lead with high potential data
      await dispatch(updateLead({
        leadId: formData.leadId,
        requirements: formData.requirements,
        finalQuotation: formData.finalQuotation,
        discount: formData.discount,
        designTimeline: formData.designTimeline,
        completionTimeline: formData.completionTimeline
      }));
      
      // Move the lead to the target pipeline
      await dispatch(moveLeadToPipeline({
        leadId: formData.leadId,
        newPipelineId: targetPipelineIdForHighPotential
      }));
      
      // Refresh leads to get the updated grouped format
      const employeeId = sessionStorage.getItem("employeeId");
      dispatch(fetchLeads({ employeeId, silent: true }));
    } catch (error) {
      console.error("High potential update error:", error);
      throw error;
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-50 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-6">
          {/* <Tooltip content="Add a new lead to the pipeline">
            <button
              onClick={() => handleOpenAddLeadForm()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow flex items-center min-w-24 justify-center transition-colors duration-200 hover:bg-blue-700"
            >
              New Lead
            </button>
          </Tooltip> */}
        </div>

        <div className="flex items-center space-x-6">
          {/* Enhanced Filters Section */}
          <div className="flex items-center gap-4 bg-white rounded-lg shadow-sm border border-gray-100 px-4 py-1">
            {/* Filter Icon with better styling */}
            {/* <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-lg">
              <FaFilter className="text-blue-600 text-sm" />
            </div> */}
            
            {/* Enhanced Dropdown */}
            {/* <div className="relative">
              <select
                className="appearance-none bg-white border border-gray-200 rounded-lg text-sm px-4 py-1 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300 min-w-[180px]"
                value={selectedEmployeeId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedEmployeeId(val);
                  // If selecting specific employee, turn off unassigned
                  if (val !== "all") setUnassignedOnly(false);
                }}
              >
                <option value="all">All Team Members</option>
                {Array.isArray(managerEmployees) && managerEmployees.map(emp => (
                  <option key={emp.employeeId || emp.id} value={emp.employeeId || emp.id}>
                    {emp.name || emp.employeeName || emp.email}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div> */}
            
            {/* Enhanced Checkbox */}
            {/* <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-gray-900 transition-colors duration-200">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={unassignedOnly}
                  onChange={(e) => {
                    setUnassignedOnly(e.target.checked);
                    if (e.target.checked) setSelectedEmployeeId("all");
                  }}
                  className="sr-only"
                />
                <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all duration-200 ${
                  unassignedOnly 
                    ? 'bg-blue-600 border-blue-600' 
                    : 'bg-white border-gray-300 hover:border-blue-400'
                }`}>
                  {unassignedOnly && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="font-medium">Unassigned only</span>
            </label> */}
            
                        {/* Enhanced Clear Button - Only show when filters are active */}
            {/* {(selectedEmployeeId !== "all" || unassignedOnly) && (
              <button
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors duration-200 px-3 py-1 rounded-md hover:bg-blue-50"
                onClick={() => { setSelectedEmployeeId("all"); setUnassignedOnly(false); }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )} */}
          </div>

          <SearchBar filterText={filterText} setFilterText={setFilterText} />
          <ViewToggle 
            viewMode={viewMode} 
            setViewMode={setViewMode}
          />
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {leadsLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Loading leads...</span>
            </div>
          </div>
        ) : (
          <>
          {viewMode === "kanban" && (
          <KanbanBoardClientOnly
          leadsByStatus={leadsByStatus}
          statuses={pipelines
            .filter((p) => 
              p.name.toLowerCase() !== "freeze" && 
              p.name.toLowerCase() !== "lost" && 
              p.name.toLowerCase() !== "junk"
            )
            .map((p) => p.name)}
          kanbanStatuses={pipelines.filter((p) => 
            p.name.toLowerCase() !== "freeze" && 
            p.name.toLowerCase() !== "lost" && 
            p.name.toLowerCase() !== "junk"
          )}
          onScheduleActivity={handleScheduleActivity}

          onTeamAssign={handleTeamAssign}
          managerEmployees={managerEmployees || []}
          allowAssignment={false}
          // Debug props
          debugProps={{ leadsByStatus, statuses: pipelines.map((p) => p.name) }}
          activeRoleTab={"sales"}
        />
        )}
        {viewMode === "table" && (
          <div className="h-full w-full overflow-auto p-4">
            <LeadsTable
              leads={dedupedLeads.filter((lead) =>
                (unassignedOnly ? !lead.salesRep : true) && (
                  lead.name?.toLowerCase().includes(filterText.toLowerCase()) ||
                  lead.contactNumber?.includes(filterText) ||
                  lead.leadId?.toLowerCase().includes(filterText.toLowerCase())
                )
              )}
            />
          </div>
        )}

        </>
        )}
      </div>
      <DeletePipelineModal
        isOpen={showDeletePipelineModal}
        onClose={() => setShowDeletePipelineModal(false)}
      />
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
      <PipelineActionConfirmModal />
      <AddLeadModal
        isOpen={showAddLeadModal}
        onClose={() => setShowAddLeadModal(false)}
        onSubmit={handleAddLead}
        // Add other props as needed
      />
      <AdvancedScheduleActivityModal
        isOpen={showAdvancedScheduleModal}
        onClose={() => {
          setShowAdvancedScheduleModal(false);
          setSelectedLeadForActivity(null);
        }}
        lead={selectedLeadForActivity}
      />
      <ConvertLeadModal
        lead={showConvertModal ? selectedLead : null}
        onClose={() => setShowConvertModal(false)}
        onSuccess={() => {
          setShowConvertModal(false);
          setSelectedLead(null);
          // Refresh leads to get the updated grouped format
          const employeeId = sessionStorage.getItem("employeeId");
          dispatch(fetchLeads({ employeeId }));
        }}
      />
      <JunkReasonModal
        lead={showJunkModal ? selectedLead : null}
        onClose={() => setShowJunkModal(false)}
        onSuccess={() => {
          setShowJunkModal(false);
          setSelectedLead(null);
          // Refresh leads to get the updated grouped format
          const employeeId = sessionStorage.getItem("employeeId");
          dispatch(fetchLeads({ employeeId }));
        }}
      />
      <LostLeadModal
        lead={showLostModal ? selectedLead : null}
        onClose={() => setShowLostModal(false)}
        onSuccess={() => {
          setShowLostModal(false);
          setSelectedLead(null);
          // Refresh leads to get the updated grouped format
          const employeeId = sessionStorage.getItem("employeeId");
          dispatch(fetchLeads({ employeeId }));
        }}
      />
      <AssignLeadModal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedLeadForAssignment(null);
          setTargetPipelineId(null);
        }}
        lead={selectedLeadForAssignment}
        onAssign={handleAssignLead}
        salesEmployees={managerEmployees || []}
      />
      <SemiContactedModal
        isOpen={showSemiContactedModal}
        onClose={() => {
          setShowSemiContactedModal(false);
          setSelectedLeadForSemiContacted(null);
          setTargetPipelineIdForSemiContacted(null);
        }}
        lead={selectedLeadForSemiContacted}
        onSuccess={handleSemiContactedSuccess}
      />
      <PotentialModal
        isOpen={showPotentialModal}
        onClose={() => {
          setShowPotentialModal(false);
          setSelectedLeadForPotential(null);
          setTargetPipelineIdForPotential(null);
        }}
        lead={selectedLeadForPotential}
        onSuccess={handlePotentialSuccess}
      />
      <HighPotentialModal
        isOpen={showHighPotentialModal}
        onClose={() => {
          setShowHighPotentialModal(false);
          setSelectedLeadForHighPotential(null);
          setTargetPipelineIdForHighPotential(null);
        }}
        lead={selectedLeadForHighPotential}
        onSuccess={handleHighPotentialSuccess}
      />
    </div>
  );
};

const LeadManagement = ({ role }) => {
  return (
    <MainLayout>
      <LeadManagementContent role={role} />
    </MainLayout>
  );
};

export default withAuth(LeadManagement);