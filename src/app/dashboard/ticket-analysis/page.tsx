"use client";

import { useEffect, useState } from 'react';
import { Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

type FeatureDecisionJson = {
  decision: string;
  priority: string;
  impact?: { revenue_impact?: string; user_impact?: string };
  alignment_metrics?: Array<{ metric: string; score: string; insight: string }>;
  risks?: string[];
  reason?: string;
};

type FeatureRequestRow = {
  id: string;
  startup_id: string;
  title: string;
  description?: string | null;
  requested_by?: string | null;
  department?: string | null;
  status?: string;
  decision_json?: FeatureDecisionJson | null;
};

export default function TicketAnalysisPage() {
  const [featureRequests, setFeatureRequests] = useState<FeatureRequestRow[]>([]);
  const [isReanalyzing, setIsReanalyzing] = useState<string | null>(null);

  const fetchTickets = () => {
    fetch('/api/feature-requests')
      .then(res => res.json())
      .then(data => {
        if (data.featureRequests) setFeatureRequests(data.featureRequests);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleReanalyze = async (id: string) => {
    setIsReanalyzing(id);
    try {
      const res = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reanalyzeId: id }),
      });
      if (res.ok) {
        fetchTickets();
      }
    } catch (err) {
      console.error('Re-analyze error:', err);
    } finally {
      setIsReanalyzing(null);
    }
  };

  const decisionBadgeClasses = (decision?: string) => {
    if (!decision) return 'bg-neutral-50 text-neutral-700 border-neutral-100';
    const d = decision.toLowerCase();
    if (d === 'accept') return 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-200';
    if (d === 'decline') return 'bg-rose-500 text-white border-rose-600 shadow-sm shadow-rose-200';
    if (d === 'delay') return 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-200';
    if (d === 'validate') return 'bg-indigo-500 text-white border-indigo-600 shadow-sm shadow-indigo-200';
    return 'bg-neutral-500 text-white border-neutral-600';
  };

  return (
    <main className="flex-1 p-8 lg:p-12 overflow-y-auto w-full bg-background relative z-10">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Ticket Analysis</h1>
            <p className="text-lg text-muted font-medium">AI-driven prioritization for your product roadmap.</p>
          </div>
          <div className="flex items-center gap-3 bg-surface px-5 py-3 rounded-2xl border border-border-subtle shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(255,59,0,0.5)]"></div>
            <span className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Active Intelligence</span>
          </div>
        </div>

        <div className="space-y-8">
          {featureRequests.length === 0 ? (
            <div className="p-32 text-sm text-center text-muted flex flex-col items-center glass-card-strong rounded-[40px] shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary opacity-[0.02] rounded-full blur-[100px] -translate-y-1/2"></div>
              <div className="w-24 h-24 bg-black/40 rounded-3xl flex items-center justify-center mb-10 border border-border-subtle relative z-10 transition-transform group-hover:scale-110 duration-500">
                <span className="text-4xl">ðŸ“</span>
              </div>
              <h3 className="text-3xl font-black text-white mb-4 relative z-10">Build your roadmap</h3>
              <p className="font-bold text-muted max-w-sm mx-auto relative z-10 leading-relaxed">Raise your first feature ticket to get AI-driven strategic insights and unlock your product potential.</p>
            </div>
          ) : (
            featureRequests.map((fr) => (
              <div key={fr.id} className="group glass-card-strong rounded-[40px] overflow-hidden shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-700 hover:border-primary/30">
                <div className="p-10 md:p-12 relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-[0.02] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-12 relative z-10">
                    <div className="min-w-0 flex-1 space-y-8">
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-4">
                           {fr.decision_json?.decision && (
                            <span className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] border-2 shadow-lg brightness-110 ${decisionBadgeClasses(fr.decision_json.decision)}`}>
                              {fr.decision_json.decision}
                            </span>
                          )}
                          <span className="text-[11px] font-black text-muted uppercase tracking-[0.2em] bg-black/40 px-4 py-2 rounded-xl border border-border-subtle">
                            {fr.department || 'General'}
                          </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight group-hover:text-primary transition-colors duration-500">{fr.title}</h2>
                      </div>
                      
                      {fr.description && (
                         <div className="relative">
                            <p className="text-lg text-muted/80 whitespace-pre-line leading-relaxed font-medium line-clamp-3 group-hover:line-clamp-none transition-all duration-700 bg-black/5 p-6 rounded-2xl border border-border-subtle/50">
                              {fr.description}
                            </p>
                         </div>
                      )}

                      <div className="flex items-center gap-10 pt-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-muted/40 uppercase tracking-widest mb-1.5">Lead Architect / Requested By</span>
                          <span className="text-sm font-black text-headline uppercase tracking-wide">{fr.requested_by || 'Dev Core'}</span>
                        </div>
                        <div className="w-px h-10 bg-border-subtle"></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-muted/40 uppercase tracking-widest mb-1.5">Operational ID</span>
                          <span className="text-sm font-mono font-bold text-primary">#{fr.id.slice(0, 6)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="shrink-0 flex flex-col items-center justify-center p-10 bg-black border border-border-subtle rounded-[32px] text-white min-w-[280px] shadow-2xl relative overflow-hidden group/score">
                      <div className="absolute inset-0 bg-primary opacity-[0.03] group-hover/score:opacity-[0.08] transition-opacity duration-700"></div>
                      <p className="text-[11px] font-black text-muted uppercase tracking-[0.3em] mb-6 relative z-10">Priority Index</p>
                      <div className="flex items-baseline gap-2 relative z-10">
                        <span className="text-8xl font-black tracking-tighter tabular-nums text-primary">{fr.decision_json?.priority || '00'}</span>
                        <span className="text-xl font-bold text-muted/30">/100</span>
                      </div>
                      <div className="w-full mt-8 h-2.5 bg-border-subtle rounded-full overflow-hidden relative z-10 border border-white/5">
                        <div className="bg-primary h-full transition-all duration-[1.5s] ease-out shadow-[0_0_20px_rgba(255,59,0,0.6)]" style={{ width: `${fr.decision_json?.priority || 0}%` }}></div>
                      </div>
                      <div className="mt-10 w-full relative z-10">
                        <button 
                          onClick={() => handleReanalyze(fr.id)}
                          disabled={isReanalyzing === fr.id}
                          className="w-full flex items-center justify-center gap-3 py-4 bg-primary/10 hover:bg-primary text-primary hover:text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all duration-300 border border-primary/20 disabled:opacity-50 shadow-[0_0_20px_rgba(255,59,0,0.1)]"
                        >
                          {isReanalyzing === fr.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                          {fr.decision_json?.alignment_metrics && fr.decision_json.alignment_metrics.length > 0 ? 'Recalibrate' : 'Initiate Analysis'}
                        </button>
                      </div>
                    </div>
                  </div>
                                  {fr.decision_json && (
                    <div className="mt-16 space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {fr.decision_json.alignment_metrics?.map((m, idx) => (
                          <div key={idx} className="bg-black/40 backdrop-blur-md p-8 rounded-[32px] border border-border-subtle hover:bg-white/[0.03] hover:border-primary/20 transition-all duration-500 group/metric shadow-sm">
                            <div className="flex justify-between items-start mb-6">
                              <h4 className="text-[11px] font-black text-muted uppercase tracking-[0.2em] leading-relaxed pr-6 group-hover/metric:text-primary transition-colors duration-300">{m.metric}</h4>
                              <span className="text-2xl font-black text-white tabular-nums tracking-tighter">{m.score}</span>
                            </div>
                            <p className="text-sm font-bold text-accent italic leading-relaxed">
                              "{m.insight}"
                            </p>
                          </div>
                        )) || (
                          <div className="col-span-3 p-12 text-center bg-primary/5 rounded-[32px] border border-primary/20 text-primary text-sm font-black uppercase tracking-widest flex items-center justify-center gap-4">
                             <AlertTriangle className="w-6 h-6 animate-pulse" />
                             Initiate analysis to reveal strategic alignment metrics
                          </div>
                        )}
                      </div>

                      <div className="relative group/reason">
                         <div className="absolute -inset-1.5 bg-primary rounded-[40px] blur-[30px] opacity-[0.03] group-hover/reason:opacity-[0.08] transition-opacity duration-700"></div>
                         <div className="relative p-10 bg-black/60 backdrop-blur-xl rounded-[32px] border border-border-subtle">
                            <h4 className="text-[11px] font-black text-muted uppercase tracking-[0.3em] mb-10 flex items-center gap-4">
                               <span className="w-8 h-px bg-primary/30"></span>
                               Founder's Strategic Directives
                            </h4>
                            <p className="text-xl md:text-2xl font-bold text-white leading-relaxed italic pr-6">
                               "{fr.decision_json.reason}"
                            </p>
                            
                            <div className="mt-10 flex flex-wrap gap-4">
                              {fr.decision_json.risks?.map((risk, idx) => (
                                <span key={idx} className="bg-primary/10 text-primary text-[10px] font-black px-5 py-2.5 rounded-xl border border-primary/20 uppercase tracking-[0.2em] flex items-center gap-3">
                                  <AlertTriangle className="w-3.5 h-3.5" /> {risk}
                                </span>
                              ))}
                            </div>
                         </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

