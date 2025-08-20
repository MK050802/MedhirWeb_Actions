import React, { useState, useRef, useMemo, useEffect } from 'react';
import AssetManagementLayout from '@/components/AssetManagementLayout';
import { toast } from 'sonner';
import { FaPlus, FaTrash, FaListAlt, FaMapMarkedAlt, FaCheckSquare, FaFont, FaCog, FaQuestionCircle, FaTags, FaEdit, FaSave, FaTimes, FaArrowLeft, FaDatabase, FaFlask, FaClipboardList } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';

// Enhanced Redux imports
import { 
    fetchAssetCategories, 
    addAssetCategory, 
    updateAssetCategory, 
    batchUpdateAssetCategories, 
    deleteAssetCategory,
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
    fetchSubCategoriesByCategory,
    fetchSubCategoryById,
    updateCategoryLocal,
    updateSubCategoryLocal,
    addSubCategoryLocal,
    removeSubCategoryLocal
} from '@/redux/slices/assetCategorySlice';

import { 
    fetchAssetLocations, 
    addAssetLocation, 
    updateAssetLocation,
    deleteAssetLocation, 
    batchUpdateAssetLocations,
    updateLocationLocal
} from '@/redux/slices/assetLocationSlice';

import { 
    fetchAssetStatuses, 
    addAssetStatus, 
    updateAssetStatus,
    deleteAssetStatus, 
    batchUpdateAssetStatuses,
    fetchSystemDefaultStatuses,
    updateStatusLocal
} from '@/redux/slices/assetStatusSlice';

import { 
    fetchCustomForms,
    createCustomForm,
    updateCustomForm,
    deleteCustomForm,
    toggleFormStatus,
    setCurrentForm,
     clearCurrentForm,
     assignFormToSubCategory
} from '@/redux/slices/customFormsSlice';

import { 
    fetchIdFormattings, 
    addIdFormatting, 
    updateIdFormatting,
    deleteIdFormatting,
    previewNextAssetId,
    generateAssetId
} from '@/redux/slices/idFormattingSlice';

// Import asset management functions
import {
    fetchAllAssets,
    fetchAllAssetsDetailed,
    fetchAssetById,
    fetchAssetByAssetId,
    fetchAssetsByCategory,
    createAssetWithDTO,
    patchAssetByAssetId,
    deleteAsset,
    fetchAssetWithCustomForms,
    updateAssetCustomFields,
    validateAsset
} from '@/redux/slices/assetSlice';

// Import custom form management functions based on CustomFormController.java
import {
    fetchCustomForms as fetchCustomFormsNew,
    fetchCustomFormById,
    createCustomForm as createCustomFormNew,
    updateCustomForm as updateCustomFormNew,
    deleteCustomForm as deleteCustomFormNew,
    fetchFormFields,
    addFieldToForm,
    updateField,
    deleteField,
    assignFormToCategory,
    unassignFormFromCategory,
    fetchFormsByCategory,
    previewForm,
    duplicateForm,
    toggleFormStatus as toggleFormStatusNew,
    submitFormData,
    fetchFormDataForAsset,
    fetchAllFormDataForAsset,
    deleteFormData
} from '@/redux/slices/customFormSlice';

import axios from 'axios';
import getConfig from 'next/config';
import { getItemFromSessionStorage } from '@/redux/slices/sessionStorageSlice';

const { publicRuntimeConfig } = getConfig();

// Helper component for a consistent setting section layout
const SettingsSection = ({ title, subtitle, children }) => (
    <div>
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{subtitle}</p>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            {children}
        </div>
    </div>
);

// --- Individual Setting Components ---



