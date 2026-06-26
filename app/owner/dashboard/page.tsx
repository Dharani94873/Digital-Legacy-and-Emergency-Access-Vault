import { auth } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import VaultDocument from '@/models/Document';
import Nominee from '@/models/Nominee';
import EmergencyRequest from '@/models/EmergencyRequest';
import AuditLog from '@/models/AuditLog';
import BlockchainTransaction from '@/models/BlockchainTransaction';
import { SessionUser } from '@/types';
import OwnerDashboardClient from './OwnerDashboardClient';

export default async function OwnerDashboardPage() {
  const session = await auth();
  const userId  = (session?.user as SessionUser).id;

  await connectToDatabase();

  const [
    totalDocuments,
    storageAgg,
    totalNominees,
    activeNominees,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    blockchainVerified,
    recentLogs,
    recentTx,
  ] = await Promise.all([
    VaultDocument.countDocuments({ ownerId: userId, isDeleted: false }),
    VaultDocument.aggregate([
      { $match: { ownerId: userId, isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$sizeBytes' } } },
    ]),
    Nominee.countDocuments({ ownerId: userId }),
    Nominee.countDocuments({ ownerId: userId, status: 'active' }),
    EmergencyRequest.countDocuments({ ownerId: userId, status: 'pending' }),
    EmergencyRequest.countDocuments({ ownerId: userId, status: 'approved' }),
    EmergencyRequest.countDocuments({ ownerId: userId, status: { $in: ['rejected'] } }),
    VaultDocument.countDocuments({ ownerId: userId, isDeleted: false, blockchainVerified: true }),
    AuditLog.find({ actorId: userId }).sort({ timestamp: -1 }).limit(10).lean(),
    BlockchainTransaction.find({ ownerId: userId }).sort({ timestamp: -1 }).limit(1).lean(),
  ]);

  const totalStorageBytes = storageAgg[0]?.total ?? 0;
  const lastTxHash        = recentTx[0]?.txHash ?? null;

  return (
    <OwnerDashboardClient
      stats={{
        totalDocuments,
        totalStorageBytes,
        totalNominees,
        activeNominees,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        blockchainVerifiedCount: blockchainVerified,
        recentActivities: JSON.parse(JSON.stringify(recentLogs)),
      }}
      lastTxHash={lastTxHash}
      userId={userId}
    />
  );
}
