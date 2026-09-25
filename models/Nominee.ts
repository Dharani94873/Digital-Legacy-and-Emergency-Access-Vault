import mongoose, { Schema, Document, Model } from 'mongoose';
import { INominee, NomineeStatus, WaitingPeriodDays } from '@/types';

export interface INomineeDocument extends Omit<INominee, '_id'>, Document {}

const NomineeSchema = new Schema<INomineeDocument>(
  {
    ownerId:            { type: String, ref: 'User', required: true, index: true },
    nomineeUserId:      { type: String, ref: 'User', default: null },
    // Username of the intended nominee (for display; they redeem by secret code)
    nomineeUsername:    { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['pending', 'active', 'revoked'] as NomineeStatus[],
      default: 'pending',
    },
    waitingPeriodDays: {
      type: Number,
      enum: [7, 15, 30, 60, 90, 180, 365] as WaitingPeriodDays[],
      default: 30,
    },
    allowedFolderIds:   [{ type: String, ref: 'Folder' }],
    allowedDocumentIds: [{ type: String, ref: 'VaultDocument' }],
    // Secret code shown to the owner — nominee enters this on their dashboard
    secretCode:   { type: String, required: true, unique: true, index: true },
    invitedAt:    { type: Date, default: Date.now },
    acceptedAt:   { type: Date, default: null },
  },
  { timestamps: true },
);

// Each owner can only have one record per nomineeUsername
NomineeSchema.index({ ownerId: 1, nomineeUsername: 1 }, { unique: true, sparse: true });

const Nominee: Model<INomineeDocument> =
  mongoose.models.Nominee ?? mongoose.model<INomineeDocument>('Nominee', NomineeSchema);

export default Nominee;
