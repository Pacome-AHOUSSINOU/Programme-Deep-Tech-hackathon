import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Cog, AlertTriangle, Package, TrendingUp, Activity, Clock } from 'lucide-react';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed'];

function StatCard({ icon: Icon, label, value, sub, color = 'blue' }) {
  const colors = { blue: 'bg-blue-600', green: 'bg-green-600', orange: 'bg-orange-500', red: 'bg-red-600' };
  return (
    <div className="card flex items-start gap-4">
      <div className={`${colors[color]} p-3 rounded-lg`}><Icon size={20} className="text-white" /></div>
      <div>
        <div className="text-2xl font-bold text-white">{value ?? '–'}</div>
        <div className="text-slate-400 text-sm">{label}</div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/dashboard/stats'), api.get('/dashboard/activity')])
      .then(([s, a]) => { setStats(s.data); setActivity(a.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <span className="text-sm text-slate-400">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Cog} label="Équipements" value={stats?.equipment?.total} sub={`${stats?.equipment?.operational} opérationnels`} color="blue" />
        <StatCard icon={AlertTriangle} label="Pannes actives" value={stats?.breakdowns?.active} sub={`${stats?.breakdowns?.total} total`} color="orange" />
        <StatCard icon={Package} label="Pièces en attente" value={stats?.spare_parts?.pending} sub={`${stats?.spare_parts?.total} demandes`} color="red" />
        <StatCard icon={TrendingUp} label="Pannes résolues" value={stats?.breakdowns?.resolved} color="green" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown trend */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Activity size={16} /> Tendance des pannes (6 mois)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats?.breakdown_trend?.map(d => ({ month: new Date(d.month).toLocaleDateString('fr-FR', { month: 'short' }), count: parseInt(d.count) }))}>
              <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Severity pie */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Pannes par gravité</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={stats?.breakdown_by_severity?.map(d => ({ name: d.severity, value: parseInt(d.count) }))} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                {stats?.breakdown_by_severity?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {stats?.breakdown_by_severity?.map((d, i) => (
              <span key={d.severity} className="text-xs text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />
                {d.severity} ({d.count})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Top failing + most requested */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Équipements les plus défaillants</h3>
          <div className="space-y-3">
            {stats?.top_failing_equipment?.length === 0 && <p className="text-slate-500 text-sm">Aucune donnée</p>}
            {stats?.top_failing_equipment?.map((e, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">{e.name}</span>
                <span className="badge bg-red-900 text-red-300">{e.breakdown_count} pannes</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Pièces les plus demandées</h3>
          <div className="space-y-3">
            {stats?.most_requested_parts?.length === 0 && <p className="text-slate-500 text-sm">Aucune donnée</p>}
            {stats?.most_requested_parts?.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">{p.part_name}</span>
                <span className="badge bg-blue-900 text-blue-300">{p.request_count}x</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2"><Clock size={16} /> Pannes récentes</h3>
            <Link to="/breakdowns" className="text-sm text-blue-400 hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-3">
            {activity?.recent_breakdowns?.map(b => (
              <Link key={b.id} to={`/breakdowns/${b.id}`} className="flex items-center justify-between hover:bg-slate-700 rounded-lg p-2 transition-colors">
                <div>
                  <div className="text-sm text-white">{b.title}</div>
                  <div className="text-xs text-slate-400">{b.equipment_name}</div>
                </div>
                <span className={`severity-${b.severity}`}>{b.severity}</span>
              </Link>
            ))}
            {!activity?.recent_breakdowns?.length && <p className="text-slate-500 text-sm">Aucune panne récente</p>}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2"><Package size={16} /> Demandes récentes</h3>
            <Link to="/spare-parts" className="text-sm text-blue-400 hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-3">
            {activity?.recent_parts?.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2">
                <div>
                  <div className="text-sm text-white">{p.part_name}</div>
                  <div className="text-xs text-slate-400">{p.equipment_name}</div>
                </div>
                <span className={`badge ${p.urgency === 'urgent' ? 'bg-red-900 text-red-300' : 'bg-slate-700 text-slate-400'}`}>{p.urgency}</span>
              </div>
            ))}
            {!activity?.recent_parts?.length && <p className="text-slate-500 text-sm">Aucune demande récente</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
