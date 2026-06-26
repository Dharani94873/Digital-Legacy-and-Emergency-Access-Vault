import crypto from 'crypto';

const ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY!;

// Check removed for Next.js static build time compatibility

const ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY_HEX || '0'.repeat(64), 'hex');

// ──────────────────────────────────────────────────────────
// SHA-256 Hash
// ──────────────────────────────────────────────────────────
export function generateSHA256Hash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// ──────────────────────────────────────────────────────────
// AES-256-GCM Encrypt
// ──────────────────────────────────────────────────────────
export interface EncryptResult {
  encryptedBuffer: Buffer;
  iv: string;        // hex
  authTag: string;   // hex
}

export function encryptFile(fileBuffer: Buffer): EncryptResult {
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(fileBuffer),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encryptedBuffer: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

// ──────────────────────────────────────────────────────────
// AES-256-GCM Decrypt
// ──────────────────────────────────────────────────────────
export function decryptFile(
  encryptedBuffer: Buffer,
  ivHex: string,
  authTagHex: string,
): Buffer {
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
}

// ──────────────────────────────────────────────────────────
// Verify integrity: recompute hash and compare
// ──────────────────────────────────────────────────────────
export function verifyHash(buffer: Buffer, expectedHash: string): boolean {
  const computed = generateSHA256Hash(buffer);
  return computed === expectedHash;
}
