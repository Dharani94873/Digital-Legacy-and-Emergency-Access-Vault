import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAuth, isNextResponse, errorResponse, logAudit } from '@/lib/utils';
import { decryptFile, verifyHash } from '@/lib/encryption';
import { downloadEncryptedFile } from '@/lib/cloudinary';
import VaultDocument from '@/models/Document';
import Nominee from '@/models/Nominee';
import EmergencyRequest from '@/models/EmergencyRequest';
import { UserRole } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authResult = await requireAuth(['owner', 'nominee']);
  if (isNextResponse(authResult)) return authResult;
  const { userId, role } = authResult;

  try {
    await connectToDatabase();

    const doc = await VaultDocument.findOne({ _id: id, isDeleted: false }).lean();
    if (!doc) return errorResponse('Document not found', 404);

    // ── Ownership / permission check
    if (role === 'owner') {
      if (doc.ownerId.toString() !== userId) return errorResponse('Forbidden', 403);
    } else if (role === 'nominee') {
      // Check if nominee has approved access and document is in their allowed list
      const nominee = await Nominee.findOne({
        nomineeUserId: userId,
        ownerId: doc.ownerId,
        status: 'active',
      }).lean();

      if (!nominee) return errorResponse('Forbidden — not a nominee for this owner', 403);

      const hasAccess =
        nominee.allowedDocumentIds.some((d) => d.toString() === id) ||
        (doc.folderId &&
          nominee.allowedFolderIds.some((f) => f.toString() === doc.folderId?.toString()));

      if (!hasAccess) return errorResponse('You do not have permission to access this document', 403);

      // Must have an approved emergency request
      const approvedRequest = await EmergencyRequest.findOne({
        ownerId: doc.ownerId,
        nomineeId: { $in: [nominee._id.toString()] },
        status: { $in: ['approved', 'auto-approved'] },
      }).lean();

      if (!approvedRequest) return errorResponse('No approved emergency request', 403);
    }

    // ── Download encrypted blob from Cloudinary
    const encryptedBuffer = await downloadEncryptedFile(doc.cloudinaryPublicId);

    // ── Decrypt
    const decryptedBuffer = decryptFile(
      encryptedBuffer,
      doc.encryptionIV,
      doc.encryptionAuthTag,
    );

    // ── Verify SHA-256 hash integrity
    const isValid = verifyHash(decryptedBuffer, doc.sha256Hash);
    if (!isValid) {
      console.error('[Download] Hash mismatch for document', id);
      return errorResponse('Document integrity check failed — file may be corrupted', 500);
    }

    // ── Audit log
    await logAudit({
      actorId:      userId,
      actorRole:    role as UserRole,
      action:       'document.download',
      resourceType: 'document',
      resourceId:   id,
      targetUserId: doc.ownerId.toString(),
    });

    // ── Stream decrypted bytes to client
    return new NextResponse(new Uint8Array(decryptedBuffer), {
      status: 200,
      headers: {
        'Content-Type':        doc.mimeType,
        'Content-Disposition': `attachment; filename="${doc.originalFilename}"`,
        'Content-Length':      decryptedBuffer.length.toString(),
        'Cache-Control':       'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[GET /api/documents/[id]/download]', error);
    return errorResponse('Download failed');
  }
}
