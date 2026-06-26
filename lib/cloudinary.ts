import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure:     true,
});

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  bytes: number;
  format: string;
}

/**
 * Upload an encrypted file buffer to Cloudinary.
 * The buffer should always be the AES-256-GCM encrypted bytes — never raw plaintext.
 *
 * @param encryptedBuffer  The encrypted file bytes.
 * @param filename         Sanitized original filename (used as public_id prefix).
 * @param ownerId          Owner's MongoDB ObjectId string (used in folder path).
 */
export async function uploadEncryptedFile(
  encryptedBuffer: Buffer,
  filename: string,
  ownerId: string,
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: `digital-legacy-vault/${ownerId}`,
        public_id: `enc_${Date.now()}_${filename.replace(/[^a-zA-Z0-9]/g, '_')}`,
        overwrite: false,
        access_mode: 'authenticated', // private — signed URLs only
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }
        resolve({
          publicId:  result.public_id,
          secureUrl: result.secure_url,
          bytes:     result.bytes,
          format:    result.format,
        });
      },
    );
    uploadStream.end(encryptedBuffer);
  });
}

/**
 * Download the encrypted file bytes from Cloudinary using a signed URL.
 */
export async function downloadEncryptedFile(publicId: string): Promise<Buffer> {
  // Generate a short-lived signed URL (1 minute is enough for a server-side download)
  const signedUrl = cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'authenticated',
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 60,
  });

  const response = await fetch(signedUrl);
  if (!response.ok) {
    throw new Error(`Failed to download from Cloudinary: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Delete a file from Cloudinary permanently.
 */
export async function deleteFile(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: 'raw', invalidate: true });
}

export default cloudinary;
