import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../lib/api';
import { Badge, Button, Card, PageShell } from '../../components/UI';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function DonaturCeritaDetailPage() {
  const { id } = useParams();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get(`/cerita/${id}`)
      .then((response) => {
        if (mounted) setStory(response.data.data);
      })
      .catch(() => {
        if (mounted) setStory(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  const photoUrls = useMemo(() => {
    if (Array.isArray(story?.foto_urls) && story.foto_urls.length > 0) {
      return story.foto_urls;
    }
    if (story?.foto_url) {
      return [story.foto_url];
    }
    return [];
  }, [story]);

  if (loading) {
    return <PageShell title="Cerita Panti" subtitle="Memuat cerita...">Memuat cerita...</PageShell>;
  }

  if (!story) {
    return (
      <PageShell title="Cerita Panti" subtitle="Cerita yang kamu cari tidak ditemukan.">
        <Card className="p-6">
          <p className="text-sm text-slate-500">Cerita tidak ditemukan atau telah dihapus.</p>
          <div className="mt-4">
            <Button as={Link} to="/donatur/beranda">Kembali ke beranda</Button>
          </div>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell title="Cerita Panti" subtitle="Ikuti cerita kami untuk dapatkan update terbaru soal panti dan sejenisnya.">
      <div className="grid gap-6">
        <Card className="overflow-hidden p-0">
          <div className="relative h-72 bg-slate-100">
            {photoUrls[0] ? (
              <img src={photoUrls[0]} alt={story.judul} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-amber-50 to-emerald-50 text-slate-400">
                <div className="text-center">
                  <p className="text-sm font-semibold">Tidak ada foto utama</p>
                  <p className="text-xs">Cerita ini belum memiliki gambar unggulan.</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="sea">{story.nama_panti}</Badge>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">Diunggah {formatDate(story.created_at)}</span>
                </div>
                <Button as={Link} to={`/donatur/donasi?id_panti=${story.id_panti}`}>
                  Donasi Sekarang
                </Button>
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-ink leading-tight">
                {story.judul}
              </h1>
            </div>

            <article className="prose prose-slate max-w-none prose-headings:font-display prose-headings:text-ink prose-a:text-teal-600">
              <p className="whitespace-pre-line text-[15px] leading-8 text-slate-700">{story.konten}</p>
            </article>

            {photoUrls.length > 1 ? (
              <div>
                <h2 className="font-semibold text-slate-800 mb-3">Galeri Foto</h2>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {photoUrls.map((photoUrl, index) => (
                    <a key={`${photoUrl}-${index}`} href={photoUrl} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                      <img src={photoUrl} alt={`${story.judul} ${index + 1}`} className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
