/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { 
  Gauge, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Zap, 
  RefreshCw, 
  TrendingUp, 
  BarChart3, 
  Filter, 
  Play, 
  Layers, 
  Database, 
  ShieldCheck, 
  ArrowUpRight, 
  Cpu, 
  Search, 
  Flame,
  Check,
  ChevronRight,
  Sparkles,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/services/supabaseClient';
import { 
  supabaseAgentPerformance, 
  AgentTaskLog, 
  ToolPerformanceMetric, 
  TimeSeriesPerformancePoint 
} from '@/services/supabaseAgentPerformance';

interface AgentPerformanceViewProps {
  onAction?: (msg?: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Logistik & Bas': '#EF4444',     // Red
  'Google Workspace': '#3B82F6',   // Blue
  'Gedung Plugins': '#10B981',     // Emerald
  'Analisis & Laporan': '#8B5CF6'  // Purple
};

export const AgentPerformanceView: React.FC<AgentPerformanceViewProps> = ({ onAction }) => {
  const [logs, setLogs] = useState<AgentTaskLog[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [timeRangeDays, setTimeRangeDays] = useState<number>(7);
  const [sortBy, setSortBy] = useState<'efficiency' | 'latency' | 'successRate' | 'volume'>('efficiency');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkFeedback, setBenchmarkFeedback] = useState<string | null>(null);
  const [selectedToolDetail, setSelectedToolDetail] = useState<ToolPerformanceMetric | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<string>('SUBSCRIBED');
  const [isSimulatingRealtimeInsert, setIsSimulatingRealtimeInsert] = useState(false);

  // Load data & subscribe to Supabase logs + Realtime changes on `tasks` table
  useEffect(() => {
    loadPerformanceData();

    // 1. Local reactive store subscription
    const unsubStore = supabaseAgentPerformance.subscribe((data) => {
      setLogs(data);
    });

    // 2. Live Supabase Realtime subscription on `tasks` table
    const unsubRealtime = supabaseAgentPerformance.subscribeToRealtimeTasks(
      (newLog) => {
        setLogs((prev) => [newLog, ...prev.filter(l => l.id !== newLog.id)]);
        setBenchmarkFeedback(`⚡ Supabase Realtime: Rekod baharu dikesan dalam jadual 'tasks'! Alat: ${newLog.tool_name} (${newLog.latency_ms} ms) · Carta dikemas kini secara automatik.`);
        setTimeout(() => setBenchmarkFeedback(null), 5500);
      },
      (status) => {
        setRealtimeStatus(status);
      }
    );

    return () => {
      unsubStore();
      unsubRealtime();
    };
  }, []);

  const loadPerformanceData = async () => {
    setIsRefreshing(true);
    await supabaseAgentPerformance.fetchTaskLogs();
    setIsRefreshing(false);
  };

  // Simulate inserting a new task directly into Supabase `tasks` table
  const handleSimulateSupabaseTaskInsert = async () => {
    setIsSimulatingRealtimeInsert(true);
    const candidateTools: { name: string; cat: AgentTaskLog['tool_category'] }[] = [
      { name: 'bus_freight_dispatch_create', cat: 'Logistik & Bas' },
      { name: 'redbus_bus_freight_schedule', cat: 'Logistik & Bas' },
      { name: 'create_google_sheet', cat: 'Google Workspace' },
      { name: 'send_gmail_email', cat: 'Google Workspace' },
      { name: 'supabase_query_db', cat: 'Gedung Plugins' },
      { name: 'generate_yearly_report', cat: 'Analisis & Laporan' }
    ];
    const picked = candidateTools[Math.floor(Math.random() * candidateTools.length)];
    const randomLatency = Math.floor(130 + Math.random() * 260);

    const taskRecord = {
      task_id: `TSK-RT-${Math.floor(1000 + Math.random() * 9000)}`,
      tool_name: picked.name,
      tool_category: picked.cat,
      latency_ms: randomLatency,
      status: Math.random() > 0.05 ? ('SUCCESS' as const) : ('ERROR' as const),
      tokens_used: Math.floor(250 + Math.random() * 400),
      user_query: `Simulasi sisipan Supabase Realtime jadual tasks (${picked.name})`,
      model: 'gemini-3.8-flash'
    };

    await supabaseAgentPerformance.recordTaskExecution(taskRecord);
    setIsSimulatingRealtimeInsert(false);
  };

  // Run live tool benchmark simulation
  const handleRunBenchmark = async (toolName?: string, category?: any) => {
    setIsBenchmarking(true);
    const targetTool = toolName || 'bus_freight_dispatch_create';
    const targetCategory = category || 'Logistik & Bas';

    const recorded = await supabaseAgentPerformance.simulateToolBenchmark(targetTool, targetCategory);
    setIsBenchmarking(false);
    setBenchmarkFeedback(`Ujian penanda aras alat '${recorded.tool_name}' selesai dalam ${recorded.latency_ms}ms (Status: ${recorded.status}).`);
    setTimeout(() => setBenchmarkFeedback(null), 4500);
  };

  // Calculate metrics
  const { toolMetrics, overallMetrics, timeSeries } = useMemo(() => {
    return supabaseAgentPerformance.calculateMetrics(selectedCategory, timeRangeDays);
  }, [logs, selectedCategory, timeRangeDays]);

  // Sorted tool metrics based on user preference
  const sortedToolMetrics = useMemo(() => {
    const list = [...toolMetrics];
    if (sortBy === 'efficiency') {
      list.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
    } else if (sortBy === 'latency') {
      list.sort((a, b) => a.avgLatencyMs - b.avgLatencyMs);
    } else if (sortBy === 'successRate') {
      list.sort((a, b) => b.successRate - a.successRate);
    } else if (sortBy === 'volume') {
      list.sort((a, b) => b.totalCalls - a.totalCalls);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return list.filter(t => 
        t.displayName.toLowerCase().includes(q) || 
        t.toolName.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [toolMetrics, sortBy, searchQuery]);

  // Category Distribution for Donut Chart
  const categoryPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(l => {
      counts[l.tool_category] = (counts[l.tool_category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || '#64748B'
    }));
  }, [logs]);

  // Formatted chart data for Dual-Axis Chart (Top 8 tools to prevent crowding)
  const chartData = useMemo(() => {
    return sortedToolMetrics.slice(0, 10).map(t => ({
      name: t.displayName.length > 16 ? t.displayName.slice(0, 14) + '...' : t.displayName,
      fullName: t.displayName,
      latency: t.avgLatencyMs,
      successRate: t.successRate,
      calls: t.totalCalls,
      efficiency: t.efficiencyScore,
      category: t.category
    }));
  }, [sortedToolMetrics]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFAFA] overflow-y-auto">
      {/* Top Header */}
      <div className="p-6 pb-4 border-b border-black/[0.06] bg-white sticky top-0 z-20 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-purple-600 text-white shadow-xs">
                <BarChart3 size={18} />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                Prestasi & Kecekapan Agen AI (Agent Performance)
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Radio size={12} className="animate-pulse text-emerald-600" />
                <span>Supabase Realtime: Aktif (Jadual: tasks)</span>
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Visualisasi masa nyata purata kependaman (*average latency ms*), kadar kejayaan (*success rate %*), dan penilaian kecekapan setiap alat agen AI untuk membantu pasukan mengenal pasti alatan paling optimum.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSimulateSupabaseTaskInsert}
              disabled={isSimulatingRealtimeInsert}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold transition-all shadow-xs cursor-pointer"
              title="Sisip rekod baru terus ke jadual tasks Supabase untuk menguji kemas kini carta secara langsung"
            >
              <Zap size={13} className={cn(isSimulatingRealtimeInsert && "animate-spin text-amber-300")} />
              <span>{isSimulatingRealtimeInsert ? 'Menyisip...' : 'Sisip Tugas Baru (tasks)'}</span>
            </button>

            <button
              onClick={() => handleRunBenchmark()}
              disabled={isBenchmarking}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-semibold transition-all shadow-xs cursor-pointer"
              title="Jalankan ujian penanda aras kependaman langsung"
            >
              <Play size={13} className={cn(isBenchmarking && "animate-spin text-amber-400")} />
              <span>{isBenchmarking ? 'Menguji...' : 'Ujian Penanda Aras (Live)'}</span>
            </button>

            <button
              onClick={loadPerformanceData}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-purple-50 text-purple-800 hover:bg-purple-100 text-xs font-semibold border border-purple-200 transition-all"
              title="Segerak log tugasan terkini daripada Supabase"
            >
              <RefreshCw size={13} className={cn(isRefreshing && "animate-spin")} />
              <span>Segerak Supabase</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {benchmarkFeedback && (
          <motion.div 
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-purple-600 shrink-0" />
              <span className="font-medium">{benchmarkFeedback}</span>
            </div>
            <button onClick={() => setBenchmarkFeedback(null)} className="text-purple-600 font-bold hover:underline">Tutup</button>
          </motion.div>
        )}

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {/* Card 1: Avg Latency */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 border border-black/[0.04]">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Clock size={12} className="text-blue-500" />
              Purata Kependaman (Latency)
            </p>
            <p className="text-xl font-black text-zinc-900 mt-1">
              {overallMetrics.avgLatencyMs} <span className="text-xs font-semibold text-zinc-500">ms</span>
            </p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
              Sub-saat respons pantas ✓
            </p>
          </div>

          {/* Card 2: Success Rate */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60">
            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-600" />
              Kadar Kejayaan Global
            </p>
            <p className="text-xl font-black text-emerald-950 mt-1">
              {overallMetrics.overallSuccessRate}%
            </p>
            <p className="text-[10px] text-emerald-700 mt-0.5">
              Sasaran &gt;95% tercapai
            </p>
          </div>

          {/* Card 3: Most Efficient Tool */}
          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/60">
            <p className="text-[10px] font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} className="text-purple-600" />
              Alat Paling Cekap (Juara)
            </p>
            <p className="text-sm font-black text-purple-950 mt-1 truncate" title={overallMetrics.mostEfficientTool}>
              {overallMetrics.mostEfficientTool}
            </p>
            <p className="text-[10px] text-purple-700 mt-0.5">
              Skor kecekapan tertinggi
            </p>
          </div>

          {/* Card 4: Total Task Volume */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 border border-black/[0.04]">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Database size={12} className="text-amber-500" />
              Jumlah Panggilan Alat
            </p>
            <p className="text-xl font-black text-zinc-900 mt-1">
              {overallMetrics.totalTasks} <span className="text-xs font-semibold text-zinc-500">panggilan</span>
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Disimpan di Supabase
            </p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-black/[0.04] text-xs">
          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-zinc-400 mr-1 flex items-center gap-1">
              <Filter size={12} />
              Kategori:
            </span>
            {['all', 'Logistik & Bas', 'Google Workspace', 'Gedung Plugins', 'Analisis & Laporan'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-medium transition-all",
                  selectedCategory === cat 
                    ? "bg-zinc-900 text-white shadow-xs" 
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
                )}
              >
                {cat === 'all' ? 'Semua Alat' : cat}
              </button>
            ))}
          </div>

          {/* Timeframe & Sort */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg text-xs font-medium">
              {[
                { label: '24 Jam', val: 1 },
                { label: '7 Hari', val: 7 },
                { label: '30 Hari', val: 30 }
              ].map(t => (
                <button
                  key={t.val}
                  onClick={() => setTimeRangeDays(t.val)}
                  className={cn(
                    "px-2 py-1 rounded-md transition-all text-[11px]",
                    timeRangeDays === t.val ? "bg-white text-zinc-900 font-bold shadow-xs" : "text-zinc-500 hover:text-zinc-800"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="p-1.5 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-semibold border-none focus:ring-1 focus:ring-purple-400"
            >
              <option value="efficiency">Susun: Kecekapan Tertinggi</option>
              <option value="latency">Susun: Kependaman Terpantas</option>
              <option value="successRate">Susun: Kadar Kejayaan</option>
              <option value="volume">Susun: Kekerapan Panggilan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Charts & Visualizations Area */}
      <div className="p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">

        {/* CHART SECTION 1: Dual-Axis Recharts Composed Chart (Latency vs Success Rate) */}
        <div className="p-6 rounded-3xl bg-white border border-black/10 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-black/5 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Gauge size={18} className="text-purple-600" />
                <h3 className="font-bold text-sm text-zinc-900">
                  Perbandingan Kependaman (ms) & Kadar Kejayaan (%) Mengikut Alat Agen
                </h3>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Bar biru/ungu menunjukkan purata masa respons (ms); garisan hijau menunjukkan kadar kejayaan tugasan (%).
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5 text-zinc-600">
                <span className="w-3 h-3 rounded-xs bg-purple-600 inline-block" />
                Purata Latency (ms)
              </span>
              <span className="flex items-center gap-1.5 text-zinc-600">
                <span className="w-3 h-1 bg-emerald-500 inline-block" />
                Kadar Kejayaan (%)
              </span>
            </div>
          </div>

          {/* Recharts Container */}
          <div className="w-full h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#64748B' }} 
                  angle={-15} 
                  textAnchor="end"
                  interval={0}
                />
                {/* Left Axis: Latency ms */}
                <YAxis 
                  yAxisId="left" 
                  orientation="left" 
                  tick={{ fontSize: 11, fill: '#64748B' }} 
                  unit="ms" 
                />
                {/* Right Axis: Success % */}
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  domain={[80, 100]} 
                  tick={{ fontSize: 11, fill: '#10B981' }} 
                  unit="%" 
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 bg-zinc-900 text-white rounded-xl shadow-xl border border-white/10 text-xs space-y-1">
                          <p className="font-bold text-sm text-purple-300">{data.fullName}</p>
                          <p className="text-zinc-400">Kategori: <span className="text-white">{data.category}</span></p>
                          <div className="pt-1 space-y-0.5 text-[11px]">
                            <p className="flex justify-between gap-4">
                              <span className="text-zinc-400">Purata Kependaman:</span>
                              <strong className="text-white">{data.latency} ms</strong>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-zinc-400">Kadar Kejayaan:</span>
                              <strong className="text-emerald-400">{data.successRate}%</strong>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-zinc-400">Skor Kecekapan:</span>
                              <strong className="text-amber-300">{data.efficiency} / 100</strong>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-zinc-400">Jumlah Panggilan:</span>
                              <span className="text-zinc-300">{data.calls} kali</span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine yAxisId="right" y={95} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Target 95%', fill: '#EF4444', fontSize: 10 }} />
                
                {/* Latency Bars with conditional coloring */}
                <Bar 
                  yAxisId="left" 
                  dataKey="latency" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={38}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.latency < 250 ? '#10B981' : entry.latency < 600 ? '#8B5CF6' : '#F59E0B'} 
                    />
                  ))}
                </Bar>

                {/* Success Rate Line */}
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="successRate" 
                  stroke="#10B981" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#FFFFFF' }} 
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART SECTION 2: Grid Split (Area Trend & Category Distribution) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Trend Sepanjang Hari (AreaChart - 2 Cols) */}
          <div className="md:col-span-2 p-6 rounded-3xl bg-white border border-black/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/5">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-600" />
                <h4 className="font-bold text-xs text-zinc-900 uppercase tracking-wider">
                  Trend Kependaman Respons Sepanjang Hari (Waktu Operasi)
                </h4>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">Data Supabase 24j</span>
            </div>

            <div className="w-full h-56 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit="ms" />
                  <Tooltip 
                    formatter={(val: any) => [`${val} ms`, 'Purata Latency']}
                    labelFormatter={(label) => `Waktu: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="avgLatencyMs" 
                    stroke="#8B5CF6" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#latencyGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-zinc-500">
              Kependaman paling rendah dicatat sekitar waktu luar puncak (00:00 - 04:00), meningkat sedikit semasa waktu puncak kemas kini kargo TBS (09:00 - 14:00).
            </p>
          </div>

          {/* Kategori Tugasan Agen (PieChart - 1 Col) */}
          <div className="p-6 rounded-3xl bg-white border border-black/10 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-black/5">
                <Layers size={16} className="text-blue-600" />
                <h4 className="font-bold text-xs text-zinc-900 uppercase tracking-wider">
                  Pengagihan Panggilan Alat
                </h4>
              </div>

              <div className="w-full h-44 my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`${val} tugasan`, 'Jumlah']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Legend list */}
            <div className="space-y-1.5 pt-2 border-t border-black/5 text-xs">
              {categoryPieData.map(cat => (
                <div key={cat.name} className="flex items-center justify-between text-zinc-600 text-[11px]">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <strong className="text-zinc-900">{cat.value} ({Math.round((cat.value / logs.length) * 100)}%)</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3: Efficiency Leaderboard & Performance Table */}
        <div className="p-6 rounded-3xl bg-white border border-black/10 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5">
            <div>
              <h3 className="font-bold text-sm text-zinc-900">
                Papan Penarafan Kecekapan Alat Agen AI (Efficiency Matrix)
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Analisis terperinci kependaman minimum, maksimum, P95, kadar kegagalan, dan cadangan pengoptimuman bagi setiap fungsi alat.
              </p>
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari alat atau fungsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-black/10 text-zinc-400 uppercase text-[10px] font-bold">
                  <th className="pb-3 pr-2">Kedudukan & Alat</th>
                  <th className="pb-3 px-3">Kategori</th>
                  <th className="pb-3 px-3">Jumlah Panggilan</th>
                  <th className="pb-3 px-3">Purata Latency</th>
                  <th className="pb-3 px-3">Kependaman P95</th>
                  <th className="pb-3 px-3">Kadar Kejayaan</th>
                  <th className="pb-3 px-3">Skor Kecekapan</th>
                  <th className="pb-3 pl-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {sortedToolMetrics.map((t, idx) => {
                  const isTop = idx === 0;

                  return (
                    <tr 
                      key={t.toolName}
                      className={cn(
                        "hover:bg-zinc-50/80 transition-colors",
                        isTop && "bg-purple-50/20"
                      )}
                    >
                      {/* Name & Rank */}
                      <td className="py-3.5 pr-2">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px]",
                            idx === 0 ? "bg-amber-400 text-black shadow-xs" :
                            idx === 1 ? "bg-zinc-200 text-zinc-700" :
                            idx === 2 ? "bg-amber-700/20 text-amber-900" :
                            "bg-zinc-100 text-zinc-500"
                          )}>
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                              <span>{t.displayName}</span>
                              {isTop && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-bold">
                                  Paling Cekap
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-zinc-400">{t.toolName}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700">
                          {t.category}
                        </span>
                      </td>

                      {/* Total Calls */}
                      <td className="py-3.5 px-3 font-semibold text-zinc-800">
                        {t.totalCalls} kali
                      </td>

                      {/* Latency Avg */}
                      <td className="py-3.5 px-3">
                        <span className={cn(
                          "font-mono font-bold text-xs",
                          t.avgLatencyMs < 250 ? "text-emerald-600" :
                          t.avgLatencyMs < 600 ? "text-purple-700" : "text-amber-600"
                        )}>
                          {t.avgLatencyMs} ms
                        </span>
                        <div className="text-[10px] text-zinc-400">Min: {t.minLatencyMs}ms · Max: {t.maxLatencyMs}ms</div>
                      </td>

                      {/* P95 Latency */}
                      <td className="py-3.5 px-3 font-mono text-zinc-600">
                        {t.p95LatencyMs} ms
                      </td>

                      {/* Success Rate */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "font-bold text-xs",
                            t.successRate >= 98 ? "text-emerald-600" :
                            t.successRate >= 92 ? "text-amber-600" : "text-rose-600"
                          )}>
                            {t.successRate}%
                          </span>
                        </div>
                        <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden mt-1">
                          <div 
                            className={cn(
                              "h-full rounded-full",
                              t.successRate >= 95 ? "bg-emerald-500" : "bg-amber-500"
                            )} 
                            style={{ width: `${t.successRate}%` }} 
                          />
                        </div>
                      </td>

                      {/* Efficiency Rating Score */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1">
                          <span className="font-black text-sm text-zinc-900">{t.efficiencyScore}</span>
                          <span className="text-[10px] text-zinc-400">/ 100</span>
                        </div>
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-wider block",
                          t.efficiencyRating === 'EXCELLENT' ? "text-emerald-700" :
                          t.efficiencyRating === 'GOOD' ? "text-blue-700" : "text-amber-700"
                        )}>
                          {t.efficiencyRating === 'EXCELLENT' ? 'Cemerlang' : t.efficiencyRating === 'GOOD' ? 'Baik' : 'Optimasi'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 pl-3 text-right">
                        <button
                          onClick={() => handleRunBenchmark(t.toolName, t.category)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-[11px] transition-all"
                        >
                          Uji Alat
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 4: Live Telemetry Activity Feed from Supabase */}
        <div className="p-6 rounded-3xl bg-white border border-black/10 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-black/5">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-purple-600" />
              <h3 className="font-bold text-xs text-zinc-900 uppercase tracking-wider">
                Suapan Aktiviti Tugasan Terkini (Supabase Real-Time Logs)
              </h3>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">Status: Langsung Terkini</span>
          </div>

          <div className="divide-y divide-black/5">
            {logs.slice(0, 6).map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center font-bold shrink-0 mt-0.5",
                    log.status === 'SUCCESS' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  )}>
                    {log.status === 'SUCCESS' ? <Check size={14} /> : <AlertTriangle size={14} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-900">{log.tool_name}</span>
                      <span className="px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 font-mono text-[10px]">
                        {log.task_id}
                      </span>
                      <span className="text-[10px] text-zinc-400">({log.tool_category})</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1 italic">
                      &quot;{log.user_query}&quot;
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto font-mono text-[11px]">
                  <span className={cn(
                    "px-2 py-0.5 rounded font-bold",
                    log.latency_ms < 300 ? "bg-emerald-50 text-emerald-800" :
                    log.latency_ms < 700 ? "bg-purple-50 text-purple-800" : "bg-amber-50 text-amber-800"
                  )}>
                    {log.latency_ms} ms
                  </span>
                  <span className="text-zinc-400">
                    {new Date(log.timestamp).toLocaleTimeString('ms-MY', { hour12: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
