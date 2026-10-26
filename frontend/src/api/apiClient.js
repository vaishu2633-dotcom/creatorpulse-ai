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
export const getDashboardSummary = (platform = 'all') =>
  request(`/api/dashboard/summary?platform=${platform}`);

export const getSnapshots = (platform = 'all', days = 30) =>
  request(`/api/dashboard/snapshots?platform=${platform}&days=${days}`);

export const getRecentPosts = (platform = 'all', postType = 'all', limit = 20) =>
  request(`/api/dashboard/posts?platform=${platform}&post_type=${postType}&limit=${limit}`);

export const getTopPosts = (platform = 'all', limit = 5) =>
  request(`/api/dashboard/top-posts?platform=${platform}&limit=${limit}`);

export const getBottomPosts = (platform = 'all', limit = 5) =>
  request(`/api/dashboard/bottom-posts?platform=${platform}&limit=${limit}`);

export const getCreators = (platform = 'all') =>
  request(`/api/dashboard/creators?platform=${platform}`);

// ----------------- Trends -----------------
export const getTrends = (platform = 'all', timeWindow = 'all') =>
  request(`/api/trends?platform=${platform}&time_window=${timeWindow}`);

// ----------------- Prediction -----------------
export const predictPost = (payload) =>
  request('/api/prediction/predict', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getPredictionHistory = (platform = 'all', limit = 50) =>
  request(`/api/prediction/history?platform=${platform}&limit=${limit}`);

export const getAccuracyScoreboard = (platform = 'all') =>
  request(`/api/prediction/scoreboard?platform=${platform}`);

// ----------------- Content Studio -----------------
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
