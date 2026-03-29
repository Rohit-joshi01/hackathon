"use client";

import { useEffect, useState } from 'react';
import {
  Loader2, Sparkles, TrendingUp, AlertTriangle, Activity, BrainCog,
  CheckCircle2, Lightbulb, Navigation, LayoutDashboard, Target, UserCheck,
  Sword, Shield, Zap, Globe, Star, Trophy, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend, LineChart, Line
} from 'recharts';

type CompetitorScore = {
  product_quality: number;
  market_reach: number;
  pricing_competitiveness: number;
  user_experience: number;
  feature_completeness: number;
  growth_velocity: number;
};

type Competitor = {
  name: string;
  founded: string;
  funding: string;
  scores: CompetitorScore;
  differentiator: string;
  weakness_vs_us: string;
};

type ProductReportJson = {
  summary: string;
  product_intelligence_summary: string;
  business_revenue_insights: string;
  customer_demand_insights: string;
  market_intelligence: string;
  strengths: string[];
  weaknesses: string[];
  user_behavior: string[];
  revenue_insights: string[];
  market_insights: string[];
  competitor_comparison: string[];
  score: number;
  chart_data?: {
    user_behavior_patterns: { category: string; value: number }[];
    revenue_blockers: { blocker: string; severity: number }[];
    market_opportunities: { segment: string; potential: number }[];
  };
  competitor_analysis?: {
    our_startup: { name: string; scores: CompetitorScore };
    competitors: Competitor[];
    competitive_advantage: string;
    market_gap: string;
  };
};

type ProductReportRow = {
  id: string;
  startup_id: string;
  report_json: ProductReportJson;
  created_at: string;
};

const TOOLTIP_STYLE = {
  backgroundColor: '#0F0F0F',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
};

const SCORE_LABELS: Record<keyof CompetitorScore, string> = {
  product_quality: 'Product Quality',
  market_reach: 'Market Reach',
  pricing_competitiveness: 'Pricing',
  user_experience: 'UX',
  feature_completeness: 'Features',
  growth_velocity: 'Growth',
};

const COMPETITOR_COLORS = ['#FF3B00', '#3B82F6', '#10B981', '#F59E0B'];

