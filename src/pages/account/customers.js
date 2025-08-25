// Updated customers page with PRD implementation
import { useState, useEffect } from 'react';
import { FaFileInvoiceDollar, FaReceipt, FaUsers, FaPlus, FaSearch, FaArrowLeft, FaEye, FaTimes, FaFileAlt } from 'react-icons/fa';
import { AddInvoiceForm, AddReceiptForm, AddClientForm } from '../../components/Forms';
import { toast } from 'sonner';
import Sidebar from "../../components/Sidebar";
import HradminNavbar from "../../components/HradminNavbar";
import { useDispatch, useSelector } from 'react-redux';
import { fetchReceipts } from '@/redux/slices/receiptSlice';
import { fetchInvoices, createInvoice } from '@/redux/slices/invoiceSlice';
import { fetchImageFromMinio } from '@/redux/slices/minioSlice';
import { fetchCustomers, addCustomer } from '@/redux/slices/customerSlice';
import MinioImage from '@/components/ui/MinioImage';

// Small preview component for attachments
const AttachmentPreview = ({ fileUrl, onClick }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImage, setIsImage] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (fileUrl) {
      setIsLoading(true);
      // Check if it's an image by file extension
      const isImageFile = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);
      setIsImage(isImageFile);
      
      if (isImageFile) {
        // For images, try to get preview from MinIO
        dispatch(fetchImageFromMinio({ url: fileUrl }))
          .unwrap()
          .then(result => {
            if (result.dataUrl) {
              setPreviewUrl(result.dataUrl);
            } else {
              setPreviewUrl(fileUrl); // Fallback to direct URL
            }
            setIsLoading(false);
          })
          .catch(error => {
            console.error('Preview error:', error);
            setPreviewUrl(fileUrl); // Fallback to direct URL
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    }
  }, [fileUrl, dispatch]);

  if (!fileUrl) {
    return (
      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
        <span className="text-gray-400 text-xs">-</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center animate-pulse">
        <div className="w-3 h-3 bg-gray-300 rounded"></div>
      </div>
    );
  }

  if (isImage && previewUrl) {
    return (
      <div 
        className="w-8 h-8 rounded border border-gray-200 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
        onClick={onClick}
        title="Click to view full size"
      >
        <img 
          src={previewUrl} 
          alt="Attachment preview" 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div className="w-full h-full bg-gray-100 flex items-center justify-center" style={{ display: 'none' }}>
          <FaFileAlt className="text-gray-400 text-xs" />
        </div>
      </div>
    );
  }

  // For PDFs and other files
  return (
    <div 
      className="w-8 h-8 bg-blue-100 rounded border border-blue-200 flex items-center justify-center cursor-pointer hover:bg-blue-200 transition-colors"
      onClick={onClick}
      title="Click to view file"
    >
      <FaFileAlt className="text-blue-600 text-xs" />
    </div>
  );
};

