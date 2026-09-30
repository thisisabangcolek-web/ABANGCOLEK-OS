/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  Briefcase, 
  Search, 
  Database,
  Loader2,
  Sparkles,
  CheckCircle2,
  Activity,
  MoreHorizontal,
  FileText,
  Mail,
  CheckSquare,
  FolderOpen,
  Calendar,
  FileSpreadsheet,
  MapPin,
  Video,
  MessageSquare,
  Flame,
  Plus,
  AlertCircle,
  Zap,
  Truck,
  Gauge
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { sendMessageToAgentStream, ChatMessage, ToolCall, MOCK_DB, AgentStep, subscribeToolExecution } from '@/services/gemini';
import { appStore, OrderItem } from '@/services/store';
import { AbangColekDiscoveryView } from '@/components/AbangColekDiscoveryView';
import { PluginsView } from '@/components/PluginsView';
import { PluginArtifactCard } from '@/components/PluginArtifactCard';
import { FormsView } from '@/components/FormsView';
import { GmailView } from '@/components/GmailView';
import { TasksView } from '@/components/TasksView';
import { DocsView } from '@/components/DocsView';
import { CalendarView } from '@/components/CalendarView';
import { SheetsView } from '@/components/SheetsView';
import { MapsView } from '@/components/MapsView';
import { MeetView } from '@/components/MeetView';
import { ChatWorkspaceView } from '@/components/ChatWorkspaceView';
import { subscribeAuth } from '@/services/googleAuth';
import { User as FbUser } from 'firebase/auth';
import { OrdersView } from '@/components/OrdersView';
import { useSupabaseAuth } from '@/services/supabaseAuth';
import { BusFreightView } from '@/components/BusFreightView';
import { AgentPerformanceView } from '@/components/AgentPerformanceView';
import { AgentInsightCard } from '@/components/AgentInsightCard';

