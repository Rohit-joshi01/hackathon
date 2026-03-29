"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type FeatureDecisionJson = {
  decision: string;
  priority: string;
  impact?: { revenue_impact?: string; user_impact?: string };
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

  useEffect(() => {
    fetch('/api/feature-requests')
      .then(res => res.json())
      .then(data => {
        if (data.featureRequests) setFeatureRequests(data.featureRequests);
      })
      .catch(console.error);
  }, []);

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
      <div className="max-w-5xl mx-auto space-y-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Ticket Analysis</h1>
          <p className="text-base text-neutral-500 mt-1">Review all raised feature tickets and their AI-driven decisions.</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
          {featureRequests.length === 0 ? (
            <div className="p-16 text-sm text-center text-neutral-400 flex flex-col items-center">
              <span className="text-4xl mb-4">📝</span>
              <p>No feature tickets have been raised yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {featureRequests.map((fr) => (
                <li key={fr.id} className="p-6 hover:bg-neutral-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-base font-semibold text-neutral-900 truncate">{fr.title}</p>
                      </div>
                      <p className="text-xs text-neutral-500 font-medium">
                        {(fr.department || 'General') + ' • ' + (fr.status || 'Submitted') + (fr.requested_by ? ` • ${fr.requested_by}` : '')}
                      </p>
                      {fr.description && (
                        <p className="text-sm text-neutral-600 mt-3 whitespace-pre-line leading-relaxed">{fr.description}</p>
                      )}
                    </div>
                    
                    <div className="shrink-0 flex flex-col items-end gap-3 min-w-[200px]">
                      {fr.decision_json?.decision && (
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${decisionBadgeClasses(fr.decision_json.decision)}`}>
                          {fr.decision_json.decision}
                        </span>
                      )}
                      {fr.decision_json?.priority && (
                        <span className="text-xs font-bold text-neutral-700 bg-neutral-100 px-3 py-1.5 rounded-lg border border-neutral-200">
                          Priority Score: {fr.decision_json.priority}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {fr.decision_json && (
                    <div className="mt-5 p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                         <div>
                           <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Revenue Impact</p>
                           <p className="text-neutral-800 font-medium">{fr.decision_json.impact?.revenue_impact || 'N/A'}</p>
                         </div>
                         <div>
                           <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">User Impact</p>
                           <p className="text-neutral-800 font-medium">{fr.decision_json.impact?.user_impact || 'N/A'}</p>
                         </div>
                      </div>
                      <div>
                         <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">AI Reasoning</p>
                         <p className="text-neutral-700 leading-relaxed">{fr.decision_json.reason}</p>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
