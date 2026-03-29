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
    setTicketLoading(true);
    setTicketError('');
    setLastTicketDecision(null);

    try {
      const formData = new FormData(e.currentTarget);
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
      e.currentTarget.reset();
      fetchData();
    } catch (err) {
      setTicketError('An unexpected error occurred.');
    } finally {
      setTicketLoading(false);
    }
  };

  const latestAiReport = aiReports.length > 0 ? aiReports[0].report_json : null;
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
    <div className="min-h-screen bg-[#FDFDFD] flex font-sans text-neutral-900">
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col hidden md:flex h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b border-neutral-100">
          <span className="text-xl font-bold tracking-tight flex items-center gap-2">
            <BrainCog className="w-5 h-5 text-indigo-600" /> Castly
          </span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 bg-neutral-50 rounded-lg text-sm font-medium text-neutral-900 shadow-sm border border-neutral-100">
            <LayoutDashboard className="w-4 h-4 text-neutral-500" /> Intelligence
          </a>
          <a href="#feature-requests" className="flex items-center gap-3 px-3 py-2.5 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 rounded-lg text-sm font-medium transition-all">
            <Lightbulb className="w-4 h-4" /> Raise Ticket
          </a>
          <a href="#documents" className="flex items-center gap-3 px-3 py-2.5 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 rounded-lg text-sm font-medium transition-all">
            <FileText className="w-4 h-4" /> Documents
          </a>
        </nav>
        <div className="p-4 border-t border-neutral-100">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="text-sm truncate">
              <p className="font-medium truncate">{user?.name || 'Loading...'}</p>
              <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-50 rounded-lg border border-transparent hover:border-neutral-200 transition-all">
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 lg:p-12 overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto space-y-10">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Product Intelligence</h1>
              <p className="text-base text-neutral-500 mt-1">AI-synthesized insights across your entire product surface.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsUploading(!isUploading)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-all shadow-sm"
              >
                <Upload className="w-4 h-4" /> {isUploading ? 'Cancel Upload' : 'Upload Data'}
              </button>
              <button 
                onClick={handleGenerateAI}
                disabled={isGenerating || reports.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-all shadow-md disabled:opacity-50 disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {selectedReports.length > 0 ? `Generate Intelligence (${selectedReports.length})` : 'Generate Intelligence'}
              </button>
            </div>
          </div>

          {generationError && (
            <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 text-sm flex gap-2 items-start">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p>{generationError}</p>
            </div>
          )}

          {isUploading && (
            <div className="p-6 bg-white border border-neutral-200 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4">
              <h2 className="text-lg font-medium mb-4">Upload New Document</h2>
              <form onSubmit={handleUpload} className="space-y-4 max-w-lg">
                {uploadError && <div className="p-3 text-sm text-rose-600 bg-rose-50 rounded-lg border border-rose-100">{uploadError}</div>}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Document Type</label>
                  <select name="type" required className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all">
                    <option value="sales">Sales Report</option>
                    <option value="marketing">Marketing Report</option>
                    <option value="analytics">Product Analytics</option>
                    <option value="notes">Founder Notes</option>
                  </select>
                </div>
                <div>
                  <input type="file" name="file" accept=".pdf,.csv,.txt" ref={fileInputRef} required className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 transition-all cursor-pointer" />
                </div>
                <div className="pt-2">
                  <button type="submit" disabled={uploadLoading} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-70 transition-all shadow-sm">
                    {uploadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Upload'}
                  </button>
                </div>
              </form>
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

              {/* 4. VISUAL INSIGHT SECTION (Placeholders) */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-semibold tracking-tight text-neutral-900 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-neutral-500" /> User Growth Trend</h3>
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">+14% MoM</span>
                  </div>
                  {/* Chart Placeholder SVG */}
                  <div className="h-40 w-full flex items-end justify-between gap-2 px-1">
                    {[30, 45, 35, 60, 55, 75, 80].map((h, i) => (
                      <div key={i} className="w-full bg-indigo-50 rounded-t-sm" style={{ height: '100%' }}>
                        <div className="w-full bg-indigo-500 rounded-t-sm transition-all duration-1000 ease-out" style={{ height: `${h}%`, marginTop: `${100-h}%` }}></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-semibold tracking-tight text-neutral-900 flex items-center gap-2"><PieChart className="w-4 h-4 text-neutral-500" /> Engagement Drop-offs</h3>
                    <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-md">-5% Conversion</span>
                  </div>
                  {/* Chart Placeholder SVG */}
                  <div className="h-40 w-full relative">
                     <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
                       <path d="M 0 45 C 20 45, 30 15, 50 20 C 70 25, 80 40, 100 35" fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                       <path d="M 0 45 C 20 45, 30 15, 50 20 C 70 25, 80 40, 100 35 L 100 50 L 0 50 Z" fill="url(#roseGradient)" opacity="0.2" />
                       <defs>
                         <linearGradient id="roseGradient" x1="0" x2="0" y1="0" y2="1">
                           <stop offset="0%" stopColor="#f43f5e" />
                           <stop offset="100%" stopColor="#fff1f2" stopOpacity="0" />
                         </linearGradient>
                       </defs>
                     </svg>
                  </div>
                </div>
              </section>

              {/* 3. CORE INSIGHTS GRID */}
              <section className="space-y-4">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" /> Intelligence Grid
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-2 h-full bg-emerald-400 opacity-50"></div>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-neutral-900 mb-5"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Key Strengths</h3>
                    <ul className="space-y-4">
                      {latestAiReport.strengths?.map((s: string, i: number) => (
                        <li key={i} className="text-sm text-neutral-600 flex items-start gap-3">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span> <span className="leading-snug">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-rose-400 opacity-50"></div>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-neutral-900 mb-5"><AlertTriangle className="w-5 h-5 text-rose-500" /> Critical Weaknesses</h3>
                    <ul className="space-y-4">
                      {latestAiReport.weaknesses?.map((w: string, i: number) => (
                        <li key={i} className="text-sm text-neutral-600 flex items-start gap-3">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span> <span className="leading-snug">{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm group hover:border-blue-200 transition-colors">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-neutral-900 mb-5"><UserCheck className="w-5 h-5 text-blue-500" /> User Behavior Insights</h3>
                    <ul className="space-y-4">
                      {latestAiReport.user_behavior?.map((u: string, i: number) => (
                        <li key={i} className="text-sm text-neutral-600 leading-snug border-l-2 border-transparent group-hover:border-blue-100 pl-3 transition-colors">{u}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm group hover:border-amber-200 transition-colors">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-neutral-900 mb-5"><TrendingUp className="w-5 h-5 text-amber-500" /> Revenue Intelligence</h3>
                    <ul className="space-y-4">
                      {latestAiReport.revenue_insights?.map((r: string, i: number) => (
                        <li key={i} className="text-sm text-neutral-600 leading-snug border-l-2 border-transparent group-hover:border-amber-100 pl-3 transition-colors">{r}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm md:col-span-2 group hover:border-purple-200 transition-colors">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-neutral-900 mb-5"><BrainCog className="w-5 h-5 text-purple-500" /> Market & Competitor Landscape</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Market Intel</h4>
                        <ul className="space-y-3 pl-3 border-l-2 border-purple-50">
                          {latestAiReport.market_insights?.map((m: string, i: number) => <li key={i} className="text-sm text-neutral-600 leading-snug">{m}</li>)}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Rival Comparison</h4>
                        <ul className="space-y-3 pl-3 border-l-2 border-purple-50">
                           {latestAiReport.competitor_comparison?.map((c: string, i: number) => <li key={i} className="text-sm text-neutral-600 leading-snug">{c}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 5. KEY ALERTS SECTION */}
              <section className="bg-rose-50 border border-rose-100 rounded-2xl p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-sm font-bold text-rose-800 mb-4"><AlertCircle className="w-5 h-5" /> Key Risks Detected</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(latestAiReport.weaknesses || []).slice(0, 3).map((w: string, idx: number) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm text-sm text-neutral-800 font-medium">
                      &quot;{w.split('.')[0] || w}&quot;
                    </div>
                  ))}
                  {(!latestAiReport.weaknesses || latestAiReport.weaknesses.length === 0) && (
                    <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm text-sm font-medium text-rose-600 col-span-3">No critical risks identified currently.</div>
                  )}
                </div>
              </section>

               {/* 6. ACTIONABLE INSIGHTS SECTION */}
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

              {/* 7. FEATURE DECISION HOOK */}
              <section className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 shadow-xl text-white flex flex-col items-center justify-center text-center mt-12 mb-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-10 rounded-2xl pointer-events-none"></div>
                <div className="absolute right-0 top-0 translate-x-1/3 -translate-y-1/3 blur-[80px] w-64 h-64 bg-white opacity-20 rounded-full"></div>
                <h3 className="text-2xl font-bold tracking-tight mb-2 relative z-10">Ready to Evaluate New Features?</h3>
                <p className="text-indigo-100 mb-6 max-w-md relative z-10">Connect your product report to our decision engine and analyze exactly what you should build next.</p>
                <button onClick={openRaiseTicket} className="relative z-10 bg-white text-indigo-900 px-6 py-3 rounded-full font-bold text-sm shadow-md flex items-center gap-2 hover:bg-neutral-50 hover:scale-105 transition-all group">
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
              <p className="mt-2 text-base text-neutral-500 max-w-md mx-auto">Upload your product metrics, sales tracking, and founder notes above, then click Generate to unleash Castly AI.</p>
            </div>
          )}

          <div id="feature-requests" className="pt-12 border-t border-neutral-100">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Raise Feature Ticket</h2>
                <p className="text-sm text-neutral-500 mt-1">Submit a request and get an AI decision aligned to your latest product intelligence.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsRaisingTicket(!isRaisingTicket)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-all shadow-sm"
                >
                  <Zap className="w-4 h-4" /> {isRaisingTicket ? 'Close' : 'Raise Ticket'}
                </button>
              </div>
            </div>

            {ticketError && (
              <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 text-sm flex gap-2 items-start mb-6">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>{ticketError}</p>
              </div>
            )}

            {isRaisingTicket && (
              <div className="p-6 bg-white border border-neutral-200 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4">
                <h3 className="text-lg font-medium mb-4">Feature Request Submission</h3>
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Title</label>
                      <input
                        name="title"
                        required
                        placeholder="Short feature title"
                        className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Requested By</label>
                      <input
                        name="requested_by"
                        placeholder="Name or role"
                        className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Department</label>
                      <select
                        name="department"
                        className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all"
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
                        className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={ticketLoading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-70 transition-all shadow-sm"
                    >
                      {ticketLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Analyze & Submit
                    </button>
                  </div>
                </form>
              </div>
            )}

            {lastTicketDecision && (
              <div className="mt-6 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium">AI Decision</h3>
                    <p className="text-sm text-neutral-500 mt-1">Decision engine result for the last submitted ticket.</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${decisionBadgeClasses(lastTicketDecision.decision)}`}>
                    {lastTicketDecision.decision}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Priority</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">{lastTicketDecision.priority}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Revenue Impact</p>
                    <p className="text-sm font-medium text-neutral-800 mt-2">{lastTicketDecision.impact?.revenue_impact}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">User Impact</p>
                    <p className="text-sm font-medium text-neutral-800 mt-2">{lastTicketDecision.impact?.user_impact}</p>
                  </div>
                </div>
                <div className="mt-5 p-4 rounded-xl border border-neutral-200 bg-white">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Reason</p>
                  <p className="text-sm text-neutral-700 leading-relaxed">{lastTicketDecision.reason}</p>
                </div>
                {Array.isArray(lastTicketDecision.risks) && lastTicketDecision.risks.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Risks</p>
                    <ul className="space-y-2">
                      {lastTicketDecision.risks.slice(0, 6).map((r: string, i: number) => (
                        <li key={i} className="text-sm text-neutral-700 flex gap-2 items-start">
                          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
              {featureRequests.length === 0 ? (
                <div className="p-12 text-sm text-center text-neutral-400">No feature tickets yet.</div>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {featureRequests.map((fr) => (
                    <li key={fr.id} className="p-5 hover:bg-neutral-50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 truncate">{fr.title}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {(fr.department || 'General') + ' • ' + (fr.status || 'Submitted') + (fr.requested_by ? ` • ${fr.requested_by}` : '')}
                          </p>
                          {fr.description && (
                            <p className="text-sm text-neutral-600 mt-2 whitespace-pre-line">{fr.description}</p>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center gap-3">
                          {fr.decision_json?.decision && (
                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${decisionBadgeClasses(fr.decision_json.decision)}`}>
                              {fr.decision_json.decision}
                            </span>
                          )}
                          {fr.decision_json?.priority && (
                            <span className="text-xs font-semibold text-neutral-700 bg-neutral-50 px-3 py-1.5 rounded-full border border-neutral-100">
                              Priority: {fr.decision_json.priority}
                            </span>
                          )}
                        </div>
                      </div>
                      {fr.decision_json?.reason && (
                        <div className="mt-3 p-3 bg-white rounded-xl border border-neutral-200 text-sm text-neutral-700">
                          {fr.decision_json.reason}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div id="documents" className="pt-12 border-t border-neutral-100">
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-semibold tracking-tight">Raw Data Sources</h2>
               {selectedReports.length > 0 && (
                 <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                   {selectedReports.length} selected for AI
                 </span>
               )}
             </div>
             
             <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
              {reports.length === 0 ? (
                <div className="p-12 text-sm text-center text-neutral-400">No documents uploaded yet. Add some data to begin.</div>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {reports.map((report) => (
                    <li key={report.id} className="p-4 sm:p-5 hover:bg-neutral-50 flex items-center justify-between group transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="relative flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            checked={selectedReports.includes(report.id)}
                            onChange={() => toggleReportSelection(report.id)}
                            className="w-5 h-5 rounded-md border-neutral-300 text-black focus:ring-black cursor-pointer peer"
                          />
                        </div>
                        <div className="p-2.5 bg-neutral-100 rounded-lg shrink-0">
                          <FileText className="w-5 h-5 text-neutral-500" />
                        </div>
                        <div 
                          className="cursor-pointer"
                          onClick={() => toggleReportSelection(report.id)}
                        >
                          <p className="text-sm font-semibold text-neutral-900 group-hover:text-black transition-colors">{report.file_url.split('/').pop()}</p>
                          <p className="text-xs text-neutral-500 capitalize mt-0.5">{report.type} • {new Date(report.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDeleteReport(report.id)}
                          className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
