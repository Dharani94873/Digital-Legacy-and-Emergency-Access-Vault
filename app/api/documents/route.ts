import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAuth, isNextResponse, successResponse, errorResponse } from '@/lib/utils';
import VaultDocument from '@/models/Document';

// GET /api/documents — list all documents for the authenticated owner
export async function GET(request: NextRequest) {
  const auth = await requireAuth(['owner']);
  if (isNextResponse(auth)) return auth;
  const { userId } = auth;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const page      = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
    const limit     = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));
    const folderId  = searchParams.get('folderId');
    const category  = searchParams.get('categoryId');
    const search    = searchParams.get('search');
    const sort      = searchParams.get('sort') ?? 'createdAt';
    const order     = searchParams.get('order') === 'asc' ? 1 : -1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { ownerId: userId, isDeleted: false };
    if (folderId)  filter.folderId  = folderId;
    if (category)  filter.categoryId = category;
    if (search)    filter.$or = [
      { title:            { $regex: search, $options: 'i' } },
      { originalFilename: { $regex: search, $options: 'i' } },
      { tags:             { $regex: search, $options: 'i' } },
    ];

    const [items, total] = await Promise.all([
      VaultDocument.find(filter)
        .select('-encryptionIV -encryptionAuthTag')   // never expose encryption secrets
        .sort({ [sort]: order })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      VaultDocument.countDocuments(filter),
    ]);

    return successResponse({
      items,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error('[GET /api/documents]', error);
    return errorResponse('Failed to fetch documents');
  }
}
