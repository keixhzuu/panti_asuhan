const { Pool } = require('pg');
const env = require('../src/config/env');

async function run() {
  const pool = new Pool({ connectionString: env.databaseUrl });
  const client = await pool.connect();
  try {
    const id = process.argv[2] || '1';
    const res = await client.query('SELECT id, bukti_transfer_url FROM donasi WHERE id = $1', [id]);
    if (res.rowCount === 0) {
      console.log('Donasi tidak ditemukan untuk id', id);
    } else {
      console.log('Donasi:', res.rows[0]);
    }
  } catch (err) {
    console.error('Error:', err.message || err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
