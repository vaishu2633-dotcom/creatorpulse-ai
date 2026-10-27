import React, { useState, useEffect } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { useToast } from '../context/ToastContext';
import { getDrafts, updateDraft, deleteDraft, createDraft } from '../api/apiClient';
import PageHeader from '../components/ui/PageHeader';
import HowItWorks from '../components/ui/HowItWorks';
import StatusChip from '../components/ui/StatusChip';
import PlatformBadge from '../components/PlatformBadge';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SlideOver from '../components/ui/SlideOver';
import Tabs from '../components/ui/Tabs';
import EmptyState from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import EmptyDraftsIllustration from '../assets/illustrations/empty-drafts.svg';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  FileEdit,
  Trash2,
  Tag,
  Plus,
  LayoutGrid,
  List,
  Sparkles,
  ArrowRight,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Capture Ideas & Angles',
    description: 'Save generated packages from Content Studio or log spontaneous topics directly.'
  },
  {
    title: 'Advance Stages',
    description: 'Move cards from Idea Backlog → Writing Draft → Scheduled → Published as your production progresses.'
  },
  {
    title: 'Calendar & Kanban Views',
    description: 'Toggle between stage columns and a visual monthly publication calendar.'
  },
  {
    title: 'Export & Share',
    description: 'Download your planner as a formatted CSV or printable schedule for team review.'
  }
];

