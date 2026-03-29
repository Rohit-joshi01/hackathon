"use client";

import { useEffect, useState } from 'react';
import { 
  Loader2, Sparkles, TrendingUp, AlertTriangle, Activity, BrainCog,
  CheckCircle2, Lightbulb, Navigation, LayoutDashboard, Target, UserCheck
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

type ProductReportJson = {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  user_behavior: string[];
  revenue_insights: string[];
  market_insights: string[];
  competitor_comparison: string[];
  score: number;
  chart_data?: {
    user_behavior_patterns: { category: string, value: number }[];
    revenue_blockers: { blocker: string, severity: number }[];
    market_opportunities: { segment: string, potential: number }[];
  }
};

type ProductReportRow = {
  id: string;
  startup_id: string;
  report_json: ProductReportJson;
  created_at: string;
};

export default function IntelligencePage() {
  const [aiReports, setAiReports] = useState<ProductReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai/generate')
      .then(res => res.json())
      .then(data => {
        if (data.productReports) setAiReports(data.productReports);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <main className="flex-1 p-8 lg:p-12 flex items-center justify-center w-full h-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </main>
    );
  }

  const latestAiReport = aiReports.length > 0 ? (aiReports[0].report_json as unknown as ProductReportJson) : null;

  if (!latestAiReport) {
    return (
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto space-y-10">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Product Intelligence</h1>
            <p className="text-base text-neutral-500 mt-1">Deep-dive analytics into your product&apos;s performance.</p>
          </div>
          <div className="text-center py-32 bg-white border border-neutral-200 border-dashed rounded-3xl mt-8">
            <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-8 w-8 text-neutral-300" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 tracking-tight">No Intelligence Generated</h3>
            <p className="mt-2 text-base text-neutral-500 max-w-md mx-auto">Go to the Dashboard overview to generate your first AI product intelligence report.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 lg:p-12 overflow-y-auto w-full">
      <div className="max-w-6xl mx-auto space-y-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Product Intelligence</h1>
          <p className="text-base text-neutral-500 mt-1">Deep-dive analytics into your product&apos;s performance and market position.</p>
        </div>

        {/* DYNAMIC VISUAL INSIGHT SECTION */}
        {latestAiReport.chart_data && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Behavior Patterns */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-semibold tracking-tight text-neutral-900 flex items-center gap-2"><UserCheck className="w-4 h-4 text-blue-500" /> Behavior Patterns</h3>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={latestAiReport.chart_data.user_behavior_patterns} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                    <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#737373' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#737373' }} />
                    <RechartsTooltip 
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e5e5e5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#3b82f6', fontWeight: 600 }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} name="Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue Blockers */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-semibold tracking-tight text-neutral-900 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-500" /> Revenue Blockers</h3>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={latestAiReport.chart_data.revenue_blockers} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                    <XAxis dataKey="blocker" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#737373' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#737373' }} />
                    <RechartsTooltip 
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e5e5e5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#f43f5e', fontWeight: 600 }}
                    />
                    <Bar dataKey="severity" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} name="Severity" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Market Opportunities */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-semibold tracking-tight text-neutral-900 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" /> Market Opportunities</h3>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={latestAiReport.chart_data.market_opportunities} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPotential" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                    <XAxis dataKey="segment" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#737373' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#737373' }} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e5e5e5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#10b981', fontWeight: 600 }}
                    />
                    <Area type="monotone" dataKey="potential" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPotential)" name="Potential" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        {/* CORE INSIGHTS GRID */}
        <section className="space-y-4">
           <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" /> Intelligence Grid
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-200 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <h3 className="flex items-center gap-2 text-base font-bold text-emerald-900 mb-5 relative z-10"><CheckCircle2 className="w-5 h-5 text-emerald-600" /> Key Strengths</h3>
              <ul className="space-y-4 relative z-10">
                {latestAiReport.strengths?.map((s: string, i: number) => (
                  <li key={i} className="bg-white/60 backdrop-blur-sm p-3.5 rounded-xl border border-emerald-100/50 text-sm text-neutral-700 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
                    <span className="mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 shrink-0 text-[10px] font-bold">{i+1}</span> 
                    <span className="leading-relaxed font-medium">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-rose-50 to-white p-6 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-200 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <h3 className="flex items-center gap-2 text-base font-bold text-rose-900 mb-5 relative z-10"><AlertTriangle className="w-5 h-5 text-rose-600" /> Critical Weaknesses</h3>
              <ul className="space-y-4 relative z-10">
                {latestAiReport.weaknesses?.map((w: string, i: number) => (
                  <li key={i} className="bg-white/60 backdrop-blur-sm p-3.5 rounded-xl border border-rose-100/50 text-sm text-neutral-700 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
                    <span className="mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-600 shrink-0 text-[10px] font-bold">{i+1}</span> 
                    <span className="leading-relaxed font-medium">{w}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-200 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <h3 className="flex items-center gap-2 text-base font-bold text-blue-900 mb-5 relative z-10"><UserCheck className="w-5 h-5 text-blue-600" /> User Behavior Insights</h3>
              <ul className="space-y-4 relative z-10">
                {latestAiReport.user_behavior?.map((u: string, i: number) => (
                  <li key={i} className="bg-white/60 backdrop-blur-sm p-3.5 rounded-xl border border-blue-100/50 text-sm text-neutral-700 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
                     <span className="mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 shrink-0 text-[10px] font-bold">{i+1}</span> 
                     <span className="leading-relaxed font-medium">{u}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-white p-6 rounded-2xl border border-amber-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-200 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <h3 className="flex items-center gap-2 text-base font-bold text-amber-900 mb-5 relative z-10"><TrendingUp className="w-5 h-5 text-amber-600" /> Revenue Intelligence</h3>
              <ul className="space-y-4 relative z-10">
                {latestAiReport.revenue_insights?.map((r: string, i: number) => (
                  <li key={i} className="bg-white/60 backdrop-blur-sm p-3.5 rounded-xl border border-amber-100/50 text-sm text-neutral-700 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
                     <span className="mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-600 shrink-0 text-[10px] font-bold">{i+1}</span> 
                     <span className="leading-relaxed font-medium">{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl border border-purple-100 shadow-sm md:col-span-2 relative overflow-hidden group">
              <div className="absolute -top-20 right-0 w-64 h-64 bg-purple-200 rounded-full blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none"></div>
              <h3 className="flex items-center gap-2 text-base font-bold text-purple-900 mb-6 relative z-10"><BrainCog className="w-5 h-5 text-purple-600" /> Market & Competitor Landscape</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-2 bg-purple-100/50 w-fit px-3 py-1.5 rounded-lg">
                    <Activity className="w-3.5 h-3.5" /> Market Intel
                  </h4>
                  <ul className="space-y-3">
                    {latestAiReport.market_insights?.map((m: string, i: number) => (
                      <li key={i} className="bg-white/60 backdrop-blur-sm p-3.5 rounded-xl border border-purple-100/50 text-sm text-neutral-700 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
                        <span className="leading-relaxed font-medium">{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-2 bg-purple-100/50 w-fit px-3 py-1.5 rounded-lg">
                    <Target className="w-3.5 h-3.5" /> Rival Comparison
                  </h4>
                  <ul className="space-y-3">
                     {latestAiReport.competitor_comparison?.map((c: string, i: number) => (
                       <li key={i} className="bg-white/60 backdrop-blur-sm p-3.5 rounded-xl border border-purple-100/50 text-sm text-neutral-700 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
                         <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
                         <span className="leading-relaxed font-medium">{c}</span>
                       </li>
                     ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ACTIONABLE INSIGHTS SECTION */}
        <section className="space-y-4">
           <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
            <Navigation className="w-4 h-4" /> Action Plan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {(latestAiReport.strengths || []).slice(0, 3).map((s: string, idx: number) => {
              const actions = [
                "Optimize pricing strategy based on value.",
                "Improve onboarding flow to reduce drop-offs.",
                "Double down on enterprise features."
              ];
              return (
                <div key={idx} className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:-translate-y-1 transition-transform cursor-default">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Lightbulb className="w-16 h-16 text-white" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Priority Action {idx + 1}</p>
                    <p className="text-white font-medium text-sm pr-6 leading-relaxed">
                      Leverage this insight: {actions[idx % actions.length]}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

      </div>
    </main>
  );
}
