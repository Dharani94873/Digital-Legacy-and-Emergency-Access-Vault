import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAuth, isNextResponse, successResponse, errorResponse } from '@/lib/utils';
import Nominee from '@/models/Nominee';
import EmergencyRequest from '@/models/EmergencyRequest';
import VaultDocument from '@/models/Document';
import Profile from '@/models/Profile';
import User from '@/models/User';

// GET /api/nominees/documents
export async function GET(request: NextRequest) {
  const auth = await requireAuth(['owner', 'nominee']);
  if (isNextResponse(auth)) return auth;
  const { userId } = auth;

  try {
    await connectToDatabase();

    // 1. Find all active nominee associations for this user
    const nominations = await Nominee.find({
      nomineeUserId: userId,
      status: 'active',
    }).lean();

    if (!nominations.length) {
      return successResponse([]);
    }

    const allAccessibleDocs = [];

    // 2. Loop through nominations to find approved emergency requests and allowed documents
    for (const nominee of nominations) {
      // Check if there is an approved or auto-approved emergency request
      const approvedRequest = await EmergencyRequest.findOne({
        ownerId: nominee.ownerId,
        nomineeId: nominee._id.toString(),
        status: { $in: ['approved', 'auto-approved'] },
      }).lean();

      if (!approvedRequest) {
        continue; // No approved access yet for this owner
      }

      // Fetch owner details for display
      const ownerUser = await User.findById(nominee.ownerId).select('email').lean();
      const ownerProfile = await Profile.findOne({ userId: nominee.ownerId }).select('fullName').lean();
      const ownerName = ownerProfile?.fullName ?? ownerUser?.email ?? 'Unknown Owner';

      // Retrieve all active documents for this owner
      const ownerDocs = await VaultDocument.find({
        ownerId: nominee.ownerId,
        isDeleted: false,
      }).select('-encryptionIV -encryptionAuthTag').lean();

      // Filter documents based on nominee permissions (explicit allowed documents OR document inside allowed folders)
      const allowedDocIds = new Set(nominee.allowedDocumentIds.map((id) => id.toString()));
      const allowedFolderIds = new Set(nominee.allowedFolderIds.map((id) => id.toString()));

      const filteredDocs = ownerDocs.filter((doc) => {
        const isDocAllowed = allowedDocIds.has(doc._id.toString());
        const isFolderAllowed = doc.folderId && allowedFolderIds.has(doc.folderId.toString());
        return isDocAllowed || isFolderAllowed;
      });

      // Enrich with owner information
      const enrichedDocs = filteredDocs.map((doc) => ({
        ...doc,
        ownerName,
        ownerEmail: ownerUser?.email ?? '',
      }));

      allAccessibleDocs.push(...enrichedDocs);
    }

    // Sort documents by creation date descending
    allAccessibleDocs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return successResponse(allAccessibleDocs);
  } catch (error) {
    console.error('[GET /api/nominees/documents]', error);
    return errorResponse('Failed to fetch nominee documents');
  }
}
