import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import AssetManagementLayout from '@/components/AssetManagementLayout';
import { fetchAssetByAssetId, fetchAssetById, patchAssetByAssetId, clearCurrentAsset, createAssetWithDTO } from '@/redux/slices/assetSlice';
import { fetchDepartments } from '@/redux/slices/departmentSlice';
import { fetchEmployees } from '@/redux/slices/employeeSlice';
import { fetchAssetCategories } from '@/redux/slices/assetCategorySlice';
import { fetchAssetLocations } from '@/redux/slices/assetLocationSlice';
import { fetchAssetStatuses } from '@/redux/slices/assetStatusSlice';
import { 
    FaEdit, FaHistory, FaFileAlt, FaUser, FaMapMarkerAlt, 
    FaCalendarAlt, FaRupeeSign, FaBarcode, FaLaptop, FaMemory, 
    FaMicrochip, FaHdd, FaDesktop, FaArrowLeft, FaTimes, FaCheck,
    FaExclamationTriangle, FaPlus, FaClock
} from 'react-icons/fa';
import { toast } from 'sonner';
import getConfig from 'next/config';
import { getItemFromSessionStorage } from '@/redux/slices/sessionStorageSlice';

const { publicRuntimeConfig } = getConfig();

// Mock data - replace with actual API call
const MOCK_ASSET_DETAIL = {
    id: 'ASSET-2024-0001',
    name: 'Dell Latitude 5420',
    category: 'IT Equipment',
    serialNumber: 'DL5420-2024-001',
    status: 'Assigned',
    location: 'Mumbai Head Office',
    assignedTo: 'Ankit Matwa',
    assignmentDate: '2024-01-15',
    
    // Financial Details
    purchaseDate: '2024-01-10',
    vendor: 'Dell India Pvt. Ltd.',
    invoiceNumber: 'INV-DEL-2024-001',
    purchaseCost: 65000,
    gstRate: 18,
    itcEligible: 'Yes',
    currentValue: 58000,
    
    // IT Specific Details
    team: 'Development',
    laptopCompany: 'Dell',
    processor: 'Intel Core i7-11th Gen',
    ram: '16GB DDR4',
    memory: '512GB SSD',
    condition: 'Good',
    accessories: 'Charger, Mouse, Laptop Bag',
    graphicsCard: 'Intel Iris Xe Graphics',
    
    // Warranty & Maintenance
    warrantyExpiry: '2027-01-10',
    lastMaintenanceDate: '2024-06-15',
    nextMaintenanceDate: '2024-12-15',
    
    // History
    history: [
        { date: '2024-01-15', action: 'Assigned', details: 'Assigned to Ankit Matwa', user: 'Admin' },
        { date: '2024-01-10', action: 'Purchased', details: 'Asset purchased from Dell India', user: 'Admin' },
        { date: '2024-06-15', action: 'Maintenance', details: 'Routine maintenance completed', user: 'IT Support' }
    ],
    
    // Maintenance Records
    maintenanceRecords: [
        { date: '2024-06-15', type: 'Preventive', description: 'System cleanup and updates', cost: 500, vendor: 'IT Support Team' }
    ],
    
    // Files/Documents
    documents: [
        { name: 'Purchase Invoice', type: 'PDF', uploadDate: '2024-01-10' },
        { name: 'Warranty Certificate', type: 'PDF', uploadDate: '2024-01-10' }
    ]
};

