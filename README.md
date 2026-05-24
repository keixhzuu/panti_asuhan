# Sistem Donasi Panti Asuhan

Repositori ini berisi aplikasi full-stack untuk sistem donasi panti asuhan menggunakan konsep Decoupled Architecture di atas layanan Cloud (PaaS).

## Isi
- **Backend:** Node.js + Express (Deployed to Google Cloud Run)
- **Frontend:** React + Vite + Tailwind CSS (Deployed to Firebase Hosting)
- **Database SQL:** PostgreSQL
- **Realtime/Log:** Firestore
- **Upload file:** Cloud Storage
- **Deploy Pipeline:** Cloud Build (Backend) & Firebase CLI (Frontend)

## Struktur Folder
- `backend/`: REST API, integrasi database, dan konfigurasi Cloud Run
- `frontend/`: UI donatur, pengurus, konfigurasi Firebase Hosting, dan folder `dist` hasil build
- `database/schema.sql`: Skema database PostgreSQL
- `backend/cloudbuild.yaml`: Pipeline CI/CD untuk otomatisasi deploy backend
- `.devops/`: Helper scripts untuk setup Secret Manager di GCP

## Catatan Konfigurasi (.env)
Sebelum menjalankan atau melakukan *deploy* aplikasi, pastikan Anda telah menyalin dan mengisi file lingkungan:
1. **Backend:** Isi `.env.example` di dalam folder `backend/` menjadi `.env`.
2. **Frontend:** Isi `.env.example` di dalam folder `frontend/` menjadi `.env` dengan mengarahkan `VITE_API_BASE_URL` ke URL Cloud Run backend yang sudah aktif, serta memasukkan Firebase SDK Config yang sesuai dengan project.

---

## Panduan Lengkap Deploy ke Cloud (PaaS)

### 1. Backend (Google Cloud Run via Cloud Build)
Backend dideploy sebagai container serverless ke Google Cloud Run. Pengelolaan infrastruktur sepenuhnya diatur secara otomatis oleh Google Cloud Platform.

#### A. Persiapan Awal GCP
1. Pastikan Anda sudah menginstal **Google Cloud CLI** di komputer lokal.
2. Login ke akun GCP Anda melalui terminal:
   ```bash
   gcloud auth login
3. Set project GCP aktif Anda (Ganti YOUR_GCP_PROJECT_ID dengan ID project asli Anda):
	```bash
	gcloud config set project YOUR_GCP_PROJECT_ID

#### B. Cara Submit Manual Backend
1. Jalankan perintah ini dari root folder repositori untuk mengirimkan kode backend ke Cloud Build secara manual:
	```bash
	gcloud builds submit --config backend/cloudbuild.yaml --region us-central1
2. (Opsional) Jika ingin mengaktifkan trigger otomatis setiap melakukan git push ke GitHub beserta konfigurasi Secret Manager, jalankan skrip berikut:
	```bash
	chmod +x .devops/*.sh
	./.devops/create_cloud_build_triggers.sh YOUR_GCP_PROJECT_ID YOUR_GITHUB_REPO_NAME
	./.devops/setup_secrets.sh YOUR_GCP_PROJECT_ID
	echo -n "postgresql://USER:PASSWORD@HOST:5432/donasi-panti" | gcloud secrets versions add DATABASE_URL --project=YOUR_GCP_PROJECT_ID --data-file=-

#### c. Deploy Frontend Hosting Firebase
1. Install Firebase CLI secara global dan lakukan login akun:
	````bash
	npm install -g firebase-tools
	firebase login
2. Masuk ke folder frontend dan lakukan inisialisasi awal (hanya perlu dilakukan sekali):
	````bash
	cd frontend
	firebase init hosting
(Pilih Use an existing project, arahkan ke project Anda, isi public directory dengan dist, pilih Yes untuk single-page app, dan pilih No saat ditanya overwrite index.html).

3. Jalankan perintah kompilasi dan deploy setiap kali ada perubahan kode atau update file .env:
	```bash
	cd frontend
	npm run build
	firebase deploy --only hosting