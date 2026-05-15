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
    id_panti INT NULL REFERENCES panti(id) ON DELETE CASCADE,
    id_donatur INT NULL REFERENCES donatur(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel kebutuhan_logistik
CREATE TABLE kebutuhan_logistik (
    id SERIAL PRIMARY KEY,
    id_panti INT NOT NULL REFERENCES panti(id) ON DELETE CASCADE,
    nama_barang VARCHAR(255) NOT NULL,
    jumlah_dibutuhkan INT NOT NULL,
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
    nominal DECIMAL(15,2) NOT NULL,
    metode_bayar VARCHAR(50),
    bukti_transfer_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'terverifikasi', 'diterima')),
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
    status_penyaluran VARCHAR(20) DEFAULT 'proses' CHECK (status_penyaluran IN ('proses', 'berhasil')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabel laporan_transparansi
CREATE TABLE laporan_transparansi (
    id SERIAL PRIMARY KEY,
    id_penyaluran INT NOT NULL REFERENCES penyaluran_dana(id) ON DELETE CASCADE,
    total_dana_masuk DECIMAL(15,2) NOT NULL,
    total_dana_keluar DECIMAL(15,2) NOT NULL,
    saldo_akhir DECIMAL(15,2) NOT NULL,
    periode_bulan DATE NOT NULL,
    file_laporan_url TEXT,
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
