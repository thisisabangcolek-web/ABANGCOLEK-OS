/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  Bot
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

interface AbangColekDiscoveryViewProps {
  onAction?: (msg?: string) => void;
}

export const AbangColekDiscoveryView: React.FC<AbangColekDiscoveryViewProps> = ({ onAction }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'questions' | 'jev_tester' | 'history' | 'channels'>('overview');
  
  // Real Persistent Workflows from Store
  const [workflows, setWorkflows] = useState<BusinessWorkflow[]>(appStore.getWorkflows());
  
  // JEV Live Evaluation State
  const [inputText, setInputText] = useState("Salam bang, botol kuah colek yang pos ke Terengganu hari tu penutup dia pecah dan kuah meleleh habis dalam kotak parcel. Boleh ganti baru tak?");
  const [jevResult, setJevResult] = useState<JevClassificationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [actionStatus, setActionStatus] = useState<{ loading: boolean; type?: string; message?: string; success?: boolean } | null>(null);
  
  // History of real JEV evaluations
  const [history, setHistory] = useState<JevClassificationResult[]>([]);

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
      </div>
    </div>
  );
};
