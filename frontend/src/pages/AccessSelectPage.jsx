import { Link } from 'react-router-dom';
import { Button, Card } from '../components/UI';

const cards = [
  {
    title: 'Masuk Admin',
    description: 'Untuk pengurus panti: dashboard, kebutuhan, verifikasi donasi, penyaluran, cerita, dan laporan transparansi.',
    to: '/admin/login',
    cta: 'Login Admin',
    tone: 'bg-ink text-white'
  },
  {
    title: 'Masuk Donatur',
    description: 'Untuk user/donatur: registrasi, login, katalog realtime, donasi digital, riwayat, tracking, dan notifikasi.',
    to: '/donatur/login',
    cta: 'Login Donatur',
    tone: 'bg-white text-ink'
  }
];

export default function AccessSelectPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-paper via-amber-50 to-teal-50 px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-stretch">
        <div className="flex-1 rounded-[2rem] bg-ink p-8 text-white shadow-glow lg:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-200">Sistem Donasi Panti Asuhan</p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-tight lg:text-6xl">
            Pilih akses sesuai yang dibutuhkan.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 lg:text-base">
            Admin dapat mengakses operasional panti dan transparansi. Donatur dapat mengakses registrasi, donasi, dan pemantauan real-time.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-bold text-amber-200">Admin</p>
              <p className="mt-2 text-sm text-slate-300">Dashboard, kelola data panti, kebutuhan, verifikasi, penyaluran, cerita, laporan.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-bold text-teal-200">Donatur</p>
              <p className="mt-2 text-sm text-slate-300">Registrasi, transparansi realtime, donasi digital, riwayat, galeri, notifikasi.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-5">
          {cards.map((item) => (
            <Card key={item.title} className="flex h-full flex-col justify-between p-6 lg:p-8">
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
              <Button as={Link} to={item.to} className={`mt-6 w-full ${item.tone === 'bg-ink text-white' ? 'bg-ink text-white' : ''}`} variant={item.tone === 'bg-ink text-white' ? 'primary' : 'outline'}>
                {item.cta}
              </Button>
            </Card>
          ))}
          <Card className="p-6">
            <p className="text-sm text-slate-600">
              Belum punya akun donatur? <Link to="/register" className="font-semibold text-ember">Daftar di sini</Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
