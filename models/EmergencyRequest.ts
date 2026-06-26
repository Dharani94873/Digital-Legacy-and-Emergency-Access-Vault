import mongoose, { Schema, Document, Model } from 'mongoose';
import { IEmergencyRequest, RequestStatus } from '@/types';

export interface IEmergencyRequestDocument extends Omit<IEmergencyRequest, '_id'>, Document {}

const EmergencyRequestSchema = new Schema<IEmergencyRequestDocument>(
  {
    nomineeId: { type: String, ref: 'Nominee', required: true, index: true },
    ownerId: { type: String, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'auto-approved'] as RequestStatus[],
      default: 'pending',
    },
    reason: { type: String, required: true, maxlength: 1000 },
    requestedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date, default: null },
    ownerNotifiedAt: { type: Date, default: null },
    warningEmailSentAt: { type: Date, default: null },
    autoApprovalScheduledAt: { type: Date, required: true, index: true },
    grantedDocumentIds: [{ type: String, ref: 'VaultDocument' }],
  },
  { timestamps: true },
);

// Used by cron to find pending requests eligible for auto-approval
EmergencyRequestSchema.index({ status: 1, autoApprovalScheduledAt: 1 });
// Used by cron to find requests needing 7-day warning email
EmergencyRequestSchema.index({ status: 1, warningEmailSentAt: 1, autoApprovalScheduledAt: 1 });

const EmergencyRequest: Model<IEmergencyRequestDocument> =
  mongoose.models.EmergencyRequest ??
  mongoose.model<IEmergencyRequestDocument>('EmergencyRequest', EmergencyRequestSchema);

export default EmergencyRequest;
