import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import BlockchainTransaction from '@/models/BlockchainTransaction';
import VaultDocument from '@/models/Document';

// GET /api/blockchain/verify?hash=<sha256hex>
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hash = searchParams.get('hash');

    if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing hash. Must be a 64-character hex string.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check blockchain transaction records first
    const tx = await BlockchainTransaction.findOne({ sha256Hash: hash }).lean();
    if (!tx) {
      return NextResponse.json({
        success: true,
        data: { verified: false },
      });
    }

    // Get the document metadata
    const doc = await VaultDocument.findById(tx.documentId.toString()).lean();

    return NextResponse.json({
      success: true,
      data: {
        verified:      true,
        documentId:    tx.documentId.toString(),
        documentTitle: doc?.title ?? 'Unknown Document',
        txHash:        tx.txHash,
        blockNumber:   tx.blockNumber,
        network:       tx.network,
        registeredAt:  tx.timestamp,
        sha256Hash:    tx.sha256Hash,
      },
    });
  } catch (error) {
    console.error('[Blockchain Verify]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
