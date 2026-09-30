import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export interface UploadResult {
  imageUrl: string;
  key: string;
}

export class StorageService {
  private static s3Client: S3Client | null = null;
  public static readonly ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  public static readonly MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

  /**
   * Initializes or returns the AWS S3 client for Supabase Storage
   */
  private static getS3Client(): S3Client | null {
    if (!this.s3Client && process.env.SUPABASE_S3_ACCESS_KEY_ID && process.env.SUPABASE_S3_SECRET_ACCESS_KEY) {
      this.s3Client = new S3Client({
        endpoint: process.env.SUPABASE_S3_ENDPOINT || 'https://pietmtvgtfpguinrcxbx.storage.supabase.co/storage/v1/s3',
        region: process.env.SUPABASE_S3_REGION || 'ap-south-1',
        credentials: {
          accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY,
        },
        forcePathStyle: true,
      });
    }
    return this.s3Client;
  }

  /**
   * Validates MIME type and file size limits
   */
  public static validateImageFile(file: Express.Multer.File): void {
    if (!file) {
      throw new AppError('No image file provided for upload', 400);
    }

    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new AppError(
        `Unsupported file type '${file.mimetype}'. Only PNG, JPEG, and WEBP image files are allowed.`,
        400
      );
    }

    if (file.size > this.MAX_FILE_SIZE_BYTES) {
      throw new AppError('Image file exceeds the maximum allowed size of 5MB', 400);
    }
  }

  /**
   * Extracts project reference from the Supabase S3 endpoint
   */
  private static getProjectRef(): string {
    const endpoint = process.env.SUPABASE_S3_ENDPOINT || 'https://pietmtvgtfpguinrcxbx.storage.supabase.co/storage/v1/s3';
    try {
      const hostname = new URL(endpoint).hostname;
      return hostname.split('.')[0] || 'pietmtvgtfpguinrcxbx';
    } catch {
      return 'pietmtvgtfpguinrcxbx';
    }
  }

  /**
   * Uploads an artwork image buffer to Supabase S3 Storage (or local fallback)
   */
  public static async uploadArtworkImage(file: Express.Multer.File, artistId: string): Promise<UploadResult> {
    this.validateImageFile(file);

    const ext = file.mimetype === 'image/jpeg' ? 'jpg' : file.mimetype === 'image/webp' ? 'webp' : 'png';
    const randomHex = crypto.randomBytes(6).toString('hex');
    const objectKey = `artworks/${artistId}/${Date.now()}-${randomHex}.${ext}`;

    const client = this.getS3Client();
    const bucket = process.env.SUPABASE_S3_BUCKET || 'nakshi-artworks';

    if (client && process.env.NODE_ENV !== 'test') {
      try {
        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: objectKey,
          Body: file.buffer,
          ContentType: file.mimetype,
          CacheControl: 'max-age=31536000',
        });

        await client.send(command);

        const projectRef = this.getProjectRef();
        const publicUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/${bucket}/${objectKey}`;

        return {
          imageUrl: publicUrl,
          key: objectKey,
        };
      } catch (error: any) {
        console.error('[StorageService] Error uploading to Supabase S3:', error);
        throw new AppError(`Failed to upload image to Supabase Storage: ${error.message || 'Unknown S3 error'}`, 500);
      }
    }

    // Local / Test Environment Fallback
    const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads', 'artworks', artistId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const localFilePath = path.join(uploadDir, `${Date.now()}-${randomHex}.${ext}`);
    fs.writeFileSync(localFilePath, file.buffer);

    const relativePath = path.relative(path.resolve('.'), localFilePath).replace(/\\/g, '/');
    const fallbackUrl = `/uploads/${objectKey}`;

    return {
      imageUrl: fallbackUrl,
      key: objectKey,
    };
  }
}
