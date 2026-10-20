import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  ShieldAlert,
  Calendar,
  Filter,
  Info,
  MapPin,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
  Search,
} from 'lucide-react';
import { DistrictMap } from '../components/DistrictMap';
import {
  DistrictName,
  HP_DISTRICTS,
  OfficialCaseRecord,
  SeizureCategory,
} from '../types';
import {
  DEMO_DATASET_METADATA,
  DISTRICT_AGGREGATE_STATISTICS,
  INITIAL_OFFICIAL_CASES,
} from '../data/hpData';
import { AppMode, ApiService } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardViewProps {
  appMode: AppMode;
  onNavigateToReport: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ appMode, onNavigateToReport }) => {
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictName | 'All'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Filter cases based on current selection
  const filteredCases = useMemo(() => {
    return INITIAL_OFFICIAL_CASES.filter(c => {
      if (selectedYear !== 'All' && c.year.toString() !== selectedYear) return false;
      if (selectedDistrict !== 'All' && c.district !== selectedDistrict) return false;
      if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchCase = c.caseNumber.toLowerCase().includes(query);
        const matchPs = c.policeStation.toLowerCase().includes(query);
        const matchNotes = (c.notes || '').toLowerCase().includes(query);
        const matchDistrict = c.district.toLowerCase().includes(query);
        if (!matchCase && !matchPs && !matchNotes && !matchDistrict) return false;
      }
      return true;
    });
  }, [selectedYear, selectedDistrict, selectedCategory, searchQuery]);

  // Aggregate case counts by district for the map and bar chart
  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    HP_DISTRICTS.forEach(d => {
      const hist = DISTRICT_AGGREGATE_STATISTICS[d];
      if (selectedYear === '2021') counts[d] = hist.cases2021;
      else if (selectedYear === '2022') counts[d] = hist.cases2022;
      else if (selectedYear === '2023') counts[d] = hist.cases2023;
      else if (selectedYear === '2024') counts[d] = hist.cases2024;
      else if (selectedYear === '2025') counts[d] = hist.cases2025;
      else counts[d] = hist.totalOfficialCases;
    });
    return counts;
  }, [selectedYear]);

  // Calculate high-level summary totals
  const totalStateCases = useMemo(() => {
    return Object.values(districtCounts).reduce((acc, v) => acc + v, 0);
  }, [districtCounts]);

  // District Comparison Bar Chart Data
  const districtChartData = useMemo(() => {
    const labels = [...HP_DISTRICTS].sort((a, b) => (districtCounts[b] || 0) - (districtCounts[a] || 0));
    return {
      labels,
      datasets: [
        {
          label: selectedYear === 'All' ? 'Total Documented Cases (2021–2025)' : `Cases in ${selectedYear}`,
          data: labels.map(d => districtCounts[d] || 0),
          backgroundColor: labels.map(d => (d === selectedDistrict ? '#1d4ed8' : '#3b82f6')),
          borderRadius: 4,
        },
      ],
    };
  }, [districtCounts, selectedDistrict, selectedYear]);

  // Year-wise Trend Data
  const trendChartData = useMemo(() => {
    const years = ['2021', '2022', '2023', '2024', '2025'];
    const data = years.map(yr => {
      if (selectedDistrict === 'All') {
        return Object.values(DISTRICT_AGGREGATE_STATISTICS).reduce(
          (acc, item) => acc + (item as any)[`cases${yr}`],
          0
        );
      } else {
        const item = DISTRICT_AGGREGATE_STATISTICS[selectedDistrict];
        return item ? (item as any)[`cases${yr}`] : 0;
      }
    });

    return {
      labels: years,
      datasets: [
        {
          label: selectedDistrict === 'All' ? 'Statewide Aggregate' : `${selectedDistrict} District`,
          data,
          borderColor: '#0f172a',
          backgroundColor: 'rgba(15, 23, 42, 0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#0f172a',
        },
      ],
    };
  }, [selectedDistrict]);

  // Seizure Category Breakdown Doughnut Chart Data
  const categoryDoughnutData = useMemo(() => {
    return {
      labels: [
        'Heroin / Chitta',
        'Charas (Cannabis Resin)',
        'Synthetic Pharma',
        'Opium / Poppy Husk',
        'Cultivation / Plants',
      ],
      datasets: [
        {
          data: [1340, 1180, 680, 240, 123],
          backgroundColor: ['#dc2626', '#16a34a', '#d97706', '#7c3aed', '#059669'],
          borderWidth: 1,
          borderColor: '#ffffff',
        },
      ],
    };
  }, []);

  const totalPages = Math.ceil(filteredCases.length / pageSize) || 1;
  const paginatedCases = filteredCases.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner: Strictly Separate Official from Citizen & Highlight Synthetic Nature */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-amber-950">DEMO DATA NOTICE:</span>{' '}
            <span>
              All case identifiers, FIR sequences, and checkpoint intercepts shown are synthetic
              demonstration records calibrated to Himachal Pradesh Police annual statistical formats.
              Citizen reports are strictly segregated and never mixed into official crime statistics.
            </span>
          </div>
        </div>
        <div className="text-amber-800 font-mono text-[11px] whitespace-nowrap shrink-0">
          Period: 2021–2025 · Last Updated: 2025-12-31
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Official Case Records</div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            {totalStateCases.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {selectedYear === 'All' ? 'Cumulative (2021–2025)' : `Registered in ${selectedYear}`}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Monitored HP Districts</div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            12
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Full administrative coverage across all police ranges
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Top Seizure Categories</div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Heroin & Charas
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            68.4% of total state seizures under NDPS Act
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Commercial Quantity Ratio</div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            27.6%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Meets statutory NDPS commercial prosecution limit
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Filters:</span>
            </div>

            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={e => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="All">All Years (2021–2025)</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
            </select>

            {/* District Selector */}
            <select
              value={selectedDistrict}
              onChange={e => {
                setSelectedDistrict(e.target.value as DistrictName | 'All');
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="All">All 12 Districts</option>
              {HP_DISTRICTS.map(d => (
                <option key={d} value={d}>
                  {d} District
                </option>
              ))}
            </select>

            {/* Category Selector */}
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="All">All Seizure Categories</option>
              <option value="Charas (Cannabis Resin)">Charas (Cannabis Resin)</option>
              <option value="Heroin / Chitta">Heroin / Chitta</option>
              <option value="Synthetic Pharmaceuticals">Synthetic Pharmaceuticals</option>
              <option value="Opium / Poppy Husk">Opium / Poppy Husk</option>
              <option value="Cannabis Plants (Cultivation)">Cannabis Cultivation</option>
            </select>

            {(selectedYear !== 'All' || selectedDistrict !== 'All' || selectedCategory !== 'All') && (
              <button
                onClick={() => {
                  setSelectedYear('All');
                  setSelectedDistrict('All');
                  setSelectedCategory('All');
                  setCurrentPage(1);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium underline ml-1 cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search FIR, PS, or route..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded pl-8 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map + District Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* District Map Column */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Himachal Pradesh District Case Density
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">12 Districts</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Click any district marker to inspect administrative headquarters, dominant seizure profile,
            and primary inter-state transit corridors.
          </p>
          <DistrictMap
            selectedDistrict={selectedDistrict}
            onSelectDistrict={d => {
              setSelectedDistrict(d);
              setCurrentPage(1);
            }}
            caseCountByDistrict={districtCounts}
          />
        </div>

        {/* District Comparison Bar Chart Column */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  District-Wise Case Distribution
                </h3>
              </div>
              <span className="text-xs text-slate-500">Sorted by frequency</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Comparative volume of officially documented cases across Himachal Pradesh police
              districts.
            </p>
            <div className="h-[360px] w-full">
              <Bar
                data={districtChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: ctx => ` ${ctx.raw} Cases`,
                      },
                    },
                  },
                  scales: {
                    x: {
                      ticks: { font: { size: 10 }, maxRotation: 45 },
                      grid: { display: false },
                    },
                    y: {
                      ticks: { font: { size: 10 } },
                      grid: { color: 'rgba(226, 232, 240, 0.6)' },
                    },
                  },
                }}
              />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Source: Public Crime Review Synthetics</span>
            <span>Clicking bar highlights corresponding district</span>
          </div>
        </div>
      </div>

      {/* Secondary Charts Grid: Yearly Trend & Seizure Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              5-Year Annual Registration Trend (2021–2025)
            </h3>
            <span className="text-xs text-slate-500">
              {selectedDistrict === 'All' ? 'All Districts' : selectedDistrict}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Historical annual trendline showing changes in registered enforcement cases.
          </p>
          <div className="h-[220px] w-full">
            <Line
              data={trendChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                  y: {
                    grid: { color: 'rgba(226, 232, 240, 0.6)' },
                    ticks: { font: { size: 11 } },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Seizure Category Proportion</h3>
            <span className="text-xs text-slate-500">NDPS Classifications</span>
          </div>
          <p className="text-xs text-slate-500">
            Breakdown across major chemical and botanical substance classifications.
          </p>
          <div className="h-[220px] flex items-center justify-center">
            <Doughnut
              data={categoryDoughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: { boxWidth: 12, font: { size: 11 } },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Representative Cases Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Documented Representative Case Logs
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredCases.length} records matching active filters.
            </p>
          </div>
          <button
            onClick={onNavigateToReport}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
          >
            Submit Tip / Report
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Case ID</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">District</th>
                <th className="py-2.5 px-3">Police Station</th>
                <th className="py-2.5 px-3">Seizure Category</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3">NDPS Threshold</th>
                <th className="py-2.5 px-3">Transit Corridor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No cases match the selected filters or search query.
                  </td>
                </tr>
              ) : (
                paginatedCases.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 font-mono text-slate-700 font-medium">
                      {c.caseNumber}
                    </td>
                    <td className="py-2 px-3 text-slate-600 font-mono tabular-nums whitespace-nowrap">
                      {c.date}
                    </td>
                    <td className="py-2 px-3 text-slate-900 font-medium whitespace-nowrap">
                      {c.district}
                    </td>
                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{c.policeStation}</td>
                    <td className="py-2 px-3">
                      <span className="text-slate-800 font-medium">{c.category}</span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-900 font-semibold whitespace-nowrap">
                      {c.quantityValue} {c.quantityUnit}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span
                        className={`text-[11px] font-medium ${
                          c.commercialClassification === 'Commercial'
                            ? 'text-red-700'
                            : c.commercialClassification === 'Intermediate'
                            ? 'text-amber-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {c.commercialClassification}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-500 text-[11px] max-w-xs truncate">
                      {c.transitRoute || c.seizureLocationType}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Page <span className="font-semibold text-slate-900 font-mono">{currentPage}</span> of{' '}
              <span className="font-semibold text-slate-900 font-mono">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
