import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sessionsAPI } from '../services/api';
import { VideoCameraIcon, PlayCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await sessionsAPI.getAll();
      setSessions(res.data.data.sessions || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-neutral-900">Sessions</h1>
        <p className="text-neutral-600 mt-1">Your past and upcoming video sessions</p>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-neutral-200 rounded w-32 mb-2" />
              <div className="h-3 bg-neutral-200 rounded w-48" />
            </div>
          ))}
        </div>
      ) : sessions.length > 0 ? (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <div key={session.session_id} className="card p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center">
                  <VideoCameraIcon className="w-7 h-7 text-primary-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900">{session.subject_name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      {new Date(session.start_time).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <Link
                  to={`/dashboard/session/${session.session_id}`}
                  className="btn-primary btn-sm flex items-center gap-2"
                >
                  <PlayCircleIcon className="w-4 h-4" />
                  View Session
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <VideoCameraIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">No sessions yet</h3>
          <p className="text-neutral-600">Book your first session to get started.</p>
        </div>
      )}
    </div>
  );
}

export default SessionsPage;