// --- Components ---

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  isToolOrPluginInProgress 
}: { 
  activeTab: string; 
  setActiveTab: (t: string) => void;
  isToolOrPluginInProgress?: boolean;
}) => {
  const [googleUser, setGoogleUser] = useState<FbUser | null>(null);
  const { user: supabaseUser, quickStaffSignIn, signOut: supabaseSignOut } = useSupabaseAuth();

  useEffect(() => {
    return subscribeAuth((u) => {
      setGoogleUser(u);
    });
  }, []);

  const workspaceItems = [
    { id: 'discovery', label: 'Abang Colek Hub', icon: Flame, badge: 'v4.2' },
    { id: 'chat', label: 'Agent Chat', icon: Bot },
    { id: 'bus_freight', label: 'Ekspres Bas & Ejen', icon: Truck, badge: 'SOP 1 Jam' },
    { id: 'plugins', label: 'Gedung Plugins', icon: Zap, badge: '12 Aktif' },
    { id: 'gmail', label: 'Gmail', icon: Mail },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'docs', label: 'Docs', icon: FileText },
    { id: 'sheets', label: 'Sheets', icon: FileSpreadsheet },
    { id: 'forms', label: 'Forms', icon: FolderOpen, badge: googleUser ? 'Synced' : undefined },
    { id: 'meet', label: 'Meet', icon: Video },
    { id: 'chat_workspace', label: 'Chat', icon: MessageSquare },
    { id: 'maps', label: 'Logistics Map', icon: MapPin },
  ];

  const analyticsItems = [
    { id: 'agent_performance', label: 'Prestasi Agen AI', icon: Gauge, badge: 'Recharts' },
    { id: 'dashboards', label: 'Dashboards', icon: Activity },
    { id: 'reports', label: 'Reports', icon: Search },
    { id: 'orders', label: 'Orders', icon: Database },
    { id: 'reviews', label: 'Reviews', icon: Briefcase },
  ];

  return (
    <div className="hidden md:flex w-[280px] flex-col h-screen pt-7 pb-5 pl-7 pr-3 shrink-0">
      <div className="mb-6 px-4 flex items-center">
        <button onClick={() => window.location.reload()} className="text-xl font-bold text-black tracking-tight text-left hover:opacity-70 transition-opacity flex items-center gap-2">
          <Flame size={20} className="text-red-600 fill-red-600" />
          <span>ABANGCOLEK-OS</span>
        </button>
      </div>
      
      <nav className="flex-1 space-y-4 pr-1 overflow-y-auto min-h-0 text-[13px]">
        <div>
          <p className="px-4 mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Workspace & AI</p>
          <div className="space-y-1">
            {workspaceItems.map((item) => {
              const isChat = item.id === 'chat';
              const isExecuting = isChat && isToolOrPluginInProgress;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3.5 py-2.5 rounded-full font-medium transition-all text-left group",
                    activeTab === item.id 
                      ? "bg-black text-white shadow-sm" 
                      : "text-zinc-600 hover:bg-black/[0.04] hover:text-black",
                    isExecuting && activeTab !== item.id && "bg-amber-50/80 border border-amber-200/60 text-amber-950"
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {isExecuting ? (
                      <span className="relative flex items-center justify-center shrink-0 w-4 h-4">
                        <motion.span
                          animate={{
                            scale: [1, 1.25, 1],
                            opacity: [0.8, 1, 0.8],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.5,
                            ease: "easeInOut",
                          }}
                          className="flex items-center justify-center"
                        >
                          <item.icon 
                            size={15} 
                            strokeWidth={activeTab === item.id ? 2.5 : 2} 
                            className={cn(
                              "shrink-0 transition-colors",
                              activeTab === item.id ? "text-amber-300" : "text-amber-600"
                            )} 
                          />
                        </motion.span>
                        <span className="absolute -top-1 -right-1 flex h-2 w-2 pointer-events-none">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                        </span>
                      </span>
                    ) : (
                      <item.icon size={15} strokeWidth={activeTab === item.id ? 2.5 : 2} className="shrink-0" />
                    )}
                    <span className="truncate">{item.label}</span>
                  </div>
                  {isExecuting ? (
                    <span className={cn(
                      "text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 flex items-center gap-1",
                      activeTab === item.id 
                        ? "bg-amber-400/20 text-amber-200 border border-amber-300/30" 
                        : "bg-amber-100 text-amber-800 border border-amber-300/60 shadow-xs"
                    )}>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                      <span>Running</span>
                    </span>
                  ) : item.badge && (
                    <span className={cn(
                      "text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0",
                      activeTab === item.id 
                        ? "bg-white/20 text-white" 
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="px-4 mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Operations & Data</p>
          <div className="space-y-1">
            {analyticsItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-2.5 rounded-full font-medium transition-all text-left",
                  activeTab === item.id 
                    ? "bg-black text-white shadow-sm" 
                    : "text-zinc-600 hover:bg-black/[0.04] hover:text-black"
                )}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <item.icon size={15} strokeWidth={activeTab === item.id ? 2.5 : 2} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Supabase Database & Auth Pill in Sidebar Footer */}
      <div className="pr-1 pt-3 border-t border-black/[0.04] shrink-0 space-y-2">
        <div className="p-3 rounded-2xl bg-white border border-black/[0.04] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Supabase Auth
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              Live DB
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1 truncate font-mono">
            {supabaseUser?.email || 'thisisabangcolek@gmail.com'}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <button
              onClick={() => quickStaffSignIn('hq_admin')}
              className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold transition-colors cursor-pointer"
              title="Tukar sesi ke HQ Admin"
            >
              HQ Admin
            </button>
            <button
              onClick={() => quickStaffSignIn('stockist_kt')}
              className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold transition-colors cursor-pointer"
              title="Tukar sesi ke Stokis Terengganu"
            >
              Stokis KT
            </button>
            {supabaseUser && (
              <button
                onClick={() => supabaseSignOut()}
                className="text-[10px] px-2 py-0.5 rounded bg-red-50 hover:bg-red-100 text-red-600 font-semibold ml-auto transition-colors cursor-pointer"
              >
                Log Keluar
              </button>
            )}
          </div>
        </div>

        {/* Google Workspace Connection Pill */}
        <button
          onClick={() => setActiveTab('gmail')}
          className="w-full text-left p-2.5 rounded-2xl bg-white border border-black/[0.04] hover:border-black/20 transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Google Workspace
            </span>
            <span className={cn(
              "text-[10px] font-medium px-2 py-0.5 rounded-full",
              googleUser ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"
            )}>
              {googleUser ? 'Connected' : 'Offline Mode'}
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
            {googleUser ? (googleUser.displayName || googleUser.email) : 'Sign in on any tab'}
          </p>
        </button>
      </div>
    </div>
  );
};

const AgentStepBlock = ({ step }: { step: AgentStep }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-3xl transition-all",
        step.status === 'streaming' ? "bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/5" : "bg-zinc-50 border border-black/[0.02]"
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-white shadow-sm border border-black/5 text-zinc-500"
        )}>
          {step.type === 'tool' ? <Database size={12} /> : <Bot size={12} />}
        </div>
        <span className="font-semibold text-[13px] text-zinc-800 truncate">
          {step.type === 'tool' ? `Tool Call: ${step.toolName}` : 'Thinking'}
        </span>
        {step.status === 'streaming' && <Loader2 size={12} className="animate-spin text-zinc-400 ml-auto shrink-0" />}
        {step.status === 'completed' && (
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {step.latencyMs !== undefined && (
              <span className="text-[10px] text-zinc-500 font-medium">
                {(step.latencyMs / 1000).toFixed(2)}s
              </span>
            )}
            <div className="text-emerald-500">
              <CheckCircle2 size={14} />
            </div>
          </div>
        )}
      </div>
      
      {step.type === 'tool' && step.toolArgs && (
        <pre className="text-[10px] bg-white text-zinc-500 p-3 rounded-2xl overflow-x-auto mt-3 font-mono whitespace-pre-wrap border border-black/[0.04]">
          {JSON.stringify(step.toolArgs, null, 2)}
        </pre>
      )}
      
      {step.type === 'text' && step.content && (
        <div className="text-[13px] text-zinc-500 mt-2 line-clamp-2 leading-relaxed">"{step.content}"</div>
      )}

      {step.result && (
        <div className="mt-4 pt-3 border-t border-black/[0.04] flex flex-col gap-1 text-[11px]">
          <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[9px]">Result</span> 
          <span className="text-zinc-700 truncate font-medium">{step.result.message || 'Success'}</span>
        </div>
      )}
    </motion.div>
  );
};

const ChatInterface = ({ 
  history, 
  onSendMessage, 
  isProcessing,
  currentTool,
  agentSteps,
  streamingText,
  setActiveTab
}: { 
  history: ChatMessage[], 
  onSendMessage: (msg: string) => void,
  isProcessing: boolean,
  currentTool: ToolCall | null,
  agentSteps: AgentStep[],
  streamingText: string,
  setActiveTab: (tab: string) => void
}) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isProcessing, currentTool, streamingText]);

  useEffect(() => {
    if (leftScrollRef.current) {
      leftScrollRef.current.scrollTop = leftScrollRef.current.scrollHeight;
    }
  }, [agentSteps]);

  const isGeneratingReport = agentSteps.some(s => s.type === 'tool' && s.toolName === 'generate_yearly_report');
  const isGeneratingDashboard = agentSteps.some(s => s.type === 'tool' && s.toolName === 'create_operations_dashboard');
  const isGeneratingWidget = isGeneratingReport || isGeneratingDashboard;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-col md:flex-row-reverse h-auto md:h-full w-full gap-4 md:gap-6">
      {/* Right side: Process & Agent Steps */}
      <div className="min-h-[300px] flex-1 md:min-h-0 md:flex-initial w-full md:w-[60%] flex flex-col rounded-[32px] bg-white border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden relative">
        <header className="h-[60px] md:h-[72px] flex items-center px-4 md:px-8 bg-white shrink-0 border-b border-black/[0.04]">
          <h2 className="font-semibold text-zinc-900 text-[15px] flex items-center gap-3">
            {isProcessing ? (
              <Loader2 className="text-zinc-400 animate-spin" size={16} />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center border border-black/5">
                <Activity className="text-zinc-600" size={14} />
              </div>
            )}
            Execution Trace
          </h2>
        </header>
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-4 md:pb-8 pt-4 md:pt-6 space-y-4" ref={leftScrollRef}>
          {agentSteps.length === 0 && !isProcessing && (
             <div className="text-zinc-400 text-sm font-medium mt-10 text-center">Start a task to see agent steps here.</div>
          )}
          {agentSteps.map((step) => (
            <AgentStepBlock key={step.id} step={step} />
          ))}
        </div>
      </div>

      {/* Left side: Chat */}
      <div className="min-h-[450px] flex-1 md:min-h-0 md:flex-initial w-full md:w-[40%] flex flex-col rounded-[32px] bg-white border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden relative">
        {/* Header */}
        <header className="h-[60px] md:h-[72px] flex items-center px-4 md:px-8 justify-between shrink-0 border-b border-black/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center border border-black/5">
              <Bot className="text-zinc-600" size={14} />
            </div>
            <h2 className="font-semibold text-zinc-900 text-[15px]">Virtual Assistant</h2>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-8 space-y-6" ref={scrollRef}>
          {history.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-6">
              <div className="w-16 h-16 bg-white shadow-sm border border-black/5 rounded-full flex items-center justify-center">
                <Bot size={32} className="text-zinc-300" />
              </div>
              <p className="font-medium text-zinc-500">Bagaimana saya boleh bantu operasi Abang Colek hari ini?</p>
              <div className="flex flex-wrap justify-center gap-2 w-full max-w-2xl">
                <button onClick={() => onSendMessage("Siasat aduan pembungkusan botol kuah colek bocor (LEAKAGE) dan draf emel gantian di Gmail")} className="px-3.5 py-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-all border border-black/5 text-red-700 font-medium text-[12px] flex items-center gap-1.5 shadow-xs">
                  <Mail size={13} className="text-red-600" />
                  Aduan Botol Bocor (Gmail)
                </button>
                <button onClick={() => onSendMessage("Jadualkan sesi taklimat stokis Terengganu & selatan dalam Google Calendar")} className="px-3.5 py-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-all border border-black/5 text-amber-700 font-medium text-[12px] flex items-center gap-1.5 shadow-xs">
                  <Calendar size={13} className="text-amber-600" />
                  Jadual Mesyuarat Stokis
                </button>
                <button onClick={() => onSendMessage("Eksport rekod jualan kuah colek dan botol pakej ejen ke Google Sheets")} className="px-3.5 py-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-all border border-black/5 text-emerald-700 font-medium text-[12px] flex items-center gap-1.5 shadow-xs">
                  <FileSpreadsheet size={13} className="text-emerald-600" />
                  Eksport Stokis (Sheets)
                </button>
                <button onClick={() => onSendMessage("Cipta tugasan pemeriksaan QC penutup botol kuah colek pembekal di Google Tasks")} className="px-3.5 py-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-all border border-black/5 text-blue-700 font-medium text-[12px] flex items-center gap-1.5 shadow-xs">
                  <CheckSquare size={13} className="text-blue-600" />
                  Tugasan QC Botol (Tasks)
                </button>
                <button onClick={() => onSendMessage("Cipta SOP kawalan kualiti kuah colek & pembungkusan di Google Docs")} className="px-3.5 py-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-all border border-black/5 text-indigo-700 font-medium text-[12px] flex items-center gap-1.5 shadow-xs">
                  <FileText size={13} className="text-indigo-600" />
                  SOP Kuah Colek (Docs)
                </button>
                <button onClick={() => onSendMessage("Bina borang Google Forms untuk pendaftaran ejen & stokis baharu Abang Colek")} className="px-3.5 py-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-all border border-black/5 text-purple-700 font-medium text-[12px] flex items-center gap-1.5 shadow-xs">
                  <FolderOpen size={13} className="text-purple-600" />
                  Borang Ejen (Forms)
                </button>
                <button onClick={() => onSendMessage("Buka bilik Google Meet untuk krew festival jualan pop-up Johor Bahru")} className="px-3.5 py-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-all border border-black/5 text-teal-700 font-medium text-[12px] flex items-center gap-1.5 shadow-xs">
                  <Video size={13} className="text-teal-600" />
                  Bilik Krew Pop-Up (Meet)
                </button>
                <button onClick={() => onSendMessage("Cari tiket penerbangan murah ke Tokyo Jepun minggu depan di Skyscanner")} className="px-3.5 py-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-all border border-black/5 text-teal-700 font-medium text-[12px] flex items-center gap-1.5 shadow-xs">
                  <Zap size={13} className="text-teal-600" />
                  Tiket Jepun (Skyscanner)
                </button>
                <button onClick={() => onSendMessage("Reka poster promosi gerai pop-up Abang Colek di Canva saiz Instagram 1:1")} className="px-3.5 py-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-all border border-black/5 text-cyan-700 font-medium text-[12px] flex items-center gap-1.5 shadow-xs">
                  <Zap size={13} className="text-cyan-600" />
                  Reka Poster (Canva)
                </button>
                <button onClick={() => onSendMessage("Semak Pull Request terbaru di repositori GitHub Abang Colek")} className="px-3.5 py-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-all border border-black/5 text-zinc-900 font-medium text-[12px] flex items-center gap-1.5 shadow-xs">
                  <Zap size={13} className="text-zinc-900" />
                  Semak Kod PR (GitHub)
                </button>
                <button onClick={() => onSendMessage("Cari hotel berhampiran Toppen Shopping Centre Johor Bahru untuk krew di Booking.com")} className="px-3.5 py-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-all border border-black/5 text-blue-800 font-medium text-[12px] flex items-center gap-1.5 shadow-xs">
                  <Zap size={13} className="text-blue-800" />
                  Hotel Krew JB (Booking)
                </button>
                <button onClick={() => onSendMessage("Semak data latihan COROS dan stamina kecergasan krew hari ini")} className="px-3.5 py-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-all border border-black/5 text-orange-700 font-medium text-[12px] flex items-center gap-1.5 shadow-xs">
                  <Zap size={13} className="text-orange-600" />
                  Data Latihan (COROS)
                </button>
              </div>
            </div>
          )}

          {history.map((msg, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={idx} 
              className={cn(
                "flex gap-4 max-w-full",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto mb-1",
                msg.role === 'user' ? "bg-black text-white" : "bg-white border border-black/5 text-zinc-900 shadow-sm"
              )}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              
              <div className={cn(
                "rounded-3xl text-[14px] leading-relaxed max-w-[85%] font-medium",
                msg.role === 'user' 
                  ? "p-5 bg-black text-white rounded-br-[8px]" 
                  : (msg.hasReport || msg.hasDashboard || msg.hasForm || msg.hasEmail || msg.hasTask || msg.hasDoc || msg.hasCalendar || msg.hasSheet || msg.hasMeet || msg.hasChat || msg.hasPlugin)
                    ? "p-0" 
                    : "p-5 bg-white rounded-bl-[8px] text-zinc-800 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
              )}>
                {msg.role === 'model' && (msg.hasReport || msg.hasDashboard || msg.hasForm || msg.hasEmail || msg.hasTask || msg.hasDoc || msg.hasCalendar || msg.hasSheet || msg.hasMeet || msg.hasChat || msg.hasPlugin) ? (
                  <div className="flex flex-col gap-3 min-w-[220px]">
                    <div className="p-4 bg-white border border-black/5 rounded-3xl rounded-bl-[8px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-2.5">
                      <span className="font-semibold text-[14px] text-zinc-900 flex items-center gap-2">
                        {msg.hasPlugin ? (
                          <>
                            <Zap size={16} className="text-amber-500 fill-amber-500" />
                            Tindakan Plugin 3P Selesai
                          </>
                        ) : msg.hasEmail ? (
                          <>
                            <Mail size={16} className="text-red-600" />
                            Email Delivered via Gmail
                          </>
                        ) : msg.hasCalendar ? (
                          <>
                            <Calendar size={16} className="text-amber-600" />
                            Event Scheduled in Google Calendar
                          </>
                        ) : msg.hasSheet ? (
                          <>
                            <FileSpreadsheet size={16} className="text-emerald-600" />
                            Spreadsheet Created in Google Sheets
                          </>
                        ) : msg.hasTask ? (
                          <>
                            <CheckSquare size={16} className="text-blue-600" />
                            Task Added to Google Tasks
                          </>
                        ) : msg.hasDoc ? (
                          <>
                            <FileText size={16} className="text-indigo-600" />
                            Document Created in Google Docs
                          </>
                        ) : msg.hasForm ? (
                          <>
                            <FolderOpen size={16} className="text-purple-600" />
                            Google Form Created & Published
                          </>
                        ) : msg.hasMeet ? (
                          <>
                            <Video size={16} className="text-teal-600" />
                            Google Meet Room Created
                          </>
                        ) : msg.hasChat ? (
                          <>
                            <MessageSquare size={16} className="text-blue-600" />
                            Message Sent to Google Chat
                          </>
                        ) : msg.hasReport && msg.hasDashboard ? (
                          'Report & Dashboard ready'
                        ) : msg.hasReport ? (
                          'Report now ready'
                        ) : (
                          'Dashboard now ready'
                        )}
                      </span>
                      {msg.formData?.info?.title && (
                        <p className="text-xs text-zinc-600 font-medium">
                          "{msg.formData.info.title}"
                        </p>
                      )}
                      {msg.docData?.title && (
                        <p className="text-xs text-zinc-600 font-medium">
                          "{msg.docData.title}"
                        </p>
                      )}
                      {msg.taskData?.title && (
                        <p className="text-xs text-zinc-600 font-medium">
                          "{msg.taskData.title}"
                        </p>
                      )}
                      {msg.hasPlugin && msg.pluginData && (
                        <PluginArtifactCard pluginType={msg.pluginType || ''} data={msg.pluginData} onOpenStore={() => setActiveTab('plugins')} />
                      )}
                      {msg.latencyMs && (
                        <div className="text-emerald-600 flex items-center gap-1.5 text-[11px] font-medium">
                          <Activity size={12} className="text-emerald-500" /> Latency {(msg.latencyMs / 1000).toFixed(2)}s
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {msg.hasEmail && (
                        <button 
                          onClick={() => setActiveTab('gmail')}
                          className="bg-red-600 text-white px-5 py-2.5 rounded-full font-semibold w-max hover:bg-red-700 transition-colors text-[13px] shadow-sm flex items-center gap-2"
                        >
                          <Mail size={14} />
                          Open in Gmail &rarr;
                        </button>
                      )}
                      {msg.hasCalendar && (
                        <button 
                          onClick={() => setActiveTab('calendar')}
                          className="bg-amber-600 text-white px-5 py-2.5 rounded-full font-semibold w-max hover:bg-amber-700 transition-colors text-[13px] shadow-sm flex items-center gap-2"
                        >
                          <Calendar size={14} />
                          Open in Calendar &rarr;
                        </button>
                      )}
                      {msg.hasSheet && (
                        <button 
                          onClick={() => setActiveTab('sheets')}
                          className="bg-emerald-600 text-white px-5 py-2.5 rounded-full font-semibold w-max hover:bg-emerald-700 transition-colors text-[13px] shadow-sm flex items-center gap-2"
                        >
                          <FileSpreadsheet size={14} />
                          Open in Sheets &rarr;
                        </button>
                      )}
                      {msg.hasTask && (
                        <button 
                          onClick={() => setActiveTab('tasks')}
                          className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-semibold w-max hover:bg-blue-700 transition-colors text-[13px] shadow-sm flex items-center gap-2"
                        >
                          <CheckSquare size={14} />
                          View in Google Tasks &rarr;
                        </button>
                      )}
                      {msg.hasDoc && (
                        <button 
                          onClick={() => setActiveTab('docs')}
                          className="bg-indigo-600 text-white px-5 py-2.5 rounded-full font-semibold w-max hover:bg-indigo-700 transition-colors text-[13px] shadow-sm flex items-center gap-2"
                        >
                          <FileText size={14} />
                          Open in Google Docs &rarr;
                        </button>
                      )}
                      {msg.hasForm && (
                        <button 
                          onClick={() => setActiveTab('forms')}
                          className="bg-purple-600 text-white px-5 py-2.5 rounded-full font-semibold w-max hover:bg-purple-700 transition-colors text-[13px] shadow-sm flex items-center gap-2"
                        >
                          <FolderOpen size={14} />
                          View in Google Forms Tab &rarr;
                        </button>
                      )}
                      {msg.hasMeet && (
                        <button 
                          onClick={() => setActiveTab('meet')}
                          className="bg-teal-600 text-white px-5 py-2.5 rounded-full font-semibold w-max hover:bg-teal-700 transition-colors text-[13px] shadow-sm flex items-center gap-2"
                        >
                          <Video size={14} />
                          Open Google Meet &rarr;
                        </button>
                      )}
                      {msg.hasChat && (
                        <button 
                          onClick={() => setActiveTab('chat_workspace')}
                          className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-semibold w-max hover:bg-blue-700 transition-colors text-[13px] shadow-sm flex items-center gap-2"
                        >
                          <MessageSquare size={14} />
                          Open Google Chat &rarr;
                        </button>
                      )}
                      {msg.hasReport && (
                        <button 
                          onClick={() => setActiveTab('reports')}
                          className="bg-black text-white px-6 py-3 rounded-full font-medium w-max hover:bg-zinc-800 transition-colors text-[13px] shadow-sm flex items-center gap-2"
                        >
                          go to reports &rarr;
                        </button>
                      )}
                      {msg.hasDashboard && (
                        <button 
                          onClick={() => setActiveTab('dashboards')}
                          className="bg-black text-white px-6 py-3 rounded-full font-medium w-max hover:bg-zinc-800 transition-colors text-[13px] shadow-sm flex items-center gap-2"
                        >
                          go to dashboards &rarr;
                        </button>
                      )}
                      {msg.hasJev && (
                        <button 
                          onClick={() => setActiveTab('discovery')}
                          className="bg-red-600 text-white px-5 py-2.5 rounded-full font-semibold w-max hover:bg-red-700 transition-colors text-[13px] shadow-sm flex items-center gap-2"
                        >
                          <Flame size={14} />
                          Buka Hab JEV Abang Colek &rarr;
                        </button>
                      )}
                      {msg.hasPlugin && (
                        <button 
                          onClick={() => setActiveTab('plugins')}
                          className="bg-black text-white px-5 py-2.5 rounded-full font-semibold w-max hover:bg-zinc-800 transition-colors text-[13px] shadow-sm flex items-center gap-2"
                        >
                          <Zap size={14} className="text-amber-400" />
                          Buka Gedung Plugins &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={cn("markdown-body", msg.role === 'user' ? "text-white" : "text-zinc-800")}>
                      <ReactMarkdown>{msg.parts?.map((p: any) => p.text || "").join("") || ""}</ReactMarkdown>
                    </div>

                    {msg.hasPlugin && msg.pluginData && (
                      <PluginArtifactCard pluginType={msg.pluginType || ''} data={msg.pluginData} onOpenStore={() => setActiveTab('plugins')} />
                    )}

                    {msg.role === 'model' && msg.latencyMs !== undefined && (
                      <div className="mt-4 pt-4 border-t border-black/[0.04] flex items-center justify-end text-emerald-600 text-[11px]">
                        <span className="font-mono bg-emerald-50/50 text-emerald-600 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                          <CheckCircle2 size={12} />
                          {(msg.latencyMs / 1000).toFixed(2)}s
                        </span>
                      </div>
                    )}
                  </>
                )}
                
                {/* Grounding Sources */}
                {msg.groundingMetadata?.groundingChunks && (
                  <div className="mt-4 pt-4 border-t border-black/[0.04]">
                    <p className="text-[10px] font-semibold text-zinc-400 mb-2.5 flex items-center gap-1.5 uppercase tracking-wider">
                      <Search size={12} /> Sources
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.groundingMetadata.groundingChunks.map((chunk: any, i: number) => (
                        <a 
                          key={i} 
                          href={chunk.web?.uri} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[11px] px-3 py-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-full text-zinc-500 border border-black/5 transition-colors"
                        >
                          {chunk.web?.title || new URL(chunk.web?.uri).hostname}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {isProcessing && streamingText && !isGeneratingWidget && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 max-w-full"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto mb-1 bg-white border border-black/5 text-zinc-900 shadow-sm">
                <Bot size={14} />
              </div>
              <div className="p-5 rounded-3xl text-[14px] leading-relaxed max-w-[85%] font-medium bg-white rounded-bl-[8px] border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)] text-zinc-800 opacity-70">
                <div className="markdown-body text-zinc-800">
                  <ReactMarkdown>{streamingText}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          )}

          {isProcessing && !streamingText && !isGeneratingWidget && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-white border border-black/5 text-zinc-900 shadow-sm flex items-center justify-center mt-auto mb-1">
                <Bot size={14} />
              </div>
              <div className="bg-white px-5 py-4 rounded-3xl rounded-bl-[8px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-black/[0.04] flex items-center gap-2">
                <div className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {isProcessing && isGeneratingWidget && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 max-w-full"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto mb-1 bg-white border border-black/5 text-zinc-900 shadow-sm">
                <Bot size={14} />
              </div>
              <div className="flex flex-col gap-3 min-w-[200px]">
                <div className="p-4 bg-white border border-black/5 rounded-3xl rounded-bl-[8px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-3">
                  <span className="font-medium text-[14px] text-zinc-800">
                    {isGeneratingReport && isGeneratingDashboard ? 'Finalizing Report & Dashboard...' : isGeneratingReport ? 'Report now ready' : 'Dashboard now ready'}
                  </span>
                  <div className="text-zinc-400 flex items-center gap-1.5 text-[11px] font-medium">
                    <Loader2 size={12} className="animate-spin" /> Finalizing...
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {isGeneratingReport && (
                    <button 
                      disabled
                      className="bg-black/50 text-white px-6 py-3 rounded-full font-medium w-max text-[13px] shadow-sm flex items-center gap-2 cursor-not-allowed"
                    >
                      go to reports &rarr;
                    </button>
                  )}
                  {isGeneratingDashboard && (
                    <button 
                      disabled
                      className="bg-black/50 text-white px-6 py-3 rounded-full font-medium w-max text-[13px] shadow-sm flex items-center gap-2 cursor-not-allowed"
                    >
                      go to dashboards &rarr;
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 shrink-0 bg-white">
          {/* Active Plugins Bar */}
          <div className="mb-2.5 px-2 flex items-center justify-between text-[11px] text-zinc-500">
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Zap size={11} className="text-amber-500 fill-amber-500" />
                Plugins Aktif:
              </span>
              {['Skyscanner', 'Booking.com', 'Canva', 'GitHub', 'Vercel', 'Supabase', 'COROS'].map((name, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-medium shrink-0 text-[10px]">
                  {name}
                </span>
              ))}
            </div>
            <button 
              onClick={() => setActiveTab('plugins')}
              className="text-[11px] font-bold text-black hover:underline shrink-0 ml-2 cursor-pointer flex items-center gap-1"
            >
              <span>+ Gedung Plugin</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="relative flex items-center bg-zinc-50 rounded-full border border-black/5 p-2 focus-within:ring-2 focus-within:ring-black/5 focus-within:border-black/10 transition-all">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya apa sahaja atau aktifkan plugin (cth: cari tiket ke Tokyo, reka poster di Canva, semak PR di GitHub)..."
              disabled={isProcessing}
              className="flex-1 bg-transparent px-5 py-2 outline-none placeholder:text-zinc-400 text-zinc-900 text-[14px] font-medium"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-50 transition-colors ml-2 hover:bg-zinc-800 cursor-pointer"
            >
              {isProcessing ? <Loader2 size={16} className="animate-spin text-white" /> : <Send size={16} className="text-white relative right-0.5 top-0.5" strokeWidth={2} />}
            </button>
          </form>

          {history.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4 w-full">
              <button onClick={() => onSendMessage("Siasat aduan penutup botol kuah colek bocor (LEAKAGE) di Terengganu menggunakan JEV System-1.")} className="px-4 py-2 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-all border border-black/5 text-red-600 font-medium text-[12px] cursor-pointer">
                Siasat Aduan Botol Bocor (JEV)
              </button>
              <button onClick={() => onSendMessage("Cari tiket penerbangan murah ke Tokyo Jepun minggu depan di Skyscanner.")} className="px-4 py-2 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-all border border-black/5 text-teal-700 font-medium text-[12px] cursor-pointer">
                Tiket Tokyo (Skyscanner)
              </button>
              <button onClick={() => onSendMessage("Reka poster promosi kombo kuah colek di Canva saiz Instagram 1:1.")} className="px-4 py-2 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-all border border-black/5 text-cyan-700 font-medium text-[12px] cursor-pointer">
                Reka Poster (Canva)
              </button>
              <button onClick={() => onSendMessage("Semak Pull Request dan Issues terkini di GitHub.")} className="px-4 py-2 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-all border border-black/5 text-zinc-800 font-medium text-[12px] cursor-pointer">
                Semak PR (GitHub)
              </button>
              <button onClick={() => onSendMessage("Semak data latihan COROS dan stamina kecergasan krew gerai hari ini.")} className="px-4 py-2 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-all border border-black/5 text-orange-700 font-medium text-[12px] cursor-pointer">
                Stamina Krew (COROS)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ReviewsView = ({ onAction }: { onAction: (msg?: string) => void }) => {
  return (
  <div className="p-4 md:p-8 h-full overflow-y-auto">
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-8 pl-2">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Maklum Balas & Ulasan Pelanggan</h2>
          <p className="text-zinc-500 mt-1 text-[15px] font-medium">Pantau ulasan kuah colek, aduan kebocoran penutup botol, dan klasifikasi JEV System-1.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {MOCK_DB.reviews?.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-black/[0.04]">
            <p className="text-zinc-400 font-medium">No reviews found.</p>
          </div>
        ) : (
          MOCK_DB.reviews?.map((review, i) => {
            const order = appStore.getOrders().find(o => o.order_id === review.order_id);
            const customerName = order?.customer_id || `Pelanggan #${review.order_id}`;
            const reviewText = review.comment_message;
            const reviewDate = review.creation_date;

            return (
              <div key={review.review_id || i} className="bg-white p-6 rounded-3xl border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex justify-between items-start transition-all hover:border-black/10">
                <div className="flex gap-5 max-w-[80%]">
                  <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center border border-black/5 shrink-0 mt-1">
                    <User className="text-zinc-400" size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[17px] text-zinc-900">{customerName}</span>
                      <span className="text-[12px] text-zinc-400">•</span>
                      <span className="text-[13px] text-zinc-500 font-medium">{new Date(reviewDate).toLocaleDateString()}</span>
                      {review.issue_class && (
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                          review.issue_class === 'PRAISE' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        )}>
                          {review.issue_class}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Sparkles key={star} size={14} className={star <= review.score ? "text-yellow-400 fill-yellow-400" : "text-zinc-200"} />
                      ))}
                    </div>
                    <p className="text-zinc-700 text-[15px] leading-relaxed mb-3">"{reviewText}"</p>
                    <div className="flex gap-4 text-[12px] font-medium">
                      <span className="flex items-center gap-1.5 text-zinc-500 bg-zinc-50 px-3 py-1 rounded-full border border-black/5">Order: <strong className="text-zinc-800">{review.order_id}</strong></span>
                      <span className="flex items-center gap-1.5 text-zinc-500 bg-zinc-50 px-3 py-1 rounded-full border border-black/5">Category: <strong className="text-zinc-800 capitalize">{review.product_category}</strong></span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button 
                    onClick={() => onAction(`Nilaikan maklum balas pelanggan ini menggunakan JEV System-1: "${reviewText}" dan tentukan tindakan operasi.`)} 
                    className="px-4 py-2 text-[12px] font-semibold rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Flame size={13} />
                    <span>JEV Triage</span>
                  </button>
                  <button 
                    onClick={() => onAction(`Draf respons pelanggan di Gmail untuk ulasan ${review.review_id} bagi pesanan ${review.order_id}.`)} 
                    className="px-4 py-1.5 text-[11px] font-medium rounded-full bg-white border border-black/10 text-zinc-600 hover:text-black hover:border-black/20 transition-colors"
                  >
                    Draf Emel
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  </div>
  );
};

const ReportsView = ({ onAction }: { onAction: (msg?: string) => void }) => {
  const handleGenerateReport = () => {
    onAction("Jana laporan tahunan terperinci prestasi jualan Kuah Colek Buah Abang Colek bagi tahun 2026.");
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-end mb-8 pl-2">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Laporan Analisis Perniagaan</h2>
            <p className="text-zinc-500 mt-1 text-[15px] font-medium">Laporan eksekutif operasi yang dijana secara automatik.</p>
          </div>
          <button onClick={handleGenerateReport} className="px-5 py-2.5 bg-black text-white rounded-full text-[13px] font-medium hover:bg-zinc-800 transition-colors cursor-pointer">
            + Jana Laporan AI
          </button>
        </div>

        <div className="grid gap-6">
          {MOCK_DB.reports.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-black/[0.04]">
              <p className="text-zinc-400 font-medium">Belum ada laporan dijana. Minta ejen menjana laporan prestasi.</p>
            </div>
          ) : (
            [...MOCK_DB.reports].reverse().map((report, i) => (
              <div key={i} className="bg-white rounded-[32px] border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden hover:border-black/10 transition-all">
                <div className="bg-zinc-50/50 px-10 py-6 border-b border-black/[0.04] flex justify-between items-center">
                  <h3 className="font-semibold text-[20px] text-zinc-900 tracking-tight">{report.title}</h3>
                  <span className="text-[12px] font-medium bg-white text-zinc-600 px-4 py-1.5 rounded-full border border-black/5">{report.year}</span>
                </div>
                <div className="p-10">
                  <h4 className="font-semibold text-zinc-900 mb-3 text-[15px]">Executive Summary</h4>
                  <p className="text-zinc-500 leading-relaxed mb-10 font-medium text-[14px]">{report.executive_summary}</p>
                  
                  {report.metrics && report.metrics.length > 0 && (
                    <div className="mb-12">
                      <h4 className="font-semibold text-zinc-900 mb-5 text-[15px]">Key Performance Metrics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {report.metrics.filter((m: any) => m.value !== 'N/A' && m.value !== 'n/a').map((m: any, idx: number) => (
                          <div key={idx} className="p-6 bg-zinc-50/50 border border-black/[0.04] rounded-3xl">
                            <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider block mb-2">{m.label}</span>
                            <div className="flex items-end gap-3">
                              <span className="text-[28px] font-semibold text-zinc-900 tracking-tight leading-none">
                                {m.label.toLowerCase().includes('revenue') || m.label.toLowerCase().includes('value') || m.label.toLowerCase().includes('price') || m.label.toLowerCase().includes('cost') || m.label.toLowerCase().includes('amount') ? 'RM ' : ''}
                                {m.value?.toLocaleString() || 0}
                              </span>
                              {m.trend && m.trend !== 'N/A' && m.trend !== 'n/a' && (
                                <span className={cn(
                                  "text-[13px] font-semibold mb-1",
                                  m.trend.startsWith('+') ? "text-emerald-500" : m.trend.startsWith('-') ? "text-red-500" : "text-zinc-400"
                                )}>
                                  {m.trend}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {report.detailed_analysis && (
                    <div className="mb-12 border-t border-black/[0.04] pt-10">
                      <h4 className="font-semibold text-zinc-900 mb-5 text-[15px]">Detailed Analysis</h4>
                      <div className="markdown-body text-zinc-500 text-[14px] leading-relaxed font-medium">
                        <ReactMarkdown>{report.detailed_analysis}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-black/[0.04] pt-10">
                    <div>
                      <h4 className="font-semibold text-zinc-900 mb-5 text-[15px]">Key Insights</h4>
                      <div className="grid gap-4">
                        {report.key_insights?.map((insight: string, idx: number) => (
                          <div key={idx} className="bg-zinc-50/50 p-5 rounded-[24px] flex items-start gap-4 border border-black/[0.02]">
                            <div className="w-6 h-6 rounded-full bg-white border border-black/5 flex items-center justify-center shrink-0">
                              <CheckCircle2 size={12} className="text-zinc-400" />
                            </div>
                            <span className="text-zinc-600 font-medium leading-relaxed text-[13.5px]">{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {report.recommendations && (
                      <div>
                        <h4 className="font-semibold text-zinc-900 mb-5 text-[15px]">Strategic Recommendations</h4>
                        <div className="grid gap-4">
                          {report.recommendations?.map((rec: string, idx: number) => (
                            <div key={idx} className="bg-zinc-900 text-white p-5 rounded-[24px] flex items-start gap-4">
                              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                <Sparkles size={12} className="text-white/80" />
                              </div>
                              <span className="text-zinc-200 font-medium leading-relaxed text-[13.5px]">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardsView = ({ 
  onAction,
  setActiveTab 
}: { 
  onAction: (msg?: string) => void;
  setActiveTab?: (tab: string) => void;
}) => {
  const handleGenerateDashboard = () => {
    onAction("Bina dashboard analitik visual operasi Abang Colek merangkumi prestasi jualan hab utama (Johor Bahru, Shah Alam, Terengganu, Bangi), taburan isu botol bocor, dan KPI krew pop-up.");
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-end mb-8 pl-2">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Papan Pemuka Analitik Operasi</h2>
            <p className="text-zinc-500 mt-1 text-[15px] font-medium">Metrik visual jualan hab, pecahan produk, dan status kualiti botol.</p>
          </div>
          <button onClick={handleGenerateDashboard} className="px-5 py-2.5 bg-black text-white rounded-full text-[13px] font-medium hover:bg-zinc-800 transition-colors cursor-pointer">
            + Bina Dashboard AI
          </button>
        </div>

        {/* Real-time Agent Insight Card (Supabase Telemetry) */}
        <div className="mb-6">
          <AgentInsightCard 
            onAction={onAction}
            onViewFullPerformance={() => setActiveTab && setActiveTab('agent_performance')}
          />
        </div>

        <div className="grid gap-6">
          {MOCK_DB.dashboards.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-black/[0.04]">
              <p className="text-zinc-400 font-medium">No dashboards created yet. Ask the agent to create a dashboard for sales metrics.</p>
            </div>
          ) : (
            [...MOCK_DB.dashboards].reverse().map((dashboard, i) => {
              const mainChartMax = Math.max(...(dashboard.main_chart?.data || []).map((m: any) => m.value || 0));
              const secondaryChartMax = Math.max(...(dashboard.secondary_chart?.data || []).map((m: any) => m.value || 0));

              return (
                <div key={i} className="flex flex-col gap-6 mb-12">
                  <h3 className="font-semibold text-2xl text-zinc-900 tracking-tight pl-2">{dashboard.title}</h3>
                  
                  {/* KPIs Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {dashboard.kpis?.filter((kpi: any) => kpi.value !== 'N/A' && kpi.value !== 'n/a').map((kpi: any, idx: number) => (
                      <div key={idx} className="bg-white p-6 rounded-3xl border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-black/10 transition-all">
                        <span className="text-[12px] text-zinc-400 font-medium uppercase tracking-wider mb-2">{kpi.label}</span>
                        <div className="flex items-end justify-between">
                          <span className="text-2xl font-bold text-zinc-900 tracking-tight leading-none">{kpi.value}</span>
                          {kpi.trend && kpi.trend !== 'N/A' && kpi.trend !== 'n/a' && (
                            <span className={cn(
                              "text-[12px] font-semibold",
                              kpi.trend.startsWith('+') ? "text-emerald-500" : kpi.trend.startsWith('-') ? "text-red-500" : "text-zinc-400"
                            )}>
                              {kpi.trend}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col">
                      <h4 className="font-semibold text-[17px] text-zinc-900 tracking-tight mb-1">{dashboard.main_chart?.title}</h4>
                      <p className="text-[10px] text-zinc-400 font-medium mb-8 uppercase tracking-wider">{dashboard.main_chart?.type} Chart</p>
                      
                      <div className="flex-1 flex flex-col justify-start gap-5">
                        {dashboard.main_chart?.data?.map((metric: any, idx: number) => {
                          const heightPercent = mainChartMax > 0 ? (metric.value / mainChartMax) * 100 : 0;
                          return (
                            <div key={idx} className="flex items-center gap-5">
                              <div className="w-24 text-[13px] font-medium text-zinc-500 truncate text-right">{metric.label}</div>
                              <div className="flex-1 h-9 bg-zinc-50/80 rounded-full flex items-center border border-black/5 p-1.5 relative overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.max(heightPercent, 5)}%` }}
                                  className="h-full bg-black rounded-full shadow-sm absolute left-1.5"
                                />
                                <span className={cn("text-[12px] font-semibold tracking-tight absolute z-10", heightPercent > 15 ? "text-white left-4" : "text-zinc-700 left-8")} style={{ left: heightPercent > 15 ? 16 : `calc(${Math.max(heightPercent, 5)}% + 14px)` }}>
                                  {metric.value.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-6">
                      {/* Secondary Chart */}
                      <div className="bg-white p-8 rounded-[32px] border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex-1">
                        <h4 className="font-semibold text-[15px] text-zinc-900 tracking-tight mb-1">{dashboard.secondary_chart?.title}</h4>
                        <p className="text-[10px] text-zinc-400 font-medium mb-6 uppercase tracking-wider">{dashboard.secondary_chart?.type} Chart</p>
                        
                        <div className="flex flex-col gap-4">
                          {dashboard.secondary_chart?.data?.map((metric: any, idx: number) => {
                            const pct = secondaryChartMax > 0 ? (metric.value / secondaryChartMax) * 100 : 0;
                            return (
                              <div key={idx} className="flex flex-col gap-1.5">
                                <div className="flex justify-between text-[12px] font-medium">
                                  <span className="text-zinc-600 truncate mr-2">{metric.label}</span>
                                  <span className="text-zinc-900 font-semibold">{metric.value.toLocaleString()}</span>
                                </div>
                                <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    className="h-full bg-black rounded-full"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div className="bg-white p-8 rounded-[32px] border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex-1">
                        <h4 className="font-semibold text-[15px] text-zinc-900 tracking-tight mb-6">Quick Insights</h4>
                        <div className="flex flex-col gap-4">
                          {dashboard.recent_activity?.map((activity: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className="w-5 h-5 rounded-full bg-zinc-50 border border-black/5 flex items-center justify-center shrink-0 mt-0.5">
                                <Activity size={10} className="text-zinc-400" />
                              </div>
                              <p className="text-[13px] text-zinc-600 leading-relaxed font-medium">{activity.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const BottomNav = ({ 
  activeTab, 
  setActiveTab, 
  isToolOrPluginInProgress 
}: { 
  activeTab: string; 
  setActiveTab: (t: string) => void;
  isToolOrPluginInProgress?: boolean;
}) => {
  const menuItems = [
    { id: 'discovery', label: 'Discovery', icon: Flame },
    { id: 'chat', label: 'Chat', icon: Bot },
    { id: 'agent_performance', label: 'Prestasi', icon: Gauge },
    { id: 'bus_freight', label: 'Bas & Ejen', icon: Truck },
    { id: 'plugins', label: 'Plugins', icon: Zap },
    { id: 'gmail', label: 'Gmail', icon: Mail },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'sheets', label: 'Sheets', icon: FileSpreadsheet },
    { id: 'forms', label: 'Forms', icon: FolderOpen },
    { id: 'maps', label: 'Map', icon: MapPin },
    { id: 'dashboards', label: 'Stats', icon: Activity },
  ];

  return (
    <div className="md:hidden flex items-center justify-around bg-white border-t border-black/5 px-2 py-2.5 shrink-0 pb-safe overflow-x-auto">
      {menuItems.map((item) => {
        const isChat = item.id === 'chat';
        const isExecuting = isChat && isToolOrPluginInProgress;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl transition-all shrink-0",
              activeTab === item.id 
                ? "text-black font-semibold" 
                : "text-zinc-400 hover:text-zinc-600",
              isExecuting && activeTab !== item.id && "text-amber-600 font-medium"
            )}
          >
            {isExecuting ? (
              <div className="relative flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="flex items-center justify-center"
                >
                  <item.icon 
                    size={18} 
                    strokeWidth={activeTab === item.id ? 2.5 : 2} 
                    className="text-amber-500" 
                  />
                </motion.div>
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 pointer-events-none">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              </div>
            ) : (
              <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            )}
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('discovery');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTool, setCurrentTool] = useState<ToolCall | null>(null);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isToolExecuting, setIsToolExecuting] = useState(false);

  useEffect(() => {
    return subscribeToolExecution((executing) => {
      setIsToolExecuting(executing);
    });
  }, []);

  const isToolOrPluginInProgress = Boolean(
    isToolExecuting ||
    (isProcessing && (
      Boolean(currentTool) ||
      agentSteps.some(s => s.type === 'tool' && s.status === 'streaming')
    ))
  );

  const handleSendMessage = async (msg: string) => {
    setIsProcessing(true);
    setStreamingText("");
    setAgentSteps([]);
    setCurrentTool(null);
    try {
      await sendMessageToAgentStream(history, msg, (data) => {
        if (data.isDone) {
          setHistory(data.history);
          setIsProcessing(false);
          setStreamingText("");
          setCurrentTool(null);
          setAgentSteps(data.steps);
        } else {
          setHistory(data.history);
          setAgentSteps(data.steps);
          setStreamingText(data.currentText);
          const activeToolStep = data.steps.find(s => s.type === 'tool' && s.status === 'streaming');
          if (activeToolStep) {
            setCurrentTool({
              id: activeToolStep.id,
              name: activeToolStep.toolName || '',
              args: activeToolStep.toolArgs || {}
            });
          } else {
            setCurrentTool(null);
          }
        }
      });
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
      setCurrentTool(null);
    }
  };

  const handleAction = (msg?: string) => {
    setActiveTab('chat');
    if (msg) {
      handleSendMessage(msg);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen font-sans text-zinc-900 bg-[#F3F3F3] overflow-hidden selection:bg-black selection:text-white">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isToolOrPluginInProgress={isToolOrPluginInProgress} 
      />
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center px-6 pt-6 pb-2 shrink-0">
        <button onClick={() => window.location.reload()} className="text-2xl font-bold text-black tracking-tight text-left hover:opacity-70 transition-opacity flex items-center gap-2">
          <Flame size={24} className="text-red-600 fill-red-600" />
          <span>ABANGCOLEK-OS</span>
        </button>
      </div>

      <main className="flex-1 flex flex-col overflow-hidden relative px-4 pb-4 pt-2 md:pt-6 md:pb-6 md:pr-6 md:pl-2">
        <div className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden relative">
          {activeTab === 'discovery' && <AbangColekDiscoveryView onAction={handleAction} />}
          {activeTab === 'chat' && (
            <ChatInterface 
              history={history} 
              onSendMessage={handleSendMessage} 
              isProcessing={isProcessing}
              currentTool={currentTool}
              agentSteps={agentSteps}
              streamingText={streamingText}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === 'bus_freight' && <BusFreightView onAction={handleAction} />}
          {activeTab === 'agent_performance' && <AgentPerformanceView onAction={handleAction} />}
          {activeTab === 'plugins' && <PluginsView onAction={handleAction} />}
          {activeTab === 'gmail' && <GmailView onAction={handleAction} />}
          {activeTab === 'calendar' && <CalendarView onAction={handleAction} />}
          {activeTab === 'tasks' && <TasksView onAction={handleAction} />}
          {activeTab === 'docs' && <DocsView onAction={handleAction} />}
          {activeTab === 'sheets' && <SheetsView onAction={handleAction} />}
          {activeTab === 'forms' && <FormsView onAction={handleAction} />}
          {activeTab === 'meet' && <MeetView onAction={handleAction} />}
          {activeTab === 'chat_workspace' && <ChatWorkspaceView onAction={handleAction} />}
          {activeTab === 'maps' && <MapsView onAction={handleAction} />}
          {activeTab === 'orders' && <OrdersView onAction={handleAction} />}
          {activeTab === 'reviews' && <ReviewsView onAction={handleAction} />}
          {activeTab === 'reports' && <ReportsView onAction={handleAction} />}
          {activeTab === 'dashboards' && <DashboardsView onAction={handleAction} setActiveTab={setActiveTab} />}
        </div>
        
        <div className="mt-4 px-4 text-[11px] text-zinc-400 text-center md:text-right shrink-0">
          Intelligence & Discovery via <a href="https://github.com/thisisabangcolek-web/Abang-Colek.git" target="_blank" className="underline hover:text-zinc-600 font-medium">ABANGCOLEK Discovery Engine (v4.2.0)</a>
        </div>
      </main>

      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isToolOrPluginInProgress={isToolOrPluginInProgress} 
      />
    </div>
  );
}
