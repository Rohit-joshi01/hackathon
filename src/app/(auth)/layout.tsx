import { BrainCog } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3 px-4 py-2 bg-surface border border-border-subtle rounded-2xl shadow-lg">
            <BrainCog className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold tracking-tight text-headline">Castly</span>
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-surface/80 backdrop-blur-xl py-10 px-6 shadow-2xl sm:rounded-[32px] sm:px-12 border border-border-subtle overflow-hidden relative group">
          {/* Subtle top light effect */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          
          {children}
        </div>
      </div>
    </div>
  );
}
