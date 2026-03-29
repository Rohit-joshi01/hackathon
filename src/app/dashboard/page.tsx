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
      if (reportsData.reports) setReports(reportsData.reports);

      const aiData = await aiRes.json();
      if (aiData.productReports) setAiReports(aiData.productReports);
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
  const scoreColor = score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-rose-500';
  const scoreRing = score >= 80 ? 'stroke-emerald-500' : score >= 50 ? 'stroke-amber-500' : 'stroke-rose-500';

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
              <h1 className="text-3xl font-semibold tracking-tight">Dashboard Overview</h1>
              <p className="text-base text-neutral-500 mt-1">High-level summary of your startup&apos;s product intelligence.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleGenerateAI}
                disabled={isGenerating || reports.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-all shadow-md disabled:opacity-50 disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate Fresh Intelligence
              </button>
            </div>
          </div>

          {generationError && (
            <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 text-sm flex gap-2 items-start">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p>{generationError}</p>
            </div>
          )}

          {latestAiReport ? (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700 fade-in">
              
              {/* 1. HEADER SECTION */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-60"></div>
                
                <div className="relative z-10 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold tracking-tight">{startup?.name || 'Your Startup'}</h2>
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-100">
                      {startup?.category || 'SaaS'}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-neutral-400 mb-6 flex gap-4">
                    <span className="flex items-center gap-1.5"><Layout className="w-4 h-4" /> {startup?.product_stage || 'Early Stage'}</span>
                    <span className="flex items-center gap-1.5"><Focus className="w-4 h-4" /> {startup?.target_audience || 'B2B'}</span>
                  </div>
                  <p className="text-neutral-600 max-w-2xl leading-relaxed text-sm lg:text-base border-l-2 border-indigo-200 pl-4 py-1">
                    {latestAiReport.summary}
                  </p>
                </div>

                <div className="relative z-10 flex items-center justify-center lg:justify-end shrink-0 w-full lg:w-auto mt-4 lg:mt-0 lg:pl-10 lg:border-l lg:border-neutral-100">
                  <div className="flex flex-col items-center">
                    <div className="relative flex items-center justify-center w-36 h-36">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" className="stroke-neutral-100" strokeWidth="8" fill="none" />
                        <circle 
                          cx="50" cy="50" r="45" 
                          className={scoreRing} 
                          strokeWidth="8" 
                          fill="none" 
                          strokeLinecap="round" 
                          strokeDasharray="282.7" 
                          strokeDashoffset={282.7 - (282.7 * score) / 100}
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className={`text-4xl font-extrabold tracking-tighter ${scoreColor}`}>{score}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-4">Health Score</span>
                  </div>
                </div>
              </div>

              {/* 2. STARTUP CONTEXT PANEL */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                  <Box className="w-4 h-4" /> Startup Context
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Market Size', value: 'High Potential', icon: BarChart3 },
                    { label: 'Competition', value: 'Moderate - Crowded', icon: Activity },
                    { label: 'Business Model', value: startup?.revenue_model || 'Subscription', icon: Zap },
                    { label: 'Implementation', value: 'Medium Complexity', icon: Layers },
                    { label: 'Target Market', value: startup?.target_audience || 'B2B/Enterprise', icon: Target },
                    { label: 'Team Size', value: startup?.team_size || '1-10', icon: UserCheck }
                  ].map((item, i) => (
                    <div key={i} className="bg-white border border-neutral-200 p-4 rounded-xl shadow-sm flex items-start gap-3 hover:border-neutral-300 transition-colors">
                      <div className="p-2 bg-neutral-50 rounded-lg shrink-0">
                        <item.icon className="w-4 h-4 text-neutral-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                        <p className="text-sm font-medium text-neutral-900">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 3. FEATURE DECISION HOOK */}
              <section className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 shadow-xl text-white flex flex-col items-center justify-center text-center mt-12 mb-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-10 rounded-2xl pointer-events-none"></div>
                <div className="absolute right-0 top-0 translate-x-1/3 -translate-y-1/3 blur-[80px] w-64 h-64 bg-white opacity-20 rounded-full"></div>
                <h3 className="text-2xl font-bold tracking-tight mb-2 relative z-10">Ready to Evaluate New Features?</h3>
                <p className="text-indigo-100 mb-6 max-w-md relative z-10">Connect your product report to our decision engine and analyze exactly what you should build next.</p>
                <button onClick={() => router.push('/dashboard/raise-ticket')} className="relative z-10 bg-white text-indigo-900 px-6 py-3 rounded-full font-bold text-sm shadow-md flex items-center gap-2 hover:bg-neutral-50 hover:scale-105 transition-all group">
                  Raise Feature Ticket <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </section>

            </div>
          ) : (
            <div className="text-center py-32 bg-white border border-neutral-200 border-dashed rounded-3xl mt-8">
              <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-8 w-8 text-neutral-300" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 tracking-tight">No Intelligence Generated</h3>
              <p className="mt-2 text-base text-neutral-500 max-w-md mx-auto">Upload your product metrics, sales tracking, and founder notes in the Documents tab, then click Generate to unleash Castly AI.</p>
            </div>
          )}

        </div>
      </main>
  );
}
