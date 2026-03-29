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
    <main className="flex-1 p-8 lg:p-12 overflow-y-auto w-full">
      <div className="max-w-4xl mx-auto space-y-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Documents</h1>
            <p className="text-base text-neutral-500 mt-1">Manage the raw data sources used for AI intelligence generation.</p>
          </div>
          <button 
            onClick={() => setIsUploading(!isUploading)}
            className="flex items-center gap-2 px-4 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-all shadow-md"
          >
            <Upload className="w-4 h-4" /> {isUploading ? 'Cancel Upload' : 'Upload Data'}
          </button>
        </div>

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

        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
          {reports.length === 0 ? (
            <div className="p-16 text-sm text-center text-neutral-400 flex flex-col items-center">
               <FileText className="w-12 h-12 text-neutral-200 mb-4" />
               <p>No documents uploaded yet. Add some data to begin.</p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {reports.map((report) => (
                <li key={report.id} className="p-5 hover:bg-neutral-50 flex items-center justify-between group transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-xl shrink-0">
                      <FileText className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-neutral-900">{report.file_url.split('/').pop()}</p>
                      <p className="text-sm text-neutral-500 capitalize mt-1">{report.type} • Uploaded {new Date(report.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDeleteReport(report.id)}
                      className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
