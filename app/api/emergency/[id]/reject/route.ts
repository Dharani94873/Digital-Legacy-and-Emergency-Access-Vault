import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAuth, isNextResponse, successResponse, errorResponse, logAudit, createNotification } from '@/lib/utils';
import { sendEmail, requestRejectedEmail } from '@/lib/resend';
import EmergencyRequest from '@/models/EmergencyRequest';
import Nominee from '@/models/Nominee';
import Profile from '@/models/Profile';
import User from '@/models/User';

// POST /api/emergency/[id]/reject
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAuth(['owner']);
  if (isNextResponse(auth)) return auth;
  const { userId } = auth;

  try {
    await connectToDatabase();

    const emergencyReq = await EmergencyRequest.findOne({
      _id: id,
      ownerId: userId,
      status: 'pending',
    });
    if (!emergencyReq) return errorResponse('Request not found or already resolved', 404);

    emergencyReq.status     = 'rejected';
    emergencyReq.resolvedAt = new Date();
    await emergencyReq.save();

    const nominee = await Nominee.findById(emergencyReq.nomineeId).lean();
    const [nomineeUser, nomineeProfile, ownerProfile] = await Promise.all([
      nominee?.nomineeUserId ? User.findById(nominee.nomineeUserId).lean() : null,
      nominee?.nomineeUserId ? Profile.findOne({ userId: nominee.nomineeUserId }).lean() : null,
      Profile.findOne({ userId }).lean(),
    ]);

    if (nomineeUser) {
      const { subject, html } = requestRejectedEmail({
        nomineeName: nomineeProfile?.fullName ?? nomineeUser.email,
        ownerName:   ownerProfile?.fullName ?? 'The owner',
      });
      sendEmail({ to: nomineeUser.email, subject, html }).catch(console.error);

      await createNotification({
        userId:            nomineeUser._id.toString(),
        type:              'emergency.rejected',
        title:             'Emergency Access Declined',
        message:           `${ownerProfile?.fullName ?? 'The owner'} has declined your emergency access request.`,
        relatedEntityId:   id,
        relatedEntityType: 'emergency_request',
      });
    }

    await logAudit({
      actorId:      userId,
      actorRole:    'owner',
      action:       'emergency.reject',
      resourceType: 'emergency_request',
      resourceId:   id,
      targetUserId: nomineeUser?._id.toString(),
    });

    return successResponse({ message: 'Emergency access request rejected' });
  } catch (error) {
    console.error('[POST /api/emergency/[id]/reject]', error);
    return errorResponse('Failed to reject request');
  }
}
