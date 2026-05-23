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

## Deploy GCP

Pipeline CI/CD dipisah per folder:
- Backend: `backend/cloudbuild.yaml` + `backend/Dockerfile` untuk Cloud Run.
- Frontend: `frontend/cloudbuild.yaml` + `frontend/app.yaml` untuk App Engine.

Substitusi yang perlu disiapkan saat menjalankan Cloud Build:
- `_DATABASE_URL`: connection string PostgreSQL produksi untuk backend Cloud Run.
- `_BACKEND_URL`: URL Cloud Run backend, dipakai saat build frontend.
- `_GCS_BUCKET_NAME`: nama bucket GCS produksi. Default saat ini `projek-tcc-donasi-panti`.

Contoh submit manual backend:
```bash
gcloud builds submit \
	--config backend/cloudbuild.yaml \
	--substitutions=_DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/donasi-panti"
```

Contoh submit manual frontend:
```bash
gcloud builds submit \
	--config frontend/cloudbuild.yaml \
	--substitutions=_BACKEND_URL="https://YOUR-BACKEND-URL.a.run.app"
```

Catatan tambahan:
- Backend Cloud Run memakai `NODE_ENV`, `GCP_PROJECT_ID`, `GCS_BUCKET_NAME`, `CORS_ORIGIN`, dan `DATABASE_URL` dari deploy Cloud Build.
- Frontend App Engine memakai service `donasi-panti-frontend` dan server statis di `frontend/server.js`.
