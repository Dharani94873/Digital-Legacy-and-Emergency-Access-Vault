import mongoose, { Schema, Document, Model } from 'mongoose';
import { ISettings, WaitingPeriodDays } from '@/types';

export interface ISettingsDocument extends Omit<ISettings, '_id'>, Document {}

const SettingsSchema = new Schema<ISettingsDocument>(
  {
    userId: { type: String, ref: 'User', required: true, unique: true, index: true },
    defaultWaitingPeriodDays: {
      type: Number,
      enum: [7, 15, 30, 60, 90, 180, 365] as WaitingPeriodDays[],
      default: 30,
    },
    emailNotifications: { type: Boolean, default: true },
    twoFactorEnabled: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Settings: Model<ISettingsDocument> =
  mongoose.models.Settings ?? mongoose.model<ISettingsDocument>('Settings', SettingsSchema);

export default Settings;
