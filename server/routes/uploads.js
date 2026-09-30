const express = require('express');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();
const uploadsDir = path.resolve(process.env.IMAGE_UPLOAD_DIR || path.join(__dirname, '../uploads'));
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = {
  'image/jpeg': { extension: 'jpg', signature: [0xff, 0xd8, 0xff] },
  'image/png': { extension: 'png', signature: [0x89, 0x50, 0x4e, 0x47] },
  'image/webp': { extension: 'webp', signature: [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50] },
};

router.post('/image', authenticateAdmin, async (req, res) => {
  try {
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(req.body?.image || '');
    if (!match) {
      return res.status(400).json({ error: 'Choose a JPEG, PNG, or WebP image.' });
    }

    const [, mimeType, base64] = match;
    const image = Buffer.from(base64, 'base64');
    const type = IMAGE_TYPES[mimeType];
    if (!image.length || image.length > MAX_IMAGE_BYTES) {
      return res.status(400).json({ error: 'Images must be smaller than 8 MB.' });
    }
    const signatureMatches = type.signature.every((byte, index) => {
      if (mimeType === 'image/webp' && index >= 4 && index <= 7) return true;
      return image[index] === byte;
    });
    if (!signatureMatches) {
      return res.status(400).json({ error: 'The selected file does not match its image type.' });
    }

    await fs.mkdir(uploadsDir, { recursive: true });
    const filename = `${crypto.randomUUID()}.${type.extension}`;
    await fs.writeFile(path.join(uploadsDir, filename), image, { flag: 'wx' });
    res.status(201).json({ success: true, url: `/uploads/${filename}` });
  } catch (err) {
    console.error('Image upload failed:', err);
    res.status(500).json({ error: 'Could not save image on the server.' });
  }
});

module.exports = router;
