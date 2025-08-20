import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import MainLayout from '@/components/MainLayout';
import LostJunkLeadsView from '@/components/Sales/LostJunkLeadsView';
import DateFilter from '@/components/Sales/filter';
import { fetchLeads } from '@/redux/slices/leadsSlice';
import { jwtDecode } from 'jwt-decode';
import { getItemFromSessionStorage } from '@/redux/slices/sessionStorageSlice';

const LostJunkPage = () => {
  const token = getItemFromSessionStorage("token");
  const decodedToken = jwtDecode(token);
  const roles = decodedToken.roles;
  const isManager = roles.includes('MANAGER');
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const dispatch = useDispatch();
  const employeeId = sessionStorage.getItem('employeeId');

  useEffect(() => {
    if (isManager) {
      dispatch(fetchLeads({all: true}));
    } else {
      dispatch(fetchLeads({ employeeId: employeeId, all: true }));
    }
  }, [dispatch, isManager, employeeId]);

  const handleFilterChange = (newStartDate, newEndDate) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <MainLayout>
      <div className="h-full bg-gray-50">
        <LostJunkLeadsView 
          isManager={isManager} 
          dateFilterProps={{ startDate, endDate }}
          onFilterChange={handleFilterChange}
          onResetFilter={handleResetFilter}
        />
      </div>
    </MainLayout>
  );
};

export default LostJunkPage;
