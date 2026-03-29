"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LogOut, LayoutDashboard, BrainCog, FileText, Lightbulb, BarChart3, ListChecks
} from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/intelligence', label: 'Product Intelligence', icon: BarChart3 },
    { href: '/dashboard/raise-ticket', label: 'Raise Ticket', icon: Lightbulb },
    { href: '/dashboard/ticket-analysis', label: 'Ticket Analysis', icon: ListChecks },
    { href: '/dashboard/documents', label: 'Documents', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 flex-col hidden md:flex h-screen sticky top-0 shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-neutral-100">
        <span className="text-xl font-bold tracking-tight flex items-center gap-2">
          <BrainCog className="w-5 h-5 text-indigo-600" /> Castly
        </span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <a 
              key={item.href}
              href={item.href} 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-neutral-50 text-neutral-900 shadow-sm border border-neutral-100' 
                  : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : ''}`} /> {item.label}
            </a>
          );
        })}
      </nav>
      <div className="p-4 border-t border-neutral-100">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold text-sm">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="text-sm truncate">
            <p className="font-medium truncate">{user?.name || 'Loading...'}</p>
            <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-50 rounded-lg border border-transparent hover:border-neutral-200 transition-all">
          <LogOut className="w-4 h-4" /> Log out
        </button>
      </div>
    </aside>
  );
}
