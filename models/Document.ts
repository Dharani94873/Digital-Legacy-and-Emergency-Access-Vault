import mongoose, { Schema, Document, Model } from 'mongoose';
import { IDocument } from '@/types';

export interface IDocumentDocument extends Omit<IDocument, '_id'>, Document {}

const DocumentSchema = new Schema<IDocumentDocument>(
  {
    ownerId: { type: String, ref: 'User', required: true, index: true },
    folderId: { type: String, ref: 'Folder', default: null },
    categoryId: { type: String, ref: 'Category', default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    originalFilename: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    cloudinaryPublicId: { type: String, required: true },
    cloudinaryUrl: { type: String, required: true },
    sha256Hash: { type: String, required: true, index: true },
    blockchainTxHash: { type: String },
    blockchainVerified: { type: Boolean, default: false },
    encryptionIV: { type: String, required: true },
    encryptionAuthTag: { type: String, required: true },
    isDeleted: { type: Boolean, default: false, index: true },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true },
);

// Compound index for owner's non-deleted documents
DocumentSchema.index({ ownerId: 1, isDeleted: 1, createdAt: -1 });

const VaultDocument: Model<IDocumentDocument> =
  mongoose.models.VaultDocument ??
  mongoose.model<IDocumentDocument>('VaultDocument', DocumentSchema);

export default VaultDocument;
