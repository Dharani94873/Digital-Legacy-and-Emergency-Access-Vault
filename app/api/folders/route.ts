import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAuth, isNextResponse, successResponse, errorResponse, logAudit } from '@/lib/utils';
import { createFolderSchema } from '@/lib/validators';
import Folder from '@/models/Folder';
import VaultDocument from '@/models/Document';

// GET /api/folders — list folders or fetch single folder
export async function GET(request: NextRequest) {
  const auth = await requireAuth(['owner', 'nominee']);
  if (isNextResponse(auth)) return auth;
  const { userId } = auth;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const folder = await Folder.findOne({ _id: id, ownerId: userId }).lean();
      if (!folder) return errorResponse('Folder not found', 404);
      return successResponse(folder);
    }

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

// POST /api/folders — create new folder (prevent duplicates)
export async function POST(request: NextRequest) {
  const auth = await requireAuth(['owner', 'nominee']);
  if (isNextResponse(auth)) return auth;
  const { userId } = auth;

  try {
    await connectToDatabase();
    const body   = await request.json();
    const parsed = createFolderSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

    const { name, parentFolderId } = parsed.data;

    // Check if folder name already exists for this owner under same parent folder
    const checkParentId = parentFolderId || null;
    const existing = await Folder.findOne({
      ownerId: userId,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      parentFolderId: checkParentId,
    });

    if (existing) {
      return errorResponse('A folder with this name already exists', 400);
    }

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

// DELETE /api/folders — delete folder and release documents to root
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(['owner', 'nominee']);
  if (isNextResponse(auth)) return auth;
  const { userId } = auth;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('Folder ID is required', 400);
    }

    const folder = await Folder.findOneAndDelete({ _id: id, ownerId: userId });
    if (!folder) {
      return errorResponse('Folder not found', 404);
    }

    // Unset folderId on all documents inside this folder so they move to root
    await VaultDocument.updateMany(
      { folderId: id, ownerId: userId },
      { $unset: { folderId: "" } }
    );

    await logAudit({
      actorId:      userId,
      actorRole:    'owner',
      action:       'folder.delete',
      resourceType: 'folder',
      resourceId:   id,
      metadata:     { name: folder.name },
    });

    return successResponse({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('[DELETE /api/folders]', error);
    return errorResponse('Failed to delete folder');
  }
}
