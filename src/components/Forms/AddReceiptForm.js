import { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaReceipt, FaChevronDown, FaChevronRight, FaInfoCircle, FaLink, FaUpload, FaFileAlt, FaTrash, FaFileImage, FaPaperclip } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { addReceipt, getNextReceiptNumber, generateNextReceiptNumber } from "../../redux/slices/receiptSlice";
import { fetchProjectCustomerList, fetchInvoicesByProject, fetchReceiptsByProject } from "@/redux/slices/receiptSlice";
import FilePreviewer from "../ui/FilePreviewer";
import { ToWords } from 'to-words';

const AddReceiptForm = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState({
    projectName: '',
    customerName: '',
    receiptNumber: '',
    receiptDate: new Date().toISOString().split('T')[0],
    amount: '',
    paymentMethod: 'Bank Transfer',
    reference: '',
    bankAccount: '',
    chequeNumber: '',
    upiTransactionId: '',
  });
const dispatch = useDispatch();
  const { projectCustomerList, invoicesByProject, receiptsByProject, nextReceiptNumber, loading } = useSelector((state) => state.receipts);
  const [errors, setErrors] = useState({});
  const [isAccountingCollapsed, setIsAccountingCollapsed] = useState(true);

  // File upload state - updated to match AddBillForm.js pattern
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(0); // 0 = fit to container, 1.0 = 100%, etc.
  
  // New state for project-specific data
  const [projectReceiptData, setProjectReceiptData] = useState({
    totalAmountReceived: 0,
    totalUnallocatedAmount: 0,
    previousReceipts: []
  });

  // Initialize ToWords for converting numbers to words
  const toWords = new ToWords({
    localeCode: 'en-IN',
    converterOptions: {
      currency: true,
      ignoreDecimal: false,
      ignoreZeroCurrency: false,
    }
  });

  // Static data - in real app, these would come from APIs
  const customers = [
    { id: 1, name: 'Evergreen Solar' },
    { id: 2, name: 'Horizon Dynamics' },
    { id: 3, name: 'Pioneer Builders' }
  ];

  // Get company ID from session storage
  const companyId = typeof window !== 'undefined' ? 
    sessionStorage.getItem("employeeCompanyId") || 
    sessionStorage.getItem("companyId") || 
    sessionStorage.getItem("company") : null;

  // Function to fetch next receipt number (generates and increments)
  const fetchNextReceiptNumber = async () => {
    if (companyId) {
      try {
        await dispatch(getNextReceiptNumber(companyId)).unwrap();
      } catch (error) {
        console.error('Failed to fetch next receipt number:', error);
        // Don't show error toast as this is optional functionality
      }
    }
  };

  const paymentMethods = ['Bank Transfer', 'Cheque', 'UPI', 'Cash', 'Credit Card', 'Debit Card'];
  const bankAccounts = ['HDFC Bank - *****5678', 'SBI Bank - *****1234', 'ICICI Bank - *****4321'];

  // Auto-fill receipt number on form load
  useEffect(() => {
    if (companyId) {
      fetchNextReceiptNumber();
    }
  }, [companyId]);

  // Auto-populate receipt number when next receipt number is generated (always updates the field)
  useEffect(() => {
    if (nextReceiptNumber) {
      setFormData(prev => ({
        ...prev,
        receiptNumber: nextReceiptNumber
      }));
    }
  }, [nextReceiptNumber]);

  useEffect(() => {
  if (initialData) {
    setFormData(prev => ({
      ...prev,
      projectName: initialData.projectName || '',
      customerName: initialData.client || '',
      customerId: initialData.customerId || '',
      projectId: initialData.projectId || '',
      amount: initialData.amount || '',
      amountReceived: initialData.amount || '',
    }));
  }
}, [initialData]);

useEffect(() => {
  dispatch(fetchProjectCustomerList(companyId));
}, [dispatch]);

