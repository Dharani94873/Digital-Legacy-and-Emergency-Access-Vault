import mongoose, { Schema, Document, Model } from 'mongoose';
import { ICategory, DocumentCategory } from '@/types';

export interface ICategoryDocument extends Omit<ICategory, '_id'>, Document {}

const CategorySchema = new Schema<ICategoryDocument>(
  {
    ownerId: { type: String, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        'insurance','medical','legal','property','identity','investment','emergency','other',
      ] as DocumentCategory[],
      required: true,
    },
    description: { type: String },
    icon: { type: String },
    color: { type: String, default: '#6366f1' },
  },
  { timestamps: true },
);

const Category: Model<ICategoryDocument> =
  mongoose.models.Category ?? mongoose.model<ICategoryDocument>('Category', CategorySchema);

export default Category;
