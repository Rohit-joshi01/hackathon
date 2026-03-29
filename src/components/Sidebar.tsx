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
    <aside className="w-64 bg-surface border-r border-border-subtle flex-col hidden md:flex h-screen sticky top-0 shrink-0 z-20">
      <div className="h-16 flex items-center px-6 border-b border-border-subtle">
        <span className="text-xl font-bold tracking-tight flex items-center gap-2 text-headline">
          <BrainCog className="w-6 h-6 text-primary" /> Castly
        </span>
      </div>
      <nav className="flex-1 px-4 py-8 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <a 
              key={item.href}
              href={item.href} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                isActive 
                  ? 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(255,59,0,0.1)]' 
                  : 'text-muted border-transparent hover:bg-white/5 hover:text-headline'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-primary' : ''}`} /> {item.label}
            </a>
          );
        })}
      </nav>
      <div className="p-6 border-t border-border-subtle bg-surface/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6 px-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="text-sm truncate">
            <p className="font-semibold text-headline truncate leading-none mb-1">{user?.name || 'Loading...'}</p>
            <p className="text-xs text-muted truncate">{user?.email}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-muted hover:bg-rose-500/10 hover:text-rose-400 rounded-xl border border-transparent hover:border-rose-500/20 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" /> Log out
        </button>
      </div>
    </aside>
  );
}
