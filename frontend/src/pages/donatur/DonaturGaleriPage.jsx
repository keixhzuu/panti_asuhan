import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Badge, Card, PageShell } from '../../components/UI';

export default function DonaturGaleriPage() {
  const [items, setItems] = useState([]);
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    api.get('/donatur/galeri')
      .then((response) => setItems(response.data.data))
      .catch(() => {});
  }, []);

  return (
    <PageShell title="Galeri Bukti" subtitle="Semua foto penyaluran dan bukti kegiatan yang tersimpan di Firestore dikumpulkan di sini.">
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

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Foto bukti</h2>
          <Badge tone="sea">Realtime</Badge>
        </div>
        
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => setActivePhoto(item)}
              className="group cursor-pointer overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-teal-200 transition-all duration-300 flex flex-col"
            >
              {item.url ? (
                <div className="h-56 w-full overflow-hidden relative border-b border-slate-55">
                  <img
                    src={item.url}
                    alt={item.deskripsi || 'Bukti'}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white" className="w-8 h-8 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.603 10.602L15 15z" />
                    </svg>
                  </div>
                </div>
              ) : null}
              <div className="p-4 text-sm font-medium text-slate-600 flex-1 leading-relaxed">
                {item.deskripsi || 'Bukti penyaluran'}
              </div>
            </div>
          ))}
          {items.length === 0 ? (
            <p className="col-span-full text-center text-sm text-slate-400 py-12 font-medium">
              Belum ada foto bukti penyaluran yang tersedia.
            </p>
          ) : null}
        </div>
      </Card>

      {/* WhatsApp-style Image Viewer Popup */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-sm animate-fade-in"
          onClick={() => setActivePhoto(null)}
        >
          {/* Header Controls */}
          <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-b from-black/60 to-transparent shrink-0 text-white z-10">
            <span className="text-sm font-semibold truncate max-w-[70%]">
              {activePhoto.deskripsi || 'Detail Foto Bukti'}
            </span>
            <div className="flex gap-4">
              <a
                href={activePhoto.url}
                target="_blank"
                rel="noreferrer"
                download
                onClick={(e) => e.stopPropagation()}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-white"
                title="Buka File Asli"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
              <button
                onClick={() => setActivePhoto(null)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-white focus:outline-none"
                title="Tutup"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Centered Image Container */}
          <div className="flex-1 flex items-center justify-center p-4 relative">
            <img
              src={activePhoto.url}
              alt={activePhoto.deskripsi || 'Bukti'}
              className="max-w-full max-h-[82vh] object-contain rounded-lg shadow-2xl animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Footer Caption */}
          {activePhoto.deskripsi && (
            <div className="bg-black/60 border-t border-white/5 px-6 py-6 text-center text-white shrink-0 z-10">
              <p className="text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                {activePhoto.deskripsi}
              </p>
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
