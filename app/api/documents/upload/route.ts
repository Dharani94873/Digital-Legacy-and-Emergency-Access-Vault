import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAuth, isNextResponse, successResponse, errorResponse, logAudit } from '@/lib/utils';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, uploadDocumentSchema } from '@/lib/validators';
import { encryptFile, generateSHA256Hash } from '@/lib/encryption';
import { uploadEncryptedFile } from '@/lib/cloudinary';
import { registerDocumentOnChain } from '@/lib/blockchain';
import VaultDocument from '@/models/Document';
import BlockchainTransaction from '@/models/BlockchainTransaction';

export const config = { api: { bodyParser: false } };

export async function POST(request: NextRequest) {
  const auth = await requireAuth(['owner']);
  if (isNextResponse(auth)) return auth;
  const { userId } = auth;

  try {
    await connectToDatabase();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) return errorResponse('No file provided', 400);

    // ── Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return errorResponse(
        'File type not allowed. Accepted: PDF, DOC, DOCX, PNG, JPG',
        400,
      );
    }

    // ── Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return errorResponse('File size exceeds 50MB limit', 400);
    }

    // ── Validate metadata fields
    const metadata = {
      title:       (formData.get('title') as string) || '',
      description: (formData.get('description') as string) || undefined,
      folderId:    (formData.get('folderId') as string) || undefined,
      categoryId:  (formData.get('categoryId') as string) || undefined,
      tags:        formData.getAll('tags') as string[],
    };
    const parsed = uploadDocumentSchema.safeParse(metadata);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    // ── Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer  = Buffer.from(arrayBuffer);

    // ── Generate SHA-256 hash BEFORE encryption
    const sha256Hash = generateSHA256Hash(fileBuffer);

    // ── Encrypt the file
    const { encryptedBuffer, iv, authTag } = encryptFile(fileBuffer);

    // ── Upload encrypted buffer to Cloudinary
    const cloudinaryResult = await uploadEncryptedFile(
      encryptedBuffer,
      file.name,
      userId,
    );

    // ── Save document metadata to MongoDB
    const doc = await VaultDocument.create({
      ownerId:           userId,
      folderId:          parsed.data.folderId   || undefined,
      categoryId:        parsed.data.categoryId || undefined,
      title:             parsed.data.title,
      description:       parsed.data.description,
      originalFilename:  file.name,
      mimeType:          file.type,
      sizeBytes:         file.size,
      cloudinaryPublicId: cloudinaryResult.publicId,
      cloudinaryUrl:     cloudinaryResult.secureUrl,
      sha256Hash,
      encryptionIV:      iv,
      encryptionAuthTag: authTag,
      blockchainVerified: false,
      tags:              parsed.data.tags ?? [],
    });

    // ── Register on blockchain asynchronously (non-blocking)
    registerDocumentOnChain(doc._id.toString(), userId, sha256Hash)
      .then(async (result) => {
        await VaultDocument.findByIdAndUpdate(doc._id, {
          blockchainTxHash:  result.txHash,
          blockchainVerified: true,
        });
        await BlockchainTransaction.create({
          documentId:      doc._id.toString(),
          ownerId:         userId,
          sha256Hash,
          txHash:          result.txHash,
          blockNumber:     result.blockNumber,
          contractAddress: process.env.CONTRACT_ADDRESS!,
          eventType:       'register',
        });
      })
      .catch((e) => console.error('[Blockchain] Registration failed for doc', doc._id, e));

    // ── Audit log
    await logAudit({
      actorId:      userId,
      actorRole:    'owner',
      action:       'document.upload',
      resourceType: 'document',
      resourceId:   doc._id.toString(),
      metadata:     { filename: file.name, sizeBytes: file.size, sha256Hash },
    });

    return successResponse(
      {
        documentId:  doc._id.toString(),
        title:       doc.title,
        sha256Hash,
        sizeBytes:   file.size,
        cloudinaryUrl: cloudinaryResult.secureUrl,
      },
      201,
    );
  } catch (error) {
    console.error('[POST /api/documents/upload]', error);
    return errorResponse('Upload failed');
  }
}
