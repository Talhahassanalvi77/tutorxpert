import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { tutorsAPI, subjectsAPI } from '../services/api';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

function TutorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tutors, setTutors] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filters, setFilters] = useState({
    subject: searchParams.get('subject') || '',
    language: searchParams.get('language') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minRating: searchParams.get('minRating') || '',
    sortBy: searchParams.get('sortBy') || 'rating',
    sortOrder: searchParams.get('sortOrder') || 'desc',
  });

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
    loadTutors(params);
  }, [filters]);

  const loadSubjects = async () => {
    try {
      const res = await subjectsAPI.getAll();
      setSubjects(res.data.data.subjects);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
  };

  const loadTutors = async (params) => {
    try {
      setLoading(true);
      const res = await tutorsAPI.getAll(Object.fromEntries(params));
      setTutors(res.data.data.tutors);
    } catch (error) {
      console.error('Failed to load tutors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      subject: '',
      language: '',
      minPrice: '',
      maxPrice: '',
      minRating: '',
      sortBy: 'rating',
      sortOrder: 'desc',
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  return (
    <div className="pt-20 lg:pt-24 min-h-screen bg-neutral-50">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold font-display text-neutral-900 mb-4">
            Find Your Perfect Tutor
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl">
            Browse expert tutors across subjects. Read reviews, compare rates, and book your first session.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="card p-4 lg:p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-neutral-50 rounded-xl">
              <MagnifyingGlassIcon className="w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by subject or tutor name..."
                className="flex-1 bg-transparent outline-none"
              />
            </div>

            {/* Filter Toggle (Mobile) */}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="lg:hidden btn-secondary flex items-center gap-2"
            >
              <FunnelIcon className="w-5 h-5" />
              Filters
            </button>

            {/* Sort */}
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder);
              }}
              className="input lg:w-48"
            >
              <option value="rating-desc">Highest Rated</option>
              <option value="rating-asc">Lowest Rated</option>
              <option value="hourly_rate-asc">Price: Low to High</option>
              <option value="hourly_rate-desc">Price: High to Low</option>
              <option value="total_sessions-desc">Most Experienced</option>
            </select>
          </div>

          {/* Filters Panel */}
          {(filtersOpen || !filtersOpen) && (
            <div className={`mt-4 pt-4 border-t border-neutral-200 ${filtersOpen ? 'block' : 'hidden lg:block'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-900">Filters</h3>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1">
                    <XMarkIcon className="w-4 h-4" />
                    Clear all
                  </button>
                )}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Subject Filter */}
                <div>
                  <label className="input-label text-sm">Subject</label>
                  <select
                    value={filters.subject}
                    onChange={(e) => handleFilterChange('subject', e.target.value)}
                    className="input"
                  >
                    <option value="">All Subjects</option>
                    {subjects.map((s) => (
                      <option key={s.subject_id} value={s.subject_id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="input-label text-sm">Max Price ($/hour)</label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    placeholder="Any"
                    className="input"
                  />
                </div>

                {/* Minimum Rating */}
                <div>
                  <label className="input-label text-sm">Minimum Rating</label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => handleFilterChange('minRating', e.target.value)}
                    className="input"
                  >
                    <option value="">Any</option>
                    <option value="4.5">4.5+ Stars</option>
                    <option value="4">4+ Stars</option>
                    <option value="3.5">3.5+ Stars</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="input-label text-sm">Language</label>
                  <select
                    value={filters.language}
                    onChange={(e) => handleFilterChange('language', e.target.value)}
                    className="input"
                  >
                    <option value="">Any Language</option>
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-neutral-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-neutral-200 rounded w-24 mb-2" />
                    <div className="h-3 bg-neutral-200 rounded w-16" />
                  </div>
                </div>
                <div className="h-3 bg-neutral-200 rounded w-full mb-2" />
                <div className="h-3 bg-neutral-200 rounded w-2/3 mb-4" />
                <div className="h-8 bg-neutral-200 rounded" />
              </div>
            ))}
          </div>
        ) : tutors.length > 0 ? (
          <>
            <div className="mb-4 text-sm text-neutral-600">
              Showing {tutors.length} tutors
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tutors.map((tutor) => (
                <Link
                  key={tutor.profile_id}
                  to={`/tutors/${tutor.profile_id}`}
                  className="card-hover p-6 block"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={tutor.profile_pic || `https://i.pravatar.cc/150?u=${tutor.user_id}`}
                      alt={tutor.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900">{tutor.name}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <StarIconSolid className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium">{tutor.rating}</span>
                        <span className="text-xs text-neutral-400">({tutor.total_reviews})</span>
                      </div>
                    </div>
                    {tutor.is_verified && (
                      <span className="badge badge-success">Verified</span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-600 line-clamp-2 mb-4">
                    {tutor.introduction || 'Experienced tutor ready to help you succeed!'}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-neutral-900">${tutor.hourly_rate}</span>
                    <span className="text-sm text-neutral-500">/hour</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tutor.languages?.slice(0, 2).map((lang) => (
                      <span key={lang} className="badge badge-neutral">{lang}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="card p-12 text-center">
            <FunnelIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">No tutors found</h3>
            <p className="text-neutral-600 mb-4">Try adjusting your filters to see more results.</p>
            <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TutorsPage;
