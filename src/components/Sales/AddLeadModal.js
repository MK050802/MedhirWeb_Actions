import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import { FaRupeeSign } from 'react-icons/fa';

const propertyTypes = [
  '2BHK Flat',
  '3BHK Flat',
  '4BHK Flat',
  '2BHK Villa',
  '3BHK Villa',
  '4BHK Villa'
];

const sources = [
  'Website',
  'Facebook',
  'Instagram',
  'Google Ads',
  'Referral',
  'Walk-in',
  'Phone Call',
  'Email',
  'Other'
];

const priorityOptions = [
  { value: 'Low', label: 'Low', stars: 1, color: 'text-gray-400' },
  { value: 'Medium', label: 'Medium', stars: 2, color: 'text-orange-400' },
  { value: 'High', label: 'High', stars: 3, color: 'text-yellow-400' },
];

const AddLeadModal = ({ isOpen, onClose, onSubmit, initialData, isManagerView = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    alternateContactNumber: '',
    email: '',
    propertyType: '',
    address: '',
    area: '',
    budget: '',
    // designStyle: '',
    leadSource: '',
    referralName: '',
    notes: '',
    // priority: 'Low',
    rating: 0,
    salesRep: null,
    designer: null,
    callDescription: null,
    callHistory: [],
    nextCall: null,
    quotedAmount: null,
    finalQuotation: null,
    signupAmount: null,
    paymentDate: null,
    paymentMode: null,
    panNumber: null,
    discount: null,
    reasonForLost: null,
    reasonForJunk: null,
    submittedBy: null,
    paymentDetailsFileName: null,
    bookingFormFileName: null,
    dateOfCreation: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData, area: initialData.area || '', referralName: initialData.referralName || '', /* priority: initialData.priority || 'Low', */ dateOfCreation: initialData.dateOfCreation || new Date().toISOString().split('T')[0] });
    }
  }, [initialData]);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        contactNumber: '',
        alternateContactNumber: '',
        email: '',
        propertyType: '',
        address: '',
        area: '',
        budget: '',
        // designStyle: '',
        leadSource: '',
        referralName: '',
        notes: '',
        // priority: 'Low',
        rating: 0,
        salesRep: null,
        designer: null,
        callDescription: null,
        callHistory: [],
        nextCall: null,
        quotedAmount: null,
        finalQuotation: null,
        signupAmount: null,
        paymentDate: null,
        paymentMode: null,
        panNumber: null,
        discount: null,
        reasonForLost: null,
        reasonForJunk: null,
        submittedBy: null,
        paymentDetailsFileName: null,
        bookingFormFileName: null,
        dateOfCreation: new Date().toISOString().split('T')[0],
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Name must be less than 50 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name.trim())) {
      newErrors.name = 'Name can only contain letters and spaces';
    }

    // Contact number validation
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^\d{10}$/.test(formData.contactNumber.replace(/\D/g, ''))) {
      newErrors.contactNumber = 'Contact number must be exactly 10 digits';
    } else if (formData.contactNumber.replace(/\D/g, '').startsWith('0')) {
      newErrors.contactNumber = 'Contact number cannot start with 0';
    }

    // Lead source validation
    if (!formData.leadSource) {
      newErrors.leadSource = 'Lead source is required';
    }

    // Email validation - required if lead source is Email
    if (formData.leadSource === 'Email') {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required when lead source is Email';
      } else {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(formData.email.trim())) {
          newErrors.email = 'Please enter a valid email address';
        } else if (formData.email.trim().length > 100) {
          newErrors.email = 'Email must be less than 100 characters';
        }
      }
    } else if (formData.email.trim()) {
      // Optional email validation when provided
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      } else if (formData.email.trim().length > 100) {
        newErrors.email = 'Email must be less than 100 characters';
      }
    }

    // Project type validation
    if (!formData.propertyType) {
      newErrors.propertyType = 'Project type is required';
    }

    // Referral name validation - required if lead source is Referral
    if (formData.leadSource === 'Referral') {
      if (!formData.referralName.trim()) {
        newErrors.referralName = 'Referral name is required when lead source is Referral';
      } else if (formData.referralName.trim().length < 2) {
        newErrors.referralName = 'Referral name must be at least 2 characters';
      } else if (formData.referralName.trim().length > 50) {
        newErrors.referralName = 'Referral name must be less than 50 characters';
      } else if (!/^[a-zA-Z\s]+$/.test(formData.referralName.trim())) {
        newErrors.referralName = 'Referral name can only contain letters and spaces';
      }
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Project address is required';
    } else if (formData.address.trim().length < 10) {
      newErrors.address = 'Address must be at least 10 characters';
    } else if (formData.address.trim().length > 200) {
      newErrors.address = 'Address must be less than 200 characters';
    }

    // Area validation
    if (formData.area.trim()) {
      if (formData.area.trim().length < 2) {
        newErrors.area = 'Area must be at least 2 characters';
      } else if (formData.area.trim().length > 50) {
        newErrors.area = 'Area must be less than 50 characters';
      }
    }

    // Notes validation
    if (formData.notes.trim()) {
      if (formData.notes.trim().length > 500) {
        newErrors.notes = 'Notes must be less than 500 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error adding lead:', error);
    }
  };

  const handleInputChange = (field, value) => {
    let processedValue = value;

    // Apply input restrictions based on field type
    switch (field) {
      case 'name':
        // Only allow letters and spaces, max 50 characters
        processedValue = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 50);
        break;
      
      case 'contactNumber':
      case 'alternateContactNumber':
        // Only allow digits, max 10 characters
        processedValue = value.replace(/\D/g, '').slice(0, 10);
        break;
      
      case 'email':
        // Allow email characters, max 100 characters
        processedValue = value.slice(0, 100);
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
      
      case 'address':
        // Allow alphanumeric, spaces, and common address characters
        processedValue = value.replace(/[^a-zA-Z0-9\s,.-]/g, '').slice(0, 200);
        break;
      
      case 'area':
        // Allow letters, spaces, and numbers
        processedValue = value.replace(/[^a-zA-Z0-9\s]/g, '').slice(0, 50);
        break;
      
      case 'notes':
        // Allow all characters but limit length
        processedValue = value.slice(0, 500);
        break;

      case 'referralName':
        processedValue = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 50);
        break;
      
      default:
        processedValue = value;
    }

    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));

    // If lead source changes away from Referral, clear referralName
    if (field === 'leadSource' && value !== 'Referral') {
      setFormData(prev => ({ ...prev, referralName: '' }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 w-full max-w-lg max-h-[70vh] h-auto flex flex-col border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b bg-white rounded-t-2xl">
            <Dialog.Title className="text-base font-semibold text-gray-900">
              {initialData?.leadId ? 'Edit Lead' : 'Add New Lead'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600 transition-colors duration-150">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Scrollable form content with extra bottom padding */}
          <div className="p-5 space-y-4 flex-1 overflow-y-auto bg-gray-50">
            {/* Name Field */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Client Name <span className="text-blue-500 font-bold">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`border-gray-300 text-xs rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-150 ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div className='grid grid-cols-2 gap-2'>
            {/* Contact Number Field */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Contact Number <span className="text-blue-500 font-bold">*</span>
              </label>
              <Input
                type="tel"
                placeholder="Enter contact number"
                value={formData.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                className={`border-gray-300 text-xs rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-150 ${errors.contactNumber ? 'border-red-500' : ''}`}
              />
              {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
            </div>
            {/* Budget Field */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Budget
              </label>
              <Input
                type="number"
                placeholder="Enter budget"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value)}
                className={`border-gray-300 text-xs rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-150 ${errors.budget ? 'border-red-500' : ''}`}
              />
              {errors.budget && <p className="text-red-500 text-xs mt-1">{errors.budget}</p>}
            </div>

            </div>

            {/* Project Type and Lead Source */}
            <div className='grid grid-cols-2 gap-2'>
              <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Project Type <span className="text-blue-500 font-bold">*</span>
              </label>
              <Select
                value={formData.propertyType}
                onValueChange={value => handleInputChange('propertyType', value)}
              >
                <SelectTrigger className={`border-gray-300 text-xs rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-150 ${errors.propertyType ? 'border-red-500' : ''} hover:border-blue-400` }>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent className="rounded-lg shadow-lg">
                  {propertyTypes.map(type => (
                    <SelectItem key={type} value={type} className="text-xs hover:bg-blue-50 focus:bg-blue-100 rounded-md">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.propertyType && <p className="text-red-500 text-xs mt-1">{errors.propertyType}</p>}
              </div>
              <div> <label className="block text-xs font-medium text-gray-700 mb-1">
                  Lead Source <span className="text-blue-500 font-bold">*</span>
                </label>
                <Select
                  value={formData.leadSource}
                  onValueChange={value => handleInputChange('leadSource', value)}
                >
                  <SelectTrigger className={`border-gray-300 text-xs rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-150 ${errors.leadSource ? 'border-red-500' : ''} hover:border-blue-400`}>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg shadow-lg">
                    {sources.map(source => (
                      <SelectItem key={source} value={source} className="text-xs hover:bg-blue-50 focus:bg-blue-100 rounded-md">
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.leadSource && <p className="text-red-500 text-xs mt-1">{errors.leadSource}</p>}</div>
               
            </div>

            {/* Conditional Referral Name Field */}
            {formData.leadSource === 'Referral' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Referral Name <span className="text-blue-500 font-bold">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Enter referrer's name"
                  value={formData.referralName}
                  onChange={(e) => handleInputChange('referralName', e.target.value)}
                  className={`border-gray-300 text-xs rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-150 ${errors.referralName ? 'border-red-500' : ''}`}
                />
                {errors.referralName && <p className="text-red-500 text-xs mt-1">{errors.referralName}</p>}
              </div>
            )}

            {/* Project Address Field */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Project Address <span className="text-blue-500 font-bold">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter project address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className={`border-gray-300 text-xs rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-150 ${errors.address ? 'border-red-500' : ''}`}
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>

            {/* Email Field (conditionally required) */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email {formData.leadSource === 'Email' && (<span className="text-blue-500 font-bold">*</span>)}
              </label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`border-gray-300 text-xs rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-150 ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

              {/* Area Field (optional) */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Area (sq. ft.) <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Enter area in sq. ft."
                  value={formData.area}
                  onChange={(e) => handleInputChange('area', e.target.value)}
                  className="border-gray-300 text-xs rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-150"
                />
              </div>
              {/* Date of Creation Row */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date of Creation
              </label>
                <Input
                type="date"
                value={formData.dateOfCreation}
                onChange={e => handleInputChange('dateOfCreation', e.target.value)}
              className="border-gray-300 text-xs rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-150"
                />
            </div>
            </div>

            {/* Notes Field */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Notes
              </label>
              <Input
                as="textarea"
                placeholder="Enter any additional notes or requirements"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={2}
                className="border-gray-300 text-xs rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-150 min-h-[36px]"
              />
            </div>
          </div>

          {/* Sticky footer for action buttons, outside scrollable area */}
          <div className="bg-white border-t shadow-lg flex items-center justify-end gap-2 p-4 z-10 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                handleSubmit();
              }}
              className="px-3 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs transition-all duration-150"
            >
              {initialData?.leadId ? 'Update Lead' : 'Add Lead'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default AddLeadModal;