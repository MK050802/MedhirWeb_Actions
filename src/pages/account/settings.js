import React, { useEffect, useState } from 'react';
import { FaFileInvoice, FaUniversity, FaTags, FaPlus, FaTrash } from 'react-icons/fa';
import MainLayout from '@/components/MainLayout';
import { toast } from 'sonner';
import getConfig from 'next/config';
import { getItemFromSessionStorage } from '@/redux/slices/sessionStorageSlice';

const { publicRuntimeConfig } = getConfig();

const DocumentSettings = ({ settings, onSettingsChange, onSaveChanges, isSaving }) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSettingsChange('logo', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Document Numbering Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-700">Document Numbering Settings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DOCUMENT TYPE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PREFIX
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  START NUMBER
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NEXT NUMBER
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Invoice Row */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-sm font-medium text-gray-900">Invoice</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    value={settings.invoicePrefix}
                    onChange={(e) => onSettingsChange('invoicePrefix', e.target.value)}
                    placeholder="e.g., INV-"
                    className="w-32 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    value={settings.invoiceStartNumber}
                    onChange={(e) => onSettingsChange('invoiceStartNumber', e.target.value)}
                    placeholder="e.g., 1001"
                    className="w-32 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 font-mono">
                    {settings.invoicePrefix || ''}{settings.invoiceStartNumber || ''}
                  </span>
                </td>
              </tr>

              {/* Purchase Order Row */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <div className="text-sm font-medium text-gray-900">Purchase Order</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    value={settings.poPrefix}
                    onChange={(e) => onSettingsChange('poPrefix', e.target.value)}
                    placeholder="e.g., PO-"
                    className="w-32 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    value={settings.poStartNumber}
                    onChange={(e) => onSettingsChange('poStartNumber', e.target.value)}
                    placeholder="e.g., 1001"
                    className="w-32 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 font-mono">
                    {settings.poPrefix || ''}{settings.poStartNumber || ''}
                  </span>
                </td>
              </tr>

              {/* Receipt Row */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-sm font-medium text-gray-900">Receipt</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    value={settings.receiptPrefix}
                    onChange={(e) => onSettingsChange('receiptPrefix', e.target.value)}
                    placeholder="e.g., RCPT-"
                    className="w-32 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    value={settings.receiptStartNumber}
                    onChange={(e) => onSettingsChange('receiptStartNumber', e.target.value)}
                    placeholder="e.g., 1001"
                    className="w-32 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 font-mono"
                  >
                    {settings.receiptPrefix || ''}{settings.receiptStartNumber || ''}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Changes Button */}
      <div className="flex justify-end pt-6">
        <button
          onClick={onSaveChanges}
          disabled={isSaving}
          className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Changes
            </>
          )}
        </button>
      </div>

    </div>
  );
};

