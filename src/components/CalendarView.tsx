/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Clock, 
  MapPin, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Loader2,
  CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { subscribeAuth } from '@/services/googleAuth';
import { 
  listCalendarEvents, 
  createCalendarEvent, 
  deleteCalendarEvent, 
  GoogleCalendarEvent 
} from '@/services/googleCalendar';

interface CalendarViewProps {
  onAction?: (msg?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onAction }) => {
  const [token, setToken] = useState<string | null>(null);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Event Modal State
  const [showModal, setShowModal] = useState(false);
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Destructive Delete Confirmation Modal State (MANDATORY REQUIREMENT)
  const [deleteTargetEvent, setDeleteTargetEvent] = useState<GoogleCalendarEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    return subscribeAuth((_, t) => {
      setToken(t);
    });
  }, []);

  useEffect(() => {
    loadEvents();
  }, [token]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadEvents = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (token) {
        const live = await listCalendarEvents();
        setEvents(live);
      } else {
        // Sample events
        setEvents([
          {
            id: 'sample_cal_1',
            summary: 'São Paulo Carrier Route & SLA Review',
            description: 'Evaluate delay bottlenecks with regional delivery fleet.',
            location: 'São Paulo Fulfillment Hub',
            start: { dateTime: new Date(Date.now() + 3600000 * 2).toISOString() },
            end: { dateTime: new Date(Date.now() + 3600000 * 3).toISOString() },
            htmlLink: '#'
          },
          {
            id: 'sample_cal_2',
            summary: 'Customer Return Dispute Resolution Call',
            description: 'Order #49102 damaged espresso machine consultation.',
            start: { dateTime: new Date(Date.now() + 86400000).toISOString() },
            end: { dateTime: new Date(Date.now() + 86400000 + 3600000).toISOString() },
            htmlLink: '#'
          }
        ]);
      }
    } catch (err: any) {
      if (!err.message?.includes('AUTH_REQUIRED')) {
        setErrorMsg(err.message || 'Failed to load calendar events');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim() || !startDateTime || !endDateTime) return;
    setIsCreating(true);
    try {
      const startIso = new Date(startDateTime).toISOString();
      const endIso = new Date(endDateTime).toISOString();
      if (token) {
        const created = await createCalendarEvent(summary, startIso, endIso, description, location);
        setEvents(prev => [created, ...prev]);
        showToast('Event created in Google Calendar!');
      } else {
        const localEvent: GoogleCalendarEvent = {
          id: 'cal_' + Date.now(),
          summary,
          description,
          location,
          start: { dateTime: startIso },
          end: { dateTime: endIso },
          htmlLink: '#'
        };
        setEvents(prev => [localEvent, ...prev]);
        showToast('Event scheduled in workspace!');
      }
      setShowModal(false);
      setSummary('');
      setDescription('');
      setLocation('');
      setStartDateTime('');
      setEndDateTime('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to schedule event');
    } finally {
      setIsCreating(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteTargetEvent) return;
    setIsDeleting(true);
    try {
      if (token && !deleteTargetEvent.id.startsWith('sample_') && !deleteTargetEvent.id.startsWith('cal_')) {
        await deleteCalendarEvent(deleteTargetEvent.id);
      }
      setEvents(prev => prev.filter(e => e.id !== deleteTargetEvent.id));
      showToast('Event removed from Google Calendar.');
      setDeleteTargetEvent(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete event.');
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
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100/60 shadow-xs">
            <CalendarIcon className="text-amber-600" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              Google Calendar
              {token && (
                <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Synced
                </span>
              )}
            </h1>
            <p className="text-xs text-zinc-500">
              Schedule delivery meetings, vendor reviews, and customer appointments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => loadEvents()}
            disabled={isLoading}
            className="p-2 text-zinc-500 hover:text-zinc-800 bg-zinc-50 hover:bg-zinc-100 rounded-full border border-black/5 transition-all"
            title="Refresh calendar"
          >
            <RefreshCw size={15} className={cn(isLoading && "animate-spin")} />
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-full text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            Schedule Event
          </button>
        </div>
      </header>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {events.length === 0 && !isLoading ? (
          <div className="p-12 text-center text-zinc-400 space-y-2">
            <CalendarDays size={36} className="mx-auto text-zinc-300" />
            <p className="text-xs font-semibold text-zinc-600">No upcoming events scheduled</p>
            <p className="text-[11px] text-zinc-400">Click Schedule Event to book an appointment.</p>
          </div>
        ) : (
          events.map((event) => {
            const start = event.start.dateTime || event.start.date;
            const end = event.end.dateTime || event.end.date;
            return (
              <div
                key={event.id}
                className="p-4 rounded-2xl bg-white hover:bg-zinc-50/70 border border-black/[0.04] shadow-xs flex items-start justify-between gap-3 group transition-all"
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex flex-col items-center justify-center border border-amber-100/80 shrink-0 font-bold">
                    <span className="text-[9px] uppercase leading-none text-amber-600">
                      {start ? new Date(start).toLocaleString('default', { month: 'short' }) : 'Date'}
                    </span>
                    <span className="text-xs leading-tight mt-0.5">
                      {start ? new Date(start).getDate() : ''}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-zinc-900 truncate">
                      {event.summary}
                    </h3>

                    {event.description && (
                      <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[10px] text-zinc-400 mt-2 font-medium flex-wrap">
                      <div className="flex items-center gap-1">
                        <Clock size={11} />
                        <span>
                          {start ? new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} - 
                          {end ? new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      {event.location && (
                        <div className="flex items-center gap-1 text-zinc-500">
                          <MapPin size={11} />
                          <span className="truncate max-w-[200px]">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {event.htmlLink && event.htmlLink !== '#' && (
                    <a
                      href={event.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-zinc-400 hover:text-amber-600 rounded-lg hover:bg-zinc-100 transition-colors"
                      title="Open in Google Calendar"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}

                  <button
                    onClick={() => setDeleteTargetEvent(event)}
                    className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete event"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SCHEDULE EVENT MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-black/5 flex flex-col space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-black/[0.04]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <CalendarIcon size={16} />
                  </div>
                  <h3 className="font-bold text-sm text-zinc-900">Schedule Google Calendar Event</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-700 p-1">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Carrier SLA Meeting: São Paulo Delay"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-black/10 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 block mb-1">Start Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={startDateTime}
                      onChange={(e) => setStartDateTime(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-black/10 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 block mb-1">End Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={endDateTime}
                      onChange={(e) => setEndDateTime(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-black/10 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="Google Meet or Fulfillment Warehouse Address"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-black/10 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Notes / Description</label>
                  <textarea
                    rows={2}
                    placeholder="Meeting agenda, order IDs, or team notes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-black/10 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !summary.trim()}
                    className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      'Save to Google Calendar'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANDATORY CONFIRMATION MODAL FOR DELETING CALENDAR EVENT */}
      <AnimatePresence>
        {deleteTargetEvent && (
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
                <h3 className="font-bold text-sm text-zinc-900">Delete Calendar Event?</h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Are you sure you want to remove <span className="font-semibold text-zinc-800">"{deleteTargetEvent.summary}"</span> from your Google Calendar?
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTargetEvent(null)}
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
