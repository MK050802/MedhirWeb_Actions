// Vendor page implementation based on PRD
import { useState, useEffect } from 'react';
import { FaFileInvoice, FaUndoAlt, FaCreditCard, FaBuilding, FaPlus, FaSearch, FaArrowLeft, FaClipboardList, FaEye, FaFileAlt, FaTimes } from 'react-icons/fa';
import Modal from '../../components/Modal';
import { AddBillForm, BulkPaymentForm, AddVendorForm, AddRefundForm, AddPurchaseOrderForm } from '../../components/Forms';
import VendorPreview from '../../components/Previews/VendorPreview';
import PurchaseOrderPreview from '../../components/Previews/PurchaseOrderPreview';
import Sidebar from "../../components/Sidebar";
import HradminNavbar from "../../components/HradminNavbar";
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendors, fetchVendorBills, fetchVendorPayments, fetchVendorPurchaseOrders } from '../../redux/slices/vendorSlice';
import { fetchBills } from '../../redux/slices/BillSlice';
import { fetchPayments } from '../../redux/slices/paymentSlice';
import { fetchPurchaseOrders } from '../../redux/slices/PurchaseOrderSlice';
import { fetchCompanies } from '../../redux/slices/companiesSlice';
import { toast } from 'sonner';
import axios from 'axios';
import { getItemFromSessionStorage } from '@/redux/slices/sessionStorageSlice';
import { generatePresignedUrl, fetchImageFromMinio } from '../../redux/slices/minioSlice';
import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig();

const Vendor = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const dispatch = useDispatch();
  
  // File handling functions using minioSlice directly
const handleViewFile = async (url, fileName = null) => {
  try {
    // Since we have no presigned URL endpoint, directly use the fetch method
    const { dataUrl } = await dispatch(fetchImageFromMinio({ url })).unwrap();
    
    const newWindow = window.open(dataUrl, '_blank', 'noopener,noreferrer');
    if (newWindow) {
      newWindow.document.title = fileName || 'File Preview';
      newWindow.focus();
    }
  } catch (error) {
    console.error('Failed to open file:', error);
    toast.error('Failed to open file. Please try again.');
  }
};

const handleDownloadFile = async (url, fileName = null) => {
  try {
    // Always use fetchImageFromMinio since we don't have a presigned URL endpoint
    const { dataUrl } = await dispatch(fetchImageFromMinio({ url })).unwrap();

    // Convert the base64/URL data to a Blob for download
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    // Create a temporary <a> tag to trigger download
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName || url.split("/").pop().split("?")[0];
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up Blob URL to avoid memory leaks
    URL.revokeObjectURL(blobUrl);

  } catch (error) {
    console.error('Failed to download file:', error);
    toast.error('Failed to download file. Please try again.');
  }
};

  const { vendors, vendorBills, vendorPayments, vendorPurchaseOrders, loading, error } = useSelector((state) => state.vendors);
  const { bills, loading: billsLoading, error: billsError } = useSelector((state) => state.bills);
  const { payments, loading: paymentsLoading, error: paymentsError } = useSelector((state) => state.payments);
  const { purchaseOrders, loading: purchaseOrdersLoading, error: purchaseOrdersError } = useSelector((state) => state.purchaseOrders);
  const { companies } = useSelector((state) => state.companies);
  // State for attachment modal
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [selectedBillVendor, setSelectedBillVendor] = useState('');
  // State for selected vendor for editing
  const [selectedVendor, setSelectedVendor] = useState(null);
  // State for selected bill for editing
  const [selectedBill, setSelectedBill] = useState(null);
  // State for selected payment for editing
  const [selectedPayment, setSelectedPayment] = useState(null);
  // Remove selectedPurchaseOrder state, purchaseOrder prop, and edit mode logic for purchase orders
  // Only support creation of new purchase orders
   const [previewFile, setPreviewFile] = useState(null);
   const [showPurchaseOrderPreview, setShowPurchaseOrderPreview] = useState(false);
   const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null);
   // State for vendor preview modal
   const [showVendorPreview, setShowVendorPreview] = useState(false);
   const [formData, setFormData] = useState({ 
     attachments: [],
     startDate: '',
     endDate: ''
   });
   const [previewVendorData, setPreviewVendorData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('thisMonth');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDateInputs, setShowCustomDateInputs] = useState(false);
    useEffect(() => {
      dispatch(fetchVendors());
      dispatch(fetchBills());
      dispatch(fetchPayments());
      dispatch(fetchPurchaseOrders());
      dispatch(fetchCompanies());
    }, [dispatch]);

    console.log(bills);
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Function to get date range based on selection
  const getDateRange = (range) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    switch (range) {
      case 'thisMonth':
        return {
          startDate: new Date(currentYear, currentMonth, 1),
          endDate: new Date(currentYear, currentMonth + 1, 0)
        };
      case 'lastMonth':
        return {
          startDate: new Date(currentYear, currentMonth - 1, 1),
          endDate: new Date(currentYear, currentMonth, 0)
        };
      case 'last3Months':
        return {
          startDate: new Date(currentYear, currentMonth - 3, 1),
          endDate: new Date(currentYear, currentMonth + 1, 0)
        };
      case 'last6Months':
        return {
          startDate: new Date(currentYear, currentMonth - 6, 1),
          endDate: new Date(currentYear, currentMonth + 1, 0)
        };
      case 'thisYear':
        return {
          startDate: new Date(currentYear, 0, 1),
          endDate: new Date(currentYear, 11, 31)
        };
      case 'lastYear':
        return {
          startDate: new Date(currentYear - 1, 0, 1),
          endDate: new Date(currentYear - 1, 11, 31)
        };
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            startDate: new Date(customStartDate),
            endDate: new Date(customEndDate)
          };
        }
        // Fallback to current month if custom dates are not set
        return {
          startDate: new Date(currentYear, currentMonth, 1),
          endDate: new Date(currentYear, currentMonth + 1, 0)
        };
      default:
        return {
          startDate: new Date(currentYear, currentMonth, 1),
          endDate: new Date(currentYear, currentMonth + 1, 0)
        };
    }
  };
  const [activeTab, setActiveTab] = useState('statement'); // Default to statement tab
  const [showAddForm, setShowAddForm] = useState(null); // 'bill' | 'refund' | 'payment' | 'vendor' | null
  const [statementActiveTab, setStatementActiveTab] = useState('bills'); // Default to bills tab in statement view
