import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import {
  HomeIcon,
  CalendarIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  AcademicCapIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Bookings', href: '/dashboard/bookings', icon: CalendarIcon },
  { name: 'Sessions', href: '/dashboard/sessions', icon: VideoCameraIcon },
  { name: 'Messages', href: '/dashboard/messages', icon: ChatBubbleLeftRightIcon },
  { name: 'Progress', href: '/dashboard/progress', icon: ChartBarIcon },
  { name: 'Community', href: '/dashboard/community', icon: UserGroupIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: AcademicCapIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isTutor } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const tutorNavigation = [
    ...navigation,
    { name: 'Tutor Profile', href: '/dashboard/tutor-profile', icon: AcademicCapIcon, tutorOnly: true },
  ];

  const filteredNavigation = tutorNavigation.filter(
    (item) => !item.tutorOnly || isTutor()
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-neutral-200 
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-200">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-xl font-bold font-display text-primary-500">TutorXpert</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100"
            >
              <XMarkIcon className="w-6 h-6 text-neutral-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-500' : 'text-neutral-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User profile */}
          <div className="p-4 border-t border-neutral-200">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-50">
              <img
                src={user?.profilePic || `https://i.pravatar.cc/100?u=${user?.userId}`}
                alt={user?.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">{user?.name}</p>
                <p className="text-xs text-neutral-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="flex items-center gap-3 w-full px-4 py-3 mt-2 text-sm font-medium text-danger-600 
                rounded-xl hover:bg-danger-50 transition-colors"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-lg border-b border-neutral-200">
          <div className="flex items-center justify-between h-full px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100"
            >
              <Bars3Icon className="w-6 h-6 text-neutral-500" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 rounded-xl hover:bg-neutral-100 relative"
                >
                  <BellIconSolid className="w-6 h-6 text-neutral-500" />
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-danger-500 rounded-full border-2 border-white" />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-neutral-200 py-2">
                    <div className="px-4 py-2 border-b border-neutral-100">
                      <h3 className="font-semibold text-neutral-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="px-4 py-8 text-center text-neutral-500 text-sm">
                        No new notifications
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <Link
                to="/dashboard/settings"
                className="flex items-center gap-2 ml-2 px-3 py-2 rounded-xl hover:bg-neutral-100"
              >
                <img
                  src={user?.profilePic || `https://i.pravatar.cc/100?u=${user?.userId}`}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
