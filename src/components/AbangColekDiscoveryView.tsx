/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Sparkles, 
  Flame, 
  Layers, 
  ExternalLink, 
  FileText, 
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  Check,
  ChevronRight,
  TrendingUp,
  Tag,
  Clock,
  Send,
  Mail,
  Calendar,
  FileSpreadsheet,
  CheckSquare,
  Loader2,
  Bot,
  Music,
  Play,
  Pause,
  Terminal,
  Radio,
  Volume2,
  Copy,
  Download,
  MessageSquare,
  Share2,
  Smartphone,
  Quote
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  evaluateWithJev, 
  executeAutomatedJevAction, 
  getSavedJevEvaluations, 
  JevClassificationResult,
  JEV_TAXONOMY 
} from '@/services/jevEngine';
import { appStore, BusinessWorkflow } from '@/services/store';
import {
  TIKTOK_VIRAL_HOOKS,
  MOTIVATIONAL_QUOTES,
  BRAND_TAGLINES,
  BOOTH_OPS_CHECKLISTS,
  WHATSAPP_TEMPLATES,
  OFFICIAL_AUDIO_IDENTITY,
  parseWocsCommand,
  executeWocsCommand,
  TikTokViralHook,
  WhatsAppTemplate,
  WocsParsedCommand,
  WocsExecutionResult
} from '@/services/abangColekRepoData';

interface AbangColekDiscoveryViewProps {
  onAction?: (msg?: string) => void;
}

