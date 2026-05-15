const { Storage } = require('@google-cloud/storage');
const env = require('./env');

let storage = null;
let bucket = null;
let storageEnabled = false;

try {
  if (!env.gcsBucketName) {
    throw new Error('GCS bucket name not configured');
  }

  storage = new Storage({ projectId: env.gcpProjectId || undefined });
  bucket = storage.bucket(env.gcsBucketName);
  storageEnabled = true;
  console.log('GCS storage initialized for bucket:', env.gcsBucketName);
} catch (err) {
  console.warn('GCS storage not initialized, uploads will be disabled:', err.message || err);
  storage = null;
  bucket = null;
  storageEnabled = false;
}

module.exports = {
  storage,
  bucket,
  storageEnabled
};
