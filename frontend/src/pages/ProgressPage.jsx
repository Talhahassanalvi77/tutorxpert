import { useState, useEffect } from 'react';
import { progressAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import { ChartBarIcon, AcademicCapIcon, TrophyIcon, FireIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function ProgressPage() {
  const { user } = useAuthStore();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const res = await progressAPI.getProgress(user.userId);
      setProgress(res.data.data);
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-neutral-900">Progress</h1>
        <p className="text-neutral-600 mt-1">Track your learning journey</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <VideoCameraIcon className="w-5 h-5 text-primary-500" />
            </div>
            <span className="text-sm text-neutral-600">Total Sessions</span>
          </div>
          <div className="text-2xl font-bold">{progress?.stats?.total_sessions || 0}</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-accent-500" />
            </div>
            <span className="text-sm text-neutral-600">Hours Learned</span>
          </div>
          <div className="text-2xl font-bold">{progress?.stats?.total_hours || 0}</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-success-100 rounded-xl flex items-center justify-center">
              <FireIcon className="w-5 h-5 text-success-500" />
            </div>
            <span className="text-sm text-neutral-600">Learning Streak</span>
          </div>
          <div className="text-2xl font-bold">{progress?.stats?.learning_streak || 0} days</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <AcademicCapIcon className="w-5 h-5 text-yellow-500" />
            </div>
            <span className="text-sm text-neutral-600">Subjects</span>
          </div>
          <div className="text-2xl font-bold">{progress?.stats?.subjects_learned || 0}</div>
        </div>
      </div>

      {/* Learning Paths */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Learning Paths</h2>
        {progress?.learningPaths?.length > 0 ? (
          <div className="space-y-4">
            {progress.learningPaths.map((path) => (
              <div key={path.path_id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{path.name}</span>
                  <span className="text-sm text-neutral-500">{path.progress_percentage}%</span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${path.progress_percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-500 text-center py-8">No learning paths yet</p>
        )}
      </div>

      {/* Badges */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <TrophyIcon className="w-5 h-5 text-yellow-500" />
          Badges & Achievements
        </h2>
        {progress?.badges?.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {progress.badges.map((badge) => (
              <div key={badge.user_badge_id} className="text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mb-2">
                  <TrophyIcon className="w-8 h-8 text-white" />
                </div>
                <p className="text-xs font-medium text-neutral-900">{badge.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-500 text-center py-8">
            Complete sessions to earn badges!
          </p>
        )}
      </div>
    </div>
  );
}

// Import missing icons
import { VideoCameraIcon, ClockIcon } from '@heroicons/react/24/outline';

export default ProgressPage;
