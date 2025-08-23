import { useState, useEffect, useRef } from 'react';
import { FaPlus, FaPaperclip, FaFilePdf, FaFileImage, FaTimes, FaUpload, FaTrash } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendors } from '../../redux/slices/vendorSlice';
import { fetchBillsOfVendor } from '../../redux/slices/BillSlice';
import { addPayment, updatePayment } from '../../redux/slices/paymentSlice';
import { toast } from 'sonner';
import FilePreviewer from '../ui/FilePreviewer';
import { ToWords } from 'to-words';

const BulkPaymentForm = ({ mode = 'add', initialData = null, onSubmit, onCancel }) => {
  const dispatch = useDispatch();
  const { vendors, loading: vendorsLoading, error } = useSelector((state) => state.vendors);
  const { vendorBills: vendorBills, loading: billsLoading } = useSelector((state) => state.bills);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');
  const vendorInputRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('bills'); // 'bills' | 'notes' | 'attachments'
  const [selectedVendor, setSelectedVendor] = useState(null);

  // Payment receipt upload state - updated to match AddBillForm.js pattern
  const [uploadedReceipt, setUploadedReceipt] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [scale, setScale] = useState(0); // 0 = fit to container, 1.0 = 100%, etc.

  // Initialize ToWords for converting numbers to words
  const toWords = new ToWords({
    localeCode: 'en-IN',
    converterOptions: {
      currency: true,
      ignoreDecimal: false,
      ignoreZeroCurrency: false,
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const [formData, setFormData] = useState({
    vendor: '',
    gstin: '',
    paymentDate: new Date().toISOString().split('T')[0],
    company: 'ABC Enterprises Ltd.',
    journal: '',
    paymentMethod: '',
    bankAccount: '',
    currency: 'INR',
    reference: '',
    tdsApplied: false,
    notes: '',
    totalAmount: '' // <-- Add totalAmount to form state
  });

  // Initialize form data when in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      // Find the vendor for this payment
      const vendor = vendors.find(v => v.vendorId === initialData.vendorId);
      if (vendor) {
        setSelectedVendor(vendor);
        setVendorSearch(vendor.vendorName);
        // Fetch bills for this vendor
        const companyId = sessionStorage.getItem('employeeCompanyId');
        if (companyId) {
          dispatch(fetchBillsOfVendor({ vendorId: vendor.vendorId, companyId }));
        } else {
          console.error('Company ID not found in session storage');
          toast.error('Company ID not found. Please refresh the page.');
        }
        setFormData({
          vendor: vendor.vendorName,
          gstin: vendor.gstin,
          paymentDate: initialData.paymentDate,
          company: initialData.company || 'ABC Enterprises Ltd.',
          journal: initialData.journal || '',
          paymentMethod: initialData.paymentMethod,
          bankAccount: initialData.bankAccount,
          currency: initialData.currency || 'INR',
          reference: initialData.paymentTransactionId || '',
          tdsApplied: initialData.tdsApplied || false,
          notes: initialData.notes || '',
          totalAmount: initialData.totalAmount || '' // <-- Initialize from initialData if present
        });
        
        // Set payment receipt if available
        if (initialData.paymentProofUrl) {
          setUploadedReceipt(initialData.paymentProofUrl);
          setUploadedFile(null);
        }
      }
    }
  }, [mode, initialData, vendors, dispatch]);



  const [selectedBills, setSelectedBills] = useState([]);
  const [availableBills, setAvailableBills] = useState([]);
  const [errors, setErrors] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [availableCredit, setAvailableCredit] = useState(0);
  const [appliedCredit, setAppliedCredit] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchVendors());
  }, [dispatch]);

  const companies = ['ABC Enterprises Ltd.', 'XYZ India Pvt Ltd.', 'Tech Solutions Pvt Ltd.'];
  const journals = ['Cash Payment Journal', 'Bank Payment Journal', 'Cheque Payment Journal'];
  const paymentMethods = ['Bank Transfer', 'Cheque', 'Cash'];
  const bankAccounts = ['HDFC Bank - *****5678', 'SBI Bank - *****1234', 'ICICI Bank - *****4321'];
  const currencies = ['INR', 'USD', 'EUR'];

  const unpaidBills = [
    {
      id: 1, billNo: 'INV-2025-001', billDate: '2025-06-15', dueDate: '2025-07-15',
      amountDue: 45000.00, subtotal: 38135.59, gst: 6864.41, tdsDeducted: 0,
      gstTreatment: 'GST Registered', reference: 'PO-2025-123'
    },
    {
      id: 2, billNo: 'INV-2025-002', billDate: '2025-06-18', dueDate: '2025-06-28',
      amountDue: 23101.69, subtotal: 19915.25, gst: 3584.75, tdsDeducted: 398.31,
      gstTreatment: 'Composition', reference: 'PO-2025-124'
    },
    {
      id: 3, billNo: 'INV-2025-003', billDate: '2025-06-20', dueDate: '2025-07-20',
      amountDue: 67800.00, subtotal: 57457.63, gst: 10342.37, tdsDeducted: 0,
      gstTreatment: 'GST Registered', reference: 'PO-2025-125'
    }
  ];

  useEffect(() => {
    if (selectedVendor) {
      // In edit mode, show all bills (including paid ones) so we can see what was paid
      // In add mode, filter only unpaid bills
      const billsToShow = mode === 'edit' 
        ? vendorBills 
        : vendorBills.filter(bill => 
            bill.paymentStatus === 'UN_PAID' || bill.paymentStatus === 'UNPAID' || bill.paymentStatus === 'PARTIALLY_PAID'
          );
      setAvailableBills(billsToShow);
      setFormData(prev => ({ 
        ...prev, 
        gstin: selectedVendor.gstin,
        tdsApplied: selectedVendor.tdsApplicable || false
      }));
      setAvailableCredit(selectedVendor.availableCredit || 0);
      
      // In edit mode, if we have initial data, make sure selected bills are properly set
      if (mode === 'edit' && initialData && initialData.billPayments) {
        const billsWithPaymentAmount = initialData.billPayments.map(billPayment => {
          const bill = vendorBills.find(b => b.billId === billPayment.billId);
          if (bill) {
            return {
              ...bill,
              paymentAmount: billPayment.paidAmount
            };
          }
          return null;
        }).filter(bill => bill !== null);
        
        if (billsWithPaymentAmount.length > 0) {
          setSelectedBills(billsWithPaymentAmount);
        }
      }
    } else {
      setAvailableBills([]);
      setSelectedBills([]);
      setFormData(prev => ({ ...prev, gstin: '', tdsApplied: false }));
      setAvailableCredit(0);
      setAppliedCredit(0);
    }
  }, [selectedVendor, vendorBills, mode, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleVendorInput = (e) => {
    setVendorSearch(e.target.value);
    setShowVendorDropdown(true);
    setFormData(prev => ({ ...prev, vendor: '', gstin: '' }));
  };

  const handleVendorSelect = (vendor) => {
    setFormData(prev => ({ ...prev, vendor: vendor.vendorName, gstin: vendor.gstin }));
    setVendorSearch(vendor.vendorName);
    setShowVendorDropdown(false);
    setErrors(prev => ({ ...prev, vendor: undefined }));
    setSelectedVendor(vendor);
    
    // Get company ID from session storage
    const companyId = sessionStorage.getItem('employeeCompanyId');
    if (companyId) {
      dispatch(fetchBillsOfVendor({ vendorId: vendor.vendorId, companyId }));
    } else {
      console.error('Company ID not found in session storage');
      toast.error('Company ID not found. Please refresh the page.');
    }
  };

  const handleBillSelection = (billId, checked) => {
    if (checked) {
      const bill = availableBills.find(b => b.billId === billId);
      // In edit mode, if this bill was already paid, use the original payment amount
      // In add mode, use the due amount
      const existingSelectedBill = selectedBills.find(sb => sb.billId === billId);
      const paymentAmount = mode === 'edit' && existingSelectedBill 
        ? existingSelectedBill.paymentAmount 
        : bill.dueAmount;
      
      const billWithPaymentAmount = {
        ...bill,
        paymentAmount: paymentAmount
      };
      setSelectedBills(prev => [...prev, billWithPaymentAmount]);
    } else {
      setSelectedBills(prev => prev.filter(b => b.billId !== billId));
    }
  };

  const handlePaymentAmountChange = (billId, amount) => {
    // Handle empty string case - don't auto-convert to 0
    if (amount === '') {
      setSelectedBills(prev => 
        prev.map(bill => 
          bill.billId === billId 
            ? { ...bill, paymentAmount: 0 }
            : bill
        )
      );
      return;
    }

    const numAmount = parseFloat(amount);
    
    // Handle invalid numbers
    if (isNaN(numAmount)) {
      return; // Don't update if it's not a valid number
    }

    const bill = availableBills.find(b => b.billId === billId);
    const maxAmount = bill ? bill.dueAmount : 0;
    
    // Ensure amount doesn't exceed the bill's due amount or go below 0
    const validAmount = Math.min(Math.max(0, numAmount), maxAmount);
    
    setSelectedBills(prev => 
      prev.map(bill => 
        bill.billId === billId 
          ? { ...bill, paymentAmount: validAmount }
          : bill
      )
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const billsWithPaymentAmount = availableBills.map(bill => {
        // In edit mode, if this bill was already selected, use the existing payment amount
        const existingSelectedBill = selectedBills.find(sb => sb.billId === bill.billId);
        const paymentAmount = mode === 'edit' && existingSelectedBill 
          ? existingSelectedBill.paymentAmount 
          : bill.dueAmount;
        
        return {
          ...bill,
          paymentAmount: paymentAmount
        };
      });
      setSelectedBills(billsWithPaymentAmount);
    } else {
      setSelectedBills([]);
    }
  };

  const handleCreditChange = (e) => {
    let amount = parseFloat(e.target.value) || 0;
    const maxApplicable = Math.min(availableCredit, totalAmountDueSelected);
    if (amount < 0) amount = 0;
    if (amount > maxApplicable) amount = maxApplicable;
    setAppliedCredit(amount);
  };

  // Payment receipt upload handlers - updated to match AddBillForm.js pattern
  const handleReceiptUpload = (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff', 'application/pdf'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'pdf'];
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setUploadError('Invalid file type. Please upload JPG, JPEG, PNG, BMP, TIFF, or PDF files only.');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size too large. Maximum allowed size is 10MB.');
      return;
    }

    setUploadError('');
    setUploadedFile(file);
    setUploadedReceipt(file);

    console.log(
      "Payment receipt uploaded successfully:",
      file.name,
      `(${(file.size / 1024 / 1024).toFixed(2)}MB)`
    );
    
    toast.success(`Payment receipt "${file.name}" uploaded successfully!`);
  };

  const handleRemoveReceipt = () => {
    setUploadedReceipt(null);
    setUploadedFile(null);
    setUploadError('');
    setScale(0); // Reset zoom when removing file
    toast.success("Payment receipt removed successfully");
  };

  const totalSelectedSubtotal = selectedBills.reduce((sum, bill) => {
    const ratio = (bill.paymentAmount || 0) / (bill.finalAmount || 1);
    return sum + ((bill.totalBeforeGST || 0) * ratio);
  }, 0);
  
  const totalSelectedGst = selectedBills.reduce((sum, bill) => {
    const ratio = (bill.paymentAmount || 0) / (bill.finalAmount || 1);
    return sum + ((bill.totalGST || 0) * ratio);
  }, 0);
  
  const totalSelectedTds = selectedBills.reduce((sum, bill) => {
    const ratio = (bill.paymentAmount || 0) / (bill.finalAmount || 1);
    return sum + ((bill.tdsApplied || 0) * ratio);
  }, 0);
  
  const totalAmountDueSelected = selectedBills.reduce((sum, bill) => sum + (bill.paymentAmount || 0), 0);
  const finalPaymentAmount = formData.totalAmount !== '' ? parseFloat(formData.totalAmount) || 0 : totalAmountDueSelected - appliedCredit;

  const validateForm = () => {
    const newErrors = {};
    if (!formData.vendor) newErrors.vendor = 'Please select a vendor';
    if (!formData.paymentDate) newErrors.paymentDate = 'Payment date is required';
    if (!formData.paymentMethod) newErrors.paymentMethod = 'Please select a payment method';
    if (!formData.bankAccount) newErrors.bankAccount = 'Please select a bank account';
    
    // Check if at least one bill has a payment amount > 0
    const hasValidPayments = selectedBills.some(bill => (bill.paymentAmount || 0) > 0);
    if (selectedBills.length > 0 && !hasValidPayments) {
      newErrors.bills = 'At least one bill must have a payment amount greater than 0';
    }
    
    // Check if company ID is available
    const companyId = sessionStorage.getItem('employeeCompanyId');
    if (!companyId) {
      newErrors.company = 'Company ID not found. Please refresh the page.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        // Format the payment data according to the API structure
        const paymentData = {
          vendorId: selectedVendor.vendorId,
          gstin: selectedVendor.gstin,
          paymentMethod: formData.paymentMethod,
          bankAccount: formData.bankAccount,
          paymentTransactionId: formData.reference,
          paymentDate: formData.paymentDate,
          totalAmount: finalPaymentAmount, // <-- Use the editable value if provided
          tdsApplied: formData.tdsApplied,
          notes: formData.notes,
          paymentProofUrl: null, // Will be set by backend after file upload
          billPayments: selectedBills.map(bill => ({
            billId: bill.billId,
            paidAmount: bill.paymentAmount
          }))
        };

        console.log('Payment data to be sent:', paymentData);

        // Always use FormData since backend doesn't support JSON
        const formDataToSend = new FormData();
        formDataToSend.append('payment', JSON.stringify(paymentData));

        // Add attachments if any
        attachments.forEach((file, index) => {
          formDataToSend.append(`attachments`, file);
        });

        // Add payment receipt if uploaded - updated to use uploadedFile
        if (uploadedFile) {
          formDataToSend.append('paymentProof', uploadedFile);
          console.log('Payment proof added to form data:', uploadedFile.name, uploadedFile.size, uploadedFile.type);
        } else {
          console.log('No payment proof uploaded');
        }

        // Debug: Log FormData contents
        console.log('FormData contents:');
        for (let [key, value] of formDataToSend.entries()) {
          console.log(key, value);
        }

        let result;
        if (mode === 'edit' && initialData) {
          // Update existing payment
          result = await dispatch(updatePayment({ 
            paymentId: initialData.paymentId, 
            payment: formDataToSend 
          }));
        } else {
          // Add new payment
          result = await dispatch(addPayment(formDataToSend));
        }
        
        console.log('Payment submission result:', result);
        if (result.error) {
          console.error('Payment failed:', result.error);
          toast.error(mode === 'edit' ? 'Payment update failed. Please try again.' : 'Payment failed. Please try again.');
        } else {
          toast.success(mode === 'edit' ? 'Payment updated successfully!' : 'Payment submitted successfully!');
          console.log('Payment payload:', result.payload);
          onSubmit && onSubmit(result.payload);
          onCancel();
        }
      } catch (error) {
        console.error('Payment submission error:', error);
        toast.error(mode === 'edit' ? 'Payment update failed. Please try again.' : 'Payment submission failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      console.log(errors);
    }
  };

  const handleAttachmentChange = (e) => {
    const files = Array.from(e.target.files);
    const allowedFiles = files.filter(f => /pdf|jpg|jpeg|png/i.test(f.type));
    setAttachments(prev => [...prev, ...allowedFiles]);
  };

  const handleRemoveAttachment = (idx) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const formatCurrency = (num) =>
    '₹' + (num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Close vendor dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (vendorInputRef.current && !vendorInputRef.current.contains(event.target)) {
        setShowVendorDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Main Content */}
      <main className="flex-1 overflow-hidden pl-0 pr-2 pt-2 pb-2 min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-full min-w-0">
          {/* Form Panel (Left) */}
          <div className="lg:col-span-1 overflow-hidden pb-8 min-w-0">
            {/* Form Content */}
            <div className="space-y-3 pb-4 overflow-y-auto h-full">
              {/* Company ID Error Display */}
              {errors.company && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-sm text-red-700">{errors.company}</span>
                  </div>
                </div>
              )}
              
              {/* Top Section - Payment Details */}
              <div className="flex flex-col lg:flex-row gap-3">
                {/* Payment Details */}
                <div className="flex-1 space-y-2">
                  <h2 className="text-lg font-semibold border-b pb-2 mb-2 text-gray-900">
                    Payment Details
                  </h2>
                  
                  {/* Vendor */}
                  <div className="relative" ref={vendorInputRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.vendor ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Select vendor"
                        value={formData.vendor}
                        onChange={handleVendorInput}
                        onFocus={() => setShowVendorDropdown(true)}
                        autoComplete="off"
                      />
                      {showVendorDropdown && (
                        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                          {vendors.map(vendor => (
                            <div
                              key={vendor.vendorId}
                              className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                              onClick={() => handleVendorSelect(vendor)}
                            >
                              <div className="font-medium text-gray-900">{vendor.vendorName}</div>
                              <div className="text-xs text-gray-500">{vendor.gstin}</div>
                            </div>
                          ))}
                          {vendors.length === 0 && (
                            <div className="px-4 py-3 text-gray-400">No vendors found</div>
                          )}
                        </div>
                      )}
                    </div>
                    {errors.vendor && <p className="text-red-500 text-xs mt-1">{errors.vendor}</p>}
                  </div>
                  
                  {/* Vendor GSTIN */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vendor GSTIN</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      value={formData.gstin}
                      placeholder="Auto-filled from vendor"
                      readOnly
                    />
                  </div>
                  
                  {/* Bank Account */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Paid From Bank Account</label>
                    <select
                      name="bankAccount"
                      value={formData.bankAccount}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.bankAccount ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select bank account</option>
                      {bankAccounts.map(account => (
                        <option key={account} value={account}>{account}</option>
                      ))}
                    </select>
                    {errors.bankAccount && <p className="text-red-500 text-xs mt-1">{errors.bankAccount}</p>}
                  </div>
                </div>

                {/* Payment Details Right Column */}
                <div className="flex-1 space-y-2">
                  <h2 className="text-lg font-semibold border-b pb-2 mb-2 text-gray-900">
                    Payment Information
                  </h2>
                  
                  {/* Payment Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="paymentDate"
                      value={formData.paymentDate}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.paymentDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.paymentDate && <p className="text-red-500 text-xs mt-1">{errors.paymentDate}</p>}
                  </div>
                  
                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.paymentMethod ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select payment method</option>
                      {paymentMethods.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                    {errors.paymentMethod && <p className="text-red-500 text-xs mt-1">{errors.paymentMethod}</p>}
                  </div>
                  
                  {/* Payment Transaction ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Transaction ID</label>
                    <input
                      type="text"
                      name="reference"
                      value={formData.reference}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., June 2025 settlement"
                    />
                  </div>
                  {/* Total Amount (Editable) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount</label>
                    <input
                      type="number"
                      name="totalAmount"
                      value={formData.totalAmount}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter total amount or leave blank for auto-calc"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* TDS Information */}
              <div className="flex items-center space-x-4 pt-4 border-t border-gray-100 mt-2">
                {/* Show vendor's TDS percentage if available */}
                {selectedVendor && selectedVendor.tdsPercentage && (
                  <div className="text-sm text-gray-600 mb-2">
                    TDS Applied: {selectedVendor.tdsPercentage}%
                  </div>
                )}
              </div>

              {/* Notes Section */}
              <div className="w-full mt-4">
                <h2 className="text-lg font-semibold border-b pb-2 mb-2 text-gray-900">Notes</h2>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Add payment notes (optional)"
                />
              </div>
            </div>
          </div>

          {/* Upload Panel (Right) */}
          <div className="lg:col-span-1 overflow-y-auto p-4 lg:p-6 pb-8 h-full min-w-0">
            <div className="h-full flex flex-col">
              <div className="flex-1">
                {uploadedReceipt ? (
                  <div className="h-full flex flex-col">
                    <div className="flex-1 relative">
                      <FilePreviewer
                        file={uploadedReceipt}
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
                          {uploadedReceipt.name || 'Uploaded Receipt'}
                        </span>
                        {uploadedReceipt.size && uploadedReceipt.size > 0 && (
                          <span className="text-gray-500">
                            ({(uploadedReceipt.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        )}
                        {uploadedReceipt.isExistingAttachment && (
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
                          onClick={handleRemoveReceipt}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          title="Remove receipt"
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
                              Upload Payment Receipt
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                              Click to browse or drag and drop your receipt here
                            </p>
                            <p className="text-xs text-gray-400 mb-4">
                              Supported formats: JPG, JPEG, PNG, BMP, TIFF, PDF
                            </p>
                            <p className="text-xs text-gray-400 mb-4">
                              Maximum file size: 10MB
                            </p>
                            
                            <label className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-all hover:scale-105 active:scale-95">
                              <FaPaperclip className="mr-2" />
                              Choose File
                              <input
                                type="file"
                                className="hidden"
                                accept=".jpg,.jpeg,.png,.bmp,.tiff,.pdf"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleReceiptUpload(e.target.files[0]);
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
              
              {uploadError && (
                <div className="mt-4 text-red-600 bg-red-100 border border-red-300 p-3 rounded-lg text-left">
                  <strong>❌ Error:</strong> {uploadError}
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
              Total Payment: {formatCurrency(finalPaymentAmount)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Amount in Words: <span className="italic">{toWords.convert(finalPaymentAmount)}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 rounded-lg transition-colors text-gray-700 bg-white hover:bg-gray-50"
              onClick={() => alert('Draft saved!')}
            >
              Save Draft
            </button>
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 rounded-lg transition-colors text-gray-700 bg-white hover:bg-gray-50"
              onClick={() => alert('Preview opened!')}
            >
              Preview
            </button>
            <button
              type="button"
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isSubmitting 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {mode === 'edit' ? 'Updating...' : 'Processing...'}
                </span>
              ) : (
                mode === 'edit' ? 'Update Payment' : 'Confirm Payment'
              )}
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

export default BulkPaymentForm; 