const EditAssetModal = ({ isOpen, onClose, asset, onSave, categories, locations, statuses, loading }) => {
    const [formData, setFormData] = useState({});
    
    useEffect(() => {
        if (asset) {
            setFormData({
                name: asset.name || '',
                statusLabelId: asset.statusLabelId || '',
                locationId: asset.locationId || '',
                assignedTo: asset.assignedTo || '',
            });
        }
    }, [asset]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Edit Asset</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <FaTimes />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Asset Name</label>
                            <input
                                name="name"
                                value={formData.name || ''}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-md"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                name="statusLabelId"
                                value={formData.statusLabelId || ''}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-md"
                            >
                                <option value="">Select Status...</option>
                                {Array.isArray(statuses) && statuses.map(status => (
                                    <option key={status.statusLabelId || status.id} value={status.statusLabelId || status.id}>
                                        {status.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                            <select
                                name="locationId"
                                value={formData.locationId || ''}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-md"
                            >
                                <option value="">Select Location...</option>
                                {Array.isArray(locations) && locations.map(location => (
                                    <option key={location.locationId || location.id} value={location.locationId || location.id}>
                                        {location.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                            <input
                                name="assignedTo"
                                value={formData.assignedTo || ''}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-md"
                            />
                        </div>
                    </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-3 flex justify-end items-center gap-2 rounded-b-lg">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        disabled={loading}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const AssetDetailPage = () => {
    const router = useRouter();
    const { id } = router.query; // This is now the assetId (e.g., "D-03-3001")
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState('overview');
    // Inline edit states for summary cards
    const [editingField, setEditingField] = useState(null); // 'assignedTo' | 'locationId' | 'purchaseCost' | 'warrantyExpiry'
    const [draftValues, setDraftValues] = useState({
        assignedTo: '',
        locationId: '',
        purchaseCost: '',
        warrantyExpiry: '',
    });
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [documentFile, setDocumentFile] = useState(null);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [editingOverview, setEditingOverview] = useState(false);
    const [overviewDraft, setOverviewDraft] = useState({
        categoryId: '',
        statusLabelId: '',
        purchaseDate: '',
        purchaseCost: '',
        gstRate: '',
        invoiceNumber: '',
    });
    const [savingOverview, setSavingOverview] = useState(false);
    const [editingSpecs, setEditingSpecs] = useState(false);
    const [specsDraft, setSpecsDraft] = useState({ customFields: {}, formData: {} });
    const [savingSpecs, setSavingSpecs] = useState(false);
    // History state from API
    const [historyEvents, setHistoryEvents] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState(null);
    // Close document modal when leaving Documents tab
    useEffect(() => {
        if (activeTab !== 'documents' && isDocumentModalOpen) {
            setIsDocumentModalOpen(false);
        }
    }, [activeTab, isDocumentModalOpen]);
    
    // Get data from Redux store
    const { currentAsset: asset, loading: fetchingAsset, error: fetchAssetError, updatingAsset, updateAssetError } = useSelector(state => state.assets);
    const { categories } = useSelector(state => state.assetCategories);
    const { locations } = useSelector(state => state.assetLocations);
    const { statuses } = useSelector(state => state.assetStatuses);
    const { departments } = useSelector(state => state.department || {});
    const { employees } = useSelector(state => state.employees || {});
    

    
    useEffect(() => {
        if (id) {
            // Clear previous asset data
            dispatch(clearCurrentAsset());
            
            // Fetch the specific asset by asset ID (e.g., "D-03-3001")
            dispatch(fetchAssetByAssetId(id));
        }
        
        // Cleanup when component unmounts
        return () => {
            dispatch(clearCurrentAsset());
        };
    }, [id, dispatch]);

    // Ensure departments and employees are loaded for assignment editing
    useEffect(() => {
        if (!departments || departments.length === 0) {
            dispatch(fetchDepartments());
        }
        if (!employees || employees.length === 0) {
            dispatch(fetchEmployees());
        }
    }, [dispatch, departments, employees]);
    
    // Fetch reference data when asset is loaded and we need to display names
    useEffect(() => {
        if (asset && (asset.categoryId || asset.locationId)) {
            // Only fetch categories and locations if we have IDs to resolve
            if (asset.categoryId && (!categories || categories.length === 0)) {
                dispatch(fetchAssetCategories());
            }
            if (asset.locationId && (!locations || locations.length === 0)) {
                dispatch(fetchAssetLocations());
            }
        }
    }, [asset, categories, locations, dispatch]);
    
    // Ensure statuses are available to display status name/badge
    useEffect(() => {
        if (asset?.statusLabelId && (!statuses || statuses.length === 0)) {
            dispatch(fetchAssetStatuses());
        }
    }, [asset?.statusLabelId, statuses, dispatch]);

    // Ensure reference data when editing overview
    useEffect(() => {
        if (editingOverview) {
            if (!categories || categories.length === 0) dispatch(fetchAssetCategories());
            if (!statuses || statuses.length === 0) dispatch(fetchAssetStatuses());
        }
    }, [editingOverview, categories, statuses, dispatch]);
    
    // Debug: Log asset object when it's loaded
    useEffect(() => {
        if (asset) {
            console.log('Asset loaded:', asset);
            console.log('Asset fields:', Object.keys(asset));
            console.log('Asset subcategory fields:', {
                subCategoryId: asset.subCategoryId,
                subcategoryId: asset.subcategoryId,
                sub_category_id: asset.sub_category_id,
                subcategory_id: asset.subcategory_id,
                subCategory: asset.subCategory,
                subcategory: asset.subcategory
            });
        }
    }, [asset]);
    
    // Handle errors with toast notifications
    useEffect(() => {
        if (fetchAssetError) {
            toast.error(`Failed to fetch asset: ${fetchAssetError}`);
        }
        if (updateAssetError) {
            toast.error(`Failed to update asset: ${updateAssetError}`);
        }
    }, [fetchAssetError, updateAssetError]);
    
    // Helper functions to map IDs to names
    const getCategoryName = (categoryId) => {
        if (!categoryId) return 'No Category';
        if (!Array.isArray(categories) || categories.length === 0) return 'Loading...';
        const category = categories.find(c => (c.categoryId || c.id) === categoryId);
        return category ? category.name : 'Unknown Category';
    };

    const getLocationName = (locationId) => {
        if (!locationId) return 'No Location';
        if (!Array.isArray(locations) || locations.length === 0) return 'Loading...';
        const location = locations.find(l => (l.locationId || l.id) === locationId);
        return location ? location.name : 'Unknown Location';
    };

    const getStatusName = (statusLabelId) => {
        if (!statusLabelId) return 'No Status'; // More accurate when no statusLabelId
        if (!Array.isArray(statuses)) return 'Loading...';
        const status = statuses.find(s => (s.statusLabelId || s.id) === statusLabelId);
        return status ? status.name : 'Unknown Status';
    };

    const getSubcategoryName = (subcategoryId) => {
        if (!subcategoryId) return 'No Subcategory';
        if (!Array.isArray(categories) || categories.length === 0) return 'Loading...';
        
        // Find the category that contains this subcategory
        for (const category of categories) {
            if (category.subCategories && Array.isArray(category.subCategories)) {
                const subcategory = category.subCategories.find(sub => 
                    (sub.subCategoryId || sub.id) === subcategoryId
                );
                if (subcategory) {
                    return subcategory.name;
                }
            }
        }
        return 'Unknown Subcategory';
    };

    const getDepartmentName = (departmentId) => {
        if (!departmentId) return 'No Department';
        if (!Array.isArray(departments) || departments.length === 0) return 'Loading...';
        const dept = departments.find(d => (d.departmentId || d.id) === departmentId);
        return dept ? dept.name : 'Unknown Department';
    };

    const getEmployeeName = (employeeId) => {
        if (!employeeId) return '';
        if (!Array.isArray(employees) || employees.length === 0) return '';
        
        const emp = employees.find(e => {
            const eId = e.employeeId || e.id || e._id;
            return String(eId) === String(employeeId);
        });
        
        if (!emp) return '';
        
        return emp.name || emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
    };

    // Build a robust, ordered asset timeline from various possible shapes
    const parseDateSafe = (value) => {
        if (!value) return null;
        try {
            if (typeof value === 'number') return new Date(value);
            if (typeof value === 'string') {
                // support ISO, yyyy-mm-dd, dd/mm/yyyy
                const asNum = Number(value);
                if (!Number.isNaN(asNum) && asNum > 0) return new Date(asNum);
                const replaced = value.includes('/')
                    ? value.split('/').reverse().join('-')
                    : value;
                const d = new Date(replaced);
                return isNaN(d.getTime()) ? null : d;
            }
            if (value instanceof Date) return value;
        } catch (_) { /* ignore */ }
        return null;
    };

    const formatDateTime = (d) => {
        if (!(d instanceof Date) || isNaN(d.getTime())) return '';
        return d.toLocaleString();
    };

    const buildAssetTimeline = (assetObj) => {
        const events = [];

        // 1) Server-provided history array (preferred if present)
        const serverHistory = Array.isArray(assetObj?.history) ? assetObj.history : [];
        for (const h of serverHistory) {
            const date = parseDateSafe(h.date || h.createdAt || h.time || h.timestamp);
            const action = h.action || h.type || 'Update';
            const byUser = h.user || h.performedBy || h.actor;
            const details = h.details || h.message || '';
            if (date) {
                events.push({ date, label: action, right: [details, byUser ? `by ${byUser}` : ''].filter(Boolean).join(' • ') });
            }
        }

        // 2) Creation
        const creationDate = parseDateSafe(
            assetObj?.createdAt || assetObj?.createdOn || assetObj?.creationDate || assetObj?.purchaseDate
        );
        if (creationDate) {
            events.push({ date: creationDate, label: 'Asset created', right: assetObj.assetId || '' });
        }

        // 3) Assignment changes
        const assignmentHistory = assetObj?.assignmentHistory || assetObj?.assignmentLogs || [];
        if (Array.isArray(assignmentHistory) && assignmentHistory.length > 0) {
            for (const a of assignmentHistory) {
                const date = parseDateSafe(a.date || a.on || a.timestamp);
                const from = a.from || a.fromUser || a.prev || a.previous || 'Unassigned';
                const to = a.to || a.toUser || a.next || a.new || a.assignedTo;
                if (date && to) {
                    events.push({ date, label: 'Assigned', right: `${from ? `${from} → ` : ''}${to}` });
                }
            }
        } else if (assetObj?.assignedTo && (assetObj.assignmentDate || creationDate)) {
            // Fallback: single assignment
            const date = parseDateSafe(assetObj.assignmentDate || creationDate);
            if (date) events.push({ date, label: 'Assigned', right: `Unassigned → ${assetObj.assignedTo}` });
        }

        // 4) Location changes
        const locationHistory = assetObj?.locationHistory || assetObj?.locationLogs || [];
        if (Array.isArray(locationHistory) && locationHistory.length > 0) {
            for (const l of locationHistory) {
                const date = parseDateSafe(l.date || l.on || l.timestamp);
                const fromId = l.from || l.prev || l.previousLocationId;
                const toId = l.to || l.next || l.newLocationId || l.locationId;
                const fromName = fromId ? getLocationName(fromId) : '';
                const toName = toId ? getLocationName(toId) : '';
                if (date && (fromName || toName)) {
                    events.push({ date, label: 'Location changed', right: `${fromName ? `${fromName} → ` : ''}${toName}` });
                }
            }
        }

        // 5) Status changes
        const statusHistory = assetObj?.statusHistory || assetObj?.statusLogs || [];
        if (Array.isArray(statusHistory) && statusHistory.length > 0) {
            for (const s of statusHistory) {
                const date = parseDateSafe(s.date || s.on || s.timestamp);
                const fromId = s.from || s.prev || s.previousStatusId;
                const toId = s.to || s.next || s.newStatusId || s.statusLabelId;
                const fromName = fromId ? getStatusName(fromId) : '';
                const toName = toId ? getStatusName(toId) : '';
                if (date && (fromName || toName)) {
                    events.push({ date, label: 'Status changed', right: `${fromName ? `${fromName} → ` : ''}${toName}` });
                }
            }

        }

        // Sort ascending by date
        events.sort((a, b) => (a.date?.getTime?.() || 0) - (b.date?.getTime?.() || 0));
        return events;
    };

    // --- History formatting helpers ---
    const isDeptField = (f) => {
        const s = String(f || '').toLowerCase();
        return (
            /^(assigneddepartmentid|assigneddepartment)$/.test(s) ||
            s.includes('assigned department') ||
            s === 'department'
        );
    };
    const isEmpField = (f) => {
        const s = String(f || '').toLowerCase();
        return (
            /^(assignedemployeeid|assignedto)$/.test(s) ||
            s.includes('assigned employee') ||
            s.includes('assignee') ||
            s === 'employee'
        );
    };

    const displayFieldName = (f) => {
        if (isDeptField(f)) return 'Department';
        if (isEmpField(f)) return 'Assignee';
        const s = String(f || 'Field');
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    const formatValueForField = (fieldName, rawValue) => {
        if (rawValue === null || rawValue === undefined || rawValue === '') return '—';
        const lower = String(fieldName || '').toLowerCase();
        // Assigned department/employee mapping to names
        if (lower === 'assigneddepartmentid') return getDepartmentName(rawValue);
        if (lower === 'assignedemployeeid') return getEmployeeName(rawValue);
        if (lower === 'assigneddepartment') return String(rawValue);
        if (lower === 'assignedto') return String(rawValue);
        // ID to label resolvers
        if (lower.includes('status')) {
            if (typeof rawValue === 'string' && !/^STAT[-_]/i.test(rawValue)) {
                return String(rawValue);
            }
            return getStatusName(rawValue);
        }
        if (lower.includes('location')) {
            if (typeof rawValue === 'string' && !/^LOC[-_]/i.test(rawValue)) {
                return String(rawValue);
            }
            return getLocationName(rawValue);
        }
        if (lower.includes('category')) return getCategoryName(rawValue);

        // Dates
        if (lower.includes('date') || lower.endsWith('at')) {
            const d = parseDateSafe(rawValue);
            if (d) return d.toLocaleString();
        }

        // Currency / numeric
        if (lower.includes('cost') || lower.includes('amount') || lower.includes('price') || lower.includes('value')) {
            const n = Number(rawValue);
            if (!Number.isNaN(n)) return `₹${n.toLocaleString('en-IN')}`;
        }

        if (typeof rawValue === 'boolean') return rawValue ? 'Yes' : 'No';
        if (typeof rawValue === 'number') return String(rawValue);
        if (typeof rawValue === 'object') {
            try { return JSON.stringify(rawValue); } catch (_) { return String(rawValue); }
        }
        return String(rawValue);
    };

    const extractChangesFromEvent = (evt) => {
        try {
            // 1) Array of change objects
            if (Array.isArray(evt?.changes)) {
                return evt.changes.map((c) => {
                    const field = c.field || c.key || c.name || c.attribute || 'Field';
                    const from = c.from ?? c.old ?? c.previous ?? c.prev ?? null;
                    const to = c.to ?? c.new ?? c.next ?? null;
                    return { field, from, to };
                }).filter(Boolean);
            }

            // 2) Object diff map
            const diffMaps = [evt?.diff, evt?.fields, evt?.updates, evt?.changesMap];
            for (const map of diffMaps) {
                if (map && typeof map === 'object') {
                    return Object.entries(map).map(([field, val]) => {
                        if (val && typeof val === 'object') {
                            const from = val.from ?? val.old ?? val.previous ?? (Array.isArray(val) ? val[0] : null);
                            const to = val.to ?? val.new ?? val.next ?? (Array.isArray(val) ? val[1] : null);
                            return { field, from, to };
                        }
                        return { field, from: undefined, to: val };
                    });
                }
            }

            // 3) Before/after maps
            const before = evt?.oldValues || evt?.previous || evt?.before;
            const after = evt?.newValues || evt?.next || evt?.after;
            if (before || after) {
                const keys = new Set([
                    ...Object.keys(before || {}),
                    ...Object.keys(after || {}),
                ]);
                const out = [];
                for (const key of keys) {
                    const from = before ? before[key] : undefined;
                    const to = after ? after[key] : undefined;
                    if (from !== to) out.push({ field: key, from, to });
                }
                return out;
            }
        } catch (_) { /* ignore */ }
        return [];
    };

    // Fetch history events from server
    const fetchAssetHistory = async (assetIdParam, assetData = null) => {
        if (!assetIdParam) return;
        setLoadingHistory(true);
        setHistoryError(null);
        try {
            const tokenRaw = getItemFromSessionStorage('token', null);
            const token = typeof tokenRaw === 'string' ? tokenRaw : (tokenRaw?.token || tokenRaw?.accessToken || '');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const url = `${publicRuntimeConfig.apiURL}/api/assets/${encodeURIComponent(assetIdParam)}/history`;
            const resp = await fetch(url, { headers });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err.message || `Failed to fetch history (${resp.status})`);
            }
            const data = await resp.json();
            
            // If no data returned from API, create a default creation event
            if (!data || data.length === 0) {
                const assetToUse = assetData || asset;
                if (assetToUse) {
                    const creationDate = parseDateSafe(
                        assetToUse.createdAt || assetToUse.createdOn || assetToUse.creationDate || assetToUse.purchaseDate
                    );
                    if (creationDate) {
                        setHistoryEvents([{
                            date: creationDate,
                            label: 'Asset Created',
                            right: `Asset ID: ${assetToUse.assetId || 'N/A'}`,
                            type: 'creation',
                            priority: 1,
                            changes: []
                        }]);
                        setLoadingHistory(false);
                        return;
                    }
                }
            }

            const resolveHistoryValue = (field, raw, evt, which) => {
                // Prefer explicit name/display fields if provided by API
                if (isDeptField(field)) {
                    const deptOld = evt?.assignedOldDepartment || evt?.oldDepartment || evt?.oldDepartmentName;
                    const deptNew = evt?.assignedNewDepartment || evt?.newDepartment || evt?.newDepartmentName;
                    if (which === 'from' && deptOld) return String(deptOld);
                    if (which === 'to' && deptNew) return String(deptNew);
                    // If server sent the name directly
                    if (typeof raw === 'string' && !/^[A-Z]+-/.test(raw)) return raw;
                    return getDepartmentName(raw);
                }
                if (isEmpField(field)) {
                    const empOld = evt?.assignedOldEmployee || evt?.oldEmployee || evt?.oldEmployeeName;
                    const empNew = evt?.assignedNewEmployee || evt?.newEmployee || evt?.newEmployeeName;
                    if (which === 'from' && empOld) return String(empOld);
                    if (which === 'to' && empNew) return String(empNew);
                    if (typeof raw === 'string' && !/^[A-Z]+-/.test(raw)) return raw;
                    return getEmployeeName(raw) || String(raw || '');
                }
                return formatValueForField(field, raw);
            };
            const toLabel = (evtType, field) => {
                switch (evtType) {
                    case 'STATUS_CHANGED': return 'Status changed';
                    case 'LOCATION_CHANGED': return 'Location changed';
                    case 'ASSIGNED': return 'Assigned';
                    case 'UNASSIGNED': return 'Unassigned';
                    case 'CREATED': return 'Asset created';
                    case 'UPDATED': return 'Updated';
                    default:
                        if (isDeptField(field)) return 'Department changed';
                        if (isEmpField(field)) return 'Assignee changed';
                        if (field) return `${String(field)} updated`;
                        return 'Update';
                }
            };
            const equalish = (a, b) => {
                const norm = (v) => {
                    if (v === null || v === undefined) return '';
                    if (typeof v === 'string') return v.trim().toLowerCase();
                    return String(v).trim().toLowerCase();
                };
                return norm(a) === norm(b);
            };

            const normalized = Array.isArray(data)
                ? data.map((h) => {
                      const date = parseDateSafe(h.timestamp || h.date || h.createdAt || h.time);
                      const field = h.field || h.attribute;
                      let label = (typeof h.eventType === 'string' && h.eventType.trim() !== '')
                          ? String(h.eventType)
                          : toLabel(h.type || h.action, field);
                      const actor = h.actorUserId || h.user || h.performedBy || h.actor;
                      const fromResolved = resolveHistoryValue(field, h.oldValue, h, 'from');
                      const toResolved = resolveHistoryValue(field, h.newValue, h, 'to');
                      const changes = [{ field, from: h.oldValue, to: h.newValue, displayFrom: fromResolved, displayTo: toResolved }];

                      // Enrich with implicit dept/emp/status/location changes if present in payload
                      if (h.assignedOldDepartment !== undefined || h.assignedNewDepartment !== undefined) {
                          const dFrom = h.assignedOldDepartment ?? h.oldDepartment ?? h.oldDepartmentName ?? null;
                          const dTo = h.assignedNewDepartment ?? h.newDepartment ?? h.newDepartmentName ?? null;
                          changes.push({ field: 'assignedDepartment', from: dFrom, to: dTo, displayFrom: dFrom || undefined, displayTo: dTo || undefined });
                      }
                      if ((h.assignedOldEmployee !== undefined || h.assignedNewEmployee !== undefined) && !isEmpField(field)) {
                          const eFrom = h.assignedOldEmployee ?? h.oldEmployee ?? h.oldEmployeeName ?? null;
                          const eTo = h.assignedNewEmployee ?? h.newEmployee ?? h.newEmployeeName ?? null;
                          changes.push({ field: 'assignedTo', from: eFrom, to: eTo, displayFrom: eFrom || undefined, displayTo: eTo || undefined });
                      }
                      if (h.oldStatus !== undefined || h.newStatus !== undefined) {
                          changes.push({ field: 'status', from: h.oldStatus ?? null, to: h.newStatus ?? null, displayFrom: h.oldStatus || undefined, displayTo: h.newStatus || undefined });
                      }
                      if (h.oldLocation !== undefined || h.newLocation !== undefined) {
                          changes.push({ field: 'location', from: h.oldLocation ?? null, to: h.newLocation ?? null, displayFrom: h.oldLocation || undefined, displayTo: h.newLocation || undefined });
                      }

                      // Keep only true changes (from != to) using display values when available
                      const filteredChanges = changes.filter((c) => !equalish(c.displayFrom ?? c.from, c.displayTo ?? c.to));

                      const hasDeptLocal = filteredChanges.some((c) => isDeptField(c.field));
                      const hasEmpLocal = filteredChanges.some((c) => isEmpField(c.field));

                      const summaryParts = [];
                      for (const c of filteredChanges) {
                          const isD = isDeptField(c.field);
                          const isE = isEmpField(c.field);
                          const fVal = c.displayFrom ?? (isD ? formatValueForField('assignedDepartment', c.from) : isE ? formatValueForField('assignedTo', c.from) : formatValueForField(c.field, c.from));
                          const tVal = c.displayTo ?? (isD ? formatValueForField('assignedDepartment', c.to) : isE ? formatValueForField('assignedTo', c.to) : formatValueForField(c.field, c.to));
                          if (isD) summaryParts.push(`Department: ${fVal || '—'} → ${tVal || '—'}`);
                          else if (isE) summaryParts.push(`Assignee: ${fVal || '—'} → ${tVal || '—'}`);
                          else summaryParts.push(`${displayFieldName(c.field)}: ${fVal || '—'} → ${tVal || '—'}`);
                      }
                      if (actor) summaryParts.push(`by ${actor}`);
                      const right = summaryParts.join(' • ');
                      if (!date) return null;
                      if (filteredChanges.length === 0) return null; // nothing changed
                      return { date, label, right, raw: h, changes: filteredChanges };
                  }).filter(Boolean)
                : [];
            // Group events that happened at the same second into a single card
            const bySecond = new Map();
            for (const evt of normalized) {
                const sec = Math.floor((evt.date?.getTime?.() || 0) / 1000);
                if (!bySecond.has(sec)) {
                    bySecond.set(sec, { date: evt.date, raw: [evt.raw], changes: [...(evt.changes || [])] });
                } else {
                    const g = bySecond.get(sec);
                    g.raw.push(evt.raw);
                    g.changes.push(...(evt.changes || []));
                }
            }
            // Build combined entries with smart labels and right summaries
            const combined = Array.from(bySecond.values()).map((g) => {
                // Prefer backend eventType as-is if available on the first raw record in the group
                let label = String((g.raw && g.raw[0] && (g.raw[0].eventType || g.raw[0].type || g.raw[0].action)) || 'Update');

                const parts = [];
                const pushPart = (title, from, to) => {
                    parts.push(`${title}: ${from || '—'} → ${to || '—'}`);
                };
                for (const c of g.changes) {
                    const isD = isDeptField(c.field);
                    const isE = isEmpField(c.field);
                    const fromVal = c.displayFrom ?? (isD ? formatValueForField('assignedDepartment', c.from) : isE ? formatValueForField('assignedTo', c.from) : formatValueForField(c.field, c.from));
                    const toVal = c.displayTo ?? (isD ? formatValueForField('assignedDepartment', c.to) : isE ? formatValueForField('assignedTo', c.to) : formatValueForField(c.field, c.to));
                    if (equalish(fromVal, toVal)) continue; // skip unchanged
                    if (isD) pushPart('Department', fromVal, toVal);
                    else if (isE) pushPart('Assignee', fromVal, toVal);
                    else pushPart(displayFieldName(c.field), fromVal, toVal);
                }
                // After skipping unchanged, if nothing left, drop this card
                if (parts.length === 0) return null;
                return { date: g.date, label, right: parts.join(' • '), raw: g.raw[0], changes: g.changes };
            });

            const nonEmpty = combined.filter(Boolean);
            nonEmpty.sort((a, b) => (a.date?.getTime?.() || 0) - (b.date?.getTime?.() || 0));
            
            // Always add the asset creation event if we have asset data
            const assetToUse = assetData || asset;
            if (assetToUse) {
                const creationDate = parseDateSafe(
                    assetToUse.createdAt || assetToUse.createdOn || assetToUse.creationDate || assetToUse.purchaseDate
                );
                if (creationDate) {
                    // Check if creation event already exists in the history
                    const existingCreation = nonEmpty.find(evt => evt.label === 'Asset Created');
                    if (!existingCreation) {
                        nonEmpty.unshift({
                            date: creationDate,
                            label: 'Asset Created',
                            right: `Asset ID: ${assetToUse.assetId || 'N/A'}`,
                            type: 'creation',
                            priority: 1,
                            changes: []
                        });
                    }
                }
            }
            
            setHistoryEvents(nonEmpty);
        } catch (e) {
            setHistoryError(e?.message || 'Failed to fetch history');
            
            // Even if API fails, show the creation event if we have asset data
            const assetToUse = assetData || asset;
            if (assetToUse) {
                const creationDate = parseDateSafe(
                    assetToUse.createdAt || assetToUse.createdOn || assetToUse.creationDate || assetToUse.purchaseDate
                );
                if (creationDate) {
                    setHistoryEvents([{
                        date: creationDate,
                        label: 'Asset Created',
                        right: `Asset ID: ${assetToUse.assetId || 'N/A'}`,
                        type: 'creation',
                        priority: 1,
                        changes: []
                    }]);
                }
            }
        } finally {
            setLoadingHistory(false);
        }
    };

    // Fetch when asset changes
    useEffect(() => {
        if (asset?.assetId) {
            fetchAssetHistory(asset.assetId, asset);
            

        }
    }, [asset?.assetId]);
    
    // Ensure creation event is always shown when asset is available
    useEffect(() => {
        if (asset && !loadingHistory && historyEvents.length === 0) {
            const creationDate = parseDateSafe(
                asset.createdAt || asset.createdOn || asset.creationDate || asset.purchaseDate
            );
            if (creationDate) {
                setHistoryEvents([{
                    date: creationDate,
                    label: 'Asset Created',
                    right: `Asset ID: ${asset.assetId || 'N/A'}`,
                    type: 'creation',
                    priority: 1,
                    changes: []
                }]);
            }
        }
    }, [asset, loadingHistory, historyEvents.length]);

    // Derive Asset display name from custom form data, preferring an "Asset" field
    const getAssetDisplayName = (assetObj) => {
        if (!assetObj) return 'Asset';
        if (assetObj.name) return assetObj.name;
        const fd = assetObj.formData || assetObj.customFields || {};
        const preferredKeys = ['Asset', 'asset', 'Asset Name', 'assetName', 'Name', 'name', 'Model', 'model', 'Title', 'title'];
        for (const key of preferredKeys) {
            const value = fd && fd[key];
            if (value != null && value !== '') return String(value);
        }
        return '';
    };

    // Derive ID display; keep using auto-generated assetId when available
    const getAssetIdDisplay = (assetObj) => {
        if (!assetObj) return '';
        // Only show the auto-generated Asset ID
        if (assetObj.assetId) return String(assetObj.assetId);
        const fd = assetObj.formData || assetObj.customFields || {};
        const formKeys = ['assetId', 'Asset ID', 'AssetId', 'assetID', 'asset_id'];
        for (const key of formKeys) {
            const value = fd && fd[key];
            if (value != null && value !== '') return String(value);
        }
        return '';
    };
    
    const handleSaveAsset = async (updatedAsset) => {
        try {
            // Prepare the asset data for the API
            const assetData = {
                name: updatedAsset.name,
                statusLabelId: updatedAsset.statusLabelId,
                locationId: updatedAsset.locationId,
                assignedTo: updatedAsset.assignedTo,
                // Add other fields as needed
            };
            
            await dispatch(patchAssetByAssetId({ assetId: id, assetData })).unwrap();
            toast.success('Asset updated successfully!');
            
            // Refresh the asset data to show changes instantly
            dispatch(fetchAssetByAssetId(id));
        } catch (error) {
            console.error('Error updating asset:', error);
            toast.error(`Failed to update asset: ${error}`);
        }
    };

    // Inline editing helpers
    const startEditing = (field) => {
        if (!asset) return;
        const newDraft = { ...draftValues };
        if (field === 'assignedTo') {
            // Find the department ID from the assignedDepartment name
            const deptId = asset.assignedDepartment ? 
                (departments || []).find(d => d.name === asset.assignedDepartment)?.id || 
                (departments || []).find(d => d.name === asset.assignedDepartment)?.departmentId : '';
            
            // Find the employee ID from the assignedTo name - try multiple approaches
            let empId = '';
            if (asset.assignedTo) {
                // First try to find by exact name match
                const emp = (employees || []).find(emp => {
                    const empName = emp.name || emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
                    return empName === asset.assignedTo;
                });
                
                if (emp) {
                    empId = emp.employeeId || emp.id || emp._id;
                } else {
                    // If no exact match, try partial match
                    const partialEmp = (employees || []).find(emp => {
                        const empName = emp.name || emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
                        return empName.toLowerCase().includes(asset.assignedTo.toLowerCase()) || 
                               asset.assignedTo.toLowerCase().includes(empName.toLowerCase());
                    });
                    
                    if (partialEmp) {
                        empId = partialEmp.employeeId || partialEmp.id || partialEmp._id;
                    }
                }
            }
            
            // Also check if we have the employee ID directly from the asset
            if (!empId && asset.assignedEmployeeId) {
                empId = asset.assignedEmployeeId;
            }
            

            
            newDraft.departmentId = deptId;
            newDraft.employeeId = empId;
        }
        if (field === 'locationId') {
            newDraft.locationId = asset.locationId || '';
            // Ensure locations are loaded for select
            if (!locations || locations.length === 0) {
                dispatch(fetchAssetLocations());
            }
        }
        if (field === 'purchaseCost') newDraft.purchaseCost = asset.purchaseCost ?? '';
        if (field === 'warrantyExpiry') {
            newDraft.warrantyExpiry = asset.warrantyExpiry
                ? new Date(asset.warrantyExpiry).toISOString().slice(0, 10)
                : '';
        }
        setDraftValues(newDraft);
        setEditingField(field);
    };

    const cancelEditing = () => {
        setEditingField(null);
    };

    const saveEditing = async () => {
        if (!editingField) return;
        try {
            let payload = {};
            if (editingField === 'assignedTo') payload.assignedTo = draftValues.assignedTo;
            if (editingField === 'locationId') payload.locationId = draftValues.locationId;
            if (editingField === 'purchaseCost') payload.purchaseCost = draftValues.purchaseCost === '' ? null : Number(draftValues.purchaseCost);
            if (editingField === 'warrantyExpiry') payload.warrantyExpiry = draftValues.warrantyExpiry || null;

            await dispatch(patchAssetByAssetId({ assetId: id, assetData: payload })).unwrap();
            toast.success('Asset updated successfully');
            setEditingField(null);
            dispatch(fetchAssetByAssetId(id));
        } catch (error) {
            toast.error(`Failed to update: ${error}`);
        }
    };

    // Overview editing handlers
    const startOverviewEditing = () => {
        if (!asset) return;
        setOverviewDraft({
            categoryId: asset.categoryId || '',
            statusLabelId: asset.statusLabelId || '',
            purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().slice(0, 10) : '',
            purchaseCost: asset.purchaseCost ?? '',
            invoiceNumber: asset.invoiceNumber || '',
        });
        setEditingOverview(true);
    };

    const cancelOverviewEditing = () => setEditingOverview(false);

    const saveOverview = async () => {
        if (!asset) return;
        try {
            setSavingOverview(true);
            const payload = {};
            if (overviewDraft.statusLabelId !== (asset.statusLabelId || '')) payload.statusLabelId = overviewDraft.statusLabelId || null;
            if (overviewDraft.purchaseDate !== (asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().slice(0, 10) : '')) payload.purchaseDate = overviewDraft.purchaseDate || null;
            if (String(overviewDraft.purchaseCost) !== String(asset.purchaseCost ?? '')) payload.purchaseCost = overviewDraft.purchaseCost === '' ? null : Number(overviewDraft.purchaseCost);

            if (overviewDraft.invoiceNumber !== (asset.invoiceNumber || '')) payload.invoiceNumber = overviewDraft.invoiceNumber || null;

            if (Object.keys(payload).length === 0) {
                setEditingOverview(false);
                setSavingOverview(false);
                return;
            }
            await dispatch(patchAssetByAssetId({ assetId: id, assetData: payload })).unwrap();
            toast.success('Overview updated');
            setEditingOverview(false);
            dispatch(fetchAssetByAssetId(id));
        } catch (error) {
            toast.error(`Failed to update overview: ${error}`);
        } finally {
            setSavingOverview(false);
        }
    };

    // Specifications editing handlers
    const startSpecsEditing = () => {
        if (!asset) return;
        setSpecsDraft({
            customFields: { ...(asset.customFields || {}) },
            formData: { ...(asset.formData || {}) },
        });
        setEditingSpecs(true);
    };

    const cancelSpecsEditing = () => setEditingSpecs(false);

    const saveSpecs = async () => {
        if (!asset) return;
        try {
            setSavingSpecs(true);
            // Mirror formData into customFormData for backend compatibility
            const payload = {
                customFields: { ...(specsDraft.customFields || {}) },
                formData: { ...(specsDraft.formData || {}) },
                customFormData: { ...(specsDraft.formData || {}) },
            };
            // Remove empty objects to avoid overriding with empty values
            if (Object.keys(payload.customFields).length === 0) delete payload.customFields;
            if (Object.keys(payload.formData).length === 0) delete payload.formData;
            if (Object.keys(payload.customFormData).length === 0) delete payload.customFormData;

            console.log('[Specs] Updating', { assetId: id, payload });
            await dispatch(patchAssetByAssetId({ assetId: id, assetData: payload })).unwrap();
            toast.success('Specifications updated');
            setEditingSpecs(false);
            dispatch(fetchAssetByAssetId(id));
        } catch (error) {
            console.error('[Specs] Update failed:', error);
            const message = error?.message || (typeof error === 'string' ? error : 'Unknown error');
            toast.error(`Failed to update specifications: ${message}`);
        } finally {
            setSavingSpecs(false);
        }
    };

    const handleSubmitMaintenance = async (e) => {
        e.preventDefault();
        if (!asset) return;
        try {
            const newRecord = {
                date: maintenanceForm.date || new Date().toISOString().slice(0, 10),
                type: maintenanceForm.type || 'General',
                description: maintenanceForm.description || '',
                cost: maintenanceForm.cost ? Number(maintenanceForm.cost) : 0,
                vendor: maintenanceForm.vendor || '',
            };

            const updatedData = {
                maintenanceRecords: [ ...(asset.maintenanceRecords || []), newRecord ],
            };
            if (maintenanceForm.date) {
                updatedData.lastMaintenanceDate = maintenanceForm.date;
            }
            if (maintenanceForm.nextMaintenanceDate) {
                updatedData.nextMaintenanceDate = maintenanceForm.nextMaintenanceDate;
            }

            await dispatch(patchAssetByAssetId({ assetId: id, assetData: updatedData })).unwrap();
            toast.success('Maintenance record added');
            setIsMaintenanceModalOpen(false);
            setMaintenanceForm({ date: '', type: '', description: '', cost: '', vendor: '', nextMaintenanceDate: '' });
            dispatch(fetchAssetByAssetId(id));
        } catch (error) {
            toast.error(`Failed to add maintenance: ${error}`);
        }
    };

    // Optional: support re-upload invoice from detail page in future
    const handleUploadInvoice = async (file) => {
        if (!asset) return;
        try {
            // Get encrypted token from session storage and decrypt it
            const encryptedToken = getItemFromSessionStorage('token', null);
            let token = null;
            
            // Handle different token formats and decryption
            if (typeof encryptedToken === 'string') {
                // If it's already a string, it might be the decrypted token
                token = encryptedToken;
            } else if (encryptedToken && typeof encryptedToken === 'object') {
                // If it's an object, extract the token property
                token = encryptedToken.token || encryptedToken.accessToken || encryptedToken.value;
            }
            
            if (!token) {
                throw new Error('No valid token found in session storage');
            }

            const headers = { Authorization: `Bearer ${token}` };

            const formData = new FormData();
            formData.append('assetId', asset.assetId);
            formData.append('file', file);

            const uploadUrl = `${publicRuntimeConfig.apiURL}/api/assets/upload-doc`;
            const resp = await fetch(uploadUrl, { method: 'POST', headers, body: formData });
            
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err.message || `Attachment upload failed (${resp.status})`);
            }
            
            // Get the response data to extract the uploaded image ID
            const uploadResult = await resp.json().catch(() => ({}));
            console.log('Upload response:', uploadResult);
            
            // Extract the uploaded image ID from the response
            const uploadedImageId = uploadResult.imageId || uploadResult.fileId || uploadResult.documentId || uploadResult.id;
            
            if (uploadedImageId) {
                console.log('Uploaded image ID received:', uploadedImageId);
                toast.success(`Attachment uploaded successfully! Image ID: ${uploadedImageId}`);
                return uploadedImageId; // Return the image ID for further use
            } else {
                toast.success('Attachment uploaded successfully!');
                return null;
            }
        } catch (e) {
            const message = e?.message || 'Failed to upload attachment';
            toast.error(message);
            throw e; // Re-throw to be handled by caller
        }
    };

    const handleSubmitDocument = async (e) => {
        e.preventDefault();
        if (!documentFile) {
            toast.error('Please select a file to upload');
            return;
        }
        try {
            setUploadingDoc(true);
            const uploadedImageId = await handleUploadInvoice(documentFile);
            
            // Update the asset with the new document information including the image ID
            const newDocument = {
                id: uploadedImageId, // Store the backend-generated image ID
                name: documentFile.name,
                type: documentFile.type || 'File',
                uploadDate: new Date().toISOString(),
                fileUrl: null, // Will be set by backend if available
                // Store additional metadata
                metadata: {
                    originalFileName: documentFile.name,
                    fileSize: documentFile.size,
                    mimeType: documentFile.type,
                    uploadedAt: new Date().toISOString()
                }
            };
            
            // Add to existing documents array
            const updatedDocuments = [...(asset.documents || []), newDocument];
            
            // Update asset with new document
            try {
                await dispatch(patchAssetByAssetId({ 
                    assetId: id, 
                    assetData: { documents: updatedDocuments } 
                })).unwrap();
                
                if (uploadedImageId) {
                    toast.success(`Document uploaded and asset updated successfully! Image ID: ${uploadedImageId}`);
                } else {
                    toast.success('Document uploaded and asset updated successfully!');
                }
            } catch (updateError) {
                console.warn('Failed to update asset with document info:', updateError);
                if (uploadedImageId) {
                    toast.success(`Document uploaded successfully! Image ID: ${uploadedImageId} (Asset update pending)`);
                } else {
                    toast.success('Document uploaded successfully!');
                }
            }
            
            setIsDocumentModalOpen(false);
            setDocumentFile(null);
            
            // Refresh asset data to show the new document
            dispatch(fetchAssetByAssetId(id));
        } catch (error) {
            // Error is already handled by handleUploadInvoice
            console.error('Document upload failed:', error);
        } finally {
            setUploadingDoc(false);
        }
    };
    
    const getStatusColor = (status) => {
        switch (status) {
            case 'Assigned': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'In Stock': return 'bg-green-100 text-green-700 border-green-200';
            case 'Under Maintenance': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Scrapped': return 'bg-red-100 text-red-700 border-red-200';
            case 'No Status': return 'bg-gray-100 text-gray-600 border-gray-200';
            case 'Loading...': return 'bg-gray-100 text-gray-500 border-gray-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };
    

    
    if (!fetchingAsset && !asset && fetchAssetError) {
        return (
            <AssetManagementLayout>
                <div className="p-6 text-center">
                    <FaExclamationTriangle className="text-4xl text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Asset Not Found</h2>
                    <p className="text-gray-600 mb-4">The asset you&apos;re looking for doesn&apos;t exist or couldn&apos;t be loaded.</p>
                    <button
                        onClick={() => router.push('/asset-management')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Back to Assets
                    </button>
                </div>
            </AssetManagementLayout>
        );
    }
    
    // Don't render content if still loading or no asset
    if (!asset) {
        return (
            <AssetManagementLayout>
                <div className="p-6 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading asset details...</p>
                    </div>
                </div>
            </AssetManagementLayout>
        );
    }
    

    
    return (
        <AssetManagementLayout>
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/asset-management')}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
                        >
                            <FaArrowLeft />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">{getAssetDisplayName(asset) || getAssetIdDisplay(asset) || 'Asset'}</h1>
                            <p className="text-gray-600">{getAssetIdDisplay(asset)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(getStatusName(asset.statusLabelId))}`}>
                            {getStatusName(asset.statusLabelId)}
                        </span>
                    </div>
                </div>
                
                {/* Asset Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <FaUser className="text-2xl text-blue-600" />
                                    <div>
                                        <p className="text-sm text-gray-500">Assigned To</p>
                                        {editingField === 'assignedTo' ? (
                                            <div className="w-full mt-2">
                                                <div className="space-y-2">
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">Department</label>
                                                        <select
                                                        className="p-2 border rounded-md w-full text-sm"
                                                        value={draftValues.departmentId || ''}
                                                        onChange={(e) => setDraftValues(v => ({ ...v, departmentId: e.target.value, employeeId: '' }))}
                                                        >
                                                        <option value="">Select Department...</option>
                                                        {(departments || []).map(d => (
                                                            <option key={d.id || d.departmentId} value={d.id || d.departmentId}>{d.name}</option>
                                                        ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">Employee</label>
                                                        <select
                                                        className="p-2 border rounded-md w-full text-sm disabled:opacity-50"
                                                        value={draftValues.employeeId || ''}
                                                        onChange={(e) => setDraftValues(v => ({ ...v, employeeId: e.target.value }))}
                                                        disabled={!draftValues.departmentId}
                                                        >
                                                        <option value="">Select Employee...</option>
                                                        {(employees || [])
                                                            .filter(emp => {
                                                                const depId = emp.departmentId || emp.department?.id || emp.department;
                                                                return !draftValues.departmentId || String(depId) === String(draftValues.departmentId);
                                                            })
                                                            .map(emp => (
                                                                <option key={emp.id || emp.employeeId || emp._id} value={emp.id || emp.employeeId || emp._id}>
                                                                    {emp.name || emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee'}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 mt-3">
                                                    <button onClick={async () => {
                                                        const employeeName = getEmployeeName(draftValues.employeeId);
                                                        const departmentName = getDepartmentName(draftValues.departmentId);
                                                        
                                                        const payload = {
                                                            assignedDepartment: departmentName || undefined,
                                                            assignedDepartmentId: draftValues.departmentId || null,
                                                            assignedEmployeeId: draftValues.employeeId || null,
                                                            assignedTo: employeeName || undefined,
                                                        };
                                                        

                                                        
                                                        // Validate that we have the required data
                                                        if (!draftValues.employeeId) {
                                                            toast.error('Please select an employee');
                                                            return;
                                                        }
                                                        
                                                        if (!employeeName) {
                                                            toast.error('Could not resolve employee name. Please try again.');
                                                            return;
                                                        }
                                                        
                                                        await dispatch(patchAssetByAssetId({ assetId: id, assetData: payload })).unwrap();
                                                        toast.success('Assignment updated');
                                                        setEditingField(null);
                                                        dispatch(fetchAssetById(id));
                                                    }} className="text-green-600 hover:text-green-700"><FaCheck /></button>
                                                    <button onClick={cancelEditing} className="text-gray-500 hover:text-gray-700"><FaTimes /></button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="font-semibold">
                                                    {asset.assignedTo || 
                                                     (asset.assignedEmployeeId ? getEmployeeName(asset.assignedEmployeeId) : '') || 
                                                     'Unassigned'}
                                                </p>
                                                {(asset.assignedDepartment || asset.assignedDepartmentId) && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {asset.assignedDepartment || getDepartmentName(asset.assignedDepartmentId) || 'Unknown'}
                                                    </p>
                                                )}

                                            </div>
                                        )}
                                    </div>
                                </div>
                                {editingField !== 'assignedTo' && (
                                    <button onClick={() => startEditing('assignedTo')} className="text-gray-500 hover:text-gray-700"><FaEdit /></button>
                                )}
                            </div>
                        </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <FaMapMarkerAlt className="text-2xl text-green-600" />
                            <div>
                                <p className="text-sm text-gray-500">Location</p>
                                    {editingField === 'locationId' ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <select
                                                className="p-2 border rounded-md"
                                                value={draftValues.locationId}
                                                onChange={(e) => setDraftValues(v => ({ ...v, locationId: e.target.value }))}
                                            >
                                                <option value="">Select Location...</option>
                                                {Array.isArray(locations) && locations.map(location => (
                                                    <option key={location.locationId || location.id} value={location.locationId || location.id}>
                                                        {location.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <button onClick={saveEditing} className="text-green-600 hover:text-green-700"><FaCheck /></button>
                                            <button onClick={cancelEditing} className="text-gray-500 hover:text-gray-700"><FaTimes /></button>
                                        </div>
                                    ) : (
                                <p className="font-semibold">{getLocationName(asset.locationId)}</p>
                                    )}
                            </div>
                            </div>
                            {editingField !== 'locationId' && (
                                <button onClick={() => startEditing('locationId')} className="text-gray-500 hover:text-gray-700"><FaEdit /></button>
                            )}
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <FaRupeeSign className="text-2xl text-purple-600" />
                            <div>
                                <p className="text-sm text-gray-500">Purchase Cost</p>
                                    {editingField === 'purchaseCost' ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <input
                                                type="number"
                                                className="p-2 border rounded-md"
                                                value={draftValues.purchaseCost}
                                                onChange={(e) => setDraftValues(v => ({ ...v, purchaseCost: e.target.value }))}
                                                placeholder="0"
                                            />
                                            <button onClick={saveEditing} className="text-green-600 hover:text-green-700"><FaCheck /></button>
                                            <button onClick={cancelEditing} className="text-gray-500 hover:text-gray-700"><FaTimes /></button>
                            </div>
                                    ) : (
                                        <p className="font-semibold">₹{typeof asset.purchaseCost === 'number' ? asset.purchaseCost.toLocaleString() : '0'}</p>
                                    )}
                                </div>
                            </div>
                            {editingField !== 'purchaseCost' && (
                                <button onClick={() => startEditing('purchaseCost')} className="text-gray-500 hover:text-gray-700"><FaEdit /></button>
                            )}
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <FaCalendarAlt className="text-2xl text-orange-600" />
                            <div>
                                <p className="text-sm text-gray-500">Warranty Expires</p>
                                    {editingField === 'warrantyExpiry' ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <input
                                                type="date"
                                                className="p-2 border rounded-md"
                                                value={draftValues.warrantyExpiry}
                                                onChange={(e) => setDraftValues(v => ({ ...v, warrantyExpiry: e.target.value }))}
                                            />
                                            <button onClick={saveEditing} className="text-green-600 hover:text-green-700"><FaCheck /></button>
                                            <button onClick={cancelEditing} className="text-gray-500 hover:text-gray-700"><FaTimes /></button>
                                        </div>
                                    ) : (
                                <p className="font-semibold">{asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : 'N/A'}</p>
                                    )}
                            </div>
                            </div>
                            {editingField !== 'warrantyExpiry' && (
                                <button onClick={() => startEditing('warrantyExpiry')} className="text-gray-500 hover:text-gray-700"><FaEdit /></button>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            {[
                                { id: 'overview', label: 'Overview', icon: FaFileAlt },
                                { id: 'specifications', label: 'Specifications', icon: FaLaptop },
                                { id: 'history', label: 'History', icon: FaHistory },
                                { id: 'documents', label: 'Documents', icon: FaFileAlt }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <tab.icon />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                    
                    <div className="p-6">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="flex justify-end">
                                    {editingOverview ? (
                                        <div className="flex items-center gap-2">
                                            <button onClick={cancelOverviewEditing} className="px-3 py-1 text-sm border rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                                            <button onClick={saveOverview} disabled={savingOverview} className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{savingOverview ? 'Saving...' : 'Save'}</button>
                                        </div>
                                    ) : (
                                        <button onClick={startOverviewEditing} className="px-3 py-1 text-sm border rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2"><FaEdit /> Edit Overview</button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Asset ID:</span>
                                                <span className="font-medium">{asset.assetId}</span>
                                            </div>
                                            <div className="flex justify-between items-center gap-4">
                                                <span className="text-gray-600">Category:</span>
                                                <span className="font-medium">{getCategoryName(asset.categoryId)}</span>
                                            </div>
                                            <div className="flex justify-between items-center gap-4">
                                                <span className="text-gray-600">Subcategory:</span>
                                                <span className="font-medium">{getSubcategoryName(asset.subcategoryId)}</span>
                                            </div>
                                            <div className="flex justify-between items-center gap-4">
                                                <span className="text-gray-600">Status:</span>
                                                {editingOverview ? (
                                                    <select
                                                        value={overviewDraft.statusLabelId}
                                                        onChange={(e) => setOverviewDraft(v => ({ ...v, statusLabelId: e.target.value }))}
                                                        className="p-2 border rounded-md min-w-[200px]"
                                                    >
                                                        <option value="">Select Status...</option>
                                                        {Array.isArray(statuses) && statuses.map(s => (
                                                            <option key={s.statusLabelId || s.id} value={s.statusLabelId || s.id}>{s.name}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                <span className="font-medium">{getStatusName(asset.statusLabelId)}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-gray-800">Financial Details</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center gap-4">
                                                <span className="text-gray-600">Purchase Date:</span>
                                                {editingOverview ? (
                                                    <input
                                                        type="date"
                                                        className="p-2 border rounded-md min-w-[200px]"
                                                        value={overviewDraft.purchaseDate}
                                                        onChange={(e) => setOverviewDraft(v => ({ ...v, purchaseDate: e.target.value }))}
                                                    />
                                                ) : (
                                                <span className="font-medium">{asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'N/A'}</span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center gap-4">
                                                <span className="text-gray-600">Purchase Cost:</span>
                                                {editingOverview ? (
                                                    <input
                                                        type="number"
                                                        className="p-2 border rounded-md min-w-[200px]"
                                                        value={overviewDraft.purchaseCost}
                                                        onChange={(e) => setOverviewDraft(v => ({ ...v, purchaseCost: e.target.value }))}
                                                        placeholder="0"
                                                    />
                                                ) : (
                                                <span className="font-medium">₹{asset.purchaseCost?.toLocaleString()}</span>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-center gap-4">
                                                <span className="text-gray-600">Invoice Number:</span>
                                                {editingOverview ? (
                                                    <input
                                                        className="p-2 border rounded-md min-w-[200px]"
                                                        value={overviewDraft.invoiceNumber}
                                                        onChange={(e) => setOverviewDraft(v => ({ ...v, invoiceNumber: e.target.value }))}
                                                        placeholder="Invoice Number"
                                                    />
                                                ) : (
                                                <span className="font-medium">{asset.invoiceNumber || 'N/A'}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Specifications Tab */}
                        {activeTab === 'specifications' && (
                            <div className="space-y-6">
                                <div className="flex justify-end">
                                    {editingSpecs ? (
                                        <div className="flex items-center gap-2">
                                            <button onClick={cancelSpecsEditing} className="px-3 py-1 text-sm border rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                                            <button onClick={saveSpecs} disabled={savingSpecs} className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{savingSpecs ? 'Saving...' : 'Save'}</button>
                                        </div>
                                    ) : (
                                        <button onClick={startSpecsEditing} className="px-3 py-1 text-sm border rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2"><FaEdit /> Edit Specifications</button>
                                    )}
                                </div>


                                {/* Generic specifications from formData */}
                                {asset.formData && Object.keys(asset.formData).length > 0 && (
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-800">Additional Specifications</h3>
                                    <div className="space-y-3 mt-2">
                                      {editingSpecs ? (
                                        Object.keys(specsDraft.formData).map((key) => (
                                          <div key={key} className="flex justify-between items-center gap-4">
                                            <span className="text-gray-600">{key}:</span>
                                            <input className="p-2 border rounded-md min-w-[200px] w-full max-w-xl" value={String(specsDraft.formData[key] ?? '')} onChange={(e) => setSpecsDraft(v => ({ ...v, formData: { ...v.formData, [key]: e.target.value } }))} />
                                          </div>
                                        ))
                                      ) : (
                                        Object.entries(asset.formData).map(([key, value]) => (
                                          <div key={key} className="flex justify-between items-center gap-4">
                                            <span className="text-gray-600">{key}:</span>
                                            <span className="font-medium break-all">{String(value)}</span>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>
                        )}
                        
                        {/* Maintenance Tab removed */}
                        
                        {/* History Tab */}
                        {activeTab === 'history' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-800">Asset History</h3>
                                {loadingHistory && (
                                    <div className="text-center py-8 text-gray-500">Loading history...</div>
                                )}
                                {historyError && (
                                    <div className="text-center py-8 text-red-600">{historyError}</div>
                                )}
                                {!loadingHistory && !historyError && (
                                    historyEvents && historyEvents.length > 0 ? (
                                        <div className="space-y-3">
                                            {historyEvents.map((evt, idx) => {
                                                const changes = evt.changes && evt.changes.length > 0 ? evt.changes : extractChangesFromEvent(evt.raw || evt);
                                                
                                        return (
                                                    <div key={idx} className="rounded-lg border border-gray-200 bg-white shadow-sm">
                                                        <div className="flex flex-wrap items-start justify-between gap-3 p-4 border-b border-gray-200">
                                                            <div className="space-y-0.5">
                                                                <p className="text-xs text-gray-500">{formatDateTime(evt.date)}</p>
                                                                <p className="text-base font-semibold text-gray-800">
                                                                    {evt.label}
                                                                </p>
                                                            </div>
                                                            {/* Suppress the top-right summary to avoid duplication with chips below */}
                                                        </div>
                                                        {changes && changes.length > 0 ? (
                                                            <div className="p-4 space-y-2">
                                                                {(() => {
                                                                    // Combine Department + Assignee into one row if present
                                                                    const deptChange = changes.find((c) => isDeptField(c.field));
                                                                    const empChange = changes.find((c) => isEmpField(c.field));
                                                                    const otherChanges = changes.filter((c) => !isDeptField(c.field) && !isEmpField(c.field));

                                                                    const rendered = [];
                                                                    if (deptChange || empChange) {
                                                                        const deptFrom = deptChange ? (deptChange.displayFrom ?? formatValueForField('assignedDepartment', deptChange.from)) : '—';
                                                                        const deptTo = deptChange ? (deptChange.displayTo ?? formatValueForField('assignedDepartment', deptChange.to)) : '—';
                                                                        const empFrom = empChange ? (empChange.displayFrom ?? formatValueForField('assignedTo', empChange.from)) : '—';
                                                                        const empTo = empChange ? (empChange.displayTo ?? formatValueForField('assignedTo', empChange.to)) : '—';

                                                                        rendered.push(
                                                                            <div key="dept-emp" className="rounded-md bg-gray-50 p-3">
                                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">Department</span>
                                                                                        <span className="text-xs text-gray-500">From</span>
                                                                        <span className="text-xs px-2 py-0.5 rounded border bg-white text-gray-700">{deptFrom}</span>
                                                                        <span className="text-gray-400">→</span>
                                                                        <span className="text-xs text-gray-500">To</span>
                                                                        <span className="text-xs px-2 py-0.5 rounded border bg-green-50 border-green-200 text-green-800">{deptTo}</span>
                                                                    </div>
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">Assignee</span>
                                                                        <span className="text-xs text-gray-500">From</span>
                                                                        <span className="text-xs px-2 py-0.5 rounded border bg-white text-gray-700">{empFrom}</span>
                                                                        <span className="text-gray-400">→</span>
                                                                        <span className="text-xs text-gray-500">To</span>
                                                                        <span className="text-xs px-2 py-0.5 rounded border bg-green-50 border-green-200 text-green-800">{empTo}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    // Render other changes individually
                                                    rendered.push(
                                                        ...otherChanges.map((c, i) => {
                                                            const fieldLabel = displayFieldName(c.field);
                                                            const fromVal = c.displayFrom ?? formatValueForField(c.field, c.from);
                                                            const toVal = c.displayTo ?? formatValueForField(c.field, c.to);
                                                            return (
                                                                <div key={`other-${i}`} className="flex flex-wrap items-center gap-2 rounded-md bg-gray-50 p-3">
                                                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">{fieldLabel}</span>
                                                                    <span className="text-xs text-gray-500">From</span>
                                                                    <span className="text-xs px-2 py-0.5 rounded border bg-white text-gray-700">{fromVal || '—'}</span>
                                                                    <span className="text-xs text-gray-400">→</span>
                                                                    <span className="text-xs text-gray-500">To</span>
                                                                    <span className="text-xs px-2 py-0.5 rounded border bg-green-50 border-green-200 text-green-800">{toVal || '—'}</span>
                                                                </div>
                                                            );
                                                        })
                                                    );

                                                    return rendered;
                                                })()}
                                            </div>
                                        ) : null}
                                        </div>
                                    );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <FaHistory className="text-4xl text-gray-400 mx-auto mb-4" />
                                            <h4 className="text-lg font-semibold text-gray-600 mb-2">No History Records</h4>
                                            <p className="text-gray-500">Asset history will appear here when actions are performed.</p>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                        
                        {/* Documents Tab */}
                        {activeTab === 'documents' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-gray-800">Documents & Files</h3>
                                    <button onClick={() => setIsDocumentModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
                                        <FaPlus /> Upload Document
                                    </button>
                                </div>
                                
                                {/* Show uploaded attachment from asset creation if available */}
                                {asset.documents && Array.isArray(asset.documents) && asset.documents.length > 0 ? (
                                    <div className="space-y-4">
                                        <h4 className="text-md font-medium text-gray-700">Uploaded Documents</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {asset.documents.map((doc, idx) => (
                                                <div key={idx} className="p-4 border rounded-md bg-white flex items-center justify-between hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <FaFileAlt className="text-blue-600 text-lg" />
                                                        <div>
                                                            <p className="font-medium text-gray-800">{doc.name || `Document ${idx + 1}`}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {doc.type || 'File'} • {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : 'Recently uploaded'}
                                                            </p>
                                                            {doc.fileUrl && (
                                                                <p className="text-xs text-blue-600 mt-1">File uploaded successfully</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {doc.fileUrl && (
                                                            <a 
                                                                href={doc.fileUrl} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:text-blue-800 text-sm"
                                                                title="View file"
                                                            >
                                                                View
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <FaFileAlt className="text-4xl text-gray-400 mx-auto mb-4" />
                                        <h4 className="text-lg font-semibold text-gray-600 mb-2">No Documents</h4>
                                        <p className="text-gray-500">Upload documents and files related to this asset.</p>
                                        <p className="text-sm text-gray-400 mt-2">Files uploaded during asset creation will appear here automatically.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Edit Modal removed in favor of inline editing */}

                {/* Maintenance modal removed as requested */}

                {/* Upload Document Modal (only in Documents tab) */}
                {activeTab === 'documents' && isDocumentModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                        <form onSubmit={handleSubmitDocument} className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                            <div className="flex justify-between items-center p-6 border-b">
                                <h2 className="text-xl font-bold text-gray-800">Upload Document</h2>
                                <button type="button" onClick={() => setIsDocumentModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <FaTimes />
                                </button>
                            </div>
                            <div className="p-6 space-y-4 overflow-y-auto">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
                                    <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-3 flex justify-end items-center gap-2 rounded-b-lg">
                                <button type="button" onClick={() => setIsDocumentModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800" disabled={uploadingDoc}>Cancel</button>
                                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50" disabled={uploadingDoc}>
                                    {uploadingDoc ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </AssetManagementLayout>
    );
};

export default AssetDetailPage; 