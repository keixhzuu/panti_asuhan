-- 1. Tabel donatur
CREATE TABLE donatur (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    no_hp VARCHAR(20),
    alamat TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel panti
CREATE TABLE panti (
    id SERIAL PRIMARY KEY,
    nama_panti VARCHAR(255) NOT NULL,
    alamat TEXT,
    no_telepon VARCHAR(20),
    email_panti VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel users (autentikasi)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('pengurus', 'donatur')),
    id_donatur INT NULL REFERENCES donatur(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel kebutuhan_logistik
CREATE TABLE kebutuhan_logistik (
    id SERIAL PRIMARY KEY,
    id_panti INT NOT NULL REFERENCES panti(id) ON DELETE CASCADE,
    nama_barang VARCHAR(255) NOT NULL,
    jumlah_dibutuhkan INT NOT NULL,
    harga_satuan DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (harga_satuan >= 0),
    satuan VARCHAR(50),
    tingkat_urgensi VARCHAR(20) DEFAULT 'Biasa' CHECK (tingkat_urgensi IN ('Penting', 'Biasa')),
    status VARCHAR(20) DEFAULT 'aktif' CHECK (status IN ('aktif', 'selesai')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel donasi
CREATE TABLE donasi (
    id SERIAL PRIMARY KEY,
    id_donatur INT NOT NULL REFERENCES donatur(id) ON DELETE CASCADE,
    id_kebutuhan INT NOT NULL REFERENCES kebutuhan_logistik(id),
    jumlah_donasi INT NOT NULL DEFAULT 1 CHECK (jumlah_donasi > 0),
    nominal DECIMAL(15,2) NOT NULL,
    metode_bayar VARCHAR(50),
    bukti_transfer_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verifikasi', 'ditolak', 'refund_diajukan', 'refund_disetujui')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel penyaluran_dana
CREATE TABLE penyaluran_dana (
    id SERIAL PRIMARY KEY,
    id_donasi INT NOT NULL REFERENCES donasi(id) ON DELETE CASCADE,
    id_panti INT NOT NULL REFERENCES panti(id),
    jumlah_disalurkan DECIMAL(15,2) NOT NULL,
    tanggal_salur DATE NOT NULL,
    deskripsi_penggunaan TEXT,
    bukti_url TEXT,
    status_penyaluran VARCHAR(20) DEFAULT 'proses' CHECK (status_penyaluran IN ('proses', 'berhasil')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- 8. Tabel cerita_aktivitas (baru)
CREATE TABLE cerita_aktivitas (
    id SERIAL PRIMARY KEY,
    id_panti INT NOT NULL REFERENCES panti(id) ON DELETE CASCADE,
    judul VARCHAR(255) NOT NULL,
    konten TEXT NOT NULL,
    foto_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
