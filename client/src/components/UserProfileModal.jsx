import React, { useState, useEffect } from 'react';
import { X, User, Camera, Mail, Phone, FileText, Check, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_PATHS } from '../utils/apiPath';

export function UserProfileModal({ isOpen, onClose, showToast }) {
  const { user, token, updateUser } = useAuth();

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '');
      setAvatarUrl(user.avatarUrl || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setError('');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleAvatarFile = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(API_PATHS.AUTH.UPDATE_PROFILE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, avatarUrl, phone, bio })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      updateUser({
        name: data.user.name,
        avatarUrl: data.user.avatarUrl,
        phone: data.user.phone,
        bio: data.user.bio
      });

      showToast({ message: 'Profile updated successfully', type: 'success' });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white border-2 border-[#0e0e0e] rounded-3xl p-8 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0e0e0e] border-2 border-[#0e0e0e] flex items-center justify-center text-[#cc001e]">
              <User className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#0e0e0e]">User Profile</h3>
              <p className="text-xs text-[#0e0e0e] font-bold">Personal account details and preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#0e0e0e] hover:bg-[#f0f4f5] border-2 border-[#0e0e0e] hover:border-[#cc001e] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-white border-2 border-[#cc001e] text-[#cc001e] text-xs font-extrabold">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto space-y-6 pt-4 pr-1">
          {/* Avatar Section */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-white border-2 border-[#0e0e0e] flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-[#0e0e0e]/40 stroke-[2.5]" />
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2 bg-[#cc001e] text-white rounded-full border-2 border-[#0e0e0e] hover:scale-105 transition-transform cursor-pointer"
                title="Change Picture"
              >
                <Camera className="w-4 h-4 stroke-[2.5]" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFile}
              />
            </div>
            <span className="text-xs text-[#0e0e0e] font-bold">Click camera icon to upload photo</span>
          </div>

          {/* Form Inputs with Crisp Borders */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-extrabold text-[#0e0e0e] block mb-1.5">
                Full Name
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="e.g., Alexander Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border-2 border-[#0e0e0e] focus:border-[#cc001e] outline-none text-sm text-[#0e0e0e] font-bold transition-all shadow-sm"
                />
                <User className="w-4 h-4 text-[#0e0e0e] absolute left-3.5 pointer-events-none stroke-[2.5]" />
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-[#0e0e0e] block mb-1.5">
                Email Address
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#f0f4f5] border-2 border-[#0e0e0e] text-[#0e0e0e] font-bold text-sm outline-none cursor-not-allowed"
                />
                <Mail className="w-4 h-4 text-[#0e0e0e] absolute left-3.5 pointer-events-none stroke-[2.5]" />
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-[#0e0e0e] block mb-1.5">
                Phone Number
              </label>
              <div className="relative flex items-center">
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border-2 border-[#0e0e0e] focus:border-[#cc001e] outline-none text-sm text-[#0e0e0e] font-bold transition-all shadow-sm"
                />
                <Phone className="w-4 h-4 text-[#0e0e0e] absolute left-3.5 pointer-events-none stroke-[2.5]" />
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-[#0e0e0e] block mb-1.5">
                About / Basic Information
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  placeholder="Personal notes, emergency contacts, or role description..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-white border-2 border-[#0e0e0e] focus:border-[#cc001e] outline-none text-xs text-[#0e0e0e] font-bold resize-none transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl text-xs font-extrabold text-[#0e0e0e] hover:text-[#cc001e] bg-white border-2 border-[#0e0e0e] hover:border-[#cc001e] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="neon-button px-7 py-3 rounded-2xl text-xs font-extrabold flex items-center gap-2 cursor-pointer disabled:opacity-50 border-2 border-[#0e0e0e]"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{loading ? 'Saving Changes...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
