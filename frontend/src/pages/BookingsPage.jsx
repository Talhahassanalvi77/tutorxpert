import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingsAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import { CalendarIcon, ClockIcon, VideoCameraIcon, PlusIcon } from '@heroicons/react/24/outline';

function BookingsPage() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await bookingsAPI.getAll(params);
      setBookings(res.data.data.bookings || []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      confirmed: 'badge-success',
      completed: 'badge-neutral',
      cancelled: 'badge-danger',
    };
    return badges[status] || 'badge-neutral';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-900">Bookings</h1>
          <p className="text-neutral-600 mt-1">Manage your tutoring sessions</p>
        </div>
        <Link to="/tutors" className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          New Booking
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-neutral-200">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              filter === status
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-neutral-200 rounded w-32 mb-2" />
              <div className="h-3 bg-neutral-200 rounded w-48" />
            </div>
          ))}
        </div>
      ) : bookings.length > 0 ? (
        <div className="card divide-y divide-neutral-100">
          {bookings.map((booking) => (
            <div key={booking.booking_id} className="p-6 flex items-center gap-6">
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center">
                <CalendarIcon className="w-7 h-7 text-primary-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900">{booking.subject_name}</h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500">
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    {new Date(booking.scheduled_at).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                  <span>•</span>
                  <span>{booking.duration_minutes} min</span>
                  <span>•</span>
                  <span>${booking.total_amount}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${getStatusBadge(booking.status)}`}>
                  {booking.status}
                </span>
                {booking.status === 'confirmed' && (
                  <Link
                    to={`/dashboard/session/${booking.booking_id}`}
                    className="btn-primary btn-sm flex items-center gap-1"
                  >
                    <VideoCameraIcon className="w-4 h-4" />
                    Join
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <CalendarIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">No bookings found</h3>
          <p className="text-neutral-600 mb-4">
            {filter === 'all' ? "You haven't made any bookings yet." : `No ${filter} bookings.`}
          </p>
          {filter === 'all' && (
            <Link to="/tutors" className="btn-primary">Find a Tutor</Link>
          )}
        </div>
      )}
    </div>
  );
}

export default BookingsPage;
