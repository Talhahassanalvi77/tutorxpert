import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, CameraIcon } from '@heroicons/react/24/outline';

function SettingsPage() {
  const { user, setUser, refreshUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Sync local state with store
  useEffect(() => {
    setName(user?.name || '');
    setBio(user?.bio || '');
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      const res = await authAPI.updateProfile({ name, bio });
      const updatedUser = res.data.data.user;
      
      // Completely refresh user data from backend
      await refreshUser();
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChangePhoto = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      // For now, use a placeholder URL
      // In production, you'd upload to S3/Cloudinary
      const photoURL = `https://i.pravatar.cc/300?u=${user?.userId || Date.now()}`;
      
      setSaving(true);
      try {
        const res = await authAPI.updateProfile({ profilePic: photoURL });
        const updatedUser = res.data.data.user;
        
        // Merge with existing user data
        const currentUser = useAuthStore.getState().user;
        setUser({ ...currentUser, ...updatedUser });
        
        toast.success('Photo updated successfully!');
        
        // Force page refresh
        await refreshUser();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to update photo');
      } finally {
        setSaving(false);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold font-display text-neutral-900">Settings</h1>
        <p className="text-neutral-600 mt-1">Manage your account settings</p>
      </div>

      {/* Profile Section */}
      <form onSubmit={handleSaveProfile} className="card p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Profile</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <img
              src={user?.profilePic || `https://i.pravatar.cc/100?u=${user?.userId}`}
              alt={user?.name}
              className="w-20 h-20 rounded-full object-cover"
            />
            <button
              type="button"
              onClick={handleChangePhoto}
              className="absolute bottom-0 right-0 w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center text-white hover:bg-primary-600"
            >
              <CameraIcon className="w-4 h-4" />
            </button>
          </div>
          <div>
            <button
              type="button"
              onClick={handleChangePhoto}
              className="btn-secondary btn-sm"
            >
              Change Photo
            </button>
            <p className="text-xs text-neutral-500 mt-1">JPG, PNG or GIF. Max 5MB</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="input-label">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="input-label">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="input min-h-[100px]"
              placeholder="Tell us about yourself..."
            />
          </div>
          <div>
            <label className="input-label">Email</label>
            <input type="email" value={user?.email || ''} className="input" disabled />
            <p className="text-xs text-neutral-500 mt-1">Email cannot be changed</p>
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Password Section */}
      <form onSubmit={handleChangePassword} className="card p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Change Password</h2>
        <div className="space-y-4">
          <div>
            <label className="input-label">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input pr-12"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showCurrent ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="input-label">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input pr-12"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showNew ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="input-label">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              placeholder="Confirm new password"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={passwordLoading}>
            {passwordLoading ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>

      {/* Notifications */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Notifications</h2>
        <div className="space-y-4">
          {['Email notifications', 'Push notifications', 'Booking reminders'].map((item) => (
            <label key={item} className="flex items-center justify-between cursor-pointer">
              <span className="text-neutral-700">{item}</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
