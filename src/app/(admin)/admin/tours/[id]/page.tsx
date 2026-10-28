'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Compass,
  ArrowLeft,
  Save,
  Layers,
  Sparkles,
  Trash2,
  ExternalLink,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function TourDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [tour, setTour] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/tours/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const t = json.data;
          setTour(t);
          setTitle(t.title);
          setDescription(t.description || '');
          setStatus(t.status);
          setVisibility(t.visibility);
        }
      });
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(false);
    try {
      const res = await fetch(`/api/tours/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, status, visibility }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {}
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus tur ini secara permanen?')) return;
    try {
      await fetch(`/api/tours/${id}`, { method: 'DELETE' });
      router.push('/admin/tours');
    } catch {}
  };

  if (!tour) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto select-none">
      <div className="flex items-center gap-3">
        <Link href="/admin/tours">
          <Button variant="ghost" size="sm" className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white truncate">
            {tour.title}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">Slug: /{tour.slug} • ID: {tour.id}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link href={`/admin/tours/${id}/scenes`}>
            <Button size="sm" variant="outline">
              <Layers className="w-3.5 h-3.5 mr-1" />
              <span>Kelola Scene ({tour.scenes?.length || 0})</span>
            </Button>
          </Link>
          <Link href={`/admin/tours/${id}/editor`}>
            <Button size="sm">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              <span>Buka Studio 360°</span>
            </Button>
          </Link>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Proyek Tur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Judul Proyek"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Deskripsi
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Status Tur
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-xs"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="READY">READY</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Visibilitas
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-xs"
                >
                  <option value="PUBLIC">PUBLIC</option>
                  <option value="UNLISTED">UNLISTED</option>
                  <option value="PRIVATE">PRIVATE</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          {success && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Perubahan berhasil disimpan!
            </span>
          )}
          <div className="ml-auto">
            <Button type="submit" isLoading={isSaving} size="md">
              <Save className="w-4 h-4 mr-1.5" />
              <span>Simpan Perubahan</span>
            </Button>
          </div>
        </div>
      </form>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-950/60 bg-red-50/20">
        <CardHeader>
          <CardTitle className="text-base text-red-600">Zona Berbahaya</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            Menghapus proyek tur akan menghapus seluruh scene, relasi hotspot, dan denah terkait.
          </p>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            <span>Hapus Proyek Tur</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}