import { Link } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/24/outline';

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-9xl font-bold font-display text-primary-200 mb-4">404</div>
        <h1 className="text-3xl font-bold font-display text-neutral-900 mb-4">
          Page Not Found
        </h1>
        <p className="text-lg text-neutral-600 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <HomeIcon className="w-5 h-5" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
