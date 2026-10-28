import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import {
  Compass,
  ArrowRight,
  Shield,
  Layers,
  Map,
  Eye,
  CheckCircle2,
  Sparkles, ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';



export default async function LandingPage() {
  // Fetch dynamic CMS settings and published tours from MySQL
  const [settingsList, publishedTours] = await Promise.all([
    prisma.siteSetting.findMany(),
    prisma.tour.findMany({
      where: { status: 'PUBLISHED', visibility: 'PUBLIC' },
      take: 6,
      orderBy: { publishedAt: 'desc' },
      include: {
        coverMedia: true,
        _count: { select: { scenes: true, views: true } },
      },
    }),
  ]);

  const cms: Record<string, string> = {};
  for (const s of settingsList) {
    cms[s.settingKey] = s.settingValue;
  }

  const siteName = cms.site_name || 'Virtual Tour 360Â°';
  const heroTitle = cms.hero_title || 'Jelajahi Setiap Sudut Ruang dengan Pengalaman 360Â° Interaktif';
  const heroSubtitle =
    cms.hero_subtitle ||
    'Platform terpadu untuk merancang, menghubungkan panorama indoor & outdoor, dan mempublikasikan virtual tour berstandar Google Street View.';
  const heroCtaLabel = cms.hero_cta_label || 'Jelajahi Tur Sekarang';
  const heroCtaUrl = cms.hero_cta_url || '#featured-tours';
  const footerText = cms.footer_text || 'Â© 2026 Virtual Tour 360Â°. Seluruh Hak Cipta Dilindungi.';

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-zinc-900 selection:text-white select-none">
      {/* 1. NAVBAR */}
      <header className="h-20 border-b border-zinc-100 dark:border-zinc-900 sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-sm">
            360Â°
          </div>
          <div>
            <span className="font-bold text-base tracking-tight">{siteName}</span>
            <span className="block text-[10px] text-zinc-400 font-medium">STUDIO & BUILDER</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
          <a href="#featured-tours" className="hover:text-zinc-900 dark:hover:text-white transition">
            Tur Unggulan
          </a>
          <a href="#features" className="hover:text-zinc-900 dark:hover:text-white transition">
            Fitur Utama
          </a>
          <a href="#architecture" className="hover:text-zinc-900 dark:hover:text-white transition">
            Arsitektur
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button size="sm" variant="outline">
              Masuk Studio
            </Button>
          </Link>
          <a href="#featured-tours" className="hidden sm:inline-block">
            <Button size="sm">Mulai Jelajah</Button>
          </a>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-24 pb-20 px-6 md:px-12 max-w-6xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>Interactive 360Â° Panorama Navigation Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-white max-w-4xl mx-auto leading-[1.08]">
          {heroTitle}
        </h1>

        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          {heroSubtitle}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a href={heroCtaUrl}>
            <Button size="lg" className="w-full sm:w-auto shadow-md">
              <span>{heroCtaLabel}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </a>
          <Link href="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Buka Studio Editor
            </Button>
          </Link>
        </div>
      </section>

      {/* 3. FEATURED TOURS SECTION */}
      <section id="featured-tours" className="py-20 px-6 md:px-12 bg-zinc-50 dark:bg-zinc-900/40 border-y border-zinc-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Virtual Tour Unggulan
            </h2>
            <p className="text-sm text-zinc-500">
              Jelajahi kampus, fasilitas umum, dan gedung secara langsung dari browser Anda
            </p>
          </div>

          {publishedTours.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {publishedTours.map((t) => (
                <Card key={t.id} className="overflow-hidden flex flex-col group hover:shadow-lg transition">
                  <div className="relative aspect-16/9 bg-zinc-900 overflow-hidden">
                    {t.coverMedia ? (
                      <img
                        src={`/${t.coverMedia.storageKey}`}
                        alt={t.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <Compass className="w-12 h-12 opacity-30" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge variant="success">360Â° LIVE</Badge>
                    </div>
                  </div>

                  <CardHeader>
                    <CardTitle className="text-lg">{t.title}</CardTitle>
                    <p className="text-xs text-zinc-500 line-clamp-2 mt-1">
                      {t.description || 'Virtual tour interaktif 360Â°.'}
                    </p>
                  </CardHeader>

                  <CardContent className="mt-auto pt-0 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 py-4">
                    <span className="text-xs text-zinc-400 font-medium">
                      {t._count.scenes} Titik Scene â€¢ {t._count.views} Kunjungan
                    </span>
                    <Link href={`/tour/${t.slug}`}>
                      <Button size="sm" className="text-xs">
                        <span>Jelajahi</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 max-w-lg mx-auto">
              <Compass className="w-10 h-10 mx-auto text-zinc-400 mb-3 opacity-50" />
              <h3 className="text-base font-semibold">Belum Ada Tur yang Dipublikasikan</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Masuk ke panel Studio untuk mulai mengunggah panorama dan mempublikasikan virtual tour pertama Anda.
              </p>
              <div className="mt-5">
                <Link href="/login">
                  <Button size="sm">Buka Studio Admin</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. ARCHITECTURAL HIGHLIGHTS */}
      <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Fitur Inti Kelas Industri
          </h2>
          <p className="text-sm text-zinc-500">
            Dirancang dari dasar dengan performa WebGL tinggi, navigasi graf terarah, dan editor visual presisi
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Marzipano WebGL Engine</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Viewer panorama 360Â° performa tinggi dengan inersia panning alami, kontrol zoom halus, dan dukungan perangkat layar sentuh.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Navigasi Graf Terarah</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Hubungkan gerbang outdoor, lobi, koridor, ruang kelas, hingga laboratorium dengan validasi reachability BFS/DFS sebelum publikasi.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center">
              <Map className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Denah Interaktif & Minimap</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Integrasi denah per lantai dengan koordinat ternormalisasi (0..1) dan sinkronisasi otomatis posisi scene aktif saat pengunjung menjelajah.
            </p>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="border-t border-zinc-100 dark:border-zinc-900 py-12 px-6 md:px-12 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p>{footerText}</p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-zinc-900 dark:hover:text-white transition">
              Login Admin
            </Link>
            <a href="#featured-tours" className="hover:text-zinc-900 dark:hover:text-white transition">
              Tur Publik
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}