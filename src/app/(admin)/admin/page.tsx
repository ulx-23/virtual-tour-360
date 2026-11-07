'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  CheckCircle2,
  FileEdit,
  Eye,
  ImageIcon,
  Plus,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Layers,
  Building2,
  Share2,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import { StatsCard } from '@/components/admin/StatsCard';
import { EmptyState } from '@/components/admin/EmptyState';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
  const [demoFeedback, setDemoFeedback] = useState<string | null>(null);

  const fetchStats = () => {
    setLoading(true);
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCreateDemoTour = async () => {
    setIsCreatingDemo(true);
    setDemoFeedback(null);
    try {
      const res = await fetch('/api/admin/demo-tour', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setDemoFeedback('Proyek tur demo berhasil dibuat dan dipublikasikan!');
        fetchStats();
      } else {
        setDemoFeedback(json.error || 'Gagal membuat proyek demo');
      }
    } catch {
      setDemoFeedback('Terjadi kesalahan saat membuat demo');
    } finally {
      setIsCreatingDemo(false);
    }
  };

  const stats = data?.stats || {
    totalTours: 0,
    publishedTours: 0,
    draftTours: 0,
    totalScenes: 0,
    totalPanoramas: 0,
    totalViews: 0,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto select-none">
      {/* Hero Welcome Studio Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-indigo-900/90 via-slate-900 to-slate-950 text-white p-6 sm:p-8 lg:p-10 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 dark:bg-white/5 border border-white/15 text-indigo-200 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>360° Immersive Studio Command Center</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Dashboard Ikhtisar Virtual Tour
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Platform terpadu untuk merancang, menghubungkan panorama indoor & outdoor dengan hotspot interaktif, dan mempublikasikan pengalaman tur 360° berstandar Google Street View.
            </p>

            {demoFeedback && (
              <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-medium">
                {demoFeedback}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              onClick={handleCreateDemoTour}
              isLoading={isCreatingDemo}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isCreatingDemo ? 'Memproses Demo...' : 'Generate Demo Tour'}</span>
            </Button>

            <Link href="/admin/media">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Unggah Panorama</span>
              </Button>
            </Link>

            <Link href="/admin/tours">
              <Button variant="gradient" size="sm">
                <Plus className="w-4 h-4" />
                <span>Buat Proyek Tur</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Badges at Bottom of Banner */}
        <div className="mt-8 pt-5 border-t border-white/10 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-300 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>WebGL Marzipano Engine Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span>Sharp 2:1 Equirectangular Validator</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>BFS Graph Reachability Validator</span>
          </div>
        </div>
      </div>

      {/* Real Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          title="Total Proyek"
          value={stats.totalTours}
          icon={Compass}
          accent="indigo"
          trend="Semua Tur"
          description="Seluruh proyek terdaftar"
        />
        <StatsCard
          title="Tur Publikasi"
          value={stats.publishedTours}
          icon={CheckCircle2}
          accent="emerald"
          trend="Aktif"
          description="Dapat diakses publik"
        />
        <StatsCard
          title="Draft / Pengerjaan"
          value={stats.draftTours}
          icon={FileEdit}
          accent="amber"
          trend="Work in Progress"
          description="Sedang disunting"
        />
        <StatsCard
          title="Titik Scene 360°"
          value={stats.totalScenes}
          icon={Eye}
          accent="violet"
          trend="Indoor & Outdoor"
          description="Node lokasi interaktif"
        />
        <StatsCard
          title="Aset Panorama"
          value={stats.totalPanoramas}
          icon={ImageIcon}
          accent="sky"
          trend="2:1 WebP"
          description="Foto panorama tersimpan"
        />
        <StatsCard
          title="Total Kunjungan"
          value={stats.totalViews}
          icon={TrendingUp}
          accent="rose"
          trend="Real-time"
          description="Tayangan pengunjung tur"
        />
      </div>

      {/* 4-Step Interactive Pipeline Guide */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Alur Kerja Virtual Tour 360°
          </h2>
          <span className="text-xs text-slate-400">Standar Google Street View</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs mb-3">
              1
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Unggah Foto 360°</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Upload foto panorama equirectangular 2:1. Sharp otomatis men-generate thumbnail WebP optimal.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-violet-500/40 transition">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-xs mb-3">
              2
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Kelola Ruang & Scene</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Klasifikasikan scene ke OUTDOOR, INDOOR, atau TRANSITION serta hubungkan ke gedung & lantai.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-sky-500/40 transition">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xs mb-3">
              3
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Visual Hotspot Studio</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Gunakan raycasting klik-di-panorama untuk meletakkan hotspot navigasi dan return link otomatis.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-500/40 transition">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs mb-3">
              4
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Validasi & Publikasi</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Engine BFS memeriksa broken link, lalu men-generate snapshot JSON immutable dan QR code publik.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Virtual Tours Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Virtual Tour Terbaru</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Proyek tur aktif dan status rilis publikasi
            </p>
          </div>
          <Link href="/admin/tours">
            <Button variant="ghost" size="sm" className="text-xs">
              <span>Kelola Semua Tur</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
          {data?.recentTours?.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {data.recentTours.map((tour: any) => (
                <div
                  key={tour.id}
                  className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 bg-white/50 dark:bg-slate-900/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500/10 to-violet-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <Compass className="w-6 h-6" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/admin/tours/${tour.id}`}
                          className="font-bold text-sm text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition truncate block"
                        >
                          {tour.title}
                        </Link>
                        <Badge
                          hasDot
                          variant={
                            tour.status === 'PUBLISHED'
                              ? 'success'
                              : tour.status === 'READY'
                              ? 'info'
                              : 'default'
                          }
                        >
                          {tour.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="font-mono text-[11px] text-slate-400">/{tour.slug}</span>
                        <span>•</span>
                        <span>{tour._count?.scenes || 0} Titik Scene 360°</span>
                        <span>•</span>
                        <span>{tour._count?.views || 0} Pengunjung</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    {tour.status === 'PUBLISHED' && (
                      <Link href={`/tour/${tour.slug}`} target="_blank">
                        <Button size="sm" variant="outline" className="text-xs">
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />
                          <span>Lihat Publik</span>
                        </Button>
                      </Link>
                    )}

                    <Link href={`/admin/tours/${tour.id}`}>
                      <Button size="sm" variant="secondary" className="text-xs">
                        Pengaturan
                      </Button>
                    </Link>

                    <Link href={`/admin/tours/${tour.id}/editor`}>
                      <Button size="sm" variant="gradient" className="text-xs">
                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                        <span>Buka Studio 360°</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Compass}
              title="Belum Ada Proyek Virtual Tour"
              description="Rancang pengalaman virtual tour 360° pertama Anda atau buat contoh proyek demo interaktif secara instan."
              actionLabel="Buat Proyek Tur Manual"
              onAction={() => (window.location.href = '/admin/tours')}
              secondaryActionLabel={
                isCreatingDemo ? 'Sedang Membuat Tur Demo...' : 'Buat Contoh Proyek Demo (1-Klik)'
              }
              onSecondaryAction={handleCreateDemoTour}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}