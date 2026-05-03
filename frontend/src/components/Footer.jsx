import { Link } from 'react-router-dom';
import {
  AcademicCapIcon,
  BookOpenIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

const footerLinks = {
  'For Learners': [
    { name: 'Find Tutors', href: '/tutors' },
    { name: 'How it Works', href: '/#how-it-works' },
    { name: 'Pricing', href: '/tutors' },
    { name: 'Success Stories', href: '/#testimonials' },
  ],
  'For Tutors': [
    { name: 'Become a Tutor', href: '/become-a-tutor' },
    { name: 'Tutor Requirements', href: '/become-a-tutor#requirements' },
    { name: 'Tutor Success', href: '/become-a-tutor#success' },
    { name: 'Tutor Resources', href: '/dashboard/tutor-profile' },
  ],
  'Subjects': [
    { name: 'Mathematics', href: '/tutors?subject=math' },
    { name: 'English', href: '/tutors?subject=english' },
    { name: 'Programming', href: '/tutors?subject=programming' },
    { name: 'Languages', href: '/tutors?subject=languages' },
  ],
  'Company': [
    { name: 'About Us', href: '/#about' },
    { name: 'Careers', href: '/#careers' },
    { name: 'Blog', href: '/#blog' },
    { name: 'Contact', href: '/#contact' },
  ],
};

function Footer() {
  return (
    <footer className="bg-neutral-900 text-white">
      <div className="container-custom py-12 lg:py-16">
        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-xl font-bold font-display">TutorXpert</span>
            </Link>
            <p className="text-neutral-400 text-sm mb-6">
              Connect learners and tutors with smart match, flexible sessions & deep insights.
            </p>
            <div className="flex gap-4">
              {['facebook', 'twitter', 'instagram', 'linkedin'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-10 h-10 bg-neutral-800 rounded-xl flex items-center justify-center hover:bg-primary-500 transition-colors"
                >
                  <span className="sr-only">{social}</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10z" />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-semibold text-white mb-4">{title}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-neutral-400 hover:text-white text-sm transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-neutral-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-neutral-400 text-sm">
              © {new Date().getFullYear()} TutorXpert. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link to="/privacy" className="text-neutral-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-neutral-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
              <Link to="/cookies" className="text-neutral-400 hover:text-white text-sm transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