const FullSizeAttachmentPreview = ({ fileUrl, onClick }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImage, setIsImage] = useState(false);
  const [isPdf, setIsPdf] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (fileUrl) {
      setIsLoading(true);
      // Check if it's an image by file extension
      const isImageFile = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);
      const isPdfFile = /\.pdf$/i.test(fileUrl);
      setIsImage(isImageFile);
      setIsPdf(isPdfFile);
      
      if (isImageFile) {
        // For images, try to get preview from MinIO
        dispatch(fetchImageFromMinio({ url: fileUrl }))
          .unwrap()
          .then(result => {
            if (result.dataUrl) {
              setPreviewUrl(result.dataUrl);
            } else {
              setPreviewUrl(fileUrl); // Fallback to direct URL
            }
            setIsLoading(false);
          })
          .catch(error => {
            console.error('Preview error:', error);
            setPreviewUrl(fileUrl); // Fallback to direct URL
            setIsLoading(false);
          });
      } else if (isPdfFile) {
        // For PDFs, try to get the URL for preview
        dispatch(fetchImageFromMinio({ url: fileUrl }))
          .unwrap()
          .then(result => {
            if (result.dataUrl) {
              setPreviewUrl(result.dataUrl);
            } else {
              setPreviewUrl(fileUrl); // Fallback to direct URL
            }
            setIsLoading(false);
          })
          .catch(error => {
            console.error('PDF preview error:', error);
            setPreviewUrl(fileUrl); // Fallback to direct URL
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    }
  }, [fileUrl, dispatch]);

  if (!fileUrl) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">No attachment</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center animate-pulse">
        <div className="w-8 h-8 bg-gray-300 rounded"></div>
      </div>
    );
  }

  if (isImage && previewUrl) {
    return (
      <div 
        className="w-full h-full rounded-lg border-2 border-gray-200 overflow-hidden cursor-pointer hover:border-blue-400 transition-all duration-200 shadow-lg"
        onClick={onClick}
        title="Click to view full size"
      >
        <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 overflow-y-auto">
          <img 
            src={previewUrl} 
            alt="Attachment preview" 
            className="w-full min-h-full object-contain rounded-md shadow-sm"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        </div>
        <div className="w-full h-full bg-gray-100 flex items-center justify-center" style={{ display: 'none' }}>
          <FaFileAlt className="text-gray-400 text-2xl" />
        </div>
      </div>
    );
  }

  if (isPdf && previewUrl) {
    return (
      <div 
        className="w-full h-full rounded-lg border-2 border-gray-200 overflow-hidden hover:border-blue-400 transition-all duration-200 shadow-lg"
        title="PDF Preview"
      >
        <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 overflow-y-auto">
          <iframe
            src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full min-h-full rounded-md shadow-sm border-0"
            title="PDF Preview"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        </div>
        <div className="w-full h-full bg-gray-100 flex items-center justify-center" style={{ display: 'none' }}>
          <FaFileAlt className="text-gray-400 text-2xl" />
        </div>
      </div>
    );
  }

  // For other files (not images or PDFs)
  return (
    <div 
      className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 shadow-lg"
      onClick={onClick}
      title="Click to view file"
    >
      <div className="text-center p-6">
        <div className="bg-white rounded-full p-4 mb-4 shadow-md">
          <FaFileAlt className="text-blue-600 text-5xl" />
        </div>
        <p className="text-blue-700 text-lg font-medium">Click to view file</p>
        <p className="text-blue-500 text-sm mt-1">Document or File</p>
      </div>
    </div>
  );
};

