// ============================================================
// Digital Legacy and Emergency Access Vault — Shared Types
// ============================================================

export type UserRole = 'owner' | 'nominee' | 'admin';
export type NomineeStatus = 'pending' | 'active' | 'revoked';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'auto-approved';
export type WaitingPeriodDays = 7 | 15 | 30 | 60 | 90 | 180 | 365;
export type DocumentCategory =
  | 'insurance'
  | 'medical'
  | 'legal'
  | 'property'
  | 'identity'
  | 'investment'
  | 'emergency'
  | 'other';

// ----------------------------------------------------------
// User
// ----------------------------------------------------------
export interface IUser {
  _id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  isSuspended: boolean;
  emailVerified: boolean;
  invitationToken?: string;
  invitedByOwnerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ----------------------------------------------------------
// Profile
// ----------------------------------------------------------
export interface IProfile {
  _id: string;
  userId: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  address?: string;
  emergencyContact?: string;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ----------------------------------------------------------
// Folder
// ----------------------------------------------------------
export interface IFolder {
  _id: string;
  ownerId: string;
  name: string;
  description?: string;
  parentFolderId?: string;
  color?: string;
  icon?: string;
  isShared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ----------------------------------------------------------
// Document
// ----------------------------------------------------------
export interface IDocument {
  _id: string;
  ownerId: string;
  folderId?: string;
  categoryId?: string;
  title: string;
  description?: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  sha256Hash: string;
  blockchainTxHash?: string;
  blockchainVerified: boolean;
  encryptionIV: string;
  encryptionAuthTag: string;
  isDeleted: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ----------------------------------------------------------
// Category
// ----------------------------------------------------------
export interface ICategory {
  _id: string;
  ownerId: string;
  name: string;
  type: DocumentCategory;
  description?: string;
  icon?: string;
  color?: string;
  createdAt: Date;
}

// ----------------------------------------------------------
// Nominee
// ----------------------------------------------------------
export interface INominee {
  _id: string;
  ownerId: string;
  nomineeUserId?: string;
  nomineeEmail: string;
  status: NomineeStatus;
  waitingPeriodDays: WaitingPeriodDays;
  allowedFolderIds: string[];
  allowedDocumentIds: string[];
  invitationToken: string;
  invitedAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ----------------------------------------------------------
// Emergency Request
// ----------------------------------------------------------
export interface IEmergencyRequest {
  _id: string;
  nomineeId: string;
  ownerId: string;
  status: RequestStatus;
  reason: string;
  requestedAt: Date;
  resolvedAt?: Date;
  ownerNotifiedAt?: Date;
  warningEmailSentAt?: Date;
  autoApprovalScheduledAt: Date;
  grantedDocumentIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ----------------------------------------------------------
// Audit Log
// ----------------------------------------------------------
export interface IAuditLog {
  _id: string;
  actorId: string;
  actorRole: UserRole;
  targetUserId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// ----------------------------------------------------------
// Notification
// ----------------------------------------------------------
export interface INotification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityId?: string;
  relatedEntityType?: string;
  createdAt: Date;
}

// ----------------------------------------------------------
// Blockchain Transaction
// ----------------------------------------------------------
export interface IBlockchainTransaction {
  _id: string;
  documentId: string;
  ownerId: string;
  sha256Hash: string;
  txHash: string;
  blockNumber: number;
  network: string;
  contractAddress: string;
  eventType: 'register' | 'verify' | 'emergency_approval';
  timestamp: Date;
}

// ----------------------------------------------------------
// Settings
// ----------------------------------------------------------
export interface ISettings {
  _id: string;
  userId: string;
  defaultWaitingPeriodDays: WaitingPeriodDays;
  emailNotifications: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ----------------------------------------------------------
// API Response shapes
// ----------------------------------------------------------
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ----------------------------------------------------------
// Session / Auth
// ----------------------------------------------------------
export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  image?: string;
}

// ----------------------------------------------------------
// Upload
// ----------------------------------------------------------
export interface UploadResult {
  documentId: string;
  cloudinaryUrl: string;
  sha256Hash: string;
  blockchainTxHash?: string;
  sizeBytes: number;
}

// ----------------------------------------------------------
// Dashboard Stats
// ----------------------------------------------------------
export interface OwnerDashboardStats {
  totalDocuments: number;
  totalStorageBytes: number;
  totalNominees: number;
  activeNominees: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  blockchainVerifiedCount: number;
  recentActivities: IAuditLog[];
}

export interface NomineeDashboardStats {
  totalOwners: number;
  pendingRequests: number;
  approvedRequests: number;
  accessibleDocuments: number;
  unreadNotifications: number;
}
