const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { hashPassword } = require('../src/utils/password');
const env = require('../src/config/env');

async function run() {
  const pool = new Pool({ connectionString: env.databaseUrl });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // create a sample panti
    const pantiRes = await client.query(
      `INSERT INTO panti (nama_panti, alamat, no_telepon, email_panti) VALUES ($1, $2, $3, $4) RETURNING *`,
      ['Panti Asuhan Contoh', 'Jl. Contoh No.1, Jakarta', '081234567890', 'panti@example.com']
    );

    const pantiId = pantiRes.rows[0].id;

    // create admin user as pengurus (linked to panti)
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@panti.local';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
    const hashed = await hashPassword(adminPassword);

    // upsert donatur row is not needed for pengurus; create user with id_panti set
    const userRes = await client.query(
      `INSERT INTO users (email, password_hash, role, id_panti) VALUES ($1, $2, $3, $4) RETURNING *`,
      [adminEmail, hashed, 'pengurus', pantiId]
    );

    await client.query('COMMIT');

    console.log('Seed selesai. Admin akun:');
    console.log('  email:', adminEmail);
    console.log('  password:', adminPassword);
    console.log('  panti_id:', pantiId);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed gagal:', err.message || err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
