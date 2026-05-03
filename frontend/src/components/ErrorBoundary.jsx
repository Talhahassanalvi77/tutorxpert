import { Component } from 'react';
import { Link } from 'react-router-dom';
import {
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoBack = () => {
    if (this.props.fallback) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              Something went wrong
            </h1>
            
            <p className="text-neutral-600 dark:text-neutral-400 mb-8">
              We're sorry, but something unexpected happened. Please try reloading the page.
            </p>

            {this.props.showDetails && this.state.error && (
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4 mb-6 text-left overflow-auto max-h-40">
                <p className="text-sm font-mono text-red-600 dark:text-red-400">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Reload Page
              </button>
              
              <button
                onClick={this.handleGoBack}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium rounded-xl transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Go Back
              </button>
            </div>

            <Link
              to="/"
              className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              Return to Home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;