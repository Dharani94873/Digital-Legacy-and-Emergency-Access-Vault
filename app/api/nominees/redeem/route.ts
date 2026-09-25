import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import {
  requireAuth, isNextResponse, successResponse, errorResponse, logAudit, createNotification,
} from '@/lib/utils';
import { redeemSecretCodeSchema } from '@/lib/validators';
import Nominee from '@/models/Nominee';
import User from '@/models/User';
import Profile from '@/models/Profile';

// POST /api/nominees/redeem
// Nominee calls this to link themselves to an owner's vault using the secret code
export async function POST(request: NextRequest) {
  const auth = await requireAuth(['owner', 'nominee']);
  if (isNextResponse(auth)) return auth;
  const { userId } = auth;

  try {
    await connectToDatabase();
    const body = await request.json();
    const parsed = redeemSecretCodeSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

    const { secretCode } = parsed.data;

    // Find the nominee record matching this secret code
    const nominee = await Nominee.findOne({ secretCode: secretCode.toUpperCase() });
    if (!nominee) {
      return errorResponse('Invalid secret code. Please check with the vault owner.', 404);
    }

    if (nominee.status === 'revoked') {
      return errorResponse('This nomination has been revoked by the owner.', 403);
    }

    if (nominee.status === 'active') {
      return errorResponse('This secret code has already been used.', 409);
    }

    // Prevent an owner from redeeming their own code
    if (nominee.ownerId === userId) {
      return errorResponse('You cannot redeem your own secret code.', 400);
    }

    // Fetch the nominee's current user record
    const nomineeUser = await User.findById(userId).lean();
    if (!nomineeUser) return errorResponse('User not found', 404);

    // Verify username matches what the owner specified
    if (nominee.nomineeUsername && nomineeUser.username !== nominee.nomineeUsername) {
      return errorResponse(
        `This code was issued for username "${nominee.nomineeUsername}". You are logged in as "${nomineeUser.username}".`,
        403,
      );
    }

    // Accept the nomination
    nominee.nomineeUserId = userId;
    nominee.status       = 'active';
    nominee.acceptedAt   = new Date();
    await nominee.save();

    // Ensure user has at least nominee role (keep 'owner' if they already are one)
    if (nomineeUser.role !== 'owner' && nomineeUser.role !== 'admin') {
      await User.findByIdAndUpdate(userId, { role: 'nominee' });
    }

    // Notify the owner in-app
    const nomineeProfile = await Profile.findOne({ userId }).lean();
    await createNotification({
      userId:            nominee.ownerId,
      type:              'nominee.accepted',
      title:             'Nominee Accepted',
      message:           `${nomineeProfile?.fullName ?? nomineeUser.username} has accepted your nomination and is now an active nominee.`,
      relatedEntityId:   nominee._id.toString(),
      relatedEntityType: 'nominee',
    });

    await logAudit({
      actorId:      userId,
      actorRole:    'nominee',
      action:       'nominee.redeem',
      resourceType: 'nominee',
      resourceId:   nominee._id.toString(),
      targetUserId: nominee.ownerId,
    });

    return successResponse({
      message:   'You are now an active nominee for this vault.',
      nomineeId: nominee._id.toString(),
      ownerId:   nominee.ownerId,
    });
  } catch (error) {
    console.error('[POST /api/nominees/redeem]', error);
    return errorResponse('Failed to redeem secret code');
  }
}
