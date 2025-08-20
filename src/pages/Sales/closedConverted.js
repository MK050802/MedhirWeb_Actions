import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import {
  FaCheckCircle,
  FaCalendarAlt,
  FaRupeeSign,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaBuilding,
} from "react-icons/fa";
import MainLayout from "@/components/MainLayout";
import { jwtDecode } from "jwt-decode";
import { getItemFromSessionStorage } from "@/redux/slices/sessionStorageSlice";
import { fetchLeads } from "@/redux/slices/leadsSlice";
import DateFilter from "@/components/Sales/filter";

const ClosedConvertedPage = () => {
  const token = getItemFromSessionStorage("token");
  const decodedToken = jwtDecode(token);
  const roles = decodedToken.roles;

  const isManager = roles.includes("MANAGER");

  const router = useRouter();
  const { leads, loading, error } = useSelector((state) => state.leads);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const dispatch = useDispatch();
  const employeeId = sessionStorage.getItem("employeeId");

  useEffect(() => {
    if (isManager) {
      dispatch(fetchLeads({all: true}));
    } else {
      dispatch(fetchLeads({ employeeId: employeeId, all: true }));
    }
  }, [dispatch, isManager, employeeId]);

  // Filter leads based on the grouped structure from fetchLeads
  const allConvertedLeads = [];

  console.log("Date filter values:", { startDate, endDate });
  console.log("All leads:", leads);

  // Process the grouped leads data
  if (Array.isArray(leads)) {
    console.log("Processing leads array:", leads);
    leads.forEach((stage) => {
      console.log("Processing stage:", stage);
      console.log("Stage formType:", stage.formType);
      console.log("Stage stageName:", stage.stageName);
      console.log("Stage leads count:", stage.leads ? stage.leads.length : 0);
      
      // Check for CONVERTED formType
      if (stage.formType === "CONVERTED" && stage.leads) {
        console.log("Found CONVERTED stage with leads:", stage.leads);
        // Add stage information to each lead
        const leadsWithStage = stage.leads.map((lead) => ({
          ...lead,
          stageName: "Converted",
          formType: stage.formType,
        }));
        allConvertedLeads.push(...leadsWithStage);
      }
      
      // Also check for leads with stageName "Converted" (case-insensitive)
      if (stage.leads && stage.leads.length > 0) {
        const convertedLeadsInStage = stage.leads.filter(lead => 
          lead.stageName && lead.stageName.toLowerCase() === "converted"
        );
        if (convertedLeadsInStage.length > 0) {
          console.log("Found leads with stageName 'Converted':", convertedLeadsInStage);
          const leadsWithStage = convertedLeadsInStage.map((lead) => ({
            ...lead,
            stageName: "Converted",
            formType: stage.formType || "CONVERTED",
          }));
          allConvertedLeads.push(...leadsWithStage);
        }
      }
    });
  }

  console.log("All converted leads:", allConvertedLeads);

  // Filter leads based on date range if provided
  const filterLeadsByDateRange = (leads) => {
    if (!startDate && !endDate) {
      return leads; // No date filter applied - show all leads
    }

    return leads.filter((lead) => {
      // If no payment date, only include if no date filter is applied
      if (!lead.paymentDate) {
        return false; // Exclude leads without payment date when filtering
      }

      const paymentDate = new Date(lead.paymentDate);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      // If only start date is provided
      if (start && !end) {
        return paymentDate >= start;
      }

      // If only end date is provided
      if (!start && end) {
        return paymentDate <= end;
      }

      // If both dates are provided
      if (start && end) {
        return paymentDate >= start && paymentDate <= end;
      }

      return true;
    });
  };

  // Apply date filtering to converted leads
  const convertedLeads = filterLeadsByDateRange(allConvertedLeads);

  console.log("Filtered converted leads:", convertedLeads);

  const handleFilterChange = (newStartDate, newEndDate) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const handleResetFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  const handleLeadClick = (leadId) => {
    router.push(`/Sales/leads/${leadId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <MainLayout>
      <div className="h-full bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaCheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Converted Leads
              </h1>
              <p className="text-sm text-gray-600">
                View and manage converted leads
              </p>
            </div>
            </div>
            
          <DateFilter
            onFilterChange={handleFilterChange}
            onReset={handleResetFilter}
            title="Lead Date Filter"
            compact={true}
          />
          </div>
        </div>

        {/* Date Filter */}
        {/* <div className="flex justify-end px-6 py-4 bg-white border-b border-gray-200">
          <DateFilter
            onFilterChange={handleFilterChange}
            onReset={handleResetFilter}
            title="Lead Date Filter"
            compact={true}
          />
        </div> */}

        {/* Header for All Converted Leads */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <FaCheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">
              All Converted Leads ({convertedLeads.length})
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 h-full overflow-y-auto">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Loading Converted Leads...
              </h3>
              <p className="text-gray-500">
                Please wait while we fetch your converted leads.
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <FaCheckCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Error Loading Leads
              </h3>
              <p className="text-gray-500">
                {error}
              </p>
            </div>
          ) : convertedLeads.length === 0 ? (
            <div className="text-center py-16">
              <FaCheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Converted Leads
              </h3>
              <p className="text-gray-500">
                There are no converted leads to display.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {convertedLeads.map((lead) => (
                <div
                  key={lead.leadId}
                  onClick={() => handleLeadClick(lead.leadId)}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {lead.name}
                        </h3>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Converted
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">Converted:</span>
                          <span className="font-medium">
                            {formatDate(lead.convertedAt || lead.updatedAt)}
                          </span>
                        </div>

                        {lead.contactNumber && (
                          <div className="flex items-center gap-2">
                            <FaPhone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">Phone:</span>
                            <span className="font-medium">
                              {lead.contactNumber}
                            </span>
                          </div>
                        )}

                        {lead.email && (
                          <div className="flex items-center gap-2">
                            <FaEnvelope className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">Email:</span>
                            <span className="font-medium">
                              {lead.email}
                            </span>
                          </div>
                        )}

                        {lead.salesRep && (
                          <div className="flex items-center gap-2">
                            <FaUser className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              Sales Rep:
                            </span>
                            <span className="font-medium">
                              {lead.salesRep}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {lead.quotedAmount && (
                          <div className="flex items-center gap-2">
                            <FaRupeeSign className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              Quoted Amount:
                            </span>
                            <span className="font-medium">
                              {formatCurrency(lead.quotedAmount)}
                            </span>
                          </div>
                        )}

                        {lead.finalQuotation && (
                          <div className="flex items-center gap-2">
                            <FaRupeeSign className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              Final Quotation:
                            </span>
                            <span className="font-medium">
                              {formatCurrency(lead.finalQuotation)}
                            </span>
                          </div>
                        )}

                        {lead.signupAmount && (
                          <div className="flex items-center gap-2">
                            <FaRupeeSign className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              Signup Amount:
                            </span>
                            <span className="font-medium">
                              {formatCurrency(lead.signupAmount)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ClosedConvertedPage;
