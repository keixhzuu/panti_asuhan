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
 - `.devops/`: helper scripts to create Cloud Build triggers and setup secrets

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

### Membuat Cloud Build triggers & secrets

Jika Anda ingin agar build berjalan otomatis dari GitHub, gunakan skrip di `.devops/` untuk membuat trigger dan menyiapkan Secret Manager.

Contoh: buat trigger (GitHub) dan tambahkan secret `DATABASE_URL`:

```bash
# buat trigger (ganti PROJECT_ID dan REPO_NAME)
./.devops/create_cloud_build_triggers.sh YOUR_GCP_PROJECT_ID YOUR_GITHUB_REPO_NAME

# buat secret dan tambahkan versi (bash)
./.devops/setup_secrets.sh YOUR_GCP_PROJECT_ID
echo -n "postgresql://USER:PASSWORD@HOST:5432/donasi-panti" | \
	gcloud secrets versions add DATABASE_URL --project=YOUR_GCP_PROJECT_ID --data-file=-
```

Catatan:
- Trigger `donasi-backend-trigger` akan menjalankan `backend/cloudbuild.yaml` untuk perubahan pada `backend/**`.
- Trigger `donasi-frontend-trigger` akan menjalankan `frontend/cloudbuild.yaml` untuk perubahan pada `frontend/**`.
- Pastikan integrasi GitHub dengan Cloud Build sudah dikonfigurasi (Cloud Build GitHub App atau Cloud Source Repositories).

Jika Anda ingin saya buat atau jalankan perintah `gcloud` untuk membuat trigger/secret, beri akses GCP atau jalankan perintah di mesin yang memiliki kredensial gcloud.
