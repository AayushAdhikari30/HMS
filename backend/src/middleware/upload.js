import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";

// Files land under UPLOAD_ROOT/labs/. In Docker this directory is a mounted
// volume (see docker-compose.yml) so images survive container rebuilds —
// without that mount they'd vanish the moment the image is rebuilt.
const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const LAB_IMAGE_DIR = path.join(UPLOAD_ROOT, "labs");
fs.mkdirSync(LAB_IMAGE_DIR, { recursive: true });

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, LAB_IMAGE_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const multerUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, WEBP, or GIF images are allowed"));
    }
    cb(null, true);
  },
}).single("image");

// multer reports its own errors (oversized file, wrong type) by calling
// next(err) — left unhandled, those fall through to the generic 500 handler
// instead of a clear 400. This wrapper turns them into a proper response.
export const uploadLabImage = (req, res, next) => {
  multerUpload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Upload failed" });
    }
    next();
  });
};
