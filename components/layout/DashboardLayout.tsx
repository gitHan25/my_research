'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { User } from '@/types';

interface DashboardLayoutProps {
  children: ReactNode;
  user: User | null;
  onLogout: () => void;
}

export function DashboardLayout({
  children,
  user,
  onLogout,
}: DashboardLayoutProps) {
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Sidebar */}
      <Sidebar isAdmin={isAdmin} />

      {/* Main Content */}
      <div className="ml-64 flex min-h-screen flex-col">
        {/* Header */}
        <Header user={user} onLogout={onLogout} />

        {/* Page Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
