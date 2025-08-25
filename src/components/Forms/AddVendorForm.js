import { useState, useEffect, useRef } from 'react';
import { FaSave, FaTimes, FaPlus, FaTrash, FaChevronDown, FaChevronRight, FaBuilding, FaUser, FaMapMarkerAlt, FaPhone, FaEnvelope, FaGlobe, FaCreditCard, FaFileAlt, FaEye } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { addVendor, updateVendor } from '../../redux/slices/vendorSlice';
import { toast } from 'sonner';
import VendorPreview from '../Previews/VendorPreview';
import FileUploadWithPreview from '../ui/FileUploadWithPreview';
import { fetchVendorTags } from '../../redux/slices/VendorTagSlice';
const steps = [
  { label: 'Basic Details' },
  { label: 'Contact & Address' },
  { label: 'Compliance & Banking' },
  { label: 'documents'},
];

const AddVendorForm = ({ vendor, onSubmit, onCancel }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.vendors);
  const { tags: vendorTags, loading: vendorTagsLoading } = useSelector(state => state.vendorTags);
  const [step, setStep] = useState(1);
  const formRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const sentinelRef = useRef(null);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  const tagsDropdownRef = useRef(null);
  // State for vendor preview
  const [showVendorPreview, setShowVendorPreview] = useState(false);
  
  // State for file uploads - updated to match other forms
  const [uploadedFiles, setUploadedFiles] = useState({
    gstDocument: null,
    bankPassbook: null
  });

  // Determine if we're in edit mode
  const isEditMode = !!vendor;

  const [tdsApplied, setTdsApplied] = useState(false);
  const [tdsRate, setTdsRate] = useState(2);
  const TDS_RATES = [1, 2, 5, 10];

  const [formData, setFormData] = useState({
    // Basic Information
    vendorName: '',
    companyId: sessionStorage.getItem("employeeCompanyId"),
    companyType: 'Company', // Company or Individual
    vendorCategory: '',
    gstin: '',
    tdsPercentage: '',
    pan: '',
    taxTreatment: '',
    vendorTags: [],
    // Contact Information
    contactName: '',
    email: '',
    mobile: '', // Main phone number
    phone: '', // Alternate phone number
    
    // Address Information
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pinCode: '',
    
    // Banking Details (nested structure)
    bankDetails: {
      accountHolderName: '',
      branchName: '',
      bankName: '',
      accountType: '',
      accountNumber: '',
      ifscCode: '',
      upiId: ''
    },
    
    // Documents - Updated to match backend expectations
    gstDocument: null,
    bankPassbook: null
  });

  // Pre-fill form data when vendor prop is provided (edit mode)
  useEffect(() => {
    if (vendor) {
      setFormData({
        vendorName: vendor.vendorName || '',
        companyId: vendor.companyId || sessionStorage.getItem("employeeCompanyId"),
        companyType: vendor.companyType || 'Company',
        vendorCategory: vendor.vendorCategory || '',
        gstin: vendor.gstin || '',
        tdsPercentage: vendor.tdsPercentage || '',
        pan: vendor.pan || '',
        taxTreatment: vendor.taxTreatment || '',
        vendorTags: vendor.vendorTags || [],
        contactName: vendor.contactName || '',
        email: vendor.email || '',
        mobile: vendor.mobile || '',
        phone: vendor.phone || '',
        addressLine1: vendor.addressLine1 || '',
        addressLine2: vendor.addressLine2 || '',
        city: vendor.city || '',
        state: vendor.state || '',
        pinCode: vendor.pinCode || '',
        bankDetails: {
          accountHolderName: vendor.bankDetails?.accountHolderName || '',
          branchName: vendor.bankDetails?.branchName || '',
          bankName: vendor.bankDetails?.bankName || '',
          accountType: vendor.bankDetails?.accountType || '',
          accountNumber: vendor.bankDetails?.accountNumber || '',
          ifscCode: vendor.bankDetails?.ifscCode || '',
          upiId: vendor.bankDetails?.upiId || ''
        },
        gstDocument: null, // Will be handled separately for file uploads
        bankPassbook: null // Will be handled separately for file uploads
      });
      
      // Reset file uploads in edit mode
      setUploadedFiles({
        gstDocument: null,
        bankPassbook: null
      });
    }
  }, [vendor]);
  useEffect(() => {
  if (isEditMode && formData.bankDetails.accountNumber) {
    setConfirmAccountNumber(formData.bankDetails.accountNumber);
  }
}, [isEditMode, formData.bankDetails.accountNumber]);

  const [errors, setErrors] = useState({});
  const [collapsedSections, setCollapsedSections] = useState({
    contactAddresses: true,
    banking: true,
    salesPurchase: true,
    accounting: true,
    notes: true
  });

  // Separate state for confirm account number (not part of formData)
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');

  // Static data - in real app, these would come from APIs
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Puducherry', 'Chandigarh', 'Dadra and Nagar Haveli', 'Daman and Diu',
    'Lakshadweep', 'Andaman and Nicobar Islands', 'Jammu and Kashmir', 'Ladakh'
  ];

  const paymentTermsOptions = [
    '15 Days', '30 Days', '45 Days', '60 Days', '90 Days', 'Immediate', 'Net 10', 'Net 15', 'Net 30'
  ];

  const priceListOptions = [
    'Standard Price List', 'Wholesale Price List', 'Retail Price List', 'Special Rate'
  ];

  const fiscalPositionOptions = [
    'Domestic', 'Export', 'Import', 'SEZ', 'Interstate', 'Intrastate'
  ];

  const productsServicesOptions = [
    'Office Supplies', 'Computer Equipment', 'Software Services', 'Consulting Services',
    'Transportation Services', 'Maintenance Services', 'Raw Materials', 'Finished Goods'
  ];

  const accountOptions = [
    'Account Payable - Domestic', 'Account Payable - Import', 'Account Receivable - Domestic',
    'Account Receivable - Export', 'Sundry Creditors', 'Sundry Debtors'
  ];

  const contactTypes = ['Billing', 'Shipping', 'Finance', 'Technical', 'Sales', 'Support'];

  // Real-time validation functions
  const validateField = (name, value) => {
    // Validation for alphabetic-only fields
    const validateAlphabeticField = (value, fieldName) => {
      if (!value.trim()) {
        return `${fieldName} is required`;
      }
      const alphabeticRegex = /^[A-Za-z\s\-'\.]+$/;
      if (!alphabeticRegex.test(value)) {
        return `${fieldName} should only contain letters, spaces, hyphens, apostrophes, and periods`;
      }
      return null;
    };

    const validateGSTIN = (gstin) => {
      if (!gstin.trim()) return 'GSTIN is required for Registered vendors';
      const gstinRegex = /^[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
      if (!gstinRegex.test(gstin.toUpperCase())) {
        return 'Invalid GSTIN format (e.g., 27AAECS1234F1Z2)';
      }
      return null;
    };

    const validatePAN = (pan) => {
  if (!pan.trim()) return 'PAN is required';

  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  
  if (!panRegex.test(pan.toUpperCase())) {
    return 'Invalid PAN format (e.g., ABCDE1234F)';
  }

  return null;
};
    const validateIFSC = (ifsc) => {
      if (!ifsc.trim()) return 'IFSC code is required';
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(ifsc.toUpperCase())) {
        return 'Invalid IFSC code format (e.g., SBIN0008754)';
      }
      return null;
    };

    const validateAccountNumber = (accountNumber) => {
      if (!accountNumber.trim()) return 'Account number is required';
      const accountRegex = /^[0-9]{9,18}$/;
      if (!accountRegex.test(accountNumber)) {
        return 'Invalid account number format (9-18 digits only)';
      }
      return null;
    };

    const validateUPI = (upi) => {
      if (!upi.trim()) return 'UPI ID is required';
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/;
      if (!upiRegex.test(upi)) {
        return 'Invalid UPI ID format (e.g., example@paytm)';
      }
      return null;
    };

    const validatePINCode = (pinCode) => {
      if (!pinCode.trim()) return 'PIN Code is required';
      const pinRegex = /^[1-9][0-9]{5}$/;
      if (!pinRegex.test(pinCode)) {
        return 'Invalid PIN Code format (6 digits, starting with 1-9)';
      }
      return null;
    };

    const validateEmail = (email) => {
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return 'Invalid email format';
      }
      return null;
    };

    const validatePhone = (phone, fieldName) => {
      if (phone && !/^\d{10}$/.test(phone)) {
        return `${fieldName} must be exactly 10 digits`;
      }
      return null;
    };

    // Field-specific validation
    switch (name) {
      case 'vendorName':
        return validateAlphabeticField(value, 'Vendor name');
      
      case 'contactName':
        return validateAlphabeticField(value, 'Contact name');
      
      case 'bankDetails.accountHolderName':
        return validateAlphabeticField(value, 'Account holder name');
      
      case 'gstin':
        if (formData.taxTreatment === 'Registered') {
          return validateGSTIN(value);
        }
        return null;
      
      case 'pan':
        return validatePAN(value);
      
      case 'email':
        return validateEmail(value);
      
      case 'mobile':
        return validatePhone(value, 'Mobile number');
      
      case 'phone':
        return validatePhone(value, 'Phone number');
      
      case 'pinCode':
        return validatePINCode(value);
      
      case 'bankDetails.accountNumber':
        return validateAccountNumber(value);
      
      case 'bankDetails.ifscCode':
        return validateIFSC(value);
      
      case 'bankDetails.upiId':
        return validateUPI(value);
      
      case 'taxTreatment':
        if (!value.trim()) {
          return 'GST Treatment is required';
        }
        return null;
      
      case 'addressLine1':
        if (!value.trim()) {
          return 'Address Line 1 is required';
        }
        return null;
      
      case 'city':
        if (!value.trim()) {
          return 'City is required';
        }
        return null;
      
      case 'state':
        if (!value.trim()) {
          return 'State is required';
        }
        return null;
      
      case 'bankDetails.branchName':
        if (!value.trim()) {
          return 'Branch name is required';
        }
        return null;
      
      case 'bankDetails.bankName':
        if (!value.trim()) {
          return 'Bank name is required';
        }
        return null;
      
      case 'bankDetails.accountType':
        if (!value.trim()) {
          return 'Account type is required';
        }
        return null;
      
      case 'confirmAccountNumber':
        if (!value.trim()) {
          return 'Please confirm your account number';
        } else if (formData.bankDetails.accountNumber !== value) {
          return 'Account numbers do not match';
        }
        return null;
      
      default:
        return null;
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    // Validation for alphabetic-only fields
    const alphabeticFields = ['vendorName', 'contactName', 'bankDetails.accountHolderName'];
    const fieldName = name.startsWith('bankDetails.') ? name.split('.')[1] : name;
    
    if (alphabeticFields.includes(name) || (name.startsWith('bankDetails.') && alphabeticFields.includes(`bankDetails.${fieldName}`))) {
      // Only allow alphabetic characters, spaces, and common punctuation
      const alphabeticRegex = /^[A-Za-z\s\-'\.]+$/;
      if (value && !alphabeticRegex.test(value)) {
        // Don't update the value if it contains non-alphabetic characters
        return;
      }
    }
    
    // Handle nested bankDetails fields
    if (name.startsWith('bankDetails.')) {
      const fieldName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [fieldName]: newValue
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: newValue
      }));
    }

    // Real-time validation
    const error = validateField(name, newValue);
    setErrors(prev => ({
      ...prev,
      [name]: error || ''
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    // Validate on blur for fields that might be empty
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error || ''
    }));
  };

  // Separate handler for confirm account number
  const handleConfirmAccountNumberChange = (e) => {
    const value = e.target.value;
    setConfirmAccountNumber(value);
    
    // Real-time validation
    const error = validateField('confirmAccountNumber', value);
    setErrors(prev => ({
      ...prev,
      confirmAccountNumber: error || ''
    }));
  };

  const handleMultiSelect = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: prev[name].includes(value) 
        ? prev[name].filter(item => item !== value)
        : [...prev[name], value]
    }));
  };

  const handleContactChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      contactAddresses: prev.contactAddresses.map((contact, i) => 
        i === index ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const addContact = () => {
    setFormData(prev => ({
      ...prev,
      contactAddresses: [...prev.contactAddresses, {
        id: Date.now(),
        name: '',
        phone: '',
        email: '',
        type: 'Billing'
      }]
    }));
  };

  const removeContact = (index) => {
    setFormData(prev => ({
      ...prev,
      contactAddresses: prev.contactAddresses.filter((_, i) => i !== index)
    }));
  };

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Custom validation functions
    const validateGSTIN = (gstin) => {
      if (!gstin.trim()) return 'GSTIN is required for Registered vendors';
      const gstinRegex = /^[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
      if (!gstinRegex.test(gstin.toUpperCase())) {
        return 'Invalid GSTIN format (e.g., 27AAECS1234F1Z2)';
      }
      return null;
    };

    const validatePAN = (pan) => {
      if (!pan.trim()) return 'PAN is required';
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(pan.toUpperCase())) {
        return 'Invalid PAN format (e.g., ABCDE1234F)';
      }
      return null;
    };

    const validateIFSC = (ifsc) => {
      if (!ifsc.trim()) return 'IFSC code is required';
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(ifsc.toUpperCase())) {
        return 'Invalid IFSC code format (e.g., SBIN0008754)';
      }
      return null;
    };

    const validateAccountNumber = (accountNumber) => {
      if (!accountNumber.trim()) return 'Account number is required';
      const accountRegex = /^[0-9]{9,18}$/;
      if (!accountRegex.test(accountNumber)) {
        return 'Invalid account number format (9-18 digits only)';
      }
      return null;
    };

    const validateUPI = (upi) => {
      if (!upi.trim()) return 'UPI ID is required';
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/;
      if (!upiRegex.test(upi)) {
        return 'Invalid UPI ID format (e.g., example@paytm)';
      }
      return null;
    };

    const validatePINCode = (pinCode) => {
      if (!pinCode.trim()) return 'PIN Code is required';
      const pinRegex = /^[1-9][0-9]{5}$/;
      if (!pinRegex.test(pinCode)) {
        return 'Invalid PIN Code format (6 digits, starting with 1-9)';
      }
      return null;
    };

    const validateEmail = (email) => {
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return 'Invalid email format';
      }
      return null;
    };

    const validatePhone = (phone, fieldName) => {
      if (phone && !/^\d{10}$/.test(phone)) {
        return `${fieldName} must be exactly 10 digits`;
      }
      return null;
    };

    // Validation for alphabetic-only fields
    const validateAlphabeticField = (value, fieldName) => {
      if (!value.trim()) {
        return `${fieldName} is required`;
      }
      const alphabeticRegex = /^[A-Za-z\s\-'\.]+$/;
      if (!alphabeticRegex.test(value)) {
        return `${fieldName} should only contain letters, spaces, hyphens, apostrophes, and periods`;
      }
      return null;
    };

    // Basic Information validations
    const vendorNameError = validateAlphabeticField(formData.vendorName, 'Vendor name');
    if (vendorNameError) newErrors.vendorName = vendorNameError;

    if (!formData.taxTreatment.trim()) {
      newErrors.taxTreatment = 'GST Treatment is required';
    }

    // GSTIN validation only if taxTreatment is 'Registered'
    if (formData.taxTreatment === 'Registered') {
      const gstinError = validateGSTIN(formData.gstin);
      if (gstinError) newErrors.gstin = gstinError;
    }

    // PAN validation
    const panError = validatePAN(formData.pan);
    if (panError) newErrors.pan = panError;

    // Contact Information validations
    const contactNameError = validateAlphabeticField(formData.contactName, 'Contact name');
    if (contactNameError) newErrors.contactName = contactNameError;

    // Email validation
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    // Phone validations
    const mobileError = validatePhone(formData.mobile, 'Mobile number');
    if (mobileError) newErrors.mobile = mobileError;

    const phoneError = validatePhone(formData.phone, 'Phone number');
    if (phoneError) newErrors.phone = phoneError;

    // Address validations
    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address Line 1 is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    // PIN Code validation
    const pinError = validatePINCode(formData.pinCode);
    if (pinError) newErrors.pinCode = pinError;

    // Banking details validation
    const accountHolderNameError = validateAlphabeticField(formData.bankDetails.accountHolderName, 'Account holder name');
    if (accountHolderNameError) newErrors['bankDetails.accountHolderName'] = accountHolderNameError;

    if (!formData.bankDetails.branchName.trim()) {
      newErrors['bankDetails.branchName'] = 'Branch name is required';
    }

    if (!formData.bankDetails.bankName.trim()) {
      newErrors['bankDetails.bankName'] = 'Bank name is required';
    }

    if (!formData.bankDetails.accountType.trim()) {
      newErrors['bankDetails.accountType'] = 'Account type is required';
    }

    // Account Number validation
    const accountError = validateAccountNumber(formData.bankDetails.accountNumber);
    if (accountError) newErrors['bankDetails.accountNumber'] = accountError;

    // IFSC Code validation
    const ifscError = validateIFSC(formData.bankDetails.ifscCode);
    if (ifscError) newErrors['bankDetails.ifscCode'] = ifscError;

    // UPI ID validation
    const upiError = validateUPI(formData.bankDetails.upiId);
    if (upiError) newErrors['bankDetails.upiId'] = upiError;

    // Confirm Account Number validation
    if (!confirmAccountNumber.trim()) {
      newErrors.confirmAccountNumber = 'Please confirm your account number';
    } else if (formData.bankDetails.accountNumber !== confirmAccountNumber) {
      newErrors.confirmAccountNumber = 'Account numbers do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Document handling functions - Updated to use FileUploadWithPreview pattern
  const handleFileUpload = (file, documentType) => {
    if (!file) return;

    setUploadedFiles(prev => ({
      ...prev,
      [documentType]: file
    }));

    console.log(
      `${documentType} uploaded successfully:`,
      file.name,
      `(${(file.size / 1024 / 1024).toFixed(2)}MB)`
    );
  };

  const handleRemoveFile = (documentType) => {
    setUploadedFiles(prev => ({
      ...prev,
      [documentType]: null
    }));
    toast.success(`${documentType === 'gstDocument' ? 'GST Document' : 'Bank Passbook'} removed successfully`);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
  };

  const handleDrop = (e, documentType) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
    const files = e.dataTransfer.files;
    handleFileUpload(files[0], documentType); // FileUploadWithPreview handles multiple files
  };

  const handlePreview = () => {
    if (validateForm()) {
      const previewData = {
        ...formData,
        vendorId: vendor?.vendorId || `V${Date.now()}`,
        status: 'Active',
        createdAt: vendor?.createdAt || new Date().toISOString(),
        updatedAt: isEditMode ? new Date().toISOString() : undefined,
        tdsPercentage: formData.tdsPercentage ? parseFloat(formData.tdsPercentage) : null
      };
      setShowVendorPreview(true);
    } else {
      // Show specific validation errors instead of general message
      const errorMessages = Object.values(errors).filter(msg => msg);
      if (errorMessages.length > 0) {
        toast.error(`Please fix the following errors: ${errorMessages.slice(0, 3).join(', ')}${errorMessages.length > 3 ? ' and more...' : ''}`);
      } else {
        toast.error('Please fill all the required fields before previewing');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      const submitData = {
        ...formData,
        vendorId: vendor?.vendorId || `V${Date.now()}`,
        status: 'Active',
        createdAt: vendor?.createdAt || new Date().toISOString(),
        updatedAt: isEditMode ? new Date().toISOString() : undefined,
        tdsPercentage: formData.tdsPercentage ? parseFloat(formData.tdsPercentage) : null,
        gstDocument: uploadedFiles.gstDocument,
        bankPassbook: uploadedFiles.bankPassbook,
        vendorTag: formData.vendorTags, // <-- This line maps selected tags to backend field
      };

      // Remove vendorTags from submitData if backend does not expect it
      delete submitData.vendorTags;

      try {
        if (isEditMode) {
          const result = await dispatch(updateVendor(submitData)).unwrap();
          if (result) {
            toast.success('Vendor updated successfully!');
            if (onSubmit) onSubmit(submitData);
            onCancel();
          }
        } else {
          const result = await dispatch(addVendor(submitData)).unwrap();
          if (result) {
            toast.success('Vendor added successfully!');
            if (onSubmit) onSubmit(submitData);
            onCancel();
          }
        }
      } catch (err) {
        toast.error(err);
      }
    } else {
      const errorMessages = Object.values(errors).filter(msg => msg);
      if (errorMessages.length > 0) {
        toast.error(`Please fix the following errors: ${errorMessages.slice(0, 3).join(', ')}${errorMessages.length > 3 ? ' and more...' : ''}`);
      } else {
        toast.error('Please fill all the required fields');
      }
    }
  };

  const renderCollapsibleSection = (title, section, icon, children) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
      <button
        type="button"
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {collapsedSections[section] ? (
          <FaChevronRight className="w-5 h-5 text-gray-400" />
        ) : (
          <FaChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      
      {!collapsedSections[section] && (
        <div className="px-6 pb-6 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );

  // --- Step Content Renderers ---
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <div className="flex items-center mb-6">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaBuilding className="text-gray-400" /> Basic Details
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Vendor Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="vendorName"
                  value={formData.vendorName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.vendorName 
                      ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}

                  maxLength={100}
                />
                {errors.vendorName && <div className="text-red-500 text-sm mt-1 font-medium">{errors.vendorName}</div>}
              </div>
                            {/* Tax Treatment */}
                            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GST Treatment <span className="text-red-500">*</span></label>
                <select
                  name="taxTreatment"
                  value={formData.taxTreatment || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.taxTreatment 
                      ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="">Select tax treatment</option>
                  <option value="Registered">Registered</option>
                  <option value="Unregistered">Unregistered</option>
                  <option value="Composition">Composition</option>
                  <option value="Consumer">Consumer</option>
                </select>
                {errors.taxTreatment && <div className="text-red-500 text-sm mt-1 font-medium">{errors.taxTreatment}</div>}
              </div>
                            {/* Vendor Tags */}
                            <div className="relative" ref={tagsDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Tags</label>
                <button
                  type="button"
                  onClick={() => setShowTagsDropdown(prev => !prev)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <span className="truncate">
                    {formData.vendorTags.length > 0 ? formData.vendorTags.join(', ') : 'Select one or more tags'}
                  </span>
                  <FaChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {showTagsDropdown && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {vendorTagsLoading ? (
  <div className="px-4 py-2 text-gray-500">Loading tags...</div>
) : vendorTags.length === 0 ? (
  <div className="px-4 py-2 text-gray-400">No tags found</div>
) : (
  vendorTags.map(tagObj => (
    <label key={tagObj.tagId} className="flex items-center w-full px-4 py-2 hover:bg-gray-100 cursor-pointer">
      <input
        type="checkbox"
        className="form-checkbox h-4 w-4 text-blue-600 rounded"
        checked={formData.vendorTags.includes(tagObj.tagName)}
        onChange={() => handleMultiSelect('vendorTags', tagObj.tagName)}
      />
      <span className="ml-3 text-sm text-gray-700">{tagObj.tagName}</span>
    </label>
  ))
)}
                  </div>
                )}
              </div>
              {/* Vendor Type */}
              {/* <div className="flex flex-col justify-end">
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Type <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-6 h-full">
                  <label className="inline-flex items-center">
                    <input type="radio" name="companyType" value="Company" checked={formData.companyType === 'Company'} onChange={handleChange} className="form-radio text-blue-600" />
                    <span className="ml-2">Company</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="radio" name="companyType" value="Individual" checked={formData.companyType === 'Individual'} onChange={handleChange} className="form-radio text-blue-600" />
                    <span className="ml-2">Individual</span>
                  </label>
                </div>
              </div> */}
              {/* Vendor Category */}
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Category <span className="text-red-500">*</span></label>
                <select
                  name="vendorCategory"
                  value={formData.vendorCategory || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select vendor category</option>
                  <option value="Goods">Goods</option>
                  <option value="Services">Services</option>
                  <option value="Consultant">Consultant</option>
                  <option value="Contractor">Contractor</option>
                </select>
              </div> */}
                             {/* GSTIN */}
               <div>
                 <label className={`text-sm font-medium mb-2 flex items-center ${formData.taxTreatment !== 'Registered' ? 'text-gray-400' : 'text-gray-700'}`}>
                   GSTIN
                 </label>
                <input
  type="text"
  name="gstin"
  value={formData.gstin.toUpperCase()}  // Always display uppercase
  onChange={handleChange}
  onBlur={handleBlur}
  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
    errors.gstin 
      ? 'border-red-500 focus:ring-red-500 bg-red-50' 
      : 'border-gray-300 focus:ring-blue-500'
  }`}

  maxLength={15}
  disabled={formData.taxTreatment !== 'Registered'}
  style={{ backgroundColor: formData.taxTreatment !== 'Registered' ? '#f9fafb' : 'white' }}
/>

                 <div className="text-xs text-gray-400 mt-1">Format: 27AAECS1234F1Z2 (15 characters length)</div>
                 {errors.gstin && <div className="text-red-500 text-sm mt-1 font-medium">{errors.gstin}</div>}
               </div>
                             {/* PAN */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   PAN <span className="text-red-500">*</span>
                 </label>
                <input
  type="text"
  name="pan"
  value={formData.pan.toUpperCase()}
  onChange={handleChange}
  onBlur={handleBlur}
  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
    errors.pan 
      ? 'border-red-500 focus:ring-red-500 bg-red-50' 
      : 'border-gray-300 focus:ring-blue-500'
  }`}

  maxLength={10}
/>
                 <div className="text-xs text-gray-400 mt-1">Format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)</div>
                 {errors.pan && <div className="text-red-500 text-sm mt-1 font-medium">{errors.pan}</div>}
               </div>
              {/* TDS Selection */}
              <div className="flex items-center space-x-4 pt-4 border-t border-gray-100 mt-2">
              <label className="flex items-center">
              <input 
  type="checkbox"
  checked={tdsApplied}
  onChange={e => {
    const isChecked = e.target.checked;
    setTdsApplied(isChecked);

    setFormData(prev => ({
      ...prev,
      tdsPercentage: isChecked ? tdsRate.toString() : ''
    }));
  }}
  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
  disabled={formData.taxTreatment !== 'Registered'}
/>

                <span
  className={`ml-2 text-sm font-medium ${
    formData.taxTreatment !== 'Registered'
      ? 'text-gray-400'
      : 'text-gray-700'
  }`}
>
  TDS/TCS Applied
</span>
</label>

{formData.tdsPercentage && formData.taxTreatment === 'Registered' && (
  <div>
    <label className="sr-only">TDS Rate</label>
    <select
      value={formData.tdsPercentage}
      onChange={e => {
        setFormData(prev => ({
          ...prev,
          tdsPercentage: e.target.value
        }));
      }}
      className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {TDS_RATES.map(rate => (
        <option key={rate} value={rate}>
          {rate}%
        </option>
      ))}
    </select>
  </div>
              )}
            </div>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Contact Information (Left Column) */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                </div>
                <div className="space-y-6">
                  {/* Contact Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                        errors.contactName 
                          ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}

                    />
                    {errors.contactName && <div className="text-red-500 text-sm mt-1 font-medium">{errors.contactName}</div>}
                  </div>
                                     {/* Email Address */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Email Address
                     </label>
                     <input
                       type="email"
                       name="email"
                       value={formData.email || ''}
                       onChange={handleChange}
                       onBlur={handleBlur}
                       className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                         errors.email 
                           ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                           : 'border-gray-300 focus:ring-blue-500'
                       }`}

                     />
                     <div className="text-xs text-gray-400 mt-1">Format: username@domain.com</div>
                     {errors.email && <div className="text-red-500 text-sm mt-1 font-medium">{errors.email}</div>}
                   </div>
                                     {/* Main Phone Number (Mobile) */}
                <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    
    Main Phone Number<span className="text-red-500 mr-1"> *</span> {/* Required asterisk */}
  </label>
  <div className="flex">
    <select
      className="border border-gray-300 rounded-l-lg px-3 py-2 bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      disabled
    >
      <option>+91</option>
    </select>
    <input
      type="tel"
      name="mobile"
      value={formData.mobile || ''}
      onChange={handleChange}
      onBlur={handleBlur}
      className={`w-full px-3 py-2 text-base border-t border-b border-r rounded-r-lg focus:ring-2 focus:border-transparent transition-all ${
        errors.mobile 
          ? 'border-red-500 focus:ring-red-500 bg-red-50' 
          : 'border-gray-300 focus:ring-blue-500'
      }`}
      
      maxLength={10}
    />
  </div>
  <div className="text-xs text-gray-400 mt-1">Format: 10 digits only (e.g., 9876543210)</div>
  {errors.mobile && (
    <div className="text-red-500 text-sm mt-1 font-medium">{errors.mobile}</div>
  )}
</div>

                                     {/* Alternate Phone Number */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Alternate Phone Number
                     </label>
                     <div className="flex">
                       <select className="border border-gray-300 rounded-l-lg px-3 py-2 bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent" disabled>
                         <option>+91</option>
                       </select>
                       <input
                         type="tel"
                         name="phone"
                         value={formData.phone || ''}
                         onChange={handleChange}
                         onBlur={handleBlur}
                         className={`w-full px-3 py-2 text-base border-t border-b border-r rounded-r-lg focus:ring-2 focus:border-transparent transition-all ${
                           errors.phone 
                             ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                             : 'border-gray-300 focus:ring-blue-500'
                         }`}
                         
                         maxLength={10}
                       />
                     </div>
                     <div className="text-xs text-gray-400 mt-1">Format: 10 digits only (e.g., 9876543210)</div>
                     {errors.phone && <div className="text-red-500 text-sm mt-1 font-medium">{errors.phone}</div>}
                   </div>
                </div>
              </div>
              {/* Address Information (Right Column) */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
                </div>
                <div className="space-y-6">
                  {/* Address Line 1 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 1 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="addressLine1"
                      value={formData.addressLine1 || ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                        errors.addressLine1 
                          ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      
                    />
                    {errors.addressLine1 && <div className="text-red-500 text-sm mt-1 font-medium">{errors.addressLine1}</div>}
                  </div>
                  {/* Address Line 2 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      name="addressLine2"
                      value={formData.addressLine2 || ""}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      
                    />
                  </div>
                  {/* City & State/Province */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city || ""}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                          errors.city 
                            ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        
                      />
                      {errors.city && <div className="text-red-500 text-sm mt-1 font-medium">{errors.city}</div>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State/Province <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="state"
                        value={formData.state || ""}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                          errors.state 
                            ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      >
                        <option value="">Select state</option>
                        {indianStates.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      {errors.state && <div className="text-red-500 text-sm mt-1 font-medium">{errors.state}</div>}
                    </div>
                  </div>
                                     {/* PIN/ZIP Code */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       PIN/ZIP Code <span className="text-red-500">*</span>
                     </label>
                     <input
                       type="text"
                       name="pinCode"
                       value={formData.pinCode || ""}
                       onChange={handleChange}
                       onBlur={handleBlur}
                       className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                         errors.pinCode 
                           ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                           : 'border-gray-300 focus:ring-blue-500'
                       }`}

                       maxLength={6}
                     />
                     <div className="text-xs text-gray-400 mt-1">Format: 6 digits starting with 1-9 (e.g., 110001)</div>
                     {errors.pinCode && <div className="text-red-500 text-sm mt-1 font-medium">{errors.pinCode}</div>}
                   </div>
                </div>
              </div>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <div className="flex items-center mb-2 mt-0">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
              <h3 className="text-lg font-semibold text-gray-900">Bank Account Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 space-y-0">
              {/* Account Holder Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="bankDetails.accountHolderName"
                  value={formData.bankDetails.accountHolderName || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors['bankDetails.accountHolderName'] 
                      ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  
                />
                {errors['bankDetails.accountHolderName'] && <div className="text-red-500 text-sm mt-1 font-medium">{errors['bankDetails.accountHolderName']}</div>}
              </div>
              {/* Branch Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="bankDetails.branchName"
                  value={formData.bankDetails.branchName || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors['bankDetails.branchName'] 
                      ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  
                />
                {errors['bankDetails.branchName'] && <div className="text-red-500 text-sm mt-1 font-medium">{errors['bankDetails.branchName']}</div>}
              </div>
              {/* Bank Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name <span className="text-red-500">*</span></label>
                <select
                  name="bankDetails.bankName"
                  value={formData.bankDetails.bankName || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors['bankDetails.bankName'] 
                      ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="">Select bank</option>
                  <option value="SBI">State Bank of India</option>
                  <option value="HDFC">HDFC Bank</option>
                  <option value="ICICI">ICICI Bank</option>
                  <option value="Axis">Axis Bank</option>
                  <option value="PNB">Punjab National Bank</option>
                </select>
                {errors['bankDetails.bankName'] && <div className="text-red-500 text-sm mt-1 font-medium">{errors['bankDetails.bankName']}</div>}
              </div>
              {/* Account Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Type <span className="text-red-500">*</span></label>
                <select
                  name="bankDetails.accountType"
                  value={formData.bankDetails.accountType || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors['bankDetails.accountType'] 
                      ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="">Select account type</option>
                  <option value="Savings">Savings</option>
                  <option value="Current">Current</option>
                  <option value="OD">Overdraft</option>
                </select>
                {errors['bankDetails.accountType'] && <div className="text-red-500 text-sm mt-1 font-medium">{errors['bankDetails.accountType']}</div>}
              </div>
                             {/* Account Number */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Account Number <span className="text-red-500">*</span>
                 </label>
                 <input
                   type="text"
                   name="bankDetails.accountNumber"
                   value={formData.bankDetails.accountNumber || ''}
                   onChange={handleChange}
                   onBlur={handleBlur}
                   className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                     errors['bankDetails.accountNumber'] 
                       ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                       : 'border-gray-300 focus:ring-blue-500'
                   }`}

                   maxLength={18}
                 />
                 <div className="text-xs text-gray-400 mt-1">Format: 9-18 digits only (e.g., 1234567890)</div>
                 {errors['bankDetails.accountNumber'] && <div className="text-red-500 text-sm mt-1 font-medium">{errors['bankDetails.accountNumber']}</div>}
               </div>
                             {/* Confirm Account Number */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Confirm Account Number <span className="text-red-500">*</span>
                 </label>
                 <input
                   type="text"
                   value={confirmAccountNumber}
                   onChange={handleConfirmAccountNumberChange}
                   onBlur={handleBlur}
                   className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                     errors.confirmAccountNumber 
                       ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                       : 'border-gray-300 focus:ring-blue-500'
                   }`}

                   maxLength={18}
                 />
                 <div className="text-xs text-gray-400 mt-1">Must match the account number above</div>
                 {errors.confirmAccountNumber && <div className="text-red-500 text-sm mt-1 font-medium">{errors.confirmAccountNumber}</div>}
               </div>
                             {/* IFSC Code */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   IFSC Code <span className="text-red-500">*</span>
                 </label>
                 <input
   type="text"
   name="bankDetails.ifscCode"
   value={(formData.bankDetails.ifscCode || '').toUpperCase()}
   onChange={handleChange}
   onBlur={handleBlur}
   className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
     errors['bankDetails.ifscCode'] 
       ? 'border-red-500 focus:ring-red-500 bg-red-50' 
       : 'border-gray-300 focus:ring-blue-500'
   }`}

   maxLength={11}
/>
                 <div className="text-xs text-gray-400 mt-1">Format: 4 letters + 0 + 6 alphanumeric (e.g., SBIN0008754)</div>
                 {errors['bankDetails.ifscCode'] && <div className="text-red-500 text-sm mt-1 font-medium">{errors['bankDetails.ifscCode']}</div>}
               </div>
                             {/* UPI ID */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   UPI ID <span className="text-red-500">*</span>
                 </label>
                 <input
                   type="text"
                   name="bankDetails.upiId"
                   value={formData.bankDetails.upiId || ''}
                   onChange={handleChange}
                   onBlur={handleBlur}
                   className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                     errors['bankDetails.upiId'] 
                       ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                       : 'border-gray-300 focus:ring-blue-500'
                   }`}

                 />
                 <div className="text-xs text-gray-400 mt-1">Format: username@provider (e.g., example@paytm)</div>
                 {errors['bankDetails.upiId'] && <div className="text-red-500 text-sm mt-1 font-medium">{errors['bankDetails.upiId']}</div>}
               </div>
            </div>
          </>
        );
      case 4:
        return (
          <>
            <div className="flex items-center mb-6">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaFileAlt className="text-gray-400" /> Documents
              </h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bank Passbook Upload Section */}
              <div className="space-y-4">
                <h3 className="text-md font-semibold text-gray-800 mb-4">Bank Passbook</h3>
                
                <div className="h-64">
                  <FileUploadWithPreview
                    onFileChange={(file) => handleFileUpload(file, 'bankPassbook')}
                    acceptedFileTypes=".jpg,.jpeg,.png,.bmp,.tiff,.pdf"
                    maxFileSize={10 * 1024 * 1024} // 10MB
                    placeholder="Click to upload bank passbook or drag it here"
                    showPreview={true}
                    className="h-full"
                  />
                </div>
              </div>

              {/* GST Document Upload Section */}
              <div className="space-y-4">
                <h3 className="text-md font-semibold text-gray-800 mb-4">GST Document</h3>
                
                <div className="h-64">
                  <FileUploadWithPreview
                    onFileChange={(file) => handleFileUpload(file, 'gstDocument')}
                    acceptedFileTypes=".jpg,.jpeg,.png,.bmp,.tiff,.pdf"
                    maxFileSize={10 * 1024 * 1024} // 10MB
                    placeholder="Click to upload GST document or drag it here"
                    showPreview={true}
                    className="h-full"
                  />
                </div>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  // --- Progress Bar ---
  const renderProgressBar = () => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between">
        {steps.map((s, idx) => {
          const isActive = step === idx + 1;
          const isCompleted = step > idx + 1;
          const isClickable = true; // allow clicking any step
          return (
            <div key={s.label} className="flex-1 flex items-center">
              <button
                type="button"
                onClick={() => isClickable && setStep(idx + 1)}
                className={`flex flex-col items-center w-[60%] focus:outline-none group`}
                tabIndex={0}
                aria-current={isActive ? 'step' : undefined}
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all duration-300
                  ${isActive || isCompleted ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'}
                  group-hover:border-blue-500 group-hover:text-blue-600
                `}>
                  <span className="font-bold text-sm">{idx + 1}</span>
                </div>
                <span className={`mt-2 text-xs font-medium
                  ${isActive || isCompleted ? 'text-blue-600' : 'text-gray-500'}
                  group-hover:text-blue-600
                `}>{s.label}</span>
              </button>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-4 rounded transition-all duration-300
                  ${(idx + 1) < step ? 'bg-blue-600' : 'bg-gray-200'}
                `}></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => setIsAtBottom(entry.isIntersecting),
      { root: null, threshold: 0.99 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tagsDropdownRef.current && !tagsDropdownRef.current.contains(event.target)) {
        setShowTagsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [tagsDropdownRef]);

  // Cleanup file uploads on component unmount
  useEffect(() => {
    return () => {
      // Clean up any file objects if needed
      setUploadedFiles({
        gstDocument: null,
        bankPassbook: null
      });
    };
  }, []);
  useEffect(() => {
    const companyId = sessionStorage.getItem("employeeCompanyId");
    if (companyId) {
      dispatch(fetchVendorTags(companyId));
    }
  }, [dispatch]);

  return (
    <form ref={formRef} className="w-full bg-white border border-gray-200 shadow-lg p-0 flex flex-col relative pb-6">
      {/* Progress Bar */}
      <div className="w-full px-8 pt-2">
        {renderProgressBar()}
      </div>
      {/* Step Content */}
      <div className="w-full px-8 pb-8 pt-2 flex-1">
        {renderStepContent()}
      </div>
      {/* Sentinel for IntersectionObserver */}
      <div ref={sentinelRef} style={{ height: 1 }} />
      {/* Sticky Action Bar (full width, flush with form edges) */}
      <div className="sticky bottom-0 z-20 w-full bg-white px-8 py-2 flex justify-between items-center">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          disabled={step === 1}
        >
          Back
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            className="px-6 py-2 border border-blue-300 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            Save Draft
          </button>
          {step === steps.length && (
            <button
              type="button"
              onClick={handlePreview}
              className="px-6 py-2 border border-green-300 rounded-lg text-green-700 bg-green-50 hover:bg-green-100 transition-colors flex items-center gap-2"
            >
              <FaEye className="w-4 h-4" />
              Preview
            </button>
          )}
          {step < steps.length ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(steps.length, s + 1))}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              
              {isEditMode ? 'Update ' : 'Submit'}
            </button>
          )}
        </div>
      </div>

      {/* Vendor Preview Modal */}
      {showVendorPreview && (
        <VendorPreview
          vendorData={formData}
          onClose={() => setShowVendorPreview(false)}
        />
      )}
    </form>
  );
};

export default AddVendorForm;