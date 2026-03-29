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
    <div>
      <h3 className="text-xl font-semibold text-neutral-900 mb-6 text-center">Create your Castly account</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-neutral-700">Full Name</label>
          <div className="mt-1">
            <input
              name="name"
              type="text"
              required
              className="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-neutral-900 focus:border-neutral-900 sm:text-sm"
              placeholder="Jane Doe"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">Email address</label>
          <div className="mt-1">
            <input
              name="email"
              type="email"
              required
              className="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-neutral-900 focus:border-neutral-900 sm:text-sm"
              placeholder="jane@startup.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">Password</label>
          <div className="mt-1">
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-neutral-900 focus:border-neutral-900 sm:text-sm"
              placeholder="••••••••"
            />
          </div>
          <p className="mt-1 text-xs text-neutral-500">Must be at least 8 characters.</p>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create Account'}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-neutral-500">Already have an account? </span>
        <Link href="/login" className="font-medium text-neutral-900 hover:text-neutral-700 transition-colors">
          Log in
        </Link>
      </div>
    </div>
  );
}
