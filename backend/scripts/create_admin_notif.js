const { logAdminNotification } = require('../src/utils/firestore');

async function run() {
  try {
    const ref = await logAdminNotification({
      judul: 'Notifikasi Tes',
      pesan: 'Ini adalah notifikasi admin untuk pengujian',
      meta: { source: 'e2e' }
    });

    if (!ref) {
      console.log('Firestore not enabled or write skipped.');
      return;
    }

    // If add() returned a DocumentReference, print its id
    console.log('Created admin notification, id:', ref.id || ref.path || ref.name || JSON.stringify(ref));
  } catch (err) {
    console.error('Error creating admin notification:', err.message || err);
    process.exitCode = 2;
  }
}

run();
