// src/components/ConvertLeadModal.js (Apply these changes manually)
import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateLead, moveLeadToPipeline } from '@/redux/slices/leadsSlice';
import { FaRupeeSign, FaTimes, FaFilePdf } from 'react-icons/fa';
import axios from 'axios';
import getConfig from 'next/config';
import { fetchImageFromMinio } from '@/redux/slices/minioSlice';
import { getItemFromSessionStorage } from '@/redux/slices/sessionStorageSlice';
import { toast } from 'sonner';

const { publicRuntimeConfig } = getConfig();
const API_BASE_URL = publicRuntimeConfig.apiURL;

// Receive leadData object containing id
const ConvertLeadModal = ({ lead, onClose, onSuccess }) => {
  const dispatch = useDispatch();

  const [signupAmount, setSignupAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [paymentTransactionId, setPaymentTransactionId] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [gstAvailable, setGstAvailable] = useState(false);
  const [gst, setGst] = useState('');
  const [paymentDetailsFile, setPaymentDetailsFile] = useState(null);
  const [bookingFormFile, setBookingFormFile] = useState(null);
  const [fileLoading, setFileLoading] = useState({ payment: false, booking: false });
  const [fileError, setFileError] = useState({ payment: null, booking: null });

  const formRef = useRef(null);

  const paymentModes = [
    'UPI',
    'Debit Card',
    'Credit Card',
    'IMPS/NEFT'
  ];

  const resetFormState = () => {
    setSignupAmount('');
    setPaymentDate('');
    setPaymentMode('');
    setPaymentTransactionId('');
    setPanNumber('');
    setGstAvailable(false);
    setGst('');
    setPaymentDetailsFile(null);
    setBookingFormFile(null);
    setFileLoading({ payment: false, booking: false });
    setFileError({ payment: null, booking: null });
  };

  useEffect(() => {
    // Clear previous data first to avoid leaking files/inputs from last lead
    resetFormState();

    if (lead) {
      setSignupAmount(lead.signupAmount || '');
      setPaymentDate(lead.paymentDate || '');
      setPaymentMode(lead.paymentMode || '');
      setPaymentTransactionId(lead.paymentTransactionId || '');
      setPanNumber(lead.panNumber || '');
      setGstAvailable(lead.gstAvailable || false);
      setGst(lead.gst || '');

      // Handle existing files
      if (lead.paymentDetailsFileName) {
        setPaymentDetailsFile({
          name: lead.paymentDetailsFileName,
          url: lead.paymentDetailsFileName, // This should be the full URL from backend
          isExisting: true,
          type: 'application/octet-stream'
        });
      }

      if (lead.bookingFormFileName) {
        setBookingFormFile({
          name: lead.bookingFormFileName,
          url: lead.bookingFormFileName, // This should be the full URL from backend
          isExisting: true,
          type: 'application/octet-stream'
        });
      }
    }
  }, [lead]);

  useEffect(() => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [lead]);

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      if (name === 'paymentDetailsFile') {
        setPaymentDetailsFile(files[0]);
        setFileError(prev => ({ ...prev, payment: null }));
      } else if (name === 'bookingFormFile') {
        setBookingFormFile(files[0]);
        setFileError(prev => ({ ...prev, booking: null }));
      }
    } else {
      if (name === 'paymentDetailsFile') setPaymentDetailsFile(null);
      if (name === 'bookingFormFile') setBookingFormFile(null);
    }
  };

  const handleRemoveFile = (type) => {
    if (type === 'payment') {
      setPaymentDetailsFile(null);
      setFileError(prev => ({ ...prev, payment: null }));
    }
    if (type === 'booking') {
      setBookingFormFile(null);
      setFileError(prev => ({ ...prev, booking: null }));
    }
  };

  // Input restriction helpers
  const handleNumberInput = (value, setter) => {
    // Only allow numbers and decimal point
    let processedValue = value.replace(/[^\d.]/g, '');
    // Prevent multiple decimal points
    const decimalCount = (processedValue.match(/\./g) || []).length;
    if (decimalCount > 1) {
      processedValue = processedValue.replace(/\.+$/, '');
    }
    setter(processedValue);
  };

  const handlePanInput = (value) => {
    // Only allow uppercase letters and numbers, max 10 characters
    const processedValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10);
    setPanNumber(processedValue);
  };

  const handleTransactionIdInput = (value) => {
    // Allow alphanumeric and common characters
    const processedValue = value.replace(/[^a-zA-Z0-9\s\-_]/g, '').slice(0, 50);
    setPaymentTransactionId(processedValue);
  };

  const handleGstInput = (value) => {
    // Only allow uppercase letters and numbers, max 15 characters (GST format: 22AAAAA0000A1Z5)
    const processedValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 15);
    setGst(processedValue);
  };

  const handleOpenFile = async (file, type) => {
    if (!file) return;

    try {
      setFileLoading(prev => ({ ...prev, [type]: true }));
      setFileError(prev => ({ ...prev, [type]: null }));

      if (file.isExisting && file.url) {
        // For existing files, fetch through Minio
        const result = await dispatch(fetchImageFromMinio({ url: file.url })).unwrap();
        if (result && result.dataUrl) {
          window.open(result.dataUrl, '_blank');
        } else {
          throw new Error('Failed to fetch file from Minio');
        }
      } else if (file instanceof File) {
        // For new files, create blob URL
        const blobUrl = URL.createObjectURL(file);
        window.open(blobUrl, '_blank');
      }
    } catch (error) {
      console.error('Error opening file:', error);
      setFileError(prev => ({ ...prev, [type]: 'Failed to open file' }));
    } finally {
      setFileLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Enhanced validation
    if (!lead) {
      toast.error("No lead selected.");
      return;
    }

    if (!signupAmount || !signupAmount.trim()) {
      toast.error("Please fill in Sign-up Amount.");
      return;
    }
    // Require payment date
    if (!paymentDate || !paymentDate.trim()) {
      toast.error("Please select Payment Date.");
      return;
    }


    // Validate signup amount
    const signupAmountValue = parseFloat(signupAmount.replace(/[^\d.]/g, ''));
    if (isNaN(signupAmountValue) || signupAmountValue <= 0) {
      toast.error("Sign-up Amount must be a valid positive number.");
      return;
    }

    if (signupAmountValue > 999999999) {
      toast.error("Sign-up Amount cannot exceed 999,999,999.");
      return;
    }

    // Validate PAN number if provided
    if (panNumber && panNumber.trim()) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(panNumber.trim().toUpperCase())) {
        toast.error("Please enter a valid PAN number (e.g., ABCDE1234F).");
        return;
      }
    }

    // Validate payment transaction ID if provided
    if (paymentTransactionId && paymentTransactionId.trim()) {
      if (paymentTransactionId.trim().length < 5) {
        toast.error("Payment Transaction ID must be at least 5 characters.");
        return;
      }

      if (paymentTransactionId.trim().length > 50) {
        toast.error("Payment Transaction ID must be less than 50 characters.");
        return;
      }
    }

    // Validate GST number if GST is available
    if (gstAvailable && gst && gst.trim()) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(gst.trim())) {
        toast.error("Please enter a valid GST number (e.g., 22AAAAA0000A1Z5).");
        return;
      }
    }

    try {
      // Prepare FormData for file upload - ALWAYS use FormData since backend expects multipart/form-data
      const formData = new FormData();
      formData.append('signupAmount', signupAmount);
      formData.append('paymentDate', paymentDate || '');
      formData.append('paymentMode', paymentMode || '');
      formData.append('paymentTransactionId', paymentTransactionId || '');
      formData.append('panNumber', panNumber || '');
      formData.append('gstAvailable', gstAvailable);
      formData.append('gst', gst || '');

      if (paymentDetailsFile) formData.append('paymentDetailsFile', paymentDetailsFile);
      if (bookingFormFile) formData.append('bookingFormFile', bookingFormFile);

      // If conversion details already exist, use PUT to update
      if (lead.signupAmount || lead.paymentDate || lead.paymentMode || lead.panNumber || lead.paymentDetailsFileName || lead.bookingFormFileName) {
        await axios.put(`${API_BASE_URL}/leads/${lead.leadId}`, {
          signupAmount: parseFloat(signupAmount),
          paymentDate,
          paymentMode,
          paymentTransactionId,
          panNumber,
          gstAvailable,
          gst
        }, {
          headers: {
            'Authorization': `Bearer ${getItemFromSessionStorage('token') || ''}`,
            'Content-Type': 'application/json'
          }
        });
        // Optionally handle file uploads separately if needed
      } else {
        // Always use FormData since backend expects multipart/form-data
        await axios.post(`${API_BASE_URL}/leads/${lead.leadId}/convert-with-docs`, formData, {
          headers: {
            'Authorization': `Bearer ${getItemFromSessionStorage('token') || ''}`
            // Don't set Content-Type for FormData, let browser set it automatically to multipart/form-data
          }
        });
      }

      // Move the lead to the converted stage (update stageId)
      if (lead.pipelineId || lead.stageId) {
        await dispatch(moveLeadToPipeline({
          leadId: lead.leadId,
          newPipelineId: lead.pipelineId || lead.stageId
        }));
      }

      // Reset local form state to avoid leaking into next conversion
      resetFormState();

      if (onSuccess) {
        onSuccess({ ...lead, status: 'Converted' });
      } else {
        onClose && onClose();
      }
    } catch (error) {
      console.error('Error converting lead:', error);
      console.error('Error details:', error.response?.data);
      alert('Failed to convert lead. Please try again.');
    }
  };

  if (!lead) return null;

  const handleCancel = () => {
    resetFormState();
    onClose && onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-xl w-full max-w-2xl shadow-2xl my-8 max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Mark Lead as Converted</h2>
          <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
        </div>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sign-up Amount (₹) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><FaRupeeSign /></span>
              <input
                type="text"
                value={signupAmount}
                onChange={(e) => handleNumberInput(e.target.value, setSignupAmount)}
                className="pl-9 pr-3 py-2 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-400 focus:ring-blue-100 bg-gray-50 text-gray-800 placeholder-gray-400 transition-all"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-400 focus:ring-blue-100 bg-gray-50 text-gray-800 placeholder-gray-400 transition-all py-2 px-3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-400 focus:ring-blue-100 bg-gray-50 text-gray-800 transition-all py-2 px-3"
              >
                <option value="">Select Payment Mode</option>
                {paymentModes.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Transaction ID</label>
              <input
                type="text"
                value={paymentTransactionId}
                onChange={(e) => handleTransactionIdInput(e.target.value)}
                className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-400 focus:ring-blue-100 bg-gray-50 text-gray-800 placeholder-gray-400 transition-all py-2 px-3"
                placeholder="Enter transaction ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
              <input
                type="text"
                value={panNumber}
                onChange={(e) => handlePanInput(e.target.value)}
                className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-400 focus:ring-blue-100 bg-gray-50 text-gray-800 placeholder-gray-400 transition-all py-2 px-3"
                placeholder="ABCDE1234F"
              />
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Payment Proof</label>
              <input
                type="file"
                name="paymentDetailsFile"
                onChange={handleFileChange}
                accept="image/*,application/pdf"
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
              />
              {paymentDetailsFile && (
                <div className="relative mt-3">
                  <div 
                    className={`cursor-pointer ${fileLoading.payment ? 'opacity-50' : 'hover:opacity-80'}`}
                    onClick={() => handleOpenFile(paymentDetailsFile, 'payment')}
                    title="Click to open in new tab"
                  >
                    {paymentDetailsFile.type.startsWith('image/') ? (
                      <img
                        src={paymentDetailsFile instanceof File ? URL.createObjectURL(paymentDetailsFile) : undefined}
                        alt="Payment Proof Preview"
                        className="w-full max-h-56 object-contain rounded border"
                      />
                    ) : (
                      <div className="flex items-center gap-2 bg-gray-100 p-3 rounded border">
                        <FaFilePdf className="text-red-600 text-2xl" />
                        <span className="truncate">{paymentDetailsFile.name}</span>
                      </div>
                    )}
                  </div>
                  {fileLoading.payment && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                      <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                  {fileError.payment && (
                    <div className="absolute top-2 left-2 bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                      {fileError.payment}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveFile('payment')}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-100"
                    title="Remove file"
                  >
                    <FaTimes className="text-gray-500 text-lg" />
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Booking Form</label>
              <input
                type="file"
                name="bookingFormFile"
                onChange={handleFileChange}
                accept="image/*,application/pdf"
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
              />
              {bookingFormFile && (
                <div className="relative mt-3">
                  <div 
                    className={`cursor-pointer ${fileLoading.booking ? 'opacity-50' : 'hover:opacity-80'}`}
                    onClick={() => handleOpenFile(bookingFormFile, 'booking')}
                    title="Click to open in new tab"
                  >
                    {bookingFormFile.type.startsWith('image/') ? (
                      <img
                        src={bookingFormFile instanceof File ? URL.createObjectURL(bookingFormFile) : undefined}
                        alt="Booking Form Preview"
                        className="w-full max-h-56 object-contain rounded border"
                      />
                    ) : (
                      <div className="flex items-center gap-2 bg-gray-100 p-3 rounded border">
                        <FaFilePdf className="text-red-600 text-2xl" />
                        <span className="truncate">{bookingFormFile.name}</span>
                      </div>
                    )}
                  </div>
                  {fileLoading.booking && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                      <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                  {fileError.booking && (
                    <div className="absolute top-2 left-2 bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                      {fileError.booking}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveFile('booking')}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-100"
                    title="Remove file"
                  >
                    <FaTimes className="text-gray-500 text-lg" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* GST Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="gstAvailable"
                checked={gstAvailable}
                onChange={(e) => setGstAvailable(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="gstAvailable" className="ml-2 block text-sm font-medium text-gray-700">
                GST is available
              </label>
            </div>
            
            {gstAvailable && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                <input
                  type="text"
                  value={gst}
                  onChange={(e) => handleGstInput(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-400 focus:ring-blue-100 bg-gray-50 text-gray-800 placeholder-gray-400 transition-all py-2 px-3"
                  placeholder="22AAAAA0000A1Z5"
                />
                <p className="text-xs text-gray-500 mt-1">Format: 22AAAAA0000A1Z5 (15 characters)</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2 border border-gray-300 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded-md text-base font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all"
            >
              Confirm Conversion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConvertLeadModal;