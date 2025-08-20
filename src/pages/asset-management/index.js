import React, { useState, useEffect } from 'react';
import AssetManagementLayout from '@/components/AssetManagementLayout';
import { FaPlus, FaTimes, FaIdCard, FaSync } from 'react-icons/fa';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import withAuth from '@/components/withAuth';
import { fetchAssetCategories } from '@/redux/slices/assetCategorySlice';
import { fetchAssetLocations } from '@/redux/slices/assetLocationSlice';
import { fetchAssetStatuses } from '@/redux/slices/assetStatusSlice';
import { createAssetWithDTO, fetchAllAssets, patchAssetByAssetId } from '@/redux/slices/assetSlice';
import { fetchCustomFormsByCategory } from '@/redux/slices/customFormsSlice';

import getConfig from 'next/config';
import { getItemFromSessionStorage } from '@/redux/slices/sessionStorageSlice';

// Mock Data for existing assets display - REMOVED since we now use Redux
// const MOCK_ASSETS = [
//     { id: 'ASSET-2024-0001', name: 'Dell Latitude 5420', category: 'IT Equipment', status: 'Assigned', location: 'Mumbai Head Office', assignedTo: 'Ankit Matwa' },
//     { id: 'ASSET-2024-0002', name: 'Ergonomic Office Chair', category: 'Office Furniture', status: 'In Stock', location: 'Mumbai Head Office', assignedTo: null },
//     { id: 'ASSET-2024-0003', name: 'HP LaserJet Pro MFP', category: 'IT Equipment', status: 'Under Maintenance', location: 'Bangalore Branch', assignedTo: null },
// ];



