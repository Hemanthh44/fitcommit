/**
 * FitCommit Centralized Frontend API & Application Configuration
 *
 * Consumes environment variables:
 * - VITE_API_URL: Backend REST API base endpoint (e.g. https://fitcommit-api.onrender.com/api)
 * - VITE_APP_URL: Public domain of the frontend app (e.g. https://fitcommit.vercel.app)
 */

// 1. Centralized API Base URL for all HTTP requests
export const API_BASE_URL = (() => {
  // If an explicit external production API URL is set (not localhost:5000), use it
  if (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost:5000')) {
    let custom = import.meta.env.VITE_API_URL.trim().replace(/\/$/, '');
    if (custom.startsWith('http://') || custom.startsWith('https://')) {
      return custom.endsWith('/api') ? custom : `${custom}/api`;
    }
    // If relative path like '/api'
    if (typeof window !== 'undefined') {
      const pathPart = custom.endsWith('/api') ? custom : (custom ? `${custom}/api` : '/api');
      return `${window.location.origin}${pathPart.startsWith('/') ? '' : '/'}${pathPart}`;
    }
  }

  // Running in browser:
  // Using `${window.location.origin}/api` works across ALL networks:
  // - Local dev on PC: http://localhost:5173/api -> proxied by Vite to port 5000
  // - Local Wi-Fi on Phone: http://172.16.210.219:5173/api -> proxied by Vite to port 5000
  // - Public Tunnel (Cellular 4G/5G): https://xyz.loca.lt/api -> proxied by Vite to port 5000
  // - Production domain: https://fitcommit.example.com/api
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }

  // Node.js / SSR fallback
  return 'http://localhost:5000/api';
})();

// 2. Centralized Frontend Application Base URL (Encoded into entrance QR codes)
export const APP_BASE_URL = (() => {
  if (import.meta.env.VITE_APP_URL) {
    const custom = import.meta.env.VITE_APP_URL.replace(/\/$/, '');
    if (custom) return custom;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:5173';
})();

// Canonical Gym Identifier Code
export const DEFAULT_GYM_ID = 'FITCOMMIT-GYM-001';

/**
 * Builds the canonical Gym Check-In URL encoded into the physical entrance QR code
 * Example: https://fitcommit.example.com/gym/check-in?gym=FITCOMMIT-GYM-001
 *
 * @param {string} gymId Gym identifier
 * @returns {string} Fully-qualified HTTPS/HTTP URL
 */
export function getGymCheckInUrl(gymId = DEFAULT_GYM_ID) {
  return `${APP_BASE_URL}/gym/check-in?gym=${encodeURIComponent(gymId)}`;
}
