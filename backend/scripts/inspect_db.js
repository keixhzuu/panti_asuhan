const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const needs = await client.query('SELECT id, nama_barang, jumlah_dibutuhkan, status FROM kebutuhan_logistik');
    console.log('\n--- KEBUTUHAN LOGISTIK ---');
    console.table(needs.rows);

    const donations = await client.query('SELECT id, id_kebutuhan, jumlah_donasi, status, nominal FROM donasi');
    console.log('\n--- DONASI ---');
    console.table(donations.rows);
  } catch (err) {
    console.error('Error:', err.message || err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
