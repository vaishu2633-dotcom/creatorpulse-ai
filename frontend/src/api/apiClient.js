/**
 * CreatorPulse AI - Centralized Frontend API Client
 * ---------------------------------------------------
 * All backend communications pass through these typed wrapper functions.
 * Fallbacks and friendly error objects prevent silent UI failures.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.detail || `Server returned ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'} ${url}]:`, err);
    throw err;
  }
}

// ----------------- Dashboard -----------------
export const getDashboardSummary = (platform = 'all', days = null) => {
  const q = new URLSearchParams({ platform });
  if (days) q.append('days', days);
  return request(`/api/dashboard/summary?${q.toString()}`);
};

export const getSnapshots = (platform = 'all', days = 30) =>
  request(`/api/dashboard/snapshots?platform=${platform}&days=${days}`);

export const getRecentPosts = (platform = 'all', postType = 'all', limit = 20, sortBy = 'published_at', descending = true, days = null) => {
  const q = new URLSearchParams({
    platform,
    post_type: postType,
    limit: String(limit),
    sort_by: sortBy,
    descending: String(descending)
  });
  if (days) q.append('days', String(days));
  return request(`/api/dashboard/posts?${q.toString()}`);
};

export const getTopPosts = (platform = 'all', days = null, limit = 5) => {
  const q = new URLSearchParams({ platform, limit: String(limit) });
  if (days) q.append('days', String(days));
  return request(`/api/dashboard/top-posts?${q.toString()}`);
};

export const getBottomPosts = (platform = 'all', days = null, limit = 5) => {
  const q = new URLSearchParams({ platform, limit: String(limit) });
  if (days) q.append('days', String(days));
  return request(`/api/dashboard/bottom-posts?${q.toString()}`);
};

export const getCreators = (platform = 'all') =>
  request(`/api/dashboard/creators?platform=${platform}`);

// ----------------- Reports -----------------
export const getReportsAnalytics = (platform = 'all', days = null, sortBy = 'published_at', descending = true, limit = 50) => {
  const q = new URLSearchParams({
    platform,
    sort_by: sortBy,
    descending: String(descending),
    limit: String(limit)
  });
  if (days) q.append('days', String(days));
  return request(`/api/reports/analytics?${q.toString()}`);
};

export const getReportsCsvExportUrl = (platform = 'all', days = null) => {
  const q = new URLSearchParams({ platform });
  if (days) q.append('days', String(days));
  return `/api/reports/export/csv?${q.toString()}`;
};

// ----------------- Trends -----------------
export const getTrends = (platform = 'all', timeWindow = 'all', region = 'all') => {
  let url = `/api/trends?platform=${platform}&time_window=${timeWindow}`;
  if (region && region !== 'all') url += `&region=${region}`;
  return request(url);
};

// ----------------- Prediction -----------------
export const predictPost = (payload) =>
  request('/api/prediction/predict', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const predictWhatIf = (payload) =>
  request('/api/prediction/what-if', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const retrainModel = () =>
  request('/api/prediction/retrain', {
    method: 'POST',
  });

export const getModelInfo = () =>
  request('/api/prediction/model-info');

export const getPredictionHistory = (platform = 'all', limit = 50) =>
  request(`/api/prediction/history?platform=${platform}&limit=${limit}`);

export const getAccuracyScoreboard = (platform = 'all') =>
  request(`/api/prediction/scoreboard?platform=${platform}`);

export const recordPredictionOutcome = (predictionId, payload) =>
  request(`/api/prediction/actual/${predictionId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const syncYouTubePredictionOutcomes = () =>
  request('/api/prediction/sync-youtube-outcomes', {
    method: 'POST',
  });

// ----------------- Content Studio -----------------
export const getContentStudioStatus = () => request('/api/content/status');

export const generateContent = (payload) =>
  request('/api/content/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const runIdeaTournament = (payload) =>
  request('/api/content/tournament', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// ----------------- Drafts & Calendar -----------------
export const getDrafts = (platform = 'all', status = 'all') =>
  request(`/api/drafts?platform=${platform}&status=${status}`);

export const createDraft = (draft) =>
  request('/api/drafts', {
    method: 'POST',
    body: JSON.stringify(draft),
  });

export const updateDraft = (draftId, updates) =>
  request(`/api/drafts/${draftId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });

export const deleteDraft = (draftId) =>
  request(`/api/drafts/${draftId}`, {
    method: 'DELETE',
  });

// ----------------- Comments -----------------
export const getComments = (platform = 'all', sentiment = 'all', theme = 'all', isQuestion = null) => {
  let query = `/api/comments?platform=${platform}&sentiment=${sentiment}&theme=${theme}`;
  if (isQuestion !== null) query += `&is_question=${isQuestion}`;
  return request(query);
};

export const getCommentsSummary = (platform = 'all') =>
  request(`/api/comments/summary?platform=${platform}`);

// ----------------- ML Performance Lab -----------------
export const getMlResults = () =>
  request('/api/ml/results');

// ----------------- Settings & Integrations -----------------
export const getIntegrations = () =>
  request('/api/settings/integrations');

export const getHealth = () =>
  request('/api/health');

// ----------------- VibeCheck AI -----------------
export const getVibeCheckStatus = () =>
  request('/api/vibecheck/status');

export const analyzeVibe = (payload) =>
  request('/api/vibecheck/analyze', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getVibeCheckHistory = () =>
  request('/api/vibecheck/history');

export const getVibeCheckReportById = (reportId) =>
  request(`/api/vibecheck/history/${reportId}`);

export const deleteVibeCheckReport = (reportId) =>
  request(`/api/vibecheck/history/${reportId}`, {
    method: 'DELETE',
  });

// ----------------- Competitor Analysis -----------------
export const getCompetitorSummary = () =>
  request('/api/competitors/summary');

export const addCompetitor = (payload) =>
  request('/api/competitors/add', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const deleteCompetitor = (compId) =>
  request(`/api/competitors/${compId}`, {
    method: 'DELETE',
  });
