import React, { useState, useEffect } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { useToast } from '../context/ToastContext';
import { getDrafts, updateDraft, deleteDraft, createDraft } from '../api/apiClient';
import PlatformBadge from '../components/PlatformBadge';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SlideOver from '../components/ui/SlideOver';
import Tabs from '../components/ui/Tabs';
import EmptyState from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
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
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const [viewMode, setViewMode] = useState('board'); // 'board' or 'list'
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Slide-over draft editor
  const [editingDraft, setEditingDraft] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState('drafted');
  const [editHook, setEditHook] = useState('');

  const fetchDrafts = () => {
    setLoading(true);
    getDrafts(selectedPlatform, statusFilter)
      .then((res) => {
        setDrafts(res.drafts || []);
        setLoading(false);
      })
      .catch((err) => {
        addToast(err.message || 'Failed to load drafts', 'error');
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
  };

  const handleSaveEdit = async () => {
    if (!editingDraft) return;
    try {
      await updateDraft(editingDraft.draft_id, {
        title: editTitle,
        status: editStatus,
        hook: editHook,
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
    if (!confirm('Are you sure you want to delete this draft?')) return;
    try {
      await deleteDraft(draftId);
      addToast('Draft deleted', 'info');
      if (editingDraft?.draft_id === draftId) setEditingDraft(null);
      fetchDrafts();
    } catch (err) {
      addToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F2430] dark:text-white flex items-center space-x-2.5">
            <span>Calendar & Drafts</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Publishing Loop
            </span>
          </h1>
          <p className="text-sm text-[#5B6475] dark:text-[#94A3B8] mt-1">
            Track and organize your post lifecycle from raw idea to published post.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          {/* View switcher */}
          <div className="flex items-center bg-[#EFECE6] dark:bg-[#1A2131] p-1 rounded-xl border border-[#E5E2DA] dark:border-[#232B3E]">
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'board'
                  ? 'bg-white dark:bg-[#262F44] text-[#1F2430] dark:text-white shadow-2xs'
                  : 'text-[#5B6475] dark:text-[#94A3B8]'
              }`}
              title="Board view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-[#262F44] text-[#1F2430] dark:text-white shadow-2xs'
                  : 'text-[#5B6475] dark:text-[#94A3B8]'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => navigate('/studio')}
          >
            New Draft in Studio
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CardSkeleton lines={3} />
          <CardSkeleton lines={3} />
          <CardSkeleton lines={3} />
          <CardSkeleton lines={3} />
        </div>
      ) : drafts.length === 0 ? (
        <EmptyState
          illustration={EmptyDraftsIllustration}
          title="No drafts in progress"
          description="Your creative queue is currently empty. Generate a new script, hook or carousel in the Studio!"
          actionText="Create in Content Studio"
          onAction={() => navigate('/studio')}
        />
      ) : viewMode === 'board' ? (
        /* Kanban-style Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {STATUS_COLUMNS.map((col) => {
            const colDrafts = drafts.filter((d) => (d.status || 'drafted') === col.id);

            return (
              <div
                key={col.id}
                className="rounded-2xl bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] p-3.5 space-y-3"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#1F2430] dark:text-white">
                      {col.label}
                    </span>
                    <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-white dark:bg-[#1A2333] border border-slate-200 dark:border-slate-700 text-[#5B6475] dark:text-slate-300">
                      {colDrafts.length}
                    </span>
                  </div>
                </div>

                {/* Draft Cards */}
                <div className="space-y-2.5 min-h-[150px]">
                  {colDrafts.map((d) => (
                    <Card
                      key={d.draft_id}
                      hoverEffect
                      onClick={() => handleOpenEdit(d)}
                      className="p-3.5 space-y-2.5 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <PlatformBadge platform={d.platform} size="sm" showName={false} />
                        <span className="text-[10px] text-[#5B6475] dark:text-[#94A3B8] font-mono">
                          {d.created_at?.slice(5, 10)}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-[#1F2430] dark:text-white line-clamp-2">
                        {d.title}
                      </h4>

                      {d.hook && (
                        <p className="text-[11px] text-[#5B6475] dark:text-[#94A3B8] italic line-clamp-2 bg-[#FAF9F6] dark:bg-[#131825] p-2 rounded-lg">
                          "{d.hook}"
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1 text-[11px] text-[#5B6475] dark:text-[#94A3B8]">
                        <span className="text-brand-500 text-[10px] font-semibold">Click to edit</span>
                        <button
                          onClick={(e) => handleDelete(d.draft_id, e)}
                          className="text-slate-400 hover:text-red-500 p-1"
                          title="Delete draft"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </Card>
                  ))}

                  {colDrafts.length === 0 && (
                    <div className="h-24 rounded-xl border border-dashed border-[#E8E6DF] dark:border-[#232B3E] flex items-center justify-center text-xs text-slate-400">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {drafts.map((d) => {
            const statusCol =
              STATUS_COLUMNS.find((c) => c.id === d.status) || STATUS_COLUMNS[1];

            return (
              <Card
                key={d.draft_id}
                hoverEffect
                onClick={() => handleOpenEdit(d)}
                className="p-4 flex items-center justify-between cursor-pointer gap-4"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <PlatformBadge platform={d.platform} />
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-[#1F2430] dark:text-white truncate">
                      {d.title}
                    </h4>
                    {d.hook && (
                      <p className="text-xs text-[#5B6475] dark:text-[#94A3B8] truncate italic mt-0.5">
                        "{d.hook}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusCol.color}`}>
                    {statusCol.label}
                  </span>
                  <button
                    onClick={(e) => handleDelete(d.draft_id, e)}
                    className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Slide-over: Read & Edit Draft Panel */}
      <SlideOver
        isOpen={Boolean(editingDraft)}
        onClose={() => setEditingDraft(null)}
        title="Edit Content Draft"
        subtitle={`Platform: ${editingDraft?.platform?.toUpperCase()}`}
        footer={
          <div className="flex justify-between items-center w-full">
            <button
              onClick={() => handleDelete(editingDraft?.draft_id)}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
            <div className="flex space-x-2">
              <Button variant="secondary" size="sm" onClick={() => setEditingDraft(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        }
      >
        {editingDraft && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8] mb-1.5">
                Draft Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] rounded-xl px-3 py-2 text-xs text-[#1F2430] dark:text-white focus:outline-none focus:border-[#5B5BD6]"
              >
                <option value="idea">Idea Backlog</option>
                <option value="drafted">Writing Draft</option>
                <option value="scheduled">Scheduled for Release</option>
                <option value="published">Published Live</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8] mb-1.5">
                Post Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] rounded-xl px-3 py-2 text-xs text-[#1F2430] dark:text-white focus:outline-none focus:border-[#5B5BD6]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8] mb-1.5">
                Opening Hook / Notes
              </label>
              <textarea
                rows={4}
                value={editHook}
                onChange={(e) => setEditHook(e.target.value)}
                className="w-full bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] rounded-xl p-3 text-xs text-[#1F2430] dark:text-white focus:outline-none focus:border-[#5B5BD6] leading-relaxed"
              />
            </div>

            {editingDraft.tags && editingDraft.tags.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#94A3B8] mb-1.5">
                  Tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {editingDraft.tags.map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-[#FAF9F6] dark:bg-[#131825] border border-[#E8E6DF] dark:border-[#232B3E] text-[11px] text-[#5B6475] dark:text-slate-300 font-mono"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SlideOver>
    </div>
  );
}
