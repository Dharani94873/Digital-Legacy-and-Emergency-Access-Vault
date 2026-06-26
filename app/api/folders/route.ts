import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAuth, isNextResponse, successResponse, errorResponse, logAudit } from '@/lib/utils';
import { createFolderSchema } from '@/lib/validators';
import Folder from '@/models/Folder';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(['owner']);
  if (isNextResponse(auth)) return auth;
  const { userId } = auth;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const parentFolderId = searchParams.get('parentFolderId');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { ownerId: userId };
    if (parentFolderId === 'root' || !parentFolderId) {
      filter.parentFolderId = null;
    } else {
      filter.parentFolderId = parentFolderId;
    }

    const folders = await Folder.find(filter).sort({ name: 1 }).lean();
    return successResponse(folders);
  } catch (error) {
    console.error('[GET /api/folders]', error);
    return errorResponse('Failed to fetch folders');
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(['owner']);
  if (isNextResponse(auth)) return auth;
  const { userId } = auth;

  try {
    await connectToDatabase();
    const body   = await request.json();
    const parsed = createFolderSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

    const folder = await Folder.create({ ownerId: userId, ...parsed.data });

    await logAudit({
      actorId:      userId,
      actorRole:    'owner',
      action:       'folder.create',
      resourceType: 'folder',
      resourceId:   folder._id.toString(),
      metadata:     { name: folder.name },
    });

    return successResponse(folder, 201);
  } catch (error) {
    console.error('[POST /api/folders]', error);
    return errorResponse('Failed to create folder');
  }
}
