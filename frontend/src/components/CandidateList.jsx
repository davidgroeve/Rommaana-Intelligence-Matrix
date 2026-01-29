import { CheckCircle, Search } from 'lucide-react';
import { cn } from '../lib/utils';

export function CandidateList({ candidates, selectedId, onSelect, onQuickView, analysisResults, loading }) {
    if (loading) {
        return (
            <div className="flex-1 overflow-y-auto">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="p-4 border-b border-slate-100 animate-pulse">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="h-5 w-32 skeleton mb-2" />
                                <div className="h-3 w-48 skeleton mb-4" />
                                <div className="flex gap-2">
                                    <div className="h-4 w-16 skeleton" />
                                    <div className="h-4 w-16 skeleton" />
                                </div>
                            </div>
                            <div className="h-10 w-10 skeleton" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto space-y-1 p-2">
            {candidates.map(c => {
                const result = analysisResults[c.id];
                const hasFeedback = !!c.feedback;
                const statusColors = {
                    "Received": "bg-slate-100 text-slate-600 border-slate-200",
                    "Screening": "bg-blue-600/10 text-blue-600 border-blue-600/20",
                    "Interview": "bg-amber-600/10 text-amber-600 border-amber-600/20",
                    "Offer": "bg-purple-600/10 text-purple-600 border-purple-600/20",
                    "Hired": "bg-green-600/10 text-green-600 border-green-600/20",
                    "Rejected": "bg-red-600/10 text-red-600 border-red-600/20",
                };

                return (
                    <div
                        key={c.id}
                        onClick={() => onSelect(c.id)}
                        className={cn(
                            "p-4 rounded-xl cursor-pointer transition-all duration-300 group relative border shadow-sm",
                            selectedId === c.id
                                ? "bg-primary/5 border-primary/50 neon-border scale-[0.98]"
                                : "bg-white border-border/50 hover:bg-slate-50 hover:border-border hover:shadow-md"
                        )}
                    >
                        <div className="flex justify-between items-start relative z-10">
                            <div className="max-w-[75%]">
                                <div className="flex items-center gap-2">
                                    <h3 className={cn(
                                        "text-[13px] font-black leading-tight tracking-tight transition-all",
                                        selectedId === c.id ? "text-primary" : "text-slate-900 group-hover:text-primary"
                                    )}>
                                        {c.first_name} {c.last_name}
                                    </h3>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onQuickView(c);
                                        }}
                                        className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/50 text-slate-400 hover:text-primary hover:bg-primary/5 transition-all group/mag"
                                        title="Tactical Overview"
                                    >
                                        <Search className="w-3 h-3 group-hover/mag:scale-110" />
                                    </button>
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 truncate mt-1.5 uppercase tracking-widest">{c.email}</p>
                                <div className="flex gap-2 mt-4">
                                    <span className={cn(
                                        "text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest border",
                                        statusColors[c.status] || statusColors["Received"]
                                    )}>
                                        {c.status}
                                    </span>
                                    {hasFeedback && (
                                        <div className="flex items-center gap-1 text-[9px] text-green-500 font-black uppercase tracking-widest bg-green-500/5 px-2 rounded-full">
                                            <CheckCircle className="w-3 h-3" /> VERIFIED
                                        </div>
                                    )}
                                </div>
                            </div>
                            {(result || c.score !== undefined) && (
                                <div className="flex flex-col items-end">
                                    <div className={cn(
                                        "text-xl font-black leading-none tracking-tighter",
                                        (result?.score || c.score) > 50 ? "text-green-500 neon-text" : (result?.score || c.score) > 20 ? "text-amber-500" : "text-muted-foreground"
                                    )}>
                                        {result?.score || c.score}<span className="text-[10px] font-bold">%</span>
                                    </div>
                                    <div className="w-12 h-1 bg-muted mt-2 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full transition-all duration-1000", (result?.score || c.score) > 50 ? "bg-green-500" : "bg-amber-500")}
                                            style={{ width: `${result?.score || c.score}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
