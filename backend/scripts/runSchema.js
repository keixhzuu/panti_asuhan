const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const env = require('../src/config/env');

async function run() {
  const schemaPath = path.join(__dirname, '../../database/schema.sql');
  console.log('Membaca file skema dari:', schemaPath);
  
  if (!fs.existsSync(schemaPath)) {
    console.error('File schema.sql tidak ditemukan!');
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  const pool = new Pool({ connectionString: env.databaseUrl });
  const client = await pool.connect();

  try {
    console.log('Memulai migrasi skema database...');
    await client.query(sql);
    console.log('Migrasi skema database berhasil selesai!');
  } catch (err) {
    console.error('Gagal menjalankan skema database:', err.message || err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
