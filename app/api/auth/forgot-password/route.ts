import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { sendEmail, passwordResetEmail, APP_URL } from '@/lib/resend';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET ?? 'fallback_secret';

// POST /api/auth/forgot-password — send password reset email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Always respond with success to avoid user enumeration
    const user = await User.findOne({ email: email.toLowerCase().trim() }).lean();

    if (user) {
      // Generate a signed JWT token (1 hour expiry)
      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email, type: 'password_reset' },
        JWT_SECRET,
        { expiresIn: '1h' },
      );

      const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;

      const { subject, html } = passwordResetEmail({
        userName: user.email.split('@')[0],
        resetUrl,
      });

      // Fire-and-forget — we don't want to leak timing info
      sendEmail({ to: user.email, subject, html }).catch(console.error);
    }

    // Always return success (prevents email enumeration)
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    console.error('[POST /api/auth/forgot-password]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