// Calculate project-specific receipt data when receiptsByProject changes
useEffect(() => {
  if (receiptsByProject) {
    if (receiptsByProject.length > 0) {
      const totalReceived = receiptsByProject.reduce((sum, receipt) => sum + (receipt.amountReceived || 0), 0);
      const totalAllocated = receiptsByProject.reduce((sum, receipt) => {
        const allocated = receipt.linkedInvoices ? 
          receipt.linkedInvoices.reduce((invSum, inv) => invSum + (inv.amountAllocated || 0), 0) : 0;
        return sum + allocated;
      }, 0);
      
      // Use backend's totalUnallocatedAmount if available, otherwise calculate
      const unallocatedAmount = receiptsByProject.totalUnallocatedAmount || (totalReceived - totalAllocated);
      
      setProjectReceiptData({
        totalAmountReceived: totalReceived,
        totalUnallocatedAmount: unallocatedAmount,
        previousReceipts: receiptsByProject
      });
    } else {
      // First receipt for this project - no previous receipts
      setProjectReceiptData({
        totalAmountReceived: 0,
        totalUnallocatedAmount: 0,
        previousReceipts: []
      });
    }
    
    // Remove auto-population - user must manually enter amount
  }
}, [receiptsByProject]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // File upload handlers - updated to match AddBillForm.js pattern
  const handleFileUpload = (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff', 'application/pdf'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'pdf'];
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setError('Invalid file type. Please upload JPG, JPEG, PNG, BMP, TIFF, or PDF files only.');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size too large. Maximum allowed size is 10MB.');
      return;
    }

    setError(null);
    setUploadedFile(file);
    setUploadedImage(file);

    console.log(
      "File uploaded successfully:",
      file.name,
      `(${(file.size / 1024 / 1024).toFixed(2)}MB)`
    );
    
    toast.success(`File "${file.name}" uploaded successfully!`);
  };

  const handleRemoveFile = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    setError(null);
    setScale(0); // Reset zoom when removing file
    toast.success("File removed successfully");
  };

  const toggleAccountingSection = () => {
    setIsAccountingCollapsed(!isAccountingCollapsed);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.customerName) {
      newErrors.customerName = 'Customer name is required';
      toast.error('Customer name is required');
    }
    if (!formData.receiptNumber.trim()) {
      newErrors.receiptNumber = 'Receipt number is required';
      toast.error('Receipt number is required');
    } else if (checkReceiptNumberExists(formData.receiptNumber.trim())) {
      newErrors.receiptNumber = 'Receipt number already exists';
      toast.error('Receipt number already exists');
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
      toast.error('Valid amount is required');
    }
    
    // Validate cheque number if payment method is Cheque
    if (formData.paymentMethod === 'Cheque') {
      if (!formData.chequeNumber || !formData.chequeNumber.trim()) {
        newErrors.chequeNumber = 'Cheque number is required';
        toast.error('Cheque number is required');
      } else if (!validateChequeNumber(formData.chequeNumber.trim())) {
        newErrors.chequeNumber = 'Cheque number must be exactly 6 digits';
        toast.error('Cheque number must be exactly 6 digits');
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const [selectedOption, setSelectedOption] = useState(null);
const [isOpen, setIsOpen] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  if (validateForm()) {
    try {
      let finalReceiptNumber = formData.receiptNumber;
      if (companyId) {
        try {
          const result = await dispatch(generateNextReceiptNumber(companyId)).unwrap();
          finalReceiptNumber = result.nextReceiptNumber;
        } catch (error) {
          console.error('Failed to generate receipt number:', error);
        }
      }

      // Add companyId to receiptData
      const receiptData = {
        customerId: formData.customerId,
        projectId: formData.leadId,
        amountReceived: parseFloat(formData.amount),
        linkedInvoices: [],
        receiptDate: formData.receiptDate,
        paymentMethod: formData.paymentMethod,
        receiptNumber: finalReceiptNumber,
        paymentTransactionId:
          formData.reference ||
          formData.chequeNumber ||
          formData.upiTransactionId ||
          '',
        bankAccountId: formData.bankAccount || null,
        companyId: companyId, // <-- Add this line
      };

      const formDataToSend = new FormData();
      formDataToSend.append('receipt', JSON.stringify(receiptData));
      if (uploadedFile) {
        formDataToSend.append('file', uploadedFile);
      }

      await dispatch(addReceipt(formDataToSend)).unwrap();
      toast.success('Receipt added successfully!');
      setTimeout(() => {
        if (onSubmit) onSubmit();
      }, 100);
    } catch (error) {
      console.error('Receipt submission error:', error);
      toast.error(error?.message || 'Failed to add receipt');
      setErrors({ submit: error?.message || 'Failed to add receipt' });
    }
  }
};
  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  // Validate cheque number format
  function validateChequeNumber(chequeNumber) {
    const regex = /^\d{6}$/;
    return regex.test(chequeNumber);
  }

  // Check if receipt number already exists
  function checkReceiptNumberExists(receiptNumber) {
    if (!receiptsByProject || receiptsByProject.length === 0) return false;
    return receiptsByProject.some(receipt => receipt.receiptNumber === receiptNumber);
  }

  const receiptAmount = parseFloat(formData.amount) || 0;

  return (
    <div className="flex flex-col h-full pt-[var(--app-header-h)]">
      {/* Main Content */}
      <main className="flex-1 overflow-hidden pl-0 pr-2 pb-2 min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-full min-w-0">
          {/* Form Panel (Left) */}
          <div className="lg:col-span-1 overflow-hidden pb-8 min-w-0">
            {/* Form Content */}
            <div className="space-y-3 pb-4 overflow-y-auto h-full">
              {/* Top Section - Receipt Details */}
              <div className="flex flex-col lg:flex-row gap-3">
                {/* Receipt Details */}
                <div className="flex-1 space-y-2">
                  <h2 className="text-lg font-semibold border-b pb-2 mb-2 text-gray-900">
                    Receipt Details
                  </h2>
                  
                  <div className="relative inline-block w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                    <button
                      type="button"
                      onClick={() => setIsOpen(!isOpen)}
                      className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      {selectedOption?.projectName || "Select Project"}
                      <span className="float-right">
                        <svg className={`w-4 h-4 inline transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </button>

                    {isOpen && (
                      <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded max-h-60 overflow-y-auto">
                        {projectCustomerList.map((project) => (
                          <li
                            key={project.projectId}
                            onClick={async () => {
                              setSelectedOption(project);
                              setFormData(prev => ({
                                ...prev,
                                projectName: project.projectName,
                                customerName: project.customerName,
                                customerId: project.customerId,
                                leadId: project.projectId,
                              }));
                              setIsOpen(false);
                              // Fetch receipts for this project
                              dispatch(fetchReceiptsByProject(project.projectId));
                            }}
                            className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                          >
                            {project.projectName}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      readOnly
                      className={`w-full px-4 py-3 text-base border rounded-lg bg-gray-100 cursor-not-allowed ${errors.customerName ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Auto-filled from Project"
                    />
                    {errors.customerName && <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Date <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      name="receiptDate" 
                      value={formData.receiptDate} 
                      onChange={handleChange} 
                      className={`w-full px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-green-500 ${errors.receiptDate ? 'border-red-500' : 'border-gray-300'}`} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Number <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      name="receiptNumber" 
                      value={formData.receiptNumber} 
                      onChange={handleChange} 
                      className={`w-full px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-green-500 ${errors.receiptNumber ? 'border-red-500' : 'border-gray-300'}`} 
                      placeholder="e.g., REC-2025-001" 
                    />
                    {errors.receiptNumber && <p className="text-red-500 text-sm mt-1">{errors.receiptNumber}</p>}
                  </div>
                </div>

                {/* Payment Details */}
                <div className="flex-1 space-y-2">
                  <h2 className="text-lg font-semibold border-b pb-2 mb-2 text-gray-900">
                    Payment Details
                  </h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount Received (INR) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                      <input 
                        type="number" 
                        name="amount" 
                        value={formData.amount} 
                        onChange={handleChange} 
                        step="0.01" 
                        min="0" 
                        className={`w-full pl-8 pr-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-green-500 ${errors.amount ? 'border-red-500' : 'border-gray-300'}`} 
                        placeholder="0.00" 
                      />
                    </div>
                    {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method <span className="text-red-500">*</span></label>
                    <select 
                      name="paymentMethod" 
                      value={formData.paymentMethod} 
                      onChange={handleChange} 
                      className={`w-full px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-green-500 ${errors.paymentMethod ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      {paymentMethods.map(method => <option key={method} value={method}>{method}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Received Bank Account <span className="text-red-500">*</span></label>
                    <select 
                      name="bankAccount" 
                      value={formData.bankAccount} 
                      onChange={handleChange} 
                      className={`w-full px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-green-500 ${errors.bankAccount ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">Select bank account</option>
                      {bankAccounts.map(account => <option key={account} value={account}>{account}</option>)}
                    </select>
                  </div>

                  {formData.paymentMethod === 'Cheque' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cheque Number <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        name="chequeNumber" 
                        value={formData.chequeNumber} 
                        onChange={handleChange} 
                        className={`w-full px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-green-500 ${errors.chequeNumber ? 'border-red-500' : 'border-gray-300'}`} 
                        placeholder="Enter 6-digit cheque number" 
                      />
                      {errors.chequeNumber && <p className="text-red-500 text-sm mt-1">{errors.chequeNumber}</p>}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment trans. ID</label>
                    <input 
                      type="text" 
                      name="reference" 
                      value={formData.reference} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" 
                      placeholder="e.g., Bank transaction ID" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Panel (Right) */}
          <div className="lg:col-span-1 overflow-y-auto p-4 lg:p-6 pb-8 h-full min-w-0">
            <div className="h-full flex flex-col">
              <div className="flex-1">
                {uploadedImage ? (
                  <div className="h-full flex flex-col">
                    <div className="flex-1 relative">
                      <FilePreviewer
                        file={uploadedImage}
                        className="h-full w-full"
                        scale={scale}
                      />
                      
                      {/* Zoom Controls Overlay */}
                      <div className="absolute top-2 left-2 z-10">
                        <div className="bg-white bg-opacity-90 rounded-lg shadow-md p-2 text-xs text-gray-600">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Zoom:</span>
                            <span>{scale === 0 ? 'Fit' : `${Math.round(scale * 100)}%`}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* File Controls */}
                    <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaFileImage className="text-blue-500" />
                        <span className="font-medium">
                          {uploadedImage.name || 'Uploaded File'}
                        </span>
                        {uploadedImage.size && uploadedImage.size > 0 && (
                          <span className="text-gray-500">
                            ({(uploadedImage.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        )}
                        {uploadedImage.isExistingAttachment && (
                          <span className="text-blue-600 text-xs bg-blue-100 px-2 py-1 rounded-full">
                            Existing
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {scale !== 0 && (
                          <button
                            type="button"
                            onClick={() => setScale(0)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            title="Reset zoom to fit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          title="Remove file"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    <div className="flex-1">
                      <div className="h-full border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-200">
                        <div className="h-full flex flex-col items-center justify-center p-6">
                          <div className="text-center">
                            <FaUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-lg font-medium text-gray-700 mb-2">
                              Upload Payment Proof
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                              Click to browse or drag and drop your file here
                            </p>
                            <p className="text-xs text-gray-400 mb-4">
                              Supported formats: JPG, JPEG, PNG, BMP, TIFF, PDF
                            </p>
                            <p className="text-xs text-gray-400 mb-4">
                              Maximum file size: 10MB
                            </p>
                            
                            <label className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer transition-all hover:scale-105 active:scale-95">
                              <FaPaperclip className="mr-2" />
                              Choose File
                              <input
                                type="file"
                                className="hidden"
                                accept=".jpg,.jpeg,.png,.bmp,.tiff,.pdf"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleFileUpload(e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {error && (
                <div className="mt-4 text-red-600 bg-red-100 border border-red-300 p-3 rounded-lg text-left">
                  <strong>❌ Error:</strong> {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <div className="text-lg font-bold">
              Total Receipt Amount:{" "}
              <span className="text-green-600">
                ₹{receiptAmount.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Amount in Words: <span className="italic">{toWords.convert(receiptAmount)}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 rounded-lg transition-colors text-gray-700 bg-white hover:bg-gray-50"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center space-x-2"
              onClick={handleSubmit}
            >
              <FaSave className="w-4 h-4" />
              <span>Save Receipt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full bg-gray-50 border-t border-gray-200 p-2">
        <div className="text-center text-sm text-gray-500">
          {/* Footer content can be added here */}
        </div>
      </div>
    </div>
  );
};

export default AddReceiptForm;