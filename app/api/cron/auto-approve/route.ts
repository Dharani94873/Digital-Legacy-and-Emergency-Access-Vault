import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { logAudit, createNotification } from '@/lib/utils';
import { sendEmail, autoApprovalWarningEmail, autoApprovedEmail, APP_URL } from '@/lib/resend';
import { logEmergencyApprovalOnChain } from '@/lib/blockchain';
import EmergencyRequest from '@/models/EmergencyRequest';
import Nominee from '@/models/Nominee';
import Profile from '@/models/Profile';
import User from '@/models/User';
import BlockchainTransaction from '@/models/BlockchainTransaction';
import { addDays, subDays, format, isAfter } from 'date-fns';

const CRON_SECRET = process.env.CRON_SECRET!;

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const now = new Date();

    // ──────────────────────────────────────────────
    // 1. Send 7-day warning emails
    // ──────────────────────────────────────────────
    const warningThreshold = addDays(now, 7);
    const pendingForWarning = await EmergencyRequest.find({
      status:               'pending',
      warningEmailSentAt:   null,
      autoApprovalScheduledAt: { $lte: warningThreshold, $gt: now },
    });

    for (const req of pendingForWarning) {
      const nominee    = await Nominee.findById(req.nomineeId).lean();
      const ownerUser  = await User.findById(req.ownerId).lean();
      const ownerProf  = await Profile.findOne({ userId: req.ownerId.toString() }).lean();
      const nomProf    = nominee?.nomineeUserId
        ? await Profile.findOne({ userId: nominee.nomineeUserId.toString() }).lean()
        : null;

      if (ownerUser) {
        const { subject, html } = autoApprovalWarningEmail({
          ownerName:       ownerProf?.fullName ?? ownerUser.email,
          nomineeName:     nomProf?.fullName ?? req.nomineeId.toString(),
          autoApproveDate: format(req.autoApprovalScheduledAt, 'MMMM d, yyyy'),
          requestUrl:      `${APP_URL}/owner/requests/${req._id}`,
        });
        await sendEmail({ to: ownerUser.email, subject, html });
      }

      req.warningEmailSentAt = now;
      await req.save();
    }

    // ──────────────────────────────────────────────
    // 2. Auto-approve overdue requests
    // ──────────────────────────────────────────────
    const overdueRequests = await EmergencyRequest.find({
      status:                  'pending',
      autoApprovalScheduledAt: { $lte: now },
    });

    for (const req of overdueRequests) {
      const nominee = await Nominee.findById(req.nomineeId);
      if (!nominee) continue;

      req.status             = 'auto-approved';
      req.resolvedAt         = now;
      req.grantedDocumentIds = nominee.allowedDocumentIds as string[];
      await req.save();

      const nomineeUser = nominee.nomineeUserId
        ? await User.findById(nominee.nomineeUserId).lean()
        : null;
      const nomProf = nomineeUser
        ? await Profile.findOne({ userId: nomineeUser._id.toString() }).lean()
        : null;
      const ownerProf = await Profile.findOne({ userId: req.ownerId.toString() }).lean();

      // Notify nominee
      if (nomineeUser) {
        const { subject, html } = autoApprovedEmail({
          nomineeName:  nomProf?.fullName ?? nomineeUser.email,
          ownerName:    ownerProf?.fullName ?? 'The owner',
          dashboardUrl: `${APP_URL}/nominee/documents`,
        });
        sendEmail({ to: nomineeUser.email, subject, html }).catch(console.error);

        await createNotification({
          userId:            nomineeUser._id.toString(),
          type:              'emergency.auto-approved',
          title:             'Emergency Access Granted',
          message:           'The waiting period has expired. You now have access to the authorized documents.',
          relatedEntityId:   req._id.toString(),
          relatedEntityType: 'emergency_request',
        });
      }

      // Log on blockchain
      logEmergencyApprovalOnChain(req._id.toString(), req.nomineeId.toString(), req.ownerId.toString())
        .then(async (result) => {
          await BlockchainTransaction.create({
            documentId:      req.nomineeId,
            ownerId:         req.ownerId,
            sha256Hash:      'n/a',
            txHash:          result.txHash,
            blockNumber:     result.blockNumber,
            contractAddress: process.env.CONTRACT_ADDRESS!,
            eventType:       'emergency_approval',
          });
        })
        .catch(console.error);

      await logAudit({
        actorId:      req.ownerId.toString(),
        actorRole:    'owner',
        action:       'emergency.auto-approve',
        resourceType: 'emergency_request',
        resourceId:   req._id.toString(),
      });
    }

    return NextResponse.json({
      success:       true,
      warningsSent:  pendingForWarning.length,
      autoApproved:  overdueRequests.length,
      processedAt:   now.toISOString(),
    });
  } catch (error) {
    console.error('[CRON /api/cron/auto-approve]', error);
    return NextResponse.json({ success: false, error: 'Cron job failed' }, { status: 500 });
  }
}
