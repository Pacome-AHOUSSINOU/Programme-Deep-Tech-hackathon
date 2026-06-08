import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Plus, Package } from 'lucide-react';

const STATUS_STEPS = ['submitted', 'analysis', 'validation', 'sourcing', 'fabrication', 'delivery', 'closed'];
const STATUS_LABELS = { submitted: 'Soumis', analysis: 'Analyse', validation: 'Validation', sourcing: 'Sourcing', fabrication: 'Fabrication', delivery: 'Livraison', closed: 'Clôturé' };

export default function SparePartsList() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ status: '', urgency: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.urgency) params.urgency = filters.urgency;
    api.get('/spare-parts', { params }).then(r => setItems(r.data)).finally(() => setLoading(false));
  }, [filters]);

  const updateStatus = async (id, status) => {
    await api.patch(`/spare-parts/${id}/status`, { status });
    setItems(p => p.map(i => i.id === id ? { ...i, status } : i));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Pièces détachées</h1>
        <Link to="/spare-parts/new" className="btn-primary flex items-center gap-2"><Plus size={18} /> Demander</Link>
      </div>

      <div className="card flex gap-3 flex-wrap">
        <select className="input w-auto" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
          <option value="">Tous statuts</option>
          {STATUS_STEPS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select className="input w-auto" value={filters.urgency} onChange={e => setFilters({ ...filters, urgency: e.target.value })}>
          <option value="">Toutes urgences</option>
          <option value="normal">Normal</option>
          <option value="urgent">Urgent</option>
          <option value="critical">Critique</option>
        </select>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        : items.length === 0 ? (
          <div className="card text-center py-12">
            <Package size={40} className="text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">Aucune demande de pièces</p>
            <Link to="/spare-parts/new" className="btn-primary inline-flex items-center gap-2 mt-4"><Plus size={16} /> Faire une demande</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(p => (
              <div key={p.id} className="card flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center"><Package size={18} className="text-blue-400" /></div>
                  <div>
                    <div className="font-medium text-white">{p.part_name}</div>
                    <div className="text-sm text-slate-400">{p.equipment_name} · Qté: {p.quantity}</div>
                    <div className="text-xs text-slate-500">{new Date(p.created_at).toLocaleDateString('fr-FR')} · {p.requested_by_name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${p.urgency === 'urgent' || p.urgency === 'critical' ? 'bg-red-900 text-red-300' : 'bg-slate-700 text-slate-400'}`}>{p.urgency}</span>
                  <select
                    className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                    value={p.status}
                    onChange={e => updateStatus(p.id, e.target.value)}
                  >
                    {STATUS_STEPS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