const InvoicePreviewModal = ({ invoice, receipts: allReceipts, onClose }) => {
  if (!invoice) return null;

  // Find receipts associated with this invoice
  const relatedReceipts = allReceipts.filter(receipt => receipt.refInvoice && receipt.refInvoice.includes(invoice.invoiceNo));

  const amountRemaining = invoice.totalAmount - invoice.amountReceived;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Invoice Preview: {invoice.id}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <FaTimes />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Invoice Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Project:</strong> {invoice.project?.projectName}</div>
              <div><strong>Customer:</strong> {invoice.customer?.customerName}</div>
              <div><strong>Invoice Date:</strong> {invoice.invoiceDate}</div>
              <div><strong>Status:</strong> <span className={`font-semibold ${invoice.status?.toLowerCase() === 'received' || invoice.status?.toLowerCase() === 'paid' ? 'text-green-600' : invoice.status?.toLowerCase() === 'partial received' || invoice.status?.toLowerCase() === 'partial paid' || invoice.status?.toLowerCase() === 'partially paid' || invoice.status?.toLowerCase() === 'partiallypaid' ? 'text-yellow-600' : 'text-red-600'}`}>{invoice.status}</span></div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Amount Summary</h3>
            <div className="flex justify-around text-center">
              <div>
                <div className="text-gray-500">Total Amount</div>
                <div className="text-xl font-bold text-gray-800">₹{invoice.totalAmount.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-500">Amount Received</div>
                <div className="text-xl font-bold text-green-600">₹{invoice.amountReceived.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-500">Amount Remaining</div>
                <div className="text-xl font-bold text-red-600">₹{amountRemaining.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Linked Receipts</h3>
            {relatedReceipts.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-3">Receipt #</th>
                    <th className="text-left py-2 px-3">Date</th>
                    <th className="text-right py-2 px-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {relatedReceipts.map(r => (
                    <tr key={r.id} className="border-b">
                      <td className="py-2 px-3 font-medium text-blue-600">{r.receiptNumber}</td>
                      <td className="py-2 px-3">{r.date}</td>
                      <td className="text-right py-2 px-3 font-semibold">₹{r.amountReceived.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No receipts generated for this invoice yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ReceiptPreviewModal = ({ receipt, onClose }) => {
  const dispatch = useDispatch();
  
  if (!receipt) return null;

  // Prefer linkedInvoices if present, else fallback to allocations for backward compatibility
  const invoiceLinks = receipt.linkedInvoices && receipt.linkedInvoices.length > 0
    ? receipt.linkedInvoices.map(link => ({
        invoiceNumber: link.invoiceNumber || link.invoiceId || link.number,
        amountAllocated: link.amountAllocated || link.allocatedAmount || link.payment,
      }))
    : (receipt.allocations || []).map(link => ({
        invoiceNumber: link.invoiceId || link.number,
        amountAllocated: link.allocatedAmount || link.payment,
      }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Receipt Preview: {receipt.receiptNumber}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <FaTimes />
          </button>
        </div>
        <div className="p-8 h-[85vh] flex">
          <div className="grid grid-cols-7 gap-10 w-full">
            {/* Left side - All text fields */}
            <div className="col-span-3">
              <div className="space-y-5 text-sm mb-8">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <strong className="text-gray-600">Customer:</strong>
                  <span className="font-medium">{receipt.customer?.customerName || receipt.client}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <strong className="text-gray-600">Project:</strong>
                  <span className="font-medium">{receipt.project?.projectName || receipt.project}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <strong className="text-gray-600">Receipt Date:</strong>
                  <span className="font-medium">{receipt.receiptDate}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <strong className="text-gray-600">Payment Method:</strong>
                  <span className="font-medium">{receipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <strong className="text-gray-600">Receipt No.:</strong>
                  <span className="font-medium">{receipt.receiptNumber}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <strong className="text-gray-600">Payment Trans. ID:</strong>
                  <span className="font-mono font-medium">{receipt.paymentTransactionId}</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold text-gray-700">Total Amount Received:</span>
                    <span className="text-2xl font-bold text-green-600 bg-white px-3 py-1 rounded-md shadow-sm">₹{receipt.amountReceived}</span>
                </div>

                <h4 className="text-md font-semibold text-gray-700 mb-3 border-b border-green-200 pb-2">Invoice Allocations</h4>
                {invoiceLinks.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="text-left py-2 px-3">Invoice #</th>
                        <th className="text-right py-2 px-3">Allocated Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoiceLinks.map((alloc, index) => (
                        <tr key={index}>
                          <td className="py-2 px-3 font-medium text-blue-600">{alloc.invoiceNumber}</td>
                          <td className="text-right py-2 px-3 font-semibold">₹{alloc.amountAllocated}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No invoices linked to this receipt.
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Only attachment */}
            <div className="col-span-4">
              <div className="bg-gray-50 rounded-lg p-4 h-full flex flex-col">
                <h4 className="text-md font-semibold text-gray-700 mb-4">Attachment</h4>
                <div className="flex-1 overflow-y-auto">
                {receipt.receiptFileUrl || receipt.attachmentUrl ? (
                  <FullSizeAttachmentPreview 
                    fileUrl={receipt.receiptFileUrl || receipt.attachmentUrl}
                    onClick={async () => {
                      try {
                        const { dataUrl } = await dispatch(fetchImageFromMinio({ url: receipt.receiptFileUrl || receipt.attachmentUrl })).unwrap();
                        if (dataUrl) {
                          window.open(dataUrl, '_blank', 'noopener,noreferrer');
                        } else {
                          // Fallback to direct URL if authentication failed or access denied
                          const directUrl = receipt.receiptFileUrl || receipt.attachmentUrl;
                          if (directUrl) {
                            window.open(directUrl, '_blank', 'noopener,noreferrer');
                          } else {
                            toast.error('Unable to open attachment');
                          }
                        }
                      } catch (error) {
                        console.error('Receipt file preview error:', error);
                        // Fallback to direct URL
                        const directUrl = receipt.receiptFileUrl || receipt.attachmentUrl;
                        if (directUrl) {
                          window.open(directUrl, '_blank', 'noopener,noreferrer');
                        } else {
                          toast.error('Unable to open attachment');
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="w-full text-center py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>No attachment</span>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Customers = () => {
  const dispatch = useDispatch();
  const { receipts, loading, error } = useSelector(state => state.receipts);
  const { invoices } = useSelector(state => state.invoices);
  const { customers, loading: customersLoading, error: customersError } = useSelector(state => state.customers);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showAddForm, setShowAddForm] = useState(null);
  const [invoiceForReceipt, setInvoiceForReceipt] = useState(null);
  const [selectedInvoiceForPreview, setSelectedInvoiceForPreview] = useState(null);
  const [selectedReceiptForPreview, setSelectedReceiptForPreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerActiveTab, setCustomerActiveTab] = useState('invoices');
  const [showCustomerPreview, setShowCustomerPreview] = useState(false);
  const [selectedCustomerForPreview, setSelectedCustomerForPreview] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState('thisMonth');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDateInputs, setShowCustomDateInputs] = useState(false);

  useEffect(() => {
    const companyId = sessionStorage.getItem("employeeCompanyId");
    if (companyId) {
      dispatch(fetchReceipts(companyId));
    }
  }, [dispatch]);
  
  useEffect(() => {
    const companyId = sessionStorage.getItem("employeeCompanyId");
    if (companyId) {
      dispatch(fetchInvoices(companyId));
    }
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  // Update statement when custom dates change
  useEffect(() => {
    if (selectedDateRange === 'custom' && customStartDate && customEndDate) {
      // This will trigger a re-render of the statement with new date range
      // The getDateRange function will use the updated customStartDate and customEndDate
    }
  }, [customStartDate, customEndDate, selectedDateRange]);

  // const [invoices, setInvoices] = useState([
  //   { id: 'INV-001', projectName: 'Project Medhit', client: 'Client A', date: '2024-07-29', totalAmount: 1200.00, amountReceived: 1200.00, status: 'Received', receiptGenerated: 'Yes' },
  //   { id: 'INV-002', projectName: 'Internal HRMS', client: 'Client B', date: '2024-07-28', totalAmount: 800.00, amountReceived: 0.00, status: 'Due', receiptGenerated: 'No' },
  //   { id: 'INV-003', projectName: 'Marketing Website', client: 'Client A', date: '2024-07-27', totalAmount: 1500.00, amountReceived: 1000.00, status: 'Partial received', receiptGenerated: 'Yes' },
  // ]);
  // const [receipts, setReceipts] = useState([
  //   { id: 'REC-001', projectName: 'Project Medhit', client: 'Client A', date: '2024-07-29', amount: 1200.00, method: 'Credit Card', paymentTransId: 'TXN12345', status: 'Received', allocations: [{ invoiceId: 'INV-001', allocatedAmount: 1200.00 }], invoiceGenerated: 'Yes' },
  //   { id: 'REC-002', projectName: 'Marketing Website', client: 'Client A', date: '2024-07-28', amount: 1000.00, method: 'Bank Transfer', paymentTransId: 'TXN67890', status: 'Partial received', allocations: [{ invoiceId: 'INV-003', allocatedAmount: 1000.00 }], invoiceGenerated: 'Yes' }
  // ]);
  // Remove the static clients state since we're now using Redux

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
  
  const handleAddClick = () => {
    setShowAddForm('client');
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
  const handleBackFromForm = () => {
    setShowAddForm(null);
    setInvoiceForReceipt(null);
    setSelectedInvoice(null);
    setSelectedReceipt(null);
    
    // Don't clear selectedCustomer - this ensures the customer remains selected when returning from forms
  };

  const handleGenerateReceiptClick = (invoice) => {
    setInvoiceForReceipt(invoice);
    setShowAddForm('receipt');
  };

  // const handleInvoiceSubmit = (data) => {
  //   setInvoices(prev => [...prev, { 
  //     id: data.invoiceNumber, 
  //     projectName: data.projectName,
  //     client: data.customerName, 
  //     date: data.invoiceDate, 
  //     totalAmount: data.totalAmount, 
  //     amountReceived: 0,
  //     status: 'Due',
  //     receiptGenerated: 'No'
  //   }]);
  //   toast.success('Invoice added!');
  //   setShowAddForm(null);
  // };

const handleInvoiceSubmit = (data) => {
  dispatch(createInvoice(data))
    .unwrap()
    .then(() => {
      toast.success('Invoice added!');
      dispatch(fetchInvoices());
      setShowAddForm(null);
        setSelectedInvoice(null);
    })
    .catch((err) => {
      toast.error('Failed to add invoice: ' + (err?.message || 'Unknown error'));
    });
};


  const handleReceiptSubmit = (data) => {
    setShowAddForm(null);     // Close the form
    setInvoiceForReceipt(null);
    setSelectedReceipt(null);
    dispatch(fetchReceipts()); // Refresh receipts list
    dispatch(fetchInvoices()); // Refresh invoices list so amountReceived is updated
    toast.success('Receipt added!');
  };


  const handleClientSubmit = (data) => {
    // The AddClientForm now handles the Redux dispatch internally
    setShowAddForm(null);
    dispatch(fetchCustomers()); // Refresh the customers list
  };



  const renderAddForm = () => {
    const commonProps = { onCancel: handleBackFromForm };

    let formComponent;
    let formTitle;
    switch (showAddForm) {
      case 'invoice': 
        formComponent = <AddInvoiceForm {...commonProps} onSubmit={handleInvoiceSubmit} />; 
        formTitle = 'Add New Invoice';
        break;
      case 'receipt': 
        formComponent = <AddReceiptForm {...commonProps} onSubmit={handleReceiptSubmit} initialData={invoiceForReceipt} />; 
        formTitle = 'Add New Receipt';
        break;
      case 'client': 
        formComponent = <AddClientForm {...commonProps} onSubmit={handleClientSubmit} />; 
        formTitle = 'Add New Customer';
        break;
      default: return null;
    }

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <button onClick={handleBackFromForm} className="mr-4 text-gray-600 hover:text-blue-600 flex items-center gap-2">
            <FaArrowLeft className="w-5 h-5" /> <span>Back</span>
          </button>
          <h2 className="text-xl font-bold text-gray-900">{formTitle}</h2>
        </div>
        {formComponent}
      </div>
    );
  };

  const renderContent = () => {
    if (showAddForm) return renderAddForm();

    // Only show customers view for now
        if (customersLoading) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading customers...</p>
            </div>
              </div>
            </div>
          );
        } else if (customersError) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-red-600 mb-2">Error loading customers</p>
                <p className="text-gray-600 text-sm">{customersError}</p>
            </div>
              </div>
            </div>
          );
    }

    return (
            <div className="flex gap-6">
        {/* Customer List - 40% width */}
        <div className="w-2/5 bg-white rounded-lg shadow">
          {/* Table Header */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Customer List</h3>
          </div>
          
          {/* Table Content */}
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Customer Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Company Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Net Receivables</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers
                .filter(customer =>
                  (customer.customerName && customer.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                  (customer.companyName && customer.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                  (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                  (customer.contactNumber && customer.contactNumber.toLowerCase().includes(searchTerm.toLowerCase()))
                )
                .map((customer) => {
                  // Calculate net receivables for this customer
                  const customerInvoices = invoices.filter(invoice => invoice.customer?.customerId === customer.customerId);
                  const customerReceipts = receipts.filter(receipt => receipt.customer?.customerId === customer.customerId);
                  
                  const totalInvoiced = customerInvoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
                  const totalReceived = customerReceipts.reduce((sum, receipt) => sum + (receipt.amountReceived || 0), 0);
                  const netReceivables = totalInvoiced - totalReceived;
                  
                  return (
                    <tr 
                      key={customer.customerId} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{customer.customerName}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-700">{customer.companyName || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${
                          netReceivables > 0 ? 'text-red-600' : netReceivables < 0 ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          ₹{netReceivables.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomerForPreview(customer);
                            setShowCustomerPreview(true);
                          }}
                          className="text-gray-600 hover:text-blue-600 transition-colors"
                          title="Preview Customer"
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
              
              {/* Right side - 60% width - Customer Details with Tabs */}
              <div className="w-3/5 bg-white shadow-sm border border-gray-200">
                {selectedCustomer ? (
                  <div className="p-6">
                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200 mb-6">
                      <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button
                          onClick={() => setCustomerActiveTab('invoices')}
                          className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none ${
                            customerActiveTab === 'invoices'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Invoices
                        </button>
                        <button
                          onClick={() => setCustomerActiveTab('receipts')}
                          className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none ${
                            customerActiveTab === 'receipts'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Receipts
                        </button>
                        <button
                          onClick={() => setCustomerActiveTab('statement')}
                          className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none ${
                            customerActiveTab === 'statement'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Statement
                        </button>
                      </nav>
                    </div>

                    {/* Tab Content */}
                    {customerActiveTab === 'invoices' && (
                      <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Customer Invoices</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Invoice No.</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Project Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Invoice Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount Received</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {(() => {
                                const customerInvoices = invoices.filter(invoice => invoice.customer?.customerId === selectedCustomer.customerId);
                                return customerInvoices.length > 0 ? customerInvoices.map((invoice) => (
                            <tr 
                              key={invoice.id} 
                              className="hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowAddForm('invoice');
                              }}
                            >
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <span className="text-sm font-medium text-blue-600">{invoice.invoiceNumber}</span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{invoice.project?.projectName || 'N/A'}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{invoice.invoiceDate}</td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                <span className="text-sm font-semibold text-gray-900">₹{invoice.totalAmount}</span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="text-sm font-semibold text-green-600">₹{invoice.amountReceived}</span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  invoice.status?.toLowerCase() === 'received' || invoice.status?.toLowerCase() === 'paid' ? 'bg-green-100 text-green-800' :
                                  invoice.status?.toLowerCase() === 'partial received' || invoice.status?.toLowerCase() === 'partial paid' || invoice.status?.toLowerCase() === 'partially paid' || invoice.status?.toLowerCase() === 'partiallypaid' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {invoice.status}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedInvoiceForPreview(invoice);
                                  }}
                                  className="text-gray-500 hover:text-blue-600"
                                >
                                  <FaEye className="w-4 h-4" />
                                </button>
                                    </td>
                                  </tr>
                                )) : (
                                  <tr>
                              <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                                      No invoices found for this customer
                                    </td>
                                  </tr>
                                );
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {customerActiveTab === 'receipts' && (
                      <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Customer Receipts</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Receipt No.</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Project Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Receipt Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount Received</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment Method</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {(() => {
                                const customerReceipts = receipts.filter(receipt => receipt.customer?.customerId === selectedCustomer.customerId);
                                return customerReceipts.length > 0 ? customerReceipts.map((receipt) => (
                            <tr 
                              key={receipt.id} 
                              className="hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => {
                                setSelectedReceipt(receipt);
                                setShowAddForm('receipt');
                              }}
                            >
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <span className="text-sm font-medium text-blue-600">{receipt.receiptNumber}</span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{receipt.project?.projectName || 'N/A'}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{receipt.receiptDate}</td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                <span className="text-sm font-semibold text-green-600">₹{receipt.amountReceived}</span>
                                    </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  receipt.paymentMethod === 'Bank Transfer' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : receipt.paymentMethod === 'Credit Card'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {receipt.paymentMethod}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedReceiptForPreview(receipt);
                                  }}
                                  className="text-gray-500 hover:text-blue-600"
                                >
                                  <FaEye className="w-4 h-4" />
                                </button>
                              </td>
                                  </tr>
                                )) : (
                                  <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                      No receipts found for this customer
                                    </td>
                                  </tr>
                                );
                              })()}
                  </tbody>
                </table>
                        </div>
                      </div>
                    )}

                    {customerActiveTab === 'statement' && (
                      <div>
                        {/* Statement Title */}
                        <div className="text-center mb-6">
                          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">Statement of Accounts</h2>
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
                            <p className="text-sm font-semibold text-gray-900">{selectedCustomer.customerName}</p>
                      <p className="text-sm text-gray-600">{selectedCustomer.companyName || ''}</p>
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
                                    const customerInvoices = invoices.filter(invoice => invoice.customer?.customerId === selectedCustomer.customerId);
                                    const customerReceipts = receipts.filter(receipt => receipt.customer?.customerId === selectedCustomer.customerId);
                                    
                                    const totalInvoiced = customerInvoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
                                    const totalReceived = customerReceipts.reduce((sum, receipt) => sum + (receipt.amountReceived || 0), 0);
                                    const balanceDue = totalInvoiced - totalReceived;
                                    
                                    return (
                                      <>
                                        <tr className="border-b border-gray-200">
                                          <td className="px-4 py-2 text-sm text-gray-600">Opening Balance</td>
                                          <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">₹ 0.00</td>
                                        </tr>
                                        <tr className="border-b border-gray-200">
                                    <td className="px-4 py-2 text-sm text-gray-600">Invoiced Amount</td>
                                          <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">₹ {totalInvoiced.toFixed(2)}</td>
                                        </tr>
                                        <tr className="border-b border-gray-200">
                                          <td className="px-4 py-2 text-sm text-gray-600">Amount Received</td>
                                          <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">₹ {totalReceived.toFixed(2)}</td>
                                        </tr>
                                        <tr className="border-t-2 border-gray-300">
                                          <td className="px-4 py-2 text-sm font-semibold text-gray-700">Balance Due</td>
                                          <td className={`px-4 py-2 text-sm font-bold text-right ${balanceDue > 0 ? 'text-red-600' : balanceDue < 0 ? 'text-green-600' : 'text-gray-600'}`}>
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
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">Receipts</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Balance</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  // Get customer's invoices and receipts
                                  const customerInvoices = invoices.filter(invoice => invoice.customer?.customerId === selectedCustomer.customerId);
                                  const customerReceipts = receipts.filter(receipt => receipt.customer?.customerId === selectedCustomer.customerId);
                            
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
                              receipt: 0,
                                    balance: runningBalance,
                              timestamp: dateRange.startDate.getTime()
                                  });
                                  
                            // Add invoices within date range
                                  customerInvoices.forEach(invoice => {
                              const invoiceDate = new Date(invoice.invoiceDate || 'N/A');
                              if (invoiceDate >= dateRange.startDate && invoiceDate <= dateRange.endDate) {
                                    runningBalance += invoice.totalAmount || 0;
                                    transactions.push({
                                      date: invoice.invoiceDate || 'N/A',
                                      type: 'Invoice',
                                      details: `Invoice No: ${invoice.invoiceNumber || 'N/A'}`,
                                      amount: invoice.totalAmount || 0,
                                  receipt: 0,
                                      balance: runningBalance,
                                  timestamp: invoiceDate.getTime()
                                    });
                              }
                                  });
                                  
                            // Add receipts within date range
                                  customerReceipts.forEach(receipt => {
                              const receiptDate = new Date(receipt.receiptDate || 'N/A');
                              if (receiptDate >= dateRange.startDate && receiptDate <= dateRange.endDate) {
                                    runningBalance -= receipt.amountReceived || 0;
                                    transactions.push({
                                      date: receipt.receiptDate || 'N/A',
                                  type: 'Receipt',
                                  details: `Receipt ID: ${receipt.receiptNumber || 'N/A'}`,
                                      amount: 0,
                                  receipt: receipt.amountReceived || 0,
                                      balance: runningBalance,
                                  timestamp: receiptDate.getTime()
                                    });
                              }
                                  });
                                  
                            // Sort transactions by actual chronological order
                                  transactions.sort((a, b) => {
                                    const dateA = new Date(a.date);
                                    const dateB = new Date(b.date);
                                    
                                    if (dateA.getTime() !== dateB.getTime()) {
                                      return dateA - dateB;
                                    }
                                    
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
                                  {transaction.receipt > 0 ? `₹${transaction.receipt.toFixed(2)}` : '-'}
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
                            const customerInvoices = invoices.filter(invoice => invoice.customer?.customerId === selectedCustomer.customerId);
                            const customerReceipts = receipts.filter(receipt => receipt.customer?.customerId === selectedCustomer.customerId);
                            
                            const totalInvoiced = customerInvoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
                            const totalReceived = customerReceipts.reduce((sum, receipt) => sum + (receipt.amountReceived || 0), 0);
                            const balanceDue = totalInvoiced - totalReceived;
                            
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
                      <FaUsers className="w-16 h-16 mx-auto mb-3" />
                      <p className="text-sm">Click on any customer row in the left table to view their details</p>
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

        {/* Fixed Customers Header */}
        <div 
          className={`fixed top-16 z-50 bg-white shadow-sm border-b border-gray-200 p-4 flex items-center justify-between transition-all duration-300 ${
            isSidebarCollapsed ? "left-20 right-0" : "left-60 right-0"
          }`}
        >
          {/* Left: Title + Search + Filter */}
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">Customers</h1>
            
            <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 w-64">
              <FaSearch className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search customers..."
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
                setSelectedInvoice(null);
                setShowAddForm('invoice');
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              <FaPlus className="w-3 h-3" /> <span>New Invoice</span>
            </button>
            <button 
              onClick={() => {
                setSelectedReceipt(null);
                setShowAddForm('receipt');
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              <FaPlus className="w-3 h-3" /> <span>New Receipt</span>
            </button>
            <button 
              onClick={handleAddClick} 
              className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              <FaPlus className="w-3 h-3" /> <span>New Customer</span>
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

      {/* Modals */}
      {selectedInvoiceForPreview && (
        <InvoicePreviewModal 
          invoice={selectedInvoiceForPreview} 
          receipts={receipts}
          onClose={() => setSelectedInvoiceForPreview(null)} 
        />
      )}
      {selectedReceiptForPreview && (
        <ReceiptPreviewModal
          receipt={selectedReceiptForPreview}
          onClose={() => setSelectedReceiptForPreview(null)}
        />
      )}
      
      {/* Customer Preview Modal */}
      {showCustomerPreview && selectedCustomerForPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Customer Preview: {selectedCustomerForPreview.customerName}</h2>
              <button 
                onClick={() => setShowCustomerPreview(false)} 
                className="text-gray-500 hover:text-gray-800"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Basic Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer ID:</span>
                      <span className="font-medium">{selectedCustomerForPreview.customerId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{selectedCustomerForPreview.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Company:</span>
                      <span className="font-medium">{selectedCustomerForPreview.companyName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedCustomerForPreview.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contact:</span>
                      <span className="font-medium">{selectedCustomerForPreview.contactNumber}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Address Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Address:</span>
                      <span className="text-right max-w-xs">{selectedCustomerForPreview.address || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Customers;