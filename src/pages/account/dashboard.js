import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaUsers, 
  FaBuilding, 
  FaUserTie, 
  FaFileInvoiceDollar, 
  FaReceipt, 
  FaCreditCard, 
  FaChartLine, 
  FaCalendarAlt, 
  FaArrowUp, 
  FaArrowDown,
  FaEye,
  FaPlus,
  FaFileInvoice
} from 'react-icons/fa';
import MainLayout from '@/components/MainLayout';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInvoices } from '@/redux/slices/invoiceSlice';
import { fetchBills } from '@/redux/slices/BillSlice';
import { fetchAllExpenses } from '@/redux/slices/expensesSlice';
import { fetchCustomers } from '@/redux/slices/customerSlice';
import { fetchVendors } from '@/redux/slices/vendorSlice';
import { fetchReceipts } from '@/redux/slices/receiptSlice';
import { fetchPurchaseOrders } from '@/redux/slices/PurchaseOrderSlice';
import { fetchPayments } from '@/redux/slices/paymentSlice';
import { toast } from 'sonner';
import Link from 'next/link';
import { AddInvoiceForm, AddReceiptForm, AddClientForm } from '@/components/Forms';
import { AddBillForm, BulkPaymentForm, AddVendorForm, AddPurchaseOrderForm } from '@/components/Forms';