const CompanyBankDetails = ({ bankAccounts, onAddBankAccount, onEditBankAccount, onDeleteBankAccount, onDeleteAllBankAccounts }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [formData, setFormData] = useState({
    accountHolderName: '',
    accountNumber: '',
    bankName: '',
    branchName: '',
    ifscCode: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingId) {
        await onEditBankAccount(editingId, formData);
        setEditingId(null);
      } else {
        await onAddBankAccount(formData);
      }
      setFormData({
        accountHolderName: '',
        accountNumber: '',
        bankName: '',
        branchName: '',
        ifscCode: ''
      });
      setIsAdding(false);
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (account) => {
    console.log('Editing account:', account); // Debug log
    setFormData({
      accountHolderName: account.accountHolderName || '',
      accountNumber: account.accountNumber || '',
      bankName: account.bankName || '',
      branchName: account.branchName || '',
      ifscCode: account.ifscCode || ''
    });
    // Use accountNumber as unique identifier if id is not available
    const editId = account.id || account.accountNumber;
    console.log('Setting editingId to:', editId); // Debug log
    setEditingId(editId);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setFormData({
      accountHolderName: '',
      accountNumber: '',
      bankName: '',
      branchName: '',
      ifscCode: ''
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleDeleteClick = (account) => {
    setAccountToDelete(account);
    setShowDeleteConfirm(true);
  };

  const handleDeleteAllClick = () => {
    setShowDeleteAllConfirm(true);
  };

  const confirmDelete = () => {
    if (accountToDelete) {
      onDeleteBankAccount(accountToDelete.id || accountToDelete.accountNumber);
      setShowDeleteConfirm(false);
      setAccountToDelete(null);
    }
  };

  const confirmDeleteAll = () => {
    onDeleteAllBankAccounts();
    setShowDeleteAllConfirm(false);
  };

  const resetForm = () => {
    setFormData({
      accountHolderName: '',
      accountNumber: '',
      bankName: '',
      branchName: '',
      ifscCode: ''
    });
    setEditingId(null);
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Company Bank Details</h3>
        <div className="flex gap-2">
          {bankAccounts.length > 0 && !isAdding && (
            <button
              onClick={handleDeleteAllClick}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Delete All'}
            </button>
          )}
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + New Bank Account
            </button>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                          <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-gray-700 text-lg">
                  {editingId ? 'Edit Bank Account' : 'New Bank Account'}
                </h4>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  value={formData.accountHolderName}
                  onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter account holder name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number *
                </label>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter bank name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  value={formData.branchName}
                  onChange={(e) => handleInputChange('branchName', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter branch name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IFSC Code *
                </label>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  value={formData.ifscCode}
                  onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter IFSC code"
                  maxLength="11"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : (editingId ? 'Save Changes' : 'Add Account')}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Bank Account</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete the bank account for <span className="font-semibold">{accountToDelete?.accountHolderName}</span>?
                <br /><br />
                This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete All Bank Accounts</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete all bank accounts?
                <br /><br />
                This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteAllConfirm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAll}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bank Accounts Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {bankAccounts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No bank accounts</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first bank account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ACCOUNT HOLDER
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    BANK NAME
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ACCOUNT NUMBER
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    BRANCH
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IFSC CODE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bankAccounts.map((account, index) => (
                  <tr key={account.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {account.accountHolderName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {account.bankName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {account.accountNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.branchName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {account.ifscCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(account)}
                          disabled={isLoading}
                          className="text-blue-600 hover:text-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(account)}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const VendorTagsSettings = ({ vendorTags, onAddTag, onRemoveTag }) => {
  const [newTag, setNewTag] = useState({ name: '', showError: false });

  const handleAddTag = async () => {
    if (!newTag.name || !newTag.name.trim()) { 
      setNewTag(prev => ({ ...prev, showError: true }));
      return; 
    }

    if (vendorTags.some(tag => tag.toLowerCase() === newTag.name.trim().toLowerCase())) {
      toast.error('This tag already exists');
      return;
    }

    try {
      await onAddTag(newTag.name.trim());
      setNewTag({ name: '', showError: false });
    } catch (error) {
      // Error handling is now done in the parent component
      console.error('Error adding vendor tag:', error);
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    try {
      await onRemoveTag(tagToRemove);
    } catch (error) {
      // Error handling is now done in the parent component
      console.error('Error removing vendor tag:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Vendor Tags Management</h3>
        <p className="text-sm text-gray-600 mb-6">Add and manage vendor tags that can be used when creating vendor profiles.</p>
        
        {/* Add New Tag Form - Matching Asset Management style */}
        <div className="flex items-end gap-4 mb-6 w-full max-w-3xl mx-auto">
          <div className="flex-1 min-w-[220px]">
            <input 
              value={newTag.name} 
              onChange={e => setNewTag({...newTag, name: e.target.value, showError: false})} 
              placeholder="New Tag Name (e.g., Critical Supplier)" 
              className="w-full p-3 border rounded-md text-base" 
            />
            {newTag.showError && (
              <p className="text-red-600 text-sm mt-1">Enter tag name</p>
            )}
          </div>
          <button 
            onClick={handleAddTag} 
            className="px-7 py-3 bg-blue-600 text-white rounded-md whitespace-nowrap text-base font-semibold shadow-sm transition-all duration-150 hover:bg-blue-700"
          >
            <FaPlus className="inline mr-1" /> Add Tag
          </button>
        </div>

        {/* Tags List - Matching Asset Management style */}
        <div className="space-y-2">
          {vendorTags.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <FaTags className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm">No vendor tags added yet</p>
              <p className="text-xs text-gray-400">Add your first vendor tag above</p>
            </div>
          ) : (
            vendorTags.map((tag, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700">{tag}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded"
                    title="Delete Tag"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">How to use Vendor Tags:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Add descriptive tags like &quot;Critical Supplier&quot;, &quot;Local Vendor&quot;, &quot;Service Provider&quot;</li>
                <li>Tags help categorize and organize your vendor database</li>
                <li>You can assign multiple tags to each vendor when creating vendor profiles</li>
                <li>Tags are searchable and help in vendor management</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AccountSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('documents');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExistingSettings, setHasExistingSettings] = useState(false);

  const buildAuthHeaders = (token) => ({
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  });
  
  const [documentSettings, setDocumentSettings] = useState({
    logo: null,
    terms: 'Payment is due within 30 days of the invoice date.',
    invoicePrefix: 'INV-',
    invoiceStartNumber: 1001,
    invoiceCurrentNumber: 1001,
    poPrefix: 'PO-',
    poStartNumber: 1001,
    poCurrentNumber: 1001,
    receiptPrefix: 'RCPT-',
    receiptStartNumber: 1001,
    receiptCurrentNumber: 1001,
  });

  const [bankAccounts, setBankAccounts] = useState([]);
  const [vendorTags, setVendorTags] = useState([]);

  const handleDocumentSettingsChange = (key, value) => {
    setDocumentSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleAddBankAccount = async (bankData) => {
    try {
      const companyId = resolveCompanyId();
      if (!companyId) {
        toast.error('Company ID not found.');
        return;
      }
      const token = getItemFromSessionStorage('token', null);
      if (!token) {
        toast.error('You are not signed in. Please sign in and try again.');
        return;
      }

      const res = await fetch(`${publicRuntimeConfig.apiURL}/bank-accounts/${companyId}/accounts?companyId=${companyId}`, {
        method: 'POST',
        headers: buildAuthHeaders(token),
        body: JSON.stringify([bankData]), // Wrap in array as backend expects ArrayList
      });

      if (res.status === 401) {
        toast.error('Authentication required. Please sign in again.');
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to add bank account');
      }

      const newAccount = await res.json();
      setBankAccounts(prev => [...prev, newAccount]);
      toast.success('Bank account added successfully!');
    } catch (error) {
      toast.error(`Failed to add bank account: ${error.message}`);
    }
  };

  const handleEditBankAccount = async (id, bankData) => {
    try {
      console.log('handleEditBankAccount called with id:', id, 'and data:', bankData);
      const companyId = resolveCompanyId();
      if (!companyId) {
        toast.error('Company ID not found.');
        return;
      }
      const token = getItemFromSessionStorage('token', null);
      if (!token) {
        toast.error('You are not signed in. Please sign in and try again.');
        return;
      }

      // Find the account by id or accountNumber
      const account = bankAccounts.find(acc => 
        acc.id === id || acc.accountNumber === id
      );
      
      if (!account || !account.accountNumber) {
        toast.error('Account not found for update.');
        return;
      }

      const res = await fetch(`${publicRuntimeConfig.apiURL}/bank-accounts/${companyId}/update/${account.accountNumber}?companyId=${companyId}`, {
        method: 'PUT',
        headers: buildAuthHeaders(token),
        body: JSON.stringify(bankData),
      });

      if (res.status === 401) {
        toast.error('Authentication required. Please sign in again.');
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to update bank account');
      }

      const updatedAccount = await res.json();
      console.log('Update response:', updatedAccount);
      
      // Update the bank accounts list with the new data
      setBankAccounts(prev => prev.map(acc => 
        (acc.id === id || acc.accountNumber === id) ? { ...acc, ...bankData } : acc
      ));
      
      toast.success('Bank account updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      toast.error(`Failed to update bank account: ${error.message}`);
    }
  };

  const handleDeleteBankAccount = async (id) => {
    try {
      console.log('handleDeleteBankAccount called with id:', id);
      
      const companyId = resolveCompanyId();
      if (!companyId) {
        toast.error('Company ID not found.');
        return;
      }
      const token = getItemFromSessionStorage('token', null);
      if (!token) {
        toast.error('You are not signed in. Please sign in again.');
        return;
      }

      // Find the account by id or accountNumber
      const account = bankAccounts.find(acc => 
        acc.id === id || acc.accountNumber === id
      );
      
      console.log('Found account for deletion:', account);
      
      if (!account || !account.accountNumber) {
        toast.error('Account not found for deletion.');
        return;
      }

      console.log('Deleting account with accountNumber:', account.accountNumber);
      
      const res = await fetch(`${publicRuntimeConfig.apiURL}/bank-accounts/${companyId}/delete/${account.accountNumber}?companyId=${companyId}`, {
        method: 'DELETE',
        headers: buildAuthHeaders(token),
      });

      if (res.status === 401) {
        toast.error('Authentication required. Please sign in again.');
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to delete bank account');
      }

      setBankAccounts(prev => prev.filter(acc => 
        acc.id !== id && acc.accountNumber !== id
      ));
      toast.success('Bank account deleted successfully!');
    } catch (error) {
      toast.error(`Failed to delete bank account: ${error.message}`);
    }
  };

  const handleDeleteAllBankAccounts = async () => {
    try {
      const companyId = resolveCompanyId();
      if (!companyId) {
        toast.error('Company ID not found.');
        return;
      }
      const token = getItemFromSessionStorage('token', null);
      if (!token) {
        toast.error('You are not signed in. Please sign in and try again.');
        return;
      }

      const res = await fetch(`${publicRuntimeConfig.apiURL}/bank-accounts/${companyId}?companyId=${companyId}`, {
        method: 'DELETE',
        headers: buildAuthHeaders(token),
      });

      if (res.status === 401) {
        toast.error('Authentication required. Please sign in again.');
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to delete all bank accounts');
      }

      setBankAccounts([]);
      toast.success('All bank accounts deleted successfully!');
    } catch (error) {
      toast.error(`Failed to delete all bank accounts: ${error.message}`);
    }
  };

  const handleAddVendorTag = async (newTag) => {
    try {
      const companyId = resolveCompanyId();
      if (!companyId) {
        toast.error('Company ID not found.');
        return;
      }
      const token = getItemFromSessionStorage('token', null);
      if (!token) {
        toast.error('You are not signed in. Please sign in again.');
        return;
      }

      const payload = {
        companyId,
        tag: newTag
      };

      const res = await fetch(`${publicRuntimeConfig.apiURL}/api/settings/account/company/${companyId}?companyId=${companyId}`, {
        method: 'POST',
        headers: buildAuthHeaders(token),
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        toast.error('Authentication required. Please sign in again.');
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to add vendor tag');
      }

      // Add to local state after successful API call
      setVendorTags(prev => [...prev, newTag]);
      toast.success('Vendor tag added successfully!');
    } catch (error) {
      toast.error(`Failed to add vendor tag: ${error.message || 'Unknown error'}`);
    }
  };

  const handleRemoveVendorTag = async (tagToRemove) => {
    try {
      const companyId = resolveCompanyId();
      if (!companyId) {
        toast.error('Company ID not found.');
        return;
      }
      const token = getItemFromSessionStorage('token', null);
      if (!token) {
        toast.error('You are not signed in. Please sign in again.');
        return;
      }

      const payload = {
        companyId,
        tag: tagToRemove
      };

      const res = await fetch(`${publicRuntimeConfig.apiURL}/api/settings/account/company/${companyId}?companyId=${companyId}`, {
        method: 'DELETE',
        headers: buildAuthHeaders(token),
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        toast.error('Authentication required. Please sign in again.');
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to remove vendor tag');
      }

      // Remove from local state after successful API call
      setVendorTags(prev => prev.filter(tag => tag !== tagToRemove));
      toast.success('Vendor tag removed successfully!');
    } catch (error) {
      toast.error(`Failed to remove vendor tag: ${error.message || 'Unknown error'}`);
    }
  };

  // Robust companyId resolver (handles encrypted, plain, and nested data)
  const resolveCompanyId = () => {
    try {
      let cid = sessionStorage.getItem('employeeCompanyId')
        || sessionStorage.getItem('companyId')
        || sessionStorage.getItem('company');
      if (cid) return cid;
      // Fallback: read raw sessionStorage
      if (typeof window !== 'undefined') {
        cid = sessionStorage.getItem('employeeCompanyId')
          || sessionStorage.getItem('companyId')
          || sessionStorage.getItem('company');
        if (cid) return cid;
        // Try to parse bis_data if present
        const bisRaw = sessionStorage.getItem('bis_data');
        if (bisRaw) {
          try {
            const bis = JSON.parse(bisRaw);
            if (bis?.companyId) return bis.companyId;
            if (bis?.employeeCompanyId) return bis.employeeCompanyId;
          } catch {}
        }
      }
      return null;
    } catch {
      return null;
    }
  };



  // Fetch existing settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const companyId = resolveCompanyId();
        if (!companyId) return;
        const token = getItemFromSessionStorage('token', null);
        setIsLoading(true);
        
        // Fetch document settings
        const settingsRes = await fetch(`${publicRuntimeConfig.apiURL}/api/settings/account/company/${companyId}?companyId=${companyId}`, {
          headers: buildAuthHeaders(token),
        });
        if (settingsRes.status === 401) {
          toast.error('Authentication required. Please sign in again.');
          setHasExistingSettings(false);
          setIsLoading(false);
          return;
        }
        if (settingsRes.status === 404) {
          setHasExistingSettings(false);
        } else if (settingsRes.ok) {
          const data = await settingsRes.json();
          setHasExistingSettings(true);
          setDocumentSettings(prev => ({
            ...prev,
            invoicePrefix: data.invoicePrefix ?? prev.invoicePrefix,
            invoiceStartNumber: data.invoiceStartingNumber ?? data.invoiceStartNumber ?? prev.invoiceStartNumber,
            invoiceCurrentNumber: data.invoiceCurrentNumber ?? prev.invoiceCurrentNumber,
            poPrefix: data.purchaseOrderPrefix ?? data.poPrefix ?? prev.poPrefix,
            poStartNumber: data.purchaseOrderStartingNumber ?? data.purchaseOrderStartNumber ?? data.poStartNumber ?? prev.poStartNumber,
            poCurrentNumber: data.purchaseOrderCurrentNumber ?? prev.poCurrentNumber,
            receiptPrefix: data.receiptPrefix ?? prev.receiptPrefix,
            receiptStartNumber: data.receiptStartingNumber ?? data.receiptStartNumber ?? prev.receiptStartNumber,
            receiptCurrentNumber: data.receiptCurrentNumber ?? prev.receiptCurrentNumber,
          }));
        }
        
        // Fetch bank accounts using the correct endpoint
        const bankRes = await fetch(`${publicRuntimeConfig.apiURL}/bank-accounts/${companyId}?companyId=${companyId}`, {
          headers: buildAuthHeaders(token),
        });
        if (bankRes.ok) {
          const bankData = await bankRes.json();
          if (bankData.bankAccounts && Array.isArray(bankData.bankAccounts)) {
            setBankAccounts(bankData.bankAccounts);
          }
        }

        // Fetch vendor tags
        try {
          const tagsRes = await fetch(`${publicRuntimeConfig.apiURL}/api/settings/account/company/${companyId}?companyId=${companyId}`, {
            headers: buildAuthHeaders(token),
          });
          if (tagsRes.ok) {
            const tagsData = await tagsRes.json();
            if (tagsData.vendorTags && Array.isArray(tagsData.vendorTags)) {
              setVendorTags(tagsData.vendorTags);
            }
          }
        } catch (error) {
          console.log('Vendor tags endpoint not available yet, using default tags');
          // Set some default tags if the endpoint is not available
          setVendorTags(['Critical Supplier', 'Local Vendor', 'Service Provider', 'Raw Material Supplier']);
        }
        
        setIsLoading(false);
      } catch (e) {
        console.error('Error fetching settings:', e);
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveChanges = async () => {
    try {
      const companyId = resolveCompanyId();
      if (!companyId) {
        toast.error('Company ID not found.');
        return;
      }
      const token = getItemFromSessionStorage('token', null);
      if (!token) {
        toast.error('You are not signed in. Please sign in and try again.');
        return;
      }
      setIsSaving(true);
      const invoiceStartingNumber = Number(documentSettings.invoiceStartNumber) || 1;
      const poStartingNumber = Number(documentSettings.poStartNumber) || 1;
      const receiptStartingNumber = Number(documentSettings.receiptStartNumber) || 1;

      const payload = {
        companyId,
        invoicePrefix: documentSettings.invoicePrefix,
        invoiceStartingNumber,
        invoiceCurrentNumber: hasExistingSettings
          ? Number(documentSettings.invoiceCurrentNumber ?? invoiceStartingNumber)
          : invoiceStartingNumber,
        purchaseOrderPrefix: documentSettings.poPrefix,
        purchaseOrderStartingNumber: poStartingNumber,
        purchaseOrderCurrentNumber: hasExistingSettings
          ? Number(documentSettings.poCurrentNumber ?? poStartingNumber)
          : poStartingNumber,
        receiptPrefix: documentSettings.receiptPrefix,
        receiptStartingNumber,
        receiptCurrentNumber: hasExistingSettings
          ? Number(documentSettings.receiptCurrentNumber ?? receiptStartingNumber)
          : receiptStartingNumber,
      };
      const method = hasExistingSettings ? 'PUT' : 'POST';
      const res = await fetch(`${publicRuntimeConfig.apiURL}/api/settings/account/company/${companyId}?companyId=${companyId}`, {
        method,
        headers: buildAuthHeaders(token),
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        toast.error('Authentication required. Please sign in again.');
        return;
      }
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to save settings');
      }
      setHasExistingSettings(true);
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error(`Failed to save settings: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const settingsTabs = [
    { id: 'documents', label: 'Document Settings', icon: FaFileInvoice },
    { id: 'vendor-tags', label: 'Vendor Tags', icon: FaTags },
    { id: 'bank', label: 'Bank Details', icon: FaUniversity },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <div className="px-4 py-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Title and Tab Navigation */}
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="px-4 py-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Account Settings</h1>
                <div className="flex space-x-8">
                  {settingsTabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-3 py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 bg-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-4">
              {activeTab === 'documents' && (
                <DocumentSettings 
                  settings={documentSettings} 
                  onSettingsChange={handleDocumentSettingsChange}
                  onSaveChanges={handleSaveChanges}
                  isSaving={isSaving}
                />
              )}
              {activeTab === 'vendor-tags' && (
                <VendorTagsSettings 
                  vendorTags={vendorTags}
                  onAddTag={handleAddVendorTag}
                  onRemoveTag={handleRemoveVendorTag}
                />
              )}
              {activeTab === 'bank' && (
                <CompanyBankDetails 
                  bankAccounts={bankAccounts}
                  onAddBankAccount={handleAddBankAccount}
                  onEditBankAccount={handleEditBankAccount}
                  onDeleteBankAccount={handleDeleteBankAccount}
                  onDeleteAllBankAccounts={handleDeleteAllBankAccounts}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AccountSettingsPage; 