import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Upload, X } from 'lucide-react';

const CATEGORIES = ['CNC', 'Press', 'Hydraulic', 'Pneumatic', 'Electrical', 'Robot', 'Conveyor', 'Other'];

export default function EquipmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', category: '', serial_number: '', brand: '', model: '', location: '', status: 'operational', purchase_date: '' });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      api.get(`/equipment/${id}`).then(r => {
        const eq = r.data;
        setForm({ name: eq.name, category: eq.category || '', serial_number: eq.serial_number || '', brand: eq.brand || '', model: eq.model || '', location: eq.location || '', status: eq.status, purchase_date: eq.purchase_date ? eq.purchase_date.slice(0, 10) : '' });
        if (eq.photo_url) setPreview(eq.photo_url);
      });
    }
  }, [id]);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append('photo', photo);
      if (id) await api.put(`/equipment/${id}`, fd);
      else await api.post('/equipment', fd);
      toast.success(id ? 'Équipement mis à jour !' : 'Équipement ajouté !');
      navigate('/equipment');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally { setLoading(false); }
  };

  const f = (k) => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) });

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-white">{id ? 'Modifier' : 'Ajouter'} un équipement</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        {/* Photo */}
        <div>
          <label className="label">Photo</label>
          <div className="flex items-center gap-4">
            <label className="w-24 h-24 bg-slate-700 border border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
              {preview ? <img src={preview} alt="" className="w-24 h-24 object-cover rounded-lg" /> : <><Upload size={20} className="text-slate-400" /><span className="text-xs text-slate-400 mt-1">Photo</span></>}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
            {preview && <button type="button" onClick={() => { setPhoto(null); setPreview(null); }} className="text-slate-400 hover:text-red-400"><X size={18} /></button>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nom *</label>
            <input className="input" required {...f('name')} />
          </div>
          <div>
            <label className="label">Catégorie</label>
            <select className="input" {...f('category')}>
              <option value="">Sélectionner</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Statut</label>
            <select className="input" {...f('status')}>
              <option value="operational">Opérationnel</option>
              <option value="maintenance">Maintenance</option>
              <option value="breakdown">En panne</option>
            </select>
          </div>
          <div>
            <label className="label">Marque</label>
            <input className="input" {...f('brand')} />
          </div>
          <div>
            <label className="label">Modèle</label>
            <input className="input" {...f('model')} />
          </div>
          <div>
            <label className="label">Numéro de série</label>
            <input className="input" {...f('serial_number')} />
          </div>
          <div>
            <label className="label">Localisation</label>
            <input className="input" {...f('location')} />
          </div>
          <div>
            <label className="label">Date d'achat</label>
            <input className="input" type="date" {...f('purchase_date')} />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/equipment')}>Annuler</button>
        </div>
      </form>
    </div>
  );
}
