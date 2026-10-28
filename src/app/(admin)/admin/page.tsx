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
} from 'lucide-react';
import { StatsCard } from '@/components/admin/StatsCard';
import { EmptyState } from '@/components/admin/EmptyState';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

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
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Dashboard Ikhtisar
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manajemen virtual tour 360°, panorama aset, dan analitik pengunjung
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/media">
            <Button variant="outline" size="sm">
              <ImageIcon className="w-4 h-4 mr-1" />
              <span>Unggah Panorama</span>
            </Button>
          </Link>
          <Link href="/admin/tours">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              <span>Buat Proyek Tur</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Real Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          title="Total Proyek"
          value={stats.totalTours}
          icon={Compass}
          description="Seluruh proyek tur"
        />
        <StatsCard
          title="Tur Publikasi"
          value={stats.publishedTours}
          icon={CheckCircle2}
          description="Dapat diakses publik"
        />
        <StatsCard
          title="Draft / Edit"
          value={stats.draftTours}
          icon={FileEdit}
          description="Sedang dikerjakan"
        />
        <StatsCard
          title="Total Scene"
          value={stats.totalScenes}
          icon={Eye}
          description="Titik lokasi 360°"
        />
        <StatsCard
          title="Aset Panorama"
          value={stats.totalPanoramas}
          icon={ImageIcon}
          description="Foto panorama tersimpan"
        />
        <StatsCard
          title="Total Kunjungan"
          value={stats.totalViews}
          icon={TrendingUp}
          description="Tampilan pengunjung"
        />
      </div>

      {/* Recent Tours Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Virtual Tour Terbaru</CardTitle>
            <p className="text-xs text-zinc-500">Proyek tur aktif yang baru diperbarui</p>
          </div>
          <Link href="/admin/tours">
            <Button variant="ghost" size="sm" className="text-xs">
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {data?.recentTours?.length > 0 ? (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.recentTours.map((tour: any) => (
                <div
                  key={tour.id}
                  className="py-3.5 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/admin/tours/${tour.id}`}
                      className="font-semibold text-zinc-900 dark:text-white hover:underline truncate block"
                    >
                      {tour.title}
                    </Link>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Slug: /{tour.slug} • {tour._count?.scenes || 0} Scene •{' '}
                      {tour._count?.views || 0} Pengunjung
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Badge
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
                    <Link href={`/admin/tours/${tour.id}/editor`}>
                      <Button size="sm" variant="outline" className="text-xs">
                        Buka Studio
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
              description="Mulai dengan mengunggah foto panorama 360° dan membuat proyek virtual tour pertama Anda."
              actionLabel="Buat Proyek Tur Sekarang"
              onAction={() => (window.location.href = '/admin/tours')}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}