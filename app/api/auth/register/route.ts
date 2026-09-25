import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';
import Settings from '@/models/Settings';
import { registerSchema } from '@/lib/validators';
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

    const { email, password, fullName, username } = parsed.data;

    // Check for existing email
    const existingByEmail = await User.findOne({ email }).lean();
    if (existingByEmail) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 },
      );
    }

    // Check for existing username
    const existingByUsername = await User.findOne({ username: username.toLowerCase() }).lean();
    if (existingByUsername) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'This username is already taken' },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // All users register as 'owner' by default.
    // They become a nominee by redeeming a secret code from the Nominee dashboard.
    const user = await User.create({
      email,
      username: username.toLowerCase(),
      passwordHash,
      role: 'owner',
      isActive: true,
      isSuspended: false,
    });

    // Create profile
    await Profile.create({ userId: user._id.toString(), fullName });

    // Create default settings
    await Settings.create({ userId: user._id.toString() });

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
