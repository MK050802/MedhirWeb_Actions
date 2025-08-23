import React, { useState, useEffect } from "react";
import { FaTimes, FaFileAlt, FaCalendarAlt, FaDollarSign, FaExclamationTriangle, FaCheck, FaUpload } from "react-icons/fa";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { fetchLeadById } from "@/redux/slices/leadsSlice";
import axios from "axios";
import getConfig from "next/config";
import { getItemFromSessionStorage } from "@/redux/slices/sessionStorageSlice";
import { Input } from "../ui/input";

const { publicRuntimeConfig } = getConfig();
const API_BASE_URL = publicRuntimeConfig.apiURL;

const SemiContactedModal = ({ 
  isOpen, 
  onClose, 
  lead, 
  onSuccess
}) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    propertyName: "",
    budget: "",
    firstCallDate: ""
  });
  const [floorPlanFile, setFloorPlanFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // dispatch(fetchLeadById(lead.leadId));
      setFormData({
        propertyName: "",
        budget: "",
        firstCallDate: ""
      });
      setFloorPlanFile(null);
      setIsSubmitting(false);
    }
  }, [isOpen, lead]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!formData.propertyName.trim()) {
      toast.error("Please provide the project name");
      return;
    }

    if (!floorPlanFile) {
      toast.error("Please upload a floor plan file");
      return;
    }

    if (!formData.budget.trim()) {
      toast.error("Please provide the estimated budget");
      return;
    }
    
    // Validate budget format
    const budgetValue = parseFloat(formData.budget.replace(/[^\d.]/g, ''));
    if (isNaN(budgetValue) || budgetValue <= 0) {
      toast.error("Budget must be a valid positive number");
      return;
    }
    
    if (budgetValue > 999999999) {
      toast.error("Budget cannot exceed 999,999,999");
      return;
    }

    if (!formData.firstCallDate) {
      toast.error("Please select the first call date");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create FormData for multipart request
      const formDataToSend = new FormData();
      
      // Prepare lead data as JSON string
      const leadData = {
        propertyName: formData.propertyName.trim(),
        budget: formData.budget.trim(),
        firstCallDate: formData.firstCallDate
      };
      
      formDataToSend.append('leadData', JSON.stringify(leadData));
      
      // Add file if selected
      if (floorPlanFile) {
        formDataToSend.append('floorPlanFile', floorPlanFile);
      }
      
      // Make API call
      const token = getItemFromSessionStorage('token') || '';
      const response = await axios.put(
        `${API_BASE_URL}/leads/semi/${lead.leadId}`,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.status === 200) {
        toast.success("Lead updated successfully!");
        onClose();
        // Call onSuccess with the updated lead data
        if (onSuccess) {
          await onSuccess(response.data);
        }
      }
    } catch (error) {
      console.error("Semi contacted update error:", error);
      toast.error(error.response?.data?.message || "Failed to update lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please select a valid file type (JPEG, PNG, GIF, PDF, DOC, DOCX)");
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      
      setFloorPlanFile(file);
    }
  };

  const handleInputChange = (field, value) => {
    let processedValue = value;

    // Apply input restrictions based on field type
    switch (field) {
      case 'propertyName':
        processedValue = value;
        break;

      case 'budget':
        // Only allow numbers and decimal point
        processedValue = value.replace(/[^\d.]/g, '');
        // Prevent multiple decimal points
        const decimalCount = (processedValue.match(/\./g) || []).length;
        if (decimalCount > 1) {
          processedValue = processedValue.replace(/\.+$/, '');
        }
        break;
      
      case 'firstCallDate':
        // Allow date input
        processedValue = value;
        break;
      
      default:
        processedValue = value;
    }

    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Semi Contacted Details
              </h2>
              <p className="text-sm text-gray-600">
                Update lead information for semi contacted stage
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

          {/* Form */}
           <form onSubmit={handleSubmit} className="space-y-6">
                         {/* Project Name */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                 Project Name <span className="text-red-500 font-bold">*</span>
               </label>
               <Input
                 type="text"
                 value={formData.propertyName}
                 onChange={(e) => handleInputChange('propertyName', e.target.value)}
                 placeholder="Enter project name"
                 className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                 required
               />
               <p className="text-xs text-gray-500 mt-1">
                 Enter the name of the project
               </p>
             </div>
             {/* Floor Plan File Upload */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                 Floor Plan File <span className="text-red-500 font-bold">*</span>
               </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
              </div>
              {floorPlanFile && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 flex items-center gap-2">
                    <FaFileAlt className="w-4 h-4" />
                    Selected: {floorPlanFile.name}
                  </p>
                </div>
              )}
                             <p className="text-xs text-gray-500 mt-1">
                 Upload floor plan file (JPEG, PNG, GIF, PDF, DOC, DOCX, max 5MB) - Required
               </p>
            </div>

            {/* Estimated Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                Estimated Budget <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value)}
                placeholder="Enter estimated budget (e.g., ₹50,00,000)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the estimated budget for the project
              </p>
            </div>

            {/* First Meeting Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                First Call Date <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.firstCallDate}
                onChange={(e) => handleInputChange('firstCallDate', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the first call date with the client
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 flex justify-end items-center gap-3 border-t flex-shrink-0">
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
             disabled={isSubmitting || !formData.propertyName.trim() || !floorPlanFile || !formData.budget.trim() || !formData.firstCallDate}
             className="px-6 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
           >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Updating...
              </>
            ) : (
              <>
                <FaCheck className="w-4 h-4" />
                Update Lead
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SemiContactedModal; 