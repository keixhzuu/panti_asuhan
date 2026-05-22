const { Pool } = require('pg');
const { hashPassword } = require('../src/utils/password');
const env = require('../src/config/env');

async function run() {
  const pool = new Pool({ connectionString: env.databaseUrl });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@panti.local';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
    const donorEmail = process.env.SEED_DONOR_EMAIL || 'donatur@panti.local';
    const donorPassword = process.env.SEED_DONOR_PASSWORD || 'Donatur123!';

    const adminHash = await hashPassword(adminPassword);
    const donorHash = await hashPassword(donorPassword);

    const pantiLookup = await client.query('SELECT * FROM panti WHERE email_panti = $1 LIMIT 1', ['panti@example.com']);
    const pantiRow = pantiLookup.rowCount > 0
      ? pantiLookup.rows[0]
      : (await client.query(
          `INSERT INTO panti (nama_panti, alamat, no_telepon, email_panti) VALUES ($1, $2, $3, $4) RETURNING *`,
          ['Panti Asuhan Contoh', 'Jl. Contoh No.1, Jakarta', '081234567890', 'panti@example.com']
        )).rows[0];

    const adminLookup = await client.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [adminEmail]);
    if (adminLookup.rowCount === 0) {
      await client.query(
        `INSERT INTO users (email, password_hash, role, id_panti) VALUES ($1, $2, $3, $4)`,
        [adminEmail, adminHash, 'pengurus', pantiRow.id]
      );
    }

    const donorLookup = await client.query('SELECT * FROM donatur WHERE email = $1 LIMIT 1', [donorEmail]);
    const donorRow = donorLookup.rowCount > 0
      ? donorLookup.rows[0]
      : (await client.query(
          `INSERT INTO donatur (nama, email, no_hp, alamat) VALUES ($1, $2, $3, $4) RETURNING *`,
          ['Donatur Contoh', donorEmail, '081234567891', 'Bandung']
        )).rows[0];

    const donorUserLookup = await client.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [donorEmail]);
    if (donorUserLookup.rowCount === 0) {
      await client.query(
        `INSERT INTO users (email, password_hash, role, id_donatur) VALUES ($1, $2, $3, $4)`,
        [donorEmail, donorHash, 'donatur', donorRow.id]
      );
    }

    const kebutuhanLookup = await client.query(
      'SELECT * FROM kebutuhan_logistik WHERE id_panti = $1 AND nama_barang = $2 LIMIT 1',
      [pantiRow.id, 'Beras 25kg']
    );
    const kebutuhanRow = kebutuhanLookup.rowCount > 0
      ? kebutuhanLookup.rows[0]
      : (await client.query(
          `INSERT INTO kebutuhan_logistik (id_panti, nama_barang, jumlah_dibutuhkan, harga_satuan, satuan, tingkat_urgensi, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [pantiRow.id, 'Beras 25kg', 10, 250000, 'karung', 'Penting', 'aktif']
        )).rows[0];

    const donasiLookup = await client.query(
      'SELECT * FROM donasi WHERE id_donatur = $1 AND id_kebutuhan = $2 LIMIT 1',
      [donorRow.id, kebutuhanRow.id]
    );
    if (donasiLookup.rowCount === 0) {
      await client.query(
        `INSERT INTO donasi (id_donatur, id_kebutuhan, nominal, metode_bayar, bukti_transfer_url, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [donorRow.id, kebutuhanRow.id, 250000, 'Transfer Bank', null, 'verifikasi']
      );
    }

    await client.query('COMMIT');

    console.log('Seed selesai. Admin akun:');
    console.log('  email:', adminEmail);
    console.log('  password:', adminPassword);
    console.log('  panti_id:', pantiRow.id);
    console.log('Seed donatur contoh:');
    console.log('  email:', donorEmail);
    console.log('  password:', donorPassword);
    console.log('  kebutuhan sample: Beras 25kg');
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
