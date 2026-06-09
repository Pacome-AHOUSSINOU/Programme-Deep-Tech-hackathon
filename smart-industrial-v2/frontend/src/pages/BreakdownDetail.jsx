import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { ChevronRight, Plus, Cpu } from 'lucide-react';

const STEPS = ['declared', 'analysis', 'inspection', 'validation', 'fabrication', 'delivery', 'closed'];
const STEP_LABELS = { declared: 'Déclaré', analysis: 'Analyse', inspection: 'Inspection', validation: 'Validation', fabrication: 'Fabrication', delivery: 'Livraison', closed: 'Clôturé' };
const SEV = { low: 'severity-low', medium: 'severity-medium', high: 'severity-high', critical: 'severity-critical' };

export default function BreakdownDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [diagLoading, setDiagLoading] = useState(false);

  const load = () => {
    api.get(`/breakdowns/${id}`).then(r => setBreakdown(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const nextStep = STEPS[STEPS.indexOf(breakdown?.status) + 1];

  const advanceStatus = async () => {
    if (!nextStep) return;
    setUpdating(true);
    try {
      await api.patch(`/breakdowns/${id}/status`, { status: nextStep, notes });
      setNotes('');
      toast.success(`Statut mis à jour: ${STEP_LABELS[nextStep]}`);
      load();
    } catch { toast.error('Erreur'); } finally { setUpdating(false); }
  };

  const getAIDiagnosis = async () => {
    setDiagLoading(true);
    try {
      // Simulate AI diagnosis (in production, call OpenAI/Gemini)
      const simulated = `Analyse IA: Sur la base de la description "${breakdown.title}" avec gravité ${breakdown.severity}, diagnostic probable: défaillance mécanique/hydraulique nécessitant inspection immédiate. Recommandation: vérifier les joints d'étanchéité, contrôler la pression, remplacer les composants usés. Pièces probables: joint torique Ø50mm, valve de régulation pression 150bar.`;
      await api.patch(`/breakdowns/${id}/diagnosis`, { ai_diagnosis: simulated });
      toast.success('Diagnostic IA généré !');
      load();
    } catch { toast.error('Erreur'); } finally { setDiagLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!breakdown) return <div className="text-center text-slate-400 py-16">Panne introuvable</div>;

  const currentIdx = STEPS.indexOf(breakdown.status);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/breakdowns')} className="text-slate-400 hover:text-white">←</button>
        <h1 className="text-xl font-bold text-white flex-1">{breakdown.title}</h1>
        <span className={SEV[breakdown.severity] || 'badge bg-slate-700'}>{breakdown.severity}</span>
      </div>

      {/* Workflow progress */}
      <div className="card overflow-x-auto">
        <h3 className="font-semibold text-white mb-4">Workflow de suivi</h3>
        <div className="flex items-center gap-1 min-w-max">
          {STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <div className={`flex flex-col items-center gap-1 ${i <= currentIdx ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i < currentIdx ? 'bg-green-600 text-white' : i === currentIdx ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                  {i < currentIdx ? '✓' : i + 1}
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">{STEP_LABELS[step]}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < currentIdx ? 'bg-green-600' : 'bg-slate-700'}`} />}
            </React.Fragment>
          ))}
        </div>
        {nextStep && (
          <div className="mt-4 flex items-center gap-3">
            <input className="input flex-1" placeholder="Notes (optionnel)" value={notes} onChange={e => setNotes(e.target.value)} />
            <button onClick={advanceStatus} disabled={updating} className="btn-primary flex items-center gap-2 whitespace-nowrap">
              <ChevronRight size={16} /> {STEP_LABELS[nextStep]}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Info */}
        <div className="card space-y-3">
          <h3 className="font-semibold text-white">Détails</h3>
          {[['Équipement', breakdown.equipment_name], ['Déclaré par', breakdown.declared_by_name], ['Catégorie', breakdown.category], ['Date', new Date(breakdown.created_at).toLocaleString('fr-FR')]].map(([k, v]) => v ? (
            <div key={k} className="flex justify-between text-sm"><span className="text-slate-400">{k}</span><span className="text-white">{v}</span></div>
          ) : null)}
          {breakdown.description && <div><div className="text-slate-400 text-sm mb-1">Description</div><div className="text-sm text-slate-300 bg-slate-700 rounded-lg p-3">{breakdown.description}</div></div>}
        </div>

        {/* AI Diagnosis */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2"><Cpu size={16} /> Diagnostic IA</h3>
            <button onClick={getAIDiagnosis} disabled={diagLoading} className="btn-secondary text-sm">
              {diagLoading ? 'Analyse...' : 'Analyser'}
            </button>
          </div>
          {breakdown.ai_diagnosis ? (
            <div className="text-sm text-slate-300 bg-blue-900/30 border border-blue-700 rounded-lg p-3">{breakdown.ai_diagnosis}</div>
          ) : (
            <div className="text-sm text-slate-500 text-center py-4">Cliquez sur "Analyser" pour obtenir un diagnostic IA</div>
          )}
        </div>
      </div>

      {/* Photos */}
      {breakdown.photo_urls?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-white mb-3">Preuves visuelles</h3>
          <div className="flex flex-wrap gap-3">
            {breakdown.photo_urls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer">
                <img src={url} alt="" className="w-28 h-28 object-cover rounded-lg hover:opacity-80 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div className="card">
        <h3 className="font-semibold text-white mb-4">Historique des statuts</h3>
        <div className="space-y-3">
          {breakdown.history?.map(h => (
            <div key={h.id} className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
              <div>
                <span className="text-white capitalize font-medium">{STEP_LABELS[h.status] || h.status}</span>
                {h.notes && <span className="text-slate-400"> — {h.notes}</span>}
                <div className="text-xs text-slate-500">{new Date(h.created_at).toLocaleString('fr-FR')} · {h.updated_by_name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spare parts */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Pièces détachées</h3>
          <Link to={`/spare-parts/new?breakdown_id=${id}&equipment_id=${breakdown.equipment_id}`} className="text-sm text-blue-400 hover:underline flex items-center gap-1"><Plus size={14} /> Demander</Link>
        </div>
        {breakdown.spare_parts?.length === 0 ? <p className="text-slate-500 text-sm">Aucune pièce demandée</p> : (
          <div className="space-y-2">
            {breakdown.spare_parts?.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-slate-700 rounded-lg p-3 text-sm">
                <div><div className="text-white">{p.part_name}</div><div className="text-xs text-slate-400">Qté: {p.quantity} · {p.urgency}</div></div>
                <span className="badge bg-slate-600 text-slate-300">{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
