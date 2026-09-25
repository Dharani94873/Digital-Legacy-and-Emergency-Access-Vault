import { z } from 'zod';

// ──────────────────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email:        z.string().min(1, 'Email or username is required'),
  password:     z.string().min(1, 'Password is required'),
  expectedRole: z.enum(['owner', 'nominee']).optional(),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30)
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
  email:    z.string().email('Invalid email address'),
  role:     z.enum(['owner', 'nominee']),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token:           z.string().min(1),
  password:        z.string().min(8),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ──────────────────────────────────────────────────────────
// Document
// ──────────────────────────────────────────────────────────
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export const uploadDocumentSchema = z.object({
  title:       z.string().min(1, 'Title is required').max(200),
  description: z.string().max(500).optional(),
  folderId:    z.string().optional(),
  categoryId:  z.string().optional(),
  tags:        z.array(z.string()).optional(),
});

// ──────────────────────────────────────────────────────────
// Folder
// ──────────────────────────────────────────────────────────
export const createFolderSchema = z.object({
  name:           z.string().min(1, 'Folder name is required').max(100),
  description:    z.string().max(300).optional(),
  parentFolderId: z.string().optional(),
  color:          z.string().refine(val => /^#[0-9A-Fa-f]{6}$/.test(val) || ['indigo', 'violet', 'sky', 'emerald', 'amber', 'rose'].includes(val), 'Invalid color').optional(),
  icon:           z.string().optional(),
});

// ──────────────────────────────────────────────────────────
// Nominee
// ──────────────────────────────────────────────────────────
export const inviteNomineeSchema = z.object({
  nomineeUsername:    z.string().min(3, 'Username must be at least 3 characters').max(30)
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
  waitingPeriodDays:  z.union([
    z.literal(7),  z.literal(15),  z.literal(30),
    z.literal(60), z.literal(90),  z.literal(180), z.literal(365),
  ]),
  allowedFolderIds:   z.array(z.string()).optional(),
  allowedDocumentIds: z.array(z.string()).optional(),
});

// Nominee uses this to redeem a secret code and link themselves to an owner
export const redeemSecretCodeSchema = z.object({
  secretCode: z.string().length(8, 'Secret code must be 8 characters').toUpperCase(),
});

export const updateNomineeSchema = z.object({
  waitingPeriodDays:  z.union([
    z.literal(7),  z.literal(15),  z.literal(30),
    z.literal(60), z.literal(90),  z.literal(180), z.literal(365),
  ]).optional(),
  allowedFolderIds:   z.array(z.string()).optional(),
  allowedDocumentIds: z.array(z.string()).optional(),
});

// ──────────────────────────────────────────────────────────
// Emergency Request
// ──────────────────────────────────────────────────────────
export const emergencyRequestSchema = z.object({
  ownerId: z.string().min(1, 'Owner is required'),
  reason:  z.string().min(10, 'Please provide a reason (min 10 characters)').max(1000),
});

// ──────────────────────────────────────────────────────────
// Settings
// ──────────────────────────────────────────────────────────
export const updateSettingsSchema = z.object({
  defaultWaitingPeriodDays: z.union([
    z.literal(7),  z.literal(15),  z.literal(30),
    z.literal(60), z.literal(90),  z.literal(180), z.literal(365),
  ]).optional(),
});

export const updateProfileSchema = z.object({
  fullName:         z.string().min(2).max(100),
  phone:            z.string().optional(),
  bio:              z.string().max(500).optional(),
  address:          z.string().optional(),
  emergencyContact: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword:     z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
});
