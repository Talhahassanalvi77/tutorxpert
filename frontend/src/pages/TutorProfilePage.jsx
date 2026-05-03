import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { tutorsAPI, subjectsAPI } from '../services/api';
import toast from 'react-hot-toast';

function TutorProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [subjects, setSubjects] = useState([]);
  
  const [formData, setFormData] = useState({
    introduction: '',
    teaching_style: '',
    experience_years: 0,
    hourly_rate: 30,
    subjects: [],
    languages: ['English'],
    education: [''],
    certifications: [''],
    availability: [],
  });

  useEffect(() => {
    if (user?.userId) {
      loadSubjects();
      loadProfile();
    }
  }, [user?.userId]);

  const loadSubjects = async () => {
    try {
      const res = await subjectsAPI.getAll();
      setSubjects(res.data.data.subjects);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
  };

  const loadProfile = async () => {
    try {
      // Get current user's tutor profile
      const res = await tutorsAPI.getById(user.userId);
      const profile = res.data.data?.tutor;
      
      console.log('Loaded profile:', profile);
      
      if (profile && profile.user_id) {
        setFormData({
          introduction: profile.introduction || '',
          teaching_style: profile.teaching_style || '',
          experience_years: profile.experience_years || 0,
          hourly_rate: profile.hourly_rate || 30,
          subjects: profile.subjects || [],
          languages: profile.languages || ['English'],
          education: profile.education || [''],
          certifications: profile.certifications || [''],
          availability: profile.availability || [],
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSubject = (subjectId) => {
    const current = formData.subjects;
    const updated = current.includes(subjectId)
      ? current.filter((s) => s !== subjectId)
      : [...current, subjectId];
    handleChange('subjects', updated);
  };

  const addLanguage = () => {
    handleChange('languages', [...formData.languages, '']);
  };

  const updateLanguage = (index, value) => {
    const updated = [...formData.languages];
    updated[index] = value;
    handleChange('languages', updated);
  };

  const addAvailability = () => {
    handleChange('availability', [
      ...formData.availability,
      { day: 'Monday', start: '09:00', end: '17:00' }
    ]);
  };

  const updateAvailability = (index, field, value) => {
    const updated = [...formData.availability];
    updated[index] = { ...updated[index], [field]: value };
    handleChange('availability', updated);
  };

  const removeAvailability = (index) => {
    const updated = formData.availability.filter((_, i) => i !== index);
    handleChange('availability', updated);
  };

  const handleSaveProfile = async () => {
    if (formData.subjects.length === 0) {
      toast.error('Please select at least one subject');
      return;
    }

    if (!formData.introduction.trim()) {
      toast.error('Please write an introduction');
      return;
    }

    setLoading(true);
    try {
      await tutorsAPI.createProfile(formData);
      toast.success('Profile saved successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    setPreviewMode(true);
  };

  if (previewMode) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-display text-neutral-900">Profile Preview</h1>
          <button
            onClick={() => setPreviewMode(false)}
            className="btn-secondary"
          >
            Back to Editing
          </button>
        </div>

        <div className="card p-8">
          <div className="flex items-start gap-6 mb-6">
            <img
              src={user?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Tutor')}&background=6366f1&color=fff&size=96`}
              alt={user?.name}
              className="w-24 h-24 rounded-2xl object-cover"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-neutral-900">{user?.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="badge badge-success">Verified Tutor</span>
              </div>
              <p className="text-neutral-600 mt-3">{formData.introduction}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-neutral-900">${formData.hourly_rate}</div>
              <div className="text-neutral-500">/hour</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 py-6 border-t border-b border-neutral-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-500">{formData.experience_years}</div>
              <div className="text-sm text-neutral-500">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-500">0</div>
              <div className="text-sm text-neutral-500">Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-500">0</div>
              <div className="text-sm text-neutral-500">Hours</div>
            </div>
          </div>

          {formData.teaching_style && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Teaching Style</h3>
              <p className="text-neutral-600">{formData.teaching_style}</p>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3">Subjects</h3>
            <div className="flex flex-wrap gap-2">
              {subjects
                .filter((s) => formData.subjects.includes(s.subject_id))
                .map((s) => (
                  <span key={s.subject_id} className="badge badge-primary">
                    {s.name}
                  </span>
                ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3">Languages</h3>
            <div className="flex flex-wrap gap-2">
              {formData.languages.map((lang, i) => (
                <span key={i} className="badge badge-neutral">{lang}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold font-display text-neutral-900">Tutor Profile</h1>
        <p className="text-neutral-600 mt-1">Set up your tutoring profile</p>
      </div>

      {/* Introduction */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Introduction</h2>
        <textarea
          value={formData.introduction}
          onChange={(e) => handleChange('introduction', e.target.value)}
          className="input min-h-[150px]"
          placeholder="Tell students about yourself, your teaching style, and what makes you a great tutor..."
        />
        <p className="text-sm text-neutral-500 mt-2">{formData.introduction.length} characters</p>
      </div>

      {/* Teaching Style */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Teaching Style</h2>
        <textarea
          value={formData.teaching_style}
          onChange={(e) => handleChange('teaching_style', e.target.value)}
          className="input min-h-[100px]"
          placeholder="Describe how you teach..."
        />
      </div>

      {/* Subjects */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Subjects</h2>
        <p className="text-neutral-600 mb-4">Select the subjects you can teach</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {subjects.map((subject) => (
            <label
              key={subject.subject_id}
              className={`flex items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-colors ${
                formData.subjects.includes(subject.subject_id)
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.subjects.includes(subject.subject_id)}
                onChange={() => toggleSubject(subject.subject_id)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">{subject.name}</span>
            </label>
          ))}
        </div>
        {formData.subjects.length === 0 && (
          <p className="text-sm text-danger-500 mt-2">Please select at least one subject</p>
        )}
      </div>

      {/* Experience & Rate */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Experience & Pricing</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="input-label">Years of Experience</label>
            <input
              type="number"
              value={formData.experience_years}
              onChange={(e) => handleChange('experience_years', parseInt(e.target.value) || 0)}
              className="input"
              min="0"
            />
          </div>
          <div>
            <label className="input-label">Hourly Rate ($)</label>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">$</span>
              <input
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => handleChange('hourly_rate', parseInt(e.target.value) || 0)}
                className="input w-32"
                min="0"
              />
              <span className="text-neutral-500">/hour</span>
            </div>
          </div>
        </div>
      </div>

      {/* Languages */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Languages</h2>
        <div className="space-y-3">
          {formData.languages.map((lang, i) => (
            <input
              key={i}
              type="text"
              value={lang}
              onChange={(e) => updateLanguage(i, e.target.value)}
              placeholder="e.g., English, Spanish"
              className="input"
            />
          ))}
          <button onClick={addLanguage} className="text-primary-500 hover:text-primary-600 font-medium text-sm">
            + Add Language
          </button>
        </div>
      </div>

      {/* Availability */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Availability</h2>
        <p className="text-neutral-600 mb-4">Set your available hours</p>
        <div className="space-y-3">
          {formData.availability.length > 0 ? (
            formData.availability.map((slot, i) => (
              <div key={i} className="flex items-center gap-4">
                <select
                  value={slot.day}
                  onChange={(e) => updateAvailability(i, 'day', e.target.value)}
                  className="input w-40"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <option key={day}>{day}</option>
                  ))}
                </select>
                <input
                  type="time"
                  value={slot.start}
                  onChange={(e) => updateAvailability(i, 'start', e.target.value)}
                  className="input w-32"
                />
                <span className="text-neutral-400">to</span>
                <input
                  type="time"
                  value={slot.end}
                  onChange={(e) => updateAvailability(i, 'end', e.target.value)}
                  className="input w-32"
                />
                <button
                  onClick={() => removeAvailability(i)}
                  className="text-danger-500 hover:text-danger-600"
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <p className="text-neutral-500 text-sm">No availability set</p>
          )}
          <button onClick={addAvailability} className="text-primary-500 hover:text-primary-600 font-medium text-sm">
            + Add Time Slot
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button onClick={handleSaveProfile} className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
        <button onClick={handlePreview} className="btn-secondary">
          Preview Profile
        </button>
      </div>
    </div>
  );
}

export default TutorProfilePage;
