import React, { useState, useEffect } from "react";
import { FaTimes, FaUserTie, FaCheck } from "react-icons/fa";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { fetchLeadById } from "@/redux/slices/leadsSlice";

const AssignLeadModal = ({ 
  isOpen, 
  onClose, 
  lead, 
  onAssign,
  salesEmployees = [] // Array of available sales employees
}) => {
    const dispatch = useDispatch();
    const [selectedSalesRep, setSelectedSalesRep] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { lead: leadData } = useSelector((state) => state.leads);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedSalesRep("");
      setIsSubmitting(false);
      dispatch(fetchLeadById(lead.leadId));
    }
  }, [isOpen, salesEmployees, lead]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!selectedSalesRep) {
      toast.error("Please select a Sales Representative");
      return;
    }

    // Validate that selected employee exists in the list
    const salesRepExists = salesEmployees.some(emp => emp.employeeId === selectedSalesRep);

    if (!salesRepExists) {
      toast.error("Selected Sales Representative is not available");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onAssign({
        leadId: lead.leadId,
        salesRep: selectedSalesRep
      });
      
      toast.success("Lead assigned successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to assign lead");
      console.error("Assignment error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaUserTie className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Assign Lead
              </h2>
              <p className="text-sm text-gray-600">
                Assign this lead to a sales representative
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Lead Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FaCheck className="w-4 h-4 text-green-600" />
              Lead Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <p className="text-gray-900">{lead?.name || "N/A"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Contact:</span>
                <p className="text-gray-900">{leadData?.contactNumber || "N/A"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <p className="text-gray-900">{leadData?.email || "N/A"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Project Type:</span>
                <p className="text-gray-900">{leadData?.propertyType || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Assignment Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sales Representative */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FaUserTie className="w-4 h-4 text-blue-600" />
                Sales Representative *
              </label>
                             <select
                 value={selectedSalesRep}
                 onChange={(e) => setSelectedSalesRep(e.target.value)}
                 className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                 required
               >
                                   <option value="">Select Sales Representative</option>
                  {salesEmployees.length === 0 ? (
                    <option value="" disabled>No employees available</option>
                  ) : (
                    salesEmployees.map((employee) => (
                      <option key={employee.employeeId} value={employee.employeeId}>
                        {employee.name} {employee.role ? `(${employee.role})` : ''}
                      </option>
                    ))
                  )}
               </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose the sales representative who will handle this lead
              </p>
            </div>

            {/* Assignment Summary */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Assignment Summary</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Lead:</strong> {lead?.name || "N/A"}</p>
                                 <p><strong>Sales Rep:</strong> {selectedSalesRep ? salesEmployees.find(emp => emp.employeeId === selectedSalesRep)?.name : "Not selected"}</p>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end items-center gap-3 border-t flex-shrink-0">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors font-medium"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedSalesRep}
            className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Assigning...
              </>
            ) : (
              <>
                <FaCheck className="w-4 h-4" />
                Assign Lead
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignLeadModal; 