const STATUS_COLUMNS = [
  { id: 'idea', label: 'Idea Backlog', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50' },
  { id: 'drafted', label: 'Writing Draft', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50' },
  { id: 'scheduled', label: 'Scheduled', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50' },
  { id: 'published', label: 'Published / Live', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50' },
];

export default function CalendarDrafts() {
  const { selectedPlatform, lastRefreshed } = usePlatform();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [drafts, setDrafts] = useState([]);
  const [viewMode, setViewMode] = useState('board'); // 'board', 'calendar', 'list'
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Slide-over draft editor
  const [editingDraft, setEditingDraft] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState('drafted');
  const [editHook, setEditHook] = useState('');
  const [editDate, setEditDate] = useState('');

  // Calendar month state
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 10, 1)); // Nov 2026

  const fetchDrafts = () => {
    setLoading(true);
    setError(null);
    getDrafts(selectedPlatform, statusFilter)
      .then((res) => {
        setDrafts(res.drafts || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load drafts');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDrafts();
  }, [selectedPlatform, statusFilter, lastRefreshed]);

  const handleOpenEdit = (draft) => {
    setEditingDraft(draft);
    setEditTitle(draft.title || '');
    setEditStatus(draft.status || 'drafted');
    setEditHook(draft.hook || '');
    setEditDate(draft.scheduled_date || '');
  };

  const handleSaveEdit = async () => {
    if (!editingDraft) return;
    try {
      await updateDraft(editingDraft.draft_id, {
        title: editTitle,
        status: editStatus,
        hook: editHook,
        scheduled_date: editDate,
      });
      addToast('Draft updated successfully!', 'success');
      setEditingDraft(null);
      fetchDrafts();
    } catch (err) {
      addToast(`Save failed: ${err.message}`, 'error');
    }
  };

  const handleDelete = async (draftId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this draft?')) return;
    try {
      await deleteDraft(draftId);
      addToast('Draft deleted', 'info');
      if (editingDraft?.draft_id === draftId) setEditingDraft(null);
      fetchDrafts();
    } catch (err) {
      addToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  const exportCSV = () => {
    if (drafts.length === 0) return;
    const headers = ['Draft ID', 'Platform', 'Title', 'Status', 'Hook', 'Scheduled Date'];
    const rows = drafts.map((d) => [
      d.draft_id,
      d.platform,
      `"${(d.title || '').replace(/"/g, '""')}"`,
      d.status,
      `"${(d.hook || '').replace(/"/g, '""')}"`,
      d.scheduled_date || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `creatorpulse_planner_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    addToast('Planner exported as CSV', 'success');
  };

  // Calendar rendering helpers
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        title="Calendar & Drafts"
        subtitle="Manage your post lifecycle from raw spark to scheduled and published release"
        tag="Planner"
        status="Working now"
        icon={CalendarIcon}
        illustration={EmptyDraftsIllustration}
        actions={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={exportCSV}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => navigate('/studio')}
            >
              New Idea in Studio
            </Button>
          </div>
        }
      />

      {/* How it Works Strip */}
      <HowItWorks steps={HOW_IT_WORKS_STEPS} />

      {/* View Switcher & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] shadow-xs">
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'board'
                  ? 'bg-white dark:bg-[#1E2638] text-[#5B5BD6] dark:text-brand-300 shadow-xs'
                  : 'text-[#5B6475] dark:text-[#94A3B8]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-[#1E2638] text-[#5B5BD6] dark:text-brand-300 shadow-xs'
                  : 'text-[#5B6475] dark:text-[#94A3B8]'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Month Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-[#1E2638] text-[#5B5BD6] dark:text-brand-300 shadow-xs'
                  : 'text-[#5B6475] dark:text-[#94A3B8]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {['all', 'idea', 'drafted', 'scheduled', 'published'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-lg capitalize font-medium transition ${
                statusFilter === s
                  ? 'bg-[#5B5BD6] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CardSkeleton lines={4} />
          <CardSkeleton lines={4} />
          <CardSkeleton lines={4} />
          <CardSkeleton lines={4} />
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load your drafts"
          description={error}
          onRetry={fetchDrafts}
        />
      ) : drafts.length === 0 ? (
        <EmptyState
          illustration={EmptyDraftsIllustration}
          title="No drafts in this view"
          description="Create your first post concept in Content Studio or change your platform filter."
          actionText="Create idea in Studio"
          onAction={() => navigate('/studio')}
        />
      ) : viewMode === 'board' ? (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          {STATUS_COLUMNS.map((col) => {
            const colDrafts = drafts.filter((d) => d.status === col.id);

            return (
              <div
                key={col.id}
                className="rounded-2xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] p-4 flex flex-col space-y-3 min-h-[420px]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#E8E6DF] dark:border-[#232B3E]">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${col.color}`}>
                    {col.label}
                  </span>
                  <span className="text-xs font-mono text-slate-400 font-bold">
                    {colDrafts.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {colDrafts.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 italic">
                      Empty stage
                    </div>
                  ) : (
                    colDrafts.map((d) => (
                      <div
                        key={d.draft_id}
                        onClick={() => handleOpenEdit(d)}
                        className="p-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] hover:border-[#5B5BD6] transition cursor-pointer space-y-2 group shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <PlatformBadge platform={d.platform} size="sm" />
                          <button
                            onClick={(e) => handleDelete(d.draft_id, e)}
                            className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition p-1"
                            title="Delete draft"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h4 className="text-xs font-bold text-[#1F2430] dark:text-white line-clamp-2">
                          {d.title}
                        </h4>
                        {d.hook && (
                          <p className="text-[11px] text-[#5B6475] dark:text-[#94A3B8] italic line-clamp-2">
                            "{d.hook}"
                          </p>
                        )}
                        {d.scheduled_date && (
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{d.scheduled_date}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'calendar' ? (
        /* Month Calendar Grid View */
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E6DF] dark:border-[#232B3E]">
            <h3 className="text-sm font-bold text-[#1F2430] dark:text-white flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4 text-[#5B5BD6]" />
              <span>
                {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
            </h3>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
                className="p-1.5 rounded-lg border border-[#E8E6DF] dark:border-[#232B3E] text-slate-500 hover:text-[#1F2430]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
                className="p-1.5 rounded-lg border border-[#E8E6DF] dark:border-[#232B3E] text-slate-500 hover:text-[#1F2430]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[#5B6475] dark:text-[#94A3B8]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[90px] p-2 rounded-xl bg-slate-50/40 dark:bg-[#121724]/40 border border-transparent" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dayDrafts = drafts.filter((d, dIdx) => (dIdx % daysInMonth) + 1 === dayNum);

              return (
                <div
                  key={`day-${dayNum}`}
                  className="min-h-[90px] p-2 rounded-xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] flex flex-col justify-between"
                >
                  <span className="text-[11px] font-bold text-slate-500">
                    {dayNum}
                  </span>
                  <div className="space-y-1">
                    {dayDrafts.slice(0, 2).map((dd) => (
                      <div
                        key={dd.draft_id}
                        onClick={() => handleOpenEdit(dd)}
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-50 dark:bg-brand-950/60 text-[#5B5BD6] dark:text-brand-300 truncate cursor-pointer hover:underline"
                        title={dd.title}
                      >
                        {dd.title}
                      </div>
                    ))}
                    {dayDrafts.length > 2 && (
                      <span className="text-[9px] text-slate-400 pl-1">
                        +{dayDrafts.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        /* List View */
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8E6DF] dark:border-[#232B3E] text-[10px] uppercase font-bold text-[#858D9D]">
                  <th className="py-3 px-3">Platform</th>
                  <th className="py-3 px-3">Title</th>
                  <th className="py-3 px-3">Stage</th>
                  <th className="py-3 px-3">Scheduled</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6DF] dark:divide-[#232B3E]">
                {drafts.map((d) => (
                  <tr
                    key={d.draft_id}
                    onClick={() => handleOpenEdit(d)}
                    className="hover:bg-slate-50 dark:hover:bg-[#1A2333] transition cursor-pointer"
                  >
                    <td className="py-3 px-3">
                      <PlatformBadge platform={d.platform} size="sm" showName />
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#1F2430] dark:text-white max-w-sm truncate">
                      {d.title}
                    </td>
                    <td className="py-3 px-3">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800">
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {d.scheduled_date || 'Unscheduled'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => handleDelete(d.draft_id, e)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Slide-over draft editor */}
      <SlideOver
        open={Boolean(editingDraft)}
        onClose={() => setEditingDraft(null)}
        title="Edit Draft Details"
      >
        {editingDraft && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8] mb-1.5">
                Draft Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] text-xs font-semibold text-[#1F2430] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8] mb-1.5">
                Production Stage
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] text-xs text-[#1F2430] dark:text-white capitalize"
              >
                {STATUS_COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8] mb-1.5">
                Scheduled Publication Date
              </label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] text-xs text-[#1F2430] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8] mb-1.5">
                Hook or Opening Line
              </label>
              <textarea
                rows={4}
                value={editHook}
                onChange={(e) => setEditHook(e.target.value)}
                className="w-full p-3 rounded-xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] text-xs text-[#1F2430] dark:text-white"
              />
            </div>

            <div className="pt-4 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(editingDraft.draft_id)}
                className="text-rose-500 hover:text-rose-600"
              >
                Delete Draft
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveEdit}
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
