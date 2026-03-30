"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to sign up');
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
        <h3 className="text-2xl font-bold text-headline tracking-tight">Create Account</h3>
        <p className="text-body-text mt-2 text-sm font-medium">Join Castly to unlock product intelligence</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-rose-500/10 text-rose-500 p-4 rounded-2xl text-sm border border-rose-500/20 animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-widest text-muted ml-1">Full Name</label>
          <input
            name="name"
            type="text"
            required
            className="block w-full px-4 py-3.5 bg-input-bg border border-border-subtle rounded-2xl text-headline placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
            placeholder="Jane Doe"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-widest text-muted ml-1">Email address</label>
          <input
            name="email"
            type="email"
            required
            className="block w-full px-4 py-3.5 bg-input-bg border border-border-subtle rounded-2xl text-headline placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
            placeholder="jane@startup.com"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-widest text-muted ml-1">Password</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="block w-full px-4 py-3.5 bg-input-bg border border-border-subtle rounded-2xl text-headline placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
            placeholder="••••••••"
          />
          <p className="mt-1 text-[10px] font-bold text-muted uppercase tracking-widest ml-1">At least 8 characters</p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-4 px-4 bg-primary hover:bg-primary/90 text-white rounded-2xl text-sm font-bold tracking-wide shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Start Building'}
          </button>
        </div>
      </form>

      <div className="text-center">
        <p className="text-sm text-muted font-medium">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:text-primary/80 transition-colors font-bold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
