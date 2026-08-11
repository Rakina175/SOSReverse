/**
 * Resolves a relative API path to the correct backend URL.
 *
 * Local development:
 *   /api/... -> http://localhost:5000/api/...
 *
 * Production:
 *   Uses VITE_API_URL configured in the production environment.
 *
 * Mobile/native:
 *   Uses VITE_API_URL when provided.
 */

export const getApiUrl = (path: string): string => {
  // Use explicitly configured API URL first.
  const configuredApiUrl =
    import.meta.env.VITE_API_URL?.trim() || "";

  let baseUrl = configuredApiUrl;

  // If no API URL is configured and this is running in a normal web browser,
  // use the local backend during development.
  if (
    !baseUrl &&
    typeof window !== "undefined" &&
    window.location
  ) {
    const hostname = window.location.hostname;

    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0";

    const isNativeContainer =
      window.location.origin.startsWith("capacitor://") ||
      window.location.origin.startsWith("ionic://");

    if (isLocalhost && !isNativeContainer) {
      baseUrl = `${window.location.protocol}//${hostname}:5000`;
    }
  }

  // If there is still no base URL, keep the path relative.
  if (!baseUrl) {
    return path;
  }

  // Remove trailing slash from base URL.
  const cleanBase = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;

  // Ensure path starts with /.
  const cleanPath = path.startsWith("/")
    ? path
    : `/${path}`;

  return `${cleanBase}${cleanPath}`;
};