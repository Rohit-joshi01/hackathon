"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LogOut, LayoutDashboard, BrainCog, Upload, FileText, Loader2, Sparkles, 
  TrendingUp, AlertTriangle, ShieldCheck, Zap, Trash2, ArrowRight, Activity, 
  BarChart3, CheckCircle2, Lightbulb, Navigation, Layout, Box, Focus, AlertCircle,
  Layers, Target, UserCheck, PieChart
} from 'lucide-react';

type Startup = {
  name?: string;
  category?: string;
  team_size?: string;
  product_description?: string;
  product_stage?: string;
  target_audience?: string;
  revenue_model?: string;
  goals?: string[];
};

type Report = {
  id: string;
  startup_id: string;
  type: string;
  file_url: string;
  created_at: string;
};

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

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [startup, setStartup] = useState<Startup | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [aiReports, setAiReports] = useState<ProductReportRow[]>([]);
  const [featureRequests, setFeatureRequests] = useState<FeatureRequestRow[]>([]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');

  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [isRaisingTicket, setIsRaisingTicket] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState('');
  const [lastTicketDecision, setLastTicketDecision] = useState<FeatureDecisionJson | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (userData.user) setUser(userData.user);

      const [reportsRes, aiRes, featureRes] = await Promise.all([
        fetch('/api/reports'),
        fetch('/api/ai/generate'),
        fetch('/api/feature-requests')
      ]);

      const reportsData = await reportsRes.json();
      if (reportsData.reports) {
        setReports(reportsData.reports);
        // Default to select all if none are already selected
        if (selectedReports.length === 0) {
          setSelectedReports(reportsData.reports.map((r: any) => r.id));
        }
      }

      const aiData = await aiRes.json();
      if (aiData.productReports) {
        // Ensure report_json is always a parsed object (PostgreSQL JSONB can sometimes be a string)
        const normalizedReports = aiData.productReports.map((r: any) => ({
          ...r,
          report_json: typeof r.report_json === 'string' ? JSON.parse(r.report_json) : r.report_json
        }));
        setAiReports(normalizedReports);
      }
      if (aiData.startup) setStartup(aiData.startup);


      const featureData = await featureRes.json();
      if (featureData.featureRequests) setFeatureRequests(featureData.featureRequests);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadLoading(true);
    setUploadError('');

    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;

    if (!file || file.size === 0) {
      setUploadError('Please select a file.');
      setUploadLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/reports', { method: 'POST', body: formData });
      if (res.ok) {
        setIsUploading(false);
        fetchData(); 
      } else {
        const data = await res.json();
        setUploadError(data.error || 'Failed to upload report');
      }
    } catch (err) {
      setUploadError('An unexpected error occurred.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Delete this report?')) return;
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedReports(prev => prev.filter(r => r !== id));
        fetchData();
      } else {
        console.error('Failed to delete report');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleReportSelection = (id: string) => {
    setSelectedReports(prev => 
      prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
    );
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setGenerationError('');
    try {
      const res = await fetch('/api/ai/generate', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportIds: selectedReports })
      });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        setGenerationError(data.error || 'Failed to generate AI report (Make sure GEMINI_API_KEY is configured)');
      }
    } catch (err) {
      setGenerationError('An unexpected error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  const openRaiseTicket = () => {
    setIsRaisingTicket(true);
    setTicketError('');
    setLastTicketDecision(null);
    setTimeout(() => {
      const el = document.getElementById('feature-requests');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

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
      fetchData();
    } catch (err) {
      console.error('Ticket submit error:', err);
      setTicketError('An unexpected error occurred. Please try again.');
    } finally {
      setTicketLoading(false);
    }
  };

  const latestAiReport = aiReports.length > 0 ? (aiReports[0].report_json as unknown as ProductReportJson) : null;
  const score = latestAiReport?.score ?? 0;
  const scoreTier = score >= 80 ? 'Excellent' : score >= 50 ? 'Good' : 'Needs Work';
  const scoreHex = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  // r=42: circumference = 2 * π * 42 ≈ 263.9
  const CIRC = 263.9;
  const strokeDashoffset = CIRC - (CIRC * score) / 100;

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
        <div className="max-w-6xl mx-auto space-y-10">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Dashboard Overview</h1>
              <p className="text-base text-muted max-w-2xl">High-level summary of your startup's product intelligence.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleGenerateAI}
                disabled={isGenerating || (reports.length > 0 && selectedReports.length === 0) || reports.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(255,59,0,0.2)] disabled:opacity-50 disabled:shadow-none focus:outline-none"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {isGenerating ? 'Analyzing...' : 'Generate Fresh Intelligence'}
              </button>
            </div>
          </div>

          {/* DOCUMENT SELECTION SECTION */}
          <section className="glass-card-strong rounded-3xl p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Source Documents
                </h3>
                <p className="text-xs text-muted/60 mt-1">Select which documents to include in the intelligence analysis.</p>
              </div>
              {reports.length > 0 && (
                <button 
                  onClick={() => {
                    if (selectedReports.length === reports.length) setSelectedReports([]);
                    else setSelectedReports(reports.map(r => r.id));
                  }}
                  className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  {selectedReports.length === reports.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {reports.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {reports.map((report) => {
                  const isSelected = selectedReports.includes(report.id);
                  return (
                    <div 
                      key={report.id}
                      onClick={() => toggleReportSelection(report.id)}
                      className={`cursor-pointer group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 ${
                        isSelected 
                          ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(255,59,0,0.1)]' 
                          : 'border-border-subtle hover:border-muted/30 bg-black/20'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        isSelected ? 'bg-primary border-primary' : 'bg-transparent border-border-subtle'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-muted'}`}>
                          {report.type}
                        </p>
                        <p className="text-[10px] text-muted/40 mt-0.5 font-medium">
                          {new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReport(report.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 glass-card-subtle rounded-xl">
                <p className="text-xs text-muted/60">No documents uploaded yet.</p>
              </div>
            )}
          </section>

          {generationError && (
            <div className="p-4 glass-card-primary rounded-xl border border-primary/20 text-sm flex gap-2 items-start text-primary">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p>{generationError}</p>
            </div>
          )}

          {latestAiReport ? (
            <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700 fade-in">
              
              {/* 1. HEADER SECTION */}
              <div className="glass-card-strong rounded-[32px] p-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary opacity-[0.03] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 group-hover:opacity-[0.05] transition-opacity duration-700"></div>
                
                <div className="relative z-10 flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <h2 className="text-4xl font-bold tracking-tight text-white">{startup?.name || 'Your Startup'}</h2>
                    <span className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg border border-primary/20">
                      {startup?.category || 'SaaS'}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-muted mb-8 flex gap-6">
                    <span className="flex items-center gap-2"><Layout className="w-4.5 h-4.5 text-primary" /> {startup?.product_stage || 'Early Stage'}</span>
                    <span className="flex items-center gap-2"><Focus className="w-4.5 h-4.5 text-primary" /> {startup?.target_audience || 'B2B'}</span>
                  </div>
                  <p className="text-muted leading-relaxed text-sm lg:text-base border-l-2 border-primary/30 pl-6 py-2 bg-black/10 rounded-r-2xl pr-6 font-medium">
                    {latestAiReport.summary}
                  </p>
                </div>

                <div className="relative z-10 flex items-center justify-center lg:justify-end shrink-0 w-full lg:w-auto mt-4 lg:mt-0 lg:pl-12 lg:border-l lg:border-border-subtle">
                  <div className="flex flex-col items-center gap-4">
                    {/* Health Score Ring */}
                    <div className="relative flex items-center justify-center w-44 h-44">
                      {/* Glow background */}
                      <div
                        className="absolute inset-0 rounded-full blur-2xl opacity-20"
                        style={{ backgroundColor: scoreHex }}
                      />
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        {/* Track */}
                        <circle
                          cx="50" cy="50" r="42"
                          stroke="rgba(255,255,255,0.06)"
                          strokeWidth="7"
                          fill="none"
                        />
                        {/* Progress arc */}
                        <circle
                          cx="50" cy="50" r="42"
                          stroke={scoreHex}
                          strokeWidth="7"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={CIRC}
                          strokeDashoffset={strokeDashoffset}
                          style={{
                            transition: 'stroke-dashoffset 1s ease',
                            filter: `drop-shadow(0 0 6px ${scoreHex})`
                          }}
                        />
                      </svg>
                      {/* Center label */}
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-5xl font-black tracking-tighter leading-none" style={{ color: scoreHex }}>
                          {score}
                        </span>
                        <span className="text-[10px] font-black text-muted/40 uppercase tracking-[0.25em] mt-1">/100</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-black text-muted uppercase tracking-[0.2em]">Health Score</span>
                      <span className="text-[11px] font-bold px-3 py-1 rounded-lg border" style={{ color: scoreHex, borderColor: scoreHex + '40', backgroundColor: scoreHex + '18' }}>
                        {scoreTier}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. STARTUP CONTEXT PANEL */}
              <section className="space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted flex items-center gap-3">
                  <Box className="w-5 h-5 text-primary" /> Startup Context
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Market Size', value: 'High Potential', icon: BarChart3 },
                    { label: 'Competition', value: 'Moderate - Crowded', icon: Activity },
                    { label: 'Business Model', value: startup?.revenue_model || 'Subscription', icon: Zap },
                    { label: 'Implementation', value: 'Medium Complexity', icon: Layers },
                    { label: 'Target Market', value: startup?.target_audience || 'B2B/Enterprise', icon: Target },
                    { label: 'Team Size', value: startup?.team_size || '1-10', icon: UserCheck }
                  ].map((item, i) => (
                    <div key={i} className="glass-card p-6 rounded-2xl flex items-start gap-4 hover:border-primary/30 transition-all duration-300">
                      <div className="p-3 bg-black/40 rounded-xl shrink-0 border border-border-subtle">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted/60 uppercase tracking-widest mb-1.5">{item.label}</p>
                        <p className="text-sm font-bold text-white tracking-tight">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 3. FEATURE DECISION HOOK */}
              <section className="glass-card-primary rounded-[32px] p-12 shadow-2xl text-white flex flex-col items-center justify-center text-center mt-16 mb-12 relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-700"></div>
                <div className="absolute right-0 top-0 translate-x-1/2 -translate-y-1/2 blur-[100px] w-96 h-96 bg-primary opacity-10 rounded-full"></div>
                <h3 className="text-3xl font-bold tracking-tight mb-4 relative z-10">Ready to Evaluate New Features?</h3>
                <p className="text-muted mb-10 max-w-lg relative z-10 font-medium">Connect your product report to our decision engine and analyze exactly what you should build next based on real market data.</p>
                <button 
                  onClick={() => router.push('/dashboard/raise-ticket')} 
                  className="relative z-10 bg-primary text-white px-10 py-4 rounded-2xl font-bold text-sm shadow-[0_0_30px_rgba(255,59,0,0.3)] flex items-center gap-3 hover:scale-105 transition-all duration-300 group"
                >
                  Raise Feature Ticket <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                </button>
              </section>

            </div>
          ) : (
            <div className="text-center py-40 glass-card-strong border-2 border-border-subtle border-dashed rounded-[48px] mt-12 relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary opacity-[0.01] group-hover:opacity-[0.03] transition-opacity duration-700"></div>
              <div className="w-24 h-24 bg-black/40 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-border-subtle group-hover:scale-110 transition-transform duration-500">
                <Sparkles className="h-10 w-10 text-primary opacity-40" />
              </div>
              <h3 className="text-3xl font-black text-white tracking-tight mb-4">No Intelligence Generated</h3>
              <p className="text-lg text-muted/60 max-w-md mx-auto font-medium leading-relaxed">Upload your product metrics, sales tracking, and founder notes in the Documents tab, then click Generate to unleash Castly AI.</p>
            </div>
          )}

        </div>
      </main>
  );
}
