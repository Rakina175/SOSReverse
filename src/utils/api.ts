/**
 * Resolves a relative API path to an absolute URL if VITE_API_URL is configured.
 * This is crucial for mobile devices (APKs) running the app natively,
 * as they cannot resolve relative endpoints (like /api/...) to the host machine.
 */
export const getApiUrl = (path: string): string => {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  if (!baseUrl) {
    return path;
  }
  // Strip trailing slash from baseUrl and leading slash from path to prevent double slash
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
};
