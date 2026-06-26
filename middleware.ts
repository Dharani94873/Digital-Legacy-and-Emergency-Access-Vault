import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

/**
 * Middleware uses ONLY the edge-safe authConfig (no mongoose, no bcrypt).
 * Route protection logic lives inside authConfig.callbacks.authorized.
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
