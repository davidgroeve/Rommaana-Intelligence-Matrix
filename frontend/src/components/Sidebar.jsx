import { Briefcase, Users, Folder, Settings, LayoutGrid, TrendingUp, Download, Sun, Moon } from 'lucide-react';
import { cn } from '../lib/utils';

export function Sidebar({ jobs, jobCounts = {}, selectedJobId, onSelectJob, view, onChangeView, theme, onToggleTheme }) {
    return (
        <div className="w-full flex flex-col bg-transparent z-10 h-full">
            <div className="p-8 border-b border-border/40">
                <div className="mb-2">
                    <img
                        src="https://static.wixstatic.com/media/2dc74f_9ffb3f627ced42538647f70532f450f5~mv2.png/v1/fill/w_590,h_170,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/RommaanaAsset%201.png"
                        alt="Rommaana Logo"
                        className={cn("w-40 h-auto filter transition-all duration-700", theme === 'dark' && "invert grayscale brightness-200")}
                    />
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">

                {/* Main Navigation */}
                <div>
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 block px-2 opacity-50">
                        Interface
                    </label>
                    <div className="space-y-1.5">
                        {[
                            { id: 'candidates', label: 'Candidates', icon: Users },
                            { id: 'jobs', label: 'Job Manager', icon: LayoutGrid },
                            { id: 'insights', label: 'Insights', icon: TrendingUp }
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onChangeView(item.id);
                                    if (item.id === 'candidates') onSelectJob(null);
                                }}
                                className={cn(
                                    "w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-black transition-all duration-300 relative group overflow-hidden",
                                    view === item.id && !selectedJobId
                                        ? "bg-primary text-white shadow-lg shadow-primary/40 ring-1 ring-white/10 scale-[1.02]"
                                        : "text-slate-500 hover:bg-primary/5 hover:text-primary"
                                )}
                            >
                                <item.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", view === item.id && "animate-pulse")} />
                                <span className="relative z-10">{item.label}</span>
                                {view === item.id && !selectedJobId && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Folders (Job Roles) */}
                <div>
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 block px-2 opacity-50">
                        Directories
                    </label>
                    <div className="space-y-1">
                        {jobs.map(job => (
                            <button
                                key={job.id}
                                onClick={() => { onChangeView('candidates'); onSelectJob(job.title); }}
                                className={cn(
                                    "w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-black transition-all group",
                                    selectedJobId === job.title
                                        ? "bg-primary text-white shadow-md shadow-primary/20 border-l-4 border-l-white/30"
                                        : "text-slate-500 hover:bg-primary/5 hover:text-primary"
                                )}
                            >
                                <Folder className={cn("w-4 h-4 shrink-0 transition-colors", selectedJobId === job.title ? "text-white" : "text-primary")} />
                                <span className="truncate flex-1">{job.title}</span>
                                <div className="flex items-center gap-2">
                                    {jobCounts[job.title] > 0 && (
                                        <span className={cn(
                                            "text-[9px] px-2 py-0.5 rounded-full font-black tracking-tighter transition-colors",
                                            selectedJobId === job.title ? "bg-white text-primary" : "bg-muted text-muted-foreground"
                                        )}>
                                            {jobCounts[job.title]}
                                        </span>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.location.href = `http://localhost:8000/api/export?role=${encodeURIComponent(job.title)}`;
                                        }}
                                        className="p-1 px-2 rounded-md transition-all bg-primary/0 hover:bg-primary/10 text-primary opacity-0 group-hover:opacity-100"
                                        title="Export candidates"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </button>
                        ))}
                        <button
                            onClick={() => { onChangeView('candidates'); onSelectJob("Unclassified"); }}
                            className={cn(
                                "w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-black transition-all group",
                                selectedJobId === "Unclassified"
                                    ? "bg-primary text-white shadow-md shadow-primary/20 border-l-4 border-l-white/30"
                                    : "text-slate-500 hover:bg-primary/5 hover:text-primary"
                            )}
                        >
                            <Folder className={cn("w-4 h-4 shrink-0 transition-colors", selectedJobId === "Unclassified" ? "text-white" : "text-primary/40")} />
                            <span className="truncate flex-1">Unclassified</span>
                            <div className="flex items-center gap-2">
                                {jobCounts["Unclassified"] > 0 && (
                                    <span className={cn(
                                        "text-[9px] px-2 py-0.5 rounded-full font-black tracking-tighter transition-colors",
                                        selectedJobId === "Unclassified" ? "bg-white text-primary" : "bg-muted text-muted-foreground"
                                    )}>
                                        {jobCounts["Unclassified"]}
                                    </span>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.location.href = `http://localhost:8000/api/export?role=Unclassified`;
                                    }}
                                    className="p-1 px-2 rounded-md transition-all bg-primary/0 hover:bg-primary/10 text-primary opacity-0 group-hover:opacity-100"
                                    title="Export candidates"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Global Data Export */}
                <div className="pt-2 px-2">
                    <button
                        onClick={() => window.location.href = 'http://localhost:8000/api/export'}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 group"
                    >
                        <Download className="w-4 h-4 transition-transform group-hover:-translate-y-1" /> EXPORT FULL ARCHIVE
                    </button>
                </div>

                {/* Theme Action */}
                <div className="pt-2">
                    <button
                        onClick={onToggleTheme}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-secondary/50 hover:bg-secondary text-foreground rounded-2xl transition-all border border-border/50 group"
                    >
                        <div className="flex items-center gap-3">
                            {theme === 'light' ? <Sun className="w-4 h-4 text-orange-500" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                            <span className="text-xs font-bold uppercase tracking-wider">{theme === 'light' ? 'Day Light' : 'Deep Space'}</span>
                        </div>
                        <div className={cn("w-10 h-5 rounded-full bg-muted relative transition-all", theme === 'dark' && "bg-primary/30")}>
                            <div className={cn(
                                "absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-500",
                                theme === 'light' ? "left-1" : "left-6"
                            )} />
                        </div>
                    </button>
                </div>

            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-border/40">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
                    <Settings className="w-4 h-4" /> CONFIGURATION
                </button>
            </div>
        </div>
    );
}
