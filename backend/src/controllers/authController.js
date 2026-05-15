const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');

function buildProfile(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    id_donatur: row.id_donatur,
    id_panti: row.id_panti,
    nama: row.nama || row.nama_panti || row.email,
    no_hp: row.no_hp || null,
    alamat: row.alamat || row.alamat_panti || null,
    nama_panti: row.nama_panti || null
  };
}

const register = asyncHandler(async (req, res) => {
  const { email, password, nama, no_hp, alamat } = req.body;
  const role = 'donatur';

  if (!email || !password || !nama) {
    return res.status(400).json({ message: 'Email, password, dan nama wajib diisi.' });
  }

  const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUser.rowCount > 0) {
    return res.status(409).json({ message: 'Email sudah terdaftar.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const hashedPassword = await hashPassword(password);
    const donaturResult = await client.query(
      'INSERT INTO donatur (nama, email, no_hp, alamat) VALUES ($1, $2, $3, $4) RETURNING *',
      [nama, email, no_hp || null, alamat || null]
    );

    const userResult = await client.query(
      'INSERT INTO users (email, password_hash, role, id_donatur) VALUES ($1, $2, $3, $4) RETURNING *',
      [email, hashedPassword, role, donaturResult.rows[0].id]
    );

    await client.query('COMMIT');

    const token = signToken({
      userId: userResult.rows[0].id,
      email,
      role,
      idDonatur: donaturResult.rows[0].id,
      idPanti: null
    });

    return sendSuccess(res, 'Registrasi donatur berhasil.', {
      token,
      user: buildProfile({
        ...userResult.rows[0],
        nama,
        no_hp,
        alamat
      })
    }, 201);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi.' });
  }

  const result = await pool.query(
    `SELECT
      u.*,
      d.nama,
      d.no_hp,
      d.alamat,
      p.nama_panti,
      p.alamat AS alamat_panti
    FROM users u
    LEFT JOIN donatur d ON d.id = u.id_donatur
    LEFT JOIN panti p ON p.id = u.id_panti
    WHERE u.email = $1
    LIMIT 1`,
    [email]
  );

  const user = result.rows[0];
  if (!user) {
    return res.status(401).json({ message: 'Email atau password salah.' });
  }

  const passwordValid = await comparePassword(password, user.password_hash);
  if (!passwordValid) {
    return res.status(401).json({ message: 'Email atau password salah.' });
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    idDonatur: user.id_donatur,
    idPanti: user.id_panti
  });

  return sendSuccess(res, 'Login berhasil.', {
    token,
    user: buildProfile(user)
  });
});

const me = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const result = await pool.query(
    `SELECT
      u.*,
      d.nama,
      d.no_hp,
      d.alamat,
      p.nama_panti,
      p.alamat AS alamat_panti
    FROM users u
    LEFT JOIN donatur d ON d.id = u.id_donatur
    LEFT JOIN panti p ON p.id = u.id_panti
    WHERE u.id = $1
    LIMIT 1`,
    [userId]
  );

  const user = result.rows[0];
  if (!user) {
    return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
  }

  return sendSuccess(res, 'Profil berhasil dimuat.', buildProfile(user));
});

module.exports = {
  register,
  login,
  me
};
