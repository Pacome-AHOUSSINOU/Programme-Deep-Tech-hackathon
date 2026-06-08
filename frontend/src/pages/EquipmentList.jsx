import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Plus, Search, Cog, AlertTriangle, CheckCircle } from 'lucide-react';

const STATUS_COLORS = { operational: 'bg-green-900 text-green-300', breakdown: 'bg-red-900 text-red-300', maintenance: 'bg-blue-900 text-blue-300' };
const CATEGORIES = ['CNC', 'Press', 'Hydraulic', 'Pneumatic', 'Electrical', 'Robot', 'Conveyor', 'Other'];

export default function EquipmentList() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: '', status: '' });

  const load = async () => {
    setLoading(true);
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.status) params.status = filters.status;
    const { data } = await api.get('/equipment', { params });
    setEquipment(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filters]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Équipements</h1>
        <Link to="/equipment/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Ajouter
        </Link>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Rechercher..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
        </div>
        <select className="input w-auto" value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
          <option value="">Toutes catégories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input w-auto" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
          <option value="">Tous statuts</option>
          <option value="operational">Opérationnel</option>
          <option value="breakdown">En panne</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : equipment.length === 0 ? (
        <div className="card text-center py-12">
          <Cog size={40} className="text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400">Aucun équipement trouvé</p>
          <Link to="/equipment/new" className="btn-primary inline-flex items-center gap-2 mt-4">
            <Plus size={16} /> Ajouter un équipement
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {equipment.map(eq => (
            <Link key={eq.id} to={`/equipment/${eq.id}`} className="card hover:border-blue-500 transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                    {eq.photo_url ? <img src={eq.photo_url} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <Cog size={20} className="text-slate-400" />}
                  </div>
                  <div>
                    <div className="font-medium text-white">{eq.name}</div>
                    <div className="text-xs text-slate-400">{eq.category} · {eq.brand}</div>
                  </div>
                </div>
                <span className={`badge ${STATUS_COLORS[eq.status] || 'bg-slate-700 text-slate-400'}`}>{eq.status}</span>
              </div>
              <div className="space-y-1 text-xs text-slate-400">
                {eq.serial_number && <div>SN: {eq.serial_number}</div>}
                {eq.location && <div>📍 {eq.location}</div>}
                {eq.last_maintenance && <div>Dernière maintenance: {new Date(eq.last_maintenance).toLocaleDateString('fr-FR')}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
