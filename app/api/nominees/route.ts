import { NextRequest } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb';
import {
  requireAuth, isNextResponse, successResponse, errorResponse, logAudit, createNotification,
} from '@/lib/utils';
import { inviteNomineeSchema, updateNomineeSchema } from '@/lib/validators';
import { sendEmail, nomineeInvitationEmail, APP_URL } from '@/lib/resend';
import Nominee from '@/models/Nominee';
import User from '@/models/User';
import Profile from '@/models/Profile';

// GET /api/nominees — list all nominees for the authenticated owner
export async function GET(request: NextRequest) {
  const auth = await requireAuth(['owner']);
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

    // Enrich with nominee profile names
    const enriched = await Promise.all(
      nominees.map(async (n) => {
        if (!n.nomineeUserId) return { ...n, nomineeName: null };
        const profile = await Profile.findOne({ userId: n.nomineeUserId }).lean();
        return { ...n, nomineeName: profile?.fullName ?? null };
      }),
    );

    return successResponse(enriched);
  } catch (error) {
    console.error('[GET /api/nominees]', error);
    return errorResponse('Failed to fetch nominees');
  }
}

// POST /api/nominees — invite a new nominee
export async function POST(request: NextRequest) {
  const auth = await requireAuth(['owner']);
  if (isNextResponse(auth)) return auth;
  const { userId } = auth;

  try {
    await connectToDatabase();
    const body = await request.json();
    const parsed = inviteNomineeSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

    const { email, waitingPeriodDays, allowedFolderIds, allowedDocumentIds } = parsed.data;

    // Check if already invited
    const existing = await Nominee.findOne({ ownerId: userId, nomineeEmail: email });
    if (existing) {
      return errorResponse('This email has already been invited as a nominee', 409);
    }

    const invitationToken = crypto.randomBytes(32).toString('hex');

    const nominee = await Nominee.create({
      ownerId:            userId,
      nomineeEmail:       email,
      status:             'pending',
      waitingPeriodDays,
      allowedFolderIds:   allowedFolderIds   ?? [],
      allowedDocumentIds: allowedDocumentIds ?? [],
      invitationToken,
      invitedAt:          new Date(),
    });

    // Get owner profile for email
    const ownerProfile = await Profile.findOne({ userId }).lean();
    const ownerName    = ownerProfile?.fullName ?? 'Someone';

    const inviteUrl = `${APP_URL}/register?token=${invitationToken}`;
    const { subject, html } = nomineeInvitationEmail({ ownerName, nomineeEmail: email, inviteUrl });
    sendEmail({ to: email, subject, html }).catch(console.error);

    await logAudit({
      actorId:      userId,
      actorRole:    'owner',
      action:       'nominee.invite',
      resourceType: 'nominee',
      resourceId:   nominee._id.toString(),
      metadata:     { nomineeEmail: email },
    });

    return successResponse({ nomineeId: nominee._id.toString(), inviteUrl }, 201);
  } catch (error) {
    console.error('[POST /api/nominees]', error);
    return errorResponse('Failed to invite nominee');
  }
}

