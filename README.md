# Sistem Donasi Panti Asuhan

Repositori ini berisi aplikasi full-stack untuk sistem donasi panti asuhan.

## Isi
- Backend: Node.js + Express
- Frontend: React + Vite + Tailwind CSS
- Database SQL: PostgreSQL
- Realtime/Log: Firestore
- Upload file: Cloud Storage
- Deploy: Cloud Run, App Engine, Cloud Build

## Struktur
- `backend/`: REST API dan integrasi database
- `frontend/`: UI donatur dan pengurus
- `database/schema.sql`: skema PostgreSQL
- `cloudbuild.yaml`: contoh pipeline CI/CD

## Catatan
- Isi file `.env.example` di backend dan frontend sebelum menjalankan aplikasi.
- Skema Firestore digunakan untuk data realtime kebutuhan, notifikasi, bukti foto, dan timeline transparansi.
