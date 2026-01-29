import { useState, useEffect, useMemo } from 'react';
import { User, FileText, AlertCircle, Star, Save, Download, Search, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { api, endpoints } from '../api';

const STATUS_OPTIONS = ["Received", "Screening", "Interview", "Offer", "Hired", "Rejected"];

export function CandidateDetail({ candidate, resumeText, loadingResume, onUpdateFeedback, onUpdateStatus, jobSkills = [] }) {
    const [rating, setRating] = useState(0);
    const [notes, setNotes] = useState("");
    const [status, setStatus] = useState("Received");
    const [investigating, setInvestigating] = useState(false);

    // Reorder skills: Job skills first
    const sortedSkills = useMemo(() => {
        if (!candidate?.skills) return [];
        const skills = [...candidate.skills];
        const jobSkillsLower = jobSkills.map(s => s.toLowerCase());

        return skills.sort((a, b) => {
            const aMatch = jobSkillsLower.includes(a.toLowerCase());
            const bMatch = jobSkillsLower.includes(b.toLowerCase());
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
        });
    }, [candidate?.skills, jobSkills]);

    useEffect(() => {
        if (candidate) {
            if (candidate.feedback) {
                setRating(candidate.feedback.rating || 0);
                setNotes(candidate.feedback.notes || "");
            } else {
                setRating(0);
                setNotes("");
            }
            setStatus(candidate.status || "Received");
        }
    }, [candidate]);

    const handleSaveFeedback = async () => {
        if (!candidate) return;
        try {
            await api.post(endpoints.feedback, {
                candidate_id: candidate.id,
                rating,
                notes
            });
            onUpdateFeedback(); // Notify parent
            alert("Feedback saved!");
        } catch (err) {
            console.error("Failed to save feedback", err);
        }
    };

    const handleStatusChange = async (newStatus) => {
        setStatus(newStatus);
        try {
            await api.put(endpoints.updateStatus(candidate.id), { status: newStatus });
            onUpdateStatus(); // Notify parent
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const handleInvestigate = async () => {
        if (!candidate) return;
        setInvestigating(true);
        try {
            const response = await api.get(endpoints.investigate(candidate.id));
            const newNotes = notes ? `${notes}\n\n${response.data.summary}` : response.data.summary;
            setNotes(newNotes);
            alert("Investigation complete! Results added to notes.");
        } catch (err) {
            console.error("Failed to investigate candidate", err);
            alert("Investigation failed. Please check the backend logs.");
        } finally {
            setInvestigating(false);
        }
    };

    if (!candidate) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-4">
                <User className="w-16 h-16 opacity-20" />
                <p className="text-lg font-medium">Select a candidate to view details</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="glass-morphism border-0 border-b border-border/40 p-10 flex justify-between items-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 transition-all group-hover:bg-primary/10" />

                <div className="relative z-10 flex-1">
                    <div className="flex items-center gap-6">
                        <h2 className="text-5xl font-black text-foreground tracking-tighter leading-none neon-text">
                            {candidate.first_name} <span className="opacity-50">{candidate.last_name}</span>
                        </h2>
                        {candidate.score !== undefined && (
                            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-1">Match Score</span>
                                <div className="text-3xl font-black text-primary leading-none flex items-baseline gap-0.5">
                                    {candidate.score}<span className="text-sm font-bold opacity-50">%</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-6 mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        <span className="flex items-center gap-2 hover:text-primary transition-colors cursor-default"><User className="w-3.5 h-3.5" /> {candidate.working_status}</span>
                        <span className="flex items-center gap-2 text-slate-400">Sub: {new Date(candidate.submission_time).toLocaleDateString()}</span>

                        {/* Status Select */}
                        <div className="relative group/select">
                            <select
                                value={status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className="bg-secondary/80 hover:bg-secondary border border-border/50 rounded-full text-[9px] font-black px-4 py-1.5 cursor-pointer focus:ring-2 focus:ring-primary appearance-none transition-all uppercase tracking-widest"
                            >
                                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    </div>
                    {/* Metadata Chips */}
                    <div className="mt-8 flex gap-3 flex-wrap">
                        <span className="text-[10px] font-black px-4 py-1.5 bg-primary/10 text-primary rounded-full border border-primary/20 uppercase tracking-widest">
                            {candidate.role}
                        </span>
                        {sortedSkills.slice(0, 10).map(skill => {
                            const isMatch = jobSkills.map(s => s.toLowerCase()).includes(skill.toLowerCase());
                            return (
                                <span
                                    key={skill}
                                    className={cn(
                                        "text-[10px] font-bold px-4 py-1.5 rounded-full border uppercase tracking-widest transition-all flex items-center gap-1.5",
                                        isMatch
                                            ? "bg-amber-500/10 text-amber-600 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                                            : "bg-emerald-500/5 text-emerald-600/70 border-emerald-500/20"
                                    )}
                                >
                                    {isMatch && <ShieldCheck className="w-3 h-3 text-amber-500" />}
                                    {skill}
                                </span>
                            );
                        })}
                    </div>
                </div>
                <div className="text-right flex flex-col items-end gap-4 relative z-10">
                    {candidate.local_filename ?
                        <button
                            onClick={async () => {
                                if (!candidate.local_filename) return;
                                try {
                                    const response = await api.get(endpoints.download(candidate.local_filename), { responseType: 'blob' });
                                    const url = window.URL.createObjectURL(new Blob([response.data]));
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', candidate.local_filename);
                                    document.body.appendChild(link);
                                    link.click();
                                    link.remove();
                                } catch (err) {
                                    console.error("Download failed", err);
                                    alert("Download failed");
                                }
                            }}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/20 active:scale-95 group/btn"
                        >
                            <Download className="w-4 h-4 group-hover/btn:animate-bounce" /> Get Dossier
                        </button> :
                        <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-widest border border-destructive/20">
                            <AlertCircle className="w-4 h-4" /> No PDF Data
                        </span>
                    }
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* PDF Text */}
                <div className="flex-1 p-8 overflow-y-auto bg-cyber-dots/30">
                    <div className="glass-morphism rounded-[2rem] p-10 min-h-full border border-border/40 shadow-2xl relative">
                        <div className="absolute top-8 right-8 text-[10px] font-black text-slate-200 uppercase tracking-[0.5em] rotate-90">Extracted_Intel</div>
                        <h3 className="text-sm font-black mb-8 text-slate-400 border-b border-border/40 pb-4 uppercase tracking-[0.2em]">Intelligence Transcript</h3>
                        {loadingResume ? (
                            <div className="space-y-6">
                                <div className="h-5 w-full skeleton" />
                                <div className="h-5 w-[92%] skeleton" />
                                <div className="h-5 w-[85%] skeleton" />
                                <div className="h-5 w-full skeleton" />
                                <div className="h-5 w-[78%] skeleton" />
                                <div className="h-5 w-[95%] skeleton" />
                            </div>
                        ) : (
                            <pre className="whitespace-pre-wrap font-sans text-[13px] text-slate-700 leading-[1.8] max-w-none font-semibold">
                                {resumeText || "No intelligence data found for this candidate profile."}
                            </pre>
                        )}

                        {candidate.local_filename && (
                            <div className="mt-12 pt-8 border-t border-border/20 flex justify-center">
                                <button
                                    onClick={async () => {
                                        try {
                                            const response = await api.get(endpoints.download(candidate.local_filename), { responseType: 'blob' });
                                            const file = new Blob([response.data], { type: 'application/pdf' });
                                            const fileURL = URL.createObjectURL(file);
                                            window.open(fileURL);
                                        } catch (err) {
                                            console.error("View failed", err);
                                            alert("View failed");
                                        }
                                    }}
                                    className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-colors flex items-center gap-2"
                                >
                                    <FileText className="w-4 h-4" /> View Original CV Source
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Feedback Panel */}
                <div className="w-96 glass-morphism border-0 border-l border-border/40 p-10 flex flex-col overflow-y-auto space-y-10">
                    <div>
                        <h3 className="text-xs font-black text-foreground mb-8 flex items-center gap-3 uppercase tracking-[0.2em]">
                            <Star className="w-4 h-4 text-primary fill-primary animate-pulse" /> Assessment Center
                        </h3>

                        <div className="mb-8">
                            <label className="block text-[10px] font-black text-muted-foreground mb-4 uppercase tracking-widest opacity-60">Strategic Rating</label>
                            <div className="flex gap-3 justify-center bg-secondary/30 p-4 rounded-3xl border border-border/20">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className={cn(
                                            "p-1.5 transition-all duration-300 hover:scale-125",
                                            star <= rating ? "text-primary neon-text" : "text-muted opacity-30 hover:opacity-50"
                                        )}
                                    >
                                        <Star className={cn("w-7 h-7", star <= rating && "fill-current")} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Intelligence Notes</label>
                            <textarea
                                className="w-full h-72 p-6 text-sm font-medium rounded-[1.5rem] bg-secondary/30 border border-border/50 focus:ring-2 focus:ring-primary/40 focus:border-primary/50 text-foreground resize-none leading-relaxed transition-all placeholder:opacity-20"
                                placeholder="Enter tactical evaluation notes..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={handleInvestigate}
                            disabled={investigating}
                            className="mt-6 w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-secondary/40 hover:bg-secondary border border-border/50 text-foreground text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 group hover:border-primary/40"
                        >
                            {investigating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <span>Scanning Web Data...</span>
                                </>
                            ) : (
                                <>
                                    <Search className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                    <span>Investigate Candidate</span>
                                </>
                            )}
                        </button>
                    </div>

                    <button
                        onClick={handleSaveFeedback}
                        className="w-full bg-foreground text-background hover:bg-primary hover:text-white p-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 shadow-2xl active:scale-[0.98] flex items-center justify-center gap-3 group"
                    >
                        <Save className="w-4 h-4 transition-transform group-hover:rotate-12" /> Commit Feedback
                    </button>
                </div>
            </div>
        </div>
    );
}
