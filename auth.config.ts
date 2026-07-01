import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe auth config — NO Node.js imports (no mongoose, no bcrypt).
 * Used ONLY by middleware.ts which runs on the Vercel Edge Runtime.
 * The actual Credentials authorize() logic lives in lib/auth.ts (Node.js runtime only).
 */
export const authConfig: NextAuthConfig = {
  providers: [],   // Credentials provider added in lib/auth.ts

  session: { strategy: 'jwt' },

  pages: {
    signIn: '/auth/login',
    error:  '/auth/login',
  },

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isApiRoute = nextUrl.pathname.startsWith('/api');
      const isPublicPath = nextUrl.pathname === '/' || nextUrl.pathname.startsWith('/docs');
      
      // Auth routes (login, register)
      const authPaths = ['/auth/login', '/auth/register', '/auth/forgot-password'];
      const isAuthRoute = authPaths.some(p => nextUrl.pathname.startsWith(p));
      
      if (isAuthRoute) {
        if (isLoggedIn) {
          const role = (auth.user as { role?: string }).role || 'owner';
          return Response.redirect(new URL(`/${role}/dashboard`, nextUrl));
        }
        return true;
      }

      if (isApiRoute) return true;
      if (isPublicPath) return true;

      // Protect /owner/* routes
      const role = (auth?.user as { role?: string })?.role;

      if (nextUrl.pathname.startsWith('/owner')) {
        if (!isLoggedIn) return Response.redirect(new URL('/auth/login', nextUrl));
        if (role !== 'owner') return Response.redirect(new URL('/unauthorized', nextUrl));
      }

      // Protect /nominee/* routes
      if (nextUrl.pathname.startsWith('/nominee')) {
        if (!isLoggedIn) return Response.redirect(new URL('/auth/login', nextUrl));
        if (role !== 'nominee') return Response.redirect(new URL('/unauthorized', nextUrl));
      }

      // Protect /admin/* routes
      if (nextUrl.pathname.startsWith('/admin')) {
        if (!isLoggedIn) return Response.redirect(new URL('/auth/login', nextUrl));
        if (role !== 'admin') return Response.redirect(new URL('/unauthorized', nextUrl));
      }

      return true;
    },

    jwt({ token, user }) {
      if (user) {
        token.id   = (user as { id?: string }).id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },

    session({ session, token }) {
      if (token && session.user) {
        (session.user as { id?: string; role?: string }).id   = token.id as string;
        (session.user as { id?: string; role?: string }).role = token.role as string;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
