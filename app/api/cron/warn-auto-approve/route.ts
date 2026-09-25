import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import EmergencyRequest from '@/models/EmergencyRequest';
import Nominee from '@/models/Nominee';
import Profile from '@/models/Profile';
import { createNotification } from '@/lib/utils';
import { format } from 'date-fns';

// GET /api/cron/warn-auto-approve
// Called by Vercel Cron — sends 7-day warning in-app notifications for requests nearing auto-approval
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Find requests that:
    // 1. Are still pending
    // 2. Auto-approval date is within next 7 days
    // 3. Warning notification has NOT been sent yet
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const requests = await EmergencyRequest.find({
      status: 'pending',
      autoApprovalScheduledAt: { $lte: sevenDaysFromNow, $gt: now },
      warningNotifiedAt: { $exists: false },
    }).lean();

    let warned = 0;

    for (const req of requests) {
      try {
        const nominee = await Nominee.findById(req.nomineeId).lean();
        if (!nominee) continue;

        const ownerProfile = await Profile.findOne({ userId: req.ownerId.toString() }).lean();
        const nomineeProfile = nominee.nomineeUserId
          ? await Profile.findOne({ userId: nominee.nomineeUserId.toString() }).lean()
          : null;

        const nomineeName   = nomineeProfile?.fullName ?? nominee.nomineeUsername ?? 'A nominee';
        const autoApproveDate = format(new Date(req.autoApprovalScheduledAt), 'MMMM d, yyyy');

        // In-app notification to the owner
        await createNotification({
          userId:            req.ownerId.toString(),
          type:              'emergency.warning',
          title:             '⏰ Auto-Approval Warning',
          message:           `${nomineeName}'s emergency request will be automatically approved on ${autoApproveDate} unless you review it.`,
          relatedEntityId:   req._id.toString(),
          relatedEntityType: 'emergency_request',
        });

        // Mark warning sent
        await EmergencyRequest.findByIdAndUpdate(req._id, { warningNotifiedAt: new Date() });
        warned++;
      } catch (innerErr) {
        console.error(`[WarnCron] Failed for request ${req._id}:`, innerErr);
      }
    }

    return NextResponse.json({
      success: true,
      warned,
      message: `Sent ${warned} warning notification(s)`,
    });
  } catch (error) {
    console.error('[WarnCron]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
