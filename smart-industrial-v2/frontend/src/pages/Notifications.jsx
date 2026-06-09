import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Bell, CheckCheck } from 'lucide-react';

const TYPE_COLORS = { breakdown: 'bg-red-900 text-red-300', status_change: 'bg-blue-900 text-blue-300', spare_part: 'bg-yellow-900 text-yellow-300' };

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications').then(r => setNotifications(r.data)).finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setNotifications(n => n.map(x => ({ ...x, read: true })));
    toast.success('Tout marqué comme lu');
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Notifications {unread > 0 && <span className="ml-2 badge bg-red-600 text-white">{unread}</span>}</h1>
        {unread > 0 && (
          <button onClick={markAllRead} className="btn-secondary flex items-center gap-2 text-sm">
            <CheckCheck size={16} /> Tout marquer lu
          </button>
        )}
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        : notifications.length === 0 ? (
          <div className="card text-center py-12">
            <Bell size={40} className="text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">Aucune notification</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={`card cursor-pointer transition-all ${n.read ? 'opacity-60' : 'border-blue-600 hover:border-blue-400'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />}
                    <div>
                      <div className="font-medium text-white text-sm">{n.title}</div>
                      <div className="text-sm text-slate-400 mt-0.5">{n.message}</div>
                      <div className="text-xs text-slate-500 mt-1">{new Date(n.created_at).toLocaleString('fr-FR')}</div>
                    </div>
                  </div>
                  <span className={`badge ${TYPE_COLORS[n.type] || 'bg-slate-700 text-slate-400'} ml-2 flex-shrink-0`}>{n.type?.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
