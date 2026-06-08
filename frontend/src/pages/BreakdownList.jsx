import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Plus, AlertTriangle } from 'lucide-react';

const SEVERITY = { low: 'severity-low', medium: 'severity-medium', high: 'severity-high', critical: 'severity-critical' };
const STATUS_STEPS = ['declared', 'analysis', 'inspection', 'validation', 'fabrication', 'delivery', 'closed'];

export default function BreakdownList() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ status: '', severity: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.severity) params.severity = filters.severity;
    api.get('/breakdowns', { params }).then(r => setItems(r.data)).finally(() => setLoading(false));
  }, [filters]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Pannes déclarées</h1>
        <Link to="/breakdowns/new" className="btn-primary flex items-center gap-2"><Plus size={18} /> Déclarer</Link>
      </div>

      <div className="card flex gap-3 flex-wrap">
        <select className="input w-auto" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
          <option value="">Tous statuts</option>
          {STATUS_STEPS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="input w-auto" value={filters.severity} onChange={e => setFilters({ ...filters, severity: e.target.value })}>
          <option value="">Toutes gravités</option>
          <option value="low">Faible</option>
          <option value="medium">Moyen</option>
          <option value="high">Élevé</option>
          <option value="critical">Critique</option>
        </select>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        : items.length === 0 ? (
          <div className="card text-center py-12">
            <AlertTriangle size={40} className="text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">Aucune panne trouvée</p>
            <Link to="/breakdowns/new" className="btn-primary inline-flex items-center gap-2 mt-4"><Plus size={16} /> Déclarer une panne</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(b => (
              <Link key={b.id} to={`/breakdowns/${b.id}`} className="card hover:border-blue-500 transition-colors flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-900 rounded-lg flex items-center justify-center">
                    <AlertTriangle size={18} className="text-red-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{b.title}</div>
                    <div className="text-sm text-slate-400">{b.equipment_name} · {b.declared_by_name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{new Date(b.created_at).toLocaleDateString('fr-FR')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={SEVERITY[b.severity] || 'badge bg-slate-700 text-slate-400'}>{b.severity}</span>
                  <span className="badge bg-slate-700 text-slate-300 capitalize">{b.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}
