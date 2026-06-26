import mongoose, { Schema, Document, Model } from 'mongoose';
import { IAuditLog, UserRole } from '@/types';

export interface IAuditLogDocument extends Omit<IAuditLog, '_id'>, Document {}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    actorId: { type: String, ref: 'User', required: true, index: true },
    actorRole: { type: String, enum: ['owner', 'nominee', 'admin'] as UserRole[], required: true },
    targetUserId: { type: String, ref: 'User', default: null },
    action: { type: String, required: true, index: true },
    resourceType: { type: String, required: true },
    resourceId: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false },
);

AuditLogSchema.index({ actorId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

const AuditLog: Model<IAuditLogDocument> =
  mongoose.models.AuditLog ?? mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);

export default AuditLog;
