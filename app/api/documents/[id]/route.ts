import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAuth, isNextResponse, successResponse, errorResponse, logAudit } from '@/lib/utils';
import { deleteFile } from '@/lib/cloudinary';
import VaultDocument from '@/models/Document';
import Nominee from '@/models/Nominee';
import EmergencyRequest from '@/models/EmergencyRequest';

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

    const isDocOwner = doc.ownerId.toString() === userId;
    if (!isDocOwner) {
      const nominee = await Nominee.findOne({
        nomineeUserId: userId,
        ownerId: doc.ownerId,
        status: 'active',
      }).lean();

      if (!nominee) return errorResponse('Forbidden', 403);

      const hasAccess =
        nominee.allowedDocumentIds.some((d) => d.toString() === id) ||
        (doc.folderId &&
          nominee.allowedFolderIds.some((f) => f.toString() === doc.folderId?.toString()));

      if (!hasAccess) return errorResponse('Forbidden', 403);

      const approvedRequest = await EmergencyRequest.findOne({
        ownerId: doc.ownerId,
        nomineeId: nominee._id.toString(),
        status: { $in: ['approved', 'auto-approved'] },
      }).lean();

      if (!approvedRequest) return errorResponse('Forbidden', 403);
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
