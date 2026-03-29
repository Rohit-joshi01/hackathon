"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ArrowLeft, Check } from 'lucide-react';

const CATEGORIES = ["SaaS", "FMCG", "Consumer Electronics", "Marketplace", "Fintech", "Other"];
const STAGES = ["Idea", "Prototype", "MVP", "Early Revenue", "Growth"];
const REVENUE_MODELS = ["Subscription", "Freemium", "One-time Purchase", "Ad-supported", "Usage-based"];
const GOAL_OPTIONS = ["Find Product-Market Fit", "Increase Revenue", "Launch New Feature", "Raise Funding", "Expand to New Markets"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    startup_name: '',
    category: '',
    team_size: '1-10',
    product_description: '',
    product_stage: '',
    target_audience: '',
    revenue_model: '',
    primary_goals: [] as string[]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      primary_goals: prev.primary_goals.includes(goal)
        ? prev.primary_goals.filter(g => g !== goal)
        : [...prev.primary_goals, goal]
    }));
  };

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        const body = await res.json();
        setError(body.error || 'Failed to save profile');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Set up your workspace</h2>
          <p className="mt-2 text-sm text-neutral-500">Tell us a bit about your startup to personalize Castly.</p>
        </div>
        
        <div className="bg-white py-8 px-6 shadow-sm sm:rounded-xl border border-neutral-200">
          {/* Progress Bar */}
          <div className="mb-8 flex justify-between items-center relative gap-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-neutral-100 rounded-full" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-neutral-900 rounded-full transition-all duration-300" 
              style={{ width: `${((step - 1) / 3) * 100}%` }} 
            />
            {[1, 2, 3, 4].map(num => (
              <div key={num} className={`relative z-10 w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium border-2 transition-colors ${step >= num ? 'bg-neutral-900 border-neutral-900 text-white' : 'bg-white border-neutral-300 text-neutral-400'}`}>
                {step > num ? <Check className="w-4 h-4" /> : num}
              </div>
            ))}
          </div>

          {error && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

          <div className="space-y-6">
            {step === 1 && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-lg font-medium text-neutral-900 mb-4">1. Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Startup Name</label>
                    <input type="text" name="startup_name" value={formData.startup_name} onChange={handleChange} required className="w-full mt-1 px-3 py-2 border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 rounded-md shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Category</label>
                    <select name="category" value={formData.category} onChange={handleChange} required className="w-full mt-1 px-3 py-2 border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 rounded-md shadow-sm">
                      <option value="">Select a category...</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Team Size</label>
                    <select name="team_size" value={formData.team_size} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 rounded-md shadow-sm">
                      <option value="1-10">1-10</option>
                      <option value="11-50">11-50</option>
                      <option value="51-200">51-200</option>
                      <option value="201+">201+</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-lg font-medium text-neutral-900 mb-4">2. Product Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Product Description</label>
                    <textarea name="product_description" value={formData.product_description} onChange={handleChange} rows={3} required className="w-full mt-1 px-3 py-2 border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 rounded-md shadow-sm" placeholder="What does your product do?"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Product Stage</label>
                    <select name="product_stage" value={formData.product_stage} onChange={handleChange} required className="w-full mt-1 px-3 py-2 border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 rounded-md shadow-sm">
                      <option value="">Select a stage...</option>
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-lg font-medium text-neutral-900 mb-4">3. Business Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Target Audience</label>
                    <textarea name="target_audience" value={formData.target_audience} onChange={handleChange} rows={2} required className="w-full mt-1 px-3 py-2 border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 rounded-md shadow-sm" placeholder="Who is your ideal customer?"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Revenue Model</label>
                    <select name="revenue_model" value={formData.revenue_model} onChange={handleChange} required className="w-full mt-1 px-3 py-2 border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 rounded-md shadow-sm">
                      <option value="">Select a model...</option>
                      {REVENUE_MODELS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-lg font-medium text-neutral-900 mb-4">4. Primary Goals</h3>
                <p className="text-sm text-neutral-500 mb-4">Select the main objectives you want Castly to help you with.</p>
                <div className="space-y-3">
                  {GOAL_OPTIONS.map(goal => (
                    <label key={goal} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${formData.primary_goals.includes(goal) ? 'bg-neutral-50 border-neutral-900 shadow-sm' : 'hover:bg-neutral-50 border-neutral-200'}`}>
                      <input type="checkbox" className="w-4 h-4 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-900" checked={formData.primary_goals.includes(goal)} onChange={() => toggleGoal(goal)} />
                      <span className="ml-3 font-medium text-neutral-900 text-sm">{goal}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-between pt-6 border-t border-neutral-100">
            {step > 1 ? (
              <button type="button" onClick={handlePrev} className="flex items-center px-4 py-2 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </button>
            ) : <div />}
            
            {step < 4 ? (
              <button 
                type="button" 
                onClick={handleNext} 
                className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50"
                disabled={
                  (step === 1 && (!formData.startup_name || !formData.category)) ||
                  (step === 2 && (!formData.product_description || !formData.product_stage)) ||
                  (step === 3 && (!formData.target_audience || !formData.revenue_model))
                }
              >
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button 
                type="button" 
                onClick={handleSubmit}
                disabled={loading || formData.primary_goals.length === 0}
                className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <><Check className="w-4 h-4 mr-2" /> Complete</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
