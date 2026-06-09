import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Upload, X } from 'lucide-react';

export default function SparePartsForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [equipment, setEquipment] = useState([]);
  const [form, setForm] = useState({
    equipment_id: searchParams.get('equipment_id') || '',
    breakdown_id: searchParams.get('breakdown_id') || '',
    part_name: '', part_reference: '', quantity: 1, urgency: 'normal', description: ''
  });
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/equipment').then(r => setEquipment(r.data)); }, []);

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files).slice(0, 5 - photos.length);
    setPhotos(p => [...p, ...files]);
    setPreviews(p => [...p, ...files.map(f => URL.createObjectURL(f))]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      photos.forEach(p => fd.append('photos', p));
      await api.post('/spare-parts', fd);
      toast.success('Demande envoyée !');
      navigate('/spare-parts');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally { setLoading(false); }
  };

  const f = (k) => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) });

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-white">Demande de pièce détachée</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Équipement *</label>
          <select className="input" required {...f('equipment_id')}>
            <option value="">Sélectionner</option>
            {equipment.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Nom de la pièce *</label>
            <input className="input" required placeholder="Ex: Joint torique Ø50mm" {...f('part_name')} />
          </div>
          <div>
            <label className="label">Référence</label>
            <input className="input" placeholder="REF-001" {...f('part_reference')} />
          </div>
          <div>
            <label className="label">Quantité</label>
            <input className="input" type="number" min="1" {...f('quantity')} />
          </div>
          <div>
            <label className="label">Urgence</label>
            <select className="input" {...f('urgency')}>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="critical">Critique</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Description du besoin</label>
          <textarea className="input" rows={3} placeholder="Détails supplémentaires..." {...f('description')} />
        </div>
        <div>
          <label className="label">Photos de référence (max 5)</label>
          <div className="flex flex-wrap gap-3">
            {previews.map((p, i) => (
              <div key={i} className="relative w-20 h-20">
                <img src={p} alt="" className="w-20 h-20 object-cover rounded-lg" />
                <button type="button" onClick={() => { setPhotos(pr => pr.filter((_,j)=>j!==i)); setPreviews(pr => pr.filter((_,j)=>j!==i)); }} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"><X size={12} /></button>
              </div>
            ))}
            {photos.length < 5 && (
              <label className="w-20 h-20 bg-slate-700 border border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                <Upload size={18} className="text-slate-400" />
                <span className="text-xs text-slate-400 mt-1">Ajouter</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
              </label>
            )}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Envoi...' : 'Soumettre la demande'}</button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Annuler</button>
        </div>
      </form>
    </div>
  );
}
