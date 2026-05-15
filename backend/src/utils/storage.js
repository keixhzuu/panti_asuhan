const path = require('path');
const crypto = require('crypto');
const { bucket } = require('../config/storage');

function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function uploadBufferToStorage(file, folder) {
  if (!file) {
    return null;
  }

  const extension = path.extname(file.originalname || '').toLowerCase();
  const objectName = `${folder}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}${extension}`;
  const storageFile = bucket.file(objectName);

  await storageFile.save(file.buffer, {
    contentType: file.mimetype,
    resumable: false,
    metadata: {
      cacheControl: 'public, max-age=31536000'
    }
  });

  return {
    path: objectName,
    url: `https://storage.googleapis.com/${bucket.name}/${objectName}`,
    fileName: sanitizeFileName(file.originalname || 'file')
  };
}

module.exports = {
  uploadBufferToStorage
};
