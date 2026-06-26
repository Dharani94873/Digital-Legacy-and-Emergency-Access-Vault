import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ApiResponse, UserRole } from '@/types';

/**
 * Helper to extract the authenticated session from a request.
 * Returns null if unauthenticated.
 */
export async function getAuthSession() {
  const session = await auth();
  return session;
}

/**
 * Verify the request is authenticated and that the user has one of the allowed roles.
 * Returns a 401/403 NextResponse on failure, or null on success.
 */
export async function requireAuth(
  allowedRoles: UserRole[],
): Promise<{ userId: string; role: UserRole; email: string } | NextResponse> {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }

  const user = session.user as { id: string; role: UserRole; email: string };

  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Forbidden' },
      { status: 403 },
    );
  }

  return { userId: user.id, role: user.role, email: user.email };
}

export function isNextResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

/**
 * Standardized success response.
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json<ApiResponse<T>>({ success: true, data }, { status });
}

/**
 * Standardized error response.
 */
export function errorResponse(message: string, status = 500): NextResponse {
  return NextResponse.json<ApiResponse>({ success: false, error: message }, { status });
}

/**
 * Log an audit event.
 */
export async function logAudit(params: {
  actorId: string;
  actorRole: UserRole;
  action: string;
  resourceType: string;
  resourceId?: string;
  targetUserId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    const { default: AuditLog } = await import('@/models/AuditLog');
    await AuditLog.create({
      ...params,
      timestamp: new Date(),
    });
  } catch (e) {
    console.error('[AuditLog] Failed to write audit log:', e);
  }
}

/**
 * Create an in-app notification.
 */
export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}) {
  try {
    const { default: Notification } = await import('@/models/Notification');
    await Notification.create(params);
  } catch (e) {
    console.error('[Notification] Failed to create notification:', e);
  }
}
