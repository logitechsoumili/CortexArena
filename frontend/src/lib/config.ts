/**
 * Central backend URL configuration.
 *
 * NEXT_PUBLIC_BACKEND_URL must be injected at build time via:
 *   gcloud builds submit --build-arg NEXT_PUBLIC_BACKEND_URL=https://your-backend.run.app
 *
 * For local dev, set it in frontend/.env.local:
 *   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
 */

const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!rawBackendUrl) {
  console.warn(
    "[config] NEXT_PUBLIC_BACKEND_URL is not set. " +
    "WebSocket and API calls will fail in production. " +
    "Set it in .env.local for local dev."
  );
} else if (typeof window !== "undefined") {
  console.log(`[config] Backend URL detected: ${rawBackendUrl}`);
}

/** HTTP base URL for REST API calls */
export const API_BASE = rawBackendUrl ?? "http://localhost:8000";

/**
 * WebSocket base URL.
 * Converts http → ws and https → wss automatically.
 * e.g. https://backend.run.app → wss://backend.run.app
 */
export const WS_BASE = API_BASE.replace(/^http/, "ws");