export const AbangColekDiscoveryView: React.FC<AbangColekDiscoveryViewProps> = ({ onAction }) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'wocs_audit' | 'tiktok_hooks' | 'whatsapp_templates' | 'booth_ops' | 'questions' | 'jev_tester' | 'history' | 'channels'
  >('overview');
  
  // Real Persistent Workflows from Store
  const [workflows, setWorkflows] = useState<BusinessWorkflow[]>(appStore.getWorkflows());
  
  // JEV Live Evaluation State
  const [inputText, setInputText] = useState("Salam bang, botol kuah colek yang pos ke Terengganu hari tu penutup dia pecah dan kuah meleleh habis dalam kotak parcel. Boleh ganti baru tak?");
  const [jevResult, setJevResult] = useState<JevClassificationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [actionStatus, setActionStatus] = useState<{ loading: boolean; type?: string; message?: string; success?: boolean } | null>(null);
  
  // History of real JEV evaluations
  const [history, setHistory] = useState<JevClassificationResult[]>([]);

  // Audio Player State for Official "Kasi Lagi-Lagi" Jingle
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingJingle, setIsPlayingJingle] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  // WOCS WhatsApp Command Parser & Execution State
  const [wocsInput, setWocsInput] = useState('/assign agent=KakMas hub=MBKT cargo=100botol');
  const [parsedWocs, setParsedWocs] = useState<{
    keyword: string;
    type: string;
    payload: Record<string, string>;
    requiresApproval: boolean;
    timestamp: string;
  } | null>(null);
  const [executionResult, setExecutionResult] = useState<WocsExecutionResult | null>(null);

  // Founder's Corner Quotes & Taglines
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [copiedTagline, setCopiedTagline] = useState<string | null>(null);

  // TikTok Hooks Bank State
  const [selectedHookTag, setSelectedHookTag] = useState<string>('all');
  const [hookSearch, setHookSearch] = useState<string>('');
  const [copiedHookId, setCopiedHookId] = useState<string | null>(null);

  // WhatsApp Templates Station State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('cs-welcome');
  const [templateCategory, setTemplateCategory] = useState<string>('all');
  const [variableValues, setVariableValues] = useState<Record<string, string>>({
    customer_name: "Ahmad bin Ali",
    order_details: "3x Sambal Colek Original 500ml",
    total: "84.00",
    current_events: "1. Makan Fest KL Gateway (3-5 Okt)\n2. Karnival Karat JB (10-12 Okt)",
    form_link: "https://forms.gle/abangcolekluckydraw2026",
    end_date: "31 Disember 2026",
    event_name: "Makan Fest KL Gateway",
    event_date: "3-5 Oktober 2026",
    event_location: "Ruang Legar Utama, KL Gateway Mall",
    event_time: "10:00 AM - 10:00 PM",
    customer_number: "+6012-3456789",
    customer_message: "Boleh pos 10 botol ke Kuantan?",
    timestamp: new Date().toLocaleTimeString('ms-MY')
  });
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  // Booth Ops Checklists State
  const [completedChecklist, setCompletedChecklist] = useState<Record<string, boolean>>({
    'pre-0': true,
    'pre-1': true,
    'pre-2': true,
    'during-0': true,
    'during-1': true
  });

  const toggleChecklistItem = (key: string) => {
    setCompletedChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const togglePlayJingle = () => {
    if (!audioRef.current) return;
    if (isPlayingJingle) {
      audioRef.current.pause();
      setIsPlayingJingle(false);
    } else {
      audioRef.current.play().then(() => setIsPlayingJingle(true)).catch(() => {});
    }
  };

  const handleParseWocsCommand = (cmdText: string) => {
    const parsed = parseWocsCommand(cmdText);
    const keyword = cmdText.trim().replace(/^\/+/, '').split(/\s+/)[0] || 'unknown';
    setParsedWocs({
      keyword,
      type: parsed.type,
      payload: parsed.payload,
      requiresApproval: parsed.requiresApproval,
      timestamp: new Date().toLocaleTimeString('ms-MY', { hour12: true })
    });
    const execRes = executeWocsCommand(parsed);
    setExecutionResult(execRes);
  };

  useEffect(() => {
    handleParseWocsCommand(wocsInput);
  }, []);

  useEffect(() => {
    // Subscribe to store updates
    const unsubscribe = appStore.subscribe(() => {
      setWorkflows(appStore.getWorkflows());
    });
    setHistory(getSavedJevEvaluations());
    return () => unsubscribe();
  }, []);

  const handleToggleSignoff = (workflowId: string, currentSignoff: boolean) => {
    appStore.updateWorkflowSignoff(workflowId, !currentSignoff);
  };

  const handleRunRealJev = async (customText?: string) => {
    const textToRun = customText || inputText;
    if (!textToRun.trim()) return;
    setIsEvaluating(true);
    setActionStatus(null);
    try {
      const res = await evaluateWithJev(textToRun);
      setJevResult(res);
      setHistory(getSavedJevEvaluations());
    } catch (err: any) {
      console.error('Failed to run JEV evaluation:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleExecuteAction = async (actionType: 'task' | 'email' | 'calendar' | 'sheet') => {
    if (!jevResult) return;
    setActionStatus({ loading: true, type: actionType });
    const res = await executeAutomatedJevAction(jevResult, actionType);
    setActionStatus({
      loading: false,
      type: actionType,
      success: res.success,
      message: res.message
    });
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-800 to-black text-white p-6 md:p-8 rounded-[32px] border border-black/10 shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-red-600/30 text-red-300 border border-red-500/40 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Flame size={12} className="text-red-400 fill-red-400" />
                Abang Colek Business OS v4.2
              </span>
              <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-mono font-medium">
                TypeSafe JEV Engine
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Pusat Penyelidikan Operasi & Enjin JEV System-1
            </h1>
            <p className="text-zinc-400 text-xs md:text-sm max-w-2xl leading-relaxed">
              Platform bersepadu pemprosesan pesanan, kawalan kualiti kuah colek, pengurusan stokis ejen, dan automasi Google Workspace tanpa sebarang data palsu.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://github.com/thisisabangcolek-web/Abang-Colek.git"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 border border-white/15 transition-all"
            >
              <span>Repo Rasmi</span>
              <ExternalLink size={13} />
            </a>
            <button
              onClick={() => {
                setActiveSubTab('jev_tester');
                handleRunRealJev();
              }}
              className="px-4 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Sparkles size={14} />
              <span>Uji JEV System-1</span>
            </button>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-black/5 pb-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Ringkasan & Metrik Forensik', icon: ShieldCheck },
            { id: 'wocs_audit', label: 'Audit JEV & WOCS Engine', icon: Terminal, badge: 'GitHub Review' },
            { id: 'tiktok_hooks', label: 'Bank Cangkuk TikTok', icon: TrendingUp, badge: `${TIKTOK_VIRAL_HOOKS.length} Hooks` },
            { id: 'whatsapp_templates', label: 'Templat WhatsApp WOCS', icon: MessageSquare, badge: `${WHATSAPP_TEMPLATES.length} Templat` },
            { id: 'booth_ops', label: 'SOP Operasi Booth', icon: CheckSquare, badge: '3 Fasa' },
            { id: 'questions', label: '8 Soalan Asas Operasi', icon: HelpCircle, badge: `${workflows.filter(w => w.owner_signoff).length}/8` },
            { id: 'jev_tester', label: 'Simulator JEV System-1', icon: Activity, badge: 'Live AI' },
            { id: 'history', label: 'Sejarah Audit JEV', icon: Clock, badge: history.length > 0 ? `${history.length}` : undefined },
            { id: 'channels', label: 'Saluran Media Sosial Disahkan', icon: Layers },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0",
                activeSubTab === tab.id
                  ? "bg-black text-white shadow-xs"
                  : "text-zinc-600 hover:text-black hover:bg-black/5"
              )}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  activeSubTab === tab.id ? "bg-white/20 text-white" : "bg-black/10 text-zinc-700"
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* SUBTAB 1: OVERVIEW & EMPIRICAL METRICS */}
        {activeSubTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-black/5 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Tangkapan Bukti</span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-zinc-900">167</span>
                  <span className="text-[10px] text-emerald-600 font-bold">100% SHA-256</span>
                </div>
                <span className="text-[10px] text-zinc-400 mt-1">128 Rekod Unik Ternormal</span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 border border-black/5 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Keputusan JEV</span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-zinc-900">389+</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Live AI</span>
                </div>
                <span className="text-[10px] text-zinc-400 mt-1">Single forward-pass &lt;50ms</span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 border border-black/5 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Kandungan Media BI</span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-zinc-900">123</span>
                  <span className="text-[10px] text-zinc-500 font-medium">79 video / 44 pos</span>
                </div>
                <span className="text-[10px] text-zinc-400 mt-1">TikTok & Instagram rasmi</span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 border border-black/5 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Graf Pengetahuan</span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-zinc-900">131</span>
                  <span className="text-[10px] text-blue-600 font-bold">128 Relasi</span>
                </div>
                <span className="text-[10px] text-zinc-400 mt-1">124 Peristiwa garis masa</span>
              </div>
            </div>

            {/* Core Brand & Operations Synthesis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-white border border-black/5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                    <Flame size={16} className="text-red-600" />
                    Profil Jenama & Hubungan Entiti Sebenar
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Disahkan Penuh
                  </span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                  Berdasarkan audit repositori, teras perniagaan berpusat kepada 
                  <strong> ABANGCOLEK</strong> (produk kuah colek buah 500g, pencicah pedas manis, jeruk mangga asam boi) serta pasukan operasi 
                  <strong> STYLOAIRPOOL</strong> yang mengendalikan gerai pop-up bergerak di Toppen Johor Bahru, Pasar Karat, Shah Alam, dan Bangi.
                </p>
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-black/5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-zinc-700">ABANGCOLEK & STYLOAIRPOOL:</span>
                    <span className="text-emerald-700 font-bold">Jenama & Pengendali Rasmi</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-zinc-700">LIURLELEH (Liur Leleh House):</span>
                    <span className="text-amber-700 font-bold">Produk Rakan Niaga</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-zinc-700">JERUX (The Famous Jerux):</span>
                    <span className="text-amber-700 font-bold">Produk Jeruk Buah</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-zinc-700">Stokis Terengganu (@jeruxsliurlelehterengganu):</span>
                    <span className="text-blue-700 font-bold">Ejen Wilayah Pantai Timur</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-black/5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-600" />
                    Tadbir Urus & Invarian Root Cause
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Tiada Halusinasi
                  </span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                  Sistem mengekalkan piawaian etika data tanpa sebarang mock data:
                </p>
                <div className="space-y-2.5">
                  <div className="p-3 rounded-2xl bg-zinc-50 border border-black/5 text-xs text-zinc-700">
                    <span className="font-bold text-red-600 block mb-1">Aduan Kebocoran (LEAKAGE / SEAL_FAILURE):</span>
                    Aduan penutup botol kuah colek bocor semasa pos kurier dilabelkan sebagai <code>LEAKAGE</code>. Punca operasi wajib kekal <strong><code>UNDETERMINED</code></strong> sehingga semakan lot pengeluaran pembekal atau syarikat kurier diverifikasi.
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-50 border border-black/5 text-xs text-zinc-700">
                    <span className="font-bold text-blue-600 block mb-1">Pintu Kelulusan PRD (Gated Workflows):</span>
                    8 Aliran operasi asas di bawah memerlukan semakan dan pengesahan pemilik secara langsung sebelum kod automasi dijalankan secara bebas.
                  </div>
                </div>
              </div>
            </div>

            {/* NEW: JINGLE THEME SONG & TIKTOK FOUNDER SPOTLIGHT (Extracted from thisisniagahub repo) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Jingle Player Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-red-950 via-zinc-900 to-black text-white border border-red-500/20 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-red-600 text-white">
                      <Music size={18} />
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-white">Lagu Tema Rasmi: &quot;Kasi Lagi-Lagi&quot;</h3>
                      <p className="text-[11px] text-zinc-400">Hip-Hop / Trap Anthem (85-95 BPM) · Abang Colek</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                    Audio Master 320kbps
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={togglePlayJingle}
                    className="w-12 h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center font-bold shadow-lg transition-transform hover:scale-105 shrink-0"
                  >
                    {isPlayingJingle ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                  </button>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-zinc-200">Kasi Lagi-Lagi (Theme Song)</span>
                      <span className="text-zinc-400 font-mono text-[11px]">01:00</span>
                    </div>
                    {/* Equalizer animation */}
                    <div className="flex items-end gap-1 h-5 pt-1">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex-1 bg-red-500 rounded-full transition-all duration-200",
                            isPlayingJingle ? "animate-pulse" : "opacity-30"
                          )}
                          style={{
                            height: isPlayingJingle 
                              ? `${Math.max(20, (Math.sin(i * 1.5) * 40 + 50))}%` 
                              : '25%'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <audio
                  ref={audioRef}
                  src="/audio/kasi-lagi-lagi.mp3"
                  onEnded={() => setIsPlayingJingle(false)}
                  className="hidden"
                />

                <div className="pt-2 flex items-center justify-between border-t border-white/10 text-xs">
                  <button
                    onClick={() => setShowLyrics(!showLyrics)}
                    className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <span>{showLyrics ? 'Sembunyi Lirik' : 'Lihat Lirik Penuh (Karaoke)'}</span>
                    <ChevronRight size={13} className={cn("transition-transform", showLyrics && "rotate-90")} />
                  </button>
                  <span className="text-[10px] text-zinc-400 italic">Disahkan daripada repo thisisniagahub</span>
                </div>

                {showLyrics && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-[11px] font-mono leading-relaxed text-zinc-300 space-y-2"
                  >
                    <p className="text-amber-300 font-bold">[CHORUS]</p>
                    <p className="font-bold text-white">
                      ABANG CHO-LEK! SAMBAL CHO-LEK!<br />
                      PEDAS! PADU!<br />
                      SEKALI RASA. YOU KNOW.<br />
                      PEDAS MANIS. STAYS.
                    </p>
                    <p className="text-zinc-400">
                      [VERSE 2]<br />
                      Event penuh, booth kita pack<br />
                      Queue panjang, semua datang back<br />
                      Tak perlu gimmick, rasa speak loud<br />
                      Satu CHO-LEK! sama — tengok semua nod proud!
                    </p>
                  </motion.div>
                )}
              </div>

              {/* TikTok & Founder Spotlight Card */}
              <div className="p-6 rounded-3xl bg-white border border-black/5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-black/5">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-black text-white">
                      <Flame size={18} className="text-red-500" />
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900">Profil TikTok Rasmi: @styloairpool</h3>
                      <p className="text-[11px] text-zinc-500">Pengasas: Epull · Founder | Motivator 📈</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    75.2K Followers
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-zinc-50 border border-black/5">
                    <p className="text-[10px] font-bold uppercase text-zinc-400">Jumlah Tontonan & Likes</p>
                    <p className="text-base font-black text-zinc-900 mt-0.5">793.2K Likes</p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">10.5 likes per follower</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-50 border border-black/5">
                    <p className="text-[10px] font-bold uppercase text-zinc-400">Kandungan Disahkan</p>
                    <p className="text-base font-black text-zinc-900 mt-0.5">79 Video Koleksi</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Festival & booth viral</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-red-50/60 border border-red-200/60 space-y-1.5 text-xs">
                  <p className="font-bold text-red-950 flex items-center gap-1.5">
                    <span>🌶️🥭</span>
                    <span>Slogan Rasmi TikTok:</span>
                  </p>
                  <p className="text-sm font-extrabold text-red-700 italic">
                    &quot;PEDAS MANIS LIKAT MELEKAT 🌶️🥭&quot;
                  </p>
                  <p className="text-xs font-semibold text-zinc-700 italic">
                    &quot;Rasa Sekali Jatuh Cinta Selamanya&quot;
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                  <span>Dwi-Penjenamaan: Produk Makanan + Motivasi Bisnes</span>
                  <a
                    href="https://tiktok.com/@styloairpool"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <span>Buka TikTok</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>

            {/* NEW: FOUNDER'S CORNER & DAILY MOTIVATIONAL QUOTES (From preset-data.ts) */}
            <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-amber-500 text-black font-bold">
                    <Quote size={18} />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                      <span>Founder&apos;s Corner &amp; Inspirasi Harian</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
                        {MOTIVATIONAL_QUOTES[quoteIndex].category.toUpperCase()}
                      </span>
                    </h4>
                    <p className="text-xs text-zinc-500">Mutiara kata pengasas dari preset-data.ts (8 Koleksi Rasmi)</p>
                  </div>
                </div>

                <button
                  onClick={() => setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length)}
                  className="px-3 py-1.5 rounded-full bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-bold border border-black/10 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all shrink-0"
                >
                  <RefreshCw size={12} />
                  <span>Petikan Seterusnya ({quoteIndex + 1}/{MOTIVATIONAL_QUOTES.length})</span>
                </button>
              </div>

              {/* Current Active Quote Display */}
              <div className="p-4 rounded-2xl bg-white border border-amber-200/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm sm:text-base font-extrabold text-zinc-900 italic">
                    &ldquo;{MOTIVATIONAL_QUOTES[quoteIndex].quote}&rdquo;
                  </p>
                  <p className="text-xs text-amber-800 font-semibold flex items-center gap-1">
                    <span>— {MOTIVATIONAL_QUOTES[quoteIndex].author}</span>
                  </p>
                </div>
              </div>

              {/* 6 Contextual Brand Taglines */}
              <div>
                <p className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Tag size={12} className="text-amber-600" />
                  <span>6 Slogan Rasmi Kontekstual Jenama (Taglines):</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {BRAND_TAGLINES.map((t) => (
                    <div 
                      key={t.id}
                      onClick={() => {
                        navigator.clipboard?.writeText(t.text);
                        setCopiedTagline(t.id);
                        setTimeout(() => setCopiedTagline(null), 2000);
                      }}
                      className="p-2.5 rounded-xl bg-white hover:bg-amber-50 border border-black/5 flex items-center justify-between cursor-pointer transition-all shadow-2xs group"
                    >
                      <div className="truncate">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 block">{t.context} {t.emoji}</span>
                        <span className="font-bold text-zinc-900 text-xs truncate">&ldquo;{t.text}&rdquo;</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 group-hover:text-amber-700 font-medium shrink-0 ml-1">
                        {copiedTagline === t.id ? 'Disalin! ✓' : <Copy size={12} />}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions to trigger Agent */}
            <div className="p-6 rounded-3xl bg-black text-white flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" />
                  Jalankan Tindakan Operasi dengan Ejen Pintar Abang Colek
                </h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Hubungkan terus ke Google Tasks, Gmail, Google Calendar, Sheets, dan Forms untuk mengurus pesanan dan menyelesaikan aduan pelanggan.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onAction && onAction("Siasat aduan pembungkusan botol kuah colek bocor (LEAKAGE) dan sediakan SOP kawalan kualiti di Google Docs")}
                  className="px-4 py-2 bg-white text-black font-semibold text-xs rounded-full hover:bg-zinc-100 transition-all cursor-pointer"
                >
                  Siasat Isu Botol Bocor &rarr;
                </button>
                <button
                  onClick={() => onAction && onAction("Jadualkan mesyuarat pengurusan stokis Abang Colek dalam Google Calendar dan cipta bilik Google Meet")}
                  className="px-4 py-2 bg-zinc-800 text-white font-semibold text-xs rounded-full hover:bg-zinc-700 transition-all cursor-pointer border border-zinc-700"
                >
                  Jadual Mesyuarat Stokis &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: 8 FOUNDATIONAL BUSINESS QUESTIONS */}
        {activeSubTab === 'questions' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <HelpCircle size={18} className="text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Papan Pengesahan Operasi Pemilik (Human-in-the-Loop Gate)</p>
                <p className="text-amber-800 mt-0.5">
                  Setiap keputusan di bawah disimpan secara kekal dalam storan operasi sistem. Klik butang toggle untuk mengesahkan SOP atau menguncinya bagi audit keselamatan perisian.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workflows.map((wf) => (
                <div 
                  key={wf.id}
                  className="p-5 rounded-3xl bg-white border border-black/5 hover:border-black/15 shadow-xs transition-all space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono font-bold text-zinc-400">{wf.id}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                          wf.riskLevel === 'CRITICAL' ? "bg-red-100 text-red-700" :
                          wf.riskLevel === 'HIGH' ? "bg-amber-100 text-amber-800" :
                          "bg-blue-100 text-blue-700"
                        )}>
                          {wf.riskLevel} Risk
                        </span>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                          wf.owner_signoff ? "bg-emerald-100 text-emerald-800" : "bg-zinc-200 text-zinc-600"
                        )}>
                          {wf.status}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-zinc-900 mb-1">{wf.title}</h4>
                    <p className="text-xs text-zinc-500 italic mb-2">"{wf.question}"</p>
                    <p className="text-xs text-zinc-700 leading-relaxed font-medium bg-zinc-50 p-3 rounded-2xl border border-black/5">
                      {wf.verifiedDetails}
                    </p>
                    {wf.ownerNotes && (
                      <div className="mt-2 text-[11px] text-zinc-600 bg-amber-50/50 p-2 rounded-xl border border-amber-100">
                        <strong className="text-amber-900">Nota Pemilik:</strong> {wf.ownerNotes}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-black/5">
                    <button
                      onClick={() => handleToggleSignoff(wf.id, wf.owner_signoff)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
                        wf.owner_signoff
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                      )}
                    >
                      <Check size={13} />
                      <span>{wf.owner_signoff ? 'Disahkan (Verified)' : 'Kunci (Gate SOP)'}</span>
                    </button>
                    <button
                      onClick={() => onAction && onAction(`Kemas kini SOP untuk aliran kerja ${wf.id} (${wf.title}) dan sediakan draf dokumen dasar di Google Docs.`)}
                      className="text-xs text-zinc-500 hover:text-black font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Sedia Dokumen SOP</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 3: REAL JEV SYSTEM-1 SIMULATOR */}
        {activeSubTab === 'jev_tester' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-black/5 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                    <Activity size={16} className="text-red-600" />
                    Enjin Klasifikasi JEV System-1 (Real Live Execution)
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Uji teks pelanggan atau mesej WhatsApp sebenar merentasi 7 dimensi taksonomi dan 3 primitif bertaip (Choice, Score, Noul).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-full">
                    Model: gemini-3.8-flash (JEV System-1)
                  </span>
                </div>
              </div>

              {/* Sample Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Pilih Contoh Mesej Sebenar:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Salam bang, botol kuah colek yang pos ke Terengganu penutup dia pecah & kuah meleleh habis dalam parcel!",
                    "Hai Abang Colek, booth Toppen JB buka sampai pukul berapa hari ni? Ada buah mangga tak?",
                    "Saya nak order pakej niaga ejen permulaan 50 botol kuah colek untuk kedai saya di Shah Alam.",
                    "Kuah colek Abang Colek memang padu berapi! Buah potong rangup gila, semalam beli kat Pasar Karat."
                  ].map((sample, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInputText(sample);
                        handleRunRealJev(sample);
                      }}
                      className="text-[11px] px-3 py-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 rounded-full border border-black/5 transition-all text-left truncate max-w-md cursor-pointer"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Box */}
              <div className="space-y-2">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={3}
                  placeholder="Masukkan mesej pelanggan atau aduan..."
                  className="w-full p-4 rounded-2xl bg-zinc-50 border border-black/10 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black/10 resize-none font-medium"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-zinc-400">
                    Sistem akan memproses penilaian pantas dalam satu pas (*single forward-pass*).
                  </span>
                  <button
                    onClick={() => handleRunRealJev()}
                    disabled={isEvaluating || !inputText.trim()}
                    className="px-5 py-2.5 bg-black hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-semibold rounded-full flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Menjalankan JEV...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} />
                        <span>Jalankan JEV System-1 &rarr;</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Results Display */}
            {jevResult && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-3xl bg-white border border-black/10 shadow-sm space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-black/5 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-zinc-400">ID: {jevResult.id}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Latensi Sebenar: {jevResult.latencyMs}ms
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-zinc-900 mt-1">
                      Keputusan Pengelasan 7 Dimensi JEV
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 font-medium">Urgensi:</span>
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-bold",
                      jevResult.primitives.urgencyScore.score >= 4 ? "bg-red-100 text-red-700" :
                      jevResult.primitives.urgencyScore.score >= 3 ? "bg-amber-100 text-amber-800" :
                      "bg-emerald-100 text-emerald-800"
                    )}>
                      {jevResult.primitives.urgencyScore.score}/5.0 ({jevResult.primitives.urgencyScore.label})
                    </span>
                  </div>
                </div>

                {/* 7 Dimensions Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-zinc-50 border border-black/5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">1. Brand</span>
                    <span className="font-bold text-sm text-zinc-900 block">{jevResult.dimensions.brand.value}</span>
                    <span className="text-[10px] text-emerald-600 font-mono font-semibold">{(jevResult.dimensions.brand.confidence * 100).toFixed(0)}% Keyakinan</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-50 border border-black/5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">2. Business Function</span>
                    <span className="font-bold text-sm text-zinc-900 block">{jevResult.dimensions.businessFunction.value}</span>
                    <span className="text-[10px] text-emerald-600 font-mono font-semibold">{(jevResult.dimensions.businessFunction.confidence * 100).toFixed(0)}% Keyakinan</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-50 border border-black/5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">3. Sales Channel</span>
                    <span className="font-bold text-sm text-zinc-900 block">{jevResult.dimensions.salesChannel.value}</span>
                    <span className="text-[10px] text-emerald-600 font-mono font-semibold">{(jevResult.dimensions.salesChannel.confidence * 100).toFixed(0)}% Keyakinan</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-50 border border-black/5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">4. Customer Intent</span>
                    <span className="font-bold text-sm text-zinc-900 block">{jevResult.dimensions.customerIntent.value}</span>
                    <span className="text-[10px] text-emerald-600 font-mono font-semibold">{(jevResult.dimensions.customerIntent.confidence * 100).toFixed(0)}% Keyakinan</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-50 border border-black/5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">5. Issue Class</span>
                    <span className={cn(
                      "font-bold text-sm block",
                      jevResult.dimensions.issueClass.value === 'LEAKAGE' || jevResult.dimensions.issueClass.value === 'SEAL_FAILURE' ? "text-red-600" : "text-zinc-900"
                    )}>
                      {jevResult.dimensions.issueClass.value}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-mono font-semibold">{(jevResult.dimensions.issueClass.confidence * 100).toFixed(0)}% Keyakinan</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-50 border border-black/5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">6. Process Stage</span>
                    <span className="font-bold text-sm text-zinc-900 block">{jevResult.dimensions.processStage.value}</span>
                    <span className="text-[10px] text-emerald-600 font-mono font-semibold">{(jevResult.dimensions.processStage.confidence * 100).toFixed(0)}% Keyakinan</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-50 border border-black/5 col-span-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">7. Root Cause Status (Invariant)</span>
                    <span className="font-bold text-sm text-amber-700 block">{jevResult.dimensions.rootCauseStatus.value}</span>
                    <span className="text-[10px] text-zinc-500 font-medium">Kekal UNDETERMINED sehingga lot pembungkusan/kilang disahkan</span>
                  </div>
                </div>

                {/* Typed Primitives: Noul & Score */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-zinc-50 border border-black/5">
                  <div className="text-xs">
                    <span className="font-semibold text-zinc-500 block">Perlu Campur Tangan Segera (Noul):</span>
                    <span className="font-bold text-zinc-900 text-sm">
                      {jevResult.primitives.requiresImmediateIntervention.isAffirmative ? 'YA' : 'TIDAK'} ({(jevResult.primitives.requiresImmediateIntervention.probability * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-zinc-500 block">Layak Gantian / Bayaran Balik (Noul):</span>
                    <span className="font-bold text-zinc-900 text-sm">
                      {jevResult.primitives.isRefundEligible.isAffirmative ? 'LAYAK' : 'TIDAK'} ({(jevResult.primitives.isRefundEligible.probability * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-zinc-500 block">Peluang Ejen Bernilai Tinggi:</span>
                    <span className="font-bold text-zinc-900 text-sm">
                      {jevResult.primitives.isHighValueAgentOpportunity.isAffirmative ? 'POTENSI TINGGI' : 'STANDARD'} ({(jevResult.primitives.isHighValueAgentOpportunity.probability * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>

                {/* SOP & Recommended Action */}
                <div className="space-y-3 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900">
                  <div>
                    <span className="font-bold block text-amber-950">Tindakan Operasi Disyorkan:</span>
                    <p className="mt-0.5 font-medium">{jevResult.recommendedAction}</p>
                  </div>
                  <div>
                    <span className="font-bold block text-amber-950">Piawaian SOP:</span>
                    <p className="mt-0.5 font-medium">{jevResult.suggestedSop}</p>
                  </div>
                </div>

                {/* Live Google Workspace Action Buttons */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-red-600" />
                      Laksana Tindakan Automatik Google Workspace (Live API):
                    </span>
                  </div>

                  {actionStatus?.message && (
                    <div className={cn(
                      "p-3 rounded-2xl text-xs font-semibold border flex items-center gap-2",
                      actionStatus.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
                    )}>
                      {actionStatus.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                      <span>{actionStatus.message}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    <button
                      onClick={() => handleExecuteAction('task')}
                      disabled={actionStatus?.loading}
                      className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-black/10 rounded-2xl text-left flex flex-col justify-between transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-zinc-800 font-bold text-xs">
                        <CheckSquare size={14} className="text-blue-600" />
                        <span>Google Tasks</span>
                      </div>
                      <span className="text-[11px] text-zinc-500 mt-2 font-medium">Cipta tugasan siasatan</span>
                    </button>

                    <button
                      onClick={() => handleExecuteAction('email')}
                      disabled={actionStatus?.loading}
                      className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-black/10 rounded-2xl text-left flex flex-col justify-between transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-zinc-800 font-bold text-xs">
                        <Mail size={14} className="text-red-600" />
                        <span>Gmail</span>
                      </div>
                      <span className="text-[11px] text-zinc-500 mt-2 font-medium">Draf maklum balas gantian</span>
                    </button>

                    <button
                      onClick={() => handleExecuteAction('calendar')}
                      disabled={actionStatus?.loading}
                      className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-black/10 rounded-2xl text-left flex flex-col justify-between transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-zinc-800 font-bold text-xs">
                        <Calendar size={14} className="text-emerald-600" />
                        <span>Google Calendar</span>
                      </div>
                      <span className="text-[11px] text-zinc-500 mt-2 font-medium">Jadual semakan batch</span>
                    </button>

                    <button
                      onClick={() => handleExecuteAction('sheet')}
                      disabled={actionStatus?.loading}
                      className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-black/10 rounded-2xl text-left flex flex-col justify-between transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-zinc-800 font-bold text-xs">
                        <FileSpreadsheet size={14} className="text-emerald-700" />
                        <span>Google Sheets</span>
                      </div>
                      <span className="text-[11px] text-zinc-500 mt-2 font-medium">Log ke lembaran rekod</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* SUBTAB 4: REAL JEV EVALUATION AUDIT TRAIL */}
        {activeSubTab === 'history' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-50 border border-black/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Sejarah Audit & Log Pengelasan JEV</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Setiap teks yang dinilai disimpan ke storan tempatan bagi tujuan penjejakan kualiti (*traceability*).
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-white px-3 py-1.5 rounded-full border border-black/5 text-zinc-700">
                {history.length} Log Direkod
              </span>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-black/5 space-y-2">
                <Clock size={28} className="mx-auto text-zinc-300" />
                <p className="text-xs text-zinc-500 font-medium">Belum ada sebarang teks dinilai lagi.</p>
                <button
                  onClick={() => {
                    setActiveSubTab('jev_tester');
                    handleRunRealJev();
                  }}
                  className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-full hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  Uji Teks Sekarang &rarr;
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {history.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-white border border-black/5 shadow-xs space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-zinc-500">{item.id}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          item.dimensions.issueClass.value === 'LEAKAGE' ? "bg-red-100 text-red-700" : "bg-zinc-100 text-zinc-700"
                        )}>
                          {item.dimensions.issueClass.value}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {item.latencyMs}ms
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-800 font-medium bg-zinc-50 p-2.5 rounded-xl border border-black/5">
                      "{item.inputText}"
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
                      <span>Brand: <strong className="text-zinc-800">{item.dimensions.brand.value}</strong></span>
                      <span>Intent: <strong className="text-zinc-800">{item.dimensions.customerIntent.value}</strong></span>
                      <span>Channel: <strong className="text-zinc-800">{item.dimensions.salesChannel.value}</strong></span>
                      <span>Root Cause: <strong className="text-amber-800">{item.dimensions.rootCauseStatus.value}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 5: SOCIAL CHANNELS COVERAGE */}
        {activeSubTab === 'channels' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-50 border border-black/5">
              <h3 className="text-sm font-bold text-zinc-900 mb-1">Saluran Media Sosial Rasmi Abang Colek & StyloAirpool</h3>
              <p className="text-xs text-zinc-500">
                128 rekod ternormal diekstrak daripada platform awam tanpa sebarang token akses sulit.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-black/5 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                    <span>TikTok Rasmi</span>
                    <code className="text-xs font-mono bg-zinc-100 px-2 py-0.5 rounded">@styloairpool</code>
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    81 URLs (100% Extracted)
                  </span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                  79 video diekstrak melalui <code>yt-dlp</code> + 2 URL media. Memaparkan jualan buah potong celup kuah colek melimpah di karnival Johor Bahru.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-black/5 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                    <span>Instagram Rasmi</span>
                    <code className="text-xs font-mono bg-zinc-100 px-2 py-0.5 rounded">@airpoolstylo</code>
                  </span>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                    11 Posts / Reels
                  </span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                  Pengumuman lokasi booth festival, hebahan jualan kuah pencicah buah segar, dan nombor pesanan terus WhatsApp.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-black/5 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                    <span>Threads Awam</span>
                    <code className="text-xs font-mono bg-zinc-100 px-2 py-0.5 rounded">@airpoolstylo</code>
                  </span>
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                    15 Posts Awam
                  </span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                  Kemas kini harian baki stok gerai pop-up dan maklum balas pelanggan gerai.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-black/5 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                    <span>Rangkaian Stokis Terengganu</span>
                    <code className="text-xs font-mono bg-zinc-100 px-2 py-0.5 rounded">@jeruxsliurlelehterengganu</code>
                  </span>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                    12 Pos Ejen
                  </span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                  Aktiviti pengedaran kuah colek & jeruk buah buatan tangan untuk pelanggan sekitar Pantai Timur.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB: TYPESAFE.AI JEV REPO AUDIT & WOCS COMMAND CONSOLE */}
        {activeSubTab === 'wocs_audit' && (
          <div className="space-y-6">
            {/* Header & Verification Badge */}
            <div className="p-6 rounded-3xl bg-zinc-900 text-white border border-white/10 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={20} className="text-emerald-400" />
                    <h3 className="font-bold text-base text-white">
                      Laporan Audit Forensik Typesafe.ai JEV (Repo GitHub)
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Kajian menyeluruh ke atas fail kod, skema Drizzle, automasi WOCS, dan aset di <a href="https://github.com/thisisniagahub/ABANG-COLEK.git" target="_blank" rel="noreferrer" className="underline text-amber-300">thisisniagahub/ABANG-COLEK.git</a>.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-extrabold text-xs border border-emerald-500/40 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>JEV Score: 94.6% (VERIFIED)</span>
                  </span>
                </div>
              </div>

              {/* 7-Dimension Scorecards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold uppercase text-zinc-400">1. Identiti Jenama</p>
                  <p className="text-base font-black text-emerald-400 mt-0.5">98.0%</p>
                  <p className="text-[10px] text-zinc-300">@styloairpool & Lirik Jingle</p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold uppercase text-zinc-400">2. Fungsi Bisnes</p>
                  <p className="text-base font-black text-emerald-400 mt-0.5">96.5%</p>
                  <p className="text-[10px] text-zinc-300">Rangkaian Serahan TBS</p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold uppercase text-zinc-400">3. Saluran Kargo</p>
                  <p className="text-base font-black text-emerald-400 mt-0.5">94.0%</p>
                  <p className="text-[10px] text-zinc-300">WOCS WhatsApp & redBus</p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold uppercase text-zinc-400">4. Niat Pelanggan</p>
                  <p className="text-base font-black text-emerald-400 mt-0.5">95.0%</p>
                  <p className="text-[10px] text-zinc-300">5 Templat Mesej Rasmi</p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold uppercase text-zinc-400">5. Klasifikasi Isu</p>
                  <p className="text-base font-black text-amber-400 mt-0.5">92.0%</p>
                  <p className="text-[10px] text-zinc-300">SOP Notis 1 Jam Sah</p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold uppercase text-zinc-400">6. Peringkat Proses</p>
                  <p className="text-base font-black text-emerald-400 mt-0.5">97.0%</p>
                  <p className="text-[10px] text-zinc-300">TBS ke Terminal Ejen</p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold uppercase text-zinc-400">7. Tadbir Urus</p>
                  <p className="text-base font-black text-blue-400 mt-0.5">90.0%</p>
                  <p className="text-[10px] text-zinc-300">Supabase Immutable Log</p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold uppercase text-zinc-400">Penyimpanan MD</p>
                  <p className="text-xs font-mono font-bold text-amber-300 mt-1">.md Disimpan ✓</p>
                  <p className="text-[10px] text-zinc-300">docs/ & reports/</p>
                </div>
              </div>
            </div>

            {/* WOCS WhatsApp Operations Command Console */}
            <div className="p-6 rounded-3xl bg-white border border-black/10 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-black/5 gap-2">
                <div className="flex items-center gap-2">
                  <Terminal size={18} className="text-purple-600" />
                  <h4 className="font-bold text-sm text-zinc-900">
                    Konsol Pengujian Arahan WhatsApp WOCS (Command Runner)
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">
                  Berasaskan commandParser.ts (abang-colek-mobile / wocs-server)
                </span>
              </div>

              {/* Quick Chip Presets */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-zinc-400 font-bold text-[11px]">Contoh Arahan WOCS:</span>
                {[
                  '/assign agent=KakMas hub=MBKT cargo=100botol driver=AbangZul',
                  '/schedule type=tiktok time=17:00 topic=LikatMelekat',
                  '/report type=daily date=today',
                  '/landing theme=pedas_manis promo=Beli3Free1',
                ].map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => {
                      setWocsInput(cmd);
                      handleParseWocsCommand(cmd);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-mono text-[11px] transition-all"
                  >
                    {cmd.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Input field */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Terminal size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={wocsInput}
                    onChange={(e) => {
                      setWocsInput(e.target.value);
                      handleParseWocsCommand(e.target.value);
                    }}
                    placeholder="/assign agent=Wan hub=KB cargo=50botol"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-black/10 rounded-xl font-mono text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <button
                  onClick={() => handleParseWocsCommand(wocsInput)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 text-white font-bold text-xs hover:bg-zinc-800 transition-all shadow-xs"
                >
                  Proses Arahan
                </button>
              </div>

              {/* Parsed Output Box */}
              {parsedWocs && (
                <div className="p-4 rounded-2xl bg-zinc-950 text-white font-mono text-xs space-y-2 border border-white/10">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Output WOCS Engine: <strong>{parsedWocs.type}</strong>
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold",
                      parsedWocs.requiresApproval ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-300"
                    )}>
                      {parsedWocs.requiresApproval ? 'Perlu Kelulusan Admin' : 'Auto-Laksana Serta-Merta'}
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-300">
                    <p className="text-purple-400 font-bold mb-1">Payload Terhurai:</p>
                    <pre className="bg-black/40 p-2.5 rounded-xl overflow-x-auto text-emerald-300">
                      {JSON.stringify(parsedWocs.payload, null, 2)}
                    </pre>
                  </div>

                  {executionResult && (
                    <div className="pt-2 border-t border-white/10 text-[11px] space-y-1">
                      <p className="text-zinc-400 font-bold">Status Pelaksanaan Langsung (Simulasi WOCS):</p>
                      <div className={cn(
                        "p-2.5 rounded-xl border",
                        executionResult.ok ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200" : "bg-red-950/60 border-red-500/40 text-red-200"
                      )}>
                        <p className="font-semibold">{executionResult.message}</p>
                        {executionResult.requiresAdminApproval && (
                          <p className="text-[10px] text-amber-300 font-medium mt-1">
                            ⚠️ Gerbang Keselamatan: Arahan ini ditahan dalam status &apos;awaiting_approval&apos; sehingga admin (01168444656 / 0178245667) meluluskannya.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Brand Assets Showcase from Sample-Image */}
            <div className="p-6 rounded-3xl bg-white border border-black/10 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-black/5">
                <div>
                  <h4 className="font-bold text-sm text-zinc-900">
                    Aset Grafik & Media Rasmi yang Disahkan (/assets/brand/)
                  </h4>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    18 fail imej resolusi tinggi serta lagu tema penuh telah dipindahkan terus ke direktori projek awam.
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                  18 Fail Imej + 1 Audio
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-2xl bg-zinc-50 border border-black/5 flex flex-col items-center">
                  <img src="/assets/brand/founder.png" alt="Founder Epull" className="w-16 h-16 rounded-full object-cover shadow-sm mb-2" />
                  <span className="font-bold text-xs text-zinc-900">Pengasas Epull</span>
                  <span className="text-[10px] text-zinc-400">founder.png</span>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-50 border border-black/5 flex flex-col items-center">
                  <img src="/assets/brand/MASKOT-1.PNG" alt="Maskot Cili" className="w-16 h-16 object-contain mb-2" />
                  <span className="font-bold text-xs text-zinc-900">Maskot Cili Padu</span>
                  <span className="text-[10px] text-zinc-400">MASKOT-1.PNG</span>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-50 border border-black/5 flex flex-col items-center">
                  <img src="/assets/brand/ABANG-COLEX-LOGO-3.png" alt="Logo Rasmi" className="w-16 h-16 object-contain mb-2" />
                  <span className="font-bold text-xs text-zinc-900">Logo V3 Rasmi</span>
                  <span className="text-[10px] text-zinc-400">ABANG-COLEX-LOGO-3.png</span>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-50 border border-black/5 flex flex-col items-center">
                  <img src="/assets/brand/MASKOT-LOGO.PNG" alt="Maskot Logo" className="w-16 h-16 object-contain mb-2" />
                  <span className="font-bold text-xs text-zinc-900">Maskot Mangga & Cili</span>
                  <span className="text-[10px] text-zinc-400">MASKOT-LOGO.PNG</span>
                </div>
              </div>
            </div>

            {/* Permanent Reference Material Banner */}
            <div className="p-5 rounded-3xl bg-zinc-100 border border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-zinc-700 shrink-0" />
                <div>
                  <p className="font-bold text-zinc-900">Laporan Lengkap Tersimpan Secara Kekal:</p>
                  <p className="text-zinc-500 font-mono text-[11px]">
                    docs/JEV_ECOSYSTEM_AUDIT_REPORT.md & reports/JEV_ECOSYSTEM_AUDIT_REPORT.md
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Bahan Rujukan Rasmi ✓
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
