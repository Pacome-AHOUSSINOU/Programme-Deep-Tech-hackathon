import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { Edit, AlertTriangle, Plus, Cog, Download } from 'lucide-react';

const STATUS_COLORS = { operational: 'bg-green-900 text-green-300', breakdown: 'bg-red-900 text-red-300', maintenance: 'bg-blue-900 text-blue-300' };
const SEVERITY_COLORS = { low: 'bg-green-900 text-green-300', medium: 'bg-yellow-900 text-yellow-300', high: 'bg-orange-900 text-orange-300', critical: 'bg-red-900 text-red-300' };

export default function EquipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [eq, setEq] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/equipment/${id}`).then(r => {
      setEq(r.data);
      QRCode.toDataURL(`${window.location.origin}/equipment/qr/${r.data.qr_code}`, { width: 200 }).then(setQrUrl);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Supprimer cet équipement ?')) return;
    await api.delete(`/equipment/${id}`);
    toast.success('Supprimé');
    navigate('/equipment');
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!eq) return <div className="text-center text-slate-400 py-16">Équipement introuvable</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/equipment')} className="text-slate-400 hover:text-white">←</button>
          <h1 className="text-2xl font-bold text-white">{eq.name}</h1>
          <span className={`badge ${STATUS_COLORS[eq.status] || 'bg-slate-700 text-slate-400'}`}>{eq.status}</span>
        </div>
        <div className="flex gap-2">
          <Link to={`/equipment/${id}/edit`} className="btn-secondary flex items-center gap-2"><Edit size={16} /> Modifier</Link>
          <Link to={`/breakdowns/new?equipment_id=${id}`} className="btn-primary flex items-center gap-2"><AlertTriangle size={16} /> Déclarer panne</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Info card */}
        <div className="lg:col-span-2 card space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
              {eq.photo_url ? <img src={eq.photo_url} alt="" className="w-20 h-20 rounded-xl object-cover" /> : <Cog size={32} className="text-slate-400" />}
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3">
              {[['Catégorie', eq.category], ['Marque', eq.brand], ['Modèle', eq.model], ['N° série', eq.serial_number], ['Localisation', eq.location], ['Date achat', eq.purchase_date ? new Date(eq.purchase_date).toLocaleDateString('fr-FR') : null], ['Dernière maintenance', eq.last_maintenance ? new Date(eq.last_maintenance).toLocaleDateString('fr-FR') : null]].map(([k, v]) => v ? (
                <div key={k}><div className="text-xs text-slate-400">{k}</div><div className="text-sm text-white">{v}</div></div>
              ) : null)}
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="card flex flex-col items-center gap-3">
          <h3 className="font-semibold text-white">QR Code</h3>
          {qrUrl && <img src={qrUrl} alt="QR" className="rounded-lg" />}
          <a href={qrUrl} download={`qr-${eq.name}.png`} className="btn-secondary text-sm flex items-center gap-2">
            <Download size={14} /> Télécharger
          </a>
        </div>
      </div>

      {/* Breakdown history */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Historique des pannes</h3>
          <Link to={`/breakdowns/new?equipment_id=${id}`} className="text-sm text-blue-400 hover:underline flex items-center gap-1"><Plus size={14} /> Déclarer</Link>
        </div>
        {eq.breakdowns?.length === 0 && <p className="text-slate-400 text-sm">Aucune panne enregistrée</p>}
        <div className="space-y-3">
          {eq.breakdowns?.map(b => (
            <Link key={b.id} to={`/breakdowns/${b.id}`} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
              <div>
                <div className="font-medium text-white text-sm">{b.title}</div>
                <div className="text-xs text-slate-400">{new Date(b.created_at).toLocaleDateString('fr-FR')} · {b.declared_by_name}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${SEVERITY_COLORS[b.severity] || ''}`}>{b.severity}</span>
                <span className="badge bg-slate-600 text-slate-300">{b.status}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <button onClick={handleDelete} className="btn-danger text-sm">Supprimer l'équipement</button>
    </div>
  );
}
