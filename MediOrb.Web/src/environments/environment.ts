/**
 * MediOrb runtime environment config.
 *
 * A single file with a hostname check is used instead of the
 * environment.ts / environment.prod.ts swap pattern because
 * angular.json has no fileReplacements block configured.
 *
 * ⚠️  SignalR note:
 *   Vercel rewrites only proxy HTTP/HTTPS traffic.
 *   WebSocket connections (wss://) are NOT proxied by Vercel.
 *   Therefore signalrUrl must point directly at the Render backend
 *   in production — it cannot go through /api/* rewrite.
 */

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');

export const environment = {
  production: !isLocalhost,

  /**
   * Base URL for all REST API calls.
   * - Dev:  direct to local .NET backend
   * - Prod: relative /api path, proxied to Render via vercel.json rewrite
   */
  apiUrl: isLocalhost ? 'http://localhost:5001/api' : '/api',

  /**
   * SignalR hub URL.
   * - Dev:  direct to local .NET backend
   * - Prod: direct to Render (Vercel cannot proxy WebSockets)
   */
  signalrUrl: isLocalhost
    ? 'http://localhost:5001/hubs/patients'
    : 'https://mediorb.onrender.com/hubs/patients',
};
