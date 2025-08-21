import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { FaTimes, FaTrash, FaTimesCircle, FaExclamationTriangle, FaCalendarAlt, FaRupeeSign, FaFilter } from 'react-icons/fa';
import DateFilter from './filter';
import { useDispatch } from 'react-redux';
import { fetchManagerEmployees } from '@/redux/slices/managerEmployeeSlice';
import SearchBar from './SearchBar';

const LostJunkLeadsView = ({ isManager, dateFilterProps = {}, onFilterChange, onResetFilter }) => {
  const router = useRouter();
  const { leads } = useSelector((state) => state.leads);
  const [activeTab, setActiveTab] = useState('lost'); // 'lost' or 'junk'
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [filterText, setFilterText] = useState("");
  const dispatch = useDispatch();
  const { employees: managerEmployees, loading: managerEmployeesLoading } = useSelector((state) => state.managerEmployee);

  useEffect(() => {
    dispatch(fetchManagerEmployees());
  }, [dispatch]);

  // Use props from parent component
  const { startDate = '', endDate = '' } = dateFilterProps;

  console.log('leads', leads);
  console.log('dateFilterProps', dateFilterProps);
  console.log('managerEmployees', managerEmployees);
  console.log('selectedEmployeeId', selectedEmployeeId);
  console.log('unassignedOnly', unassignedOnly);

  const handleFilterChange = (newStartDate, newEndDate) => {
    if (onFilterChange) {
      onFilterChange(newStartDate, newEndDate);
    }
  };

  const handleResetFilter = () => {
    if (onResetFilter) {
      onResetFilter();
    }
  };

  // Filter leads based on date range if provided
  const filterLeadsByDateRange = (leads) => {
    console.log('Filtering leads with date range:', { startDate, endDate });
    console.log('Total leads to filter:', leads.length);
    
    if (!startDate && !endDate) {
      console.log('No date filter applied - returning all leads');
      return leads; // No date filter applied - show all leads
    }

    const filteredLeads = leads.filter(lead => {
      // For lost/junk leads, we can filter by createdAt, updatedAt, or dateOfCreation
      const leadDate = lead.dateOfLost || lead.dateOfJunk || lead.dateOfCreation || lead.createdAt || lead.updatedAt;
      if (!leadDate) {
        console.log('Lead without date:', lead.name || lead.leadId);
        return false; // Exclude leads without date when filtering
      }

      const date = new Date(leadDate);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      console.log('Comparing dates for lead:', lead.name || lead.leadId, {
        leadDate: leadDate,
        parsedDate: date,
        startDate: startDate,
        parsedStart: start,
        endDate: endDate,
        parsedEnd: end
      });

      // If only start date is provided
      if (start && !end) {
        const result = date >= start;
        console.log('Start date only filter result:', result);
        return result;
      }
      
      // If only end date is provided
      if (!start && end) {
        const result = date <= end;
        console.log('End date only filter result:', result);
        return result;
      }
      
      // If both dates are provided
      if (start && end) {
        const result = date >= start && date <= end;
        console.log('Both dates filter result:', result);
        return result;
      }

      return true;
    });

    console.log('Filtered leads count:', filteredLeads.length);
    return filteredLeads;
  };

  // Filter leads based on the grouped structure from fetchLeads
  const lostLeads = [];
  const junkLeads = [];

  // Process the grouped leads data
  if (Array.isArray(leads)) {
    leads.forEach(stage => {
      if (stage.formType === 'LOST' && stage.leads) {
        // Add stage information to each lead
        const leadsWithStage = stage.leads.map(lead => ({
          ...lead,
          stageName: 'Lost',
          formType: stage.formType
        }));
        lostLeads.push(...leadsWithStage);
      } else if (stage.formType === 'JUNK' && stage.leads) {
        // Add stage information to each lead
        const leadsWithStage = stage.leads.map(lead => ({
          ...lead,
          stageName: 'Junk',
          formType: stage.formType
        }));
        junkLeads.push(...leadsWithStage);
      }
    });
  }

  // Apply date filtering
  const dateFilteredLostLeads = filterLeadsByDateRange(lostLeads);
  const dateFilteredJunkLeads = filterLeadsByDateRange(junkLeads);

  // Apply employee filtering
  const filterLeadsByEmployee = (leads) => {
    console.log('Employee filtering with:', { selectedEmployeeId, unassignedOnly });
    console.log('Total leads to filter by employee:', leads.length);
    
    if (selectedEmployeeId === 'all' && !unassignedOnly) {
      console.log('No employee filter applied - returning all leads');
      return leads; // No employee filter applied
    }

    const filteredLeads = leads.filter(lead => {
      console.log('Checking lead:', lead.name || lead.leadId, {
        salesRep: lead.salesRep,
        salesRepId: lead.salesRepId,
        assignedTo: lead.assignedTo,
        employeeId: lead.employeeId,
        selectedEmployeeId,
        unassignedOnly
      });

      if (unassignedOnly) {
        // Show only unassigned leads - check multiple possible field names
        const isUnassigned = !lead.salesRep && !lead.salesRepId && !lead.assignedTo && !lead.employeeId;
        console.log('Unassigned filter result:', isUnassigned);
        return isUnassigned;
      } else if (selectedEmployeeId !== 'all') {
        // Show leads assigned to specific employee - check multiple possible field names
        const isAssigned = (lead.salesRep === selectedEmployeeId) || 
                          (lead.salesRepId === selectedEmployeeId) || 
                          (lead.assignedTo === selectedEmployeeId) || 
                          (lead.employeeId === selectedEmployeeId);
        console.log('Employee assignment filter result:', isAssigned);
        return isAssigned;
      }
      return true;
    });

    console.log('Employee filtered leads count:', filteredLeads.length);
    return filteredLeads;
  };

  // Apply both date and employee filtering
  const filteredLostLeads = filterLeadsByEmployee(dateFilteredLostLeads);
  const filteredJunkLeads = filterLeadsByEmployee(dateFilteredJunkLeads);

  const handleLeadClick = (leadId) => {
    router.push(`/Sales/leads/${leadId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3 justify-between">
          <div className="p-2 bg-gray-100 rounded-lg">
            <FaTrash className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Lost & Junk Leads</h1>
            <p className="text-sm text-gray-600">View and manage lost and junk leads</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isManager && (
            <>
                  {/* Enhanced Filters Section */}
                  <div className="flex items-center gap-4 bg-white rounded-lg shadow-sm border border-gray-100 px-4 py-1">
            {/* Filter Icon with better styling */}
            <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-lg">
              <FaFilter className="text-blue-600 text-sm" />
            </div>
            
            {/* Enhanced Dropdown */}
            <div className="relative">
              <select
                className="appearance-none bg-white border border-gray-200 rounded-lg text-sm px-4 py-1 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300 min-w-[180px]"
                value={selectedEmployeeId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedEmployeeId(val);
                  // If selecting specific employee, turn off unassigned
                  if (val !== "all") setUnassignedOnly(false);
                }}
              >
                <option value="all">All Team Members</option>
                {Array.isArray(managerEmployees) && managerEmployees.map(emp => (
                  <option key={emp.employeeId || emp.id} value={emp.employeeId || emp.id}>
                    {emp.name || emp.employeeName || emp.email}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {/* Enhanced Checkbox */}
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-gray-900 transition-colors duration-200">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={unassignedOnly}
                  onChange={(e) => {
                    setUnassignedOnly(e.target.checked);
                    if (e.target.checked) setSelectedEmployeeId("all");
                  }}
                  className="sr-only"
                />
                <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all duration-200 ${
                  unassignedOnly 
                    ? 'bg-blue-600 border-blue-600' 
                    : 'bg-white border-gray-300 hover:border-blue-400'
                }`}>
                  {unassignedOnly && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="font-medium">Unassigned only</span>
            </label>
            
                        {/* Enhanced Clear Button - Only show when filters are active */}
            {(selectedEmployeeId !== "all" || unassignedOnly) && (
              <button
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors duration-200 px-3 py-1 rounded-md hover:bg-blue-50"
                onClick={() => { setSelectedEmployeeId("all"); setUnassignedOnly(false); }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
          </div>
          </>
          )}
          <SearchBar filterText={filterText} setFilterText={setFilterText} />
          <DateFilter
            onFilterChange={handleFilterChange}
            onReset={handleResetFilter}
            title="Lead Date Filter"
            compact={true}
          />
          </div>
          </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex">
          <button
            onClick={() => setActiveTab('lost')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'lost'
                ? 'border-gray-800 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaTimesCircle className="w-4 h-4" />
            Lost Leads ({filteredLostLeads.length})
          </button>
          <button
            onClick={() => setActiveTab('junk')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'junk'
                ? 'border-gray-800 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaExclamationTriangle className="w-4 h-4" />
            Junk Leads ({filteredJunkLeads.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 h-full overflow-y-auto">
        {activeTab === 'lost' ? (
          <div>
            {filteredLostLeads.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaTimesCircle className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No Lost Leads</h3>
                <p className="text-gray-500">There are currently no lost leads to display.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Budget
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sales Rep
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Priority
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date of Lost
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLostLeads.filter((lead) =>
                        lead.name?.toLowerCase().includes(filterText.toLowerCase()) ||
                        lead.contactNumber?.includes(filterText) ||
                        lead.leadId?.toLowerCase().includes(filterText.toLowerCase())
                      ).map((lead) => (
                        <tr
                          key={lead.leadId}
                          onClick={() => handleLeadClick(lead.leadId)}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {lead.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{lead.budget ? Number(lead.budget).toLocaleString('en-IN') : '0'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(lead.dateOfCreation)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {lead.salesRep || 'Not Assigned'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {lead.priority || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(lead.dateOfLost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {filteredJunkLeads.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaExclamationTriangle className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No Junk Leads</h3>
                <p className="text-gray-500">There are currently no junk leads to display.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Budget
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sales Rep
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Priority
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date of Junk
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredJunkLeads.filter((lead) =>
                        lead.name?.toLowerCase().includes(filterText.toLowerCase()) ||
                        lead.contactNumber?.includes(filterText) ||
                        lead.leadId?.toLowerCase().includes(filterText.toLowerCase())
                      ).map((lead) => (
                        <tr
                          key={lead.leadId}
                          onClick={() => handleLeadClick(lead.leadId)}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {lead.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{lead.budget ? Number(lead.budget).toLocaleString('en-IN') : '0'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(lead.dateOfCreation)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {lead.salesRep || 'Not Assigned'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {lead.priority || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(lead.dateOfJunk)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LostJunkLeadsView;
