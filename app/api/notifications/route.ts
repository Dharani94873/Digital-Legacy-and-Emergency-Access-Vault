import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAuth, isNextResponse, successResponse, errorResponse } from '@/lib/utils';
import Notification from '@/models/Notification';

// GET /api/notifications — list notifications for authenticated user
export async function GET(request: NextRequest) {
  const auth = await requireAuth(['owner', 'nominee']);
  if (isNextResponse(auth)) return auth;
  const { userId } = auth;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
    const limit = Math.min(50,  parseInt(searchParams.get('limit') ?? '20'));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { userId };
    if (unreadOnly) filter.isRead = false;

    const [items, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    return successResponse({ items, total, page, limit, unreadCount });
  } catch (error) {
    console.error('[GET /api/notifications]', error);
    return errorResponse('Failed to fetch notifications');
  }
}

// PATCH /api/notifications — mark notifications as read
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(['owner', 'nominee']);
  if (isNextResponse(auth)) return auth;
  const { userId } = auth;

  try {
    await connectToDatabase();
    const body = await request.json();
    const { ids, markAll } = body as { ids?: string[]; markAll?: boolean };

    if (markAll) {
      await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    } else if (ids?.length) {
      await Notification.updateMany(
        { _id: { $in: ids }, userId },
        { isRead: true },
      );
    }

    return successResponse({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('[PATCH /api/notifications]', error);
    return errorResponse('Failed to update notifications');
  }
}
