// Base API URL used across all fetch calls.
// Do NOT include a trailing slash or any path segment like /api/admin —
// each consumer appends its own path (e.g. /products, /admin/users).
const getBaseUrl = () => {
  const railway = import.meta.env.VITE_API_URL_RAILWAY;
  const local = import.meta.env.VITE_API_URL;
  const configuredUrls = [railway, local].filter(
    (value) => value && value !== 'undefined',
  );
  const usableUrl = configuredUrls.find(
    (value) =>
      !import.meta.env.PROD ||
      !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(value),
  );

  if (usableUrl) return usableUrl;
  return import.meta.env.PROD ? 'https://nexora-d0en.onrender.com' : 'http://localhost:5000';
};

const API_BASE_URL = `${getBaseUrl()}/api`;

export default API_BASE_URL;