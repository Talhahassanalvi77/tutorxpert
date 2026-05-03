import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import {
  UsersIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleSolid,
  XCircleIcon as XCircleSolid,
} from '@heroicons/react/24/solid';

function AdminPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userFilter, setUserFilter] = useState('all');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, bookingsRes, revenueRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getAllUsers(),
        adminAPI.getAllBookings(),
        adminAPI.getRevenueReport(),
      ]);

      setStats(statsRes.data.data);
      setUsers(usersRes.data.data.users);
      setBookings(bookingsRes.data.data.bookings);
      setRevenue(revenueRes.data.data);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTutor = async (userId) => {
    try {
      await adminAPI.verifyTutor(userId);
      loadAdminData();
    } catch (error) {
      console.error('Failed to verify tutor:', error);
    }
  };

  const handleSuspendUser = async (userId, isSuspended) => {
    try {
      await adminAPI.suspendUser(userId, !isSuspended);
      loadAdminData();
    } catch (error) {
      console.error('Failed to suspend user:', error);
    }
  };

  const filteredUsers = userFilter === 'all' 
    ? users 
    : users.filter(u => u.role === userFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner spinner-lg mx-auto mb-4" />
          <p className="text-neutral-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
              <p className="text-sm text-neutral-500">Platform management and analytics</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadAdminData}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'bookings'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Bookings
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'revenue'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Revenue
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewTab stats={stats} />}
        {activeTab === 'users' && (
          <UsersTab
            users={filteredUsers}
            userFilter={userFilter}
            setUserFilter={setUserFilter}
            onVerify={handleVerifyTutor}
            onSuspend={handleSuspendUser}
          />
        )}
        {activeTab === 'bookings' && <BookingsTab bookings={bookings} />}
        {activeTab === 'revenue' && <RevenueTab revenue={revenue} />}
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ stats }) {
  if (!stats) return null;

  const statCards = [
    {
      name: 'Total Users',
      value: stats.totalUsers || 0,
      change: stats.userGrowth || 0,
      icon: UsersIcon,
      color: 'blue',
    },
    {
      name: 'Total Bookings',
      value: stats.totalBookings || 0,
      change: stats.bookingGrowth || 0,
      icon: CalendarIcon,
      color: 'green',
    },
    {
      name: 'Total Revenue',
      value: `$${(stats.totalRevenue || 0).toLocaleString()}`,
      change: stats.revenueGrowth || 0,
      icon: CurrencyDollarIcon,
      color: 'purple',
    },
    {
      name: 'Active Tutors',
      value: stats.activeTutors || 0,
      change: stats.tutorGrowth || 0,
      icon: AcademicCapIcon,
      color: 'orange',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500">{stat.name}</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-${stat.color}-50`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-500`} />
              </div>
            </div>
            {stat.change !== undefined && (
              <div className="flex items-center gap-1 mt-4">
                {stat.change >= 0 ? (
                  <ArrowUpIcon className="w-4 h-4 text-green-500" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4 text-red-500" />
                )}
                <span
                  className={`text-sm font-medium ${
                    stat.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {Math.abs(stat.change)}%
                </span>
                <span className="text-sm text-neutral-400">vs last month</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Platform Health */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Platform Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
            <CheckCircleSolid className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-900">System Status</p>
              <p className="text-xs text-green-600">All systems operational</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
            <ChartBarIcon className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-blue-900">Active Sessions</p>
              <p className="text-xs text-blue-600">{stats.activeSessions || 0} now</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
            <ExclamationTriangleIcon className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-900">Pending Reviews</p>
              <p className="text-xs text-amber-600">{stats.pendingReviews || 0} items</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Users Tab
function UsersTab({ users, userFilter, setUserFilter, onVerify, onSuspend }) {
  const filters = [
    { value: 'all', label: 'All Users' },
    { value: 'learner', label: 'Learners' },
    { value: 'tutor', label: 'Tutors' },
    { value: 'admin', label: 'Admins' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
      <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">User Management</h2>
        <div className="flex items-center gap-2">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setUserFilter(filter.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                userFilter === filter.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Verified
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {users.map((user) => (
              <tr key={user.user_id} className="hover:bg-neutral-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=6366f1&color=fff&size=80`}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="text-sm font-medium text-neutral-900">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 text-xs font-medium rounded-full capitalize
                    ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : ''}
                    ${user.role === 'tutor' ? 'bg-blue-100 text-blue-700' : ''}
                    ${user.role === 'learner' ? 'bg-green-100 text-green-700' : ''}
                  ">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.is_suspended ? (
                    <span className="flex items-center gap-1 text-red-600">
                      <XCircleSolid className="w-4 h-4" />
                      Suspended
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircleSolid className="w-4 h-4" />
                      Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.role === 'tutor' ? (
                    user.is_verified ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircleSolid className="w-4 h-4" />
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        Pending
                      </span>
                    )
                  ) : (
                    <span className="text-neutral-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    {user.role === 'tutor' && !user.is_verified && (
                      <button
                        onClick={() => onVerify(user.user_id)}
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        Verify
                      </button>
                    )}
                    <button
                      onClick={() => onSuspend(user.user_id, user.is_suspended)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        user.is_suspended
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                    >
                      {user.is_suspended ? 'Activate' : 'Suspend'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Bookings Tab
function BookingsTab({ bookings }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
      <div className="p-6 border-b border-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-900">All Bookings</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Booking ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Learner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Tutor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Scheduled
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {bookings.map((booking) => (
              <tr key={booking.booking_id} className="hover:bg-neutral-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                  #{booking.booking_id.slice(0, 8)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                  {booking.learner_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                  {booking.tutor_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                  {booking.subject_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                  {new Date(booking.scheduled_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                  ${booking.total_amount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Revenue Tab
function RevenueTab({ revenue }) {
  if (!revenue) return null;

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Total Revenue</p>
          <p className="text-3xl font-bold text-neutral-900 mt-2">
            ${(revenue.totalRevenue || 0).toLocaleString()}
          </p>
          <p className="text-sm text-neutral-400 mt-2">All time</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">This Month</p>
          <p className="text-3xl font-bold text-neutral-900 mt-2">
            ${(revenue.monthlyRevenue || 0).toLocaleString()}
          </p>
          <p className="text-sm text-green-600 mt-2">+{revenue.monthlyGrowth || 0}% from last month</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Platform Fees</p>
          <p className="text-3xl font-bold text-neutral-900 mt-2">
            ${(revenue.platformFees || 0).toLocaleString()}
          </p>
          <p className="text-sm text-neutral-400 mt-2">Commission earned</p>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Revenue Breakdown</h2>
        <div className="space-y-4">
          {revenue.revenueBySubject?.map((item) => (
            <div key={item.subject_name} className="flex items-center justify-between py-3 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <span className="text-lg">{item.subject_icon || '📚'}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{item.subject_name}</p>
                  <p className="text-xs text-neutral-500">{item.total_bookings} bookings</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-neutral-900">
                ${(item.total_revenue || 0).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
