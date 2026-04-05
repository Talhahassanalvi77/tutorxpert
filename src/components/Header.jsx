import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import {
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Find tutors', href: '/tutors' },
  { name: 'For business', href: '/#business' },
  { name: 'Become a tutor', href: '/become-a-tutor' },
  { name: 'Proven Progress', href: '/#progress' },
];

function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${scrolled ? 'bg-white shadow-md' : 'bg-white'}`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <svg className="w-8 h-8 text-primary-500" viewBox="0 0 40 40" fill="currentColor">
              <path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm0 36c-8.837 0-16-7.163-16-16S11.163 4 20 4s16 7.163 16 16-7.163 16-16 16z"/>
              <path d="M20 8c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12S26.627 8 20 8zm0 20c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z"/>
            </svg>
            <span className="text-xl font-bold text-preply-black">TutorXpert</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-preply-black hover:text-primary-500 font-medium text-sm transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Language Selector */}
            <button className="flex items-center gap-2 text-sm text-preply-black hover:text-primary-500">
              <GlobeAltIcon className="w-5 h-5" />
              English, USD
              <ChevronDownIcon className="w-4 h-4" />
            </button>

            {/* Help Icon */}
            <button className="p-2 hover:bg-neutral-100 rounded-full">
              <svg className="w-5 h-5 text-preply-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-preply-black rounded-xl hover:bg-neutral-50 transition-colors"
                >
                  <img
                    src={user?.profilePic || `https://i.pravatar.cc/100?u=${user?.userId}`}
                    alt={user?.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="font-medium text-preply-black">{user?.name}</span>
                  <ChevronDownIcon className="w-4 h-4" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-neutral-200 py-2">
                    <Link
                      to="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-preply-black hover:bg-neutral-50"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/dashboard/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-preply-black hover:bg-neutral-50"
                    >
                      Settings
                    </Link>
                    <hr className="my-2 border-neutral-100" />
                    <button
                      onClick={() => {
                        logout();
                        navigate('/');
                        setUserMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-danger-600 hover:bg-danger-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="flex items-center gap-1 text-preply-black font-medium hover:text-primary-500"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Log in
                </Link>
                <Link
                  to="/auth/signup"
                  className="bg-preply-black text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-preply-dark transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-100"
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6 text-preply-black" />
            ) : (
              <Bars3Icon className="w-6 h-6 text-preply-black" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-neutral-200">
          <div className="container-custom py-4 space-y-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-preply-black hover:text-primary-500 font-medium"
              >
                {item.name}
              </Link>
            ))}
            <hr className="border-neutral-200" />
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-primary-500 font-medium"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-danger-600 font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-preply-black hover:text-primary-500 font-medium"
                >
                  Log in
                </Link>
                <Link
                  to="/auth/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-3 bg-preply-black text-white rounded-xl font-semibold"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
