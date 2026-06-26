import mongoose, { Schema, Document, Model } from 'mongoose';
import { IProfile } from '@/types';

export interface IProfileDocument extends Omit<IProfile, '_id'>, Document {}

const ProfileSchema = new Schema<IProfileDocument>(
  {
    userId: { type: String, ref: 'User', required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    avatarUrl: { type: String },
    bio: { type: String, maxlength: 500 },
    address: { type: String },
    emergencyContact: { type: String },
    twoFactorEnabled: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Profile: Model<IProfileDocument> =
  mongoose.models.Profile ?? mongoose.model<IProfileDocument>('Profile', ProfileSchema);

export default Profile;
