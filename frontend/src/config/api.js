// Base API URL used across all fetch calls.
// Do NOT include a trailing slash or any path segment like /api/admin —
// each consumer appends its own path (e.g. /products, /admin/users).
const getBaseUrl = () => {
  const railway = import.meta.env.VITE_API_URL_RAILWAY;
  const local = import.meta.env.VITE_API_URL;
  if (railway && railway !== 'undefined') return railway;
  if (local && local !== 'undefined') return local;
  return 'http://localhost:5000';
};

const API_BASE_URL = `${getBaseUrl()}/api`;

export default API_BASE_URL;