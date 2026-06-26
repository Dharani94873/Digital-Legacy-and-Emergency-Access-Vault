import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAuth, isNextResponse, successResponse, errorResponse, logAudit, createNotification } from '@/lib/utils';
import { updateNomineeSchema } from '@/lib/validators';
import Nominee from '@/models/Nominee';

// PATCH /api/nominees/[id] — update nominee permissions / waiting period
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAuth(['owner']);
  if (isNextResponse(auth)) return auth;
  const { userId } = auth;

  try {
    await connectToDatabase();
    const body   = await request.json();
    const parsed = updateNomineeSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

    const nominee = await Nominee.findOne({ _id: id, ownerId: userId });
    if (!nominee) return errorResponse('Nominee not found', 404);

    Object.assign(nominee, parsed.data);
    await nominee.save();

    return successResponse({ message: 'Nominee updated' });
  } catch (error) {
    console.error('[PATCH /api/nominees/[id]]', error);
    return errorResponse('Failed to update nominee');
  }
}

// DELETE /api/nominees/[id] — revoke nominee access
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAuth(['owner']);
  if (isNextResponse(auth)) return auth;
  const { userId } = auth;

  try {
    await connectToDatabase();
    const nominee = await Nominee.findOne({ _id: id, ownerId: userId });
    if (!nominee) return errorResponse('Nominee not found', 404);

    nominee.status = 'revoked';
    await nominee.save();

    if (nominee.nomineeUserId) {
      await createNotification({
        userId:              nominee.nomineeUserId.toString(),
        type:                'nominee.revoked',
        title:               'Nominee Access Revoked',
        message:             'Your nominee access has been revoked by the owner.',
        relatedEntityId:     id,
        relatedEntityType:   'nominee',
      });
    }

    await logAudit({
      actorId:      userId,
      actorRole:    'owner',
      action:       'nominee.revoke',
      resourceType: 'nominee',
      resourceId:   id,
    });

    return successResponse({ message: 'Nominee access revoked' });
  } catch (error) {
    console.error('[DELETE /api/nominees/[id]]', error);
    return errorResponse('Failed to revoke nominee');
  }
}
