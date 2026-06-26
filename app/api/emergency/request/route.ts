import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAuth, isNextResponse, successResponse, errorResponse, logAudit, createNotification } from '@/lib/utils';
import { emergencyRequestSchema } from '@/lib/validators';
import { sendEmail, emergencyRequestEmail, APP_URL } from '@/lib/resend';
import EmergencyRequest from '@/models/EmergencyRequest';
import Nominee from '@/models/Nominee';
import Profile from '@/models/Profile';
import User from '@/models/User';
import { addDays, format } from 'date-fns';

// POST /api/emergency/request — Nominee submits emergency access request
export async function POST(request: NextRequest) {
  const auth = await requireAuth(['nominee']);
  if (isNextResponse(auth)) return auth;
  const { userId } = auth;

  try {
    await connectToDatabase();
    const body   = await request.json();
    const parsed = emergencyRequestSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

    const { ownerId, reason } = parsed.data;

    // Find the nominee record
    const nominee = await Nominee.findOne({
      nomineeUserId: userId,
      ownerId,
      status: 'active',
    });
    if (!nominee) return errorResponse('You are not an active nominee for this owner', 403);

    // Check for existing pending request
    const existingPending = await EmergencyRequest.findOne({
      nomineeId: nominee._id.toString(),
      ownerId,
      status: 'pending',
    });
    if (existingPending) {
      return errorResponse('You already have a pending emergency request for this owner', 409);
    }

    // Calculate auto-approval date
    const autoApprovalScheduledAt = addDays(new Date(), nominee.waitingPeriodDays);

    const emergencyRequest = await EmergencyRequest.create({
      nomineeId:               nominee._id.toString(),
      ownerId,
      reason,
      status:                  'pending',
      requestedAt:             new Date(),
      autoApprovalScheduledAt,
      ownerNotifiedAt:         new Date(),
    });

    // Get profiles for email
    const [nomineeProfile, ownerUser, ownerProfile] = await Promise.all([
      Profile.findOne({ userId }).lean(),
      User.findById(ownerId).lean(),
      Profile.findOne({ userId: ownerId }).lean(),
    ]);

    // Notify owner via email
    if (ownerUser) {
      const { subject, html } = emergencyRequestEmail({
        ownerName:       ownerProfile?.fullName ?? ownerUser.email,
        nomineeName:     nomineeProfile?.fullName ?? 'Your nominee',
        nomineeEmail:    ownerUser.email,
        reason,
        autoApproveDate: format(autoApprovalScheduledAt, 'MMMM d, yyyy'),
        requestUrl:      `${APP_URL}/owner/requests/${emergencyRequest._id}`,
      });
      sendEmail({ to: ownerUser.email, subject, html }).catch(console.error);
    }

    // In-app notification for owner
    await createNotification({
      userId:              ownerId,
      type:                'emergency.request',
      title:               'Emergency Access Request',
      message:             `${nomineeProfile?.fullName ?? 'A nominee'} has requested emergency access to your documents.`,
      relatedEntityId:     emergencyRequest._id.toString(),
      relatedEntityType:   'emergency_request',
    });

    await logAudit({
      actorId:      userId,
      actorRole:    'nominee',
      action:       'emergency.request',
      resourceType: 'emergency_request',
      resourceId:   emergencyRequest._id.toString(),
      targetUserId: ownerId,
      metadata:     { reason, autoApprovalScheduledAt },
    });

    return successResponse(
      {
        requestId:               emergencyRequest._id.toString(),
        status:                  'pending',
        autoApprovalScheduledAt: autoApprovalScheduledAt.toISOString(),
      },
      201,
    );
  } catch (error) {
    console.error('[POST /api/emergency/request]', error);
    return errorResponse('Failed to submit emergency request');
  }
}

// GET /api/emergency/request — list emergency requests (owner sees all theirs, nominee sees their own)
export async function GET(request: NextRequest) {
  const auth = await requireAuth(['owner', 'nominee']);
  if (isNextResponse(auth)) return auth;
  const { userId, role } = auth;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (status) filter.status = status;

    if (role === 'owner') {
      filter.ownerId = userId;
    } else {
      // Find all nominee records for this user
      const nominees = await Nominee.find({ nomineeUserId: userId }).lean();
      filter.nomineeId = { $in: nominees.map((n) => n._id.toString()) };
    }

    const requests = await EmergencyRequest.find(filter)
      .sort({ requestedAt: -1 })
      .lean();

    return successResponse(requests);
  } catch (error) {
    console.error('[GET /api/emergency/request]', error);
    return errorResponse('Failed to fetch emergency requests');
  }
}
