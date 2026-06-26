import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAuth, isNextResponse, successResponse, errorResponse } from '@/lib/utils';
import AuditLog from '@/models/AuditLog';

// GET /api/audit — paginated audit logs for the authenticated user
export async function GET(request: NextRequest) {
  const auth = await requireAuth(['owner', 'nominee', 'admin']);
  if (isNextResponse(auth)) return auth;
  const { userId, role } = auth;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const page   = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
    const limit  = Math.min(100, parseInt(searchParams.get('limit') ?? '20'));
    const action = searchParams.get('action');
    const from   = searchParams.get('from');
    const to     = searchParams.get('to');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (role === 'admin') {
      // Admin can see all logs but never document content
      if (searchParams.get('userId')) filter.actorId = searchParams.get('userId');
    } else {
      filter.actorId = userId;
    }

    if (action) filter.action = { $regex: action, $options: 'i' };
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to)   filter.timestamp.$lte = new Date(to);
    }

    const [items, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return successResponse({ items, total, page, limit, hasMore: page * limit < total });
  } catch (error) {
    console.error('[GET /api/audit]', error);
    return errorResponse('Failed to fetch audit logs');
  }
}
