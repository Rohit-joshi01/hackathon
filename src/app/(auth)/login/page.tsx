"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to login');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-headline tracking-tight">Welcome Back</h3>
        <p className="text-body-text mt-2 text-sm font-medium">Enter your credentials to access your dashboard</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-rose-500/10 text-rose-500 p-4 rounded-2xl text-sm border border-rose-500/20 animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-widest text-muted ml-1">Email address</label>
          <input
            name="email"
            type="email"
            required
            className="block w-full px-4 py-3.5 bg-input-bg border border-border-subtle rounded-2xl text-headline placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
            placeholder="name@startup.com"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-widest text-muted ml-1">Password</label>
          <input
            name="password"
            type="password"
            required
            className="block w-full px-4 py-3.5 bg-input-bg border border-border-subtle rounded-2xl text-headline placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
            placeholder="••••••••"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-4 px-4 bg-primary hover:bg-primary/90 text-white rounded-2xl text-sm font-bold tracking-wide shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign in to Dashboard'}
          </button>
        </div>
      </form>

      <div className="text-center">
        <p className="text-sm text-muted font-medium">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary hover:text-primary/80 transition-colors font-bold">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
