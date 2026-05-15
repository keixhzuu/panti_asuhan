const { firestore, fieldValue } = require('../config/firebaseAdmin');

async function syncKebutuhanRealtime(kebutuhan) {
  await firestore.collection('update_kebutuhan_realtime').doc(String(kebutuhan.id)).set({
    ...kebutuhan,
    updated_at: fieldValue.serverTimestamp()
  }, { merge: true });
}

async function logDonationNotification(notification) {
  await firestore.collection('notifikasi_donatur').add({
    ...notification,
    created_at: fieldValue.serverTimestamp()
  });
}

async function logTransparansiTimeline(entry) {
  await firestore.collection('transparansi_timeline').add({
    ...entry,
    created_at: fieldValue.serverTimestamp()
  });
}

async function logBuktiFoto(entry) {
  await firestore.collection('bukti_foto').add({
    ...entry,
    created_at: fieldValue.serverTimestamp()
  });
}

async function logCeritaAktivitas(entry) {
  await firestore.collection('cerita_log_aktivitas_panti').add({
    ...entry,
    created_at: fieldValue.serverTimestamp()
  });
}

async function listCollection(collectionName, orderByField = 'created_at') {
  const snapshot = await firestore.collection(collectionName).orderBy(orderByField, 'desc').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function listNotificationsByDonatur(idDonatur) {
  const snapshot = await firestore.collection('notifikasi_donatur')
    .where('id_donatur', '==', Number(idDonatur))
    .orderBy('created_at', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

module.exports = {
  syncKebutuhanRealtime,
  logDonationNotification,
  logTransparansiTimeline,
  logBuktiFoto,
  logCeritaAktivitas,
  listCollection,
  listNotificationsByDonatur
};
