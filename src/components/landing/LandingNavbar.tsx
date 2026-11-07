'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Menu,
  X,
  Compass,
  Sparkles,
  Layers,
  ArrowRight,
  LogIn,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle, useTheme } from '@/components/theme/ThemeProvider';

interface LandingNavbarProps {
  siteName: string;
}

export function LandingNavbar({ siteName }: LandingNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { label: 'Tur Unggulan', href: '#featured-tours', icon: Compass },
    { label: 'Fitur Utama', href: '#features', icon: Sparkles },
    { label: 'Alur Sistem', href: '#workflow', icon: Layers },
  ];

  return (
    <header className="h-20 border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-50 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md px-4 sm:px-6 md:px-12 flex items-center justify-between transition-colors">
      {/* Brand Identity */}
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-md shadow-indigo-600/25 group-hover:scale-105 transition-transform">
          360°
        </div>
        <div>
          <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white leading-tight">
            {siteName}
          </span>
          <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase">
            STUDIO & BUILDER
          </span>
        </div>
      </Link>

      {/* Desktop Navigation Links */}
      <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600 dark:text-slate-400">
        {navLinks.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="hover:text-indigo-600 dark:hover:text-white transition-colors"
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* Desktop Actions */}
      <div className="hidden md:flex items-center gap-3">
        <ThemeToggle />

        <Link href="/login">
          <Button size="sm" variant="outline">
            Masuk Studio
          </Button>
        </Link>
        <a href="#featured-tours">
          <Button size="sm" variant="gradient">
            Mulai Jelajah
          </Button>
        </a>
      </div>

      {/* Mobile Controls: ThemeToggle + Hamburger Toggle Button */}
      <div className="flex md:hidden items-center gap-2">
        <ThemeToggle />

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Tutup navigasi' : 'Buka menu navigasi'}
          className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 text-indigo-500" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 top-20 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="bg-white/95 dark:bg-slate-950/95 border-b border-slate-200/80 dark:border-slate-800 p-6 shadow-2xl space-y-6 animate-in slide-in-from-top-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Nav Links */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
                Navigasi Halaman
              </p>
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  >
                    <Icon className="w-4 h-4 text-indigo-500" />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>

            {/* Dark Mode Quick Switcher Row */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between px-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                {isDark ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <span>Mode Tampilan {isDark ? 'Gelap' : 'Terang'}</span>
              </span>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 transition"
              >
                Ganti Mode
              </button>
            </div>

            {/* Mobile CTA Buttons */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2.5">
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                <Button size="md" variant="outline" className="w-full justify-center">
                  <LogIn className="w-4 h-4 mr-2" />
                  <span>Masuk Studio Editor</span>
                </Button>
              </Link>
              <a
                href="#featured-tours"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full"
              >
                <Button size="md" variant="gradient" className="w-full justify-center shadow-lg shadow-indigo-600/20">
                  <span>Mulai Jelajahi Tur</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

