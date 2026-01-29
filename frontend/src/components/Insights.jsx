import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { Users, Briefcase, CheckCircle, TrendingUp } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function Insights({ candidates, jobs }) {

    const stats = useMemo(() => {
        const total = candidates.length;
        const byRole = {};
        const byStatus = {};
        const skillCounts = {};

        candidates.forEach(c => {
            // Role
            const role = c.role || "Unclassified";
            byRole[role] = (byRole[role] || 0) + 1;

            // Status
            byStatus[c.status] = (byStatus[c.status] || 0) + 1;

            // Skills
            c.skills?.forEach(s => {
                skillCounts[s] = (skillCounts[s] || 0) + 1;
            });
        });

        const roleData = Object.entries(byRole).map(([name, value]) => ({ name, value }));
        const statusData = Object.entries(byStatus).map(([name, value]) => ({ name, value }));
        const topSkills = Object.entries(skillCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, value]) => ({ name, value }));

        return { total, roleData, statusData, topSkills };
    }, [candidates]);

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                <header>
                    <h1 className="text-3xl font-bold text-slate-800">Recruitment Insights</h1>
                    <p className="text-slate-500 mt-2">Executive summary of candidate pipeline and talent distribution.</p>
                </header>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard icon={<Users className="text-blue-600" />} label="Total Candidates" value={stats.total} color="bg-blue-50" />
                    <StatCard icon={<Briefcase className="text-emerald-600" />} label="Active Roles" value={jobs.length} color="bg-emerald-50" />
                    <StatCard icon={<CheckCircle className="text-purple-600" />} label="Hired" value={stats.statusData.find(d => d.name === 'Hired')?.value || 0} color="bg-purple-50" />
                    <StatCard icon={<TrendingUp className="text-amber-600" />} label="In Pipeline" value={stats.total - (stats.statusData.find(d => d.name === 'Hired')?.value || 0) - (stats.statusData.find(d => d.name === 'Rejected')?.value || 0)} color="bg-amber-50" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Role Distribution Chart */}
                    <ChartContainer title="Candidate Distribution by Role">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.roleData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>

                    {/* Status Pipeline Chart */}
                    <ChartContainer title="Recruitment Funnel Status">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stats.statusData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>

                    {/* Top Skills Chart */}
                    <ChartContainer title="Top Extracted Skills" className="lg:col-span-2">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.topSkills}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>

                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
            </div>
        </div>
    );
}

function ChartContainer({ title, children, className = "" }) {
    return (
        <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ${className}`}>
            <h3 className="text-lg font-bold text-slate-800 mb-6">{title}</h3>
            {children}
        </div>
    );
}
