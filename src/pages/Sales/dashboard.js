import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchManagerEmployees } from "@/redux/slices/managerEmployeeSlice";
import {
  FaUsers,
  FaBullseye,
  FaMoneyBillWave,
  FaHandHoldingUsd,
  FaExternalLinkAlt,
  FaFilter,
  FaCrown,
  FaPlus,
  FaClock, // added
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import MainLayout from '@/components/MainLayout';
import AddLeadModal from '@/components/Sales/AddLeadModal';
import Link from 'next/link';
import { toast } from 'sonner';
import { fetchPipelines } from '@/redux/slices/pipelineSlice';
// import { fetchLeads } from '@/redux/slices/leadsSlice';
import { fetchDashboard } from '@/redux/slices/leadsDashboardSlice';
import { getItemFromSessionStorage } from '@/redux/slices/sessionStorageSlice';
import { jwtDecode } from 'jwt-decode';

// --- MOCK DATA (Replace with API data) ---
const MOCK_DATA = {
  kpis: {
    // kept existing to avoid side effects elsewhere
    newLeads: { value: 42, change: 15 },
    conversionRate: { value: '18%', convertedCount: 12, change: -2 },
    avgDealValue: { value: 250000, change: 10 },
    revenueWon: { value: 1250000, change: 25 },

    // added for the two new cards
    avgDurationMonths: { value: 2.6, change: -5 },      // e.g., average duration time
    avgSalesCycleMonths: { value: 3.8, change: -8 },    // e.g., average sales cycle
  },
  pipelineForecast: {
    funnel: [
      { name: 'New', value: 150 },
      { name: 'Contacted', value: 110 },
      { name: 'Qualified', value: 70 },
      { name: 'Quoted', value: 45 },
      { name: 'Converted', value: 25 },
    ],
  },
  teamPerformance: {
    leaderboard: [
      { rank: 1, name: 'Alice', dealsWon: 12, activities: 150 },
      { rank: 2, name: 'Bob', dealsWon: 9, activities: 120 },
      { rank: 3, name: 'Charlie', dealsWon: 7, activities: 95 },
    ],
    sourcePerformance: [
      { name: 'Website', value: 400 },
      { name: 'Referral', value: 300 },
      { name: 'Social Media', value: 200 },
      { name: 'Cold Call', value: 100 },
    ],
  },
  // Targets & Results mock
  currency: 'INR',
  targets: [
    { metric: 'revenue', target: 4500000, unit: 'currency' },
    { metric: 'deals_won', target: 5, unit: 'count' },
  ],
  results: {
    revenue: 980000,
    deals_won: 18,
  },
};

const defaultLeadData = {
  name: "",
  contactNumber: "",
  email: "",
  propertyType: "",
  propertyType: "",
  address: "",
  area: "",
  budget: "",
  designStyle: "",
  leadSource: "",
  preferredContact: "",
  notes: "",
  status: "New",
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
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// --- Reusable Components ---
function KpiCard({ icon, label, value, change, currency = false, convertedCount }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <div className="flex items-center gap-4">
        <div className="bg-blue-100 text-blue-600 p-3 rounded-full">{icon}</div>
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-xl font-bold text-gray-800">
            {currency && '₹'}
            {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
          </p>
          {convertedCount && (
            <p className="text-xs text-gray-600 mt-1">
              {convertedCount} converted this month
            </p>
          )}
        </div>
      </div>
      <p className={`text-xs mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {change >= 0 ? `+${change}%` : `${change}%`} vs last month
      </p>
    </div>
  );
}

function SectionCard({ title, children, viewAllLink, right }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 h-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg text-gray-800">{title}</h3>
        <div className="flex items-center gap-3">
          {right}
          {viewAllLink && (
            <Link href={viewAllLink} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View All <FaExternalLinkAlt size={12}/>
            </Link>
          )}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SalesPipelineFunnel({ data }) {
  // Enhanced color palette for better visual appeal
  const enhancedColors = [
    '#3B82F6', // Blue - New
    '#10B981', // Green - Semi
    '#F59E0B', // Amber - Potential
    '#EF4444', // Red - High Potential
    '#8B5CF6', // Purple - Converted
    '#6B7280', // Gray - Lost
    '#F97316', // Orange - Junk
  ];

  // Custom tooltip content
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-blue-600 font-bold">
            {payload[0].value} leads
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <SectionCard title="Sales Pipeline Funnel">
      <div className="relative">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 rounded-lg pointer-events-none"></div>
        
        <ResponsiveContainer width="100%" height={220}>
          <BarChart 
            data={data} 
            layout="vertical" 
            margin={{ top: 10, right: 30, left: 15, bottom: 10 }}
            barGap={2}
          >
            <defs>
              {/* Gradient definitions for bars */}
              <linearGradient id="blueGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="greenGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="amberGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="redGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="grayGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6B7280" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#6B7280" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="orangeGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#F97316" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#F97316" stopOpacity={1} />
              </linearGradient>
            </defs>
            
            <XAxis 
              type="number" 
              hide 
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={120} 
              tick={{ 
                fontSize: 13, 
                fontWeight: 600,
                fill: '#374151'
              }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              barSize={32}
              radius={[0, 4, 4, 0]}
              shadow={{ blur: 4, color: 'rgba(0,0,0,0.1)', offsetX: 2, offsetY: 2 }}
            >
              {data.map((entry, index) => {
                const gradients = [
                  'url(#blueGradient)',
                  'url(#greenGradient)', 
                  'url(#amberGradient)',
                  'url(#redGradient)',
                  'url(#purpleGradient)',
                  'url(#grayGradient)',
                  'url(#orangeGradient)'
                ];
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={gradients[index % gradients.length]}
                    stroke={enhancedColors[index % enhancedColors.length]}
                    strokeWidth={1}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        {/* Summary stats */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Total Leads:</span>
              <span className="font-semibold text-gray-800">
                {data.reduce((sum, item) => sum + (item.value || 0), 0)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">Converted:</span>
              <span className="font-semibold text-gray-800">
                {data.find(item => item.name.toLowerCase().includes('converted'))?.value || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function TeamLeaderboard({ data }) {
  return (
    <SectionCard title="Team Leaderboard" viewAllLink="/manager/team">
      <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {data.map(member => (
          <div key={member.rank} className="border-b border-gray-100 last:border-b-0 py-3">
            <div className="flex items-center gap-3 text-sm mb-2">
              <div className="font-bold text-gray-500 w-6">{member.rank === 1 ? <FaCrown className="text-yellow-500"/> : member.rank}.</div>
              <div className="flex-grow font-semibold text-gray-800">{member.name}</div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <p className="font-semibold text-gray-900">{member.dealsWon}</p>
                <p className="text-gray-500">Deals Won</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">₹{(member.avgDealValue || 0).toLocaleString('en-IN')}</p>
                <p className="text-gray-500">Avg Deal</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">₹{(member.revenueWon || 0).toLocaleString('en-IN')}</p>
                <p className="text-gray-500">Revenue</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function LeadSourcePerformance({ data }) {
  return (
    <SectionCard title="Lead Source Performance">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} fill="#8884d8">
            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </SectionCard>
  );
}

// --- Targets & Results (New) ---
function formatCurrency(currency, value) {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 0 }).format(value || 0);
  } catch {
    return `₹${(value || 0).toLocaleString('en-IN')}`;
  }
}
function getPeriodBounds(period) {
  const now = new Date();
  if (period === 'quarter') {
    const q = Math.floor(now.getMonth() / 3);
    const startMonth = q * 3;
    const start = new Date(now.getFullYear(), startMonth, 1);
    const end = new Date(now.getFullYear(), startMonth + 3, 0);
    return { start, end };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start, end };
}
function getExpectedPct(start, end) {
  const today = new Date();
  const clamped = today < start ? start : today > end ? end : today;
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysElapsed = Math.floor((clamped - start) / msPerDay) + 1;
  const daysTotal = Math.floor((end - start) / msPerDay) + 1;
  return { expectedPct: daysElapsed / daysTotal, daysElapsed, daysTotal };
}
function StatusChip({ status }) {
  const map = {
    'On Track': 'bg-green-100 text-green-700 border-green-200',
    'At Risk': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Off Track': 'bg-red-100 text-red-700 border-red-200',
    'No Target': 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return <span className={`px-2 py-0.5 text-xs rounded border ${map[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{status}</span>;
}

function TargetsResults({ targets = [], results = {}, currency = 'INR' }) {
  const [period, setPeriod] = useState('month'); // 'month' | 'quarter'
  const { start, end } = useMemo(() => getPeriodBounds(period), [period]);
  const { expectedPct } = useMemo(() => getExpectedPct(start, end), [start, end]);

  const metricDefs = [
    { key: 'revenue', title: 'Revenue', unit: 'currency' },
    { key: 'deals_won', title: 'Deals Won', unit: 'count' },
];

  const targetByMetric = useMemo(() => {
    const map = {};
    (targets || []).forEach(t => { map[t.metric] = t; });
    return map;
  }, [targets]);

  const items = metricDefs.map(m => {
    const target = targetByMetric[m.key]?.target ?? null;
    const actual = results?.[m.key] ?? 0;
    const expectedActual = target != null ? target * expectedPct : null;

    let status = 'No Target';
    if (target != null && target > 0) {
      if (actual >= expectedActual * 0.9) status = 'On Track';
      else if (actual >= expectedActual * 0.6) status = 'At Risk';
      else status = 'Off Track';
    }

    const pctToTarget = target ? Math.min(1, Math.max(0, actual / target)) : 0;
    const color =
      status === 'On Track' ? 'bg-green-500' :
      status === 'At Risk' ? 'bg-yellow-500' :
      status === 'Off Track' ? 'bg-red-500' : 'bg-gray-400';

    const fmt = (val) => m.unit === 'currency'
      ? formatCurrency(currency, val || 0)
      : (val || 0).toLocaleString('en-IN');

    return {
      ...m,
      target, actual, pctToTarget, color, status, fmt
    };
  });

  const revTarget = targetByMetric['revenue']?.target ?? null;
  const revActual = results?.['revenue'] ?? null;
  const overallAttainment = revTarget ? Math.round(((revActual || 0) / revTarget) * 100) : null;

  const toggle = (
    <div className="inline-flex border border-gray-200 rounded-md overflow-hidden">
      <button
        className={`px-3 py-1 text-sm ${period === 'month' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-700'}`}
        onClick={() => setPeriod('month')}
      >
        Month
      </button>
      <button
        className={`px-3 py-1 text-sm border-l border-gray-200 ${period === 'quarter' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-700'}`}
        onClick={() => setPeriod('quarter')}
      >
        Quarter
      </button>
    </div>
  );

  return (
    <SectionCard title="Targets & Results" right={toggle}>
      <div className="flex items-center justify-end text-sm text-gray-600">
        {overallAttainment != null
          ? <span>Overall Attainment: <span className="font-semibold text-gray-800">{overallAttainment}%</span></span>
          : <span className="italic">Overall attainment not set</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(item => (
          <div key={item.key} className="rounded-md border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">{item.title}</p>
              <StatusChip status={item.status} />
            </div>

            {item.target != null ? (
              <>
                <p className="text-sm text-gray-700 mt-2">
                  <span className="font-semibold text-gray-900">
                    {item.fmt(item.actual)}
                  </span> of {item.fmt(item.target)} — {Math.round(item.pctToTarget * 100)}%
                </p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color}`}
                    style={{ width: `${Math.round(item.pctToTarget * 100)}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 mt-2 italic">No target set for this period</p>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// --- Main Page ---
function MainDashboard() {
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const { employees: managerEmployees, loading: managerEmployeesLoading } = useSelector((state) => state.managerEmployee);
  const { pipelines } = useSelector((state) => state.pipelines);
  const { leads, loading: leadsLoading } = useSelector((state) => state.leads);
  const { dashboard, loading: dashboardLoading } = useSelector((state) => state.leadsDashboard);
  const dispatch = useDispatch();
  const companyId = sessionStorage.getItem("employeeCompanyId");
  const employeeId = sessionStorage.getItem("employeeId");
  const token = getItemFromSessionStorage("token");
  const isManager = jwtDecode(token).roles.includes("MANAGER");

  useEffect(() => {
    dispatch(fetchManagerEmployees());
  }, [dispatch]);

  // Load pipeline stages and leads for funnel chart
  useEffect(() => {
    dispatch(fetchPipelines());
    dispatch(fetchDashboard({ employeeId }));
    // dispatch(fetchLeads({ employeeId }));
  }, [dispatch, employeeId]);

  // Transform API data to dashboard format
  const dashboardData = useMemo(() => {
    if (!dashboard) {
      return MOCK_DATA;
    }

    // Find the company data - it could be under companyId or employeeId
    const companyId = sessionStorage.getItem("employeeCompanyId");
    let employeeData = null;
    
    // Try to find data under company ID first, then employee ID
    if (dashboard[companyId]) {
      employeeData = dashboard[companyId];
    } else if (dashboard[employeeId]) {
      employeeData = dashboard[employeeId];
    } else {
      // If neither exists, try to get the first available data
      const firstKey = Object.keys(dashboard)[0];
      if (firstKey) {
        employeeData = dashboard[firstKey];
      }
    }

    if (!employeeData) {
      return MOCK_DATA;
    }
    
    // Transform employees data for leaderboard - keep original order from API
    const leaderboardData = employeeData.employees?.map((emp, index) => ({
      rank: index + 1,
      name: emp.salesRep,
      dealsWon: emp.dealsWon,
      activities: Math.round(emp.revenueWon / 100000), // Mock activities based on revenue
      avgDealValue: emp.avgDealValue,
      revenueWon: emp.revenueWon
    })) || [];
    
    return {
      kpis: {
        avgDurationMonths: { 
          value: parseFloat(employeeData.avgDurationTime) || 0, 
          change: 0 
        },
        conversionRate: { 
          value: employeeData.conversionRate || '0%', 
          convertedCount: employeeData.dealsWon || 0, 
          change: 0 
        },
        avgDealValue: { 
          value: employeeData.avgDealValue || 0, 
          change: 0 
        },
        avgSalesCycleMonths: { 
          value: parseFloat(employeeData.avgSalesCycle) || 0, 
          change: 0 
        },
        revenueWon: { 
          value: employeeData.revenueWon || 0, 
          change: 0 
        }
      },
      pipelineForecast: {
        funnel: employeeData.salesPipelineFunnel?.map(stage => ({
          name: stage.stageName,
          value: stage.count
        })) || []
      },
      teamPerformance: {
        leaderboard: leaderboardData,
        sourcePerformance: []
      },
      currency: 'INR',
      targets: [
        { metric: 'revenue', target: 4500000, unit: 'currency' },
        { metric: 'deals_won', target: 5, unit: 'count' },
      ],
      results: {
        revenue: employeeData.revenueWon || 0,
        deals_won: employeeData.dealsWon || 0,
      },
    };
  }, [dashboard, employeeId]);

  const funnelData = useMemo(() => {
    // Use API data if available, otherwise fall back to calculated data
    if (dashboardData.pipelineForecast.funnel.length > 0) {
      return dashboardData.pipelineForecast.funnel;
    }
    
    if (!pipelines || pipelines.length === 0) return MOCK_DATA.pipelineForecast.funnel;
    
    // Sort pipelines by order
    const sorted = [...pipelines].sort((a, b) => {
      const ao = typeof a.orderIndex === 'number' ? a.orderIndex : (a.order || 0);
      const bo = typeof b.orderIndex === 'number' ? b.orderIndex : (b.order || 0);
      return ao - bo;
    });
    
    // Filter out Lost and Junk stages
    const filtered = sorted.filter(stage => 
      stage.formType !== 'LOST' && stage.formType !== 'JUNK'
    );
    
    // Calculate lead counts for each pipeline stage
    const stageCounts = {};
    if (leads && Array.isArray(leads)) {
      leads.forEach(lead => {
        const stageId = lead.pipelineId || lead.stageId;
        if (stageId) {
          stageCounts[stageId] = (stageCounts[stageId] || 0) + 1;
        }
      });
    }
    
    // Map pipeline stages to funnel data with actual counts
    return filtered.map(stage => ({
      name: stage.name,
      value: stageCounts[stage.stageId] || 0,
    }));
  }, [dashboardData.pipelineForecast.funnel, pipelines, leads]);

  const handleAddLeadSubmit = (formData) => {
    if (!formData.salesRep || !formData.designer) {
      toast.error('Please assign both Sales Person and Designer.');
      return;
    }
    const leadData = { ...defaultLeadData, ...formData, status: formData.status || "New", submittedBy: "SALESMANAGER" };
    // TODO: Implement actual lead creation API call
    toast.success(`Lead "${formData.name}" added successfully!`);
    setShowAddLeadModal(false);
    // Refresh dashboard data after adding lead
    dispatch(fetchDashboard(companyId, { employeeId: employeeId }));
  };

  return (
    <MainLayout>
      <div className="p-4 bg-gray-50 min-h-screen">
        {leadsLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Loading dashboard data...</span>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <KpiCard 
                icon={<FaBullseye size={22}/>} 
                label="Conversion Rate" 
                value={dashboardData.kpis.conversionRate.value} 
                change={dashboardData.kpis.conversionRate.change} 
                convertedCount={dashboardData.kpis.conversionRate.convertedCount}
              />
              <KpiCard
                icon={<FaHandHoldingUsd size={22}/>}
                label="Avg. Deal Value"
                value={dashboardData.kpis.avgDealValue.value}
                change={dashboardData.kpis.avgDealValue.change}
                currency={true}
              />
              <KpiCard
                icon={<FaClock size={22}/>}
                label="Average Duration Time"
                value={`${dashboardData.kpis.avgDurationMonths.value} months`}
                change={dashboardData.kpis.avgDurationMonths.change}
                currency={false}
              />
              <KpiCard
                icon={<FaClock size={22}/>}
                label="Avg. Sales Cycle"
                value={`${dashboardData.kpis.avgSalesCycleMonths.value} months`}
                change={dashboardData.kpis.avgSalesCycleMonths.change}
              />
            </div>

            {/* Content order: Mobile shows Targets & Results before other modules; Desktop shows it after */}
            <div className="flex flex-col gap-4">
              <div className={`grid grid-cols-1 ${isManager ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-4 order-2 lg:order-1`}>
                {isManager && (
                  <TeamLeaderboard data={dashboardData.teamPerformance.leaderboard} />
                )}
                <SalesPipelineFunnel data={funnelData} />
              </div>

              <div className="order-1 lg:order-2">
                <TargetsResults
                  targets={dashboardData.targets}
                  results={dashboardData.results}
                  currency={dashboardData.currency}
                />
              </div>
            </div>

            {/* Add Lead Modal */}
            <AddLeadModal
              isOpen={showAddLeadModal}
              onClose={() => setShowAddLeadModal(false)}
              onSubmit={handleAddLeadSubmit}
              initialData={defaultLeadData}
              isManagerView={isManager}
              salesPersons={managerEmployees}
              designers={managerEmployees}
              salesPersonsLoading={managerEmployeesLoading}
              designersLoading={managerEmployeesLoading}
            />
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default MainDashboard;