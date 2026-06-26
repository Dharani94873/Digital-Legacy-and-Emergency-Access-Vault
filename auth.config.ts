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
    signIn: '/login',
    error:  '/login',
  },

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as { role?: string } | undefined)?.role;
      const path = nextUrl.pathname;

      // Redirect authenticated users away from auth pages
      const authPaths = ['/login', '/register', '/forgot-password'];
      if (authPaths.some((p) => path.startsWith(p)) && isLoggedIn) {
        return Response.redirect(new URL(`/${role}/dashboard`, nextUrl));
      }

      // Protect /owner/* routes
      if (path.startsWith('/owner')) {
        if (!isLoggedIn) return Response.redirect(new URL('/login', nextUrl));
        if (role !== 'owner') return Response.redirect(new URL('/unauthorized', nextUrl));
      }

      // Protect /nominee/* routes
      if (path.startsWith('/nominee')) {
        if (!isLoggedIn) return Response.redirect(new URL('/login', nextUrl));
        if (role !== 'nominee') return Response.redirect(new URL('/unauthorized', nextUrl));
      }

      // Protect /admin/* routes
      if (path.startsWith('/admin')) {
        if (!isLoggedIn) return Response.redirect(new URL('/login', nextUrl));
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
