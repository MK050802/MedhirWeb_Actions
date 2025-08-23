import React, { useState, useEffect } from "react";
import { FaTimes, FaFileInvoiceDollar, FaDollarSign, FaPercent, FaCalendarAlt, FaClock, FaCheck } from "react-icons/fa";
import { toast } from "sonner";

const HighPotentialModal = ({ 
  isOpen, 
  onClose, 
  lead, 
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    requirements: "",
    finalQuotation: "",
    discount: "",
    designTimeline: "",
    completionTimeline: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        requirements: "",
        finalQuotation: "",
        discount: "",
        designTimeline: "",
        completionTimeline: ""
      });
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!formData.requirements.trim()) {
      toast.error("Please provide the quotation details");
      return;
    }
    
    if (formData.requirements.trim().length < 10) {
      toast.error("Quotation details must be at least 10 characters");
      return;
    }
    
    if (formData.requirements.trim().length > 500) {
      toast.error("Quotation details must be less than 500 characters");
      return;
    }

    if (!formData.finalQuotation.trim()) {
      toast.error("Please provide the final quoted amount");
      return;
    }
    
    // Validate final quoted amount
    const finalAmount = parseFloat(formData.finalQuotation.replace(/[^\d.]/g, ''));
    if (isNaN(finalAmount) || finalAmount <= 0) {
      toast.error("Final quoted amount must be a valid positive number");
      return;
    }
    
    if (finalAmount > 999999999) {
      toast.error("Final quoted amount cannot exceed 999,999,999");
      return;
    }

    if (!formData.discount.trim()) {
      toast.error("Please provide the discount percentage");
      return;
    }
    
    // Validate discount percentage
    const discountPercent = parseFloat(formData.discount.replace(/[^\d.]/g, ''));
    if (isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100) {
      toast.error("Discount percentage must be between 0 and 100");
      return;
    }

    if (!formData.designTimeline.trim()) {
      toast.error("Please provide the design timeline");
      return;
    }
    
    if (formData.designTimeline.trim().length < 5) {
      toast.error("Design timeline must be at least 5 characters");
      return;
    }
    
    if (formData.designTimeline.trim().length > 100) {
      toast.error("Design timeline must be less than 100 characters");
      return;
    }

    if (!formData.completionTimeline.trim()) {
      toast.error("Please provide the completion timeline");
      return;
    }
    
    if (formData.completionTimeline.trim().length < 5) {
      toast.error("Completion timeline must be at least 5 characters");
      return;
    }
    
    if (formData.completionTimeline.trim().length > 100) {
      toast.error("Completion timeline must be less than 100 characters");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSuccess({
        leadId: lead.leadId,
        requirements: formData.requirements.trim(),
        finalQuotation: parseFloat(formData.finalQuotation.replace(/[^\d.]/g, '')),
        discount: parseFloat(formData.discount.replace(/[^\d.]/g, '')),
        designTimeline: formData.designTimeline.trim(),
        completionTimeline: formData.completionTimeline.trim()
      });
      
      toast.success("Lead updated successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to update lead");
      console.error("High potential update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleInputChange = (field, value) => {
    let processedValue = value;

    // Apply input restrictions based on field type
    switch (field) {
      case 'requirements':
        // Allow alphanumeric, spaces, and common characters
        processedValue = value.replace(/[^a-zA-Z0-9\s,.-]/g, '').slice(0, 500);
        break;
      
      case 'finalQuotation':
        // Only allow numbers and decimal point
        processedValue = value.replace(/[^\d.]/g, '');
        // Prevent multiple decimal points
        const decimalCount = (processedValue.match(/\./g) || []).length;
        if (decimalCount > 1) {
          processedValue = processedValue.replace(/\.+$/, '');
        }
        break;
      
      case 'discount':
        // Only allow numbers and decimal point, max 100
        processedValue = value.replace(/[^\d.]/g, '');
        const discountValue = parseFloat(processedValue);
        if (!isNaN(discountValue) && discountValue > 100) {
          processedValue = '100';
        }
        break;
      
      case 'designTimeline':
      case 'completionTimeline':
        // Allow alphanumeric, spaces, and common characters
        processedValue = value.replace(/[^a-zA-Z0-9\s,.-]/g, '').slice(0, 100);
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
                High Potential Lead Details
              </h2>
              <p className="text-sm text-gray-600">
                Update quotation and timeline information
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
          {/* <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
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
                <p className="text-gray-900">{lead?.contactNumber || "N/A"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <p className="text-gray-900">{lead?.email || "N/A"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Project Type:</span>
                <p className="text-gray-900">{lead?.propertyType || "N/A"}</p>
              </div>
            </div>
          </div> */}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quotation Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                Quotation Details *
              </label>
              <textarea
                value={formData.requirements}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
                placeholder="Provide detailed quotation information..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white resize-none"
                rows="3"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Provide comprehensive quotation details
              </p>
            </div>

            {/* Final Quoted Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                Final Quoted Amount *
              </label>
              <input
                type="text"
                value={formData.finalQuotation}
                onChange={(e) => handleInputChange('finalQuotation', e.target.value)}
                placeholder="Enter final quoted amount (e.g., ₹9,50,000)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the final quoted amount after negotiations
              </p>
            </div>

            {/* Discount Percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                Discount Percentage *
              </label>
              <input
                type="text"
                value={formData.discount}
                onChange={(e) => handleInputChange('discount', e.target.value)}
                placeholder="Enter discount percentage (e.g., 5%)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the discount percentage offered
              </p>
            </div>

            {/* Design Timeline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                Design Timeline *
              </label>
              <input
                type="text"
                value={formData.designTimeline}
                onChange={(e) => handleInputChange('designTimeline', e.target.value)}
                placeholder="Enter design timeline (e.g., 2-3 weeks)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Specify the timeline for design completion
              </p>
            </div>

            {/* Completion Timeline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                Completion Timeline *
              </label>
              <input
                type="text"
                value={formData.completionTimeline}
                onChange={(e) => handleInputChange('completionTimeline', e.target.value)}
                placeholder="Enter completion timeline (e.g., 3-4 months)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Specify the timeline for project completion
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
            disabled={isSubmitting || !formData.requirements.trim() || !formData.finalQuotation.trim() || !formData.discount.trim() || !formData.designTimeline.trim() || !formData.completionTimeline.trim()}
            className="px-6 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
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

export default HighPotentialModal; 