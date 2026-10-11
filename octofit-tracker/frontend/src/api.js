// Codespace names only contain letters, digits, and hyphens; anything else falls back to localhost.
const codespaceName = (import.meta.env.VITE_CODESPACE_NAME ?? '').trim();

export const API_BASE_URL = /^[a-z0-9-]+$/i.test(codespaceName)
  ? `https://${codespaceName}-8000.app.github.dev`
  : 'http://localhost:8000';

// Accepts a plain array or a paginated payload such as { count, next, results: [...] }.
export function normalizeList(data) {
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data?.results)) {
    return data.results;
  }
  return [];
}