// Input and Select components defined outside to prevent re-creation on each render
const InputField = ({ label, name, value, onChange, type, error, ...props }) => {
    // Special handling for file inputs to show selected filename
    if (type === 'file') {
        return (
            <div>
                <label className="block text-sm font-medium text-gray-700">{label}</label>
                <div className="relative">
                    <input 
                        name={name} 
                        onChange={onChange} 
                        type="file"
                        {...props} 
                        className={`mt-1 w-full p-2 border rounded-md shadow-sm ${error ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {value && (
                        <div className="absolute inset-0 flex items-center px-2 pointer-events-none">
                            <span className="text-sm text-gray-600 truncate">
                                {value.name}
                            </span>
                        </div>
                    )}
                </div>
                {error && (
                    <p className="mt-1 text-sm text-red-600">{error}</p>
                )}
            </div>
        );
    }

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <input 
                name={name} 
                onChange={onChange} 
                value={value || ''} 
                type={type}
                {...props} 
                className={`mt-1 w-full p-2 border rounded-md shadow-sm ${error ? 'border-red-500' : 'border-gray-300'}`}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};

const SelectField = ({ label, name, value, onChange, children, error, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <select 
            name={name} 
            onChange={onChange} 
            value={value || ''} 
            {...props} 
            className={`mt-1 w-full p-2 border rounded-md shadow-sm ${error ? 'border-red-500' : 'border-gray-300'}`}
        >
            {children}
        </select>
        {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
    </div>
);

// Component to render dynamic custom form fields for asset creation
const CustomFormRenderer = ({ customForms, customFormData, setCustomFormData, selectedCategory, validationErrors }) => {
    // Only show custom forms if a category is selected
    if (!selectedCategory) {
        return null;
    }

    if (!customForms || customForms.length === 0) {
        return (
            <div className="p-4 border rounded-md bg-gray-50 border-gray-200">
                <div className="text-center py-6">
                    <div className="text-4xl mb-2">📋</div>
                    <h4 className="text-lg font-semibold mb-2">No Form Assigned</h4>
                    <p className="text-gray-600">No custom form is assigned to this category.</p>
                </div>
            </div>
        );
    }

    const handleCustomFieldChange = (formId, fieldId, value) => {
        setCustomFormData(prev => ({
            ...prev,
            [formId]: {
                ...prev[formId],
                [fieldId]: value
            }
        }));
    };

    const renderField = (form, field) => {
        // Add validation for field properties
        if (!field || !field.id) {
            return null;
        }

        // Map backend field structure to frontend expected structure
        const fieldName = field.name || field.fieldName || field.fieldLabel || 'Unknown Field';
        const fieldType = field.type || field.fieldType || 'text';
        const isRequired = field.required !== undefined ? field.required : false;
        const placeholder = field.placeholder || field.defaultValue || '';
        const options = field.options || [];

        const fieldValue = customFormData[form.id]?.[field.id] || '';
        
        switch (fieldType) {
            case 'text':
            case 'email':
            case 'number':
                return (
                    <InputField
                        key={field.id}
                        label={`${fieldName}${isRequired ? ' *' : ''}`}
                        type={fieldType}
                        value={fieldValue}
                        onChange={(e) => handleCustomFieldChange(form.id, field.id, e.target.value)}
                        placeholder={placeholder}
                        error={validationErrors[`custom_${form.id}_${field.id}`]}
                    />
                );
            case 'dropdown':
            case 'select':
                return (
                    <SelectField
                        key={field.id}
                        label={`${fieldName}${isRequired ? ' *' : ''}`}
                        value={fieldValue}
                        onChange={(e) => handleCustomFieldChange(form.id, field.id, e.target.value)}
                        error={validationErrors[`custom_${form.id}_${field.id}`]}
                    >
                        <option value="">Select {fieldName}...</option>
                        {options && Array.isArray(options) && options.map((option, index) => (
                            <option key={option.value || option || index} value={option.value || option}>
                                {option.label || option}
                            </option>
                        ))}
                    </SelectField>
                );
            case 'textarea':
                return (
                    <div key={field.id}>
                        <label className="block text-sm font-medium text-gray-700">
                            {fieldName}{isRequired ? ' *' : ''}
                        </label>
                        <textarea
                            value={fieldValue}
                            onChange={(e) => handleCustomFieldChange(form.id, field.id, e.target.value)}
                            placeholder={placeholder}
                            rows={3}
                            className={`mt-1 w-full p-2 border rounded-md shadow-sm ${validationErrors[`custom_${form.id}_${field.id}`] ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {validationErrors[`custom_${form.id}_${field.id}`] && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors[`custom_${form.id}_${field.id}`]}</p>
                        )}
                    </div>
                );
            case 'date':
                return (
                    <InputField
                        key={field.id}
                        label={`${fieldName}${isRequired ? ' *' : ''}`}
                        type="date"
                        value={fieldValue}
                        onChange={(e) => handleCustomFieldChange(form.id, field.id, e.target.value)}
                        error={validationErrors[`custom_${form.id}_${field.id}`]}
                    />
                );
            case 'checkbox':
                return (
                    <div key={field.id} className="flex items-center">
                        <input
                            type="checkbox"
                            checked={fieldValue === true || fieldValue === 'true'}
                            onChange={(e) => handleCustomFieldChange(form.id, field.id, e.target.checked)}
                            className="mr-2"
                        />
                        <label className="text-sm text-gray-700">
                            {fieldName}{isRequired ? ' *' : ''}
                        </label>
                    </div>
                    );
                case 'file':
                    return (
                        <div key={field.id}>
                            <label className="block text-sm font-medium text-gray-700">
                                {fieldName}{isRequired ? ' *' : ''}
                            </label>
                            <input
                                type="file"
                                onChange={(e) => handleCustomFieldChange(form.id, field.id, e.target.files[0])}
                                className={`mt-1 w-full p-2 border rounded-md shadow-sm ${validationErrors[`custom_${form.id}_${field.id}`] ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {validationErrors[`custom_${form.id}_${field.id}`] && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors[`custom_${form.id}_${field.id}`]}</p>
                                )}
                        </div>
                    );
                default:
                    return (
                        <InputField
                            key={field.id}
                            label={`${fieldName}${isRequired ? ' *' : ''}`}
                            type="text"
                            value={fieldValue}
                            onChange={(e) => handleCustomFieldChange(form.id, field.id, e.target.value)}
                            placeholder={placeholder}
                            error={validationErrors[`custom_${form.id}_${field.id}`]}
                        />
                    );
        }
    };

    return (
        <div className="space-y-6">
            {customForms.map(form => (
                <div key={form.id || form.formId} className="p-4 border rounded-md">
                    <h3 className="font-semibold text-lg mb-4 text-gray-800">{form.name || form.title}</h3>
                    {form.fields && Array.isArray(form.fields) && form.fields.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {form.fields.map((field) => {
                                // Map backend field structure to frontend expected structure
                                const fieldName = field.name || field.fieldName || field.fieldLabel || 'Unknown Field';
                                const fieldType = field.type || field.fieldType || 'text';
                                const isRequired = field.required !== undefined ? field.required : false;
                                const placeholder = field.placeholder || field.defaultValue || '';
                                
                                return (
                                    <div key={field.id}>
                                        {renderField(form, field)}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-gray-500">
                            <p>No fields defined for this form.</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const AddAssetModal = ({ isOpen, onClose, onSubmit }) => {
    const dispatch = useDispatch();
    const { categories, loading: categoriesLoading, error: categoriesError } = useSelector(state => state.assetCategories);
    const { locations, loading: locationsLoading, error: locationsError } = useSelector(state => state.assetLocations);
    const { statuses, loading: statusesLoading, error: statusesError } = useSelector(state => state.assetStatuses);
    const { creatingAsset, error: assetError } = useSelector(state => state.assets);
    const { formsByCategory, loading: customFormsLoading } = useSelector(state => state.customForms);
    
    // More robust fallback forms access
    const customFormState = useSelector(state => state.customForm);
    const fallbackForms = customFormState?.forms || [];
    const safeFallbackForms = Array.isArray(fallbackForms) ? fallbackForms : [];
    
    const [formData, setFormData] = useState({
        category: '', 
        subcategory: '',
        location: '',
        purchaseDate: '', 
        invoiceNumber: '', 
        purchaseCost: '',
        gstRate: '', 
        invoiceScan: null,
        warrantyExpiry: '',

        // Additional fields that might be needed
        statusLabelId: ''
    });


    const [generatedAssetId, setGeneratedAssetId] = useState('');
    const { publicRuntimeConfig } = getConfig();
    const [availableSubcategories, setAvailableSubcategories] = useState([]);
    const [selectedCategoryData, setSelectedCategoryData] = useState(null);
    const [customFormData, setCustomFormData] = useState({});
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

    // Get custom forms for the selected category (moved after state declarations)
    let customForms = [];
    try {
        if (selectedCategoryData && formsByCategory) {
            const categoryKey = selectedCategoryData.categoryId || selectedCategoryData.id;
            customForms = formsByCategory[categoryKey] || [];
        }
    } catch (error) {
        customForms = [];
    }
    
    // Fallback: Also check the other custom forms slice if needed
    let fallbackCustomForms = [];
    try {
        if (selectedCategoryData && Array.isArray(safeFallbackForms)) {
            fallbackCustomForms = safeFallbackForms.filter(form => 
                form && form.categoryId === (selectedCategoryData.categoryId || selectedCategoryData.id)
            );
        }
    } catch (error) {
        fallbackCustomForms = [];
    }
    
    // Use fallback forms if main forms are empty
    const finalCustomForms = customForms.length > 0 ? customForms : fallbackCustomForms;

    // Filter forms by selected subcategory when available
    const subcategoryFilteredForms = React.useMemo(() => {
        if (!selectedSubcategoryId) return [];
        const filtered = (finalCustomForms || []).filter(f => {
            const sid = f?.subCategoryId || f?.assignedSubCategoryId || f?.subcategoryId || f?.subCategory?.id;
            return sid != null && String(sid) === String(selectedSubcategoryId);
        });
        return filtered;
    }, [finalCustomForms, selectedSubcategoryId]);





    // Fetch data from Redux when modal opens
    useEffect(() => {
        if (isOpen) {
            console.log('Modal opened, fetching data from Redux...');
            dispatch(fetchAssetCategories());
            dispatch(fetchAssetLocations());
            dispatch(fetchAssetStatuses());
        }
    }, [isOpen, dispatch]);

    useEffect(() => {
        // Update available subcategories when category changes
        if (formData.category && Array.isArray(categories)) {
            // Find the selected category from the fetched categories
            const categoryData = categories.find(cat => cat.name === formData.category);
            setSelectedCategoryData(categoryData);
            
            if (categoryData && Array.isArray(categoryData.subCategories)) {
                setAvailableSubcategories(categoryData.subCategories);
            } else {
                setAvailableSubcategories([]);
            }
            
            // Reset subcategory if it's not valid for the new category
            if (formData.subcategory && categoryData) {
                const isValidSubcategory = categoryData.subCategories?.find(sub => sub.name === formData.subcategory);
                if (!isValidSubcategory) {
                    setFormData(prev => ({ ...prev, subcategory: '' }));
                }
            }
        } else {
            setAvailableSubcategories([]);
            setSelectedCategoryData(null);
            setFormData(prev => ({ ...prev, subcategory: '' }));
        }
        // Reset selected subcategory whenever category changes
        setSelectedSubcategoryId('');
    }, [formData.category, categories, dispatch]);

    // Fetch forms only after a subcategory is chosen (per requirement)
    useEffect(() => {
        if (!selectedSubcategoryId || !selectedCategoryData) return;
        const categoryId = selectedCategoryData.categoryId || selectedCategoryData.id;
        if (!categoryId) return;
        console.log('Fetching custom forms for category after subcategory selection:', categoryId);
        dispatch(fetchCustomFormsByCategory(categoryId));
    }, [selectedSubcategoryId, selectedCategoryData, dispatch]);

    // Clear custom form data when category changes
    useEffect(() => {
        if (formData.category) {
            setCustomFormData({});
        }
    }, [formData.category]);

    // Generate asset ID by querying backend for the next ID when subcategory is selected
    useEffect(() => {
        let cancelled = false;

        const fetchNextId = async () => {
            try {
                if (!selectedSubcategoryId) {
                    setGeneratedAssetId('');
                    return;
                }

                const subCategoryId = selectedSubcategoryId;

                const tokenRaw = getItemFromSessionStorage('token', null);
                const token = typeof tokenRaw === 'string'
                  ? tokenRaw
                  : (tokenRaw?.token || tokenRaw?.accessToken || '');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                const url = `${publicRuntimeConfig.apiURL}/api/assets/auto-generate-next-id?subcategoryId=${encodeURIComponent(subCategoryId)}`;
                console.log('[auto-generate-next-id] GET', url, 'token?', !!token);

                let resp = null;
                try {
                    resp = await fetch(url, { headers });
                } catch (e) {
                    // network error; leave resp as null
                }

                if (cancelled) return;

                if (resp && resp.ok) {
                    const data = await resp.json().catch(() => ({}));
                    if (data?.success && data?.nextAssetId) {
                        setGeneratedAssetId(String(data.nextAssetId));
                        console.log('Generated Asset ID:', data.nextAssetId, 'Prefix:', data.prefix, 'Subcategory:', data.subcategoryName, 'Logic:', data.logic);
                        return;
                    }
                }
                if (resp && resp.status === 401) {
                    toast.error('Authentication required. Please sign in again.');
                }

                // Fallback: prefix + nextSequence
                const sub = selectedCategoryData.subCategories?.find(s => (s.subCategoryId || s.id) === subCategoryId);
                const prefix = (sub?.prefix || '').trim();
                let nextSeq =
                    typeof sub?.nextSequence === 'number'
                      ? sub.nextSequence
                      : (sub?.autoIdSuffix && parseInt(String(sub.autoIdSuffix).replace(/\D/g, ''), 10)) || 1;
                nextSeq = Math.max(1, nextSeq);
                setGeneratedAssetId(`${prefix}-${String(nextSeq).padStart(4, '0')}`);
            } catch (_) {
                // Final safety fallback
                const sub = selectedCategoryData?.subCategories?.find(s => (s.subCategoryId || s.id) === selectedSubcategoryId);
                const prefix = (sub?.prefix || '').trim();
                const seq = Math.max(1, typeof sub?.nextSequence === 'number' ? sub.nextSequence : 1);
                setGeneratedAssetId(`${prefix}-${String(seq).padStart(4, '0')}`);
            }
        };

        fetchNextId();
        return () => { cancelled = true; };
    }, [selectedSubcategoryId, selectedCategoryData, publicRuntimeConfig.apiURL]);

    // Handle Redux errors with toast notifications
    useEffect(() => {
        if (categoriesError) {
            toast.error(`Failed to fetch categories: ${categoriesError}`);
        }
        if (locationsError) {
            toast.error(`Failed to fetch locations: ${locationsError}`);
        }
        if (statusesError) {
            toast.error(`Failed to fetch statuses: ${statusesError}`);
        }
        if (assetError) {
            toast.error(`Failed to add asset: ${assetError}`);
        }
    }, [categoriesError, locationsError, statusesError, assetError]);

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        console.log('handleChange called:', { name, value, type });
        
        // Clear validation error for this field when user starts typing/selecting
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
        
        // Also clear custom form validation errors for this field
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            Object.keys(newErrors).forEach(key => {
                if (key.startsWith('custom_') && key.includes(`_${name}`)) {
                    delete newErrors[key];
                }
            });
            return newErrors;
        });
        
        if (type === 'file') {
            setFormData(prev => {
                const newData = { ...prev, [name]: files[0] };
                console.log('Updated formData (file):', newData);
                return newData;
            });
        } else {
            setFormData(prev => {
                const newData = { ...prev, [name]: value };
                console.log('Updated formData:', newData);
                return newData;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Debug: Log form data before validation
        console.log('=== FORM SUBMISSION DEBUG ===');
        console.log('formData at submission:', formData);
        console.log('formData.location:', formData.location);
        console.log('formData.purchaseDate:', formData.purchaseDate);
        console.log('formData.purchaseCost:', formData.purchaseCost);
        console.log('formData.invoiceNumber:', formData.invoiceNumber);
        console.log('formData.gstRate:', formData.gstRate);
        console.log('formData.warrantyExpiry:', formData.warrantyExpiry);
        
        // Clear previous validation errors
        setValidationErrors({});
        
        // Custom frontend validation with field-specific errors
        const newValidationErrors = {};
        
        if (!formData.category) {
            newValidationErrors.category = "Please select a category";
        }
        if (!formData.subcategory) {
            newValidationErrors.subcategory = "Please select a subcategory";
        }
        if (!formData.purchaseDate) {
            newValidationErrors.purchaseDate = "Please enter the purchase date";
        }
        if (!formData.purchaseCost) {
            newValidationErrors.purchaseCost = "Please enter the purchase cost";
        }
        if (!formData.location) {
            newValidationErrors.location = "Please select a location";
        }
        
        if (Object.keys(newValidationErrors).length > 0) {
            setValidationErrors(newValidationErrors);
            return;
        }
        
        // Validate custom form fields for the selected subcategory only
        if (selectedSubcategoryId && subcategoryFilteredForms && subcategoryFilteredForms.length > 0) {
            console.log('Validating custom forms:', finalCustomForms);
            console.log('Custom form data:', customFormData);
            
            for (const form of subcategoryFilteredForms) {
                if (form.fields && Array.isArray(form.fields)) {
                    for (const field of form.fields) {
                        const fieldName = field.name || field.fieldName || field.fieldLabel || 'Unknown Field';
                        const isRequired = field.required !== undefined ? field.required : false;
                        
                        if (isRequired) {
                            const fieldValue = customFormData[form.id]?.[field.id];
                            console.log('Checking required field:', { 
                                formId: form.id, 
                                fieldId: field.id, 
                                fieldName: fieldName, 
                                fieldValue,
                                isRequired: isRequired
                            });
                            
                            if (!fieldValue || fieldValue === '') {
                                // Set custom form validation error
                                newValidationErrors[`custom_${form.id}_${field.id}`] = `Please fill "${fieldName}"`;
                            }
                        }
                    }
                }
            }
            
            // Check if there are custom form validation errors
            if (Object.keys(newValidationErrors).length > 0) {
                setValidationErrors(newValidationErrors);
                return;
            }
        }
        

        
        try {
            // Find the selected category and subcategory IDs
            const categoryData = categories.find(cat => cat.name === formData.category);
            const subcategoryData = categoryData?.subCategories?.find(sub => sub.name === formData.subcategory);
            
            // Get session storage values with debugging - try different key variations
            const companyId = sessionStorage.getItem("employeeCompanyId") || 
                             sessionStorage.getItem("companyId") || 
                             sessionStorage.getItem("company");
            const employeeId = sessionStorage.getItem("employeeId") || 
                              sessionStorage.getItem("userId") || 
                              sessionStorage.getItem("user");
            
            console.log('Session storage values:', {
                companyId: companyId,
                employeeId: employeeId,
                allKeys: Object.keys(sessionStorage)
            });
            
            // Prepare asset data according to API structure requested
            const assetData = {
                companyId: companyId,
                categoryId: categoryData?.categoryId || categoryData?.id,
                assetId: generatedAssetId,
                subcategoryId: subcategoryData?.subCategoryId || subcategoryData?.id,
                locationId: formData.location || null,
                statusLabelId: formData.statusLabelId || null,

                purchaseDate: formData.purchaseDate || null,
                purchaseCost: formData.purchaseCost ? parseFloat(formData.purchaseCost) : null,
                invoiceNumber: formData.invoiceNumber || null,
                warrantyExpiry: formData.warrantyExpiry || null,
                gstRate: formData.gstRate ? parseFloat(formData.gstRate) : null,
                inputTaxCreditEligible: true,
                createdBy: employeeId,
            };
            
            // Debug: Check what values are being set
            console.log('=== FIELD VALUE DEBUG ===');
            console.log('formData.location:', formData.location, '-> locationId:', assetData.locationId);
            console.log('formData.purchaseDate:', formData.purchaseDate, '-> purchaseDate:', assetData.purchaseDate);
            console.log('formData.purchaseCost:', formData.purchaseCost, '-> purchaseCost:', assetData.purchaseCost);
            console.log('formData.invoiceNumber:', formData.invoiceNumber, '-> invoiceNumber:', assetData.invoiceNumber);
            console.log('formData.gstRate:', formData.gstRate, '-> gstRate:', assetData.gstRate);
            console.log('formData.warrantyExpiry:', formData.warrantyExpiry, '-> warrantyExpiry:', assetData.warrantyExpiry);
            
            // Validate required fields
            if (!assetData.companyId) {
                toast.error("Company ID not found in session");
                return;
            }
            if (!assetData.categoryId) {
                toast.error("Category ID is required");
                return;
            }
            if (!assetData.assetId) {
                toast.error("Asset ID is required");
                return;
            }
            if (!assetData.createdBy) {
                toast.error("User ID not found in session");
                return;
            }
            
            // Add form data from custom forms
            if (selectedSubcategoryId && Object.keys(customFormData).length > 0) {
                // Convert custom form data to the new formData structure
                const formDataMap = {};
                
                Object.keys(customFormData).forEach(formId => {
                    const form = subcategoryFilteredForms.find(f => f.id === formId);
                    if (form && form.fields) {
                        Object.keys(customFormData[formId]).forEach(fieldId => {
                            const field = form.fields.find(f => f.id === fieldId);
                            if (field) {
                                const fieldName = field.name || field.fieldName || field.fieldLabel || 'Unknown Field';
                                const fieldValue = customFormData[formId][fieldId];
                                formDataMap[fieldName] = fieldValue;
                            }
                        });
                    }
                });
                
                // Align to contract: send customFormData and also formData for compatibility
                assetData.customFormData = formDataMap;
                assetData.formData = formDataMap;
            }

            // Add uploaded file information to documents array
            if (formData.invoiceScan) {
                assetData.documents = [{
                    name: formData.invoiceScan.name,
                    type: formData.invoiceScan.type || 'File',
                    uploadDate: new Date().toISOString(),
                    originalFile: formData.invoiceScan // Keep reference to original file
                }];
            }
            


            
            // Debug: Log the data being sent
            console.log('=== FORM DATA DEBUG ===');
            console.log('formData state:', formData);
            console.log('formData keys:', Object.keys(formData));
            console.log('formData values:', Object.values(formData));
            console.log('=== ASSET DATA DEBUG ===');
            console.log('Submitting asset data:', assetData);
            console.log('Asset data keys:', Object.keys(assetData));
            console.log('Asset data values:', Object.values(assetData));
            console.log('Attachment file:', formData.invoiceScan);
            console.log('Custom form data:', customFormData);
            console.log('Request payload structure:', {
                asset: assetData,
                attachment: !!formData.invoiceScan
            });

            console.log('=== FINAL ASSET DATA ===');
            console.log('Asset data keys:', Object.keys(assetData));
            console.log('Form data keys:', Object.keys(customFormData));
            console.log('=== COMPLETE ASSET DATA ===');
            console.log('Complete asset data being sent:', JSON.stringify(assetData, null, 2));
            console.log('Invoice scan file:', formData.invoiceScan);
            
            // Fire-and-close: start save, close modal immediately; update when done
            const savePromise = dispatch(createAssetWithDTO({ 
                asset: assetData, 
                invoiceScan: formData.invoiceScan 
            })).unwrap();

            // Close modal fast for better UX; show promise-based toast
            onClose();

            toast.promise(savePromise, {
                loading: 'Saving asset...',
                success: 'Asset added successfully!',
                error: (e) => e?.message || 'Failed to add asset',
            });

            const result = await savePromise;
            onSubmit(result); // Pass the response back to parent (triggers list refresh)

            // Upload attachment (if provided) to dedicated endpoint
            if (formData.invoiceScan) {
                try {
                    const tokenRaw = getItemFromSessionStorage('token', null);
                    const token = typeof tokenRaw === 'string' ? tokenRaw : (tokenRaw?.token || tokenRaw?.accessToken || '');
                    const headers = token ? { Authorization: `Bearer ${token}` } : {};
                    const fd = new FormData();
                    const resolvedAssetId = (result && (result.assetId || result.id)) || assetData.assetId;
                    fd.append('assetId', resolvedAssetId);
                    fd.append('file', formData.invoiceScan);

                    const uploadUrl = `${publicRuntimeConfig.apiURL}/api/assets/upload-doc`;
                    console.log('[upload-doc] POST', uploadUrl, { assetId: resolvedAssetId, hasFile: !!formData.invoiceScan });
                    const uploadResp = await fetch(uploadUrl, { method: 'POST', headers, body: fd });
                    if (!uploadResp.ok) {
                        const errJson = await uploadResp.json().catch(() => ({}));
                        throw new Error(errJson.message || `Attachment upload failed (${uploadResp.status})`);
                    }
                    
                    // Update the asset with document information after successful upload
                    const documentData = {
                        documents: [{
                            name: formData.invoiceScan.name,
                            type: formData.invoiceScan.type || 'File',
                            uploadDate: new Date().toISOString(),
                            fileUrl: uploadResp.headers.get('file-url') || null // If backend returns file URL
                        }]
                    };
                    
                    // Update asset with document info
                    try {
                        await dispatch(patchAssetByAssetId({ 
                            assetId: resolvedAssetId, 
                            assetData: documentData 
                        })).unwrap();
                    } catch (updateError) {
                        console.warn('Failed to update asset with document info:', updateError);
                        // Don't fail the whole process if document update fails
                    }
                    
                    toast.success('Attachment uploaded and asset updated');
                } catch (e) {
                    const message = e?.message || 'Failed to upload attachment';
                    console.error('[upload-doc] error:', message);
                    toast.error(message);
                }
            }
            
            // Reset form
            setFormData({
                category: '', subcategory: '', location: '', purchaseDate: '', invoiceNumber: '', purchaseCost: '',
                gstRate: '', invoiceScan: null, warrantyExpiry: '',
                statusLabelId: ''
            });
            setGeneratedAssetId('');
            setAvailableSubcategories([]);
            setSelectedCategoryData(null);
            setCustomFormData({});
            setValidationErrors({});
        } catch (error) {
            // Error is already handled by Redux and useEffect
            console.error('Error adding asset:', error);
        }
    };

    // Clear validation errors when modal is closed
    useEffect(() => {
        if (!isOpen) {
            setValidationErrors({});
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Add New Asset</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Core Identification */}
                    <div className="p-4 border rounded-md">
                        <h3 className="font-semibold text-lg mb-4">Core Identification</h3>
                        

                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <SelectField 
                                label="Category *" 
                                name="category" 
                                value={formData.category}
                                onChange={handleChange}
                                error={validationErrors.category}
                            >
                                <option value="">
                                    {categoriesLoading ? 'Loading categories...' : 'Select Category...'}
                                </option>
                                {Array.isArray(categories) && categories.map(c => (
                                    <option key={c.categoryId || c.id} value={c.name}>
                                        {c.name}
                                    </option>
                                ))}
                            </SelectField>
                            <SelectField 
                                label="Subcategory *" 
                                name="subcategory"
                                value={formData.subcategory}
                                onChange={(e) => {
                                    const subName = e.target.value;
                                    setFormData(prev => ({ ...prev, subcategory: subName }));
                                    // Also set the selectedSubcategoryId for custom forms
                                    const sub = availableSubcategories.find(s => s.name === subName);
                                    setSelectedSubcategoryId(sub?.subCategoryId || sub?.id || '');
                                }}
                                error={validationErrors.subcategory}
                                disabled={!formData.category || availableSubcategories.length === 0}
                            >
                                <option value="">
                                    {!formData.category ? 'Select Category First' : 
                                     availableSubcategories.length === 0 ? 'No subcategories available' : 
                                     'Select Subcategory...'}
                                </option>
                                {availableSubcategories.map(sub => (
                                    <option key={sub.subCategoryId || sub.id} value={sub.name}>
                                        {sub.name}
                                    </option>
                                ))}
                            </SelectField>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <FaIdCard className="inline mr-1" />
                                    Asset ID *
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={generatedAssetId}
                                        readOnly
                                        className="flex-1 p-3 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                                        placeholder="Select category and subcategory to generate ID"
                                    />
                                    {generatedAssetId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(generatedAssetId);
                                                toast.success('Asset ID copied to clipboard!');
                                            }}
                                            className="p-2 text-blue-600 hover:text-blue-800"
                                            title="Copy Asset ID"
                                        >
                                            <FaSync />
                                        </button>
                                    )}
                                </div>
                                {generatedAssetId && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Format: [Category]-[Subcategory]-[Sequence]
                                    </p>
                                )}
                            </div>
                            <SelectField 
                                label="Location *" 
                                name="location" 
                                value={formData.location}
                                onChange={handleChange}
                                error={validationErrors.location}
                            >
                                <option value="">
                                    {locationsLoading ? 'Loading locations...' : 'Select Location...'}
                                </option>
                                {Array.isArray(locations) && locations.map(l => (
                                    <option key={l.locationId || l.id} value={l.locationId || l.id}>
                                        {l.name}
                                    </option>
                                ))}
                            </SelectField>
                            <SelectField 
                                label="Status *" 
                                name="statusLabelId" 
                                value={formData.statusLabelId}
                                onChange={handleChange}
                                error={validationErrors.statusLabelId}
                            >
                                <option value="">Select Status...</option>
                                {Array.isArray(statuses) && statuses.map(s => (
                                    <option key={s.statusLabelId || s.id} value={s.statusLabelId || s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </SelectField>
                        </div>
                    </div>
                    
                    {/* Financial & Purchase */}
                    <div className="p-4 border rounded-md">
                        <h3 className="font-semibold text-lg mb-4">Financial & Purchase Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <InputField 
                                label="Purchase Date *" 
                                name="purchaseDate" 
                                value={formData.purchaseDate}
                                onChange={handleChange}
                                type="date" 
                                error={validationErrors.purchaseDate}
                            />
                            <InputField 
                                label="Invoice / Bill Number" 
                                name="invoiceNumber" 
                                value={formData.invoiceNumber}
                                onChange={handleChange}
                            />
                            <InputField 
                                label="Purchase Cost (Gross) *" 
                                name="purchaseCost" 
                                value={formData.purchaseCost}
                                onChange={handleChange}
                                type="number" 
                                error={validationErrors.purchaseCost}
                            />
                            <InputField 
                                label="GST Rate (%)" 
                                name="gstRate" 
                                value={formData.gstRate}
                                onChange={handleChange}
                                type="number" 
                                placeholder="e.g., 18" 
                            />
                            <InputField 
                                label="Warranty Expiry Date" 
                                name="warrantyExpiry" 
                                value={formData.warrantyExpiry}
                                onChange={handleChange}
                                type="date" 
                            />
                            <InputField 
                                label="Upload Attachment" 
                                name="invoiceScan" 
                                onChange={handleChange}
                                type="file" 
                                accept=".pdf,.jpg,.jpeg,.png"
                                title={formData.invoiceScan ? `Selected: ${formData.invoiceScan.name}` : "Choose file"}
                            />
                        </div>
                    </div>
                    
                    {/* Custom Forms Section */}
                    {formData.category && (
                        <div className="p-4 border rounded-md">
                            
                            
                            {customFormsLoading && (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                    <p className="text-blue-600">Loading custom forms...</p>
                                </div>
                            )}
                            
                            {formData.category && selectedSubcategoryId && !customFormsLoading && subcategoryFilteredForms.length > 0 && (
                                <CustomFormRenderer
                                    customForms={subcategoryFilteredForms}
                                    customFormData={customFormData}
                                    setCustomFormData={setCustomFormData}
                                    selectedCategory={formData.category}
                                    validationErrors={validationErrors}
                                />
                            )}
                            {formData.category && !selectedSubcategoryId && (
                                <div className="text-center py-6 text-gray-600">Select a subcategory to load its custom form(s).</div>
                            )}
                            

                        </div>
                    )}
                    





                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end items-center rounded-b-lg">
                    <div className="flex items-center gap-2">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            disabled={creatingAsset}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={creatingAsset || categoriesLoading || locationsLoading || statusesLoading}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {creatingAsset ? 'Saving...' : 'Save Asset'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

const AssetManagementPage = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Get data from Redux store
    const { assets, loading: assetsLoading, error: assetsError } = useSelector(state => state.assets);
    const { categories } = useSelector(state => state.assetCategories);
    const { locations } = useSelector(state => state.assetLocations);
    const { statuses } = useSelector(state => state.assetStatuses);

    // Fetch all data when component mounts
    useEffect(() => {
        console.log('AssetManagementPage: Fetching all asset data...');
        dispatch(fetchAllAssets());
        dispatch(fetchAssetCategories());
        dispatch(fetchAssetLocations());
        dispatch(fetchAssetStatuses());
    }, [dispatch]);

    // Handle errors with toast notifications
    useEffect(() => {
        if (assetsError) {
            toast.error(`Failed to fetch assets: ${assetsError}`);
        }
    }, [assetsError]);

    // Helper functions to map IDs to names
    const getCategoryName = (categoryId) => {
        if (!categoryId || !Array.isArray(categories)) return 'Unknown Category';
        const category = categories.find(c => (c.categoryId || c.id) === categoryId);
        return category ? category.name : 'Unknown Category';
    };

    const getLocationName = (locationId) => {
        if (!locationId || !Array.isArray(locations)) return 'Unknown Location';
        const location = locations.find(l => (l.locationId || l.id) === locationId);
        return location ? location.name : 'Unknown Location';
    };

    const getStatusName = (statusLabelId) => {
        if (!statusLabelId) return 'No Status'; // More accurate when no statusLabelId
        if (!Array.isArray(statuses)) return 'Loading...';
        const status = statuses.find(s => (s.statusLabelId || s.id) === statusLabelId);
        return status ? status.name : 'Unknown Status';
    };

    // Safely extract a display label from potentially nested formData
    const getDisplayFromFormData = (formData) => {
        if (!formData || typeof formData !== 'object') return '';
        // Prefer string/number/boolean values
        for (const value of Object.values(formData)) {
            if (value == null) continue;
            const t = typeof value;
            if (t === 'string' || t === 'number') return String(value);
            if (t === 'boolean') return value ? 'Yes' : 'No';
        }
        // If values are objects/arrays (legacy structured form), fallback to asset name
        return '';
    };

    // Determine asset name for listing
    const getAssetName = (asset) => {
        if (!asset) return 'Asset';
        if (asset.name) return asset.name;
        const fd = asset.formData || asset.customFields || {};
        // Prefer explicit "Asset" field from custom form, then sensible fallbacks
        const nameKeys = ['Asset', 'asset', 'Asset Name', 'assetName', 'Name', 'name', 'Model', 'model', 'Title', 'title'];
        for (const key of nameKeys) {
            const value = fd && fd[key];
            if (value != null && value !== '') return String(value);
        }
        return getDisplayFromFormData(fd) || asset.assetId || 'Asset';
    };

    // Derive the displayed Asset ID, preferring the auto-generated assetId
    const getAssetIdDisplay = (asset) => {
        if (!asset) return '';
        // Only show the human-friendly, auto-generated Asset ID
        if (asset.assetId) return String(asset.assetId);
        // Sometimes the backend nests it in form data
        const fd = asset.formData || asset.customFields || {};
        const formKeys = ['assetId', 'Asset ID', 'AssetId', 'assetID', 'asset_id'];
        for (const key of formKeys) {
            const value = fd && fd[key];
            if (value != null && value !== '') return String(value);
        }
        return '';
    };

    const handleAddAsset = (newAssetData) => {
        // Handle the API response - the newAssetData will be the response from the server
        console.log('Asset added successfully:', newAssetData);
        
        // Refresh the assets list to show the new asset
        dispatch(fetchAllAssets());
        setIsModalOpen(false);
        
        // The success message is already shown in the modal
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Assigned': return 'bg-blue-100 text-blue-700';
            case 'In Stock': return 'bg-green-100 text-green-700';
            case 'Under Maintenance': return 'bg-yellow-100 text-yellow-700';
            case 'Scrapped': return 'bg-red-100 text-red-700';
            case 'No Status': return 'bg-gray-100 text-gray-600';
            case 'Loading...': return 'bg-gray-100 text-gray-500';
            case 'Unknown Status': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };
    
    return (
        <AssetManagementLayout>
            <div className="p-6">
                <header className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Asset Inventory</h1>
                        <p className="text-gray-600 mt-1">Manage and track all company assets</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                        <FaPlus /> Add New Asset
                    </button>
                </header>

                {/* Assets Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {assetsLoading && (
                        <div className="p-8 text-center">
                            <div className="text-blue-600">Loading assets...</div>
                        </div>
                    )}
                    {!assetsLoading && (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left p-4 font-semibold text-gray-700">Asset ID</th>
                                    <th className="text-left p-4 font-semibold text-gray-700">Asset Name</th>
                                    <th className="text-left p-4 font-semibold text-gray-700">Category</th>
                                    <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                                    <th className="text-left p-4 font-semibold text-gray-700">Location</th>
                                    <th className="text-left p-4 font-semibold text-gray-700">Assigned To</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.isArray(assets) && assets.length > 0 ? (
                                    assets.map((asset) => (
                                        <tr 
                                            key={asset.assetId || asset.id} 
                                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                                            onClick={() => router.push(`/asset-management/${asset.assetId}`)}
                                        >
                                            <td className="p-4 font-mono text-sm">{getAssetIdDisplay(asset)}</td>
                                            <td className="p-4 font-medium">
                                                {getAssetName(asset)}
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                {asset.categoryName || getCategoryName(asset.categoryId)}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(getStatusName(asset.statusLabelId))}`}>
                                                    {getStatusName(asset.statusLabelId)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                {asset.location || getLocationName(asset.locationId)}
                                            </td>
                                            <td className="p-4 text-gray-600">{asset.assignedTo || 'N/A'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-500">
                                            {assetsError ? 'Error loading assets' : 'No assets found'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Add Asset Modal */}
                <AddAssetModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleAddAsset}
                />
            </div>
        </AssetManagementLayout>
    );
};

export default withAuth(AssetManagementPage); 