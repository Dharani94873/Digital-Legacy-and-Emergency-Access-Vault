import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAuth, isNextResponse, successResponse, errorResponse, logAudit, createNotification } from '@/lib/utils';
import EmergencyRequest from '@/models/EmergencyRequest';
import Nominee from '@/models/Nominee';
import Profile from '@/models/Profile';

// POST /api/emergency/[id]/reject
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAuth(['owner', 'nominee']);
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
    const [nomineeProfile, ownerProfile] = await Promise.all([
      nominee?.nomineeUserId ? Profile.findOne({ userId: nominee.nomineeUserId }).lean() : null,
      Profile.findOne({ userId }).lean(),
    ]);

    // Notify nominee in-app only
    if (nominee?.nomineeUserId) {
      await createNotification({
        userId:            nominee.nomineeUserId,
        type:              'emergency.rejected',
        title:             'Emergency Access Declined',
        message:           `${ownerProfile?.fullName ?? 'The owner'} has declined your emergency access request. Please contact them directly if you believe this is an error.`,
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
      targetUserId: nominee?.nomineeUserId ?? undefined,
    });

    return successResponse({
      message:     'Emergency access request rejected',
      nomineeName: nomineeProfile?.fullName ?? 'Nominee',
    });
  } catch (error) {
    console.error('[POST /api/emergency/[id]/reject]', error);
    return errorResponse('Failed to reject request');
  }
}
