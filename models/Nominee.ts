import mongoose, { Schema, Document, Model } from 'mongoose';
import { INominee, NomineeStatus, WaitingPeriodDays } from '@/types';

export interface INomineeDocument extends Omit<INominee, '_id'>, Document {}

const NomineeSchema = new Schema<INomineeDocument>(
  {
    ownerId: { type: String, ref: 'User', required: true, index: true },
    nomineeUserId: { type: String, ref: 'User', default: null },
    nomineeEmail: { type: String, required: true, lowercase: true, trim: true },
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
    allowedFolderIds: [{ type: String, ref: 'Folder' }],
    allowedDocumentIds: [{ type: String, ref: 'VaultDocument' }],
    invitationToken: { type: String, required: true, unique: true, index: true },
    invitedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

NomineeSchema.index({ ownerId: 1, nomineeEmail: 1 }, { unique: true });

const Nominee: Model<INomineeDocument> =
  mongoose.models.Nominee ?? mongoose.model<INomineeDocument>('Nominee', NomineeSchema);

export default Nominee;
