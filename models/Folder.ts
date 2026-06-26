import mongoose, { Schema, Document, Model } from 'mongoose';
import { IFolder } from '@/types';

export interface IFolderDocument extends Omit<IFolder, '_id'>, Document {}

const FolderSchema = new Schema<IFolderDocument>(
  {
    ownerId: { type: String, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    parentFolderId: { type: String, ref: 'Folder', default: null },
    color: { type: String, default: '#6366f1' },
    icon: { type: String, default: 'folder' },
    isShared: { type: Boolean, default: false },
  },
  { timestamps: true },
);

FolderSchema.index({ ownerId: 1, parentFolderId: 1 });

const Folder: Model<IFolderDocument> =
  mongoose.models.Folder ?? mongoose.model<IFolderDocument>('Folder', FolderSchema);

export default Folder;
