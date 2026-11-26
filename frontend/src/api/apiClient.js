/**
 * creatorPulse - Centralized Frontend API Client
 * ---------------------------------------------------
 * Focused strictly on VibeCheck AI – Social Media Sentiment Analysis
 * and Machine Learning Model Evaluation.
 */

const rawBaseUrl = import.meta.env.VITE_API_URL || '';
const BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

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

// ----------------- System & Health -----------------
export const getHealth = () =>
  request('/api/health');

// ----------------- VibeCheck AI Endpoints -----------------
export const getVibeCheckStatus = () =>
  request('/api/vibecheck/status');

export const getSupportedPlatforms = () =>
  request('/api/vibecheck/supported-platforms');

export const analyzeVibe = (payload) =>
  request('/api/vibecheck/analyze', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getVibeCheckHistory = () =>
  request('/api/vibecheck/history');

export const deleteVibeCheckReport = (reportId) =>
  request(`/api/vibecheck/history/${reportId}`, {
    method: 'DELETE',
  });

// ----------------- ML Models Comparison -----------------
export const getMlModelsComparison = () =>
  request('/api/vibecheck/models');
