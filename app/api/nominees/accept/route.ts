import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Nominee from '@/models/Nominee';
import User from '@/models/User';
import Profile from '@/models/Profile';

// POST /api/nominees/accept?token=xxx
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Invitation token is required' }, { status: 400 });
    }

    await connectToDatabase();

    const nominee = await Nominee.findOne({ invitationToken: token });
    if (!nominee) {
      return NextResponse.json({ success: false, error: 'Invalid or expired invitation token' }, { status: 404 });
    }

    if (nominee.status !== 'pending') {
      return NextResponse.json({ success: false, error: 'This invitation has already been used or revoked' }, { status: 409 });
    }

    const body = await request.json();
    const { userId } = body; // The registered/logged-in nominee user ID

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required to accept invitation' }, { status: 400 });
    }

    // Verify the user exists and email matches
    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (user.email !== nominee.nomineeEmail) {
      return NextResponse.json({ success: false, error: 'Email address does not match the invitation' }, { status: 403 });
    }

    // Accept the invitation
    nominee.nomineeUserId = userId;
    nominee.status = 'active';
    nominee.acceptedAt = new Date();
    nominee.invitationToken = ''; // Invalidate token
    await nominee.save();

    // Update user role to nominee if they were an owner-only user
    await User.findByIdAndUpdate(userId, { role: 'nominee' });

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      data: { nomineeId: nominee._id.toString() },
    });
  } catch (error) {
    console.error('[Nominees Accept]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
