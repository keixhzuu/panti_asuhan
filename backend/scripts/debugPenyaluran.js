const { Pool } = require('pg');
const env = require('../src/config/env');

async function run() {
  const pool = new Pool({ connectionString: env.databaseUrl });
  const client = await pool.connect();
  try {
    const idDonasi = process.argv[2] || '1';
    const res = await client.query(
      'SELECT id, id_donasi, bukti_url, tanggal_salur FROM penyaluran_dana WHERE id_donasi = $1',
      [idDonasi]
    );
    if (res.rowCount === 0) {
      console.log('Tidak ada penyaluran untuk donasi', idDonasi);
    } else {
      console.log('Penyaluran rows:', res.rows);
    }
  } catch (err) {
    console.error('Error:', err.message || err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
