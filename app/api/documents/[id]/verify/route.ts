import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAuth, isNextResponse, successResponse, errorResponse, logAudit } from '@/lib/utils';
import { getDocumentRecordFromChain } from '@/lib/blockchain';
import VaultDocument from '@/models/Document';
import BlockchainTransaction from '@/models/BlockchainTransaction';

// GET /api/documents/[id]/verify — check blockchain integrity
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAuth(['owner', 'nominee', 'admin']);
  if (isNextResponse(auth)) return auth;
  const { userId, role } = auth;

  try {
    await connectToDatabase();

    const doc = await VaultDocument.findOne({ _id: id, isDeleted: false }).lean();
    if (!doc) return errorResponse('Document not found', 404);

    if (role === 'owner' && doc.ownerId.toString() !== userId) {
      return errorResponse('Forbidden', 403);
    }

    const record = await getDocumentRecordFromChain(id);
    const isVerified = record !== null && record.storedHash === doc.sha256Hash;

    if (isVerified && !doc.blockchainVerified) {
      await VaultDocument.findByIdAndUpdate(id, { blockchainVerified: true });
    }

    const latestTx = await BlockchainTransaction.findOne({ documentId: id })
      .sort({ timestamp: -1 })
      .lean();

    await logAudit({
      actorId:      userId,
      actorRole:    role,
      action:       'document.verify',
      resourceType: 'document',
      resourceId:   id,
      metadata:     { isVerified },
    });

    return successResponse({
      documentId:  id,
      sha256Hash:  doc.sha256Hash,
      isVerified,
      onChainHash: record?.storedHash ?? null,
      txHash:      latestTx?.txHash ?? doc.blockchainTxHash ?? null,
      blockNumber: latestTx?.blockNumber ?? null,
      registeredAt: record ? new Date(record.storedTimestamp * 1000).toISOString() : null,
      polygonscanUrl: latestTx?.txHash
        ? `https://amoy.polygonscan.com/tx/${latestTx.txHash}`
        : null,
    });
  } catch (error) {
    console.error('[GET /api/documents/[id]/verify]', error);
    return errorResponse('Verification failed');
  }
}
