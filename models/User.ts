import mongoose, { Schema, Document, Model } from 'mongoose';
import { IUser, UserRole } from '@/types';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['owner', 'nominee', 'admin'] as UserRole[],
      default: 'owner',
    },
    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    invitationToken: { type: String, sparse: true, index: true },
    invitedByOwnerId: { type: String, ref: 'User' },
  },
  { timestamps: true },
);

const User: Model<IUserDocument> =
  mongoose.models.User ?? mongoose.model<IUserDocument>('User', UserSchema);

export default User;