export default function IntelligencePage() {
  const [aiReports, setAiReports] = useState<ProductReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'competitors'>('overview');

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/ai/generate');
      const data = await res.json();
      if (data.productReports) {
        const normalized = data.productReports.map((r: any) => ({
          ...r,
          report_json: typeof r.report_json === 'string' ? JSON.parse(r.report_json) : r.report_json,
        }));
        setAiReports(normalized);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load reports.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setError('');
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportIds: [] }),
      });
      if (res.ok) {
        await fetchReports();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to regenerate report.');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setIsRegenerating(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 p-8 lg:p-12 flex items-center justify-center w-full h-full">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted text-sm font-medium">Loading intelligence...</p>
        </div>
      </main>
    );
  }

  const latestAiReport = aiReports.length > 0 ? (aiReports[0].report_json as unknown as ProductReportJson) : null;

  if (!latestAiReport) {
    return (
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-40 glass-card-strong border-2 border-border-subtle border-dashed rounded-[48px] mt-8 relative overflow-hidden">
            <div className="w-24 h-24 glass-card-subtle rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Sparkles className="h-10 w-10 text-primary opacity-40" />
            </div>
            <h3 className="text-3xl font-black text-white tracking-tight mb-4">No Intelligence Generated</h3>
            <p className="text-muted/60 max-w-md mx-auto font-medium">Go to the Dashboard overview to generate your first AI product intelligence report.</p>
          </div>
        </div>
      </main>
    );
  }

  // Build radar data for competitor comparison
  const ca = latestAiReport.competitor_analysis;
  const radarData = ca
    ? Object.keys(SCORE_LABELS).map((key) => {
        const k = key as keyof CompetitorScore;
        const row: Record<string, any> = { metric: SCORE_LABELS[k] };
        row[ca.our_startup.name || 'Us'] = ca.our_startup.scores[k];
        ca.competitors.forEach((c) => { row[c.name] = c.scores[k]; });
        return row;
      })
    : [];

  // Build grouped bar data for competitor
  const barCompData = ca
    ? ca.competitors.map((c) => ({
        name: c.name,
        'Product Quality': c.scores.product_quality,
        'Market Reach': c.scores.market_reach,
        'UX': c.scores.user_experience,
        'Features': c.scores.feature_completeness,
        'Growth': c.scores.growth_velocity,
      }))
    : [];

  // Build line chart: our startup vs each competitor across all metrics
  const lineData = ca
    ? Object.keys(SCORE_LABELS).map((key) => {
        const k = key as keyof CompetitorScore;
        const row: Record<string, any> = { metric: SCORE_LABELS[k] };
        row[ca.our_startup.name || 'Us'] = ca.our_startup.scores[k];
        ca.competitors.forEach((c) => { row[c.name] = c.scores[k]; });
        return row;
      })
    : [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'charts', label: 'Analytics', icon: Activity },
    { id: 'competitors', label: 'Competitors', icon: Sword },
  ] as const;

  return (
    <main className="flex-1 p-8 lg:p-12 overflow-y-auto w-full">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-2">Product Intelligence</h1>
            <p className="text-muted max-w-2xl">Deep-dive analytics, market positioning, and competitor benchmarks.</p>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(255,59,0,0.2)] disabled:opacity-50"
          >
            {isRegenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {isRegenerating ? 'Analyzing...' : 'Regenerate Analysis'}
          </button>
        </div>

        {error && (
          <div className="p-4 glass-card-primary rounded-xl border border-primary/20 text-sm flex gap-2 items-center text-primary">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* SCORE + QUICK STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Health Score', value: `${latestAiReport.score}/100`, icon: Star, color: '#FF3B00' },
            { label: 'Strengths', value: latestAiReport.strengths?.length ?? 0, icon: CheckCircle2, color: '#10b981' },
            { label: 'Weaknesses', value: latestAiReport.weaknesses?.length ?? 0, icon: AlertTriangle, color: '#f59e0b' },
            { label: 'Competitors', value: ca?.competitors?.length ?? 0, icon: Sword, color: '#3b82f6' },
          ].map((stat, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: stat.color + '18', border: `1px solid ${stat.color}30` }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl font-black text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="flex gap-2 glass-card-subtle rounded-2xl p-1.5 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-[0_0_12px_rgba(255,59,0,0.3)]'
                  : 'text-muted hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── TAB: OVERVIEW ──────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Product Intelligence', value: latestAiReport.product_intelligence_summary || latestAiReport.summary, icon: BrainCog },
                { title: 'Business & Revenue', value: latestAiReport.business_revenue_insights || latestAiReport.revenue_insights?.[0] || '—', icon: Activity },
                { title: 'Customer Demand', value: latestAiReport.customer_demand_insights || latestAiReport.user_behavior?.[0] || '—', icon: UserCheck },
                { title: 'Market Strategy', value: latestAiReport.market_intelligence || latestAiReport.market_insights?.[0] || '—', icon: Target },
              ].map((card, i) => (
                <div key={i} className="glass-card rounded-[32px] p-8 relative overflow-hidden group">
                  <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
                    <card.icon className="w-32 h-32 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <card.icon className="w-4 h-4 text-primary" />{card.title}
                  </h3>
                  <p className="text-sm text-accent leading-relaxed font-medium glass-card-subtle p-5 rounded-2xl">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Strengths + Weaknesses */}
            <div className="glass-card rounded-[32px] p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-[0.02] rounded-full blur-[80px]" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-[0.2em] flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Core Strengths
                  </h4>
                  <ul className="space-y-3">
                    {latestAiReport.strengths?.map((s, i) => (
                      <li key={i} className="text-sm text-accent glass-card-subtle px-5 py-3 rounded-xl font-medium flex items-start gap-3">
                        <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-[0.2em] flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Core Weaknesses
                  </h4>
                  <ul className="space-y-3">
                    {latestAiReport.weaknesses?.map((w, i) => (
                      <li key={i} className="text-sm text-accent glass-card-subtle px-5 py-3 rounded-xl font-medium flex items-start gap-3">
                        <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />{w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Strategic Roadmap */}
            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-3">
                <Navigation className="w-4 h-4 text-primary" /> Strategic Roadmap
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(latestAiReport.strengths || []).slice(0, 3).map((_, idx) => {
                  const actions = [
                    'Optimize scaling efficiency for high-growth segments.',
                    'Implement predictive churn analysis to safeguard revenue.',
                    'Accelerate feature deployment for core user personas.',
                  ];
                  return (
                    <div key={idx} className="glass-card rounded-[28px] p-6 group hover:border-primary/30 transition-all">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xs mb-5">
                        0{idx + 1}
                      </div>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Priority Initiative</p>
                      <p className="text-sm font-bold text-white leading-snug">{actions[idx]}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ─── TAB: CHARTS ─────────────────────────────────────────── */}
        {activeTab === 'charts' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {latestAiReport.chart_data ? (
              <>
                {/* ROW 1: Behavior patterns + Revenue blockers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card rounded-3xl p-8">
                    <h3 className="text-xs font-bold tracking-widest uppercase text-muted flex items-center gap-2 mb-6">
                      <UserCheck className="w-4 h-4 text-primary" /> User Behavior Patterns
                    </h3>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={latestAiReport.chart_data.user_behavior_patterns} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                          <RechartsTooltip cursor={{ fill: 'rgba(255,59,0,0.05)' }} contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#FF3B00', fontWeight: 700 }} />
                          <Bar dataKey="value" fill="#FF3B00" radius={[6, 6, 0, 0]} maxBarSize={48} name="Score" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass-card rounded-3xl p-8">
                    <h3 className="text-xs font-bold tracking-widest uppercase text-muted flex items-center gap-2 mb-6">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> Revenue Blockers
                    </h3>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={latestAiReport.chart_data.revenue_blockers} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="blocker" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                          <RechartsTooltip cursor={{ fill: 'rgba(245,158,11,0.05)' }} contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#f59e0b', fontWeight: 700 }} />
                          <Bar dataKey="severity" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={48} name="Severity" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* ROW 2: Market opportunities (full width area chart) */}
                <div className="glass-card rounded-3xl p-8">
                  <h3 className="text-xs font-bold tracking-widest uppercase text-muted flex items-center gap-2 mb-6">
                    <TrendingUp className="w-4 h-4 text-primary" /> Market Opportunities
                  </h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={latestAiReport.chart_data.market_opportunities} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPotential" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF3B00" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#FF3B00" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="segment" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                        <RechartsTooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#FF3B00', fontWeight: 700 }} />
                        <Area type="monotone" dataKey="potential" stroke="#FF3B00" strokeWidth={3} fillOpacity={1} fill="url(#colorPotential)" name="Potential" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <div className="glass-card rounded-3xl p-12 text-center">
                <p className="text-muted">No chart data available. Regenerate the analysis to get charts.</p>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: COMPETITORS ────────────────────────────────────── */}
        {activeTab === 'competitors' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {ca ? (
              <>
                {/* Competitive Advantage + Market Gap */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card-primary rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className="w-5 h-5 text-primary" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-primary">Our Competitive Advantage</h3>
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">{ca.competitive_advantage}</p>
                  </div>
                  <div className="glass-card rounded-2xl p-6 border border-blue-500/15">
                    <div className="flex items-center gap-3 mb-3">
                      <Globe className="w-5 h-5 text-blue-400" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-blue-400">Market Gap Opportunity</h3>
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">{ca.market_gap}</p>
                  </div>
                </div>

                {/* Competitor Cards */}
                <section className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-3">
                    <Sword className="w-4 h-4 text-primary" /> Competitor Profiles
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {ca.competitors.map((comp, i) => (
                      <div key={i} className="glass-card rounded-2xl p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-black text-white text-lg">{comp.name}</h4>
                            <div className="flex gap-3 mt-1">
                              <span className="text-[10px] text-muted font-mono">Est. {comp.founded}</span>
                              <span className="text-[10px] text-primary font-mono">{comp.funding}</span>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black" style={{ backgroundColor: COMPETITOR_COLORS[i + 1] + '18', color: COMPETITOR_COLORS[i + 1] }}>
                            #{i + 1}
                          </div>
                        </div>

                        {/* Score bars */}
                        <div className="space-y-2">
                          {Object.entries(SCORE_LABELS).map(([key, label]) => {
                            const score = comp.scores[key as keyof CompetitorScore];
                            const ours = ca.our_startup.scores[key as keyof CompetitorScore];
                            const isAhead = ours >= score;
                            return (
                              <div key={key}>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-[10px] text-muted">{label}</span>
                                  <span className="text-[10px] font-bold" style={{ color: isAhead ? '#10b981' : '#f59e0b' }}>
                                    {isAhead ? '↑' : '↓'} {score}
                                  </span>
                                </div>
                                <div className="h-1.5 glass-card-subtle rounded-full">
                                  <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{ width: `${score}%`, backgroundColor: COMPETITOR_COLORS[i + 1] }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <div>
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Their Edge</p>
                            <p className="text-xs text-muted">{comp.differentiator}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Our Advantage</p>
                            <p className="text-xs text-muted">{comp.weakness_vs_us}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Radar Chart: Us vs All Competitors */}
                <div className="glass-card rounded-3xl p-8">
                  <h3 className="text-xs font-bold tracking-widest uppercase text-muted flex items-center gap-2 mb-6">
                    <Trophy className="w-4 h-4 text-primary" /> Competitive Radar — {ca.our_startup.name} vs Competitors
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                        <PolarGrid stroke="rgba(255,255,255,0.06)" />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#9CA3AF' }} />
                        <Radar name={ca.our_startup.name || 'Us'} dataKey={ca.our_startup.name || 'Us'} stroke="#FF3B00" fill="#FF3B00" fillOpacity={0.15} strokeWidth={2} />
                        {ca.competitors.map((c, i) => (
                          <Radar key={c.name} name={c.name} dataKey={c.name} stroke={COMPETITOR_COLORS[i + 1]} fill={COMPETITOR_COLORS[i + 1]} fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 2" />
                        ))}
                        <Legend iconType="plainline" wrapperStyle={{ fontSize: '11px', color: '#9CA3AF' }} />
                        <RechartsTooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ fontWeight: 700 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Line Chart: Side-by-side metric comparison */}
                <div className="glass-card rounded-3xl p-8">
                  <h3 className="text-xs font-bold tracking-widest uppercase text-muted flex items-center gap-2 mb-6">
                    <Zap className="w-4 h-4 text-primary" /> Metric-by-Metric Comparison
                  </h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="metric" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF' }} domain={[0, 100]} />
                        <RechartsTooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ fontWeight: 700 }} />
                        <Legend iconType="plainline" wrapperStyle={{ fontSize: '11px', color: '#9CA3AF' }} />
                        <Line type="monotone" dataKey={ca.our_startup.name || 'Us'} stroke="#FF3B00" strokeWidth={3} dot={{ fill: '#FF3B00', r: 4 }} />
                        {ca.competitors.map((c, i) => (
                          <Line key={c.name} type="monotone" dataKey={c.name} stroke={COMPETITOR_COLORS[i + 1]} strokeWidth={1.5} strokeDasharray="4 2" dot={{ fill: COMPETITOR_COLORS[i + 1], r: 3 }} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Score comparison table */}
                <div className="glass-card rounded-3xl p-8">
                  <h3 className="text-xs font-bold tracking-widest uppercase text-muted flex items-center gap-2 mb-6">
                    <LayoutDashboard className="w-4 h-4 text-primary" /> Score Matrix
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="text-left py-3 pr-8 text-[10px] font-bold text-muted uppercase tracking-widest">Metric</th>
                          <th className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#FF3B00' }}>
                            {ca.our_startup.name || 'Us'}
                          </th>
                          {ca.competitors.map((c, i) => (
                            <th key={c.name} className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: COMPETITOR_COLORS[i + 1] }}>
                              {c.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(SCORE_LABELS).map(([key, label]) => {
                          const k = key as keyof CompetitorScore;
                          const ourScore = ca.our_startup.scores[k];
                          return (
                            <tr key={key} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 pr-8 text-white/70 text-xs font-medium">{label}</td>
                              <td className="text-center py-3 px-4">
                                <span className="font-black text-primary">{ourScore}</span>
                              </td>
                              {ca.competitors.map((c, i) => {
                                const compScore = c.scores[k];
                                const isOursAhead = ourScore >= compScore;
                                return (
                                  <td key={c.name} className="text-center py-3 px-4">
                                    <span className={`font-bold text-xs px-2 py-0.5 rounded-lg ${isOursAhead ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {compScore}
                                    </span>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="glass-card rounded-3xl p-12 text-center space-y-4">
                <Sword className="w-12 h-12 text-muted/20 mx-auto" />
                <p className="text-white font-bold">No Competitor Data Yet</p>
                <p className="text-muted text-sm max-w-sm mx-auto">Regenerate the intelligence report to get AI-powered competitor benchmarks based on real market data.</p>
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="mt-4 px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all inline-flex items-center gap-2"
                >
                  {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isRegenerating ? 'Analyzing...' : 'Generate Competitor Analysis'}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
