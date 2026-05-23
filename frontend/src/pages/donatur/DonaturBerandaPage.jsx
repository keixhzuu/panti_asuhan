import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Badge, Button, Card, PageShell } from '../../components/UI';

export default function DonaturBerandaPage() {
  const [stories, setStories] = useState([]);
  const [pantis, setPantis] = useState([]);
  const [selectedPanti, setSelectedPanti] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/cerita'),
      api.get('/panti')
    ])
      .then(([storiesRes, pantisRes]) => {
        setStories(storiesRes.data.data.slice(0, 3));
        setPantis(pantisRes.data.data);
      })
      .catch(() => { });
  }, []);

  return (
    <PageShell
      title="Beranda Donatur"
      subtitle="Lihat ringkasan, cerita aktivitas panti, dan akses cepat ke katalog kebutuhan realtime, tracking dana, serta riwayat donasi pribadi."
      actions={[
        <Button key="donasi" as={Link} to="/donatur/donasi">Donasi Sekarang</Button>
      ]}
    >
      {/* Scope animations style block */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}} />



      {/* Panti List Section */}
      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-slate-800">Panti Asuhan Terdaftar</h2>
          <Badge tone="moss">Mitra Aktif</Badge>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Klik card panti asuhan untuk melihat detail profil, alamat, kontak, dan deskripsi panti.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pantis.map((panti) => (
            <div
              key={panti.id}
              onClick={() => setSelectedPanti(panti)}
              className="group cursor-pointer overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-teal-200 transition-all duration-300 flex flex-col"
            >
              {panti.foto_panti_url ? (
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={panti.foto_panti_url}
                    alt={panti.nama_panti}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="text-white text-xs font-bold uppercase tracking-wider">Lihat Detail →</span>
                  </div>
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center border-b border-slate-100 relative">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-teal-600/40">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5-10.5-11.25 3m-1.5 10.5H18.75M2.25 9v12m0-12 3.75-1.364m0 0 3-1m3-1 3.75-1.364m-3.75 1.364V21m3.75-1.364V3.545" />
                  </svg>
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-ink group-hover:text-teal-600 transition-colors">
                    {panti.nama_panti}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">
                    {panti.alamat || 'Alamat belum diatur.'}
                  </p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <span>Hubungi Kami</span>
                  <span className="text-teal-600 group-hover:translate-x-1 transition-transform duration-300">Detail →</span>
                </div>
              </div>
            </div>
          ))}
          {pantis.length === 0 ? (
            <p className="col-span-full text-center text-sm text-slate-400 py-8">
              Belum ada panti asuhan yang terdaftar.
            </p>
          ) : null}
        </div>
      </Card>

      {/* Cerita Terbaru */}
      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Cerita terbaru</h2>
          <Badge tone="sea">Dari API SQL</Badge>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {stories.map((story) => (
            <div key={story.id} className="rounded-3xl border border-slate-200 bg-white p-4">
              {story.foto_url ? <img src={story.foto_url} alt={story.judul} className="mb-3 h-44 w-full rounded-2xl object-cover" /> : null}
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-ember/70">{story.nama_panti}</p>
              <h3 className="mt-2 font-bold text-ink">{story.judul}</h3>
              <p className="mt-2 text-sm text-slate-600">{story.konten}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Detail Panti Modal */}
      {selectedPanti && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
            {/* Header/Banner */}
            <div className="relative h-64 bg-slate-100 shrink-0">
              {selectedPanti.foto_panti_url ? (
                <img
                  src={selectedPanti.foto_panti_url}
                  alt={selectedPanti.nama_panti}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-20 h-20 text-white/30">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5-10.5-11.25 3m-1.5 10.5H18.75M2.25 9v12m0-12 3.75-1.364m0 0 3-1m3-1 3.75-1.364m-3.75 1.364V21m3.75-1.364V3.545" />
                  </svg>
                </div>
              )}
              {/* Close Button */}
              <button
                onClick={() => setSelectedPanti(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center text-white transition-all focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6">
              <div>
                <span className="inline-block px-3 py-1 text-xs font-bold text-teal-700 bg-teal-50 rounded-full">
                  Panti Asuhan Mitra
                </span>
                <h2 className="font-display font-bold text-2xl md:text-3xl text-ink mt-2">
                  {selectedPanti.nama_panti}
                </h2>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Tentang Panti</h4>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                  {selectedPanti.deskripsi || 'Belum ada deskripsi profil panti asuhan.'}
                </p>
              </div>

              {/* Info Grid */}
              <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-slate-100">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Alamat</h5>
                    <p className="text-sm text-slate-600 mt-0.5">{selectedPanti.alamat || '—'}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 0 1-7.108-7.108c-.155-.44.01-1.02.387-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">No. Telepon</h5>
                    <p className="text-sm text-slate-600 mt-0.5">{selectedPanti.no_telepon || '—'}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</h5>
                    <p className="text-sm text-slate-600 mt-0.5">{selectedPanti.email_panti || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0 gap-3">
              <Button onClick={() => setSelectedPanti(null)} variant="soft">
                Tutup
              </Button>
              <Button as={Link} to={`/donatur/donasi?id_panti=${selectedPanti.id}`} onClick={() => setSelectedPanti(null)}>
                Donasi Sekarang
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
