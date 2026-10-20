const multer = require('multer');

const maxBytes = Number(process.env.UPLOAD_MAX_BYTES) || 5 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxBytes, files: 1 },
  fileFilter(req, file, callback) {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowed.has(file.mimetype)) {
      const error = new Error('Upload a JPEG, PNG, or WebP image.');
      error.status = 400;
      return callback(error);
    }
    callback(null, true);
  }
});

function validateImageSignature(req, res, next) {
  if (!req.file) return next();
  const bytes = req.file.buffer;
  const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const webp = bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (!jpeg && !png && !webp) return res.status(400).json({ error: 'The uploaded file is not a supported image.' });
  req.imageMimeType = jpeg ? 'image/jpeg' : png ? 'image/png' : 'image/webp';
  return next();
}

module.exports = { upload, validateImageSignature, maxBytes };
