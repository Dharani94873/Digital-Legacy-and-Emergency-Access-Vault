import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import AuditLog from '@/models/AuditLog';
import { auth } from '@/lib/auth';

// GET /api/admin/logs — admin view of all audit logs
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const page   = parseInt(searchParams.get('page')  ?? '1', 10);
    const limit  = parseInt(searchParams.get('limit') ?? '50', 10);
    const action = searchParams.get('action') ?? '';

    const query: Record<string, unknown> = {};
    if (action) query.action = { $regex: action, $options: 'i' };

    const skip  = (page - 1) * limit;
    const total = await AuditLog.countDocuments(query);
    const logs  = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        items: logs.map((l) => ({ ...l, _id: l._id.toString() })),
        total,
        page,
        limit,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error('[Admin Logs]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