const CategorySettings = ({ 
    editing, 
    editedCategories, 
    setEditedCategories, 
    newCategory, 
    setNewCategory, 
    onAdd, 
    onFieldChange, 
    loading, 
    onDelete, 
    onSave, 
    onCancel, 
    onAddSubCategory, 
    onEditSubCategory, 
    onDeleteSubCategory, 
    onSaveSubCategory, 
    onCancelSubCategory, 
    onFetchSubCategoriesByCategory,
    onFetchSubCategoryById,
    onAddIdFormat, 
    onEditIdFormat, 
    onDeleteIdFormat, 
    onSaveIdFormat, 
    onCancelIdFormat 
}) => {
    const isAddDisabled = !newCategory.name || loading;
    const [newSubCatFieldsByCategory, setNewSubCatFieldsByCategory] = useState({});
    
    console.log('CategorySettings rendered with categories:', editedCategories);
    console.log('Categories structure in CategorySettings:', editedCategories?.map(cat => ({
        id: cat.id,
        categoryId: cat.categoryId,
        name: cat.name,
        subCategoriesCount: cat.subCategories?.length || 0,
        subCategories: cat.subCategories
    })));
    
    // Helper function to get first 3 letters of a string
    const getFirstThreeLetters = (str) => {
        return str ? str.substring(0, 3).toUpperCase() : '';
    };
    
    // Helper function to generate auto ID for sub-category (4-digit sequence)
    const generateAutoId = (categoryName, subCategoryName, startNumber = 1) => {
        const categoryCode = getFirstThreeLetters(categoryName);
        const subCategoryCode = getFirstThreeLetters(subCategoryName);
        const number = startNumber.toString().padStart(4, '0');
        return `${categoryCode}-${subCategoryCode}-${number}`;
    };

    const formatSuffix = (value) => {
        const onlyDigits = String(value ?? '').replace(/\D/g, '').slice(0, 4);
        const numeric = parseInt(onlyDigits || '1', 10);
        return numeric.toString().padStart(4, '0');
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 -mt-4">

            
            {/* Step 1: Add New Category */}
            <div className="flex items-end gap-4 mb-6 w-full max-w-3xl mx-auto">
                <input 
                    value={newCategory.name} 
                    onChange={e => setNewCategory({...newCategory, name: e.target.value})} 
                    placeholder="New Category Name (e.g., IT Equipment)" 
                    className="flex-1 min-w-[220px] p-3 border rounded-md text-base" 
                />
                <button 
                    onClick={onAdd} 
                    className={`px-7 py-3 bg-blue-600 text-white rounded-md whitespace-nowrap text-base font-semibold shadow-sm transition-all duration-150 ${isAddDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isAddDisabled}
                >
                    <FaPlus className="inline mr-1" /> Add Category
                </button>
            </div>
            
            {loading && <div className="text-blue-600 mb-4">Loading...</div>}
            
            {/* Step 2: Category Cards with Sub-Categories */}
            <div className="space-y-6">
                {editedCategories.map(cat => {
                    const categoryId = cat.id || cat.categoryId;
                    const subCategories = cat.subCategories || [];
                    const categoryCode = getFirstThreeLetters(cat.name);
                    
                    console.log(`Rendering category ${cat.name} with subcategories:`, subCategories);
                    
                    return (
                        <div key={categoryId} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                            {/* Category Header */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    {cat.editing ? (
                                        <div className="flex items-center gap-3">
                                            <input
                                                className="text-xl font-bold text-gray-800 border border-blue-300 rounded px-3 py-1 bg-white"
                                                value={cat.name}
                                                onChange={e => onFieldChange(categoryId, 'name', e.target.value)}
                                                placeholder="Category name"
                                                autoFocus
                                            />
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-mono rounded">
                                                {getFirstThreeLetters(cat.name)}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-bold text-gray-800">{cat.name}</h3>
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-mono rounded">
                                                {categoryCode}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {cat.editing ? (
                                        <>
                                            <button
                                                onClick={() => onSave(categoryId)}
                                                className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded"
                                                title="Save Changes"
                                            >
                                                <FaSave />
                                            </button>
                                            <button
                                                onClick={() => onCancel(categoryId)}
                                                className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-50 rounded"
                                                title="Cancel"
                                            >
                                                <FaTimes />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => onFieldChange(categoryId, 'editing', true)}
                                                className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded"
                                                title="Edit Category"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded"
                                                title="Delete Category"
                                                onClick={() => onDelete(categoryId, cat.name)}
                                            >
                                                <FaTrash />
                                            </button>

                                        </>
                                    )}
                                </div>
                            </div>
                            
                        {/* Add Sub-Category Input */}
            <div className="mb-6">
                {(() => {
                    const current = newSubCatFieldsByCategory[categoryId] || { name: '', prefix: '', suffix: '' };
                    const setField = (key, val) => {
                        setNewSubCatFieldsByCategory(prev => ({
                            ...prev,
                            [categoryId]: { ...(prev[categoryId] || {}), [key]: val }
                        }));
                    };
                    const sanitizePrefix = (val) => val; // allow arbitrary prefix
                    const sanitizeSuffix = (val) => val.replace(/\D/g, '').slice(0, 4);
                    const isValidPrefix = () => Boolean((current.prefix || '').trim());
                    const isValid = current.name?.trim() && isValidPrefix() && (current.suffix && /\d+/.test(current.suffix));
                    const previewSuffix = (current.suffix && current.suffix.length > 0) ? String(Math.max(1, Math.min(9999, parseInt(current.suffix, 10)))).padStart(4, '0') : '0001';
                    const previewPrefix = (current.prefix || '').trim();
                    const fullPreview = previewPrefix && current.suffix ? `${previewPrefix}-${previewSuffix}` : '';
                    return (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Sub-Category Name</label>
                                    <input
                                        value={current.name}
                                        onChange={(e) => setField('name', e.target.value)}
                                        placeholder="e.g., Laptop, Monitor, Printer"
                                        className="w-full p-3 border border-gray-300 rounded-md text-base"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Asset ID Prefix ({categoryCode}-{getFirstThreeLetters(current.name)})</label>
                                    <input
                                        value={current.prefix}
                                        onChange={(e) => setField('prefix', sanitizePrefix(e.target.value))}
                                        placeholder="CAT-SUB"
                                        className="w-full p-3 border border-gray-300 rounded-md text-base font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Suffix (4 digits)</label>
                                    <input
                                        value={current.suffix}
                                        onChange={(e) => setField('suffix', sanitizeSuffix(e.target.value))}
                                        placeholder="0001"
                                        className="w-full p-3 border border-gray-300 rounded-md text-base font-mono"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    {fullPreview ? (
                                        <span>Preview: <span className="font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">{fullPreview}</span></span>
                                    ) : (
                                        <span className="text-gray-400">Enter prefix and suffix to see preview</span>
                                    )}
                                </div>
                                <button
                                    onClick={async () => {
                                        const payload = {
                                            name: (current.name || '').trim(),
                                            prefix: (current.prefix || '').trim(),
                                            suffix: current.suffix
                                        };
                                        if (!payload.name || !isValidPrefix() || !payload.suffix) return;
                                        try {
                                            await onAddSubCategory(categoryId, payload);
                                            setNewSubCatFieldsByCategory(prev => ({ ...prev, [categoryId]: { name: '', prefix: '', suffix: '' } }));
                                        } catch (e) {
                                            // Keep inputs for correction
                                        }
                                    }}
                                    disabled={!isValid || loading}
                                    className={`px-6 py-3 rounded-md flex items-center gap-2 font-medium ${(!isValid || loading) ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                                >
                                    <FaPlus /> Create Sub-Category
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </div>
                            
                            {/* Sub-Categories Table */}
                            {subCategories.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-semibold text-gray-800 mb-3">Sub-Categories</h4>
                                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="text-left p-3 font-medium text-gray-700">Sub-Category Name</th>
                                                    <th className="text-left p-3 font-medium text-gray-700">
                                                        <div className="flex items-center gap-2">
                                                            <span>Asset ID</span>
                                                            <button
                                                                className="text-gray-400 hover:text-gray-600 p-1"
                                                                title="Asset IDs are automatically generated and can be edited after asset creation. Format: [Category Code]-[Sub-Category Code]-[Number]"
                                                            >
                                                                <FaQuestionCircle className="text-xs" />
                                                            </button>
                                                        </div>
                                                    </th>
                                                    <th className="text-left p-3 font-medium text-gray-700">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                    {subCategories.map((subCat, index) => {
                                                    console.log(`Rendering subcategory:`, subCat);
                                                    return (
                                                    <tr key={subCat.id || subCat.subCategoryId} className="border-t border-gray-200 hover:bg-gray-50">
                                                        <td className="p-3">
                                                            {subCat.editing ? (
                                                                <input
                                                                    className="w-full p-2 border rounded-md text-sm"
                                                                    value={subCat.name}
                                                                    onChange={e => onEditSubCategory(categoryId, subCat.id || subCat.subCategoryId, 'name', e.target.value)}
                                                                    placeholder="Sub-category name"
                                                                    autoFocus
                                                                />
                                                            ) : (
                                                                <span className="font-medium">{subCat.name || 'NO NAME'}</span>
                                                            )}
                                                        </td>
                                                                                                                <td className="p-3">
                                                            <div className="flex items-center gap-2">
                                                                {(() => {
                                                                     const prefixBase = (subCat.prefix && String(subCat.prefix).trim())
                                                                         ? String(subCat.prefix).trim()
                                                                         : `${getFirstThreeLetters(cat.name)}-${getFirstThreeLetters(subCat.name)}`;
                                                                     const prefix = `${prefixBase}-`;
                                                                     const suffix = subCat.suffix || '0001';
                                                                     return (
                                                                        <div className="flex items-center gap-1">
                                                                            {subCat.editing ? (
                                                                                <input
                                                                                    className="w-20 font-mono text-sm border border-blue-300 rounded-l px-2 py-1"
                                                                                    value={subCat.prefix || prefixBase}
                                                                                    placeholder="CAT-SUB"
                                                                                    onChange={(e) => {
                                                                                        onEditSubCategory(
                                                                                            categoryId,
                                                                                            subCat.id || subCat.subCategoryId,
                                                                                            'prefix',
                                                                                            e.target.value
                                                                                        );
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <span className="font-mono text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-l select-none">
                                                                                    {prefix}
                                                                                </span>
                                                                            )}
                                                                            <span className="font-mono text-sm bg-blue-100 text-blue-800 px-1 py-1 select-none">-</span>
                                                                            {subCat.editing ? (
                                                                                <input
                                                                                    className="w-16 font-mono text-sm border border-blue-300 rounded-r px-2 py-1"
                                                                                    value={suffix}
                                                                                    placeholder="0001"
                                                                                    maxLength={4}
                                                                                    onChange={(e) => {
                                                                                        const raw = e.target.value;
                                                                                        const digits = raw.replace(/\D/g, '').slice(0, 4);
                                                                                        onEditSubCategory(
                                                                                            categoryId,
                                                                                            subCat.id || subCat.subCategoryId,
                                                                                            'suffix',
                                                                                            digits
                                                                                        );
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <span className="font-mono text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-r">
                                                                                    {suffix}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}
                                                                <button
                                                                    className="text-gray-400 hover:text-gray-600 p-1"
                                                                    title="Asset ID Format: CAT-SUB-0001. You can manually set the last 4 digits per sub-category while editing."
                                                                >
                                                                    <FaQuestionCircle className="text-xs" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="flex items-center gap-2">
                                                                {subCat.editing ? (
                                                                    <>
                                                                        <button
                                                                            onClick={() => onSaveSubCategory(categoryId, subCat.id || subCat.subCategoryId)}
                                                                            className="text-green-600 hover:text-green-800 p-1"
                                                                            title="Save"
                                                                        >
                                                                            <FaSave />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => onCancelSubCategory(categoryId, subCat.id || subCat.subCategoryId)}
                                                                            className="text-gray-600 hover:text-gray-800 p-1"
                                                                            title="Cancel"
                                                                        >
                                                                            <FaTimes />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            onClick={() => onEditSubCategory(categoryId, subCat.id || subCat.subCategoryId, 'editing', true)}
                                                                            className="text-blue-600 hover:text-blue-800 p-1"
                                                                            title="Edit"
                                                                        >
                                                                            <FaEdit />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => onDeleteSubCategory(categoryId, subCat.id || subCat.subCategoryId)}
                                                                            className="text-red-500 hover:text-red-700 p-1"
                                                                            title="Delete"
                                                                        >
                                                                            <FaTrash />
                                                                        </button>

                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );})}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            
                            {/* Empty State */}
                            {subCategories.length === 0 && (
                                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                                    <div className="text-4xl mb-2">📋</div>
                                    <h4 className="text-lg font-semibold mb-2">No sub-categories yet</h4>
                                    <p className="text-sm">Add your first sub-category above to get started</p>
                                </div>
                            )}
                            

                        </div>
                    );
                })}
                
                {/* Empty State for Categories */}
                {editedCategories.length === 0 && (
                    <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                        <div className="text-4xl mb-4">📁</div>
                        <h4 className="text-lg font-semibold mb-2">No categories yet</h4>
                        <p className="text-sm mb-4">Create your first category to get started</p>
                        <button
                            onClick={() => {
                                const input = document.querySelector('input[placeholder="New Category Name (e.g., IT Equipment)"]');
                                if (input) input.focus();
                            }}
                            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                        >
                            Create Your First Category
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const LocationSettings = ({ editing, editedLocations, setEditedLocations, newLocation, setNewLocation, onAdd, onFieldChange, loading, onDelete, onSave, onCancel }) => {
    const isAddDisabled = !newLocation.name || loading;
    return (
        <SettingsSection title="Asset Locations" subtitle="Manage the physical locations where assets are stored or assigned.">
            <div className="flex items-end gap-4 mb-4 w-full max-w-3xl mx-auto">
                <input 
                    value={newLocation.name} 
                    onChange={e => setNewLocation({...newLocation, name: e.target.value})} 
                    placeholder="New Location Name (e.g., Mumbai Office)" 
                    className="flex-1 min-w-[220px] p-3 border rounded-md text-base" 
                />
                <input 
                    value={newLocation.address} 
                    onChange={e => setNewLocation({...newLocation, address: e.target.value})} 
                    placeholder="Address (Optional)" 
                    className="w-56 p-3 border rounded-md text-base" 
                />
                <button 
                    onClick={onAdd} 
                    className={`px-7 py-3 bg-blue-600 text-white rounded-md whitespace-nowrap text-base font-semibold shadow-sm transition-all duration-150 ${isAddDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isAddDisabled}
                >
                    <FaPlus className="inline mr-1" /> Add
                </button>
            </div>
            {loading && <div className="text-blue-600">Loading...</div>}
            <div className="space-y-2">
                {editedLocations.map(loc => (
                    <div key={loc.id || loc.locationId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div className="flex-1 flex gap-2 items-center">
                            {loc.editing ? (
                                <>
                                    <input
                                        className="flex-1 p-2 border rounded-md"
                                        value={loc.name}
                                        onChange={e => onFieldChange(loc.id || loc.locationId, 'name', e.target.value)}
                                        placeholder="Location name"
                                        autoFocus
                                    />
                                    <input
                                        className="flex-1 p-2 border rounded-md"
                                        value={loc.address}
                                        onChange={e => onFieldChange(loc.id || loc.locationId, 'address', e.target.value)}
                                        placeholder="Address (optional)"
                                    />
                                </>
                            ) : (
                                <span className="flex-1">{loc.name}{loc.address && ` - ${loc.address}`}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {loc.editing ? (
                                <>
                                    <button
                                        onClick={() => onSave(loc.id || loc.locationId)}
                                        className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded"
                                        title="Save Changes"
                                    >
                                        <FaSave />
                                    </button>
                                    <button
                                        onClick={() => onCancel(loc.id || loc.locationId)}
                                        className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-50 rounded"
                                        title="Cancel"
                                    >
                                        <FaTimes />
                                    </button>
                                </>
                            ) : (
                                <>
                                <button
                                        onClick={() => onFieldChange(loc.id || loc.locationId, 'editing', true)}
                                        className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded"
                                    title="Edit Location"
                                >
                                    <FaEdit />
                                </button>
                            <button
                                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded"
                                title="Delete Location"
                                onClick={() => onDelete(loc.locationId || loc.id, loc.name)}
                            >
                                <FaTrash />
                            </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </SettingsSection>
    );
};

const StatusSettings = ({ editing, editedStatuses, setEditedStatuses, newStatus, setNewStatus, onAdd, onFieldChange, loading, onDelete, onSave, onCancel }) => {
    const isAddDisabled = !newStatus.name || loading;
    return (
        <SettingsSection title="Asset Status Labels" subtitle="Customize the lifecycle statuses for your assets.">
            <div className="flex items-end gap-4 mb-4 w-full max-w-2xl mx-auto">
                <input 
                    value={newStatus.name} 
                    onChange={e => setNewStatus({ name: e.target.value })} 
                    placeholder="New Status Name (e.g., In Transit)" 
                    className="flex-1 min-w-[220px] p-3 border rounded-md text-base" 
                />
                <button 
                    onClick={onAdd} 
                    className={`px-7 py-3 bg-blue-600 text-white rounded-md whitespace-nowrap text-base font-semibold shadow-sm transition-all duration-150 ${isAddDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isAddDisabled}
                >
                    <FaPlus className="inline mr-1" /> Add
                </button>
            </div>
            {loading && <div className="text-blue-600">Loading...</div>}
            <div className="space-y-2">
                {editedStatuses.map(s => {
                    // Debug: Log the status object structure
                    console.log('Status object:', s);
                    return (
                        <div key={s.statusLabelId || s.statusId || s.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div className="flex-1 flex gap-2 items-center">
                                {s.editing ? (
                                    <input
                                        className="flex-1 p-2 border rounded-md"
                                        value={s.name}
                                        onChange={e => {
                                            // Use the correct ID field - prioritize statusLabelId, then statusId, then id
                                            const statusIdToUse = s.statusLabelId || s.statusId || s.id;
                                            onFieldChange(statusIdToUse, 'name', e.target.value);
                                        }}
                                        placeholder="Status name"
                                        autoFocus
                                    />
                                ) : (
                                    <span className="flex-1">{s.name}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {s.editing ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                console.log('=== SAVE BUTTON CLICKED ===');
                                                console.log('Status being saved:', s);
                                                // Use the correct ID field - prioritize statusLabelId, then statusId, then id
                                                const statusIdToUse = s.statusLabelId || s.statusId || s.id;
                                                console.log('Status ID being passed:', statusIdToUse);
                                                console.log('onSave function:', onSave);
                                                onSave(statusIdToUse);
                                            }}
                                            className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded"
                                            title="Save Changes"
                                        >
                                            <FaSave />
                                        </button>
                                        <button
                                            onClick={() => {
                                                // Use the correct ID field - prioritize statusLabelId, then statusId, then id
                                                const statusIdToUse = s.statusLabelId || s.statusId || s.id;
                                                onCancel(statusIdToUse);
                                            }}
                                            className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-50 rounded"
                                            title="Cancel"
                                        >
                                            <FaTimes />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                    <button
                                            onClick={() => {
                                                console.log('=== EDIT BUTTON CLICKED ===');
                                                console.log('Status being edited:', s);
                                                // Use the correct ID field - prioritize statusLabelId, then statusId, then id
                                                const statusIdToUse = s.statusLabelId || s.statusId || s.id;
                                                console.log('Status ID being passed:', statusIdToUse);
                                                console.log('onFieldChange function:', onFieldChange);
                                                onFieldChange(statusIdToUse, 'editing', true);
                                            }}
                                            className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded"
                                        title="Edit Status"
                                    >
                                        <FaEdit />
                                    </button>
                                <button
                                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded"
                                    title="Delete Status Label"
                                            onClick={() => {
                                                // Use the correct ID field - prioritize statusLabelId, then statusId, then id
                                                const statusIdToUse = s.statusLabelId || s.statusId || s.id;
                                                onDelete(statusIdToUse, s.name);
                                            }}
                                >
                                    <FaTrash />
                                </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </SettingsSection>
    );
};

// Enhanced Custom Form Builder Component with proper Redux integration
const CustomFormBuilder = ({ editing, onDeleteForm }) => {
    const dispatch = useDispatch();
    const { categories, loading: categoriesLoading } = useSelector(state => state.assetCategories);
    const { forms, currentForm, loading: formsLoading, creating: creatingForm, updating: updatingForm } = useSelector(state => state.customForms);
    
    const [view, setView] = useState('list'); // 'list', 'create', 'edit'
    const [editingFormId, setEditingFormId] = useState(null);
    const [formName, setFormName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Load forms and categories on component mount
    useEffect(() => {
        dispatch(fetchCustomForms());
        dispatch(fetchAssetCategories()); // Always load categories upfront
    }, [dispatch]);

    // Load categories for form creation (backup)
    useEffect(() => {
        if (view === 'create' || view === 'edit') {
            dispatch(fetchAssetCategories());
        }
    }, [view, dispatch]);

    // Compute sub-categories for the selected category
    const subCategoriesForSelectedCategory = useMemo(() => {
        if (!selectedCategory) return [];
        const matchingCategory = categories.find(cat => 
            cat.categoryId === selectedCategory || cat.id === selectedCategory
        );
        return matchingCategory?.subCategories || [];
    }, [selectedCategory, categories]);

    // When category changes, clear sub-category if it doesn't belong to the category
    useEffect(() => {
        if (!selectedCategory) {
            setSelectedSubCategory('');
            return;
        }
        const exists = subCategoriesForSelectedCategory.some(sub => {
            const id = sub.subCategoryId || sub.id;
            return String(id) === String(selectedSubCategory);
        });
        if (!exists) setSelectedSubCategory('');
    }, [selectedCategory, subCategoriesForSelectedCategory]);

    // Ensure selectedCategory is properly set when editing and categories are loaded
    useEffect(() => {
        if (view === 'edit' && editingFormId && categories.length > 0) {
            const form = forms.find(f => f.id === editingFormId || f.formId === editingFormId);
            const formCategoryId = form?.categoryId || form?.assignedCategoryId;
            
            if (form && formCategoryId) {
                console.log('Setting selectedCategory from form data:', {
                    formCategoryId: form.categoryId,
                    formAssignedCategoryId: form.assignedCategoryId,
                    actualCategoryId: formCategoryId,
                    currentSelectedCategory: selectedCategory,
                    availableCategories: categories.map(c => ({ id: c.id, categoryId: c.categoryId, name: c.name }))
                });
                
                // Find matching category ID (form category might match either cat.id or cat.categoryId)
                const matchingCategory = categories.find(cat => 
                    cat.categoryId === formCategoryId || cat.id === formCategoryId
                );
                
                if (matchingCategory) {
                    const categoryIdToUse = matchingCategory.categoryId || matchingCategory.id;
                    console.log('Found matching category, setting selectedCategory to:', categoryIdToUse);
                    setSelectedCategory(categoryIdToUse);
                } else {
                    console.warn('No matching category found for form categoryId:', formCategoryId);
                    // Still set it in case it's valid but not found due to timing
                    setSelectedCategory(formCategoryId);
                }
                // Attempt to set sub-category from form if available
                const formSubCatId = form?.subCategoryId || form?.assignedSubCategoryId || form?.subCategory?.id;
                if (formSubCatId) {
                    setSelectedSubCategory(formSubCatId);
                } else {
                    setSelectedSubCategory('');
                }
            }
        }
    }, [view, editingFormId, categories, forms]);

    // Ensure fields are properly mapped when form data is available
    useEffect(() => {
        if (view === 'edit' && editingFormId && forms.length > 0) {
            const form = forms.find(f => f.id === editingFormId || f.formId === editingFormId);
            if (form && form.fields && form.fields.length > 0) {
                const currentFieldsCount = fields.length;
                const apiFieldsCount = form.fields.length;
                
                console.log('Checking fields mapping:', {
                    currentFieldsCount,
                    apiFieldsCount,
                    hasFieldsMismatch: currentFieldsCount !== apiFieldsCount,
                    currentFields: fields,
                    apiFields: form.fields
                });
                
                // If fields count doesn't match, re-map the fields
                if (currentFieldsCount !== apiFieldsCount) {
                    console.log('Re-mapping fields due to count mismatch');
                    const mappedFields = mapApiFieldsToFrontend(form.fields);
                    setFields(mappedFields);
                }
            } else if (form && (!form.fields || form.fields.length === 0)) {
                console.log('Form has no fields, clearing fields state');
                setFields([]);
            }
        }
    }, [view, editingFormId, forms]);

    // Monitor fields state changes for debugging
    useEffect(() => {
        console.log('Fields state changed:', {
            fieldsCount: fields.length,
            fields: fields.map(f => ({ id: f.id, name: f.name, type: f.type }))
        });
    }, [fields]);

    const handleNewForm = () => {
        setView('create');
        setFormName('');
        setSelectedCategory('');
        setSelectedSubCategory('');
        setFields([]);
        setError('');
        dispatch(clearCurrentForm());
    };

    // Helper function to map API fields to frontend format
    const mapApiFieldsToFrontend = (apiFields) => {
        if (!apiFields || !Array.isArray(apiFields)) {
            console.log('No API fields to map, returning empty array');
            return [];
        }
        
        console.log('Mapping API fields:', apiFields);
        
        const mappedFields = apiFields.map((apiField, index) => {
            const mappedField = {
                id: apiField.id || `field_${Date.now()}_${index}_${Math.random()}`,
                name: apiField.fieldLabel || apiField.fieldName || apiField.name || '',
                type: apiField.fieldType || apiField.type || 'text',
                required: Boolean(apiField.required),
                placeholder: apiField.defaultValue || apiField.placeholder || '',
                options: []
            };

            // Handle dropdown options
            if (apiField.options && Array.isArray(apiField.options)) {
                mappedField.options = apiField.options.map((opt, optIndex) => ({
                    id: `option_${Date.now()}_${optIndex}_${Math.random()}`,
                    value: typeof opt === 'string' ? opt : opt.value || opt.label || ''
                }));
            }

            console.log('Mapped API field:', { original: apiField, mapped: mappedField });
            return mappedField;
        });
        
        console.log('Total mapped fields:', mappedFields.length);
        return mappedFields;
    };

    const handleEditForm = (formId) => {
        const form = forms.find(f => f.id === formId || f.formId === formId);
        console.log('handleEditForm called with:', { formId, form, categoriesCount: categories?.length });
        if (form) {
            setView('edit');
            setEditingFormId(formId);
            setFormName(form.name);
            // Use assignedCategoryId if categoryId is null/empty
            const categoryToUse = form.categoryId || form.assignedCategoryId || '';
            setSelectedCategory(categoryToUse);
            
            // Map API fields to frontend format and ensure proper state update
            const mappedFields = mapApiFieldsToFrontend(form.fields || []);
            
            // Clear any existing fields first, then set new ones
            setFields([]);
            
            // Use setTimeout to ensure state is cleared before setting new fields
            setTimeout(() => {
                setFields(mappedFields);
                console.log('Fields set after edit:', mappedFields);
            }, 0);
            
            setError('');
            dispatch(setCurrentForm(form));
            
            console.log('Form details set:', {
                formName: form.name,
                categoryId: form.categoryId,
                assignedCategoryId: form.assignedCategoryId,
                categoryToUse: categoryToUse,
                fieldsCount: form.fields?.length || 0,
                originalFields: form.fields,
                mappedFields: mappedFields
            });
            
            // Ensure categories are loaded if not already
            if (!categories || categories.length === 0) {
                console.log('Loading categories as they are not available');
                dispatch(fetchAssetCategories());
            }
        }
    };

    const handleBackToList = () => {
        setView('list');
        setEditingFormId(null);
        setFormName('');
        setSelectedCategory('');
        setSelectedSubCategory('');
        setFields([]);
        setError('');
        dispatch(clearCurrentForm());
    };

    const handleToggleFormStatus = async (formId) => {
        try {
            const form = forms.find(f => f.id === formId);
            if (form) {
                await dispatch(toggleFormStatus({ 
                    formId, 
                    enabled: !form.enabled 
                })).unwrap();
                toast.success("Form status updated successfully!");
            }
        } catch (error) {
            console.error('Error toggling form status:', error);
            toast.error("Failed to update form status");
        }
    };



    const addField = () => {
        console.log('addField called. Current fields count:', fields.length);
        
        // Check if we've reached the maximum limit of 15 fields
        if (fields.length >= 15) {
            toast.error("Maximum limit of 15 fields reached. Please remove some fields before adding new ones.");
            return;
        }
        
        // Generate a unique ID using timestamp + random number to avoid conflicts
        const newField = {
            id: `field_${Date.now()}_${Math.random()}`,
            name: '',
            type: 'text',
            required: false,
            placeholder: '',
            options: []
        };
        
        console.log('Creating new field:', newField);
        
        // Use functional update to ensure we're working with the latest state
        setFields(prevFields => {
            const updatedFields = [...prevFields, newField];
            console.log('Added new field. Previous count:', prevFields.length, 'New count:', updatedFields.length);
            return updatedFields;
        });
    };

    const removeField = (fieldId) => {
        console.log('Removing field with ID:', fieldId);
        const updatedFields = fields.filter(field => field.id !== fieldId);
        console.log('Updated fields after removal:', updatedFields);
        setFields(updatedFields);
    };

    const updateField = (fieldId, key, value) => {
        console.log('Updating field:', { fieldId, key, value });
        const updatedFields = fields.map(field => 
            field.id === fieldId ? { ...field, [key]: value } : field
        );
        console.log('Updated fields after field update:', updatedFields);
        setFields(updatedFields);
    };

    const addDropdownOption = (fieldId) => {
        setFields(fields.map(field => 
            field.id === fieldId 
                ? { 
                    ...field, 
                    options: [...field.options, { id: Date.now(), value: '' }] 
                } 
                : field
        ));
    };

    const removeDropdownOption = (fieldId, optionId) => {
        setFields(fields.map(field => 
            field.id === fieldId 
                ? { 
                    ...field, 
                    options: field.options.filter(opt => opt.id !== optionId) 
                } 
                : field
        ));
    };

    const updateDropdownOption = (fieldId, optionId, value) => {
        setFields(fields.map(field => 
            field.id === fieldId 
                ? { 
                    ...field, 
                    options: field.options.map(opt => 
                        opt.id === optionId ? { ...opt, value } : opt
                    ) 
                } 
                : field
        ));
    };

    const handleSaveForm = async () => {
        if (!formName || !formName.trim()) {
            setError('Form name is required');
            return;
        }

        if (!selectedCategory) {
            setError('Please select a category');
            return;
        }

        // Additional validation for category
        if (!selectedCategory || selectedCategory.trim() === '') {
            setError('Category is required and cannot be empty');
            return;
        }

        // Log the selected category for debugging
        console.log('Selected category validation:', {
            selectedCategory,
            trimmed: selectedCategory?.trim(),
            isEmpty: !selectedCategory || selectedCategory.trim() === '',
            type: typeof selectedCategory
        });

        if (fields.length === 0) {
            setError('At least one field is required');
            return;
        }

        // Validate fields
        for (let field of fields) {
            if (!field.name || !field.name.trim()) {
                setError('All fields must have a name');
                return;
            }
            if (field.type === 'dropdown' && field.options.length === 0) {
                setError('Dropdown fields must have at least one option');
                return;
            }
            
            // Additional validation for dropdown options
            if (field.type === 'dropdown' && field.options.length > 0) {
                const invalidOptions = field.options.filter(opt => !opt.value || !opt.value.trim());
                if (invalidOptions.length > 0) {
                    setError(`Dropdown field "${field.name}" has empty options`);
                    return;
                }
                
                // Check for duplicate option values
                const optionValues = field.options.map(opt => opt.value.trim());
                const uniqueOptionValues = new Set(optionValues);
                if (optionValues.length !== uniqueOptionValues.size) {
                    setError(`Dropdown field "${field.name}" has duplicate option values`);
                    return;
                }
            }
        }

        // Additional validation for field names
        const fieldNames = fields.map(f => f.name.trim()).filter(Boolean);
        const uniqueFieldNames = new Set(fieldNames);
        if (fieldNames.length !== uniqueFieldNames.size) {
            setError('Field names must be unique');
            return;
        }

        // Check for empty or invalid field names
        const invalidFields = fields.filter(f => !f.name || !f.name.trim() || f.name.trim().length === 0);
        if (invalidFields.length > 0) {
            setError(`Invalid field names found: ${invalidFields.map(f => f.name || 'unnamed').join(', ')}`);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formData = {
                name: formName.trim(),
                categoryId: selectedCategory,
                enabled: true,
                fields: fields.map(field => ({
                    name: field.name.trim(),
                    type: field.type,
                    required: field.required,
                    placeholder: field.placeholder || '',
                    ...(field.type === 'dropdown' && { 
                        options: field.options.map(opt => opt.value.trim()) 
                    })
                })),
                ...(selectedSubCategory ? { subCategoryId: selectedSubCategory } : {})
            };
            
            // Debug logging to understand what's being sent
            console.log('Form data being sent to API:', JSON.stringify(formData, null, 2));
            console.log('Fields structure:', JSON.stringify(fields, null, 2));
            console.log('Selected category:', selectedCategory);
            console.log('Selected sub-category:', selectedSubCategory);
            
            let savedFormId = editingFormId;
            if (editingFormId) {
                console.log('Updating existing form with ID:', editingFormId);
                const updated = await dispatch(updateCustomForm({ 
                    formId: editingFormId, 
                    formData 
                })).unwrap();
                savedFormId = updated?.id || editingFormId;
                toast.success("Form updated successfully!");
            } else {
                console.log('Creating new form');
                const created = await dispatch(createCustomForm(formData)).unwrap();
                savedFormId = created?.id || created?.formId;
                toast.success("Form created successfully!");
            }

            // Assign to sub-category via dedicated endpoint if provided
            if (savedFormId && selectedSubCategory) {
                try {
                    await dispatch(assignFormToSubCategory({ formId: savedFormId, subCategoryId: selectedSubCategory })).unwrap();
                    toast.success("Sub-category assigned to form");
                } catch (e) {
                    console.error('Failed to assign sub-category:', e);
                    toast.error("Failed to assign sub-category");
                }
            }
            
            // Return to listing view
            handleBackToList();
            
        } catch (error) {
            console.error('Error saving form:', error);
            
            // Extract more specific error information
            let errorMessage = 'Failed to save form. Please try again.';
            
            if (error?.message) {
                errorMessage = error.message;
            } else if (error?.error) {
                errorMessage = error.error;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            
            // Log detailed error information
            console.error('Detailed error info:', {
                error,
                message: error?.message,
                errorData: error?.error,
                response: error?.response,
                status: error?.response?.status,
                data: error?.response?.data
            });
            
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Render field input based on type
    const renderFieldInput = (field) => {
        switch (field.type) {
            case 'dropdown':
                return (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Options:</span>
                            <button
                                type="button"
                                onClick={() => addDropdownOption(field.id)}
                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                + Add Option
                            </button>
                        </div>
                        <div className="space-y-1">
                            {field.options.map(option => (
                                <div key={option.id} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={option.value}
                                        onChange={(e) => updateDropdownOption(field.id, option.id, e.target.value)}
                                        placeholder="Option value"
                                        className="flex-1 p-2 text-sm border rounded"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeDropdownOption(field.id, option.id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'textarea':
                return (
                    <input
                        type="text"
                        value={field.placeholder || ''}
                        onChange={(e) => updateField(field.id, 'placeholder', e.target.value)}
                        placeholder="Placeholder text (optional)"
                        className="w-full p-2 text-sm border rounded"
                    />
                );
            default:
                return (
                    <input
                        type="text"
                        value={field.placeholder || ''}
                        onChange={(e) => updateField(field.id, 'placeholder', e.target.value)}
                        placeholder="Placeholder text (optional)"
                        className="w-full p-2 text-sm border rounded"
                    />
                );
        }
    };

    // Render preview of the form
    const renderFormPreview = () => {
        if (fields.length === 0) {
            return (
                <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📝</div>
                    <p>Add fields to see a preview of your form</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 mb-4">Form Preview</h4>
                <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
                    <h3 className="text-xl font-bold text-gray-800">{formName || 'Untitled Form'}</h3>
                    {fields.map(field => (
                        <div key={field.id} className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                {field.name}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            {field.type === 'text' && (
                                <input
                                    type="text"
                                    placeholder={field.placeholder}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    disabled
                                />
                            )}
                            {field.type === 'number' && (
                                <input
                                    type="number"
                                    placeholder={field.placeholder}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    disabled
                                />
                            )}
                            {field.type === 'date' && (
                                <input
                                    type="date"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    disabled
                                />
                            )}
                            {field.type === 'file' && (
                                <input
                                    type="file"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    disabled
                                />
                            )}
                            {field.type === 'dropdown' && (
                                <select className="w-full p-2 border border-gray-300 rounded-md" disabled>
                                    <option value="">Select an option...</option>
                                    {field.options.map((option, index) => (
                                        <option key={index} value={option.value}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {field.type === 'checkbox' && (
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300"
                                        disabled
                                    />
                                    <span className="text-sm text-gray-700">{field.placeholder || 'Check this option'}</span>
                                </label>
                            )}
                            {field.type === 'textarea' && (
                                <textarea
                                    placeholder={field.placeholder}
                                    rows={3}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    disabled
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <SettingsSection title="Custom Form Builder" subtitle="Create dynamic forms for data collection across different categories.">
            {view === 'list' ? (
                // Form Listing View
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">📋 Form Listing</h3>
                        <button
                            onClick={handleNewForm}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                        >
                            <FaPlus /> New Form
                        </button>
                    </div>

                    {formsLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading forms...</p>
                        </div>
                    ) : forms.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <div className="text-4xl mb-4">📝</div>
                            <h4 className="text-lg font-semibold mb-2">No forms created yet</h4>
                            <p className="mb-4">Create your first custom form to get started</p>
                            <button
                                onClick={handleNewForm}
                                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Create Your First Form
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left p-4 font-semibold text-gray-700">Form Name</th>
                                        <th className="text-left p-4 font-semibold text-gray-700">Assigned Category</th>
                                        <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                                        <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {forms.map((form) => (
                                        <tr 
                                            key={form.id || form.formId} 
                                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                                            onClick={() => handleEditForm(form.id || form.formId)}
                                        >
                                            <td className="p-4 font-medium">{form.name}</td>
                                            <td className="p-4 text-gray-600">
                                                {(() => {
                                                    const formCategoryId = form.categoryId || form.assignedCategoryId;
                                                    const matchingCategory = categories.find(cat => 
                                                        cat.categoryId === formCategoryId || cat.id === formCategoryId
                                                    );
                                                    return matchingCategory?.name || formCategoryId || 'No Category';
                                                })()}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    form.enabled
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {form.enabled ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditForm(form.id || form.formId);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-800"
                                                        title="Edit Form"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleFormStatus(form.id || form.formId);
                                                        }}
                                                        className={`text-sm px-2 py-1 rounded ${
                                                            form.enabled
                                                                ? 'text-orange-600 hover:text-orange-800'
                                                                : 'text-green-600 hover:text-green-800'
                                                        }`}
                                                        title={form.enabled ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {form.enabled ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteForm(form.id || form.formId);
                                                        }}
                                                        className="text-red-600 hover:text-red-800"
                                                        title="Delete Form"
                                                    >
                                                        <FaTrash />
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
            ) : view === 'create' ? (
                                            // Create New Form View
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBackToList}
                                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
                            >
                                <FaArrowLeft />
                            </button>
                            <h3 className="text-lg font-semibold text-gray-800">
                                Create New Form
                            </h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Form Details Section */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    📝 Form Name
                                </label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="e.g., Employee Onboarding Form, Asset Upload Form"
                                    className="w-full p-3 border border-gray-300 rounded-md"
                                />
                            </div>

                            <div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            📂 Select Category
                                        </label>
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-md"
                                            disabled={categoriesLoading}
                                        >
                                            <option value="">Select a category...</option>
                                            {categories.map(cat => (
                                                <option key={cat.categoryId || cat.id} value={cat.categoryId || cat.id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                        {categoriesLoading && <div className="text-blue-600 text-sm mt-1">Loading categories...</div>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            🧩 Select Sub-Category
                                        </label>
                                        <select
                                            value={selectedSubCategory}
                                            onChange={(e) => setSelectedSubCategory(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-md"
                                            disabled={!selectedCategory || categoriesLoading}
                                        >
                                            <option value="">Select a sub-category...</option>
                                            {subCategoriesForSelectedCategory.map(sub => (
                                                <option key={sub.subCategoryId || sub.id} value={sub.subCategoryId || sub.id}>
                                                    {sub.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-semibold text-gray-800">➕ Form Fields</h4>
                                        <span className="text-sm text-gray-500">
                                            {fields.length}/15 fields
                                        </span>
                                    </div>
                                    <button
                                        onClick={addField}
                                        disabled={fields.length >= 15}
                                        className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all duration-150 ${
                                            fields.length >= 15
                                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                    >
                                        <FaPlus /> Add Field
                                    </button>
                                </div>

                                {fields.length === 0 && (
                                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                                        <div className="text-4xl mb-2">📋</div>
                                        <p>No fields added yet. Click &quot;Add Field&quot; to get started.</p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                            <div className="flex justify-between items-start mb-3">
                                                <h5 className="font-medium text-gray-800">Field {index + 1}</h5>
                                                <button
                                                    onClick={() => removeField(field.id)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Field Name */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Field Name (Label)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={field.name}
                                                        onChange={(e) => updateField(field.id, 'name', e.target.value)}
                                                        placeholder="e.g., Asset Name, Employee ID"
                                                        className="w-full p-2 border border-gray-300 rounded-md"
                                                    />
                                                </div>

                                                {/* Field Type */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Field Type
                                                    </label>
                                                    <select
                                                        value={field.type}
                                                        onChange={(e) => updateField(field.id, 'type', e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded-md"
                                                    >
                                                        <option value="text">Text</option>
                                                        <option value="number">Number</option>
                                                        <option value="date">Date</option>
                                                        <option value="file">File Upload</option>
                                                        <option value="dropdown">Dropdown</option>
                                                        <option value="checkbox">Checkbox</option>
                                                        <option value="textarea">Textarea</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Field-specific options */}
                                            <div className="mt-3">
                                                {renderFieldInput(field)}
                                            </div>

                                            {/* Required toggle */}
                                            <div className="mt-3">
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={field.required}
                                                        onChange={(e) => updateField(field.id, 'required', e.target.checked)}
                                                        className="rounded border-gray-300"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">Required field</span>
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="pt-4">
                                <button
                                    onClick={handleSaveForm}
                                    disabled={loading || !formName.trim() || !selectedCategory || fields.length === 0}
                                    className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    {loading ? 'Saving...' : '💾 Save Form'}
                                </button>
                                {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
                            </div>
                        </div>

                        {/* Preview Section */}
                        <div className="lg:border-l lg:pl-8">
                            {renderFormPreview()}
                        </div>
                    </div>
                </div>
            ) : (
                                            // Edit Form View
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBackToList}
                                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
                            >
                                <FaArrowLeft />
                            </button>
                            <h3 className="text-lg font-semibold text-gray-800">
                                Edit Form: {formName || 'Untitled Form'}
                            </h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Form Details Section */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    📝 Form Name
                                </label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="e.g., Employee Onboarding Form, Asset Upload Form"
                                    className="w-full p-3 border border-gray-300 rounded-md"
                                />
                            </div>

                            <div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            📂 Select Category
                                        </label>
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-md"
                                            disabled={categoriesLoading}
                                        >
                                            <option value="">Select a category...</option>
                                            {categories.map(cat => (
                                                <option key={cat.categoryId || cat.id} value={cat.categoryId || cat.id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                        {categoriesLoading && <div className="text-blue-600 text-sm mt-1">Loading categories...</div>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            🧩 Select Sub-Category
                                        </label>
                                        <select
                                            value={selectedSubCategory}
                                            onChange={(e) => setSelectedSubCategory(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-md"
                                            disabled={!selectedCategory || categoriesLoading}
                                        >
                                            <option value="">Select a sub-category...</option>
                                            {subCategoriesForSelectedCategory.map(sub => (
                                                <option key={sub.subCategoryId || sub.id} value={sub.subCategoryId || sub.id}>
                                                    {sub.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-semibold text-gray-800">➕ Form Fields</h4>
                                        <span className="text-sm text-gray-500">
                                            {fields.length}/15 fields
                                        </span>
                                    </div>
                                    <button
                                        onClick={addField}
                                        disabled={fields.length >= 15}
                                        className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all duration-150 ${
                                            fields.length >= 15
                                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                    >
                                        <FaPlus /> Add Field
                                    </button>
                                </div>

                                {fields.length === 0 && (
                                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                                        <div className="text-4xl mb-2">📋</div>
                                        <p>No fields added yet. Click &quot;Add Field&quot; to get started.</p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                            <div className="flex justify-between items-start mb-3">
                                                <h5 className="font-medium text-gray-800">Field {index + 1}</h5>
                                                <button
                                                    onClick={() => removeField(field.id)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Field Name */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Field Name (Label)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={field.name}
                                                        onChange={(e) => updateField(field.id, 'name', e.target.value)}
                                                        placeholder="e.g., Asset Name, Employee ID"
                                                        className="w-full p-2 border border-gray-300 rounded-md"
                                                    />
                                                </div>

                                                {/* Field Type */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Field Type
                                                    </label>
                                                    <select
                                                        value={field.type}
                                                        onChange={(e) => updateField(field.id, 'type', e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded-md"
                                                    >
                                                        <option value="text">Text</option>
                                                        <option value="number">Number</option>
                                                        <option value="date">Date</option>
                                                        <option value="file">File Upload</option>
                                                        <option value="dropdown">Dropdown</option>
                                                        <option value="checkbox">Checkbox</option>
                                                        <option value="textarea">Textarea</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Field-specific options */}
                                            <div className="mt-3">
                                                {renderFieldInput(field)}
                                            </div>

                                            {/* Required toggle */}
                                            <div className="mt-3">
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={field.required}
                                                        onChange={(e) => updateField(field.id, 'required', e.target.checked)}
                                                        className="rounded border-gray-300"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">Required field</span>
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="pt-4">
                                <button
                                    onClick={handleSaveForm}
                                    disabled={loading || !formName.trim() || !selectedCategory || fields.length === 0}
                                    className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    {loading ? 'Saving...' : '💾 Update Form'}
                                </button>
                                {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
                            </div>
                        </div>

                        {/* Preview Section */}
                        <div className="lg:border-l lg:pl-8">
                            {renderFormPreview()}
                        </div>
                    </div>
                </div>
            )}
        </SettingsSection>
    );
};

// Delete confirmation modals
const DeleteCategoryModal = ({ open, onClose, onConfirm, categoryName, warning, assetsCount, assetsList }) => {
    if (!open) return null;
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold text-red-600 mb-2 flex items-center gap-2">
                    <FaTrash /> Delete Category
                </h2>
                
                {warning ? (
                    <div>
                        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-yellow-800 font-medium mb-2">
                                ⚠️ Cannot Delete Category
                            </p>
                            <p className="text-yellow-700 text-sm">
                                The category <span className="font-semibold">&quot;{categoryName}&quot;</span> is currently being used by <span className="font-semibold">{assetsCount} asset(s)</span>.
                            </p>
                        </div>
                        
                        {assetsList && assetsList.length > 0 && (
                            <div className="mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Assets using this category:</p>
                                <div className="max-h-32 overflow-y-auto bg-gray-50 rounded p-2">
                                    {assetsList.map((asset, index) => (
                                        <div key={asset.id || asset.assetId} className="text-sm text-gray-600 py-1">
                                            • {asset.name || asset.assetId} ({asset.assetId})
                                        </div>
                                    ))}
                                    {assetsCount > 5 && (
                                        <div className="text-sm text-gray-500 italic">
                                            ... and {assetsCount - 5} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <p className="text-sm text-gray-600 mb-4">
                            Please change the category of these assets to a different category before deleting this one.
                        </p>
                    </div>
                ) : (
                    <p className="mb-4 text-gray-700">
                        Are you sure you want to delete the category <span className="font-semibold">&quot;{categoryName}&quot;</span>?<br/>
                        This action <span className="text-red-600 font-semibold">cannot be undone</span> and may affect assets linked to this category.
                    </p>
                )}
                
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300">
                        {warning ? 'Close' : 'Cancel'}
                    </button>
                    {!warning && (
                        <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 font-semibold">
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const DeleteLocationModal = ({ open, onClose, onConfirm, locationName, warning, assetsCount, assetsList }) => {
    if (!open) return null;
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold text-red-600 mb-2 flex items-center gap-2">
                    <FaTrash /> Delete Location
                </h2>
                
                {warning ? (
                    <div>
                        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-yellow-800 font-medium mb-2">
                                ⚠️ Cannot Delete Location
                            </p>
                            <p className="text-yellow-700 text-sm">
                                The location <span className="font-semibold">&quot;{locationName}&quot;</span> is currently being used by <span className="font-semibold">{assetsCount} asset(s)</span>.
                            </p>
                        </div>
                        
                        {assetsList && assetsList.length > 0 && (
                            <div className="mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Assets using this location:</p>
                                <div className="max-h-32 overflow-y-auto bg-gray-50 rounded p-2">
                                    {assetsList.map((asset, index) => (
                                        <div key={asset.id || asset.assetId} className="text-sm text-gray-600 py-1">
                                            • {asset.name || asset.assetId} ({asset.assetId})
                                        </div>
                                    ))}
                                    {assetsCount > 5 && (
                                        <div className="text-sm text-gray-500 italic">
                                            ... and {assetsCount - 5} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <p className="text-sm text-gray-600 mb-4">
                            Please change the location of these assets to a different location before deleting this one.
                        </p>
                    </div>
                ) : (
                    <p className="mb-4 text-gray-700">
                        Are you sure you want to delete the location <span className="font-semibold">&quot;{locationName}&quot;</span>?<br/>
                        This action <span className="text-red-600 font-semibold">cannot be undone</span>.
                    </p>
                )}
                
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300">
                        {warning ? 'Close' : 'Cancel'}
                    </button>
                    {!warning && (
                        <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 font-semibold">
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const DeleteStatusModal = ({ open, onClose, onConfirm, statusName, warning, assetsCount, assetsList }) => {
    if (!open) return null;
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold text-red-600 mb-2 flex items-center gap-2">
                    <FaTrash /> Delete Status Label
                </h2>
                
                {warning ? (
                    <div>
                        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-yellow-800 font-medium mb-2">
                                ⚠️ Cannot Delete Status Label
                            </p>
                            <p className="text-yellow-700 text-sm">
                                The status label <span className="font-semibold">&quot;{statusName}&quot;</span> is currently being used by <span className="font-semibold">{assetsCount} asset(s)</span>.
                            </p>
                        </div>
                        
                        {assetsList && assetsList.length > 0 && (
                            <div className="mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Assets using this status:</p>
                                <div className="max-h-32 overflow-y-auto bg-gray-50 rounded p-2">
                                    {assetsList.map((asset, index) => (
                                        <div key={asset.id || asset.assetId} className="text-sm text-gray-600 py-1">
                                            • {asset.name || asset.assetId} ({asset.assetId})
                                        </div>
                                    ))}
                                    {assetsCount > 5 && (
                                        <div className="text-sm text-gray-500 italic">
                                            ... and {assetsCount - 5} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <p className="text-sm text-gray-600 mb-4">
                            Please change the status of these assets to a different status label before deleting this one.
                        </p>
                    </div>
                ) : (
                    <p className="mb-4 text-gray-700">
                        Are you sure you want to delete the status label <span className="font-semibold">&quot;{statusName}&quot;</span>?<br/>
                        This action <span className="text-red-600 font-semibold">cannot be undone</span>.
                    </p>
                )}
                
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300">
                        {warning ? 'Close' : 'Cancel'}
                    </button>
                    {!warning && (
                        <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 font-semibold">
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const DeleteFormModal = ({ open, onClose, onConfirm, formName }) => {
    if (!open) return null;
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-red-600 mb-2 flex items-center gap-2">
                    <FaTrash /> Delete Custom Form
                </h2>
                
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800 font-medium mb-2">
                        ⚠️ Warning: This action cannot be undone
                    </p>
                    <p className="text-red-700 text-sm">
                        Are you sure you want to delete the custom form <span className="font-semibold">&quot;{formName}&quot;</span>?
                    </p>
                    <p className="text-red-600 text-sm mt-2">
                        This will permanently remove the form and all its associated data.
                    </p>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300">
                        No, Cancel
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 font-semibold">
                        Yes, Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Page Component ---
const AssetSettingsPage = () => {
    const dispatch = useDispatch();
    
    // Enhanced Redux state selectors
    const { 
        categories, 
        loading, 
        error, 
        addingSubCategory, 
        updatingSubCategory, 
        deletingSubCategory,
        fetchingSubCategories,
        fetchingSubCategory
    } = useSelector(state => state.assetCategories);
    const { locations, loading: locationsLoading, error: locationsError } = useSelector(state => state.assetLocations);
    const { statuses, loading: statusesLoading, error: statusesError } = useSelector(state => state.assetStatuses);
    const { forms, loading: formsLoading } = useSelector(state => state.customForms);
    const { formattingsByCategory, loading: formattingLoading } = useSelector(state => state.idFormatting);
    
    // New Redux state selectors for assets and custom forms
    const { 
        assets, 
        loading: assetsLoading, 
        error: assetsError,
        creatingAsset,
        updatingAsset,
        deletingAsset,
        validatingAsset
    } = useSelector(state => state.assets);
    
    const { 
        forms: customFormsList, 
        currentForm, 
        formFields, 
        formData, 
        loading: customFormLoading, 
        error: customFormError,
        creatingForm,
        updatingForm,
        deletingForm,
        addingField,
        updatingField,
        deletingField,
        submittingData,
        previewingForm,
        duplicatingForm,
        togglingStatus
    } = useSelector(state => state.customForm);
    
    const [activeTab, setActiveTab] = useState('categories');
    
    // Fetch assets when component mounts for status deletion validation
    useEffect(() => {
        dispatch(fetchAllAssets());
    }, [dispatch]);
    
    // Separate editing states for each section
    const [editingCategories, setEditingCategories] = useState(false);
    const [editingLocations, setEditingLocations] = useState(false);
    const [editingStatuses, setEditingStatuses] = useState(false);
    const [editingCustomFields, setEditingCustomFields] = useState(false);
    const [editingIdFormats, setEditingIdFormats] = useState(false);
    
    // State for editing
    const [editedCategories, setEditedCategories] = useState([]);
    const [newCategory, setNewCategory] = useState({ name: '' });

    const [editedLocations, setEditedLocations] = useState([]);
    const [newLocation, setNewLocation] = useState({ name: '', address: '' });
    const [deleteLocationModal, setDeleteLocationModal] = useState({ 
        open: false, 
        locationId: null, 
        name: '', 
        warning: false,
        assetsCount: 0,
        assetsList: []
    });

    const [editedStatuses, setEditedStatuses] = useState([]);
    const [newStatus, setNewStatus] = useState({ name: '' });
    const [deleteStatusModal, setDeleteStatusModal] = useState({ 
        open: false, 
        statusId: null, 
        name: '', 
        warning: false,
        assetsCount: 0,
        assetsList: []
    });

    const [deleteFormModal, setDeleteFormModal] = useState({ 
        open: false, 
        formId: null, 
        formName: ''
    });

    const [deleteModal, setDeleteModal] = useState({ 
        open: false, 
        categoryId: null, 
        name: '', 
        warning: false,
        assetsCount: 0,
        assetsList: []
    });

    // Initialize data
    useEffect(() => {
        console.log('Loading asset management data...');
        
        // Debug function to test API response - commented out to avoid network errors
        // const debugApiResponse = async () => {
        //     try {
        //         const token = getItemFromSessionStorage('token', null);
        //         const response = await axios.get(`${publicRuntimeConfig.apiURL}/api/asset-settings/categories`, {
        //             headers: { Authorization: `Bearer ${token}` }
        //         });
        //         console.log('Raw API response:', response.data);
        //         
        //         // Test subcategory creation
        //         if (response.data?.data?.length > 0) {
        //             const firstCategory = response.data.data[0];
        //             console.log('First category:', firstCategory);
        //             console.log('Subcategories in first category:', firstCategory.subCategories);
        //         }
        //     } catch (error) {
        //         console.error('Debug API call failed:', error);
        //     }
        // };
        // 
        // debugApiResponse();
        
        dispatch(fetchAssetCategories());
        dispatch(fetchAssetLocations());
        dispatch(fetchAssetStatuses());
        dispatch(fetchCustomForms());
        dispatch(fetchIdFormattings());
    }, [dispatch]);

    useEffect(() => {
        console.log('Categories updated in component:', categories);
        console.log('Categories structure:', categories?.map(cat => ({
            id: cat.id,
            categoryId: cat.categoryId,
            name: cat.name,
            subCategoriesCount: cat.subCategories?.length || 0,
            subCategories: cat.subCategories
        })));
        
        // Only update editedCategories if categories have actually changed
        if (categories && categories.length > 0) {
            console.log('Updating editedCategories with new categories');
            setEditedCategories([...categories]);
        } else if (!categories || categories.length === 0) {
            console.log('Setting editedCategories to empty array');
            setEditedCategories([]);
        }
    }, [categories]);

    useEffect(() => {
        setEditedLocations(locations || []);
    }, [locations]);

    useEffect(() => {
        console.log('=== STATUSES LOADED FROM REDUX ===');
        console.log('Raw statuses from Redux:', statuses);
        console.log('Statuses structure:', statuses?.map(s => ({
            id: s.id,
            statusId: s.statusId,
            statusLabelId: s.statusLabelId,
            name: s.name,
            color: s.color,
            description: s.description,
            sortOrder: s.sortOrder
        })));
        setEditedStatuses(statuses || []);
    }, [statuses]);

    // Enhanced category management functions
    const handleAddCategory = async () => {
        console.log('handleAddCategory called with name:', newCategory.name);
        
        if (!newCategory.name) { 
            toast.error("Category name is required."); 
            return; 
        }
        
        try {
            await dispatch(addAssetCategory({ name: newCategory.name })).unwrap();
            setNewCategory({ name: '' });
            toast.success("Category added successfully!");
        } catch (error) {
            toast.error("Failed to add category");
        }
    };

    const handleCategoryFieldChange = (catId, key, value) => {
        console.log('handleCategoryFieldChange called with:', { catId, key, value });
        
        if (key === 'editing' && value === true) {
            // Start editing mode
            dispatch(updateCategoryLocal({ categoryId: catId, field: key, value }));
        } else {
            // Update field
            dispatch(updateCategoryLocal({ categoryId: catId, field: key, value }));
        }
        
        // Also update local state for immediate UI feedback
        setEditedCategories(editedCategories.map(cat => {
            if (cat.id === catId || cat.categoryId === catId) {
                console.log('Updating category in local state:', { catId, key, value });
                return { ...cat, [key]: value };
            }
            return cat;
        }));
    };

    const handleSaveCategories = async (categoryId = null) => {
        console.log('handleSaveCategories called with categoryId:', categoryId);
        
        if (categoryId) {
            // Save individual category
            const category = editedCategories.find(cat => cat.id === categoryId || cat.categoryId === categoryId);
            console.log('Found category to save:', category);
            
            if (category) {
                try {
                    await dispatch(updateAssetCategory({
                        categoryId: category.categoryId || category.id,
                        assetData: { name: category.name }
                    })).unwrap();
                    
                    // Clear editing state
                    handleCategoryFieldChange(categoryId, 'editing', false);
                    toast.success("Category updated successfully!");
                } catch (error) {
                    toast.error("Failed to update category");
                }
            }
        }
    };

    const handleCancelCategories = (categoryId = null) => {
        console.log('handleCancelCategories called with categoryId:', categoryId);
        
        if (categoryId) {
            // Cancel individual category editing
            const originalCategory = categories.find(cat => cat.id === categoryId || cat.categoryId === categoryId);
            console.log('Found original category for cancel:', originalCategory);
            
            if (originalCategory) {
                setEditedCategories(editedCategories.map(cat => 
                    (cat.id === categoryId || cat.categoryId === categoryId) 
                        ? { ...originalCategory, editing: false }
                        : cat
                ));
                toast.info("Category changes cancelled.");
            }
        }
    };

    const handleDeleteCategory = (categoryId, name) => {
        console.log('handleDeleteCategory called with:', { categoryId, name });
        
        // Check if category has sub-categories
        const category = editedCategories.find(cat => cat.id === categoryId || cat.categoryId === categoryId);
        console.log('Found category for deletion:', category);
        
        const hasSubCategories = category && category.subCategories && category.subCategories.length > 0;
        
        if (hasSubCategories) {
            const subCatList = category.subCategories.slice(0, 3).map(sub => sub.name).join(', ');
            const moreText = category.subCategories.length > 3 ? ` and ${category.subCategories.length - 3} more` : '';
            toast.error(`Cannot delete category "${name}" because it has ${category.subCategories.length} sub-category(ies): ${subCatList}${moreText}. Please delete all sub-categories first.`);
            return;
        }
        
        // Check if any assets are using this category
        const assetsUsingCategory = assets.filter(asset => 
            asset.categoryId === categoryId || asset.category?.id === categoryId
        );
        
        if (assetsUsingCategory.length > 0) {
            // Show warning modal with details about assets using this category
            setDeleteModal({ 
                open: true, 
                categoryId, 
                name,
                warning: true,
                assetsCount: assetsUsingCategory.length,
                assetsList: assetsUsingCategory.slice(0, 5) // Show first 5 assets
            });
        } else {
            // No assets using this category, proceed with deletion
            setDeleteModal({ open: true, categoryId, name, warning: false });
        }
    };
    
    const confirmDeleteCategory = async () => {
        console.log('confirmDeleteCategory called with categoryId:', deleteModal.categoryId);
        
        try {
            await dispatch(deleteAssetCategory(deleteModal.categoryId)).unwrap();
            toast.success("Category deleted successfully!");
        } catch (error) {
            // Show backend response in toast
            const errorMessage = error?.message || error?.data?.message || error?.error || "Failed to delete category";
            toast.error(`Category deletion failed: ${errorMessage}`);
            console.error('Backend error response:', error);
        }
        setDeleteModal({ open: false, categoryId: null, name: '' });
    };
    
    const cancelDeleteCategory = () => {
        console.log('cancelDeleteCategory called');
        setDeleteModal({ 
            open: false, 
            categoryId: null, 
            name: '', 
            warning: false,
            assetsCount: 0,
            assetsList: []
        });
    };

    // Enhanced sub-category management functions
    const handleAddSubCategory = (categoryId, payloadOrName = '') => {
        console.log('handleAddSubCategory called with:', { categoryId, payloadOrName });
        console.log('Current editedCategories:', editedCategories.map(cat => ({
            id: cat.id,
            categoryId: cat.categoryId,
            name: cat.name,
            subCategories: cat.subCategories
        })));

        // If called with the new object payload { name, prefix, suffix }
        if (typeof payloadOrName === 'object' && payloadOrName !== null) {
            const name = (payloadOrName.name || '').trim();
            const prefix = (payloadOrName.prefix || '').trim();
            const suffix = String(payloadOrName.suffix || '');
            if (!name || !prefix || !suffix) {
                toast.error('Please provide sub-category name, prefix and suffix');
                return;
            }

            console.log('Adding subcategory to server with actual field values:', { categoryId, name, prefix, suffix });
            dispatch(addSubCategory({
                categoryId,
                subCategoryData: { name, prefix, suffix }
            })).then((result) => {
                if (result.meta.requestStatus === 'fulfilled') {
                    console.log('Subcategory added successfully:', result.payload);
                    toast.success('Sub-category added successfully!');
                } else {
                    console.error('Failed to add subcategory:', result.error);
                    toast.error('Failed to add sub-category');
                }
            });
            return;
        }

        // Backward-compat: simple name string
        const subCategoryName = String(payloadOrName || '');
        if (subCategoryName.trim()) {
            // Add to server
            console.log('Adding subcategory to server (legacy):', { categoryId, subCategoryData: { name: subCategoryName.trim() } });
            dispatch(addSubCategory({
                categoryId,
                subCategoryData: { name: subCategoryName.trim() }
            })).then((result) => {
                if (result.meta.requestStatus === 'fulfilled') {
                    console.log('Subcategory added successfully:', result.payload);
                    toast.success('Sub-category added successfully!');
                } else {
                    console.error('Failed to add subcategory:', result.error);
                    toast.error('Failed to add sub-category');
                }
            });
        } else {
            // Add locally for editing
            console.log('Adding subcategory locally for editing');
            dispatch(addSubCategoryLocal({
                categoryId,
                subCategory: {
                    name: '',
                    editing: true
                }
            }));
        }
    };

    const handleEditSubCategory = (categoryId, subCategoryId, field, value) => {
        console.log('handleEditSubCategory called with:', { categoryId, subCategoryId, field, value });
        dispatch(updateSubCategoryLocal({
            categoryId,
            subCategoryId,
            field,
            value
        }));
    };

    const handleSaveSubCategory = (categoryId, subCategoryId) => {
        console.log('handleSaveSubCategory called with:', { categoryId, subCategoryId });
        
        const category = editedCategories.find(cat => cat.categoryId === categoryId || cat.id === categoryId);
        const subCategory = category?.subCategories?.find(sub => sub.id === subCategoryId || sub.subCategoryId === subCategoryId);
        
        console.log('Found category and subcategory:', { category, subCategory });
        console.log('All categories:', editedCategories.map(cat => ({
            id: cat.id,
            categoryId: cat.categoryId,
            name: cat.name,
            subCategories: cat.subCategories
        })));
        
        if (subCategory && subCategory.name && subCategory.name.trim()) {
            // Get the actual values from the form fields
            const name = subCategory.name.trim();
            const prefix = subCategory.prefix || '';
            const suffix = subCategory.suffix || '';

            if (subCategory.subCategoryId) {
                // Update existing
                console.log('Updating existing subcategory with actual field values:', { categoryId, subCategoryId, name, prefix, suffix });
                dispatch(updateSubCategory({
                    categoryId,
                    subCategoryId: subCategory.subCategoryId,
                    subCategoryData: {
                        name,
                        prefix,
                        suffix
                    }
                })).then((result) => {
                    if (result.meta.requestStatus === 'fulfilled') {
                        console.log('Subcategory updated successfully:', result.payload);
                        toast.success("Sub-category updated successfully!");
                    } else {
                        console.error('Failed to update subcategory:', result.error);
                        toast.error("Failed to update sub-category");
                    }
                });
            } else {
                // Create new
                console.log('Creating new subcategory with actual field values:', { categoryId, name, prefix, suffix });
                dispatch(addSubCategory({
                    categoryId,
                    subCategoryData: {
                        name,
                        prefix,
                        suffix
                    }
                })).then((result) => {
                    if (result.meta.requestStatus === 'fulfilled') {
                        console.log('Subcategory created successfully:', result.payload);
                        toast.success("Sub-category created successfully!");
                    } else {
                        console.error('Failed to create subcategory:', result.error);
                        toast.error("Failed to create sub-category");
                    }
                });
            }
        } else {
            console.warn('Subcategory name is empty or not found');
            toast.error("Sub-category name is required");
        }
    };

    const handleCancelSubCategory = (categoryId, subCategoryId) => {
        console.log('handleCancelSubCategory called with:', { categoryId, subCategoryId });
        
        const category = editedCategories.find(cat => cat.categoryId === categoryId || cat.id === categoryId);
        const subCategory = category?.subCategories?.find(sub => sub.id === subCategoryId || sub.subCategoryId === subCategoryId);
        
        console.log('Found category and subcategory for cancel:', { category, subCategory });
        
        if (subCategory && !subCategory.subCategoryId) {
            // Remove newly added sub-category that hasn't been saved
            console.log('Removing unsaved subcategory');
            dispatch(removeSubCategoryLocal({ categoryId, subCategoryId }));
        } else {
            // Revert changes to existing sub-category
            const originalSubCategory = category?.subCategories?.find(sub => sub.subCategoryId === subCategoryId);
            if (originalSubCategory) {
                console.log('Reverting changes to existing subcategory');
                dispatch(updateSubCategoryLocal({
                    categoryId,
                    subCategoryId,
                    field: 'name',
                    value: originalSubCategory.name
                }));
                dispatch(updateSubCategoryLocal({
                    categoryId,
                    subCategoryId,
                    field: 'editing',
                    value: false
                }));
            }
        }
    };

    const handleDeleteSubCategory = async (categoryId, subCategoryId) => {
        console.log('handleDeleteSubCategory called with:', { categoryId, subCategoryId });
        
        const category = editedCategories.find(cat => cat.categoryId === categoryId || cat.id === categoryId);
        const subCategory = category?.subCategories?.find(sub => sub.id === subCategoryId || sub.subCategoryId === subCategoryId);
        
        console.log('Found category and subcategory for deletion:', { category, subCategory });
        
        // Check if any assets are using this sub-category
        const assetsUsingSubCategory = assets.filter(asset => 
            asset.subCategoryId === subCategoryId || asset.subCategory?.id === subCategoryId
        );
        
        if (assetsUsingSubCategory.length > 0) {
            // Show warning toast about assets using this sub-category
            const assetList = assetsUsingSubCategory.slice(0, 3).map(asset => asset.name || asset.assetId).join(', ');
            const moreText = assetsUsingSubCategory.length > 3 ? ` and ${assetsUsingSubCategory.length - 3} more` : '';
            toast.error(`Cannot delete sub-category "${subCategory?.name || 'Unknown'}" because it has ${assetsUsingSubCategory.length} asset(s) using it: ${assetList}${moreText}. Please change the sub-category of these assets first.`);
            return;
        }
        
        if (subCategory?.subCategoryId) {
            // Delete from server
            try {
                const result = await dispatch(deleteSubCategory({ categoryId, subCategoryId: subCategory.subCategoryId })).unwrap();
                console.log('Subcategory deleted successfully:', result);
                toast.success("Sub-category deleted successfully!");
            } catch (error) {
                console.error('Error deleting subcategory:', error);
                // Show backend response in toast
                const errorMessage = error?.message || error?.data?.message || error?.error || "Failed to delete sub-category";
                toast.error(`Sub-category deletion failed: ${errorMessage}`);
            }
        } else {
            // Remove locally (for unsaved sub-categories)
            console.log('Removing unsaved subcategory locally');
            dispatch(removeSubCategoryLocal({ categoryId, subCategoryId }));
        }
    };

    // New API endpoint functions for sub-categories
    const handleFetchSubCategoriesByCategory = async (categoryId) => {
        console.log('handleFetchSubCategoriesByCategory called with categoryId:', categoryId);
        
        try {
            const result = await dispatch(fetchSubCategoriesByCategory(categoryId)).unwrap();
            console.log('Fetched subcategories for category:', result);
            toast.success("Sub-categories loaded successfully!");
            return result.subCategories;
        } catch (error) {
            console.error('Error fetching subcategories by category:', error);
            toast.error("Failed to load sub-categories");
            return [];
        }
    };

    const handleFetchSubCategoryById = async (subCategoryId) => {
        console.log('handleFetchSubCategoryById called with subCategoryId:', subCategoryId);
        
        try {
            const result = await dispatch(fetchSubCategoryById(subCategoryId)).unwrap();
            console.log('Fetched subcategory by ID:', result);
            toast.success("Sub-category loaded successfully!");
            return result;
        } catch (error) {
            console.error('Error fetching subcategory by ID:', error);
            toast.error("Failed to load sub-category");
            return null;
        }
    };

    // ===========================================
    // COMPREHENSIVE ASSET MANAGEMENT FUNCTIONS
    // ===========================================
    
    // Asset Management Functions (Based on AssetController.java)
    const handleFetchAllAssets = async () => {
        console.log('Fetching all assets...');
        try {
            const result = await dispatch(fetchAllAssets()).unwrap();
            console.log('Fetched all assets:', result);
            toast.success(`Loaded ${result.length || 0} assets successfully!`);
            return result;
        } catch (error) {
            console.error('Error fetching all assets:', error);
            toast.error("Failed to load assets");
            return [];
        }
    };

    const handleFetchAllAssetsDetailed = async () => {
        console.log('Fetching all assets with detailed information...');
        try {
            const result = await dispatch(fetchAllAssetsDetailed()).unwrap();
            console.log('Fetched detailed assets:', result);
            toast.success(`Loaded ${result.length || 0} detailed assets successfully!`);
            return result;
        } catch (error) {
            console.error('Error fetching detailed assets:', error);
            toast.error("Failed to load detailed assets");
            return [];
        }
    };

    const handleFetchAssetsByCategory = async (categoryId) => {
        console.log('Fetching assets by category:', categoryId);
        try {
            const result = await dispatch(fetchAssetsByCategory(categoryId)).unwrap();
            console.log('Fetched assets by category:', result);
            toast.success(`Loaded ${result.length || 0} assets for category successfully!`);
            return result;
        } catch (error) {
            console.error('Error fetching assets by category:', error);
            toast.error("Failed to load assets for category");
            return [];
        }
    };

    const handleFetchAssetById = async (assetId) => {
        console.log('Fetching asset by ID:', assetId);
        try {
            const result = await dispatch(fetchAssetById(assetId)).unwrap();
            console.log('Fetched asset by ID:', result);
            toast.success("Asset loaded successfully!");
            return result;
        } catch (error) {
            console.error('Error fetching asset by ID:', error);
            toast.error("Failed to load asset");
            return null;
        }
    };

    const handleFetchAssetByAssetId = async (assetId) => {
        console.log('Fetching asset by Asset ID:', assetId);
        try {
            const result = await dispatch(fetchAssetByAssetId(assetId)).unwrap();
            console.log('Fetched asset by Asset ID:', result);
            toast.success("Asset loaded successfully!");
            return result;
        } catch (error) {
            console.error('Error fetching asset by Asset ID:', error);
            toast.error("Failed to load asset");
            return null;
        }
    };

    const handleCreateAsset = async (assetDTO, invoiceScan = null) => {
        console.log('Creating new asset:', assetDTO);
        try {
            const result = await dispatch(createAssetWithDTO({ assetDTO, invoiceScan })).unwrap();
            console.log('Created asset:', result);
            toast.success("Asset created successfully!");
            return result;
        } catch (error) {
            console.error('Error creating asset:', error);
            toast.error("Failed to create asset");
            return null;
        }
    };

    const handleUpdateAsset = async (assetId, assetData) => {
        console.log('Updating asset:', assetId, assetData);
        try {
            const result = await dispatch(patchAssetByAssetId({ assetId, assetData })).unwrap();
            console.log('Updated asset:', result);
            toast.success("Asset updated successfully!");
            return result;
        } catch (error) {
            console.error('Error updating asset:', error);
            toast.error("Failed to update asset");
            return null;
        }
    };

    const handleDeleteAsset = async (assetId) => {
        console.log('Deleting asset:', assetId);
        try {
            const result = await dispatch(deleteAsset(assetId)).unwrap();
            console.log('Deleted asset:', result);
            toast.success("Asset deleted successfully!");
            return result;
        } catch (error) {
            console.error('Error deleting asset:', error);
            toast.error("Failed to delete asset");
            return null;
        }
    };

    const handleValidateAsset = async (assetId) => {
        console.log('Validating asset:', assetId);
        try {
            const result = await dispatch(validateAsset(assetId)).unwrap();
            console.log('Asset validation result:', result);
            toast.success("Asset validation completed!");
            return result;
        } catch (error) {
            console.error('Error validating asset:', error);
            toast.error("Failed to validate asset");
            return null;
        }
    };

    const handleFetchAssetWithCustomForms = async (assetId) => {
        console.log('Fetching asset with custom forms:', assetId);
        try {
            const result = await dispatch(fetchAssetWithCustomForms(assetId)).unwrap();
            console.log('Fetched asset with custom forms:', result);
            toast.success("Asset with custom forms loaded successfully!");
            return result;
        } catch (error) {
            console.error('Error fetching asset with custom forms:', error);
            toast.error("Failed to load asset with custom forms");
            return null;
        }
    };

    const handleUpdateAssetCustomFields = async (assetId, customFields) => {
        console.log('Updating asset custom fields:', assetId, customFields);
        try {
            const result = await dispatch(updateAssetCustomFields({ assetId, customFields })).unwrap();
            console.log('Updated asset custom fields:', result);
            toast.success("Asset custom fields updated successfully!");
            return result;
        } catch (error) {
            console.error('Error updating asset custom fields:', error);
            toast.error("Failed to update asset custom fields");
            return null;
        }
    };

    // ===========================================
    // COMPREHENSIVE CUSTOM FORM FUNCTIONS
    // ===========================================
    
    // Custom Form Management Functions (Based on CustomFormController.java)
    const handleFetchCustomForms = async (companyId, categoryId = null) => {
        console.log('Fetching custom forms:', { companyId, categoryId });
        try {
            const result = await dispatch(fetchCustomFormsNew({ companyId, categoryId })).unwrap();
            console.log('Fetched custom forms:', result);
            toast.success(`Loaded ${result.length || 0} custom forms successfully!`);
            return result;
        } catch (error) {
            console.error('Error fetching custom forms:', error);
            toast.error("Failed to load custom forms");
            return [];
        }
    };

    const handleFetchCustomFormById = async (formId) => {
        console.log('Fetching custom form by ID:', formId);
        try {
            const result = await dispatch(fetchCustomFormById(formId)).unwrap();
            console.log('Fetched custom form:', result);
            toast.success("Custom form loaded successfully!");
            return result;
        } catch (error) {
            console.error('Error fetching custom form:', error);
            toast.error("Failed to load custom form");
            return null;
        }
    };

    const handleCreateCustomForm = async (formDTO) => {
        console.log('Creating custom form:', formDTO);
        try {
            const result = await dispatch(createCustomFormNew(formDTO)).unwrap();
            console.log('Created custom form:', result);
            toast.success("Custom form created successfully!");
            return result;
        } catch (error) {
            console.error('Error creating custom form:', error);
            toast.error("Failed to create custom form");
            return null;
        }
    };

    const handleUpdateCustomForm = async (formId, formDTO) => {
        console.log('Updating custom form:', formId, formDTO);
        try {
            const result = await dispatch(updateCustomFormNew({ formId, formDTO })).unwrap();
            console.log('Updated custom form:', result);
            toast.success("Custom form updated successfully!");
            return result;
        } catch (error) {
            console.error('Error updating custom form:', error);
            toast.error("Failed to update custom form");
            return null;
        }
    };

    const handleDeleteCustomForm = async (formId) => {
        console.log('Deleting custom form:', formId);
        try {
            const result = await dispatch(deleteCustomFormNew(formId)).unwrap();
            console.log('Deleted custom form:', result);
            toast.success("Custom form deleted successfully!");
            return result;
        } catch (error) {
            console.error('Error deleting custom form:', error);
            toast.error("Failed to delete custom form");
            return null;
        }
    };

    const handleFetchFormFields = async (formId) => {
        console.log('Fetching form fields:', formId);
        try {
            const result = await dispatch(fetchFormFields(formId)).unwrap();
            console.log('Fetched form fields:', result);
            toast.success(`Loaded ${result.length || 0} form fields successfully!`);
            return result;
        } catch (error) {
            console.error('Error fetching form fields:', error);
            toast.error("Failed to load form fields");
            return [];
        }
    };

    const handleAddFieldToForm = async (formId, fieldDTO) => {
        console.log('Adding field to form:', formId, fieldDTO);
        try {
            const result = await dispatch(addFieldToForm({ formId, fieldDTO })).unwrap();
            console.log('Added field to form:', result);
            toast.success("Field added to form successfully!");
            return result;
        } catch (error) {
            console.error('Error adding field to form:', error);
            toast.error("Failed to add field to form");
            return null;
        }
    };

    const handleUpdateFormField = async (formId, fieldId, fieldDTO) => {
        console.log('Updating form field:', formId, fieldId, fieldDTO);
        try {
            const result = await dispatch(updateField({ formId, fieldId, fieldDTO })).unwrap();
            console.log('Updated form field:', result);
            toast.success("Form field updated successfully!");
            return result;
        } catch (error) {
            console.error('Error updating form field:', error);
            toast.error("Failed to update form field");
            return null;
        }
    };

    const handleDeleteFormField = async (formId, fieldId) => {
        console.log('Deleting form field:', formId, fieldId);
        try {
            const result = await dispatch(deleteField({ formId, fieldId })).unwrap();
            console.log('Deleted form field:', result);
            toast.success("Form field deleted successfully!");
            return result;
        } catch (error) {
            console.error('Error deleting form field:', error);
            toast.error("Failed to delete form field");
            return null;
        }
    };

    const handleAssignFormToCategory = async (formId, categoryId) => {
        console.log('Assigning form to category:', formId, categoryId);
        try {
            const result = await dispatch(assignFormToCategory({ formId, categoryId })).unwrap();
            console.log('Assigned form to category:', result);
            toast.success("Form assigned to category successfully!");
            return result;
        } catch (error) {
            console.error('Error assigning form to category:', error);
            toast.error("Failed to assign form to category");
            return null;
        }
    };

    const handleUnassignFormFromCategory = async (formId) => {
        console.log('Unassigning form from category:', formId);
        try {
            const result = await dispatch(unassignFormFromCategory(formId)).unwrap();
            console.log('Unassigned form from category:', result);
            toast.success("Form unassigned from category successfully!");
            return result;
        } catch (error) {
            console.error('Error unassigning form from category:', error);
            toast.error("Failed to unassign form from category");
            return null;
        }
    };

    const handleFetchFormsByCategory = async (categoryId) => {
        console.log('Fetching forms by category:', categoryId);
        try {
            const result = await dispatch(fetchFormsByCategory(categoryId)).unwrap();
            console.log('Fetched forms by category:', result);
            toast.success(`Loaded ${result.length || 0} forms for category successfully!`);
            return result;
        } catch (error) {
            console.error('Error fetching forms by category:', error);
            toast.error("Failed to load forms for category");
            return [];
        }
    };

    const handlePreviewForm = async (formId) => {
        console.log('Previewing form:', formId);
        try {
            const result = await dispatch(previewForm(formId)).unwrap();
            console.log('Form preview:', result);
            toast.success("Form preview loaded successfully!");
            return result;
        } catch (error) {
            console.error('Error previewing form:', error);
            toast.error("Failed to preview form");
            return null;
        }
    };

    const handleDuplicateForm = async (formId) => {
        console.log('Duplicating form:', formId);
        try {
            const result = await dispatch(duplicateForm(formId)).unwrap();
            console.log('Duplicated form:', result);
            toast.success("Form duplicated successfully!");
            return result;
        } catch (error) {
            console.error('Error duplicating form:', error);
            toast.error("Failed to duplicate form");
            return null;
        }
    };

    const handleToggleFormStatus = async (formId) => {
        console.log('Toggling form status:', formId);
        try {
            const result = await dispatch(toggleFormStatusNew(formId)).unwrap();
            console.log('Toggled form status:', result);
            toast.success("Form status updated successfully!");
            return result;
        } catch (error) {
            console.error('Error toggling form status:', error);
            toast.error("Failed to update form status");
            return null;
        }
    };

    const handleSubmitFormData = async (formId, assetId, createdBy, fieldData, files = {}) => {
        console.log('Submitting form data:', { formId, assetId, createdBy, fieldData, files });
        try {
            const result = await dispatch(submitFormData({ formId, assetId, createdBy, fieldData, files })).unwrap();
            console.log('Submitted form data:', result);
            toast.success("Form data submitted successfully!");
            return result;
        } catch (error) {
            console.error('Error submitting form data:', error);
            toast.error("Failed to submit form data");
            return null;
        }
    };

    const handleFetchFormDataForAsset = async (formId, assetId) => {
        console.log('Fetching form data for asset:', { formId, assetId });
        try {
            const result = await dispatch(fetchFormDataForAsset({ formId, assetId })).unwrap();
            console.log('Fetched form data for asset:', result);
            toast.success("Form data loaded successfully!");
            return result;
        } catch (error) {
            console.error('Error fetching form data for asset:', error);
            toast.error("Failed to load form data");
            return null;
        }
    };

    const handleFetchAllFormDataForAsset = async (assetId) => {
        console.log('Fetching all form data for asset:', assetId);
        try {
            const result = await dispatch(fetchAllFormDataForAsset(assetId)).unwrap();
            console.log('Fetched all form data for asset:', result);
            toast.success(`Loaded ${result.length || 0} form data records successfully!`);
            return result;
        } catch (error) {
            console.error('Error fetching all form data for asset:', error);
            toast.error("Failed to load form data");
            return [];
        }
    };

    const handleDeleteFormData = async (dataId) => {
        console.log('Deleting form data:', dataId);
        try {
            const result = await dispatch(deleteFormData(dataId)).unwrap();
            console.log('Deleted form data:', result);
            toast.success("Form data deleted successfully!");
            return result;
        } catch (error) {
            console.error('Error deleting form data:', error);
            toast.error("Failed to delete form data");
            return null;
        }
    };

    // Location management functions
    const handleAddLocation = async () => {
        if (!newLocation.name) { 
            toast.error("Location name is required."); 
            return; 
        }
        
        try {
            // Get company ID from session storage
            const companyId = sessionStorage.getItem("employeeCompanyId") || 
                             sessionStorage.getItem("companyId") || 
                             sessionStorage.getItem("company");
            
            if (!companyId) {
                toast.error("Company ID not found in session");
                return;
            }
            
            // Prepare request payload according to API specification
            const locationData = {
                name: newLocation.name, 
                companyId: companyId,
                isActive: true
            };
            
            // Add address if it exists (though API doesn't show address field)
            if (newLocation.address) {
                locationData.address = newLocation.address;
            }
            
            // Make direct API call to add location
            const tokenRaw = getItemFromSessionStorage('token', null);
            const token = typeof tokenRaw === 'string' ? tokenRaw : (tokenRaw?.token || tokenRaw?.accessToken || '');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const addUrl = `${publicRuntimeConfig.apiURL}/api/asset-settings/locations`;
            console.log('[add-location] POST', addUrl, locationData);
            
            const response = await fetch(addUrl, {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(locationData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Location creation failed (${response.status})`);
            }
            
            const result = await response.json();
            console.log('Location creation response:', result);
            
            setNewLocation({ name: '', address: '' });
            toast.success("Location added successfully!");
            
            // Refresh locations from backend to get new data
            dispatch(fetchAssetLocations());
            
        } catch (error) {
            console.error('Error adding location:', error);
            const errorMessage = error?.message || "Failed to add location";
            toast.error(errorMessage);
        }
    };

    const handleLocationFieldChange = (locId, key, value) => {
        if (key === 'editing' && value === true) {
            // Start editing mode
        dispatch(updateLocationLocal({ locationId: locId, field: key, value }));
        } else {
            // Update field
            dispatch(updateLocationLocal({ locationId: locId, field: key, value }));
        }
        
        // Also update local state for immediate UI feedback
        setEditedLocations(editedLocations.map(loc => 
            (loc.id === locId || loc.locationId === locId) ? { ...loc, [key]: value } : loc
        ));
    };

    // Utility function for batch updating locations (if needed in the future)
    const handleBatchUpdateLocations = async (locationsData) => {
        try {
            // Get company ID from session storage
            const companyId = sessionStorage.getItem("employeeCompanyId") || 
                             sessionStorage.getItem("companyId") || 
                             sessionStorage.getItem("company");
            
            if (!companyId) {
                toast.error("Company ID not found in session");
                return false;
            }
            
            // Prepare batch request payload
            const batchPayload = locationsData.map(loc => ({
                locationId: loc.locationId || loc.id,
                name: loc.name,
                companyId: companyId,
                isActive: true
            }));
            
            // Make direct API call to batch update locations
            const tokenRaw = getItemFromSessionStorage('token', null);
            const token = typeof tokenRaw === 'string' ? tokenRaw : (tokenRaw?.token || tokenRaw?.accessToken || '');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const batchUrl = `${publicRuntimeConfig.apiURL}/api/asset-settings/locations/batch`;
            console.log('[batch-update-locations] PATCH', batchUrl, batchPayload);
            
            const response = await fetch(batchUrl, {
                method: 'PATCH',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(batchPayload)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Batch location update failed (${response.status})`);
            }
            
            const result = await response.json();
            console.log('Batch location update response:', result);
            
                toast.success("Locations updated successfully!");
            return true;
            
        } catch (error) {
            console.error('Error batch updating locations:', error);
            const errorMessage = error?.message || "Failed to batch update locations";
            toast.error(errorMessage);
            return false;
        }
    };

    const handleSaveLocations = async (locationId = null) => {
        if (locationId) {
            // Save individual location
            const location = editedLocations.find(loc => loc.id === locationId || loc.locationId === locationId);
            
            if (location) {
                try {
                    // Get company ID from session storage
                    const companyId = sessionStorage.getItem("employeeCompanyId") || 
                                     sessionStorage.getItem("companyId") || 
                                     sessionStorage.getItem("company");
                    
                    if (!companyId) {
                        toast.error("Company ID not found in session");
                        return;
                    }
                    
                    // Prepare request payload according to API specification
                    const locationData = {
                        name: location.name,
                        companyId: companyId,
                        isActive: true
                    };
                    
                    // Add address if it exists (though API doesn't show address field)
                    if (location.address) {
                        locationData.address = location.address;
                    }
                    
                    // Make direct API call to update location
                    const tokenRaw = getItemFromSessionStorage('token', null);
                    const token = typeof tokenRaw === 'string' ? tokenRaw : (tokenRaw?.token || tokenRaw?.accessToken || '');
                    const headers = token ? { Authorization: `Bearer ${token}` } : {};
                    
                    const updateUrl = `${publicRuntimeConfig.apiURL}/api/asset-settings/locations/${location.locationId || location.id}`;
                    console.log('[update-location] PATCH', updateUrl, locationData);
                    
                    const response = await fetch(updateUrl, {
                        method: 'PATCH',
                        headers: {
                            ...headers,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(locationData)
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `Location update failed (${response.status})`);
                    }
                    
                    const result = await response.json();
                    console.log('Location update response:', result);
                    
                    // Clear editing state
                    handleLocationFieldChange(locationId, 'editing', false);
                    toast.success("Location updated successfully!");
                    
                    // Refresh locations from backend to get updated data
                    dispatch(fetchAssetLocations());
                    
        } catch (error) {
                    console.error('Error updating location:', error);
                    const errorMessage = error?.message || "Failed to update location";
                    toast.error(errorMessage);
                }
            }
        }
    };

    const handleCancelLocations = (locationId = null) => {
        if (locationId) {
            // Cancel individual location editing
            const originalLocation = locations.find(loc => loc.id === locationId || loc.locationId === locationId);
            
            if (originalLocation) {
                setEditedLocations(editedLocations.map(loc => 
                    (loc.id === locationId || loc.locationId === locationId) 
                        ? { ...originalLocation, editing: false }
                        : loc
                ));
        toast.info("Location changes cancelled.");
            }
        }
    };

    const handleDeleteLocation = (locationId, name) => {
        // Check if any assets are using this location
        const assetsUsingLocation = assets.filter(asset => 
            asset.locationId === locationId
        );
        
        if (assetsUsingLocation.length > 0) {
            // Show warning modal with details about assets using this location
            setDeleteLocationModal({ 
                open: true, 
                locationId, 
                name,
                warning: true,
                assetsCount: assetsUsingLocation.length,
                assetsList: assetsUsingLocation.slice(0, 5) // Show first 5 assets
            });
        } else {
            // No assets using this location, proceed with deletion
            setDeleteLocationModal({ open: true, locationId, name, warning: false });
        }
    };
    
    const confirmDeleteLocation = async () => {
        try {
            await dispatch(deleteAssetLocation(deleteLocationModal.locationId)).unwrap();
            toast.success("Location deleted successfully!");
        } catch (error) {
            // Show backend response in toast
            const errorMessage = error?.message || error?.data?.message || error?.error || "Failed to delete location";
            
            // Check if the error is about assets using this location
            if (error && error.includes && error.includes('assets')) {
                toast.error("Cannot delete location: Assets are currently using this location");
            } else {
                toast.error(`Location deletion failed: ${errorMessage}`);
            }
            console.error('Backend error response:', error);
        }
        setDeleteLocationModal({ open: false, locationId: null, name: '', warning: false });
    };
    
    const cancelDeleteLocation = () => {
        setDeleteLocationModal({ 
            open: false, 
            locationId: null, 
            name: '', 
            warning: false,
            assetsCount: 0,
            assetsList: []
        });
    };

    // Status management functions
    const handleAddStatus = async () => {
        if (!newStatus.name) { 
            toast.error("Status name is required."); 
            return; 
        }
        
        try {
            // Get company ID from session storage
            const companyId = sessionStorage.getItem("employeeCompanyId") || 
                             sessionStorage.getItem("companyId") || 
                             sessionStorage.getItem("company");
            
            if (!companyId) {
                toast.error("Company ID not found in session");
                return;
            }
            
            // Prepare request payload according to API specification
            const statusData = {
                name: newStatus.name,
                companyId: companyId,
                isActive: true,
                // Set default values as per API documentation
                color: "#6B7280", // Default color
                description: null,
                sortOrder: 0 // Default sort order
            };
            
            // Make direct API call to add status label
            const tokenRaw = getItemFromSessionStorage('token', null);
            const token = typeof tokenRaw === 'string' ? tokenRaw : (tokenRaw?.token || tokenRaw?.accessToken || '');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const addUrl = `${publicRuntimeConfig.apiURL}/api/asset-settings/status-labels`;
            console.log('[add-status-label] POST', addUrl, statusData);
            
            const response = await fetch(addUrl, {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                    },
                body: JSON.stringify(statusData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Status label creation failed (${response.status})`);
            }
            
            const result = await response.json();
            console.log('Status label creation response:', result);
            
            setNewStatus({ name: '' });
            toast.success("Status label added successfully!");
            
            // Refresh statuses from backend to get new data
            dispatch(fetchAssetStatuses());
            
            // Also refresh the local state
            setTimeout(() => {
                dispatch(fetchAssetStatuses());
            }, 100);
            
        } catch (error) {
            console.error('Error adding status label:', error);
            const errorMessage = error?.message || "Failed to add status label";
            toast.error(errorMessage);
        }
    };

    const handleStatusFieldChange = (statusId, field, value) => {
        console.log('=== handleStatusFieldChange CALLED ===');
        console.log('handleStatusFieldChange called:', { statusId, field, value });
        console.log('Current editedStatuses before change:', editedStatuses);
        
        if (field === 'editing' && value === true) {
            console.log('Starting editing mode for status:', statusId);
            // Start editing mode
        dispatch(updateStatusLocal({ statusId, field, value }));
        } else {
            console.log('Updating field for status:', { statusId, field, value });
            // Update field
            dispatch(updateStatusLocal({ statusId, field, value }));
        }
        
        // Also update local state for immediate UI feedback
        setEditedStatuses(editedStatuses.map(s => {
            const sId = s.statusLabelId || s.statusId || s.id;
            const matches = (sId === statusId);
            if (matches) {
                console.log('Updating status in local state:', { 
                    before: s, 
                    field, 
                    value, 
                    after: { ...s, [field]: value } 
                });
            }
            return matches ? { ...s, [field]: value } : s;
        }));
        
        console.log('Current editedStatuses after change:', editedStatuses);
    };

    // Utility function for batch updating status labels (if needed in the future)
    const handleBatchUpdateStatuses = async (statusesData) => {
        try {
            // Get company ID from session storage
            const companyId = sessionStorage.getItem("employeeCompanyId") || 
                             sessionStorage.getItem("companyId") || 
                             sessionStorage.getItem("company");
            
            if (!companyId) {
                toast.error("Company ID not found in session");
                return false;
            }
            
            // Prepare batch request payload
            const batchPayload = statusesData.map(status => ({
                statusLabelId: status.statusLabelId || status.statusId || status.id,
                name: status.name,
                companyId: companyId,
                isActive: true,
                color: status.color || "#6B7280", // Default color
                description: status.description || null,
                sortOrder: status.sortOrder || 0 // Default sort order
            }));
            
            // Note: API doesn't show batch endpoint for status labels, but keeping this for future use
            // For now, we'll update them individually
            let successCount = 0;
            for (const statusData of batchPayload) {
                try {
                    const tokenRaw = getItemFromSessionStorage('token', null);
                    const token = typeof tokenRaw === 'string' ? tokenRaw : (tokenRaw?.token || tokenRaw?.accessToken || '');
                    const headers = token ? { Authorization: `Bearer ${token}` } : {};
                    
                    const updateUrl = `${publicRuntimeConfig.apiURL}/api/asset-settings/status-labels/${statusData.statusLabelId}`;
                    console.log('[batch-update-status-label] PATCH', updateUrl, statusData);
                    
                    const response = await fetch(updateUrl, {
                        method: 'PATCH',
                        headers: {
                            ...headers,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(statusData)
                    });
                    
                    if (response.ok) {
                        successCount++;
                    }
                } catch (error) {
                    console.error(`Error updating status label ${statusData.statusLabelId}:`, error);
                }
            }
            
            if (successCount === batchPayload.length) {
                toast.success("All status labels updated successfully!");
                return true;
            } else if (successCount > 0) {
                toast.warning(`${successCount} out of ${batchPayload.length} status labels updated successfully`);
                return true;
            } else {
                toast.error("Failed to update any status labels");
                return false;
            }
            
        } catch (error) {
            console.error('Error batch updating status labels:', error);
            const errorMessage = error?.message || "Failed to batch update status labels";
            toast.error(errorMessage);
            return false;
        }
    };

    const handleSaveStatuses = async (statusId = null) => {
        console.log('=== STATUS SAVE FUNCTION CALLED ===');
        console.log('handleSaveStatuses called with statusId:', statusId);
        console.log('Current editedStatuses:', editedStatuses);
        console.log('Current statuses from Redux:', statuses);
        
        if (statusId) {
            // Save individual status
            console.log('Looking for status with ID:', statusId);
            console.log('Available statuses in editedStatuses:', editedStatuses.map(s => ({
                id: s.id,
                statusId: s.statusId,
                    statusLabelId: s.statusLabelId,
                name: s.name
            })));
            
            const status = editedStatuses.find(s => {
                const sId = s.statusLabelId || s.statusId || s.id;
                console.log('Checking status:', { 
                    name: s.name,
                    sId, 
                    matches: sId === statusId 
                });
                return sId === statusId;
            });
            console.log('Found status to update:', status);
            console.log('Status ID fields:', { 
                id: status?.id, 
                statusId: status?.statusId, 
                statusLabelId: status?.statusLabelId 
            });
            
            if (status) {
                console.log('Attempting to save status:', { statusId, status });
                
                try {
                    // Get company ID from session storage
                    const companyId = sessionStorage.getItem("employeeCompanyId") || 
                                     sessionStorage.getItem("companyId") || 
                                     sessionStorage.getItem("company");
                    
                    console.log('Company ID from session:', companyId);
                    
                    if (!companyId) {
                        toast.error("Company ID not found in session");
                        return;
                    }
                    
                    // Prepare request payload according to API specification
                    const statusData = {
                        name: status.name,
                        companyId: companyId,
                        isActive: true,
                        // Set default values as per API documentation
                        color: status.color || "#6B7280", // Default color
                        description: status.description || null,
                        sortOrder: status.sortOrder || 0 // Default sort order
                    };
                    
                    console.log('Status data to update:', statusData);
                    console.log('Status ID being used:', status.statusLabelId || status.statusId || status.id);
                    
                    // Try direct API call first
                    try {
                        const tokenRaw = getItemFromSessionStorage('token', null);
                        const token = typeof tokenRaw === 'string' ? tokenRaw : (tokenRaw?.token || tokenRaw?.accessToken || '');
                        const headers = token ? { Authorization: `Bearer ${token}` } : {};
                        
                        // Use the correct API endpoint based on the documentation
                        const statusLabelId = status.statusLabelId || status.statusId || status.id;
                        const updateUrl = `${publicRuntimeConfig.apiURL}/api/asset-settings/status-labels/${statusLabelId}`;
                        console.log('[update-status-label] PATCH', updateUrl, statusData);
                        
                        const response = await fetch(updateUrl, {
                            method: 'PATCH',
                            headers: {
                                ...headers,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(statusData)
                        });
                        
                        console.log('API Response status:', response.status);
                        console.log('API Response headers:', response.headers);
                        
                        if (!response.ok) {
                            const errorData = await response.json().catch(() => ({}));
                            console.error('API Error response:', errorData);
                            throw new Error(errorData.message || `Status label update failed (${response.status})`);
                        }
                        
                        const result = await response.json();
                        console.log('Status label update response:', result);
                        
                        // Clear editing state
                        handleStatusFieldChange(statusId, 'editing', false);
                        toast.success("Status label updated successfully!");
                        
                        // Refresh statuses from backend to get updated data
                        dispatch(fetchAssetStatuses());
                        
                        // Also refresh the local state
                        setTimeout(() => {
                            dispatch(fetchAssetStatuses());
                        }, 100);
                        
                        return; // Success, exit function
                        
                    } catch (apiError) {
                        console.error('Direct API call failed, trying Redux action as fallback:', apiError);
                        
                        // Fallback to Redux action
                        try {
                            console.log('Trying Redux action as fallback...');
                            console.log('Redux action payload:', {
                                statusLabelId: status.statusLabelId || status.statusId || status.id,
                                assetData: { 
                                    name: status.name,
                                    ...(status.color && { color: status.color }),
                                    ...(status.description && { description: status.description }),
                                    ...(status.sortOrder && { sortOrder: status.sortOrder })
                                }
                            });
                            
                            const reduxResult = await dispatch(updateAssetStatus({
                                statusLabelId: status.statusLabelId || status.statusId || status.id,
                                assetData: { 
                                    name: status.name,
                                    color: status.color || "#6B7280",
                                    description: status.description || null,
                                    sortOrder: status.sortOrder || 0
                                }
                            })).unwrap();
                            
                            console.log('Redux action result:', reduxResult);
                            
                            // Clear editing state
                            handleStatusFieldChange(statusId, 'editing', false);
                            toast.success("Status label updated successfully via Redux!");
                            
                            // Refresh statuses from backend to get updated data
                            dispatch(fetchAssetStatuses());
                            
                            // Also refresh the local state
                            setTimeout(() => {
                                dispatch(fetchAssetStatuses());
                            }, 100);
                            
                        } catch (reduxError) {
                            console.error('Redux action also failed:', reduxError);
                            console.error('Redux error details:', {
                                message: reduxError.message,
                                stack: reduxError.stack,
                                payload: reduxError.payload
                            });
                            throw new Error(`Both API and Redux failed: ${apiError.message} | Redux: ${reduxError.message}`);
                        }
                    }
                    
        } catch (error) {
                    console.error('Error updating status label:', error);
                    const errorMessage = error?.message || "Failed to update status label";
                    toast.error(errorMessage);
                }
            } else {
                console.error('Status not found for ID:', statusId);
                toast.error("Status not found");
            }
        } else {
            console.error('No status ID provided to handleSaveStatuses');
        }
    };

    const handleCancelStatuses = (statusId = null) => {
        if (statusId) {
            // Cancel individual status editing
            const originalStatus = statuses.find(s => {
                const sId = s.statusLabelId || s.statusId || s.id;
                return sId === statusId;
            });
            
            if (originalStatus) {
                setEditedStatuses(editedStatuses.map(s => {
                    const sId = s.statusLabelId || s.statusId || s.id;
                    return sId === statusId ? { ...originalStatus, editing: false } : s;
                }));
        toast.info("Status changes cancelled.");
            }
        }
    };

    const handleDeleteStatus = (statusId, name) => {
        // ✅ VALIDATION - Check if statusId is valid
        if (!statusId || statusId === 'undefined' || statusId === undefined) {
            console.error('Invalid status label ID:', statusId);
            toast.error('Please select a valid status label to delete');
            return;
        }

        console.log('Attempting to delete status label:', { statusId, name });
        
        // Check if any assets are using this status label
        const assetsUsingStatus = assets.filter(asset => {
            const assetStatusId = asset.statusLabelId || asset.statusId;
            return assetStatusId === statusId;
        });
        
        if (assetsUsingStatus.length > 0) {
            // Show warning modal with details about assets using this status
            setDeleteStatusModal({ 
                open: true, 
                statusId, 
                name,
                warning: true,
                assetsCount: assetsUsingStatus.length,
                assetsList: assetsUsingStatus.slice(0, 5) // Show first 5 assets
            });
        } else {
            // No assets using this status, proceed with deletion
            setDeleteStatusModal({ open: true, statusId, name, warning: false });
        }
    };
    
    const confirmDeleteStatus = async () => {
        // ✅ VALIDATION - Check if statusId is valid before making the request
        if (!deleteStatusModal.statusId || deleteStatusModal.statusId === 'undefined' || deleteStatusModal.statusId === undefined) {
            console.error('Invalid status label ID in modal:', deleteStatusModal.statusId);
            toast.error('Cannot delete: Invalid status label ID');
            setDeleteStatusModal({ open: false, statusId: null, name: '', warning: false });
            return;
        }

        console.log('Confirming deletion of status label:', deleteStatusModal.statusId);
        
        try {
            await dispatch(deleteAssetStatus(deleteStatusModal.statusId)).unwrap();
            toast.success("Status label deleted successfully!");
        } catch (error) {
            console.error('Error deleting status label:', error);
            
            // Show backend response in toast
            const errorMessage = error?.message || error?.data?.message || error?.error || "Failed to delete status label";
            
            // Check if the error is about assets using this status
            if (error && error.includes && error.includes('assets')) {
                toast.error("Cannot delete status label: Assets are currently using this status");
            } else if (error && error.includes && error.includes('Invalid status label ID')) {
                toast.error("Invalid status label ID. Please refresh the page and try again.");
            } else {
                toast.error(`Status label deletion failed: ${errorMessage}`);
            }
            console.error('Backend error response:', error);
        }
        setDeleteStatusModal({ open: false, statusId: null, name: '', warning: false });
    };
    
    const cancelDeleteStatus = () => {
        setDeleteStatusModal({ 
            open: false, 
            statusId: null, 
            name: '', 
            warning: false,
            assetsCount: 0,
            assetsList: []
        });
    };

    // Custom Form management functions
    const handleDeleteForm = (formId) => {
        // Show custom confirmation modal instead of browser confirm
        const form = forms.find(f => f.id === formId || f.formId === formId);
        setDeleteFormModal({ 
            open: true, 
            formId, 
            formName: form?.name || 'Unknown Form'
        });
    };

    const confirmDeleteForm = async () => {
        const { formId } = deleteFormModal;
        try {
            await dispatch(deleteCustomForm(formId)).unwrap();
            toast.success("Form deleted successfully!");
            setDeleteFormModal({ open: false, formId: null, formName: '' });
        } catch (error) {
            console.error('Error deleting form:', error);
            // Show backend response in toast
            const errorMessage = error?.message || error?.data?.message || error?.error || "Failed to delete form";
            toast.error(`Form deletion failed: ${errorMessage}`);
        }
    };

    const cancelDeleteForm = () => {
        setDeleteFormModal({ open: false, formId: null, formName: '' });
    };

    // ID Format Management placeholder functions (implement as needed)
    const handleAddIdFormat = (categoryId) => {
        console.log('Add ID format for category:', categoryId);
    };

    const handleEditIdFormat = (categoryId, field, value) => {
        console.log('Edit ID format for category:', categoryId, field, value);
    };

    const handleSaveIdFormat = (categoryId) => {
        console.log('Save ID format for category:', categoryId);
    };

    const handleCancelIdFormat = (categoryId) => {
        console.log('Cancel ID format for category:', categoryId);
    };

    const handleDeleteIdFormat = (categoryId) => {
        console.log('Delete ID format for category:', categoryId);
    };

    const settingsTabs = [
        { 
            id: 'categories', 
            label: 'Categories', 
            icon: FaListAlt, 
            editing: editingCategories,
            setEditing: setEditingCategories,
            onSave: null, // No global save button - inline editing
            onCancel: null, // No global cancel button - inline editing
            component: <CategorySettings 
                editing={editingCategories} 
                editedCategories={editedCategories} 
                setEditedCategories={setEditedCategories} 
                newCategory={newCategory} 
                setNewCategory={setNewCategory} 
                onAdd={handleAddCategory} 
                onFieldChange={handleCategoryFieldChange} 
                loading={loading} 
                onDelete={handleDeleteCategory}
                onSave={handleSaveCategories}
                onCancel={handleCancelCategories}
                onAddSubCategory={handleAddSubCategory}
                onEditSubCategory={handleEditSubCategory}
                onDeleteSubCategory={handleDeleteSubCategory}
                onSaveSubCategory={handleSaveSubCategory}
                onCancelSubCategory={handleCancelSubCategory}
                onFetchSubCategoriesByCategory={handleFetchSubCategoriesByCategory}
                onFetchSubCategoryById={handleFetchSubCategoryById}
                onAddIdFormat={handleAddIdFormat}
                onEditIdFormat={handleEditIdFormat}
                onDeleteIdFormat={handleDeleteIdFormat}
                onSaveIdFormat={handleSaveIdFormat}
                onCancelIdFormat={handleCancelIdFormat}
            /> 
        },
        { 
            id: 'locations', 
            label: 'Locations', 
            icon: FaMapMarkedAlt, 
            editing: false, // No global editing state - inline editing only
            setEditing: () => {}, // No-op function
            onSave: null, // No global save button - inline editing
            onCancel: null, // No global cancel button - inline editing
            component: <LocationSettings 
                editing={false} 
                editedLocations={editedLocations} 
                setEditedLocations={setEditedLocations} 
                newLocation={newLocation} 
                setNewLocation={setNewLocation} 
                onAdd={handleAddLocation} 
                onFieldChange={handleLocationFieldChange} 
                loading={locationsLoading} 
                onDelete={handleDeleteLocation}
                onSave={handleSaveLocations}
                onCancel={handleCancelLocations}
            /> 
        },
        { 
            id: 'statuses', 
            label: 'Status Labels', 
            icon: FaCheckSquare, 
            editing: false, // No global editing state - inline editing only
            setEditing: () => {}, // No-op function
            onSave: null, // No global save button - inline editing
            onCancel: null, // No global cancel button - inline editing
            component: <StatusSettings 
                editing={false} 
                editedStatuses={editedStatuses} 
                setEditedStatuses={setEditedStatuses} 
                newStatus={newStatus} 
                setNewStatus={setNewStatus} 
                onAdd={handleAddStatus} 
                onFieldChange={handleStatusFieldChange} 
                loading={statusesLoading} 
                onDelete={handleDeleteStatus}
                onSave={handleSaveStatuses}
                onCancel={handleCancelStatuses}
            /> 
        },
        { 
            id: 'customFields', 
            label: 'Custom Form Builder', 
            icon: FaCog, 
            editing: editingCustomFields,
            setEditing: setEditingCustomFields,
            onSave: null, // No global save button - Custom Form Builder has its own Save button
            onCancel: null, // No global cancel button - Custom Form Builder manages its own state
            component: <CustomFormBuilder 
                editing={editingCustomFields} 
                onDeleteForm={handleDeleteForm}
            /> 
        },
    ];

    return (
        <AssetManagementLayout>
            <DeleteCategoryModal
                open={deleteModal.open}
                onClose={cancelDeleteCategory}
                onConfirm={confirmDeleteCategory}
                categoryName={deleteModal.name}
                warning={deleteModal.warning}
                assetsCount={deleteModal.assetsCount}
                assetsList={deleteModal.assetsList}
            />
                        <DeleteLocationModal 
                open={deleteLocationModal.open} 
                onClose={cancelDeleteLocation} 
                onConfirm={confirmDeleteLocation} 
                locationName={deleteLocationModal.name}
                warning={deleteLocationModal.warning}
                assetsCount={deleteLocationModal.assetsCount}
                assetsList={deleteLocationModal.assetsList}
            />
                        <DeleteStatusModal 
                open={deleteStatusModal.open} 
                onClose={cancelDeleteStatus} 
                onConfirm={confirmDeleteStatus} 
                statusName={deleteStatusModal.name}
                warning={deleteStatusModal.warning}
                assetsCount={deleteStatusModal.assetsCount}
                assetsList={deleteStatusModal.assetsList}
            />
            <DeleteFormModal 
                open={deleteFormModal.open} 
                onClose={cancelDeleteForm} 
                onConfirm={confirmDeleteForm} 
                formName={deleteFormModal.formName}
            />
            <div className="p-6">
                <header className="mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Asset Management Settings</h1>
                            <p className="text-gray-500 mt-1">Configure and standardize your company&apos;s asset tracking system.</p>
                        </div>
                    </div>
                    

                </header>
                
                {/* Horizontal Navigation Tabs */}
                <div className="mb-8">
                    <nav className="flex overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
                        {settingsTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-6 py-4 whitespace-nowrap transition-colors border-b-2 ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                            >
                                <tab.icon className="text-lg" />
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
                
                {/* Main Content Area */}
                <div className="space-y-8">
                    {(() => {
                        const activeTabData = settingsTabs.find(tab => tab.id === activeTab);
                        if (!activeTabData) return null;
                        
                        return (
                            <div>
                                {activeTabData.component}
                            </div>
                        );
                    })()}
                </div>
            </div>
        </AssetManagementLayout>
    );
};

export default AssetSettingsPage; 