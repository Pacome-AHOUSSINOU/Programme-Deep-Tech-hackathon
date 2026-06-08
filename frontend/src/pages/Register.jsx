import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Cog } from 'lucide-react';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ companyName: '', industry: '', name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.token, data.user);
      navigate('/');
      toast.success('Compte créé avec succès !');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'inscription');
    } finally { setLoading(false); }
  };

  const f = (k) => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Cog size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Créer un compte</h1>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Entreprise *</label>
                <input className="input" placeholder="TechCorp" required {...f('companyName')} />
              </div>
              <div>
                <label className="label">Secteur</label>
                <input className="input" placeholder="Industrie" {...f('industry')} />
              </div>
            </div>
            <div>
              <label className="label">Votre nom *</label>
              <input className="input" placeholder="Jean Dupont" required {...f('name')} />
            </div>
            <div>
              <label className="label">Email *</label>
              <input className="input" type="email" required {...f('email')} />
            </div>
            <div>
              <label className="label">Mot de passe *</label>
              <input className="input" type="password" required {...f('password')} />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Création...' : 'Créer le compte'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-400 mt-4">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-blue-400 hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