const AccountDashboard = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalBills: 0,
    totalRevenue: 0,
    totalExpenditure: 0
  });
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  // Redux selectors
  const { invoices } = useSelector(state => state.invoices);
  const { bills } = useSelector(state => state.bills);
  const { expenses } = useSelector(state => state.expenses);
  
  // Additional Redux selectors for forms
  const { customers } = useSelector(state => state.customers);
  const { vendors } = useSelector(state => state.vendors);
  const { receipts } = useSelector(state => state.receipts);
  const { purchaseOrders } = useSelector(state => state.purchaseOrders);
  const { payments } = useSelector(state => state.payments);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          dispatch(fetchInvoices()),
          dispatch(fetchBills()),
          dispatch(fetchAllExpenses()),
          dispatch(fetchCustomers()),
          dispatch(fetchVendors()),
          dispatch(fetchReceipts()),
          dispatch(fetchPurchaseOrders()),
          dispatch(fetchPayments())
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [dispatch]);

  const calculateStats = useCallback(() => {
    const totalInvoices = invoices?.length || 0;
    const totalBills = bills?.length || 0;

    // Calculate financial totals
    const totalRevenue = invoices?.reduce((sum, invoice) => sum + (invoice.amount || 0), 0) || 0;
    const totalExpenditure = bills?.reduce((sum, bill) => sum + (bill.amount || 0), 0) + 
                            expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;

    setStats({
      totalInvoices,
      totalBills,
      totalRevenue,
      totalExpenditure
    });
  }, [invoices, bills, expenses]);

  useEffect(() => {
    if (invoices && bills && expenses) {
      calculateStats();
    }
  }, [invoices, bills, expenses, calculateStats]);

  const handleModalOpen = (type, title) => {
    setModalType(type);
    setModalTitle(title);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setModalType('');
    setModalTitle('');
  };

  // Form submission handlers
  const handleInvoiceSubmit = (data) => {
    toast.success('Invoice added successfully!');
    dispatch(fetchInvoices());
    handleModalClose();
  };

  const handleReceiptSubmit = (data) => {
    toast.success('Receipt added successfully!');
    dispatch(fetchReceipts());
    dispatch(fetchInvoices());
    handleModalClose();
  };

  const handleCustomerSubmit = (data) => {
    toast.success('Customer added successfully!');
    dispatch(fetchCustomers());
    handleModalClose();
  };

  const handleBillSubmit = (data) => {
    toast.success('Bill added successfully!');
    dispatch(fetchBills());
    handleModalClose();
  };

  const handlePurchaseOrderSubmit = (data) => {
    toast.success('Purchase Order added successfully!');
    dispatch(fetchPurchaseOrders());
    handleModalClose();
  };

  const handlePaymentSubmit = (data) => {
    toast.success('Payment added successfully!');
    dispatch(fetchPayments());
    handleModalClose();
  };

  const handleVendorSubmit = (data) => {
    toast.success('Vendor added successfully!');
    dispatch(fetchVendors());
    handleModalClose();
  };

  const StatCard = ({ title, value, icon: Icon, change, changeType, link, onClick }) => {
    const CardContent = () => (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {change && (
              <div className="flex items-center mt-2">
                {changeType === 'positive' ? (
                  <FaArrowUp className="text-green-500 text-xs mr-1" />
                ) : changeType === 'negative' ? (
                  <FaArrowDown className="text-red-500 text-xs mr-1" />
                ) : (
                  <FaEye className="text-blue-500 text-xs mr-1" />
                )}
                <span className={`text-xs font-medium ${
                  changeType === 'positive' ? 'text-green-600' : 
                  changeType === 'negative' ? 'text-red-600' : 
                  'text-blue-600'
                }`}>
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <Icon className="text-blue-600 text-xl" />
          </div>
        </div>
      </div>
    );

    if (link) {
      return (
        <Link href={link}>
          <CardContent />
        </Link>
      );
    }

    if (onClick) {
      return (
        <button onClick={onClick} className="w-full text-left">
          <CardContent />
        </button>
      );
    }

    return <CardContent />;
  };





  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Account Dashboard</h1>
            <div className="flex items-center gap-4">
              {/* Vendors Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  <FaBuilding />
                  Vendors
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handleModalOpen('newBill', 'New Bill')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <FaReceipt className="text-blue-600" />
                      New Bill
                    </button>
                    <button
                      onClick={() => handleModalOpen('newPurchaseOrder', 'New Purchase Order')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <FaFileInvoice className="text-blue-600" />
                      New Purchase Order
                    </button>
                    <button
                      onClick={() => handleModalOpen('newPayment', 'New Payment Made')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <FaCreditCard className="text-blue-600" />
                      New Payment Made
                    </button>
                    <button
                      onClick={() => handleModalOpen('newVendor', 'New Vendor')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <FaBuilding className="text-blue-600" />
                      New Vendor
                    </button>
                  </div>
                </div>
              </div>

              {/* Customers Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  <FaUsers />
                  Customers
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handleModalOpen('newInvoice', 'New Invoice')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <FaFileInvoiceDollar className="text-blue-600" />
                      New Invoice
                    </button>
                    <button
                      onClick={() => handleModalOpen('newReceipt', 'New Receipt')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <FaReceipt className="text-blue-600" />
                      New Receipt
                    </button>
                    <button
                      onClick={() => handleModalOpen('newCustomer', 'New Customer')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <FaUsers className="text-blue-600" />
                      New Customer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard
            title="Total Receivables"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            icon={FaFileInvoiceDollar}
            link="/account/customers"
          />
          <StatCard
            title="Total Payables"
            value={`₹${stats.totalExpenditure.toLocaleString()}`}
            icon={FaReceipt}
            link="/account/vendor"
          />
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Latest Invoices Issued */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Latest Invoices Issued</h3>
                  <p className="text-sm text-gray-600 font-medium">Total: ₹{invoices?.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0).toLocaleString() || '0'}</p>
                </div>
                <Link href="/account/customers" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View All
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Customer</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Invoice #</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Date</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Due Date</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoices?.slice(0, 5).map((invoice, index) => {
                      const status = invoice.status?.toLowerCase();
                      const statusColor = status === 'received' || status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : status === 'partial received' || status === 'partial paid' || status === 'partially paid' || status === 'partiallypaid'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800';
                      
                      const statusText = status === 'received' || status === 'paid' ? 'Paid' : 
                        status === 'partial received' || status === 'partial paid' || status === 'partially paid' || status === 'partiallypaid' ? 'Partial' : 'Unpaid';
                      
                      return (
                        <tr key={invoice.id || index} className="hover:bg-gray-50">
                          <td className="py-2 px-2 text-gray-900 font-medium truncate max-w-20" title={invoice.customer?.customerName || 'N/A'}>
                            {invoice.customer?.customerName || 'N/A'}
                          </td>
                          <td className="py-2 px-2 text-blue-600 font-medium">{invoice.invoiceNumber}</td>
                          <td className="py-2 px-2 text-gray-600">{invoice.invoiceDate || 'N/A'}</td>
                          <td className="py-2 px-2 text-gray-600">{invoice.dueDate || 'N/A'}</td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                              {statusText}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {(!invoices || invoices.length === 0) && (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-gray-500">
                          <FaFileInvoiceDollar className="text-2xl mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No invoices found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Receipts */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Recent Receipts</h3>
                  <p className="text-sm text-gray-600 font-medium">Total: ₹{receipts?.reduce((sum, receipt) => sum + (receipt.amountReceived || 0), 0).toLocaleString() || '0'}</p>
                </div>
                <Link href="/account/customers" className="text-orange-600 hover:text-orange-800 text-sm font-medium">
                  View All
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Customer</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Receipt #</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Date</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Method</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {receipts?.slice(0, 5).map((receipt, index) => (
                      <tr key={receipt.id || index} className="hover:bg-gray-50">
                        <td className="py-2 px-2 text-gray-900 font-medium truncate max-w-20" title={receipt.customer?.customerName || 'N/A'}>
                          {receipt.customer?.customerName || 'N/A'}
                        </td>
                        <td className="py-2 px-2 text-orange-600 font-medium">{receipt.receiptNumber}</td>
                        <td className="py-2 px-2 text-gray-600">{receipt.receiptDate}</td>
                        <td className="py-2 px-2 text-gray-600">{receipt.paymentMethod || 'N/A'}</td>
                        <td className="py-2 px-2 text-gray-900 font-medium">₹{receipt.amountReceived?.toLocaleString() || '0'}</td>
                      </tr>
                    ))}
                    {(!receipts || receipts.length === 0) && (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-gray-500">
                          <FaReceipt className="text-2xl mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No receipts found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Payments */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
                  <p className="text-sm text-gray-600 font-medium">Total: ₹{payments?.reduce((sum, payment) => sum + (payment.totalAmount || 0), 0).toLocaleString() || '0'}</p>
                </div>
                <Link href="/account/vendor" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                  View All
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Vendor</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Transaction ID</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Date</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Method</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments?.slice(0, 5).map((payment, index) => (
                      <tr key={payment.id || index} className="hover:bg-gray-50">
                        <td className="py-2 px-2 text-gray-900 font-medium truncate max-w-20" title={payment.vendorName || 'N/A'}>
                          {payment.vendorName || 'N/A'}
                        </td>
                        <td className="py-2 px-2 text-purple-600 font-medium">{payment.paymentTransactionId || 'N/A'}</td>
                        <td className="py-2 px-2 text-gray-600">{payment.paymentDate}</td>
                        <td className="py-2 px-2 text-gray-600">{payment.paymentMethod || 'N/A'}</td>
                        <td className="py-2 px-2 text-gray-900 font-medium">₹{payment.totalAmount?.toLocaleString() || '0'}</td>
                      </tr>
                    ))}
                    {(!payments || payments.length === 0) && (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-gray-500">
                          <FaCreditCard className="text-2xl mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No payments found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Latest Bills Entered */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Latest Bills Entered</h3>
                  <p className="text-sm text-gray-600 font-medium">Total: ₹{bills?.reduce((sum, bill) => sum + (bill.finalAmount || 0), 0).toLocaleString() || '0'}</p>
                </div>
                <Link href="/account/vendor" className="text-green-600 hover:text-green-800 text-sm font-medium">
                  View All
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Vendor</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Bill #</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Date</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Due Date</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bills?.slice(0, 5).map((bill, index) => {
                      const status = bill.paymentStatus?.toLowerCase();
                      const statusColor = status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : status === 'partially_paid'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800';
                      
                      const isOverdue = bill.dueDate && new Date(bill.dueDate) < new Date();
                      const overdueColor = isOverdue ? 'bg-red-100 text-red-800' : statusColor;
                      
                      const statusText = isOverdue ? 'Overdue' : 
                        status === 'paid' ? 'Paid' : 
                        status === 'partially_paid' ? 'Partial' : 'Unpaid';
                      
                      return (
                        <tr key={bill.id || index} className="hover:bg-gray-50">
                          <td className="py-2 px-2 text-gray-900 font-medium truncate max-w-20" title={bill.vendorName || 'N/A'}>
                            {bill.vendorName || 'N/A'}
                          </td>
                          <td className="py-2 px-2 text-green-600 font-medium">{bill.billNumber || 'N/A'}</td>
                          <td className="py-2 px-2 text-gray-600">{bill.billDate}</td>
                          <td className="py-2 px-2 text-gray-600">{bill.dueDate}</td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${isOverdue ? overdueColor : statusColor}`}>
                              {statusText}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {(!bills || bills.length === 0) && (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-gray-500">
                          <FaReceipt className="text-2xl mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No bills found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>



      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{modalTitle}</h2>
              <button
                onClick={handleModalClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
              {modalType === 'newBill' && (
                <div>
                  <AddBillForm
                    onSubmit={handleBillSubmit}
                    onCancel={handleModalClose}
                  />
                </div>
              )}
              {modalType === 'newPurchaseOrder' && (
                <div>
                  <AddPurchaseOrderForm
                    mode="add"
                    onSubmit={handlePurchaseOrderSubmit}
                    onCancel={handleModalClose}
                  />
                </div>
              )}
              {modalType === 'newPayment' && (
                <div>
                  <BulkPaymentForm
                    mode="add"
                    onSubmit={handlePaymentSubmit}
                    onCancel={handleModalClose}
                  />
                </div>
              )}
              {modalType === 'newVendor' && (
                <div>
                  <AddVendorForm
                    onSubmit={handleVendorSubmit}
                    onCancel={handleModalClose}
                  />
                </div>
              )}
              {modalType === 'newInvoice' && (
                <div>
                  <AddInvoiceForm
                    onSubmit={handleInvoiceSubmit}
                    onCancel={handleModalClose}
                  />
                </div>
              )}
              {modalType === 'newReceipt' && (
                <div>
                  <AddReceiptForm
                    onSubmit={handleReceiptSubmit}
                    onCancel={handleModalClose}
                  />
                </div>
              )}
              {modalType === 'newCustomer' && (
                <div>
                  <AddClientForm
                    onSubmit={handleCustomerSubmit}
                    onCancel={handleModalClose}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default AccountDashboard;