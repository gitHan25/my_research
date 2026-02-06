'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  PenLine,
  BarChart3,
  Upload,
  Users,
  Download,
  Tag,
  CheckCircle,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'Labeling',
    href: '/label',
    icon: <PenLine className="h-5 w-5" />,
  },
  {
    label: 'Validate',
    href: '/validate',
    icon: <CheckCircle className="h-5 w-5" />,
  },
  {
    label: 'Progress',
    href: '/progress',
    icon: <BarChart3 className="h-5 w-5" />,
  },
];

const adminItems: NavItem[] = [
  {
    label: 'Upload CSV',
    href: '/admin/upload',
    icon: <Upload className="h-5 w-5" />,
    adminOnly: true,
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: <Users className="h-5 w-5" />,
    adminOnly: true,
  },
  {
    label: 'Export',
    href: '/admin/export',
    icon: <Download className="h-5 w-5" />,
    adminOnly: true,
  },
];

interface SidebarProps {
  isAdmin?: boolean;
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-800 bg-zinc-950">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Tag className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-zinc-100">CDSA</span>
          <span className="text-xs text-zinc-500">Labeling Platform</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
        {/* Main Navigation */}
        <div className="mb-2">
          <span className="px-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Menu
          </span>
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname === item.href}
          />
        ))}

        {/* Admin Navigation */}
        {isAdmin && (
          <>
            <div className="mb-2 mt-6">
              <span className="px-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Admin
              </span>
            </div>
            {adminItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={pathname === item.href}
              />
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-800 p-4">
        <div className="rounded-lg bg-zinc-900 p-3">
          <p className="text-xs text-zinc-500">
            Cross-Domain Sentiment Analysis
          </p>
          <p className="mt-1 text-xs text-zinc-600">Research Project</p>
        </div>
      </div>
    </aside>
  );
}

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function NavLink({ href, icon, label, isActive }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-zinc-800 text-zinc-100'
          : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
      )}
    >
      <span className={cn(isActive ? 'text-blue-500' : 'text-zinc-500')}>
        {icon}
      </span>
      {label}
    </Link>
  );
}

export default Sidebar;
