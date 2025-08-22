import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isWeekend, isSameDay, getDay, isSameMonth } from 'date-fns';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';

const CustomDatePicker = ({
  selectedDates = [],
  onChange,
  disabledDates = [],
  isCompOff = false,
  maxDays,
  minDate = new Date(),
  shiftType = 'FULL_DAY',
  onShiftTypeChange,
  departmentInfo = null,
  leavePolicy = null,
  weeklyOffs = [],
  joiningDate = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeSlot, setTimeSlot] = useState(shiftType);
  const [selectedDateObjects, setSelectedDateObjects] = useState([]);
  const [hoverDate, setHoverDate] = useState(null);
  const [frozenDates, setFrozenDates] = useState([]);
  const calendarRef = useRef(null);
  const inputRef = useRef(null);
  const calendarPopupRef = useRef(null);

  // Get payroll freeze status from Redux (new API)
  const { freezeStatus, checkLoading: freezeStatusLoading } = useSelector((state) => state.payrollFreezeStatus || {});

  // Helper function to check if payroll is frozen for a specific month
  const isPayrollFrozen = (date) => {
    // Add null check to prevent errors
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return false;
    }
    
    if (freezeStatusLoading || !freezeStatus) {
      return false;
    }
    
    // Handle different possible API response formats
    let frozen = false;
    if (typeof freezeStatus === 'boolean') {
      frozen = freezeStatus === true;
    } else if (typeof freezeStatus === 'object' && freezeStatus !== null) {
      frozen = freezeStatus.isFrozen === true || freezeStatus.frozen === true || freezeStatus.status === true;
    } else if (typeof freezeStatus === 'string') {
      frozen = freezeStatus.toLowerCase() === 'true';
    } else if (typeof freezeStatus === 'number') {
      frozen = freezeStatus === 1;
    }
    
    if (!frozen) return false;
    
    // If frozen, check if the date is in the month that should be frozen
    // The API was called for the previous month (current month - 1)
    const today = new Date();
    const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const targetMonth = date.getMonth();
    const targetYear = date.getFullYear();
    const frozenMonth = previousMonth.getMonth();
    const frozenYear = previousMonth.getFullYear();
    
    // Only freeze if the date is in the specific month that's frozen
    // AND it's not the current month (current month should always be allowed)
    const isCurrentMonth = (targetMonth === today.getMonth() && targetYear === today.getFullYear());
    
    if (isCurrentMonth) {
      return false; // Current month is always allowed
    }
    
    return (targetMonth === frozenMonth && targetYear === frozenYear);
  };

  // Show all options for leave, only Full Day for comp-off
  const timeSlotOptions = isCompOff ? [
    { value: 'FULL_DAY', label: 'Full Day' }
  ] : [
    { value: 'FULL_DAY', label: 'Full Day' },
    { value: 'FIRST_HALF', label: 'First Half (Morning)' },
    { value: 'SECOND_HALF', label: 'Second Half (Evening)' }
  ];

  // Handle shift type change
  const handleShiftTypeChange = (e) => {
    const newShiftType = e.target.value;
    setTimeSlot(newShiftType);
    if (onShiftTypeChange) {
      onShiftTypeChange({
        ...e,
        target: {
          ...e.target,
          value: newShiftType
        }
      });
    }
  };

  useEffect(() => {
    if (selectedDates.length > 0) {
      setSelectedDateObjects(selectedDates.map(date => ({
        date: date.date instanceof Date ? date.date : new Date(date.date),
        shiftType: date.shiftType || timeSlot,
        timeSlot: date.timeSlot || timeSlot
      })));
    } else {
      setSelectedDateObjects([]);
    }
  }, [selectedDates, timeSlot]);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        calendarPopupRef.current && 
        !calendarPopupRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Monitor changes for leave policy and restrictions
  useEffect(() => {
    // This effect monitors changes but doesn't log anything
  }, [leavePolicy, selectedDateObjects, frozenDates, weeklyOffs, isCompOff, joiningDate, freezeStatus]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Add empty days for padding
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add actual days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    
    // FIRST: Check joining date restriction (dates before joining date are always disabled)
    if (joiningDate) {
      const joiningDateObj = new Date(joiningDate);
      if (date < joiningDateObj) {
        return true;
      }
    }
    
    // Calculate the cutoff date (first day of previous month)
    const today = new Date();
    const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    

    
    // Check if date is before the previous month cutoff FIRST
    if (date < previousMonth) return true;
    
    // Check payroll freeze logic - freeze previous month if payroll is frozen
    if (isPayrollFrozen(date)) {
      return true;
    }
    
    // Check if date is in the current month (always editable)
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const targetMonth = date.getMonth();
        const targetYear = date.getFullYear();
        
    // Current month is always allowed
    if (targetYear === currentYear && targetMonth === currentMonth) {
      return false;
    }
    
    // Next month (current month + 1) is also allowed
    if (targetYear === currentYear && targetMonth === currentMonth + 1) {
      return false;
    }
    
    // Previous month: editable when not frozen (already checked above)
    if (targetYear === currentYear && targetMonth === currentMonth - 1) {
      return false;
    }
    
    // Other months in current year: not editable
    if (targetYear === currentYear && targetMonth < currentMonth - 1) {
      return true;
    }
    
    // Previous year: only allow if it's December and current month is January
    if (targetYear === currentYear - 1) {
      const allowed = !(targetMonth === 11 && currentMonth === 0);
      return !allowed;
    }
    
    // Other years: not editable
    return true;
    
    if (disabledDates.some(disabledDate => isSameDay(new Date(disabledDate), date))) return true;
    if (frozenDates.some(frozenDate => isSameDay(frozenDate, date))) return true;

    // Freeze weekly offs - but skip this for comp-off requests
    if (!isCompOff && weeklyOffs && weeklyOffs.length > 0) {
      const dayName = format(date, 'EEEE'); // 'Sunday', 'Monday', etc.
      if (weeklyOffs.includes(dayName)) {
        return true;
      }
    }
    
    // Fallback: Also check for weekends if weeklyOffs is not provided or empty
    if (!isCompOff && (!weeklyOffs || weeklyOffs.length === 0)) {
      if (isWeekend(date)) {
        return true;
      }
    }

    // Weekly holidays
    if (departmentInfo?.weeklyHolidays) {
      const weekDays = Array.isArray(departmentInfo.weeklyHolidays)
        ? departmentInfo.weeklyHolidays
        : departmentInfo.weeklyHolidays.split(',').map(day => day.trim());
      const dayName = format(date, 'EEEE');
      if (weekDays.includes(dayName)) {
        return true;
      }
    }

    // Dynamic restricted days from leave policy
    const restrictions = leavePolicy?.leaveAllocations?.[0]?.restrictions?.[0];
    if (restrictions?.restrictedDays && restrictions?.allowedValue !== undefined) {
      const dayName = format(date, 'EEE');
      if (restrictions.restrictedDays.includes(dayName)) {
        // Count how many restricted days are already selected
        const restrictedSelected = selectedDateObjects.filter(selected => 
          restrictions.restrictedDays.includes(format(selected.date, 'EEE'))
        );
        const willDisable = restrictedSelected.length >= restrictions.allowedValue &&
            !restrictedSelected.some(selected => isSameDay(selected.date, date));
        
        if (willDisable) {
          return true;
        }
      }
    }

    return false;
  };

  const isDateSelected = (date) => {
    return selectedDateObjects.some(selected => isSameDay(selected.date, date));
  };

  const isDateWithLeaveApplied = (date) => {
    // Check if the date is in the disabledDates array (which contains dates with leave applied)
    return disabledDates.some(disabledDate => isSameDay(new Date(disabledDate), date));
  };

  // Helper function to check if a date is a weekly off
  const isWeeklyOff = (date) => {
    if (!date) return false;
    
    // Freeze weekly offs - but skip this for comp-off requests
      if (!isCompOff && weeklyOffs && weeklyOffs.length > 0) {
        const dayName = format(date, 'EEEE'); // 'Sunday', 'Monday', etc.
      return weeklyOffs.includes(dayName);
      }
      
      // Fallback: Also check for weekends if weeklyOffs is not provided or empty
      if (!isCompOff && (!weeklyOffs || weeklyOffs.length === 0)) {
      return isWeekend(date);
    }
    
    return false;
  };

  // Helper function to check if a date is disabled due to joining date
  const isDateBeforeJoining = (date) => {
    if (!date || !joiningDate) return false;
    const joiningDateObj = new Date(joiningDate);
    return date < joiningDateObj;
  };

  

  const handleDateClick = (date) => {
    if (isDateDisabled(date) || isDateBeforeJoining(date)) return;

    let newSelectedDates;
    const restrictions = leavePolicy?.leaveAllocations?.[0]?.restrictions?.[0];
    const restrictedDays = restrictions?.restrictedDays || [];
    const allowedValue = restrictions?.allowedValue;
    const dayName = format(date, 'EEE');

    // Check if date is already selected
    const isAlreadySelected = selectedDateObjects.some(selected => 
      isSameDay(selected.date, date)
    );



    if (isAlreadySelected) {
      // Allow removing any selected date (not just start or end)
      newSelectedDates = selectedDateObjects.filter(selected => !isSameDay(selected.date, date));

      // If a restricted day is being unselected, check if we need to unfreeze other restricted days
      if (restrictedDays.includes(dayName)) {
        const restrictedSelected = newSelectedDates.filter(selected => 
          restrictions.restrictedDays.includes(format(selected.date, 'EEE'))
        );
        // Only unfreeze if we're now below the limit
        if (restrictedSelected.length < allowedValue) {
          const month = date.getMonth();
          const year = date.getFullYear();
          setFrozenDates(prev => prev.filter(d => d.getMonth() !== month || d.getFullYear() !== year));
        }
      }
    } else {
      // Check max days limit
      if (maxDays && selectedDateObjects.length >= maxDays) {
        toast.error(`You can only select up to ${maxDays} days`);
        return;
      }

      // For comp-off, replace all selected dates with the new one
      if (isCompOff) {
        const newDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        newSelectedDates = [{ 
          date: newDate,
          shiftType: timeSlot,
          timeSlot: timeSlot
        }];
      } else {
        // Dynamic restricted days from leave policy
        if (restrictedDays.length && allowedValue !== undefined) {
          if (restrictedDays.includes(dayName)) {
            // Count how many restricted days are already selected
            const restrictedSelected = selectedDateObjects.filter(selected => 
              restrictions.restrictedDays.includes(format(selected.date, 'EEE'))
            );
            if (restrictedSelected.length >= allowedValue) {
              toast.error(`You can only select up to ${allowedValue} restricted day(s)`);
              return;
            }
            
            // Only freeze other restricted days if we're at the limit
            if (restrictedSelected.length + 1 >= allowedValue) {
              const month = date.getMonth();
              const year = date.getFullYear();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const newFrozen = [];
              for (let d = 1; d <= daysInMonth; d++) {
                const dObj = new Date(year, month, d);
                const dName = format(dObj, 'EEE');
                if (restrictedDays.includes(dName) && !isSameDay(dObj, date)) {
                  newFrozen.push(dObj);
                }
              }
              setFrozenDates(prev => ([...prev, ...newFrozen]));
            }
          }
        }

        // Allow adding any date (no adjacency requirement)
        const newDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        newSelectedDates = [...selectedDateObjects, { 
          date: newDate,
          shiftType: timeSlot,
          timeSlot: timeSlot
        }];
      }
    }

    // Sort dates chronologically for display
    newSelectedDates.sort((a, b) => a.date - b.date);
    setSelectedDateObjects(newSelectedDates);
    onChange(newSelectedDates);
  };

  const removeDate = (dateToRemove) => {
    const newDates = selectedDateObjects.filter(selected => 
      !isSameDay(selected.date, dateToRemove)
    );
    setSelectedDateObjects(newDates);
    onChange(newDates);
  };

  return (
    <div className="relative" ref={calendarRef}>
      <div className="w-full space-y-2">
        {/* Time Slot Selector - Dynamic based on isCompOff */}
        {isCompOff ? (
          /* Static display for comp-off */
          <div className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-700 font-medium">
            Full Day
          </div>
        ) : (
          /* Dropdown for leave applications */
          <select
            value={timeSlot || "FULL_DAY"}
            onChange={handleShiftTypeChange}
            className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          >
            {timeSlotOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {/* Date Picker Trigger */}
        <div
          ref={inputRef}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg flex items-center justify-between cursor-pointer hover:border-blue-500 hover:shadow-sm transition-all duration-200 bg-white"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          <span className="text-gray-700 font-medium">
            {selectedDateObjects.length > 0 ? 'Selected Days' : 'Select Day'}
          </span>
          <CalendarIcon className="h-5 w-5 text-blue-500" />
        </div>

        {/* Selected Dates Display */}
        {selectedDateObjects.length > 0 && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              {selectedDateObjects.map((selected) => {
                const dateObj = selected.date instanceof Date ? selected.date : new Date(selected.date);
                
                const shiftTypeLabel = timeSlotOptions.find(option => option.value === selected.shiftType)?.label || selected.shiftType;
                return (
                  <div
                    key={dateObj.toISOString()}
                    className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <span className="font-medium">{format(dateObj, 'dd MMM yyyy')}</span>
                    <span className="text-xs text-blue-600 ml-1">
                      {shiftTypeLabel}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDate(dateObj);
                      }}
                      className="ml-1 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full p-0.5 transition-colors duration-200"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Calendar Popup */}
        {isOpen && (
          <div 
            ref={calendarPopupRef}
            className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg transform transition-all duration-200 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              {/* Month Navigation */}
              <div className="flex justify-between items-center mb-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)));
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <span className="font-semibold text-gray-800">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)));
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-600 p-1.5">
                    {day}
                  </div>
                ))}
                {getDaysInMonth(currentMonth).map((date, index) => {
                  // Skip rendering for null dates (padding days)
                  if (!date) {
                    return <div key={index} className="w-10 h-10" />;
                  }
                  
                  const isSelected = isDateSelected(date);
                  return (
                  <div
                    key={index}
                      className={`relative w-10 h-10 flex items-center justify-center text-sm rounded-md cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "bg-blue-500 text-white font-medium shadow-md"
                          : isDateWithLeaveApplied(date)
                          ? "bg-green-100 text-green-700 border-2 border-green-300 cursor-not-allowed"
                          : isWeeklyOff(date)
                          ? "bg-blue-100 text-blue-700 border-transparent cursor-not-allowed"
                          : isDateBeforeJoining(date) || isPayrollFrozen(date) || isDateDisabled(date)
                          ? "bg-gray-100 text-gray-400 border-transparent cursor-not-allowed"
                          : hoverDate && isSameDay(date, hoverDate)
                          ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                          : "hover:bg-gray-100 text-gray-700 border border-transparent hover:border-gray-300"
                      }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      date && handleDateClick(date);
                    }}
                    onMouseEnter={() => setHoverDate(date)}
                    onMouseLeave={() => setHoverDate(null)}
                    title={date && isWeeklyOff(date) ? "Date is a weekly off" : 
                            date && isDateWithLeaveApplied(date) ? "Leave already applied for this date" : 
                            date && (isDateBeforeJoining(date) || isPayrollFrozen(date) || isDateDisabled(date)) ? "Disabled" : ""}
                  >
                    {date ? (
                      <>
                        <span className={`
                          relative z-10 font-medium
                            ${isSelected ? 'text-white' : ''}
                        `}>
                          {format(date, 'd')}
                        </span>
                          {isSelected && (
                          <span className="absolute inset-0 rounded-md bg-blue-500 shadow-sm"></span>
                        )}
                      </>
                    ) : ''}
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomDatePicker;