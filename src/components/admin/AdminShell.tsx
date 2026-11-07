'use client';
import React, { createContext, useContext, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AdminNavContextType {
  isMobileSidebarOpen: boolean;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleMobileSidebar: () => void;
}

const AdminNavContext = createContext<AdminNavContextType>({
  isMobileSidebarOpen: false,
  openMobileSidebar: () => {},
  closeMobileSidebar: () => {},
  toggleMobileSidebar: () => {},
});

export function useAdminNav() {
  return useContext(AdminNavContext);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const openMobileSidebar = () => setIsMobileSidebarOpen(true);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);
  const toggleMobileSidebar = () => setIsMobileSidebarOpen((prev) => !prev);

  return (
    <AdminNavContext.Provider
      value={{
        isMobileSidebarOpen,
        openMobileSidebar,
        closeMobileSidebar,
        toggleMobileSidebar,
      }}
    >
      <div className="relative flex min-h-screen bg-slate-50/70 dark:bg-[#070b14] font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors">
        {/* Background Ambient Glows */}
        <div className="fixed top-0 right-0 w-[500px] h-[400px] bg-indigo-500/5 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="fixed bottom-0 left-64 w-[400px] h-[350px] bg-violet-500/5 dark:bg-violet-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Mobile Backdrop Overlay */}
        {isMobileSidebarOpen && (
          <div
            onClick={closeMobileSidebar}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-200"
            aria-label="Close navigation sidebar"
          />
        )}

        {/* Sidebar Component */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
          <Topbar />
          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto w-full">{children}</main>
        </div>
      </div>
    </AdminNavContext.Provider>
  );
}

