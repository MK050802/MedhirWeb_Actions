import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import {
  FaStar,
  FaRegStar,
  FaRupeeSign,
  FaCalendarAlt,
  FaUser,
  FaUserTie,
  FaPhone,
  FaEnvelope,
  FaCommentDots,
  FaRegClock,
  FaTrash,
  FaSnowflake,
} from "react-icons/fa";
import LeadActions from "./LeadActions";
import { fetchPipelines } from "@/redux/slices/pipelineSlice";
import { moveLeadToPipeline } from "@/redux/slices/leadsSlice";
import TeamMemberAssignmentModal from "./TeamMemberAssignmentModal";
import FreezeLeadModal from "./FreezeLeadModal";
import JunkReasonModal from "./JunkReasonModal";
import LostLeadModal from "./LostLeadModal";
import LeadActionChoiceModal from "./LeadActionChoiceModal";
import { toast } from "sonner";

const LeadCard = ({
  lead,
  onEdit,
  onConvert,
  onMarkLost,
  onMarkJunk,
  onScheduleActivity,
  onTeamAssign,
  managerEmployees = [],
  allowAssignment = false,
  activeRoleTab,
}) => {
  const router = useRouter();
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamModalRole, setTeamModalRole] = useState("");
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeModalPosition, setFreezeModalPosition] = useState({
    x: 0,
    y: 0,
  });
  const [showJunkModal, setShowJunkModal] = useState(false);
  const [junkModalPosition, setJunkModalPosition] = useState({ x: 0, y: 0 });
  const [showLostModal, setShowLostModal] = useState(false);
  const [lostModalPosition, setLostModalPosition] = useState({ x: 0, y: 0 });
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [choiceModalPosition, setChoiceModalPosition] = useState({
    x: 0,
    y: 0,
  });
  const dispatch = useDispatch();
  const { pipelines } = useSelector((state) => state.pipelines);

  console.log(activeRoleTab);

  useEffect(() => {
    dispatch(fetchPipelines());
  }, [dispatch]);

  const handleCardSingleClick = (e) => {
    if (e.target.closest(".lead-actions")) {
      console.log("lead-actions");
      return;
    }

    // Don't navigate if any modal is open
    if (
      showTeamModal ||
      showFreezeModal ||
      showJunkModal ||
      showLostModal ||
      showChoiceModal
    ) {
      return;
    }

    router.push(`/Sales/leads/${lead.leadId}`);
  };

  const renderStars = (priority) => {
    const stars = [];
    for (let i = 0; i < 3; i++) {
      stars.push(
        i < priority ? (
          <FaStar key={i} className="text-yellow-400" />
        ) : (
          <FaRegStar key={i} className="text-gray-300" />
        )
      );
    }
    return <div className="flex items-center">{stars}</div>;
  };

  // Map priority string to stars
  const priorityToStars = (priority) => {
    if (typeof priority === "number") return priority;
    if (!priority) return 0;
    const map = { low: 1, medium: 2, high: 3 };
    return map[String(priority).toLowerCase()] || 0;
  };

  // Initials for Sales Rep and Designer (fallback to salesRep/designer if assignSalesPersonEmpId/assignDesignerEmpId are null)
  const getInitial = (id, fallback) => {
    if (id) return id.toString().charAt(0).toUpperCase();
    if (fallback) return fallback.toString().charAt(0).toUpperCase();
    return "--";
  };

  // Tooltip helpers
  const tooltip = (label, value) => `${label}: ${value || "Unassigned"}`;

  function formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  }

  function CustomTooltip({ children, text }) {
    const [show, setShow] = useState(false);
    return (
      <span
        className="relative"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
        {show && (
          <div className="absolute left-1/2 -translate-x-1/2 ml-3 -top-16 z-[9999] bg-white text-gray-800 px-1 rounded shadow-lg border text-xs whitespace-pre min-w-max">
            {text}
            {/* Arrow pointing down */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white z-[9999]"></div>
          </div>
        )}
      </span>
    );
  }

  const handleTeamMemberClick = (role, e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setModalPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
    setTeamModalRole(role);
    setShowTeamModal(true);
  };

  const handleTeamAssignment = (assignmentData) => {
    if (onTeamAssign) {
      onTeamAssign(assignmentData);
    }
    setShowTeamModal(false);
  };

  // Check if lead is in High Potential stage
  const isHighPotential = () => {
    // Check if the lead has a stageName property
    if (lead.stageName) {
      const stageName = lead.stageName.toLowerCase();
      return (
        stageName.includes("high potential") ||
        stageName.includes("highpotential") ||
        stageName === "high potential" ||
        stageName === "highpotential"
      );
    }

    // Check if the lead has a formType property (from the grouped data structure)
    if (lead.formType) {
      return lead.formType === "HIGHPOTENTIAL";
    }

    // Check if the lead is in a stage with formType HIGHPOTENTIAL
    // This would be set by the parent component when grouping leads
    return false;
  };

  // Handle freeze lead
  const handleFreezeLead = (e) => {
    e.stopPropagation();

    // Check if lead is already frozen
    if (lead.isFreeze === true) {
      toast.info("This lead is already frozen.");
      return;
    }

    // Get click position for modal placement
    setFreezeModalPosition({ x: e.clientX, y: e.clientY });
    setShowFreezeModal(true);
  };

  // Handle freeze success
  const handleFreezeSuccess = () => {
    // Find the Freeze stage in pipelines
    const freezeStage = pipelines.find(
      (p) =>
        p.name.toLowerCase() === "freeze" ||
        p.name.toLowerCase().includes("freeze")
    );

    if (freezeStage) {
      // Move the lead to the Freeze stage using Redux action
      dispatch(
        moveLeadToPipeline({
          leadId: lead.leadId,
          newPipelineId: freezeStage.pipelineId || freezeStage.stageId,
        })
      );
    }
  };

  // Handle trash icon click - show choice modal
  const handleTrashAction = (e) => {
    e.stopPropagation();
    // Get click position for modal placement
    setChoiceModalPosition({ x: e.clientX, y: e.clientY });
    setShowChoiceModal(true);
  };

  // Handle choice modal actions
  const handleChooseLost = () => {
    setLostModalPosition(choiceModalPosition);
    setShowLostModal(true);
  };

  const handleChooseJunk = () => {
    setJunkModalPosition(choiceModalPosition);
    setShowJunkModal(true);
  };

  const handleJunkSuccess = () => {
    setShowJunkModal(false);
  };

  const handleLostSuccess = () => {
    setShowLostModal(false);
  };

  return (
    <div
      onClick={handleCardSingleClick}
      className="p-3 rounded-lg shadow-sm border transition-all duration-200 cursor-pointer relative overflow-visible bg-white border-gray-100 hover:shadow-md"
    >
<div className="flex items-center gap-2 mb-2 text-xs text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis">
  <span className="flex items-center gap-1 font-medium truncate">
    <FaUserTie className="text-xs text-blue-500 shrink-0" />
    {lead.salesRepName || "--"}
  </span>
  <span className="text-gray-300 shrink-0">•</span>
  <FaUserTie className="text-xs text-blue-500 shrink-0" />
  <span className="flex items-center gap-1 truncate">
    {lead.designerName || "--"}
  </span>
</div>



      {/* Header: Name and Priority */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 mr-2">
          <h3 className="font-semibold text-sm truncate text-gray-900">
            {lead.name}
          </h3>
        </div>
      </div>

      {/* Budget and Date */}
      <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
        <span className="flex items-center gap-1 font-medium">
          <FaRupeeSign className="text-xs text-blue-500" />
          {lead.budget
            ? Number(lead.budget).toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })
            : "0"}
        </span>
        <span className="text-gray-300">•</span>
        <span className="flex items-center gap-1">{lead.propertyType}</span>
      </div>



      {/* Pending Activities */}
      <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
        <span className="flex items-center gap-1 font-medium">
          {lead.pendingActivities.length > 0 ? (
            <ul className="list-disc list-inside">
              {lead.pendingActivities.map((activity, index) => (
                <li key={index}>
                  {activity.title}
                </li>
              ))}
            </ul>
          ) : (
            <span>--</span>
          )}
        </span>
      </div>

      {/* Team Members */}
      {/* <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {allowAssignment ? (
            <>
              <CustomTooltip text={`${lead.assignSalesPersonEmpId || lead.salesRep || '--'}\nSales Person\nClick to assign`}>
                <button
                  onClick={(e) => handleTeamMemberClick('sales', e)}
                  className="lead-actions w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs cursor-pointer border border-white shadow-sm hover:bg-blue-200 hover:scale-110 transition-all duration-200"
                >
                  {getInitial(lead.assignSalesPersonEmpId, lead.salesRep)}
                </button>
              </CustomTooltip>
              <CustomTooltip text={`${lead.assignDesignerEmpId || lead.designer || '--'}\nDesigner\nClick to assign`}>
                <button
                  onClick={(e) => handleTeamMemberClick('designer', e)}
                  className="lead-actions w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs cursor-pointer border border-white shadow-sm hover:bg-green-200 hover:scale-110 transition-all duration-200"
                >
                  {getInitial(lead.assignDesignerEmpId, lead.designer)}
                </button>
              </CustomTooltip>
            </>
          ) : (
            <>
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs border border-white shadow-sm">
                {getInitial(lead.assignSalesPersonEmpId, lead.salesRep)}
              </div>
              <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs border border-white shadow-sm">
                {getInitial(lead.assignDesignerEmpId, lead.designer)}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
        {/* Activity Button */}
      {/* <button
          type="button"
          title="Schedule Activity"
          onClick={() => onScheduleActivity && onScheduleActivity(lead)}
          className="lead-actions hover:bg-blue-50 rounded-full p-1 transition-colors text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-300"
        >
          <FaRegClock size={14} />
        </button> */}

      {/* Freeze Button - Only show for High Potential leads */}
      {/* {isHighPotential() && (
          <CustomTooltip text={lead.isFreeze ? "Lead is frozen" : "Freeze Lead"}>
            <button
              type="button"
              onClick={handleFreezeLead}
              disabled={lead.isFreeze}
              className={`lead-actions rounded-full p-1 transition-colors focus:outline-none focus:ring-1 disabled:cursor-not-allowed ${
                lead.isFreeze 
                  ? 'text-purple-600 bg-purple-100 ring-purple-300' 
                  : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50 focus:ring-purple-300'
              }`}
            >
              <FaSnowflake size={14} />
            </button>
            </CustomTooltip>
        )} */}

      {/* <button
          type="button"
          title="Mark as Lost or Junk"
          onClick={handleTrashAction}
          className="lead-actions hover:bg-red-50 rounded-full p-1 transition-colors text-gray-400 hover:text-red-600 focus:outline-none focus:ring-1 focus:ring-red-300"
        >
          <FaTrash size={14} />
        </button> */}
      {/* </div>
      </div> */}

      {/* Activity Status */}
      {lead.latestActivityTitle && (
        <div className="text-xs text-gray-400 truncate">
          {lead.latestActivityTitle}
        </div>
      )}

      {/* Team Member Assignment Modal */}
      <TeamMemberAssignmentModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        lead={lead}
        onAssign={handleTeamAssignment}
        role={teamModalRole}
        salesEmployees={managerEmployees}
        position={modalPosition}
      />

      {/* Freeze Lead Modal */}
      <FreezeLeadModal
        isOpen={showFreezeModal}
        onClose={() => setShowFreezeModal(false)}
        lead={lead}
        onSuccess={handleFreezeSuccess}
        position={freezeModalPosition}
        activeRoleTab={activeRoleTab}
      />

      {/* Junk Reason Modal */}
      <JunkReasonModal
        isOpen={showJunkModal}
        onClose={() => setShowJunkModal(false)}
        lead={lead}
        onSuccess={handleJunkSuccess}
        position={junkModalPosition}
        activeRoleTab={activeRoleTab}
      />

      {/* Lost Lead Modal */}
      <LostLeadModal
        isOpen={showLostModal}
        onClose={() => setShowLostModal(false)}
        lead={lead}
        onSuccess={handleLostSuccess}
        position={lostModalPosition}
        activeRoleTab={activeRoleTab}
      />

      {/* Lead Action Choice Modal */}
      <LeadActionChoiceModal
        isOpen={showChoiceModal}
        onClose={() => setShowChoiceModal(false)}
        lead={lead}
        onChooseLost={handleChooseLost}
        onChooseJunk={handleChooseJunk}
        position={choiceModalPosition}
      />
    </div>
  );
};

export default LeadCard;
