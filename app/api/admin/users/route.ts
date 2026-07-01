import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';
import { auth } from '@/lib/auth';

// GET /api/admin/users — list all users with pagination
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const page  = parseInt(searchParams.get('page')  ?? '1', 10);
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
    const search = searchParams.get('search') ?? '';
    const role  = searchParams.get('role') ?? '';

    const query: Record<string, unknown> = {};
    if (search) query.email = { $regex: search, $options: 'i' };
    if (role)   query.role  = role;

    const skip  = (page - 1) * limit;
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Attach profiles
    const userIds = users.map((u) => u._id.toString());
    const profiles = await Profile.find({ userId: { $in: userIds } }).lean();
    const profileMap = Object.fromEntries(profiles.map((p) => [p.userId, p]));

    const enriched = users.map((u) => ({
      ...u,
      _id: u._id.toString(),
      profile: profileMap[u._id.toString()] ?? null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: enriched,
        total,
        page,
        limit,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error('[Admin Users GET]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/users — suspend or activate a user
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();
    const body = await request.json();
    const { userId, action } = body; // action: 'suspend' | 'activate'

    if (!userId || !['suspend', 'activate'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { isSuspended: action === 'suspend' },
      { new: true }
    ).select('-passwordHash').lean();

    if (!updated) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { ...updated, _id: updated._id.toString() } });
  } catch (error) {
    console.error('[Admin Users PATCH]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
