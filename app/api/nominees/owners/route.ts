import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAuth, isNextResponse, successResponse, errorResponse } from '@/lib/utils';
import Nominee from '@/models/Nominee';
import Profile from '@/models/Profile';
import User from '@/models/User';

// GET /api/nominees/owners
export async function GET(request: NextRequest) {
  const auth = await requireAuth(['owner', 'nominee']);
  if (isNextResponse(auth)) return auth;
  const { userId } = auth;

  try {
    await connectToDatabase();

    // Find active nominations where the logged-in user is the nominee
    const nominations = await Nominee.find({
      nomineeUserId: userId,
      status: 'active',
    }).sort({ createdAt: -1 }).lean();

    // Enrich with owner user & profile info
    const enriched = await Promise.all(
      nominations.map(async (n) => {
        const ownerUser = await User.findById(n.ownerId).select('email').lean();
        const ownerProfile = await Profile.findOne({ userId: n.ownerId }).select('fullName avatarUrl').lean();

        return {
          nomineeRecordId: n._id.toString(),
          ownerId: n.ownerId,
          ownerEmail: ownerUser?.email ?? 'unknown',
          ownerName: ownerProfile?.fullName ?? ownerUser?.email ?? 'Unknown Owner',
          ownerAvatarUrl: ownerProfile?.avatarUrl ?? null,
          waitingPeriodDays: n.waitingPeriodDays,
          allowedFolderIds: n.allowedFolderIds,
          allowedDocumentIds: n.allowedDocumentIds,
          acceptedAt: n.acceptedAt,
        };
      })
    );

    return successResponse(enriched);
  } catch (error) {
    console.error('[GET /api/nominees/owners]', error);
    return errorResponse('Failed to fetch owners');
  }
}
