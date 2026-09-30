/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileSpreadsheet, 
  Plus, 
  ExternalLink, 
  Trash2, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Table, 
  X, 
  Loader2,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { subscribeAuth } from '@/services/googleAuth';
import { 
  listGoogleSheets, 
  createGoogleSpreadsheet, 
  readSpreadsheetValues, 
  deleteSpreadsheet,
  GoogleSheetSummary 
} from '@/services/googleSheets';
import realData from '../data.json';

interface SheetsViewProps {
  onAction?: (msg?: string) => void;
}

export const SheetsView: React.FC<SheetsViewProps> = ({ onAction }) => {
  const [token, setToken] = useState<string | null>(null);
  const [sheets, setSheets] = useState<GoogleSheetSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [sheetData, setSheetData] = useState<any[][]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Destructive Delete Confirmation Modal (MANDATORY REQUIREMENT)
  const [deleteTarget, setDeleteTarget] = useState<GoogleSheetSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    return subscribeAuth((_, t) => {
      setToken(t);
    });
  }, []);

  useEffect(() => {
    loadSheets();
  }, [token]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadSheets = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (token) {
        const live = await listGoogleSheets();
        setSheets(live);
      } else {
        setSheets([
          {
            id: 'sample_sheet_1',
            name: 'Brazil Retail Orders Q3 2026 Master Dataset',
            modifiedTime: new Date(Date.now() - 3600000 * 24).toISOString(),
            webViewLink: '#'
          },
          {
            id: 'sample_sheet_2',
            name: 'Logistics Fleet Delivery & Carrier Delay Audit',
            modifiedTime: new Date(Date.now() - 3600000 * 48).toISOString(),
            webViewLink: '#'
          }
        ]);
      }
    } catch (err: any) {
      if (!err.message?.includes('AUTH_REQUIRED')) {
        setErrorMsg(err.message || 'Failed to list spreadsheets');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportOrdersToSheet = async () => {
    setIsExporting(true);
    setErrorMsg(null);
    try {
      const headers = ['Order ID', 'Date', 'City', 'Status', 'Amount ($)'];
      const rows = (realData.orders as any[]).slice(0, 50).map(o => [
        o.order_id,
        o.date,
        o.city,
        o.status,
        o.amount
      ]);

      if (token) {
        const title = `Marketplace Orders Export - ${new Date().toLocaleDateString()}`;
        const created = await createGoogleSpreadsheet(title, headers, rows);
        showToast(`Exported 50 orders to Google Sheets!`);
        loadSheets();
        handleSelectSheet({ id: created.spreadsheetId, name: title, webViewLink: created.spreadsheetUrl });
      } else {
        const mockSheet: GoogleSheetSummary = {
          id: 'sheet_' + Date.now(),
          name: `Orders Export Preview - ${new Date().toLocaleDateString()}`,
          modifiedTime: new Date().toISOString(),
          webViewLink: '#'
        };
        setSheets(prev => [mockSheet, ...prev]);
        setSheetData([headers, ...rows]);
        setSelectedSheetId(mockSheet.id);
        showToast('Exported orders in workspace! Sign in to save to Google Drive.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to export spreadsheet');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectSheet = async (sheet: GoogleSheetSummary) => {
    setSelectedSheetId(sheet.id);
    setIsLoadingData(true);
    try {
      if (token && !sheet.id.startsWith('sample_') && !sheet.id.startsWith('sheet_')) {
        const values = await readSpreadsheetValues(sheet.id, 'A1:E25');
        setSheetData(values);
      } else {
        const headers = ['Order ID', 'Date', 'City', 'Status', 'Amount ($)'];
        const sampleRows = (realData.orders as any[]).slice(0, 15).map(o => [
          o.order_id,
          o.date,
          o.city,
          o.status,
          o.amount
        ]);
        setSheetData([headers, ...sampleRows]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to read sheet cells');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (token && !deleteTarget.id.startsWith('sample_') && !deleteTarget.id.startsWith('sheet_')) {
        await deleteSpreadsheet(deleteTarget.id);
      }
      setSheets(prev => prev.filter(s => s.id !== deleteTarget.id));
      if (selectedSheetId === deleteTarget.id) {
        setSelectedSheetId(null);
        setSheetData([]);
      }
      showToast(`Spreadsheet "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete spreadsheet.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-[32px] border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-5 py-2.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-2 border border-white/10"
          >
            <CheckCircle2 size={15} className="text-emerald-400" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="px-6 py-4 border-b border-black/[0.04] flex flex-wrap items-center justify-between gap-4 shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100/60 shadow-xs">
            <FileSpreadsheet className="text-emerald-600" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              Google Sheets
              {token && (
                <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Synced
                </span>
              )}
            </h1>
            <p className="text-xs text-zinc-500">
              Export live orders to Google Spreadsheets and inspect spreadsheet tables.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => loadSheets()}
            disabled={isLoading}
            className="p-2 text-zinc-500 hover:text-zinc-800 bg-zinc-50 hover:bg-zinc-100 rounded-full border border-black/5 transition-all"
            title="Refresh sheets"
          >
            <RefreshCw size={15} className={cn(isLoading && "animate-spin")} />
          </button>

          <button
            onClick={handleExportOrdersToSheet}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-full text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export Orders to Google Sheets
          </button>
        </div>
      </header>

      {/* Main split */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Spreadsheets List */}
        <div className="w-full md:w-[320px] lg:w-[360px] border-b md:border-b-0 md:border-r border-black/[0.04] p-5 space-y-3 overflow-y-auto shrink-0 bg-zinc-50/40">
          <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider block">
            Google Spreadsheets ({sheets.length})
          </span>

          <div className="space-y-2.5">
            {sheets.map((sheet) => {
              const isSelected = selectedSheetId === sheet.id;
              return (
                <div
                  key={sheet.id}
                  onClick={() => handleSelectSheet(sheet)}
                  className={cn(
                    "p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group",
                    isSelected
                      ? "bg-emerald-50/50 border-emerald-300 shadow-xs"
                      : "bg-white hover:bg-zinc-50 border-black/[0.04]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileSpreadsheet size={15} />
                      </div>
                      <span className="text-xs font-semibold text-zinc-900 group-hover:text-emerald-900 line-clamp-1">
                        {sheet.name}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-black/[0.04] flex items-center justify-between gap-2 text-[10px]" onClick={(e) => e.stopPropagation()}>
                    <span className="text-zinc-400">
                      {sheet.modifiedTime ? new Date(sheet.modifiedTime).toLocaleDateString() : 'Recent'}
                    </span>

                    <div className="flex items-center gap-1">
                      {sheet.webViewLink && sheet.webViewLink !== '#' && (
                        <a
                          href={sheet.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-zinc-400 hover:text-emerald-600 rounded"
                          title="Open in Google Sheets"
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
                      <button
                        onClick={() => setDeleteTarget(sheet)}
                        className="p-1 text-zinc-400 hover:text-red-600 rounded"
                        title="Delete spreadsheet"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Data Grid / Table Reader */}
        <div className="flex-1 overflow-auto p-6 bg-white">
          {sheetData.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                  <Table size={15} className="text-zinc-500" />
                  Live Spreadsheet Grid ({sheetData.length - 1} rows)
                </span>
              </div>

              <div className="border border-black/[0.06] rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs text-zinc-700 divide-y divide-black/[0.06]">
                  <thead className="bg-zinc-50 font-bold text-zinc-800">
                    <tr>
                      {sheetData[0]?.map((cell, cIdx) => (
                        <th key={cIdx} className="px-4 py-2.5 font-semibold text-[11px] uppercase tracking-wider text-zinc-600 border-r last:border-r-0 border-black/[0.04]">
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] bg-white">
                    {sheetData.slice(1).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-zinc-50/70 transition-colors">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-4 py-2 text-[11px] font-medium border-r last:border-r-0 border-black/[0.03]">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 space-y-2 p-12">
              <FileSpreadsheet size={36} className="text-zinc-300" />
              <p className="text-xs font-semibold text-zinc-600">Select a spreadsheet to inspect rows</p>
              <p className="text-[11px] text-zinc-400">
                Or click "Export Orders to Google Sheets" to generate a live spreadsheet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MANDATORY CONFIRMATION MODAL FOR DELETING SPREADSHEET */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-black/5 space-y-4"
            >
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
                <Trash2 size={20} />
              </div>

              <div>
                <h3 className="font-bold text-sm text-zinc-900">Delete Spreadsheet?</h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete <span className="font-semibold text-zinc-800">"{deleteTarget.name}"</span> from Google Drive?
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-full text-xs font-semibold shadow-xs transition-all"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
