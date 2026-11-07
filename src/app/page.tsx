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
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { LandingNavbar } from '@/components/landing/LandingNavbar';

export const dynamic = 'force-dynamic';

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

  const siteName = cms.site_name || 'Virtual Tour 360°';
  const heroTitle = cms.hero_title || 'Jelajahi Setiap Sudut Ruang dengan Pengalaman 360° Interaktif';
  const heroSubtitle =
    cms.hero_subtitle ||
    'Platform terpadu untuk merancang, menghubungkan panorama indoor & outdoor, dan mempublikasikan virtual tour berstandar Google Street View.';
  const heroCtaLabel = cms.hero_cta_label || 'Jelajahi Tur Sekarang';
  const heroCtaUrl = cms.hero_cta_url || '#featured-tours';
  const footerText = cms.footer_text || '© 2026 Virtual Tour 360°. Seluruh Hak Cipta Dilindungi.';

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-600 selection:text-white select-none transition-colors">
      {/* 1. RESPONSIVE NAVBAR WITH ACTIVE HAMBURGER & DARK MODE */}
      <LandingNavbar siteName={siteName} />

      {/* 2. HERO SECTION */}
      <section className="relative pt-24 pb-20 px-6 md:px-12 max-w-6xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Interactive 360° Panorama Navigation Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.08]">
          {heroTitle}
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {heroSubtitle}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a href={heroCtaUrl}>
            <Button size="lg" variant="gradient" className="w-full sm:w-auto shadow-lg shadow-indigo-600/25">
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
      <section id="featured-tours" className="py-20 px-6 md:px-12 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Virtual Tour Unggulan
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Jelajahi kampus, fasilitas umum, dan gedung secara langsung dari browser Anda
            </p>
          </div>

          {publishedTours.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {publishedTours.map((t) => (
                <Card key={t.id} className="overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="relative aspect-16/9 bg-slate-900 overflow-hidden">
                    {t.coverMedia ? (
                      <img
                        src={`/${t.coverMedia.storageKey}`}
                        alt={t.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 bg-gradient-to-br from-slate-900 to-indigo-950">
                        <Compass className="w-12 h-12 opacity-30" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge variant="success" hasDot>360° LIVE</Badge>
                    </div>
                  </div>

                  <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-lg font-bold">{t.title}</CardTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {t.description || 'Virtual tour interaktif 360°.'}
                    </p>
                  </CardHeader>

                  <CardContent className="mt-auto pt-0 p-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 py-4">
                    <span className="text-xs text-slate-400 font-medium">
                      {t._count.scenes} Titik Scene • {t._count.views} Kunjungan
                    </span>
                    <Link href={`/tour/${t.slug}`}>
                      <Button size="sm" variant="gradient" className="text-xs">
                        <span>Jelajahi</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 max-w-lg mx-auto">
              <Compass className="w-10 h-10 mx-auto text-slate-400 mb-3 opacity-50" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Belum Ada Tur yang Dipublikasikan</h3>
              <p className="text-xs text-slate-500 mt-1">
                Masuk ke panel Studio untuk mulai mengunggah panorama dan mempublikasikan virtual tour pertama Anda.
              </p>
              <div className="mt-5">
                <Link href="/login">
                  <Button size="sm" variant="gradient">Buka Studio Admin</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. ARCHITECTURAL HIGHLIGHTS */}
      <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Fitur Inti Kelas Industri
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Dirancang dari dasar dengan performa WebGL tinggi, navigasi graf terarah, dan editor visual presisi
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-4 hover:border-indigo-500/40 transition">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Marzipano WebGL Engine</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Viewer panorama 360° performa tinggi dengan inersia panning alami, kontrol zoom halus, dan dukungan perangkat layar sentuh.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-4 hover:border-violet-500/40 transition">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Navigasi Graf Terarah</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Hubungkan gerbang outdoor, lobi, koridor, ruang kelas, hingga laboratorium dengan validasi reachability BFS/DFS sebelum publikasi.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-4 hover:border-sky-500/40 transition">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center">
              <Map className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Denah Interaktif & Minimap</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Integrasi denah per lantai dengan koordinat ternormalisasi (0..1) dan sinkronisasi otomatis posisi scene aktif saat pengunjung menjelajah.
            </p>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-12 px-6 md:px-12 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>{footerText}</p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-indigo-600 dark:hover:text-white transition">
              Login Admin
            </Link>
            <a href="#featured-tours" className="hover:text-indigo-600 dark:hover:text-white transition">
              Tur Publik
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}