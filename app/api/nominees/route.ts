import { NextRequest } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb';
import {
  requireAuth, isNextResponse, successResponse, errorResponse, logAudit,
} from '@/lib/utils';
import { inviteNomineeSchema, updateNomineeSchema } from '@/lib/validators';
import Nominee from '@/models/Nominee';
import Profile from '@/models/Profile';

/** Generate an 8-character uppercase alphanumeric secret code */
function generateSecretCode(): string {
  return crypto.randomBytes(6).toString('base64url').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8).padEnd(8, '0');
}

// GET /api/nominees — list all nominees for the authenticated owner
export async function GET(request: NextRequest) {
  const auth = await requireAuth(['owner', 'nominee']);
  if (isNextResponse(auth)) return auth;
  const { userId } = auth;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { ownerId: userId };
    if (status) filter.status = status;

    const nominees = await Nominee.find(filter).sort({ createdAt: -1 }).lean();

    // Enrich with nominee profile names and safely handle legacy database records
    const enriched = await Promise.all(
      nominees.map(async (n: any) => {
        let nomineeName = null;
        if (n.nomineeUserId) {
          const profile = await Profile.findOne({ userId: n.nomineeUserId }).lean();
          nomineeName = profile?.fullName ?? null;
        }

        let updated = false;
        let secretCode = n.secretCode;
        let nomineeUsername = n.nomineeUsername;

        // Auto-migrate legacy documents in database
        if (!secretCode && n.status === 'pending') {
          secretCode = n.invitationToken ? n.invitationToken.slice(0, 8).toUpperCase() : generateSecretCode();
          updated = true;
        }
        if (!nomineeUsername) {
          nomineeUsername = n.nomineeEmail
            ? n.nomineeEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_')
            : 'nominee';
          updated = true;
        }

        if (updated) {
          await Nominee.updateOne(
            { _id: n._id },
            { $set: { secretCode: secretCode || generateSecretCode(), nomineeUsername } },
          ).catch((e) => console.error('Nominee migration update error:', e));
        }

        return {
          ...n,
          nomineeUsername: nomineeUsername || 'nominee',
          secretCode: secretCode || '',
          nomineeName,
        };
      }),
    );

    return successResponse(enriched);
  } catch (error) {
    console.error('[GET /api/nominees]', error);
    return errorResponse('Failed to fetch nominees');
  }
}

// POST /api/nominees — add a new nominee by username and generate a secret code
export async function POST(request: NextRequest) {
  const auth = await requireAuth(['owner', 'nominee']);
  if (isNextResponse(auth)) return auth;
  const { userId } = auth;

  try {
    await connectToDatabase();
    const body = await request.json();
    const parsed = inviteNomineeSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

    const { nomineeUsername, waitingPeriodDays, allowedFolderIds, allowedDocumentIds } = parsed.data;

    // Check if this username has already been added
    const existing = await Nominee.findOne({ ownerId: userId, nomineeUsername });
    if (existing) {
      return errorResponse('This username has already been added as a nominee', 409);
    }

    // Generate a unique 8-char secret code
    let secretCode = generateSecretCode();
    // Ensure uniqueness (collision extremely unlikely but safe)
    let attempts = 0;
    while (await Nominee.exists({ secretCode })) {
      secretCode = generateSecretCode();
      if (++attempts > 10) return errorResponse('Failed to generate a unique secret code. Try again.', 500);
    }

    const nominee = await Nominee.create({
      ownerId:            userId,
      nomineeUsername,
      status:             'pending',
      waitingPeriodDays,
      allowedFolderIds:   allowedFolderIds   ?? [],
      allowedDocumentIds: allowedDocumentIds ?? [],
      secretCode,
      invitedAt:          new Date(),
    });

    await logAudit({
      actorId:      userId,
      actorRole:    'owner',
      action:       'nominee.add',
      resourceType: 'nominee',
      resourceId:   nominee._id.toString(),
      metadata:     { nomineeUsername },
    });

    // Return the secretCode so the owner can share it manually with the nominee
    return successResponse(
      { nomineeId: nominee._id.toString(), secretCode },
      201,
    );
  } catch (error) {
    console.error('[POST /api/nominees]', error);
    return errorResponse('Failed to add nominee');
  }
}

// PATCH /api/nominees?id=xxx — update waiting period / allowed access
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(['owner', 'nominee']);
  if (isNextResponse(auth)) return auth;
  const { userId } = auth;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return errorResponse('Nominee ID is required', 400);

    const body = await request.json();
    const parsed = updateNomineeSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

    const nominee = await Nominee.findOne({ _id: id, ownerId: userId });
    if (!nominee) return errorResponse('Nominee not found', 404);

    Object.assign(nominee, parsed.data);
    await nominee.save();

    return successResponse({ nomineeId: id });
  } catch (error) {
    console.error('[PATCH /api/nominees]', error);
    return errorResponse('Failed to update nominee');
  }
}

// DELETE /api/nominees?id=xxx — revoke access
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(['owner', 'nominee']);
  if (isNextResponse(auth)) return auth;
  const { userId } = auth;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return errorResponse('Nominee ID is required', 400);

    const nominee = await Nominee.findOne({ _id: id, ownerId: userId });
    if (!nominee) return errorResponse('Nominee not found', 404);

    nominee.status = 'revoked';
    await nominee.save();

    await logAudit({
      actorId:      userId,
      actorRole:    'owner',
      action:       'nominee.revoke',
      resourceType: 'nominee',
      resourceId:   id,
    });

    return successResponse({ message: 'Access revoked' });
  } catch (error) {
    console.error('[DELETE /api/nominees]', error);
    return errorResponse('Failed to revoke nominee');
  }
}
