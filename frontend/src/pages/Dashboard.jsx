import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { matchAPI, bookingsAPI } from '../services/api';
import {
  CalendarIcon,
  VideoCameraIcon,
  ChartBarIcon,
  SparklesIcon,
  ClockIcon,
  StarIcon,
  ArrowRightIcon,
  PlayCircleIcon,
  UserGroupIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

function Dashboard() {
  const { user, isTutor, isLearner } = useAuthStore();
  const [matches, setMatches] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      if (isLearner()) {
        const [matchesRes, bookingsRes] = await Promise.all([
          matchAPI.getRecommendations({ limit: 3 }),
          bookingsAPI.getAll({ status: 'confirmed', limit: 3 }),
        ]);
        setMatches(matchesRes.data.data?.matches || []);
        setUpcomingBookings(bookingsRes.data.data?.bookings || []);
      } else if (isTutor()) {
        const bookingsRes = await bookingsAPI.getAll({ type: 'tutor', limit: 5 });
        setUpcomingBookings(bookingsRes.data.data?.bookings || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-primary rounded-3xl p-6 lg:p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <h1 className="text-2xl lg:text-3xl font-bold font-display mb-2">
            {getGreeting()}, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-white/80 mb-6">
            {isLearner()
              ? "Ready to continue your learning journey?"
              : isTutor()
              ? "Here's what's happening with your students."
              : "Welcome to your admin dashboard."}
          </p>
          <div className="flex flex-wrap gap-4">
            {isLearner() && (
              <>
                <Link to="/tutors" className="btn bg-white text-primary-600 hover:bg-neutral-100">
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Find Tutors
                </Link>
                <Link to="/dashboard/bookings" className="btn bg-white/10 hover:bg-white/20 border border-white/30">
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  View Bookings
                </Link>
              </>
            )}
            {isTutor() && (
              <>
                <Link to="/dashboard/tutor-profile" className="btn bg-white text-primary-600 hover:bg-neutral-100">
                  <ChartBarIcon className="w-5 h-5 mr-2" />
                  Update Profile
                </Link>
                <Link to="/dashboard/sessions" className="btn bg-white/10 hover:bg-white/20 border border-white/30">
                  <VideoCameraIcon className="w-5 h-5 mr-2" />
                  View Sessions
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: 'Total Sessions', value: '12', icon: VideoCameraIcon, color: 'text-primary-500', bg: 'bg-primary-100' },
          { label: 'Hours Learned', value: '24.5', icon: ClockIcon, color: 'text-accent-500', bg: 'bg-accent-100' },
          { label: 'Avg Rating', value: '4.8', icon: StarIconSolid, color: 'text-yellow-500', bg: 'bg-yellow-100' },
          { label: 'Learning Streak', value: '5 days', icon: ChartBarIcon, color: 'text-success-500', bg: 'bg-success-100' },
        ].map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold font-display text-neutral-900">{stat.value}</div>
            <div className="text-sm text-neutral-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {isLearner() && (
        <>
          {/* Recommended Tutors */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-display text-neutral-900">
                Recommended Tutors for You
              </h2>
              <Link to="/tutors" className="text-primary-500 hover:text-primary-600 font-medium text-sm flex items-center gap-1">
                View all <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="card p-6 animate-pulse">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-neutral-200 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-neutral-200 rounded w-24 mb-2" />
                        <div className="h-3 bg-neutral-200 rounded w-16" />
                      </div>
                    </div>
                    <div className="h-3 bg-neutral-200 rounded w-full mb-2" />
                    <div className="h-3 bg-neutral-200 rounded w-2/3" />
                  </div>
                ))
              ) : matches.length > 0 ? (
                matches.map(({ tutor, score, reasons }) => (
                  <Link key={tutor.user_id} to={`/tutors/${tutor.profile_id}`} className="card-hover p-6 block">
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={tutor.profile_pic || `https://i.pravatar.cc/100?u=${tutor.user_id}`}
                        alt={tutor.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-neutral-900">{tutor.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <StarIconSolid className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm font-medium">{tutor.rating}</span>
                          <span className="text-sm text-neutral-400">({tutor.total_reviews} reviews)</span>
                        </div>
                      </div>
                      <div className="text-xs font-medium text-primary-500 bg-primary-50 px-2 py-1 rounded-full">
                        {Math.round(score * 100)}% match
                      </div>
                    </div>
                    <p className="text-sm text-neutral-600 line-clamp-2 mb-3">{tutor.introduction}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-neutral-900">${tutor.hourly_rate}</span>
                      <span className="text-sm text-neutral-500">/hour</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full card p-8 text-center">
                  <SparklesIcon className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-neutral-900 mb-2">No matches yet</h3>
                  <p className="text-neutral-600 mb-4">Complete your profile to get personalized tutor recommendations.</p>
                  <Link to="/tutors" className="btn-primary">Browse Tutors</Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Upcoming Sessions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-display text-neutral-900">
            Upcoming Sessions
          </h2>
          <Link to="/dashboard/bookings" className="text-primary-500 hover:text-primary-600 font-medium text-sm flex items-center gap-1">
            View all <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
        <div className="card divide-y divide-neutral-100">
          {loading ? (
            <div className="p-6 animate-pulse">
              <div className="h-4 bg-neutral-200 rounded w-32 mb-2" />
              <div className="h-3 bg-neutral-200 rounded w-48" />
            </div>
          ) : upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking) => (
              <div key={booking.booking_id} className="p-6 flex items-center gap-4 lg:gap-6">
                <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <CalendarIcon className="w-7 h-7 text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-900 truncate">{booking.subject_name}</h3>
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
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${
                    booking.status === 'confirmed' ? 'badge-success' :
                    booking.status === 'pending' ? 'badge-warning' :
                    'badge-neutral'
                  }`}>
                    {booking.status}
                  </span>
                  {booking.status === 'confirmed' && (
                    <Link
                      to={`/dashboard/session/${booking.booking_id}`}
                      className="btn-primary btn-sm"
                    >
                      <PlayCircleIcon className="w-4 h-4 mr-1" />
                      Join
                    </Link>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <CalendarIcon className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="font-semibold text-neutral-900 mb-2">No upcoming sessions</h3>
              <p className="text-neutral-600 mb-4">Book your first session to get started.</p>
              <Link to="/tutors" className="btn-primary">Find a Tutor</Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold font-display text-neutral-900 mb-6">
          Quick Actions
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Book a Session', icon: CalendarIcon, href: '/tutors', color: 'bg-primary-500' },
            { title: 'View Progress', icon: ChartBarIcon, href: '/dashboard/progress', color: 'bg-accent-500' },
            { title: 'Community Q&A', icon: UserGroupIcon, href: '/dashboard/community', color: 'bg-success-500' },
            { title: 'Settings', icon: Cog6ToothIcon, href: '/dashboard/settings', color: 'bg-neutral-500' },
          ].map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="card-hover p-6 flex items-center gap-4 group"
            >
              <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <span className="font-medium text-neutral-900 group-hover:text-primary-500 transition-colors">
                {action.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
