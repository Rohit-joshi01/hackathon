"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, AlertTriangle } from 'lucide-react';

type FeatureDecisionJson = {
  decision: string;
  priority: string;
  impact?: { revenue_impact?: string; user_impact?: string };
  alignment_metrics?: Array<{ metric: string; score: string; insight: string }>;
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
    const d = decision.toLowerCase();
    if (d === 'accept') return 'bg-emerald-500 text-white border-emerald-600';
    if (d === 'decline') return 'bg-rose-500 text-white border-rose-600';
    if (d === 'delay') return 'bg-amber-500 text-white border-amber-600';
    if (d === 'validate') return 'bg-indigo-500 text-white border-indigo-600';
    return 'bg-neutral-500 text-white border-neutral-600';
  };

  return (
    <main className="flex-1 p-8 lg:p-12 overflow-y-auto w-full bg-background relative z-10">
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Raise Feature Ticket</h1>
          <p className="text-lg text-muted font-medium">Get a strategic AI decision aligned to your product intelligence.</p>
        </div>

        {ticketError && (
          <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 text-sm flex gap-2 items-start animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="font-semibold">{ticketError}</p>
          </div>
        )}

        <div className="p-10 glass-card-strong rounded-[40px] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-[0.02] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <form onSubmit={handleSubmitTicket} className="space-y-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-black text-muted uppercase tracking-[0.2em] mb-3 px-1">Feature Title</label>
                <input
                  name="title"
                  required
                  placeholder="e.g., Enterprise SSO Integration"
                  className="w-full px-6 py-4.5 border border-border-subtle rounded-2xl text-sm bg-black/40 text-white placeholder:text-muted/30 focus:bg-black/60 focus:ring-2 focus:ring-primary/50 outline-none transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-muted uppercase tracking-[0.2em] mb-3 px-1">Requested By</label>
                <input
                  name="requested_by"
                  placeholder="The person or role"
                  className="w-full px-6 py-4.5 border border-border-subtle rounded-2xl text-sm bg-black/40 text-white placeholder:text-muted/30 focus:bg-black/60 focus:ring-2 focus:ring-primary/50 outline-none transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-muted uppercase tracking-[0.2em] mb-3 px-1">Department</label>
                <select
                  name="department"
                  className="w-full px-6 py-4.5 border border-border-subtle rounded-2xl text-sm bg-black/40 text-white focus:bg-black/60 focus:ring-2 focus:ring-primary/50 outline-none transition-all font-bold appearance-none cursor-pointer"
                  defaultValue=""
                >
                  <option value="" className="bg-surface text-white">General</option>
                  <option value="Product" className="bg-surface text-white">Product</option>
                  <option value="Engineering" className="bg-surface text-white">Engineering</option>
                  <option value="Sales" className="bg-surface text-white">Sales</option>
                  <option value="Marketing" className="bg-surface text-white">Marketing</option>
                  <option value="Support" className="bg-surface text-white">Support</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-black text-muted uppercase tracking-[0.2em] mb-3 px-1">Detailed Description</label>
                <textarea
                  name="description"
                  required
                  rows={5}
                  placeholder="Explain the 'Why' behind this feature and how it aligns with customer needs..."
                  className="w-full px-6 py-4.5 border border-border-subtle rounded-2xl text-sm bg-black/40 text-white placeholder:text-muted/30 focus:bg-black/60 focus:ring-2 focus:ring-primary/50 outline-none transition-all resize-none font-bold"
                />
              </div>
            </div>

            <div className="pt-8 border-t border-border-subtle flex justify-end">
              <button
                type="submit"
                disabled={ticketLoading}
                className="flex items-center gap-3 group px-10 py-4.5 bg-primary text-white text-sm font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary/90 disabled:opacity-70 transition-all shadow-[0_0_20px_rgba(255,59,0,0.3)]"
              >
                {ticketLoading ? (
                   <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                   <Sparkles className="w-6 h-6 group-hover:scale-125 transition-transform duration-300" />
                )}
                Analyze & Prioritize
              </button>
            </div>
          </form>
        </div>

        {lastTicketDecision && (
          <div className="glass-card-strong rounded-[48px] p-12 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-1000">
             <div className="absolute top-0 right-0 w-96 h-96 bg-primary opacity-[0.03] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-10 border-b border-border-subtle pb-12 relative z-10">
              <div className="text-center md:text-left">
                <h3 className="text-3xl font-black text-white tracking-tight">AI Strategy Decision</h3>
                <p className="text-sm font-bold text-muted mt-3">Alignment result based on your active product intelligence.</p>
              </div>
              <div className="flex flex-col items-center gap-4">
                 <span className={`px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] border-2 shadow-[0_0_30px_rgba(255,59,0,0.2)] brightness-110 ${decisionBadgeClasses(lastTicketDecision.decision)} animate-pulse`}>
                    {lastTicketDecision.decision}
                 </span>
                 <p className="text-[10px] font-bold text-muted/30 uppercase tracking-[0.3em]">Final Strategic Verdict</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-12 relative z-10">
              <div className="flex flex-col items-center justify-center p-10 glass-card rounded-[40px] relative overflow-hidden group shadow-inner">
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity duration-500">
                  <Sparkles className="w-24 h-24 text-primary" />
                </div>
                <p className="text-[11px] font-black text-muted uppercase tracking-[0.3em] mb-6">Priority Score</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-8xl font-black text-primary tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,59,0,0.3)]">{lastTicketDecision.priority}</span>
                  <span className="text-sm font-bold text-muted/30">/100</span>
                </div>
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {lastTicketDecision.alignment_metrics?.map((m, idx) => (
                  <div key={idx} className="p-8 glass-card rounded-[32px] hover:border-primary/20 transition-all duration-300 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">{m.metric}</p>
                      <span className="text-lg font-black text-primary">{m.score}</span>
                    </div>
                    <p className="text-sm font-bold text-accent italic leading-relaxed">"{m.insight}"</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 p-10 glass-card rounded-[40px] text-white relative overflow-hidden group shadow-2xl">
               <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-[0.05] transition-opacity duration-700 pointer-events-none">
                 <Sparkles className="w-32 h-32 text-primary" />
               </div>
               <h4 className="text-[11px] font-black text-muted uppercase tracking-[0.3em] mb-8 border-l-2 border-primary/40 pl-6">Founder's Strategic Alignment</h4>
               <p className="text-xl font-bold text-headline leading-relaxed italic pr-12 relative z-10">
                 "{lastTicketDecision.reason}"
               </p>
               
               <div className="mt-10 flex flex-wrap gap-4 relative z-10">
                 {lastTicketDecision.risks?.map((risk, idx) => (
                   <span key={idx} className="bg-primary/10 text-primary text-[10px] font-black px-5 py-2.5 rounded-xl border border-primary/20 uppercase tracking-[0.2em] flex items-center gap-3">
                     <AlertTriangle className="w-3.5 h-3.5" /> {risk}
                   </span>
                 ))}
               </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

