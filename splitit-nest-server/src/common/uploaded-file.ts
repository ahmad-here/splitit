/**
 * The slice of a Multer upload this app actually uses. Declared locally so the
 * code does not depend on the global `Express.Multer` namespace augmentation
 * from @types/multer, which editors often fail to pick up.
 */
export type UploadedFileLike = {
  mimetype: string;
  buffer: Buffer;
  originalname?: string;
  size?: number;
};
