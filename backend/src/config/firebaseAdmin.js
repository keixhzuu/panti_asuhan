const admin = require('firebase-admin');
const env = require('./env');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: env.gcpProjectId || undefined,
    databaseURL: env.firebaseDatabaseUrl || undefined,
    storageBucket: env.gcsBucketName || undefined
  });
}

const firestore = admin.firestore();
const fieldValue = admin.firestore.FieldValue;

module.exports = {
  admin,
  firestore,
  fieldValue
};
