import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

/**
 * Uploads images to Cloudinary and returns a stable https URL. The single place
 * image bytes are offloaded, so persistence keeps only URLs (receipt data URLs
 * never land in Firestore, avoiding the ~1 MB doc limit).
 *
 * Config (either form):
 *   - CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
 *   - or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET
 *
 * Uses signed server-side uploads (api_secret), so no unsigned upload preset is
 * needed. Configured lazily so the server still boots without Cloudinary set —
 * only image persistence needs it.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private configured = false;

  private ensureConfigured(): boolean {
    if (this.configured) return true;

    const url = process.env.CLOUDINARY_URL;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (url) {
      // Parse cloudinary://<api_key>:<api_secret>@<cloud_name> explicitly — the
      // SDK only auto-reads CLOUDINARY_URL when config() is called with NO args.
      const m = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(url.trim());
      if (!m) {
        this.logger.warn('CLOUDINARY_URL is malformed.');
        return false;
      }
      cloudinary.config({ api_key: m[1], api_secret: m[2], cloud_name: m[3], secure: true });
      this.configured = true;
    } else if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
      this.configured = true;
    } else {
      this.logger.warn('Cloudinary is not configured (set CLOUDINARY_URL or CLOUDINARY_* vars).');
      return false;
    }
    return true;
  }

  /**
   * Upload a `data:<mime>;base64,<...>` image and return its https URL.
   * If the input is already an http(s) URL (or empty), it's returned unchanged
   * so callers can pass through without branching. Returns undefined if
   * Cloudinary isn't configured or the upload fails (callers treat images as
   * best-effort).
   */
  async uploadDataUrl(uid: string, dataUrl: string | undefined, folder = 'receipts'): Promise<string | undefined> {
    if (!dataUrl) return undefined;
    if (!/^data:/.test(dataUrl)) return dataUrl; // already a URL — nothing to upload
    if (!this.ensureConfigured()) return undefined;

    try {
      const res = await cloudinary.uploader.upload(dataUrl, {
        folder: `${folder}/${uid}`,
        resource_type: 'image',
      });
      return res.secure_url;
    } catch (err) {
      this.logger.warn(`Cloudinary upload failed: ${err instanceof Error ? err.message : err}`);
      return undefined;
    }
  }
}
