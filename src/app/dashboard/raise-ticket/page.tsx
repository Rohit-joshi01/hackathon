"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, AlertTriangle } from 'lucide-react';

type FeatureDecisionJson = {
  decision: string;
  priority: string;
  impact?: { revenue_impact?: string; user_impact?: string };
  risks?: string[];
  reason?: string;
};

export default function RaiseTicketPage() {
  const router = useRouter();
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState('');
  const [lastTicketDecision, setLastTicketDecision] = useState<FeatureDecisionJson | null>(null);

  const handleSubmitTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setTicketLoading(true);
    setTicketError('');
    setLastTicketDecision(null);

    try {
      const formData = new FormData(form);
      const payload = {
        title: String(formData.get('title') || ''),
        description: String(formData.get('description') || ''),
        requested_by: String(formData.get('requested_by') || ''),
        department: String(formData.get('department') || ''),
        status: 'Submitted',
      };

      const res = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTicketError(data.error || 'Failed to raise ticket');
        return;
      }

      setLastTicketDecision(data.featureDecision?.decision_json || null);
      form.reset();
    } catch (err) {
      console.error('Ticket submit error:', err);
      setTicketError('An unexpected error occurred. Please try again.');
    } finally {
      setTicketLoading(false);
    }
  };

  const decisionBadgeClasses = (decision?: string) => {
    if (!decision) return 'bg-neutral-50 text-neutral-700 border-neutral-100';
    if (decision === 'Accept') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (decision === 'Decline') return 'bg-rose-50 text-rose-700 border-rose-100';
    if (decision === 'Delay') return 'bg-amber-50 text-amber-800 border-amber-100';
    if (decision === 'Validate') return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    return 'bg-neutral-50 text-neutral-700 border-neutral-100';
  };

  return (
    <main className="flex-1 p-8 lg:p-12 overflow-y-auto w-full">
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Raise Feature Ticket</h1>
          <p className="text-base text-neutral-500 mt-1">Submit a request and get an AI decision aligned to your latest product intelligence.</p>
        </div>

        {ticketError && (
          <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 text-sm flex gap-2 items-start">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>{ticketError}</p>
          </div>
        )}

        <div className="p-6 md:p-8 bg-white border border-neutral-200 rounded-2xl shadow-sm">
          <form onSubmit={handleSubmitTicket} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Title</label>
                <input
                  name="title"
                  required
                  placeholder="Short feature title"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Requested By</label>
                <input
                  name="requested_by"
                  placeholder="Name or role"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Department</label>
                <select
                  name="department"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all"
                  defaultValue=""
                >
                  <option value="">General</option>
                  <option value="Product">Product</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Support">Support</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Description</label>
                <textarea
                  name="description"
                  required
                  rows={5}
                  placeholder="Describe the feature, who it helps, and what success looks like"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 flex justify-end">
              <button
                type="submit"
                disabled={ticketLoading}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white text-sm font-medium rounded-xl hover:bg-neutral-800 disabled:opacity-70 transition-all shadow-md"
              >
                {ticketLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Analyze & Submit Ticket
              </button>
            </div>
          </form>
        </div>

        {lastTicketDecision && (
          <div className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">AI Decision Engine Result</h3>
                <p className="text-sm text-neutral-500 mt-1">Based on alignment with your product intelligence report.</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-bold border ${decisionBadgeClasses(lastTicketDecision.decision)}`}>
                {lastTicketDecision.decision}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="p-5 rounded-xl border border-neutral-200 bg-neutral-50">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Priority Score</p>
                <p className="text-3xl font-extrabold text-neutral-900 mt-2">{lastTicketDecision.priority}</p>
              </div>
              <div className="p-5 rounded-xl border border-neutral-200 bg-neutral-50">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Revenue Impact</p>
                <p className="text-sm font-medium text-neutral-800 mt-3">{lastTicketDecision.impact?.revenue_impact}</p>
              </div>
              <div className="p-5 rounded-xl border border-neutral-200 bg-neutral-50">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">User Impact</p>
                <p className="text-sm font-medium text-neutral-800 mt-3">{lastTicketDecision.impact?.user_impact}</p>
              </div>
            </div>
            <div className="mt-6 p-5 rounded-xl border border-neutral-200 bg-white">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Reasoning</p>
              <p className="text-base text-neutral-700 leading-relaxed">{lastTicketDecision.reason}</p>
            </div>
            {Array.isArray(lastTicketDecision.risks) && lastTicketDecision.risks.length > 0 && (
              <div className="mt-6 p-5 rounded-xl border border-rose-100 bg-rose-50/50">
                <p className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Identified Risks
                </p>
                <ul className="space-y-3">
                  {lastTicketDecision.risks.map((r: string, i: number) => (
                    <li key={i} className="text-sm text-neutral-700 flex gap-3 items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0"></span>
                      <span className="leading-snug">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
