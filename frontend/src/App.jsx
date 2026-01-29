import { useState, useEffect, useMemo } from 'react';
import { api, endpoints } from './api';
import { Sidebar } from './components/Sidebar';
import { JobManager } from './components/JobManager';
import { FilterBar } from './components/FilterBar';
import { CandidateList } from './components/CandidateList';
import { CandidateDetail } from './components/CandidateDetail';
import { QuickViewModal } from './components/QuickViewModal';
import { GlobalLoader } from './components/GlobalLoader';
import { Insights } from './components/Insights';
import { Search, Star, X, LayoutGrid } from 'lucide-react';
import { cn } from './lib/utils';

function App() {
  const [view, setView] = useState('candidates'); // 'candidates' | 'jobs' | 'insights'
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedJobFolder, setSelectedJobFolder] = useState(null);
  const [activeFilters, setActiveFilters] = useState({ skills: [], locations: [] });
  const [analysisResults, setAnalysisResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [resumeText, setResumeText] = useState("");
  const [loadingResume, setLoadingResume] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [quickViewCandidate, setQuickViewCandidate] = useState(null);

  // Resizable Layout State
  const [sidebarWidth, setSidebarWidth] = useState(260); // px
  const [listWidth, setListWidth] = useState(380); // px
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingList, setIsResizingList] = useState(false);

  const selectedCandidate = useMemo(() => candidates.find(c => c.id === selectedId), [candidates, selectedId]);
  const selectedJob = useMemo(() => jobs.find(j => j.title === selectedCandidate?.role), [jobs, selectedCandidate]);

  useEffect(() => {
    fetchData();
  }, []);

  // Resize Handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingSidebar) {
        const newWidth = Math.max(160, Math.min(480, e.clientX));
        setSidebarWidth(newWidth);
      }
      if (isResizingList) {
        // e.clientX - sidebarWidth is the width of the list part
        const newWidth = Math.max(250, Math.min(600, e.clientX - sidebarWidth));
        setListWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      setIsResizingList(false);
    };

    if (isResizingSidebar || isResizingList) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar, isResizingList, sidebarWidth]);

  useEffect(() => {
    if (selectedId && selectedCandidate) {
      setLoadingResume(true);
      api.get(endpoints.resume(selectedCandidate.id))
        .then(res => setResumeText(res.data.text))
        .catch((err) => {
          console.error("Resume Load Error:", err);
          const status = err.response?.status;
          setResumeText(`Could not load resume text. (Error: ${status || "Network/Timeout"})`);
        })
        .finally(() => setLoadingResume(false));
    }
  }, [selectedId, selectedCandidate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [candRes, jobsRes] = await Promise.all([
        api.get(endpoints.candidates),
        api.get(endpoints.jobs)
      ]);
      setCandidates(candRes.data);
      setJobs(jobsRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
      const detail = err.response?.data?.detail || err.response?.data?.error || "Unknown Error";
      const traceback = err.response?.data?.traceback;
      if (traceback) {
        console.warn("Backend Traceback:", traceback);
      }
      alert(`Critical System Failure: ${detail}\nCheck console for details.`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFilter = (type, value) => {
    setActiveFilters(prev => {
      const current = prev[type];
      const next = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [type]: next };
    });
  };

  // Derive unique filters and job counts from candidate metadata
  const { filterOptions, jobCounts } = useMemo(() => {
    const skills = new Set();
    const locations = new Set();
    const counts = {};

    candidates.forEach(c => {
      c.skills?.forEach(s => skills.add(s));
      c.locations?.forEach(l => locations.add(l));

      const role = c.role || "Unclassified";
      counts[role] = (counts[role] || 0) + 1;
    });

    return {
      filterOptions: {
        skills: Array.from(skills).sort(),
        locations: Array.from(locations).sort()
      },
      jobCounts: counts
    };
  }, [candidates]);

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      // Job Folder Filter
      if (selectedJobFolder) {
        if (selectedJobFolder === "Unclassified") {
          if (c.role && c.role !== "Unclassified") return false;
        } else if (c.role !== selectedJobFolder) return false;
      }
      // Skills Filter (Must match all selected)
      if (activeFilters.skills.length > 0) {
        if (!activeFilters.skills.every(s => c.skills?.includes(s))) return false;
      }
      // Location Filter (Match any selected)
      if (activeFilters.locations.length > 0) {
        if (!activeFilters.locations.some(l => c.locations?.includes(l))) return false;
      }
      // Search Filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
        if (!fullName.includes(search) && !c.email?.toLowerCase().includes(search)) return false;
      }
      return true;
    }).sort((a, b) => {
      const scoreA = analysisResults[a.id]?.score || 0;
      const scoreB = analysisResults[b.id]?.score || 0;
      return scoreB - scoreA;
    });
  }, [candidates, selectedJobFolder, activeFilters, analysisResults, searchTerm]);


  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Skill Categorization Logic for Modal
  const specializedSkills = useMemo(() => {
    const groups = {
      'Core Tech': ['React', 'Node.js', 'Python', 'Javascript', 'TypeScript', 'Java', 'C++', 'Go'],
      'Frontend': ['Tailwind', 'CSS', 'HTML', 'Vue', 'Next.js', 'Redux', 'Framer Motion'],
      'Data & Cloud': ['SQL', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'Firebase', 'MongoDB'],
      'Intelligence': ['Machine Learning', 'AI', 'Neural Networks', 'Data Science', 'PyTorch']
    };

    const categorized = {};
    const assigned = new Set();

    Object.entries(groups).forEach(([name, matches]) => {
      const found = filterOptions.skills.filter(s =>
        matches.some(m => s.toLowerCase().includes(m.toLowerCase()))
      );
      if (found.length > 0) {
        categorized[name] = found;
        found.forEach(s => assigned.add(s));
      }
    });

    const other = filterOptions.skills.filter(s => !assigned.has(s));
    if (other.length > 0) categorized['Other Ops'] = other;

    return categorized;
  }, [filterOptions.skills]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  return (
    <>
      {loading && <GlobalLoader />}
      <div className={`flex h-screen bg-background text-foreground font-sans overflow-hidden select-none transition-colors duration-500`}>
        {/* Dynamic Background Pattern */}
        <div className="fixed inset-0 bg-cyber-dots pointer-events-none opacity-50 z-0" />

        <div style={{ width: sidebarWidth }} className="glass-morphism h-full shrink-0 relative z-10">
          <Sidebar
            jobs={jobs}
            selectedJobId={selectedJobFolder}
            onSelectJob={setSelectedJobFolder}
            view={view}
            onChangeView={setView}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
          {/* Sidebar Resizer Handle */}
          <div
            onMouseDown={() => setIsResizingSidebar(true)}
            className="absolute right-0 top-0 w-1.5 h-full hover:bg-primary/50 transition-all cursor-col-resize z-20 group"
          >
            <div className="w-[1px] h-full bg-border group-hover:bg-primary mx-auto" />
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          {/* Global intelligence Header */}
          <div className="header-glass shrink-0">
            <FilterBar
              filters={filterOptions}
              activeFilters={activeFilters}
              onToggleFilter={handleToggleFilter}
              onClearFilters={() => setActiveFilters({ skills: [], locations: [] })}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onOpenSkills={() => setIsModalOpen(true)}
            />
          </div>

          {view === 'candidates' ? (
            <div className="flex flex-1 overflow-hidden">
              {/* List Panel */}
              <div style={{ width: listWidth }} className="flex flex-col border-r border-border bg-slate-50/50 shrink-0">
                <CandidateList
                  candidates={filteredCandidates}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onQuickView={setQuickViewCandidate}
                  analysisResults={analysisResults}
                  loading={loading}
                />
              </div>

              {/* List Resizer Handle */}
              <div
                onMouseDown={() => setIsResizingList(true)}
                className="w-1 hover:w-1.5 h-full bg-border/20 hover:bg-primary/30 transition-all cursor-col-resize z-20 shrink-0"
              />

              {/* Detail View */}
              <div className="flex-1 overflow-hidden bg-background/20 backdrop-blur-md">
                <CandidateDetail
                  candidate={selectedCandidate}
                  resumeText={resumeText}
                  loadingResume={loadingResume}
                  onUpdateFeedback={fetchData}
                  onUpdateStatus={fetchData}
                  jobSkills={selectedJob?.skills || []}
                />
              </div>
            </div>
          ) : view === 'jobs' ? (
            <JobManager jobs={jobs} onUpdateJob={fetchData} />
          ) : (
            <Insights candidates={candidates} jobs={jobs} />
          )}
        </div>

        {/* Global Intelligence Matrix Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background/40 backdrop-blur-xl animate-fade-in">
            <div className="w-full max-w-4xl max-h-[80vh] bg-card border border-border/50 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative">
              <div className="p-8 border-b border-border/30 flex items-center justify-between bg-primary/5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-primary text-white shadow-lg shadow-primary/30">
                    <LayoutGrid className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-widest text-foreground">Intelligence Matrix</h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Select specialized skills across all categories</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {Object.entries(specializedSkills).map(([category, skills], catIdx) => (
                    <div key={category} className="space-y-4 animate-fade-in-up" style={{ animationDelay: `${catIdx * 100}ms` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-4 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-primary/80">{category}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {skills.map(skill => {
                          const isJobSkill = selectedJob?.skills?.some(s => s.toLowerCase() === skill.toLowerCase());
                          const isCandidateSkill = selectedCandidate?.skills?.some(s => s.toLowerCase() === skill.toLowerCase());
                          const isSelected = activeFilters.skills.includes(skill);

                          let variantClasses = "bg-secondary/40 border-border/40 text-muted-foreground hover:border-primary/40 hover:bg-secondary/60";
                          if (isJobSkill && isCandidateSkill) {
                            variantClasses = "bg-primary text-white border-primary shadow-lg shadow-primary/20";
                          } else if (isJobSkill) {
                            variantClasses = "bg-amber-500/20 text-amber-600 border-amber-500/40 hover:bg-amber-500/30";
                          } else if (isCandidateSkill) {
                            variantClasses = "bg-emerald-500/20 text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/30";
                          } else if (isSelected) {
                            variantClasses = "bg-primary/20 text-primary border-primary shadow-sm";
                          }

                          return (
                            <button
                              key={skill}
                              onClick={() => handleToggleFilter('skills', skill)}
                              className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight border transition-all duration-300",
                                variantClasses
                              )}
                            >
                              {skill}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-border/30 flex justify-end bg-secondary/10">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-4 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl active:scale-95"
                >
                  Confirm Intelligence Index
                </button>
              </div>
            </div>
          </div>
        )}
        {quickViewCandidate && (
          <QuickViewModal
            candidate={quickViewCandidate}
            onClose={() => setQuickViewCandidate(null)}
          />
        )}
      </div>
    </>
  );
}

export default App;
