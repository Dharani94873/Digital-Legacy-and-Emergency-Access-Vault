import mongoose, { Schema, Document, Model } from 'mongoose';
import { IBlockchainTransaction } from '@/types';

export interface IBlockchainTransactionDocument
  extends Omit<IBlockchainTransaction, '_id'>,
    Document {}

const BlockchainTransactionSchema = new Schema<IBlockchainTransactionDocument>(
  {
    documentId: { type: String, ref: 'VaultDocument', required: true, index: true },
    ownerId: { type: String, ref: 'User', required: true, index: true },
    sha256Hash: { type: String, required: true },
    txHash: { type: String, required: true, unique: true },
    blockNumber: { type: Number },
    network: { type: String, default: 'polygon-amoy' },
    contractAddress: { type: String, required: true },
    eventType: {
      type: String,
      enum: ['register', 'verify', 'emergency_approval'],
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

const BlockchainTransaction: Model<IBlockchainTransactionDocument> =
  mongoose.models.BlockchainTransaction ??
  mongoose.model<IBlockchainTransactionDocument>(
    'BlockchainTransaction',
    BlockchainTransactionSchema,
  );

export default BlockchainTransaction;
