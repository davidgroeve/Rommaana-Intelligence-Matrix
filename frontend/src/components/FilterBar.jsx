import { Search, X, Filter, MapPin, Zap, LayoutGrid, Plus, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useMemo } from 'react';

export function FilterBar({ filters, activeFilters, onToggleFilter, onClearFilters, searchTerm, onSearchChange, onOpenSkills }) {
    const totalActive = activeFilters.skills.length + activeFilters.locations.length;

    return (
        <div className="w-full flex items-center gap-6 px-8 py-4 animate-slide-down relative z-50">
            {/* Intel Badge */}
            <div className="flex items-center gap-3 shrink-0">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                    <Zap className="w-4 h-4 text-primary fill-current animate-pulse" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary neon-text">Intelligence</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-50 underline decoration-primary/30">Active Filters</span>
                </div>
            </div>

            {/* Global Search Box */}
            <div className="flex-1 max-w-sm relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-all duration-300" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Scan global candidate index..."
                    className="w-full bg-secondary/20 border border-border/30 rounded-2xl py-3 pl-12 pr-4 text-xs font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-secondary/40 transition-all duration-300 placeholder:opacity-40"
                />
            </div>

            {/* Filter Ribbons */}
            <div className="flex-1 flex items-center gap-4 overflow-x-auto scrollbar-hide no-scrollbar">
                {/* Skills Ribbon (Fixed Preview) */}
                <div className="flex items-center gap-2 border-l border-border/40 pl-6 h-10">
                    {filters.skills.slice(0, 5).map((skill, i) => (
                        <button
                            key={skill}
                            onClick={() => onToggleFilter('skills', skill)}
                            style={{ animationDelay: `${i * 50}ms` }}
                            className={cn(
                                "animate-fade-in-up px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight border transition-all duration-500 whitespace-nowrap",
                                activeFilters.skills.includes(skill)
                                    ? "bg-primary text-white border-primary neon-border shadow-lg shadow-primary/30"
                                    : "bg-secondary/20 border-border/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            )}
                        >
                            {skill}
                        </button>
                    ))}
                    <button
                        onClick={onOpenSkills}
                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight border border-primary/30 text-primary bg-primary/5 hover:bg-primary/20 transition-all duration-300 flex items-center gap-2 group"
                    >
                        <LayoutGrid className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                        More Skills
                    </button>
                </div>

                {/* Locations Ribbon */}
                <div className="flex items-center gap-2 border-l border-border/40 pl-6 h-10">
                    {filters.locations.map((loc, i) => (
                        <button
                            key={loc}
                            onClick={() => onToggleFilter('locations', loc)}
                            style={{ animationDelay: `${(i + 6) * 50}ms` }}
                            className={cn(
                                "animate-fade-in-up px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight border transition-all duration-500 whitespace-nowrap",
                                activeFilters.locations.includes(loc)
                                    ? "bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/30"
                                    : "bg-secondary/20 border-border/30 text-muted-foreground hover:border-green-500/40 hover:text-foreground"
                            )}
                        >
                            <MapPin className="w-3 h-3 inline mr-1" /> {loc}
                        </button>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="shrink-0 flex items-center gap-4 pl-4 border-l border-border/40">
                {totalActive > 0 && (
                    <button
                        onClick={onClearFilters}
                        className="p-2.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white transition-all duration-300 group shadow-lg shadow-destructive/5"
                        title="Purge Intelligence Filters"
                    >
                        <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                    </button>
                )}
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-foreground">ROMMAANA_OS</span>
                    <span className="text-[9px] font-bold text-primary animate-pulse">v2.2.0_LIVE</span>
                </div>
            </div>
        </div>
    );
}
