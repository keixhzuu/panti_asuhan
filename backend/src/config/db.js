const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl:
    env.nodeEnv === 'production'
      ? { rejectUnauthorized: false }
      : false
});

pool.on('error', (error) => {
  console.error('Koneksi PostgreSQL bermasalah:', error.message);
});

module.exports = pool;
