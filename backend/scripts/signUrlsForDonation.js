const { Pool } = require('pg');
const env = require('../src/config/env');
const { getSignedUrlForStoredUrl } = require('../src/utils/storage');

async function run() {
  const pool = new Pool({ connectionString: env.databaseUrl });
  const client = await pool.connect();
  try {
    const idDonasi = process.argv[2] || '1';
    const res = await client.query('SELECT id, bukti_url FROM penyaluran_dana WHERE id_donasi = $1', [idDonasi]);
    if (res.rowCount === 0) {
      console.log('Tidak ada penyaluran untuk donasi', idDonasi);
    } else {
      for (const row of res.rows) {
        console.log('Row', row.id, 'stored:', row.bukti_url);
        try {
          const signed = await getSignedUrlForStoredUrl(row.bukti_url);
          console.log('  signed:', signed);
        } catch (err) {
          console.log('  signing failed:', err.message || err);
        }
      }
    }
  } catch (err) {
    console.error('Error:', err.message || err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
