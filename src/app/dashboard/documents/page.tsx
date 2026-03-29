"use client";

import { useEffect, useState, useRef } from 'react';
import { Upload, FileText, Loader2, Trash2, AlertTriangle } from 'lucide-react';

type Report = {
  id: string;
  startup_id: string;
  type: string;
  file_url: string;
  created_at: string;
};

export default function DocumentsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (data.reports) setReports(data.reports);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        fetchData();
      } else {
        console.error('Failed to delete report');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="flex-1 p-8 lg:p-12 overflow-y-auto w-full bg-background relative z-10">
      <div className="max-w-4xl mx-auto space-y-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Documents</h1>
            <p className="text-lg text-muted font-medium">Manage the raw data sources used for AI intelligence generation.</p>
          </div>
          <button 
            onClick={() => setIsUploading(!isUploading)}
            className="flex items-center gap-3 px-6 py-3.5 bg-primary text-white text-sm font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary/90 transition-all shadow-[0_0_25px_rgba(255,59,0,0.3)] group"
          >
            <Upload className={`w-5 h-5 transition-transform duration-300 ${isUploading ? 'rotate-180' : 'group-hover:-translate-y-1'}`} /> {isUploading ? 'Cancel Upload' : 'Upload Data'}
          </button>
        </div>

        {isUploading && (
          <div className="p-10 glass-card-strong rounded-[40px] shadow-sm animate-in fade-in slide-in-from-top-6 duration-500 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-[0.02] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <h2 className="text-2xl font-black text-white mb-8 relative z-10">Upload New Document</h2>
            <form onSubmit={handleUpload} className="space-y-8 max-w-lg relative z-10">
              {uploadError && <div className="p-4 text-sm font-bold text-primary bg-primary/10 rounded-xl border border-primary/20">{uploadError}</div>}
              <div className="space-y-3">
                <label className="block text-[11px] font-black text-muted uppercase tracking-[0.2em] px-1">Document Type</label>
                <select name="type" required className="w-full px-6 py-4.5 border border-border-subtle rounded-2xl text-sm bg-black/40 text-white focus:bg-black/60 focus:ring-2 focus:ring-primary/50 outline-none transition-all font-bold appearance-none cursor-pointer">
                  <option value="sales" className="bg-surface">Sales Report (PDF/CSV)</option>
                  <option value="marketing" className="bg-surface">Marketing Strategy</option>
                  <option value="analytics" className="bg-surface">User Analytics</option>
                  <option value="notes" className="bg-surface">Founder Strategic Notes</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="block text-[11px] font-black text-muted uppercase tracking-[0.2em] px-1">Source File</label>
                <input type="file" name="file" accept=".pdf,.csv,.txt" ref={fileInputRef} required className="block w-full text-sm text-muted/60 file:mr-6 file:py-3.5 file:px-8 file:rounded-xl file:border-0 file:text-[11px] file:font-black file:uppercase file:tracking-[0.2em] file:bg-primary/10 file:text-primary hover:file:bg-primary hover:file:text-white transition-all cursor-pointer bg-black/40 rounded-2xl border border-border-subtle p-2 font-bold" />
              </div>
              <div className="pt-4">
                <button type="submit" disabled={uploadLoading} className="flex items-center gap-3 px-10 py-4.5 bg-primary text-white text-sm font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary/90 disabled:opacity-70 transition-all shadow-[0_0_20px_rgba(255,59,0,0.3)]">
                  {uploadLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm Upload'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="glass-card-strong rounded-[40px] overflow-hidden shadow-sm relative">
           <div className="absolute inset-0 bg-primary opacity-[0.01] pointer-events-none"></div>
          {reports.length === 0 ? (
            <div className="p-24 text-sm text-center text-muted flex flex-col items-center group relative z-10">
               <div className="w-20 h-20 bg-black/40 rounded-[28px] flex items-center justify-center mb-8 border border-border-subtle group-hover:scale-110 transition-transform duration-500">
                  <FileText className="w-10 h-10 text-primary opacity-40" />
               </div>
               <p className="font-bold text-lg text-white mb-2">No data sources detected</p>
               <p className="text-muted/60 max-w-xs mx-auto font-medium">Upload your product metrics or strategy notes to begin generating intelligence.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border-subtle/30 relative z-10">
              {reports.map((report) => (
                <li key={report.id} className="p-8 hover:bg-white/[0.02] flex items-center justify-between group transition-all duration-300">
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-black/60 rounded-2xl border border-border-subtle group-hover:border-primary/30 transition-colors">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-white tracking-tight">{report.file_url.split('/').pop()}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-primary/20">
                          {report.type}
                        </span>
                        <span className="text-xs text-muted/40 font-bold uppercase tracking-widest">
                          Synced {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                    <button 
                      onClick={() => handleDeleteReport(report.id)}
                      className="p-3.5 text-muted hover:text-primary bg-black/40 hover:bg-primary/10 rounded-2xl border border-border-subtle hover:border-primary/20 transition-all"
                      title="Delete report"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