const [editingPO, setEditingPO] = useState(null); // Store the PO being edited
  // Refetch vendors when form is closed and we're on vendors tab
  useEffect(() => {
    if (showAddForm === null && activeTab === 'vendors') {
      dispatch(fetchVendors());
    }
    if (showAddForm === null && activeTab === 'bills') {
      dispatch(fetchBills());
    }
    if (showAddForm === null && activeTab === 'payments') {
      dispatch(fetchPayments());
    }
  }, [showAddForm, activeTab, dispatch]);

  // Update statement when custom dates change
  useEffect(() => {
    if (selectedDateRange === 'custom' && customStartDate && customEndDate) {
      // This will trigger a re-render of the statement with new date range
      // The getDateRange function will use the updated customStartDate and customEndDate
    }
  }, [customStartDate, customEndDate, selectedDateRange]);


  // Add button handler
  const handleAddClick = () => {
      setSelectedVendor(null); // Clear selected vendor for new vendor
      setShowAddForm('vendor');
  };

  const handleDateRangeChange = (range) => {
    setSelectedDateRange(range);
    if (range === 'custom') {
      setShowCustomDateInputs(true);
      // Set default custom dates to current month
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      setCustomStartDate(new Date(currentYear, currentMonth, 1).toISOString().split('T')[0]);
      setCustomEndDate(new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]);
    } else {
      setShowCustomDateInputs(false);
    }
  };

  console.log('Payments data:', payments);
  console.log('Payment with proof URL:', payments.find(p => p.paymentProofUrl));
  // Back button handler for forms
  const handleBackFromForm = () => {
    setShowAddForm(null);
    setSelectedBill(null);
    setSelectedPayment(null);
     setEditingPO(null);
    
    // Don't clear selectedVendor if we're in statement tab
    // This ensures the vendor remains selected when returning from forms
    if (activeTab !== 'statement') {
      setSelectedVendor(null);
    }
  };

  // Handle attachment icon click
  const handleAttachmentClick = (bill) => {
    const attachments = bill.attachmentUrls || [];
    if (attachments.length > 0) {
      // Open the first attachment directly in a new tab
      const firstAttachment = attachments[0];
      window.open(firstAttachment, '_blank');
    }
  };
  // Handle PO row click for editing
  const handlePORowClick = (po) => {
    setEditingPO(po);
    setShowAddForm('po');
  };

  // Handle payment row click for editing
  const handlePaymentRowClick = (payment) => {
    setSelectedPayment(payment);
    setShowAddForm('payment');
  };

  const handlePurchaseOrderPreview = async (po) => {
    // Transform the purchase order data to match the preview component's expected format
    const vendor = vendors.find(v => v.vendorId === po.vendorId);
    console.log('Original PO data:', po);
    console.log('Found vendor:', vendor);
    
    // Get company details from Redux state
    let companyDetails = {
      name: 'Your Company',
      address: 'Your Company Address'
    };
    
    try {
      const companyId = sessionStorage.getItem('employeeCompanyId');
      console.log('Company ID from session:', companyId);
      console.log('Available companies:', companies);
      
      if (companyId && companies && companies.length > 0) {
        // Find the company in the Redux state
        const company = companies.find(c => c.companyId === companyId || c._id === companyId);
        console.log('Found company in Redux:', company);
        
        if (company) {
          companyDetails = {
            name: company.name || 'Your Company',
            address: company.regAdd || 'Your Company Address'
          };
          console.log('Processed company details:', companyDetails);
        } else {
          console.log('Company not found in Redux state, trying direct API call');
          
          // Fallback to direct API call if not found in Redux
          const token = sessionStorage.getItem('token');
          const apiUrl = `${publicRuntimeConfig.apiURL}/superadmin/companies/${companyId}?companyId=${companyId}`;
          console.log('API URL:', apiUrl);
          
          const response = await fetch(apiUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('API Response status:', response.status);
          
          if (response.ok) {
            const companyData = await response.json();
            console.log('Company data received:', companyData);
            
            companyDetails = {
              name: companyData.name || companyData.companyName || 'Your Company',
              address: companyData.regAdd || companyData.address || companyData.registeredAddress || 'Your Company Address'
            };
            
            console.log('Processed company details:', companyDetails);
          } else {
            console.error('API response not ok:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error response:', errorText);
          }
        }
      } else {
        console.log('No company ID found in session storage or no companies loaded');
      }
    } catch (error) {
      console.error('Error fetching company details:', error);
    }
    
    const transformedPo = {
      ...po,
      poNumber: po.purchaseOrderNumber,
      orderDate: po.purchaseOrderDate,
      deliveryDate: po.purchaseOrderDeliveryDate,
      vendor: vendor ? {
        name: vendor.vendorName,
        address: vendor.addressLine1,
        gstin: vendor.gstin
      } : null,
      company: companyDetails,
      shippingAddress: po.companyAddress || companyDetails.address,
      items: po.purchaseOrderLineItems || [],
      notes: po.notes || '',
      subtotal: po.totalBeforeGST || 0,
      totalGst: po.totalGST || 0,
      grandTotal: po.finalAmount || 0
    };
    console.log('Transformed PO data:', transformedPo);
    setSelectedPurchaseOrder(transformedPo);
    setShowPurchaseOrderPreview(true);
  };
  
  const handleAttachmentChange = (e) => {
    const files = Array.from(e.target.files);
    const allowed = files.filter(f => /pdf|jpg|jpeg|png/i.test(f.type));
    setFormData(prev => ({...prev, attachments: [...prev.attachments, ...allowed]}));
  };

  const handleRemoveAttachment = (idx) => {
    setFormData(prev => ({...prev, attachments: prev.attachments.filter((_, i) => i !== idx)}));
  };

  const handlePreviewAttachment = (file) => {
    setPreviewFile(file);
  };
   
  // Close attachment modal
  const closeAttachmentModal = () => {
    setShowAttachmentModal(false);
    setSelectedAttachments([]);
    setSelectedBillVendor('');
  };

  const handlePaymentSubmit = (paymentData) => {
    // The payment submission is handled by the form component itself
    // We just need to refresh the payments list and close the form
    dispatch(fetchPayments());
    setShowAddForm(null);
    console.log('Payment added successfully:', paymentData);
  };

  const handleBillSubmit = (billData) => {
    // The AddBillForm now handles the Redux dispatch internally
    // We just need to refresh the bills list and close the form
    dispatch(fetchBills());
    setShowAddForm(null);
    setSelectedBill(null);
    console.log('Bill operation completed:', billData);
  };

  const handleVendorSubmit = (vendorData) => {
    // The form submission is handled by the AddVendorForm component itself
    // This function is called after successful submission
    dispatch(fetchVendors());
    setShowAddForm(null);
    setSelectedVendor(null);
    console.log('Vendor operation completed:', vendorData);
  };

  const handlePurchaseOrderSubmit = (poData) => {
    if (editingPO) {
      // Update existing PO
      dispatch(fetchPurchaseOrders());
      toast.success('Purchase Order updated successfully!');
      setShowAddForm(null);
      setEditingPO(null);
      console.log('Purchase Order updated successfully:', poData);
    } else {
      // Create new PO
      const newPO = {
        id: purchaseOrders.length + 1,
        poNumber: `PO-2025-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
        vendorName: poData.vendorName,
        vendorGstin: poData.vendorGstin,
        orderDate: poData.orderDate,
        deliveryDate: poData.deliveryDate,
        status: poData.status || 'Draft',
        subtotal: poData.subtotal,
        totalGst: poData.totalGst,
        grandTotal: poData.grandTotal,
        currency: poData.currency,
        company: poData.company,
        items: poData.items,
        notes: poData.notes
      };
      
      dispatch(fetchPurchaseOrders());
      toast.success('Purchase Order created successfully!');
      setShowAddForm(null);
      console.log('Purchase Order created successfully:', poData);
    }
    

  };

  // Handle vendor row click
  const handleVendorClick = (vendor) => {
    setSelectedVendor(vendor);
    // Fetch vendor-specific data from all three APIs
    dispatch(fetchVendorBills(vendor.vendorId));
    dispatch(fetchVendorPayments(vendor.vendorId));
    dispatch(fetchVendorPurchaseOrders(vendor.vendorId));
  };

  // Refresh vendor data
  const refreshVendorData = () => {
    if (selectedVendor) {
      Promise.all([
        dispatch(fetchVendorBills(selectedVendor.vendorId)),
        dispatch(fetchVendorPayments(selectedVendor.vendorId)),
        dispatch(fetchVendorPurchaseOrders(selectedVendor.vendorId))
      ]);
    }
  };



  // Add button label
  const getAddButtonLabel = () => {
    return 'New Vendor';
  };

  // Context-aware Add button icon
  const getAddButtonIcon = () => <FaPlus className="w-4 h-4" />;

  // Inline Add Form renderers
  const renderAddForm = () => {
    switch (showAddForm) {
      case 'bill':
        return (
          <div className="bg-white rounded-lg shadow-md pl-2 pr-4 pt-4 pb-4">
            <div className="flex items-center mb-2">
              <button onClick={handleBackFromForm} className="mr-4 text-gray-600 hover:text-blue-600 flex items-center gap-2">
                <FaArrowLeft className="w-4 h-4" /> <span>Back</span>
              </button>
            </div>
            <AddBillForm
              bill={selectedBill}
              onSubmit={handleBillSubmit}
              onSuccess={() => {
                toast.success(selectedBill ? 'Bill updated successfully!' : 'Bill added successfully!');
              }}
              onCancel={handleBackFromForm}
            />
          </div>
        );
           case 'po':
          return (
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center mb-2">
                <button onClick={handleBackFromForm} className="mr-4 text-gray-600 hover:text-blue-600 flex items-center gap-2">
                  <FaArrowLeft className="w-4 h-4" /> <span>Back</span>
                </button>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPO ? 'Edit Purchase Order' : 'Create Purchase Order'}
                </h2>
              </div>
              <AddPurchaseOrderForm
                mode={editingPO ? 'edit' : 'add'}
                initialData={editingPO}
                onSubmit={handlePurchaseOrderSubmit}
                onCancel={handleBackFromForm}
              />
            </div>
          );
      case 'payment':
        return (
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center mb-2">
              <button onClick={handleBackFromForm} className="mr-4 text-gray-600 hover:text-blue-600 flex items-center gap-2">
                <FaArrowLeft className="w-4 h-4" /> <span>Back</span>
              </button>
              <h2 className="text-xl font-bold text-gray-900">
                {selectedPayment ? 'Edit Vendor Payment' : 'Add Vendor Payment'}
              </h2>
            </div>
            <BulkPaymentForm
              mode={selectedPayment ? 'edit' : 'add'}
              initialData={selectedPayment}
              onSubmit={handlePaymentSubmit}
              onCancel={handleBackFromForm}
            />
          </div>
        );
      case 'vendor':
        return (
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center mb-2">
              <button onClick={handleBackFromForm} className="mr-4 text-gray-600 hover:text-blue-600 flex items-center gap-2">
                <FaArrowLeft className="w-4 h-4" /> <span>Back</span>
              </button>
              <h2 className="text-xl font-bold text-gray-900">
                {selectedVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </h2>
            </div>
            <AddVendorForm
              vendor={selectedVendor}
              onSubmit={handleVendorSubmit}
              onSuccess={() => {
                toast.success(selectedVendor ? 'Vendor updated successfully!' : 'Vendor added successfully!');
              }}
              onCancel={handleBackFromForm}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (showAddForm) {
      return renderAddForm();
    }
    
        return (
          <div className="flex gap-6">
            {/* Statement Table - 40% width */}
            <div className="w-2/5 bg-white rounded-lg shadow">
              {/* Table Header */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Vendor Statement</h3>
              </div>
              
              {/* Table Content */}
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Vendor Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Company Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Net Payables</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {vendors
                    .filter(vendor =>
                      (vendor.vendorName && vendor.vendorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (vendor.companyName && vendor.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (vendor.email && vendor.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (vendor.contactNumber && vendor.contactNumber.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map((vendor) => {
                      // Calculate net payables for this vendor using vendor-specific data from Redux state
                      const currentVendorBills = vendorBills[vendor.vendorId] || [];
                      const currentVendorPayments = vendorPayments[vendor.vendorId] || [];
                      
                      const totalBills = currentVendorBills.reduce((sum, bill) => sum + (bill.finalAmount || 0), 0);
                      const totalPayments = currentVendorPayments.reduce((sum, payment) => sum + (payment.totalAmount || 0), 0);
                      const netPayables = totalBills - totalPayments;
                      
                      return (
                        <tr 
                          key={vendor.id} 
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => handleVendorClick(vendor)}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">{vendor.vendorName}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-700">{vendor.companyName || 'N/A'}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`text-sm font-semibold ${
                              netPayables > 0 ? 'text-red-600' : netPayables < 0 ? 'text-green-600' : 'text-gray-600'
                            }`}>
                              ₹{netPayables.toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewVendorData(vendor);
                                setShowVendorPreview(true);
                              }}
                              className="text-gray-600 hover:text-blue-600 transition-colors"
                              title="Preview Vendor"
                            >
                              <FaEye className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            
            {/* Right side - 60% width - Vendor Details with Tabs */}
            <div className="w-3/5 bg-white shadow-sm border border-gray-200">
              {selectedVendor ? (
                <div className="p-6">
                  {loading && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-700">Loading vendor details...</p>
                    </div>
                  )}


                  {/* Tab Navigation */}
                  <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                      <button
                        onClick={() => setStatementActiveTab('bills')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none ${
                          statementActiveTab === 'bills'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Bills
                      </button>
                      <button
                        onClick={() => setStatementActiveTab('purchaseOrders')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none ${
                          statementActiveTab === 'purchaseOrders'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Purchase Orders
                      </button>
                      <button
                        onClick={() => setStatementActiveTab('payments')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none ${
                          statementActiveTab === 'payments'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Payments
                      </button>
                      <button
                        onClick={() => setStatementActiveTab('statement')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none ${
                          statementActiveTab === 'statement'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Statement
                      </button>
                    </nav>
                  </div>

                  {/* Tab Content */}
                  {statementActiveTab === 'bills' && (
                    <div>
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Vendor Bills</h3>
                        {loading && (
                          <p className="text-sm text-blue-600 mt-1">Loading vendor bills...</p>
                        )}
                      </div>
                      <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Bill No.</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Bill Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Due Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Total Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Reference/PO No.</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Attachments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                            {(() => {
                              // Use vendorBills from Redux state instead of filtering all bills
                              const currentVendorBills = selectedVendor && vendorBills[selectedVendor.vendorId] 
                                ? vendorBills[selectedVendor.vendorId] 
                                : [];
                              
                              return currentVendorBills.length > 0 ? currentVendorBills.map((bill) => (
                    <tr 
                      key={bill.id} 
                                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedBill(bill);
                        setShowAddForm('bill');
                      }}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-blue-600">{bill.billNumber || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{bill.billDate}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{bill.dueDate}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">₹{(bill.finalAmount || 0).toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`text-sm ${bill.billReference ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                          {bill.billReference || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span 
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                            (bill.attachmentUrls && bill.attachmentUrls.length > 0) || 
                            bill.attachmentUrls === 'Yes' || 
                            bill.attachmentUrls === true
                              ? 'bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200' 
                              : 'bg-gray-100 text-gray-500'
                          }`}
                          onClick={(e) => {
                                        e.stopPropagation();
                            if ((bill.attachmentUrls && bill.attachmentUrls.length > 0) || 
                                bill.attachmentUrls === 'Yes' || 
                                bill.attachmentUrls === true) {
                              handleAttachmentClick(bill);
                            }
                          }}
                        >
                          {(bill.attachmentUrls && bill.attachmentUrls.length > 0) || 
                           bill.attachmentUrls === 'Yes' || 
                           bill.attachmentUrls === true ? '📎' : '-'}
                        </span>
                      </td>
                    </tr>
                              )) : (
                                <tr>
                                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                    {loading ? 'Loading bills...' : 'No bills found for this vendor'}
                                  </td>
                                </tr>
                              );
                            })()}
                </tbody>
              </table>
            </div>
          </div>
                  )}

                  {statementActiveTab === 'purchaseOrders' && (
            <div>
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Purchase Orders</h3>
                        {loading && (
                          <p className="text-sm text-blue-600 mt-1">Loading vendor data...</p>
                        )}
                    </div>
                      <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">PO Number</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Order Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Delivery Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Total Amount</th>
                       <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Attachments</th>
                       <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Preview</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                            {(() => {
                              // Use vendorPurchaseOrders from Redux state instead of filtering all purchase orders
                              const currentVendorPOs = selectedVendor && vendorPurchaseOrders[selectedVendor.vendorId] 
                                ? vendorPurchaseOrders[selectedVendor.vendorId] 
                                : [];
                              return currentVendorPOs.length > 0 ? currentVendorPOs.map((po) => (
                      <tr 
                        key={po.id} 
                                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                                  onClick={() => {
                                    setEditingPO(po);
                                    setShowAddForm('po');
                                  }}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-blue-600">{po.purchaseOrderNumber}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{po.purchaseOrderDate}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{po.purchaseOrderDeliveryDate}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">₹{po.finalAmount}</span>
                        </td>
                 <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span 
                           className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                             (po.attachmentUrls && po.attachmentUrls.length > 0) || 
                                        po.attachmentUrls === 'Yes' || po.attachmentUrls === true
                                          ? 'bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200' 
                                          : 'bg-gray-100 text-gray-500'
                                  }`}
                            onClick={(e) => {
   e.stopPropagation();
   if (po.attachmentUrls && Array.isArray(po.attachmentUrls) && po.attachmentUrls.length > 0) {
     const firstAttachment = po.attachmentUrls[0];
     window.open(firstAttachment, '_blank');
   } else if (typeof po.attachmentUrls === 'string') {
     window.open(po.attachmentUrls, '_blank');
   }
 }}
                                          >
                                {(po.attachmentUrls && po.attachmentUrls.length > 0) || 
                                   po.attachmentUrls === 'Yes' || 
                                   po.attachmentUrls === true ? '📎' : '-'}
                             </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePurchaseOrderPreview(po);
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                          title="Preview Purchase Order"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                      </td>
                      </tr>
                              )) : (
                                <tr>
                                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                    No purchase orders found for this vendor
                                  </td>
                                </tr>
                              );
                            })()}
                  </tbody>
                </table>
              </div>
            </div>
                  )}

                  {statementActiveTab === 'payments' && (
          <div>
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Vendor Payments</h3>
                        {loading && (
                          <p className="text-sm text-blue-600 mt-1">Loading vendor data...</p>
                        )}
                  </div>
                      <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                    <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Payment Date</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Bill Reference</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Payment Method</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Amount</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Payment Reference</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Attachments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                            {(() => {
                              // Use vendorPayments from Redux state instead of filtering all payments
                              const currentVendorPayments = selectedVendor && vendorPayments[selectedVendor.vendorId] 
                                ? vendorPayments[selectedVendor.vendorId] 
                                : [];
                              return currentVendorPayments.length > 0 ? currentVendorPayments.map((payment) => (
                    <tr 
                      key={payment.id} 
                                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                                  onClick={() => {
                                    setSelectedPayment(payment);
                                    setShowAddForm('payment');
                                  }}
                                >
                                  <td className="px-4 py-4 text-sm text-gray-700">{payment.paymentDate}</td>
                                  <td className="px-4 py-4">
                         <div className="flex flex-wrap gap-1">
                           {payment?.billPayments?.map((bill) => (
                             <span key={bill.billId} className="text-xs text-blue-600 font-medium">
                               {bill.billId}
                             </span>
                           ))}
                         </div>
                       </td>
                                  <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          payment.paymentMethod === 'Bank Transfer' 
                            ? 'bg-blue-100 text-blue-800' 
                            : payment.paymentMethod === 'Cheque'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {payment.paymentMethod}
                        </span>
                      </td>
                                  <td className="px-4 py-4">
                        <span className="text-sm font-semibold text-gray-900">₹{payment.totalAmount}</span>
                      </td>
                                  <td className="px-4 py-4">
                        <span className="text-sm text-gray-600 font-mono truncate block">{payment.paymentTransactionId}</span>
                      </td>
                                  <td className="px-4 py-4 text-center">
                        <span 
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                            payment.paymentProofUrl 
                              ? 'bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200' 
                              : 'bg-gray-100 text-gray-500'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (payment.paymentProofUrl) {
                              handleViewFile(payment.paymentProofUrl, 'Payment Receipt');
                            }
                          }}
                        >
                          {payment.paymentProofUrl ? '📎' : '-'}
                        </span>
                      </td>
                    </tr>
                              )) : (
                                <tr>
                                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                    No payments found for this vendor
                      </td>
                    </tr>
                              );
                            })()}
                    </tbody>
                  </table>
                </div>
              </div>
                  )}

                  {statementActiveTab === 'filteredBills' && (
                    <div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Filtered Vendor Bills</h3>
                            <p className="text-sm text-gray-600 mt-1">Bills fetched using the filter API endpoint</p>
                          </div>
                          <button
                            onClick={() => {
                              if (selectedVendor) {
                                refreshVendorData();
                              }
                            }}
                            // disabled={filteredBillsLoading} // This line is removed as per the edit hint
                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              // filteredBillsLoading // This line is removed as per the edit hint
                                // ? 'bg-gray-100 text-gray-400 cursor-not-allowed' // This line is removed as per the edit hint
                                // : 'bg-blue-600 text-white hover:bg-blue-700' // This line is removed as per the edit hint
                                'bg-blue-600 text-white hover:bg-blue-700' // This line is removed as per the edit hint
                            }`}
                          >
                            <FaUndoAlt className="w-3 h-3" />
                            {/* {filteredBillsLoading ? 'Refreshing...' : 'Refresh'} */}
                            Refresh
                          </button>
                        </div>
                        {loading && (
                          <p className="text-sm text-blue-600 mt-1">Loading vendor data...</p>
                        )}
                      </div>
                      
                      {/* Summary Comparison */}
                      {selectedVendor && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Vendor Summary</h4>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                              <p className="text-gray-600">Bills</p>
                              <p className="font-semibold text-gray-900">
                                {vendorBills[selectedVendor.vendorId] ? vendorBills[selectedVendor.vendorId].length : 0}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-600">Payments</p>
                              <p className="font-semibold text-gray-900">
                                {vendorPayments[selectedVendor.vendorId] ? vendorPayments[selectedVendor.vendorId].length : 0}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-600">Purchase Orders</p>
                              <p className="font-semibold text-gray-900">
                                {vendorPurchaseOrders[selectedVendor.vendorId] ? vendorPurchaseOrders[selectedVendor.vendorId].length : 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Bill No.</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Bill Date</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Due Date</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Total Amount</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Reference/PO No.</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Attachments</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {(() => {
                              // Use filteredBills from Redux state
                              const currentFilteredBills = selectedVendor && vendorBills[selectedVendor.vendorId] 
                                ? vendorBills[selectedVendor.vendorId] 
                                : [];
                              
                              return currentFilteredBills.length > 0 ? currentFilteredBills.map((bill) => (
                                <tr 
                                  key={bill.id} 
                                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                                  onClick={() => {
                                    setSelectedBill(bill);
                                    setShowAddForm('bill');
                                  }}
                                >
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <span className="text-sm font-medium text-blue-600">{bill.billNumber || 'N/A'}</span>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{bill.billDate}</td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{bill.dueDate}</td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <span className="text-sm font-semibold text-gray-900">₹{(bill.finalAmount || 0).toLocaleString('en-IN')}</span>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <span className={`text-sm ${bill.billReference ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                                      {bill.billReference || '-'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-center">
                                    <span 
                                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                                        (bill.attachmentUrls && bill.attachmentUrls.length > 0) || 
                                        bill.attachmentUrls === 'Yes' || 
                                        bill.attachmentUrls === true
                                          ? 'bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200' 
                                          : 'bg-gray-100 text-gray-500'
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if ((bill.attachmentUrls && bill.attachmentUrls.length > 0) || 
                                            bill.attachmentUrls === 'Yes' || 
                                            bill.attachmentUrls === true) {
                                          handleAttachmentClick(bill);
                                        }
                                      }}
                                    >
                                      {(bill.attachmentUrls && bill.attachmentUrls.length > 0) || 
                                       bill.attachmentUrls === 'Yes' || 
                                       bill.attachmentUrls === true ? '📎' : '-'}
                                    </span>
                                  </td>
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                    {loading ? 'Loading vendor bills...' : 'No bills found for this vendor'}
                                  </td>
                                </tr>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {statementActiveTab === 'statement' && (
                    <div>
                      {/* Statement Title */}
                      <div className="text-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">Statement of Accounts</h2>
                        {loading && (
                          <p className="text-sm text-blue-600 mt-1">Loading vendor statement...</p>
                        )}
                        <div className="mt-2 text-sm text-gray-600">
                          {(() => {
                            const dateRange = getDateRange(selectedDateRange);
                            const startDate = dateRange.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            const endDate = dateRange.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            return `${startDate} - ${endDate}`;
                          })()}
                        </div>
                      </div>

                      {/* Recipient and Account Summary - Inline */}
                      <div className="flex justify-between items-start mb-6">
                        {/* Left Side - Recipient Section */}
                        <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700 mb-1">To:</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedVendor.contactName || selectedVendor.vendorName}</p>
                    </div>

                    {/* Right Side - Account Summary */}
                        <div className="w-64">
                      <div className="bg-gray-50 border border-gray-200 rounded overflow-hidden">
                        <table className="min-w-full">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-100">Account Summary</th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 bg-gray-100"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              // Use vendor-specific data from Redux state
                              const currentVendorBills = selectedVendor && vendorBills[selectedVendor.vendorId] 
                                ? vendorBills[selectedVendor.vendorId] 
                                : [];
                              const currentVendorPayments = selectedVendor && vendorPayments[selectedVendor.vendorId] 
                                ? vendorPayments[selectedVendor.vendorId] 
                                : [];
                              
                              const totalBilled = currentVendorBills.reduce((sum, bill) => sum + (bill.finalAmount || 0), 0);
                              const totalPaid = currentVendorPayments.reduce((sum, payment) => sum + (payment.totalAmount || 0), 0);
                              const balanceDue = totalBilled - totalPaid;
                              
                              return (
                                <>
                                  <tr className="border-b border-gray-200">
                                    <td className="px-4 py-2 text-sm text-gray-600">Opening Balance</td>
                                    <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">₹ 0.00</td>
                                  </tr>
                                  <tr className="border-b border-gray-200">
                                    <td className="px-4 py-2 text-sm text-gray-600">Billed Amount</td>
                                    <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">₹ {totalBilled.toFixed(2)}</td>
                                  </tr>
                                  <tr className="border-b border-gray-200">
                                    <td className="px-4 py-2 text-sm text-gray-600">Amount Paid</td>
                                    <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">₹ {totalPaid.toFixed(2)}</td>
                                  </tr>
                                  <tr className="border-t-2 border-gray-300">
                                    <td className="px-4 py-2 text-sm font-semibold text-gray-700">Balance Due</td>
                                    <td className={`px-4 py-2 text-sm font-bold text-right ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                      ₹ {balanceDue.toFixed(2)}
                                    </td>
                                  </tr>
                                </>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Table */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Transaction Details</h3>
                    <div className="border border-gray-200 rounded overflow-hidden">
                      <table className="min-w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">Transaction</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">Details</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">Amount</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">Payments</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            // Get vendor's bills and payments from Redux state
                            const currentVendorBills = selectedVendor && vendorBills[selectedVendor.vendorId] 
                              ? vendorBills[selectedVendor.vendorId] 
                              : [];
                            const currentVendorPayments = selectedVendor && vendorPayments[selectedVendor.vendorId] 
                              ? vendorPayments[selectedVendor.vendorId] 
                              : [];
                            
                            // Get selected date range
                            const dateRange = getDateRange(selectedDateRange);
                            
                            // Create transaction history with proper chronological order
                            const transactions = [];
                            let runningBalance = 0;
                            
                            // Add opening balance
                            transactions.push({
                              date: dateRange.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                              type: 'Opening Balance',
                              details: '***Opening Balance***',
                              amount: 0,
                              payment: 0,
                              balance: runningBalance,
                              timestamp: dateRange.startDate.getTime()
                            });
                            
                            // Add bills within date range
                            currentVendorBills.forEach(bill => {
                              const billDate = new Date(bill.billDate || 'N/A');
                              if (billDate >= dateRange.startDate && billDate <= dateRange.endDate) {
                              runningBalance += bill.finalAmount || 0;
                              transactions.push({
                                date: bill.billDate || 'N/A',
                                type: 'Bill',
                                  details: `Bill No: ${bill.billNumber || 'N/A'}`,
                                amount: bill.finalAmount || 0,
                                payment: 0,
                                  balance: runningBalance,
                                  timestamp: billDate.getTime()
                              });
                              }
                            });
                            
                            // Add payments within date range
                            currentVendorPayments.forEach(payment => {
                              const paymentDate = new Date(payment.paymentDate || 'N/A');
                              if (paymentDate >= dateRange.startDate && paymentDate <= dateRange.endDate) {
                              runningBalance -= payment.totalAmount || 0;
                              transactions.push({
                                date: payment.paymentDate || 'N/A',
                                type: 'Payment Made',
                                  details: `Payment ID: ${payment.paymentTransactionId || 'N/A'}`,
                                amount: 0,
                                payment: payment.totalAmount || 0,
                                  balance: runningBalance,
                                  timestamp: paymentDate.getTime()
                                });
                              }
                            });
                            
                                // Sort transactions by actual chronological order (when they were created)
                                transactions.sort((a, b) => {
                                  // First sort by date
                                  const dateA = new Date(a.date);
                                  const dateB = new Date(b.date);
                                  
                                  if (dateA.getTime() !== dateB.getTime()) {
                                    return dateA - dateB;
                                  }
                                  
                                  // If same date, maintain the order they were added to the array
                                  // This preserves the sequence: bill → payment → bill
                                  return 0;
                                });
                            
                            return transactions.map((transaction, index) => (
                              <tr key={index} className={`border-b border-gray-200 ${index % 2 === 1 ? 'bg-gray-50' : ''}`}>
                                <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-200">
                                  {transaction.date}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200 font-medium">
                                  {transaction.type}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-200">
                                  {transaction.details}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-200">
                                  {transaction.amount > 0 ? `₹${transaction.amount.toFixed(2)}` : '-'}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-200">
                                  {transaction.payment > 0 ? `₹${transaction.payment.toFixed(2)}` : '-'}
                                </td>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                  ₹{transaction.balance.toFixed(2)}
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Final Balance */}
                  <div className="text-right">
                    {(() => {
                      // Use vendor-specific data from Redux state
                      const currentVendorBills = selectedVendor && vendorBills[selectedVendor.vendorId] 
                        ? vendorBills[selectedVendor.vendorId] 
                        : [];
                      const currentVendorPayments = selectedVendor && vendorPayments[selectedVendor.vendorId] 
                        ? vendorPayments[selectedVendor.vendorId] 
                        : [];
                      
                      const totalBilled = currentVendorBills.reduce((sum, bill) => sum + (bill.finalAmount || 0), 0);
                      const totalPaid = currentVendorPayments.reduce((sum, payment) => sum + (payment.totalAmount || 0), 0);
                      const balanceDue = totalBilled - totalPaid;
                      
                      return (
                        <div className={`inline-block rounded px-4 py-2 border ${
                          balanceDue > 0 
                            ? 'bg-red-50 border-red-200' 
                            : balanceDue < 0 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <span className={`text-sm font-medium ${
                            balanceDue > 0 
                              ? 'text-red-700' 
                              : balanceDue < 0 
                              ? 'text-green-700' 
                              : 'text-gray-700'
                          }`}>
                            {balanceDue > 0 ? 'Balance Due: ' : balanceDue < 0 ? 'Credit Balance: ' : 'Balance: '}
                          </span>
                          <span className={`text-lg font-bold ${
                            balanceDue > 0 
                              ? 'text-red-600' 
                              : balanceDue < 0 
                              ? 'text-green-600' 
                              : 'text-gray-600'
                          }`}>
                            ₹{Math.abs(balanceDue).toFixed(2)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="text-gray-400">
                    <FaFileAlt className="w-16 h-16 mx-auto mb-3" />
                    <p className="text-sm">Click on any vendor row in the left table to view their details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
  };

  return (
    <>
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          currentRole={"employee"}
        />

        {/* Fixed Vendors Header */}
        <div 
          className={`fixed top-16 z-50 bg-white shadow-sm border-b border-gray-200 p-4 flex items-center justify-between transition-all duration-300 ${
            isSidebarCollapsed ? "left-20 right-0" : "left-60 right-0"
          }`}
        >
          {/* Left: Title + Search + Filter */}
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">Vendors</h1>
            
            <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 w-64">
              <FaSearch className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search vendors..."
                className="flex-1 outline-none text-gray-900 placeholder-gray-500 bg-transparent text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              value={selectedDateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer text-sm"
            >
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Previous Month</option>
              <option value="last3Months">Last 3 Months</option>
              <option value="last6Months">Last 6 Months</option>
              <option value="thisYear">This Year</option>
              <option value="lastYear">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
            
            {/* Custom Date Inputs */}
            {showCustomDateInputs && (
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-xs"
                  placeholder="Start Date"
                />
                <span className="text-gray-500 text-xs">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-xs"
                  placeholder="End Date"
                />
              </div>
            )}
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setSelectedBill(null);
                  setShowAddForm('bill');
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <FaPlus className="w-3 h-3" /> <span>New Bill</span>
              </button>
              <button
                onClick={() => {
                  setEditingPO(null);
                  setShowAddForm('po');
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <FaPlus className="w-3 h-3" /> <span>New PO</span>
              </button>
              <button
                onClick={() => {
                  setSelectedPayment(null);
                  setShowAddForm('payment');
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <FaPlus className="w-3 h-3" /> <span>New Payment</span>
              </button>
            <button
              onClick={handleAddClick}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
            >
                <FaPlus className="w-3 h-3" /> <span>New Vendor</span>
            </button>
            </div>
        </div>

        {/* Main Content */}
        <div
          className={`flex-1 ${
            isSidebarCollapsed ? "ml-20" : "ml-60"
          } transition-all duration-300`}
        >
          {/* Navbar */}
          <HradminNavbar />

          {/* Page Container */}
          <div className="flex flex-col h-full pt-32">
            {/* Main Scrollable Content */}
            <div className="flex-1 overflow-y-auto pl-1 pr-6 pt-8">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Vendor Preview Modal */}
      {showVendorPreview && previewVendorData && (
        <VendorPreview
          vendorData={previewVendorData}
          onClose={() => setShowVendorPreview(false)}
          onEdit={(editedData) => {
            setPreviewVendorData(editedData);
          }}
          onSave={(editedData) => {
            // Update the vendor in the Redux store
            const updatedVendors = vendors.map(vendor => 
              vendor.vendorId === editedData.vendorId ? editedData : vendor
            );
            // You might want to dispatch an action to update the vendor in Redux
            // dispatch(updateVendor(editedData));
            setPreviewVendorData(editedData);
            toast.success('Vendor updated successfully!');
          }}
        />
      )}

      {/* Purchase Order Preview Modal */}
      {showPurchaseOrderPreview && selectedPurchaseOrder && (
        <PurchaseOrderPreview
          poData={selectedPurchaseOrder}
          onClose={() => setShowPurchaseOrderPreview(false)}
        />
      )}
    </>
  );
};

export default Vendor;