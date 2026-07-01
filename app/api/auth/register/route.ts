import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';
import Settings from '@/models/Settings';
import Nominee from '@/models/Nominee';
import { registerSchema } from '@/lib/validators';
import { sendEmail, welcomeEmail, APP_URL } from '@/lib/resend';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Validate input
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { email, password, fullName, invitationToken } = parsed.data;

    // Check for existing user
    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // If invitation token is provided, validate it and determine role
    let role: 'owner' | 'nominee' = 'owner';
    let nomineeDoc = null;

    if (invitationToken) {
      nomineeDoc = await Nominee.findOne({ invitationToken, status: 'pending' });
      if (!nomineeDoc) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid or expired invitation token' },
          { status: 400 },
        );
      }
      // Verify the email matches the invitation
      if (nomineeDoc.nomineeEmail !== email.toLowerCase()) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Email does not match the invitation' },
          { status: 400 },
        );
      }
      role = 'nominee';
    }

    // Create user
    const user = await User.create({
      email,
      passwordHash,
      role,
      isActive: true,
      isSuspended: false,
      emailVerified: false,
    });

    // Create profile
    await Profile.create({ userId: user._id.toString(), fullName });

    // Create default settings
    await Settings.create({ userId: user._id.toString() });

    // Link nominee record if applicable
    if (nomineeDoc) {
      nomineeDoc.nomineeUserId = user._id.toString();
      nomineeDoc.status = 'active';
      nomineeDoc.acceptedAt = new Date();
      nomineeDoc.invitationToken = crypto.randomBytes(32).toString('hex'); // invalidate old token
      await nomineeDoc.save();
    }

    // Send welcome email (non-blocking)
    const { subject, html } = welcomeEmail({
      userName: fullName,
      dashboardUrl: `${APP_URL}/${role}/dashboard`,
    });
    sendEmail({ to: email, subject, html }).catch(console.error);

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Account created successfully' },
      { status: 201 },
    );
  } catch (error) {
    console.error('[POST /api/auth/register]', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error instanceof Error ? `DB/Server Error: ${error.message}` : 'Internal server error' },
      { status: 500 },
    );
  }
}
