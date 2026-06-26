import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAuth, isNextResponse, successResponse, errorResponse, logAudit } from '@/lib/utils';
import { deleteFile } from '@/lib/cloudinary';
import VaultDocument from '@/models/Document';

// DELETE /api/documents/[id] — soft delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAuth(['owner']);
  if (isNextResponse(auth)) return auth;
  const { userId } = auth;

  try {
    await connectToDatabase();

    const doc = await VaultDocument.findOne({ _id: id, ownerId: userId, isDeleted: false });
    if (!doc) return errorResponse('Document not found', 404);

    // Soft delete in MongoDB
    doc.isDeleted = true;
    await doc.save();

    // Remove from Cloudinary (hard delete)
    deleteFile(doc.cloudinaryPublicId).catch((e) =>
      console.error('[Cloudinary] Delete failed for', doc.cloudinaryPublicId, e),
    );

    await logAudit({
      actorId:      userId,
      actorRole:    'owner',
      action:       'document.delete',
      resourceType: 'document',
      resourceId:   id,
      metadata:     { title: doc.title },
    });

    return successResponse({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('[DELETE /api/documents/[id]]', error);
    return errorResponse('Delete failed');
  }
}

// GET /api/documents/[id] — fetch single document metadata
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAuth(['owner', 'nominee']);
  if (isNextResponse(auth)) return auth;
  const { userId, role } = auth;

  try {
    await connectToDatabase();
    const doc = await VaultDocument.findOne({ _id: id, isDeleted: false }).lean();
    if (!doc) return errorResponse('Document not found', 404);

    if (role === 'owner' && doc.ownerId.toString() !== userId) {
      return errorResponse('Forbidden', 403);
    }

    // Strip sensitive encryption fields from response
    const { encryptionIV: _, encryptionAuthTag: __, ...safeDoc } = doc;
    void _; void __;

    return successResponse(safeDoc);
  } catch (error) {
    console.error('[GET /api/documents/[id]]', error);
    return errorResponse('Failed to fetch document');
  }
}
