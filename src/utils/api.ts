/**
 * Resolves a relative API path to an absolute URL if VITE_API_URL is configured.
 * This is crucial for mobile devices (APKs) running the app natively,
 * as they cannot resolve relative endpoints (like /api/...) to the host machine.
 */
export const getApiUrl = (path: string): string => {
  let baseUrl = import.meta.env.VITE_API_URL || '';

  // If running in a web browser (not Capacitor native webview container),
  // automatically resolve to the active hostname on port 5000.
  // This prevents network failures if the host machine's IP address changes.
  if (typeof window !== 'undefined' && window.location) {
    const isMobileContainer = window.location.origin.includes('capacitor://') || 
                              window.location.origin.includes('ionic://') ||
                              window.location.origin.includes('localhost:80'); // standard native port check
    if (!isMobileContainer) {
      baseUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
    }
  }

  if (!baseUrl) {
    return path;
  }
  
  // Strip trailing slash from baseUrl and leading slash from path to prevent double slash
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
};
