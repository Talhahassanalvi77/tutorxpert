import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tutorsAPI, bookingsAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import {
  StarIcon,
  CalendarIcon,
  ClockIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

function TutorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    loadTutor();
  }, [id]);

  const loadTutor = async () => {
    try {
      setLoading(true);
      const res = await tutorsAPI.getById(id);
      setTutor(res.data.data.tutor);
    } catch (error) {
      console.error('Failed to load tutor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }

    if (!selectedTime) {
      toast.error('Please select a time slot');
      return;
    }

    try {
      setBookingLoading(true);
      const scheduledAt = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      scheduledAt.setHours(parseInt(hours), parseInt(minutes));

      await bookingsAPI.create({
        tutorId: tutor.user_id,
        subjectId: tutor.subjects?.[0],
        scheduledAt: scheduledAt.toISOString(),
        durationMinutes: 60,
        notes: 'First session',
      });

      toast.success('Booking request sent!');
      navigate('/dashboard/bookings');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to book session');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-20 lg:pt-24 min-h-screen flex items-center justify-center">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="pt-20 lg:pt-24 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Tutor not found</h1>
          <button onClick={() => navigate('/tutors')} className="btn-primary">
            Browse Tutors
          </button>
        </div>
      </div>
    );
  }

  const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

  return (
    <div className="pt-20 lg:pt-24 min-h-screen bg-neutral-50">
      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <div className="card p-6 lg:p-8">
              <div className="flex items-start gap-6 mb-6">
                <img
                  src={tutor.profile_pic || `https://i.pravatar.cc/150?u=${tutor.user_id}`}
                  alt={tutor.name}
                  className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-bold font-display text-neutral-900">
                        {tutor.name}
                      </h1>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <StarIconSolid className="w-5 h-5 text-yellow-400" />
                          <span className="font-semibold">{tutor.rating}</span>
                          <span className="text-neutral-500">({tutor.total_reviews} reviews)</span>
                        </div>
                        {tutor.is_verified && (
                          <span className="badge badge-success flex items-center gap-1">
                            <CheckCircleIcon className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-neutral-900">${tutor.hourly_rate}</div>
                      <div className="text-neutral-500">/hour</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 py-6 border-t border-b border-neutral-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-500">{tutor.total_sessions}</div>
                  <div className="text-sm text-neutral-500">Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-500">{tutor.total_hours}</div>
                  <div className="text-sm text-neutral-500">Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-500">{tutor.experience_years}</div>
                  <div className="text-sm text-neutral-500">Years Exp.</div>
                </div>
              </div>

              {/* About */}
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-3">About</h2>
                <p className="text-neutral-600">{tutor.introduction}</p>
              </div>

              {/* Teaching Style */}
              {tutor.teaching_style && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-neutral-900 mb-3">Teaching Style</h2>
                  <p className="text-neutral-600">{tutor.teaching_style}</p>
                </div>
              )}

              {/* Education & Certifications */}
              {(tutor.education?.length > 0 || tutor.certifications?.length > 0) && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-neutral-900 mb-3">
                    Education & Certifications
                  </h2>
                  <div className="space-y-2">
                    {tutor.education?.map((edu, i) => (
                      <div key={i} className="flex items-center gap-2 text-neutral-600">
                        <AcademicCapIcon className="w-5 h-5 text-primary-500" />
                        {edu}
                      </div>
                    ))}
                    {tutor.certifications?.map((cert, i) => (
                      <div key={i} className="flex items-center gap-2 text-neutral-600">
                        <BriefcaseIcon className="w-5 h-5 text-primary-500" />
                        {cert}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {tutor.languages?.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-neutral-900 mb-3">Languages</h2>
                  <div className="flex flex-wrap gap-2">
                    {tutor.languages.map((lang) => (
                      <span key={lang} className="badge badge-neutral flex items-center gap-1">
                        <GlobeAltIcon className="w-3 h-3" />
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              {tutor.reviews?.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-neutral-900 mb-4">Reviews</h2>
                  <div className="space-y-4">
                    {tutor.reviews.map((review) => (
                      <div key={review.review_id} className="border-t border-neutral-100 pt-4">
                        <div className="flex items-center gap-3 mb-2">
                          <img
                            src={review.reviewer_pic || `https://i.pravatar.cc/50?u=${review.reviewer_id}`}
                            alt={review.reviewer_name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <div className="font-medium">{review.reviewer_name}</div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <StarIconSolid
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating ? 'text-yellow-400' : 'text-neutral-200'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-neutral-600">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary-500" />
                Book a Session
              </h2>

              {/* Date Selection */}
              <div className="mb-4">
                <label className="input-label text-sm">Select Date</label>
                <Calendar
                  onChange={setSelectedDate}
                  value={selectedDate}
                  minDate={new Date()}
                  className="w-full border-0 rounded-xl"
                />
              </div>

              {/* Time Selection */}
              <div className="mb-6">
                <label className="input-label text-sm">Select Time</label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        selectedTime === time
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="border-t border-neutral-200 pt-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-neutral-600">Hourly rate</span>
                  <span className="font-medium">${tutor.hourly_rate}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-neutral-600">Duration</span>
                  <span className="font-medium">60 min</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${tutor.hourly_rate}</span>
                </div>
              </div>

              <button
                onClick={handleBooking}
                disabled={bookingLoading || !selectedTime}
                className="btn-primary w-full"
              >
                {bookingLoading ? 'Booking...' : 'Request Session'}
              </button>

              <p className="text-xs text-neutral-500 text-center mt-3">
                Your booking request will be sent to the tutor for confirmation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorDetailPage;
