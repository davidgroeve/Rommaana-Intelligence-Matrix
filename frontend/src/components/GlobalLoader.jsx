import { ShieldCheck, Cpu, Zap, Search } from 'lucide-react';

export function GlobalLoader() {
    return (
        <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-slate-950 overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-cyber-dots opacity-20" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />

            {/* Central Scanning Core */}
            <div className="relative mb-12">
                <div className="w-32 h-32 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden group">
                    {/* Scanning Line */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_15px_rgba(var(--primary),0.8)] animate-scan" />

                    <Cpu className="w-16 h-16 text-primary group-hover:scale-110 transition-transform duration-700" />

                    {/* Corner Decals */}
                    <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-primary/40" />
                    <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-primary/40" />
                    <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-primary/40" />
                    <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-primary/40" />
                </div>

                {/* Orbital Rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/5 rounded-full animate-spin-slow" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-primary/10 rounded-full animate-reverse-spin" />
            </div>

            {/* Loading Status */}
            <div className="text-center space-y-6 relative z-10">
                <div className="flex flex-col items-center">
                    <h2 className="text-2xl font-black text-white tracking-[0.3em] uppercase mb-2 animate-pulse">Initializing Matrix</h2>
                    <div className="flex items-center gap-4 text-primary/60">
                        <span className="h-[1px] w-12 bg-primary/20" />
                        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Syncing Intelligence v2.1</p>
                        <span className="h-[1px] w-12 bg-primary/20" />
                    </div>
                </div>

                {/* Tactical Info Stream */}
                <div className="flex gap-8 justify-center">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-white/30 uppercase tracking-widest">
                        <Search className="w-3 h-3 text-primary/40" /> Indexing PDFs
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-bold text-white/30 uppercase tracking-widest">
                        <ShieldCheck className="w-3 h-3 text-primary/40" /> Verification
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-bold text-white/30 uppercase tracking-widest">
                        <Zap className="w-3 h-3 text-primary/40" /> Cold Storage Caching
                    </div>
                </div>
            </div>
        </div>
    );
}
