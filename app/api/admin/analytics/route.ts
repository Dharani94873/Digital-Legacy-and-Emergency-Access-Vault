import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import VaultDocument from '@/models/Document';
import EmergencyRequest from '@/models/EmergencyRequest';
import AuditLog from '@/models/AuditLog';
import { auth } from '@/lib/auth';
import { subDays } from 'date-fns';

// GET /api/admin/analytics
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();

    const now  = new Date();
    const d7   = subDays(now, 7);
    const d30  = subDays(now, 30);

    const [
      totalUsers,
      newUsersLast7d,
      newUsersLast30d,
      totalDocuments,
      totalRequests,
      pendingRequests,
      approvedRequests,
      usersByRole,
      requestsByStatus,
      logsLast7d,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: d7 } }),
      User.countDocuments({ createdAt: { $gte: d30 } }),
      VaultDocument.countDocuments({ isDeleted: false }),
      EmergencyRequest.countDocuments(),
      EmergencyRequest.countDocuments({ status: 'pending' }),
      EmergencyRequest.countDocuments({ status: { $in: ['approved', 'auto-approved'] } }),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      EmergencyRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      AuditLog.countDocuments({ timestamp: { $gte: d7 } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          newLast7Days: newUsersLast7d,
          newLast30Days: newUsersLast30d,
          byRole: Object.fromEntries(usersByRole.map((r) => [r._id, r.count])),
        },
        documents: { total: totalDocuments },
        requests: {
          total: totalRequests,
          pending: pendingRequests,
          approved: approvedRequests,
          byStatus: Object.fromEntries(requestsByStatus.map((r) => [r._id, r.count])),
        },
        activity: { logsLast7Days: logsLast7d },
      },
    });
  } catch (error) {
    console.error('[Admin Analytics]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
