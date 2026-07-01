import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import EmergencyRequest from '@/models/EmergencyRequest';
import Nominee from '@/models/Nominee';
import User from '@/models/User';
import Profile from '@/models/Profile';
import { sendEmail, autoApprovalWarningEmail } from '@/lib/resend';

// POST /api/cron/warn-auto-approve
// Called by Vercel Cron — sends 7-day warning emails for requests nearing auto-approval
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
    // 3. Warning email has NOT been sent yet
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const requests = await EmergencyRequest.find({
      status: 'pending',
      autoApprovalScheduledAt: { $lte: sevenDaysFromNow, $gt: now },
      warningEmailSentAt: { $exists: false },
    }).lean();

    let warned = 0;

    for (const req of requests) {
      try {
        const nominee = await Nominee.findById(req.nomineeId).lean();
        if (!nominee) continue;

        const owner = await User.findById(req.ownerId).lean();
        if (!owner) continue;

        const ownerProfile = await Profile.findOne({ userId: req.ownerId.toString() }).lean();
        const nomineeProfile = nominee.nomineeUserId
          ? await Profile.findOne({ userId: nominee.nomineeUserId.toString() }).lean()
          : null;

        const ownerName  = ownerProfile?.fullName ?? owner.email;
        const nomineeName = nomineeProfile?.fullName ?? nominee.nomineeEmail;
        const { APP_URL } = await import('@/lib/resend');
        const requestUrl = `${APP_URL}/owner/requests`;

        const autoApproveDate = new Date(req.autoApprovalScheduledAt).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'long', year: 'numeric',
        });

        const { subject, html } = autoApprovalWarningEmail({
          ownerName,
          nomineeName,
          autoApproveDate,
          requestUrl,
        });

        await sendEmail({ to: owner.email, subject, html });

        // Mark warning sent
        await EmergencyRequest.findByIdAndUpdate(req._id, { warningEmailSentAt: new Date() });
        warned++;
      } catch (innerErr) {
        console.error(`[WarnCron] Failed for request ${req._id}:`, innerErr);
      }
    }

    return NextResponse.json({
      success: true,
      warned,
      message: `Sent ${warned} warning email(s)`,
    });
  } catch (error) {
    console.error('[WarnCron]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
