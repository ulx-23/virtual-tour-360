'use client';
import React, { useEffect, useState } from 'react';
import { Globe, Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function CMSPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    site_name: '',
    site_tagline: '',
    hero_title: '',
    hero_subtitle: '',
    hero_cta_label: '',
    hero_cta_url: '',
    footer_text: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setSettings(json.data);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {}
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto select-none">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Website CMS & Pengaturan Konten
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Sesuaikan teks landing page, branding, judul hero, dan informasi footer secara dinamis
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branding & Identitas Situs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Nama Platform"
              value={settings.site_name || ''}
              onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
            />
            <Input
              label="Tagline Platform"
              value={settings.site_tagline || ''}
              onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hero Section Landing Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Judul Utama (Hero Title)"
              value={settings.hero_title || ''}
              onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Deskripsi Subtitle Hero
              </label>
              <textarea
                rows={3}
                value={settings.hero_subtitle || ''}
                onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Label Tombol CTA"
                value={settings.hero_cta_label || ''}
                onChange={(e) => setSettings({ ...settings, hero_cta_label: e.target.value })}
              />
              <Input
                label="Tujuan Tombol CTA (URL)"
                value={settings.hero_cta_url || ''}
                onChange={(e) => setSettings({ ...settings, hero_cta_url: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Footer & Hak Cipta</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              label="Teks Footer"
              value={settings.footer_text || ''}
              onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-between pt-2">
          {success && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Pengaturan CMS berhasil disimpan ke database!
            </span>
          )}
          <div className="ml-auto">
            <Button type="submit" isLoading={isSaving} size="md">
              <Save className="w-4 h-4 mr-1.5" />
              <span>Simpan Perubahan CMS</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}