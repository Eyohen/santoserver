'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

/** Where /uploads is reachable from outside. Never taken from request headers, which a caller controls. */
function publicBase() {
  const base = process.env.PUBLIC_BASE_URL || (process.env.NODE_ENV === 'production' ? '' : `http://localhost:${process.env.API_PORT || 9000}`);
  if (!base) throw new Error('Set PUBLIC_BASE_URL (this server\'s public address) or configure Cloudinary to store uploads.');
  return base.replace(/\/+$/, '');
}

/** Stores an uploaded image (multer file) on Cloudinary if configured, otherwise on this server. Returns its URL. */
async function saveImage(file) {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    const { v2: cloudinary } = require('cloudinary');
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'santo-veste' }, (err, r) => (err ? reject(err) : resolve(r.secure_url)))
        .end(file.buffer);
    });
  }
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[file.mimetype];
  const name = `${crypto.randomBytes(8).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), file.buffer);
  return `${publicBase()}/uploads/${name}`;
}

module.exports = { saveImage, UPLOAD_DIR };
