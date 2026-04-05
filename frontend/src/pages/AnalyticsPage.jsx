import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function AnalyticsPage() {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      if (!user?.userId) {
        console.error('No user ID found');
        return;
      }
      const res = await analyticsAPI.getUser(user.userId);
      setAnalytics(res.data.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
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
        <h1 className="text-2xl font-bold font-display text-neutral-900">Analytics</h1>
        <p className="text-neutral-600 mt-1">Insights into your learning/teaching performance</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="text-sm text-neutral-600 mb-2">Total Sessions</div>
          <div className="text-3xl font-bold">{analytics?.stats?.total_sessions || 0}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-neutral-600 mb-2">Total Hours</div>
          <div className="text-3xl font-bold">{analytics?.stats?.total_hours || 0}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-neutral-600 mb-2">Avg Rating</div>
          <div className="text-3xl font-bold">{analytics?.stats?.rating || '0.0'}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-neutral-600 mb-2">Response Rate</div>
          <div className="text-3xl font-bold">{analytics?.stats?.response_rate || 0}%</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Activity Over Time</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analytics?.activityOverTime || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sessions" stroke="#0ea5e9" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Distribution */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Subject Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics?.subjectDistribution || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sessions" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
