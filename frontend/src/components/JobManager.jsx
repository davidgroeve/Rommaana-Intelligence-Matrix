import { useState, useEffect } from 'react';
import { api, endpoints } from '../api';
import { Save, CheckCircle } from 'lucide-react';

export function JobManager({ jobs, onUpdateJob }) {
    const [selectedJob, setSelectedJob] = useState(jobs[0] || null);
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (selectedJob) {
            setDescription(selectedJob.description || "");
        }
    }, [selectedJob]);

    const handleSave = async () => {
        if (!selectedJob) return;
        setSaving(true);
        try {
            await api.put(endpoints.updateJob(selectedJob.id), {
                description,
                skills: selectedJob.skills // sending skills back as is for now
            });
            onUpdateJob(); // Refresh parent job list
            alert("Job updated successfully!");
        } catch (err) {
            console.error("Failed to update job", err);
            alert("Failed to update job.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex h-full bg-slate-50">
            {/* List */}
            <div className="w-1/3 bg-white border-r border-slate-200 overflow-y-auto">
                <div className="p-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800">Job Positions</h2>
                    <p className="text-sm text-slate-500">{jobs.length} Active Roles</p>
                </div>
                <div>
                    {jobs.map(job => (
                        <div
                            key={job.id}
                            onClick={() => setSelectedJob(job)}
                            className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${selectedJob?.id === job.id ? "bg-blue-50 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"}`}
                        >
                            <div className="font-semibold text-slate-800">{job.title}</div>
                            <div className="text-xs text-slate-500 mt-1">{job.location}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 flex flex-col h-full bg-white">
                {selectedJob ? (
                    <>
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">{selectedJob.title}</h2>
                                <span className="text-sm text-slate-500">{selectedJob.location}</span>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {saving ? "Saving..." : <><Save className="w-4 h-4" /> Save Changes</>}
                            </button>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Job Description</label>
                            <textarea
                                className="w-full h-full min-h-[500px] p-4 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/50 focus:border-primary font-mono"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">Select a job to edit</div>
                )}
            </div>
        </div>
    );
}
