import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Upload, X } from 'lucide-react';

const CATEGORIES = ['Électrique', 'Hydraulique', 'Mécanique', 'Pneumatique', 'Électronique', 'Autre'];

export default function BreakdownForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [equipment, setEquipment] = useState([]);
  const [form, setForm] = useState({ equipment_id: searchParams.get('equipment_id') || '', title: '', description: '', severity: 'medium', category: '' });
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/equipment').then(r => setEquipment(r.data)); }, []);

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files).slice(0, 5 - photos.length);
    setPhotos(p => [...p, ...files]);
    setPreviews(p => [...p, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removePhoto = (i) => {
    setPhotos(p => p.filter((_, idx) => idx !== i));
    setPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      photos.forEach(p => fd.append('photos', p));
      await api.post('/breakdowns', fd);
      toast.success('Panne déclarée !');
      navigate('/breakdowns');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally { setLoading(false); }
  };

  const f = (k) => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) });

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-white">Déclarer une panne</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Équipement *</label>
          <select className="input" required {...f('equipment_id')}>
            <option value="">Sélectionner un équipement</option>
            {equipment.map(e => <option key={e.id} value={e.id}>{e.name} ({e.location})</option>)}
          </select>
        </div>
        <div>
          <label className="label">Titre *</label>
          <input className="input" required placeholder="Ex: Fuite hydraulique détectée" {...f('title')} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={4} placeholder="Décrivez le problème en détail..." {...f('description')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Gravité *</label>
            <select className="input" {...f('severity')}>
              <option value="low">Faible</option>
              <option value="medium">Moyen</option>
              <option value="high">Élevé</option>
              <option value="critical">Critique</option>
            </select>
          </div>
          <div>
            <label className="label">Catégorie</label>
            <select className="input" {...f('category')}>
              <option value="">Sélectionner</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Photo upload */}
        <div>
          <label className="label">Photos (max 5) — obligatoire recommandé</label>
          <div className="flex flex-wrap gap-3">
            {previews.map((p, i) => (
              <div key={i} className="relative w-20 h-20">
                <img src={p} alt="" className="w-20 h-20 object-cover rounded-lg" />
                <button type="button" onClick={() => removePhoto(i)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"><X size={12} /></button>
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
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Envoi...' : 'Déclarer la panne'}</button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Annuler</button>
        </div>
      </form>
    </div>
  );
}
