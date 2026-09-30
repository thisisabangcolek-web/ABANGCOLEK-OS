/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  ExternalLink, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Share2, 
  Copy, 
  Check, 
  ChevronRight, 
  ListFilter,
  BarChart3, 
  MessageSquareText, 
  HelpCircle,
  X,
  Loader2,
  Calendar,
  LogOut,
  User as UserIcon,
  SendHorizontal
} from 'lucide-react';
import { User } from 'firebase/auth';
import { cn } from '@/lib/utils';
import { GoogleSignInButton } from './GoogleSignInButton';
import { 
  googleSignIn, 
  logout, 
  subscribeAuth, 
  getAccessToken 
} from '@/services/googleAuth';
import { 
  listGoogleForms, 
  getGoogleForm, 
  getGoogleFormResponses, 
  createGoogleFormWithQuestions, 
  deleteGoogleForm,
  addQuestionToForm,
  RETAIL_FORM_TEMPLATES, 
  DriveFormFile,
  GoogleForm,
  FormSubmissionResponse,
  QuestionDraft
} from '@/services/googleForms';
import { MOCK_DB } from '@/services/gemini';

interface FormsViewProps {
  onAction?: (msg?: string) => void;
}

export const FormsView: React.FC<FormsViewProps> = ({ onAction }) => {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Data state
  const [forms, setForms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Selected Form Details & Responses
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [selectedFormData, setSelectedFormData] = useState<GoogleForm | null>(null);
  const [selectedResponses, setSelectedResponses] = useState<FormSubmissionResponse[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAiGenModal, setShowAiGenModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Destructive Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newQuestions, setNewQuestions] = useState<QuestionDraft[]>([
    {
      title: 'How satisfied are you with our service?',
      type: 'choice',
      choiceType: 'RADIO',
      options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'],
      required: true
    },
    {
      title: 'Any additional suggestions or comments?',
      type: 'text',
      required: false
    }
  ]);
  const [isCreating, setIsCreating] = useState(false);

  // AI Generator Prompt State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingWithAi, setIsGeneratingWithAi] = useState(false);

  // New question inside detail drawer
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newQuestionType, setNewQuestionType] = useState<'choice' | 'text'>('text');
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  // Subscribe to Google Auth
  useEffect(() => {
    const unsubscribe = subscribeAuth((u, t) => {
      setUser(u);
      setToken(t);
    });
    return () => unsubscribe();
  }, []);

  // Fetch forms when token changes
  useEffect(() => {
    loadForms();
  }, [token]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const loadForms = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let liveDriveFiles: DriveFormFile[] = [];
      if (token) {
        liveDriveFiles = await listGoogleForms();
      }

      // Merge live Drive forms with any created during the session
      const mappedDriveForms = liveDriveFiles.map(file => ({
        formId: file.id,
        info: {
          title: file.name,
          description: file.description || 'Google Forms Document'
        },
        modifiedTime: file.modifiedTime,
        createdTime: file.createdTime,
        webViewLink: file.webViewLink || `https://docs.google.com/forms/d/${file.id}/edit`,
        responderUri: `https://docs.google.com/forms/d/${file.id}/viewform`,
        isFromDrive: true
      }));

      // Combine with MOCK_DB.forms (deduplicating by formId)
      const existingIds = new Set(mappedDriveForms.map(f => f.formId));
      const sessionForms = (MOCK_DB.forms || []).filter(f => !existingIds.has(f.formId));

      const combined = [...mappedDriveForms, ...sessionForms];

      // If user is not signed in and has no session forms yet, seed default sample templates for demo
      if (combined.length === 0 && !token) {
        const samples = RETAIL_FORM_TEMPLATES.map((tmpl, idx) => ({
          formId: `sample_form_${idx + 1}`,
          info: {
            title: tmpl.name,
            description: tmpl.description
          },
          items: tmpl.questions.map((q, qIdx) => ({
            itemId: `q_${qIdx}`,
            title: q.title,
            questionItem: { question: { required: q.required } }
          })),
          modifiedTime: new Date(Date.now() - idx * 86400000).toISOString(),
          responderUri: '#',
          webViewLink: '#',
          isSample: true,
          sampleQuestionsCount: tmpl.questions.length
        }));
        setForms(samples);
      } else {
        setForms(combined);
      }
    } catch (err: any) {
      console.error('Error fetching forms:', err);
      if (err.message && !err.message.includes('AUTH_REQUIRED')) {
        setErrorMsg(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      const res = await googleSignIn();
      if (res) {
        showToast(`Signed in as ${res.user.displayName || res.user.email}`);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setErrorMsg(err.message || 'Sign in failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setSelectedFormId(null);
      setSelectedFormData(null);
      showToast('Signed out of Google account.');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  const handleSelectForm = async (form: any) => {
    setSelectedFormId(form.formId);
    setIsLoadingDetails(true);
    setSelectedResponses([]);
    try {
      if (token && !form.isSample) {
        const [formData, responses] = await Promise.all([
          getGoogleForm(form.formId).catch(() => null),
          getGoogleFormResponses(form.formId).catch(() => [])
        ]);
        setSelectedFormData(formData || form);
        setSelectedResponses(responses || []);
      } else {
        setSelectedFormData(form);
        // Mock responses for preview/sample
        setSelectedResponses([
          {
            responseId: 'resp_1',
            createTime: new Date(Date.now() - 3600000).toISOString(),
            lastSubmittedTime: new Date(Date.now() - 3600000).toISOString(),
            respondentEmail: 'customer1@example.com',
            answers: {}
          },
          {
            responseId: 'resp_2',
            createTime: new Date(Date.now() - 7200000).toISOString(),
            lastSubmittedTime: new Date(Date.now() - 7200000).toISOString(),
            respondentEmail: 'shopper.sp@example.com',
            answers: {}
          }
        ]);
      }
    } catch (err: any) {
      console.error('Error loading form details:', err);
      setSelectedFormData(form);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCreateForm = async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);
    setErrorMsg(null);
    try {
      if (token) {
        const created = await createGoogleFormWithQuestions(newTitle, newDescription, newQuestions);
        MOCK_DB.forms.unshift(created);
        showToast(`Google Form "${created.info?.title}" successfully created!`);
        setShowCreateModal(false);
        loadForms();
        handleSelectForm(created);
      } else {
        // Workspace draft
        const draftId = 'form_' + Math.random().toString(36).substring(2, 9);
        const draftForm = {
          formId: draftId,
          info: { title: newTitle, description: newDescription },
          items: newQuestions.map((q, idx) => ({
            itemId: `q_${idx}`,
            title: q.title,
            questionItem: { question: { required: q.required ?? true } }
          })),
          modifiedTime: new Date().toISOString(),
          responderUri: `https://docs.google.com/forms/d/${draftId}/viewform`,
          webViewLink: `https://docs.google.com/forms/d/${draftId}/edit`,
          isDraft: true
        };
        MOCK_DB.forms.unshift(draftForm);
        showToast(`Draft form "${newTitle}" created. Sign in to sync with Google Drive.`);
        setShowCreateModal(false);
        loadForms();
        handleSelectForm(draftForm);
      }
    } catch (err: any) {
      console.error('Create form failed:', err);
      setErrorMsg(err.message || 'Failed to create Google Form');
    } finally {
      setIsCreating(false);
    }
  };

  const handleApplyTemplate = (template: typeof RETAIL_FORM_TEMPLATES[0]) => {
    setNewTitle(template.name);
    setNewDescription(template.description);
    setNewQuestions(template.questions.map(q => ({
      title: q.title,
      type: q.type as any,
      choiceType: (q as any).choiceType || 'RADIO',
      options: (q as any).options || ['Option 1', 'Option 2'],
      required: q.required
    })));
  };

  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (token && !deleteTarget.id.startsWith('sample_') && !deleteTarget.id.startsWith('form_')) {
        await deleteGoogleForm(deleteTarget.id);
      }
      // Remove from MOCK_DB
      MOCK_DB.forms = (MOCK_DB.forms || []).filter(f => f.formId !== deleteTarget.id);
      setForms(prev => prev.filter(f => f.formId !== deleteTarget.id));
      if (selectedFormId === deleteTarget.id) {
        setSelectedFormId(null);
        setSelectedFormData(null);
      }
      showToast(`Form "${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
    } catch (err: any) {
      console.error('Delete failed:', err);
      setErrorMsg(err.message || 'Failed to delete form.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddQuestionToActiveForm = async () => {
    if (!newQuestionTitle.trim() || !selectedFormId) return;
    setIsAddingQuestion(true);
    try {
      const qDraft: QuestionDraft = {
        title: newQuestionTitle,
        type: newQuestionType,
        required: true,
        options: newQuestionType === 'choice' ? ['Option 1', 'Option 2', 'Option 3'] : undefined
      };

      if (token && selectedFormData && !selectedFormData.formId.startsWith('sample_')) {
        await addQuestionToForm(selectedFormId, qDraft, selectedFormData.items?.length || 0);
        // Refresh details
        const updated = await getGoogleForm(selectedFormId);
        setSelectedFormData(updated);
      } else {
        // Local update
        const updatedItems = [
          ...(selectedFormData?.items || []),
          {
            itemId: `q_${Date.now()}`,
            title: newQuestionTitle,
            questionItem: { question: { required: true } }
          }
        ];
        setSelectedFormData(prev => prev ? { ...prev, items: updatedItems } : null);
      }
      setNewQuestionTitle('');
      showToast('Question added to form.');
    } catch (err: any) {
      console.error('Add question error:', err);
      setErrorMsg(err.message || 'Failed to add question');
    } finally {
      setIsAddingQuestion(false);
    }
  };

  const handleAskAgentToAnalyze = () => {
    if (!selectedFormData) return;
    const formTitle = selectedFormData.info?.title || 'Form';
    const msg = `Analyze the customer feedback and survey questions for "${formTitle}". What are the key customer pain points and operational recommendations?`;
    if (onAction) {
      onAction(msg);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-[32px] border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-5 py-2.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-2 border border-white/10"
          >
            <CheckCircle2 size={15} className="text-emerald-400" />
            {successToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="px-6 py-4 border-b border-black/[0.04] flex flex-wrap items-center justify-between gap-4 shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center border border-purple-100/60 shadow-xs">
            <FileText className="text-purple-600" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              Google Forms
              {token && (
                <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </span>
              )}
            </h1>
            <p className="text-xs text-zinc-500">
              Manage customer surveys, CSAT polls, and order feedback with Google Drive & Forms.
            </p>
          </div>
        </div>

        {/* Auth status & Action buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {token && user ? (
            <div className="flex items-center gap-2 bg-zinc-50 border border-black/5 rounded-full pl-2 pr-3 py-1">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-600">
                  <UserIcon size={12} />
                </div>
              )}
              <span className="text-xs font-medium text-zinc-700 truncate max-w-[140px]">
                {user.displayName || user.email}
              </span>
              <button
                onClick={handleSignOut}
                title="Disconnect Google Account"
                className="text-zinc-400 hover:text-zinc-700 transition-colors p-1"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <GoogleSignInButton
              onClick={handleSignIn}
              isLoading={isLoggingIn}
              label="Sign in with Google"
            />
          )}

          <button
            onClick={loadForms}
            disabled={isLoading}
            className="p-2 text-zinc-500 hover:text-zinc-800 bg-zinc-50 hover:bg-zinc-100 rounded-full border border-black/5 transition-all"
            title="Refresh forms"
          >
            <RefreshCw size={15} className={cn(isLoading && "animate-spin")} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-full text-xs font-medium transition-all shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            Create Form
          </button>
        </div>
      </header>

      {/* If error */}
      {errorMsg && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200/80 rounded-2xl flex items-center justify-between text-xs text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="hover:opacity-70 p-1">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Content: Split List and Detail Drawer */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Forms Directory (Left) */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-4">
          {/* Quick Notice if not signed in */}
          {!token && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/80 via-blue-50/60 to-white border border-purple-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h3 className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-purple-600" />
                  Connect Google Forms & Drive
                </h3>
                <p className="text-[11px] text-zinc-600 leading-relaxed max-w-xl">
                  Sign in with permission to save created forms directly into your personal Google Drive, share live respondent URLs, and stream incoming submission responses.
                </p>
              </div>
              <GoogleSignInButton
                onClick={handleSignIn}
                isLoading={isLoggingIn}
                className="shrink-0 text-xs py-1.5 px-3.5"
                label="Sign in"
              />
            </div>
          )}

          {/* Quick Templates Bar */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Ready Retail Templates
            </span>
            <span className="text-[11px] text-zinc-400">Click to use</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {RETAIL_FORM_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => {
                  handleApplyTemplate(tmpl);
                  setShowCreateModal(true);
                }}
                className="text-left p-3 rounded-2xl bg-zinc-50/70 hover:bg-zinc-100/80 border border-black/[0.03] transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="font-semibold text-xs text-zinc-800 group-hover:text-black line-clamp-1">
                    {tmpl.name}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1 line-clamp-2">
                    {tmpl.description}
                  </div>
                </div>
                <div className="mt-3 flex items-center text-[10px] font-medium text-purple-600 group-hover:underline gap-1">
                  Use template <ChevronRight size={10} />
                </div>
              </button>
            ))}
          </div>

          {/* Forms List Header */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Your Forms & Surveys ({forms.length})
              </span>
              {isLoading && <Loader2 size={13} className="animate-spin text-zinc-400" />}
            </div>
          </div>

          {/* Forms List Cards */}
          {forms.length === 0 && !isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-zinc-400">
              <FileText size={36} className="text-zinc-300 mb-3" />
              <p className="font-medium text-zinc-600 text-sm">No Google Forms found yet</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                Create a new customer satisfaction or refund intake form, or connect your Google account to list your existing Google Drive forms.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-black text-white text-xs font-medium rounded-full hover:bg-zinc-800 transition-all"
              >
                Create your first form
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {forms.map((form) => {
                const isSelected = selectedFormId === form.formId;
                const formTitle = form.info?.title || form.name || 'Untitled Form';
                const formDesc = form.info?.description || form.description || '';
                const responderUrl = form.responderUri || `https://docs.google.com/forms/d/${form.formId}/viewform`;
                const editUrl = form.webViewLink || `https://docs.google.com/forms/d/${form.formId}/edit`;

                return (
                  <div
                    key={form.formId}
                    onClick={() => handleSelectForm(form)}
                    className={cn(
                      "p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between group",
                      isSelected
                        ? "bg-purple-50/40 border-purple-300/80 shadow-xs"
                        : "bg-white hover:bg-zinc-50/80 border-black/[0.05]"
                    )}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                            <FileText size={15} />
                          </div>
                          <span className="font-semibold text-xs text-zinc-900 group-hover:text-purple-900 line-clamp-1">
                            {formTitle}
                          </span>
                        </div>

                        {form.isSample ? (
                          <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-medium shrink-0">
                            Sample
                          </span>
                        ) : form.isDraft ? (
                          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200/60 px-2 py-0.5 rounded-full font-medium shrink-0">
                            Local Draft
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full font-medium shrink-0 flex items-center gap-1">
                            <CheckCircle2 size={10} />
                            Google Drive
                          </span>
                        )}
                      </div>

                      {formDesc && (
                        <p className="text-[11px] text-zinc-500 mt-2 line-clamp-2 leading-relaxed">
                          {formDesc}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-black/[0.04] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                        <Calendar size={11} />
                        <span>
                          {form.modifiedTime ? new Date(form.modifiedTime).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {/* Copy link */}
                        <button
                          onClick={() => handleCopyLink(responderUrl, form.formId)}
                          title="Copy Public Response Link"
                          className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                        >
                          {copiedId === form.formId ? (
                            <Check size={13} className="text-emerald-600" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>

                        {/* Open in Google Forms */}
                        {!form.isSample && editUrl !== '#' && (
                          <a
                            href={editUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open in Google Forms Editor"
                            className="p-1.5 text-zinc-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}

                        {/* Delete Form (opens confirmation dialog!) */}
                        <button
                          onClick={() => setDeleteTarget({ id: form.formId, title: formTitle })}
                          title="Delete form"
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Form Details Drawer / Side Panel (Right) */}
        <div className={cn(
          "w-full md:w-[420px] lg:w-[460px] border-t md:border-t-0 md:border-l border-black/[0.04] bg-zinc-50/50 flex flex-col shrink-0 overflow-y-auto",
          !selectedFormId && "hidden md:flex"
        )}>
          {selectedFormData ? (
            <div className="p-6 flex flex-col h-full space-y-5">
              {/* Top Drawer Controls */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md">
                      Form Inspector
                    </span>
                    {isLoadingDetails && <Loader2 size={12} className="animate-spin text-zinc-400" />}
                  </div>
                  <h2 className="text-base font-bold text-zinc-900 leading-snug">
                    {selectedFormData.info?.title || 'Form Overview'}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setSelectedFormId(null);
                    setSelectedFormData(null);
                  }}
                  className="p-1 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-200/60"
                >
                  <X size={16} />
                </button>
              </div>

              {selectedFormData.info?.description && (
                <p className="text-xs text-zinc-600 bg-white p-3 rounded-2xl border border-black/[0.04] leading-relaxed">
                  {selectedFormData.info.description}
                </p>
              )}

              {/* Action buttons bar */}
              <div className="flex items-center gap-2">
                {selectedFormData.responderUri && selectedFormData.responderUri !== '#' && (
                  <a
                    href={selectedFormData.responderUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-zinc-50 text-zinc-800 border border-black/5 rounded-full text-xs font-medium shadow-xs transition-all"
                  >
                    <Share2 size={13} />
                    View Live Form
                  </a>
                )}
                {selectedFormData.webViewLink && selectedFormData.webViewLink !== '#' && (
                  <a
                    href={selectedFormData.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-medium shadow-xs transition-all"
                  >
                    <ExternalLink size={13} />
                    Edit on Google
                  </a>
                )}
              </div>

              {/* AI Analysis Quick Action */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between shadow-xs">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold flex items-center gap-1.5">
                    <Sparkles size={13} />
                    AI Sentiment & Analysis
                  </div>
                  <div className="text-[11px] text-purple-100">
                    Extract pain points & trends with the retail agent
                  </div>
                </div>
                <button
                  onClick={handleAskAgentToAnalyze}
                  className="px-3 py-1.5 bg-white text-purple-700 rounded-full text-[11px] font-bold hover:bg-purple-50 transition-all cursor-pointer shrink-0"
                >
                  Analyze
                </button>
              </div>

              {/* Responses Overview */}
              <div className="bg-white p-4 rounded-2xl border border-black/[0.04] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <BarChart3 size={15} className="text-zinc-500" />
                    Submissions
                  </span>
                  <span className="text-xs font-bold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full">
                    {selectedResponses.length} {selectedResponses.length === 1 ? 'Response' : 'Responses'}
                  </span>
                </div>

                {selectedResponses.length === 0 ? (
                  <div className="text-[11px] text-zinc-400 py-3 text-center">
                    No submissions received yet. Share the responder link with customers!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedResponses.map((r, i) => (
                      <div key={r.responseId || i} className="p-2.5 rounded-xl bg-zinc-50 text-[11px] border border-black/[0.02] flex items-center justify-between">
                        <div className="truncate max-w-[200px]">
                          <span className="font-semibold text-zinc-800">
                            {r.respondentEmail || `Respondent #${i + 1}`}
                          </span>
                          <div className="text-[10px] text-zinc-400">
                            {r.lastSubmittedTime ? new Date(r.lastSubmittedTime).toLocaleString() : 'Just now'}
                          </div>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-1.5 py-0.5 rounded">
                          Submitted
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Questions List */}
              <div className="bg-white p-4 rounded-2xl border border-black/[0.04] space-y-3 shadow-xs flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <HelpCircle size={15} className="text-zinc-500" />
                    Form Questions ({(selectedFormData.items || []).length})
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(selectedFormData.items || []).map((item, idx) => (
                    <div
                      key={item.itemId || idx}
                      className="p-3 rounded-xl bg-zinc-50 border border-black/[0.03] space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-zinc-800">
                          {idx + 1}. {item.title}
                        </span>
                        {item.questionItem?.question?.required && (
                          <span className="text-[9px] uppercase font-bold text-red-600 bg-red-50 px-1 rounded">
                            Req
                          </span>
                        )}
                      </div>
                      {item.questionItem?.question?.choiceQuestion && (
                        <div className="text-[10px] text-zinc-500 space-x-1 flex flex-wrap">
                          {item.questionItem.question.choiceQuestion.options?.map((opt, oIdx) => (
                            <span key={oIdx} className="inline-block bg-white px-1.5 py-0.5 rounded border border-black/5 mt-1">
                              • {opt.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Quick Add Question Input */}
                <div className="pt-2 border-t border-black/[0.04] space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                    Add Question to Form
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Rate our packing quality..."
                      value={newQuestionTitle}
                      onChange={(e) => setNewQuestionTitle(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 border border-black/10 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-purple-600"
                    />
                    <select
                      value={newQuestionType}
                      onChange={(e) => setNewQuestionType(e.target.value as any)}
                      className="text-xs bg-zinc-50 border border-black/10 rounded-xl px-2 py-1.5 text-zinc-700"
                    >
                      <option value="text">Text</option>
                      <option value="choice">Options</option>
                    </select>
                    <button
                      onClick={handleAddQuestionToActiveForm}
                      disabled={isAddingQuestion || !newQuestionTitle.trim()}
                      className="p-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl transition-all"
                    >
                      {isAddingQuestion ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-zinc-400 space-y-3">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                <FileText size={22} />
              </div>
              <p className="text-xs font-semibold text-zinc-600">Select a form to inspect</p>
              <p className="text-[11px] text-zinc-400 max-w-[220px]">
                Click on any form card to view questions, explore live responses, or run an AI sentiment summary.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE FORM MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-black/5 flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.04]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900">Create New Google Form</h3>
                    <p className="text-[11px] text-zinc-400">
                      {token ? 'Will be created directly in your Google Drive' : 'Draft mode (sign in to sync)'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-zinc-700 p-1">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Form Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Post-Delivery Satisfaction Survey"
                    className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-black/10 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Provide respondents with context or thank-you note..."
                    className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-black/10 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                {/* Questions Builder */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-700">Questions ({newQuestions.length})</label>
                    <button
                      type="button"
                      onClick={() => setNewQuestions(prev => [
                        ...prev,
                        {
                          title: 'New Question',
                          type: 'choice',
                          choiceType: 'RADIO',
                          options: ['Yes', 'No'],
                          required: true
                        }
                      ])}
                      className="text-[11px] text-purple-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Add Question
                    </button>
                  </div>

                  <div className="space-y-3">
                    {newQuestions.map((q, idx) => (
                      <div key={idx} className="p-3 bg-zinc-50 rounded-2xl border border-black/[0.04] space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={q.title}
                            onChange={(e) => {
                              const updated = [...newQuestions];
                              updated[idx].title = e.target.value;
                              setNewQuestions(updated);
                            }}
                            className="flex-1 px-2.5 py-1 text-xs bg-white border border-black/10 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-purple-600 font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setNewQuestions(prev => prev.filter((_, i) => i !== idx))}
                            className="text-zinc-400 hover:text-red-600 p-1"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div className="flex items-center gap-3 text-[11px]">
                          <select
                            value={q.type}
                            onChange={(e) => {
                              const updated = [...newQuestions];
                              updated[idx].type = e.target.value as any;
                              setNewQuestions(updated);
                            }}
                            className="bg-white border border-black/10 rounded-lg px-2 py-1 text-zinc-700"
                          >
                            <option value="choice">Multiple Choice</option>
                            <option value="text">Paragraph / Text</option>
                            <option value="scale">Rating Scale (1-5)</option>
                          </select>

                          <label className="flex items-center gap-1 text-zinc-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={q.required ?? true}
                              onChange={(e) => {
                                const updated = [...newQuestions];
                                updated[idx].required = e.target.checked;
                                setNewQuestions(updated);
                              }}
                              className="rounded text-purple-600"
                            />
                            Required
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-black/[0.04] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateForm}
                  disabled={isCreating || !newTitle.trim()}
                  className="flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-full text-xs font-semibold shadow-xs transition-all"
                >
                  {isCreating ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Creating Google Form...
                    </>
                  ) : (
                    'Publish Google Form'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DESTRUCTIVE CONFIRMATION MODAL (MANDATORY SKILL REQUIREMENT) */}
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
                <h3 className="font-bold text-sm text-zinc-900">
                  Delete Google Form?
                </h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-zinc-800">"{deleteTarget.title}"</span>? This will permanently remove the form and its responses from Google Drive.
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
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Confirm Delete'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
