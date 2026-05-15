const { Storage } = require('@google-cloud/storage');
const env = require('./env');

const storage = new Storage({
  projectId: env.gcpProjectId || undefined
});

const bucket = storage.bucket(env.gcsBucketName);

module.exports = {
  storage,
  bucket
};
