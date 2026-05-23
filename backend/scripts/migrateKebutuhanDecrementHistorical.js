const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // For each need, find the sum of verified donations
    const res = await client.query(`
      SELECT id_kebutuhan, SUM(jumlah_donasi) as total_verified
      FROM donasi
      WHERE status = 'verifikasi'
      GROUP BY id_kebutuhan
    `);
    
    for (const row of res.rows) {
      const { id_kebutuhan, total_verified } = row;
      console.log(`Need ID ${id_kebutuhan}: subtracting ${total_verified} verified pcs...`);
      
      const updateRes = await client.query(`
        UPDATE kebutuhan_logistik
        SET 
          jumlah_dibutuhkan = GREATEST(0, jumlah_dibutuhkan - $1),
          status = CASE WHEN jumlah_dibutuhkan - $1 <= 0 THEN 'selesai' ELSE status END
        WHERE id = $2
        RETURNING *
      `, [total_verified, id_kebutuhan]);
      
      console.log(`Updated need:`, updateRes.rows[0]);
    }
    
    await client.query('COMMIT');
    console.log('Historical need decrement completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error running migration:', err.message || err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
