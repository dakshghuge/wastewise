function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Request body must contain valid JSON.' });
  }
  if (error.code === 'LIMIT_FILE_SIZE') {
    const maxBytes = Number(process.env.UPLOAD_MAX_BYTES) || 5 * 1024 * 1024;
    return res.status(413).json({ error: `Image exceeds the ${Math.round(maxBytes / (1024 * 1024) * 10) / 10} MB upload limit.` });
  }
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Upload one image using the image field.' });
  }
  if (error.status) return res.status(error.status).json({ error: error.message });
  console.error(`${req.method} ${req.path}: ${error.message}`);
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
}

module.exports = { errorHandler };
