import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAuth, isNextResponse, successResponse, errorResponse, logAudit, createNotification } from '@/lib/utils';
import { logEmergencyApprovalOnChain } from '@/lib/blockchain';
import EmergencyRequest from '@/models/EmergencyRequest';
import Nominee from '@/models/Nominee';
import Profile from '@/models/Profile';
import BlockchainTransaction from '@/models/BlockchainTransaction';

// POST /api/emergency/[id]/approve
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

    const nominee = await Nominee.findById(emergencyReq.nomineeId);
    if (!nominee) return errorResponse('Nominee not found', 404);

    // Grant access — copy allowed documents/folders to the request record
    emergencyReq.status             = 'approved';
    emergencyReq.resolvedAt         = new Date();
    emergencyReq.grantedDocumentIds = nominee.allowedDocumentIds as string[];
    await emergencyReq.save();

    // Get nominee profile for notification
    const [nomineeProfile, ownerProfile] = await Promise.all([
      nominee.nomineeUserId ? Profile.findOne({ userId: nominee.nomineeUserId }).lean() : null,
      Profile.findOne({ userId }).lean(),
    ]);

    // Notify nominee in-app
    if (nominee.nomineeUserId) {
      await createNotification({
        userId:            nominee.nomineeUserId,
        type:              'emergency.approved',
        title:             '✅ Emergency Access Approved',
        message:           `${ownerProfile?.fullName ?? 'The owner'} has approved your emergency access request. You can now access the authorized documents.`,
        relatedEntityId:   id,
        relatedEntityType: 'emergency_request',
      });
    }

    // Log emergency approval on blockchain (async)
    logEmergencyApprovalOnChain(id, emergencyReq.nomineeId.toString(), userId)
      .then(async (result) => {
        await BlockchainTransaction.create({
          documentId:      emergencyReq.nomineeId,
          ownerId:         userId,
          sha256Hash:      'n/a',
          txHash:          result.txHash,
          blockNumber:     result.blockNumber,
          contractAddress: process.env.CONTRACT_ADDRESS!,
          eventType:       'emergency_approval',
        });
      })
      .catch((e) => console.error('[Blockchain] Emergency approval log failed:', e));

    await logAudit({
      actorId:      userId,
      actorRole:    'owner',
      action:       'emergency.approve',
      resourceType: 'emergency_request',
      resourceId:   id,
      targetUserId: nominee.nomineeUserId ?? undefined,
    });

    return successResponse({
      message:   'Emergency access approved',
      requestId: id,
      nomineeName: nomineeProfile?.fullName ?? 'Nominee',
    });
  } catch (error) {
    console.error('[POST /api/emergency/[id]/approve]', error);
    return errorResponse('Failed to approve request');
  }
}
