import { X, User, MapPin, Code, Globe, Calendar, Mail, Phone, Briefcase } from 'lucide-react';
import { cn } from '../lib/utils';

export function QuickViewModal({ candidate, onClose }) {
    if (!candidate) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-4xl bg-white/10 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">

                {/* Header Section */}
                <div className="p-8 md:p-12 bg-gradient-to-br from-primary/10 to-transparent border-b border-white/10 relative shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                    >
                        <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform" />
                    </button>

                    <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-10">
                        <div className="w-24 h-24 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                            <User className="w-12 h-12 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80">Candidate Profile</span>
                            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight font-outfit">
                                {candidate.first_name} <span className="text-white/40">{candidate.last_name}</span>
                            </h2>
                            <div className="flex flex-wrap gap-4 pt-2">
                                <span className="flex items-center gap-2 text-[11px] font-bold text-white/60 uppercase tracking-widest border border-white/10 px-3 py-1 rounded-full bg-white/5">
                                    <Mail className="w-3.5 h-3.5" /> {candidate.email}
                                </span>
                                {candidate.phone && (
                                    <span className="flex items-center gap-2 text-[11px] font-bold text-white/60 uppercase tracking-widest border border-white/10 px-3 py-1 rounded-full bg-white/5">
                                        <Phone className="w-3.5 h-3.5" /> {candidate.phone}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 bg-slate-950/20">

                    {/* Role & Status Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-3">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                                <Briefcase className="w-3.5 h-3.5" /> Target Role
                            </span>
                            <p className="text-lg font-black text-white">{candidate.role || "Unclassified"}</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-3">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5" /> Work Status
                            </span>
                            <p className="text-lg font-black text-white">{candidate.working_status || "Not Specified"}</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-3">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" /> Applied On
                            </span>
                            <p className="text-lg font-black text-white">
                                {new Date(candidate.submission_time).toLocaleDateString(undefined, { dateStyle: 'long' })}
                            </p>
                        </div>
                    </div>

                    {/* Skills & Locations Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Skills */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-3 border-b border-white/5 pb-4">
                                <Code className="w-4 h-4 text-primary" /> Intelligence Matrix [Skills]
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {candidate.skills?.map(skill => (
                                    <span key={skill} className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all">
                                        {skill}
                                    </span>
                                ))}
                                {(!candidate.skills || candidate.skills.length === 0) && (
                                    <span className="text-[11px] font-bold text-white/20 italic">No specific technological skills indexed.</span>
                                )}
                            </div>
                        </div>

                        {/* Locations & Languages */}
                        <div className="space-y-12">
                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-3 border-b border-white/5 pb-4">
                                    <MapPin className="w-4 h-4 text-primary" /> Geographical Vectors
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {candidate.locations?.map(loc => (
                                        <span key={loc} className="px-4 py-2 bg-white/5 text-white/80 border border-white/10 rounded-xl text-[11px] font-black uppercase tracking-widest">
                                            {loc}
                                        </span>
                                    ))}
                                    {(!candidate.locations || candidate.locations.length === 0) && (
                                        <span className="text-[11px] font-bold text-white/20 italic">No location preferences detected.</span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-3 border-b border-white/5 pb-4">
                                    <Globe className="w-4 h-4 text-primary" /> Linguistical Assets
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {candidate.languages?.map(lang => (
                                        <span key={lang} className="px-4 py-2 bg-white/5 text-white/80 border border-white/10 rounded-xl text-[11px] font-black uppercase tracking-widest">
                                            {lang}
                                        </span>
                                    ))}
                                    {(!candidate.languages || candidate.languages.length === 0) && (
                                        <span className="text-[11px] font-bold text-white/20 italic">Primary indexing language only.</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action Area */}
                <div className="p-8 bg-black/40 border-t border-white/10 flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="px-10 py-4 bg-white text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all shadow-xl active:scale-95"
                    >
                        Close Dossier Preview
                    </button>
                </div>
            </div>
        </div>
    );
}
