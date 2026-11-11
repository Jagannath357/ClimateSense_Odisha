import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { District, ClimateRecord } from '../types';
import { useTheme } from '../context/ThemeContext';
import { MultiSeriesTooltip } from '../components/ChartTooltips';
import {
  CalendarDays,
  MapPin,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  Table as TableIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';

export const HistoricalPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('cuttack');
  const [viewMode, setViewMode] = useState<'daily' | 'monthly' | 'annual'>('monthly');
  const [startDate, setStartDate] = useState<string>('2020-01-01');
  const [endDate, setEndDate] = useState<string>('2025-12-31');
  
  // Daily data state
  const [dailyData, setDailyData] = useState<ClimateRecord[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Aggregated data state
  const [aggregatedData, setAggregatedData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load districts
  useEffect(() => {
    let isMounted = true;
    api.getDistricts().then(res => {
      if (isMounted) {
        setDistricts(res.districts);
        if (res.districts.length > 0 && !selectedDistrict) {
          setSelectedDistrict(res.districts[0].id);
        }
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Fetch data on changes
  useEffect(() => {
    if (!selectedDistrict) return;
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (viewMode === 'daily') {
          const res = await api.getHistoricalClimate(selectedDistrict, startDate, endDate, page, 50);
          if (isMounted) {
            setDailyData(res.data);
            setTotalPages(res.total_pages);
            setTotalRecords(res.total_records);
          }
        } else {
          const res = await api.getAggregatedClimate(selectedDistrict, viewMode);
          if (isMounted) {
            setAggregatedData(res.data);
            setTotalRecords(res.total_periods);
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load historical data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [selectedDistrict, viewMode, startDate, endDate, page]);

  const handleExportCSV = () => {
    const dataToExport = viewMode === 'daily' ? dailyData : aggregatedData;
    if (dataToExport.length === 0) return;
    const headers = Object.keys(dataToExport[0]);
    const rows = dataToExport.map(row => headers.map(h => (row as any)[h] ?? '').join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `climatesense_${selectedDistrict}_${viewMode}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            <span>Historical Climate Archive</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Query and inspect 25 years of daily, monthly, and annual NASA observations (2001–2025).
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-xs font-semibold">
          <button
            onClick={() => { setViewMode('daily'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition ${
              viewMode === 'daily'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Daily Observations
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1.5 rounded-lg transition ${
              viewMode === 'monthly'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Monthly Aggregated
          </button>
          <button
            onClick={() => setViewMode('annual')}
            className={`px-3 py-1.5 rounded-lg transition ${
              viewMode === 'annual'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Annual Climatology
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-4 items-end text-xs">
        <div className="sm:col-span-4 space-y-1">
          <label className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
            District
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => { setSelectedDistrict(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-slate-900 dark:text-white"
          >
            {districts.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.region})</option>
            ))}
          </select>
        </div>

        {viewMode === 'daily' && (
          <>
            <div className="sm:col-span-3 space-y-1">
              <label className="font-bold text-slate-600 dark:text-slate-300">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
              />
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className="font-bold text-slate-600 dark:text-slate-300">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
              />
            </div>
          </>
        )}

        <div className="sm:col-span-2">
          <button
            onClick={handleExportCSV}
            className="w-full h-[38px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold flex items-center justify-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Chart Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>
              {viewMode === 'daily'
                ? `Daily Time Series in ${selectedDistrict.toUpperCase()} (${startDate} to ${endDate})`
                : viewMode === 'monthly'
                ? `Monthly Aggregated Means in ${selectedDistrict.toUpperCase()} (2001–2025)`
                : `Annual Mean Progression in ${selectedDistrict.toUpperCase()} (2001–2025)`}
            </span>
          </h3>
          <span className="text-xs text-slate-400">{totalRecords} records found</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={viewMode === 'daily' ? dailyData : aggregatedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.7} />
              <XAxis
                dataKey={viewMode === 'daily' ? 'date' : 'period'}
                stroke={isDark ? '#64748b' : '#94a3b8'}
                tick={{ fontSize: 11, fill: isDark ? '#cbd5e1' : '#475569' }}
              />
              <YAxis
                yAxisId="left"
                stroke={isDark ? '#64748b' : '#94a3b8'}
                tick={{ fontSize: 11, fill: isDark ? '#cbd5e1' : '#475569' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke={isDark ? '#64748b' : '#94a3b8'}
                tick={{ fontSize: 11, fill: isDark ? '#cbd5e1' : '#475569' }}
              />
              <Tooltip content={<MultiSeriesTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line yAxisId="left" type="monotone" dataKey={viewMode === 'daily' ? 'T2M' : 'T2M_mean'} stroke="#ef4444" name="Temp (°C)" dot={false} strokeWidth={2} />
              <Line yAxisId="left" type="monotone" dataKey={viewMode === 'daily' ? 'RH2M' : 'RH2M_mean'} stroke="#06b6d4" name="Humidity (%)" dot={false} strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey={viewMode === 'daily' ? 'PRECTOTCORR' : 'PRECTOTCORR_mean'} stroke="#3b82f6" name="Rainfall (mm)" dot={false} strokeWidth={2} />
              <Line yAxisId="left" type="monotone" dataKey={viewMode === 'daily' ? 'WS2M' : 'WS2M_mean'} stroke="#10b981" name="Wind (m/s)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Tabular Record Browser</span>
          </h3>

          {viewMode === 'daily' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Page {page} of {totalPages}</span>
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Date / Period</th>
                <th className="py-2.5 px-3">T2M (°C)</th>
                {viewMode === 'daily' && <th className="py-2.5 px-3">Max Temp</th>}
                {viewMode === 'daily' && <th className="py-2.5 px-3">Min Temp</th>}
                <th className="py-2.5 px-3">Humidity (%)</th>
                <th className="py-2.5 px-3">Precipitation (mm)</th>
                <th className="py-2.5 px-3">Wind Speed (m/s)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {viewMode === 'daily' ? (
                dailyData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">{row.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-red-600 dark:text-red-400">{row.T2M ?? '-'}</td>
                    <td className="py-2.5 px-3">{row.T2M_MAX ?? '-'}</td>
                    <td className="py-2.5 px-3">{row.T2M_MIN ?? '-'}</td>
                    <td className="py-2.5 px-3">{row.RH2M ?? '-'}</td>
                    <td className="py-2.5 px-3 font-semibold text-blue-600 dark:text-blue-400">{row.PRECTOTCORR ?? '-'}</td>
                    <td className="py-2.5 px-3">{row.WS2M ?? '-'}</td>
                  </tr>
                ))
              ) : (
                aggregatedData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">{row.period}</td>
                    <td className="py-2.5 px-3 font-semibold text-red-600 dark:text-red-400">{row.T2M_mean ?? '-'}</td>
                    <td className="py-2.5 px-3">{row.RH2M_mean ?? '-'}</td>
                    <td className="py-2.5 px-3 font-semibold text-blue-600 dark:text-blue-400">{row.PRECTOTCORR_mean ?? '-'}</td>
                    <td className="py-2.5 px-3">{row.WS2M_mean ?? '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

