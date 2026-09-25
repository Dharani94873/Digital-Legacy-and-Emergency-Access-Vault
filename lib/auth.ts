import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { authConfig } from '@/auth.config';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';
import { UserRole } from '@/types';

/**
 * Full server-side NextAuth config — extends the edge-safe authConfig.
 * Adds the Credentials provider which requires bcrypt + mongoose (Node.js only).
 * Used in API route handlers (not in middleware).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:        { label: 'Email or Username', type: 'text' },
        password:     { label: 'Password',          type: 'password' },
        expectedRole: { label: 'Role',              type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectToDatabase();

        const identifier = (credentials.email as string).trim().toLowerCase();

        const user = await User.findOne({
          $or: [
            { email: identifier },
            { username: identifier },
          ],
          isActive:    true,
          isSuspended: false,
        }).lean();

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash,
        );
        if (!isValid) return null;

        // Verify role matches selected portal (admin can log in anywhere)
        const expectedRole = credentials.expectedRole as string | undefined;
        if (expectedRole && user.role !== 'admin' && user.role !== expectedRole) {
          throw new Error(`ROLE_MISMATCH:${user.role}`);
        }

        const profile = await Profile.findOne({ userId: user._id.toString() }).lean();

        return {
          id:    user._id.toString(),
          email: user.email,
          role:  user.role as UserRole,
          name:  profile?.fullName ?? user.username ?? user.email,
          image: profile?.avatarUrl ?? null,
        };
      },
    }),
  ],
});
