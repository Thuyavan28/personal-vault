import React, { useState, useRef } from 'react';
import {
  ArrowLeft, ArrowRight, Check, Camera, User, Mail, Phone,
  Sparkles, Shield, Image as ImageIcon, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_PATHS } from '../utils/apiPath';

const STEPS = [
  { key: 'signup', label: 'Sign up', icon: Shield },
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'photo', label: 'Photo', icon: Camera },
  { key: 'verify', label: 'Verify', icon: Check },
  { key: 'done', label: 'Done', icon: Sparkles }
];

export function ProfileSetup({ onComplete, onClose, showToast }) {
  const { user, token, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState(() => {
    if (user?.name && user.name !== 'Google User' && user.name !== user.email?.split('@')[0]) {
      return user.name;
    }
    return '';
  });
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const progress = Math.round(((currentStep + 1) / STEPS.length) * 100);

  const handleAvatarFile = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target.result);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(API_PATHS.AUTH.UPDATE_PROFILE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: name.trim(), avatarUrl, phone: phone.trim(), bio: '' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save profile');

      updateUser({
        name: data.user.name,
        avatarUrl: data.user.avatarUrl,
        phone: data.user.phone,
        profileCompleted: true
      });

      if (window.location.pathname !== '/onboarding') {
        window.history.pushState(null, '', '/onboarding');
      }
      setCurrentStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    showToast?.({ message: 'Profile setup complete! Welcome to SecureVault 🎉', type: 'success' });
    onComplete?.();
  };

  const renderProfileStep = () => (
    <div className="space-y-4 animate-fade-in">
      <div>
        <label className="text-xs font-extrabold text-[#0e0e0e] block mb-1.5">Full Name *</label>
        <input
          type="text"
          placeholder="e.g., John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-[#0e0e0e] focus:border-[#cc001e] outline-none text-sm text-[#0e0e0e] font-extrabold transition-all shadow-sm"
          id="profile-name-input"
          autoFocus
        />
      </div>

      <div>
        <label className="text-xs font-extrabold text-[#0e0e0e] block mb-1.5">Email Address</label>
        <input
          type="email"
          disabled
          value={email}
          className="w-full px-4 py-3 rounded-2xl bg-[#f0f4f5] border-2 border-[#0e0e0e] text-xs text-[#0e0e0e] font-extrabold opacity-70 cursor-not-allowed"
          id="profile-email-input"
        />
      </div>

      <div>
        <label className="text-xs font-extrabold text-[#0e0e0e] block mb-1.5">Phone Number (optional)</label>
        <input
          type="tel"
          placeholder="+1 (555) 000-0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-[#0e0e0e] focus:border-[#cc001e] outline-none text-sm text-[#0e0e0e] font-extrabold transition-all shadow-sm"
          id="profile-phone-input"
        />
      </div>
    </div>
  );

  const renderPhotoStep = () => (
    <div className="space-y-5 animate-fade-in flex flex-col items-center">
      <div className="relative group">
        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[#0e0e0e] bg-[#f0f4f5] flex items-center justify-center shadow-md">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-16 h-16 text-[#0e0e0e]/40 stroke-[1.5]" />
          )}
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-1 right-1 p-2.5 bg-[#cc001e] hover:bg-[#b00019] text-white rounded-full shadow-md hover:scale-105 transition-all duration-200 cursor-pointer border-2 border-[#0e0e0e]"
          title="Upload Photo"
        >
          <Camera className="w-4 h-4 stroke-[2.5]" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarFile}
        />
      </div>

      <p className="text-xs text-[#555555] font-bold text-center max-w-[260px]">
        Add a photo to personalize your vault account, or skip to finish setup.
      </p>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-6 py-3 rounded-2xl bg-white hover:bg-[#f0f4f5] border-2 border-[#0e0e0e] hover:border-[#cc001e] text-[#0e0e0e] hover:text-[#cc001e] font-extrabold text-xs flex items-center gap-2 transition-all duration-200 cursor-pointer shadow-sm"
      >
        <ImageIcon className="w-4 h-4 stroke-[2.5]" />
        <span>Choose from Device</span>
      </button>
    </div>
  );

  const renderVerifyStep = () => (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-[#f0f4f5] rounded-2xl p-5 border-2 border-[#0e0e0e] space-y-3">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0e0e0e] mb-2">Review Your Details</h4>

        <div className="flex items-center gap-3.5 pb-3 border-b-2 border-[#0e0e0e]/10">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#0e0e0e] bg-white flex-shrink-0 flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-[#0e0e0e]/40" />
            )}
          </div>
          <div>
            <p className="font-extrabold text-[#0e0e0e] text-sm">{name || 'No name set'}</p>
            <p className="text-xs text-[#555555] font-bold">{email}</p>
          </div>
        </div>

        <div className="space-y-2 pt-1 text-xs">
          <div className="flex justify-between items-center py-1">
            <span className="text-[#555555] font-bold">Full Name</span>
            <span className="text-[#0e0e0e] font-extrabold">{name || '—'}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-[#555555] font-bold">Email</span>
            <span className="text-[#0e0e0e] font-extrabold">{email}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-[#555555] font-bold">Phone</span>
            <span className="text-[#0e0e0e] font-extrabold">{phone || '—'}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-[#555555] font-bold">Photo</span>
            <span className={`font-extrabold ${avatarUrl ? 'text-[#cc001e]' : 'text-[#555555]'}`}>
              {avatarUrl ? '✓ Uploaded' : 'Skipped'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDoneStep = () => (
    <div className="flex flex-col items-center justify-center py-6 space-y-5 animate-fade-in text-center">
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-[#0e0e0e] border-2 border-[#0e0e0e] text-[#cc001e] flex items-center justify-center shadow-xl animate-unlock-pop">
          <Check className="w-10 h-10 stroke-[3]" />
        </div>
        <div className="absolute -inset-2.5 rounded-3xl border-2 border-[#cc001e] animate-ripple-ring pointer-events-none" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-2xl font-extrabold text-[#0e0e0e]">All Done! 🎉</h3>
        <p className="text-xs text-[#555555] font-bold max-w-[280px] mx-auto">
          Your profile is ready. Now let's configure your 4-digit PIN to secure your vault.
        </p>
      </div>

      <button
        onClick={handleFinish}
        className="w-full py-4 rounded-2xl neon-button text-white font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer border-2 border-[#0e0e0e] shadow-md mt-2"
        id="profile-setup-finish"
      >
        <span>Set 4-Digit Security PIN</span>
        <ArrowRight className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderProfileStep();
      case 2: return renderPhotoStep();
      case 3: return renderVerifyStep();
      case 4: return renderDoneStep();
      default: return null;
    }
  };

  const canGoNext = () => {
    if (currentStep === 1) return name.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (currentStep === 3) {
      handleSaveProfile();
    } else if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      setError('');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setError('');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md relative">
        {/* Main Card */}
        <div className="bg-white border-2 border-[#0e0e0e] rounded-3xl shadow-2xl p-7 space-y-6 relative">
          {/* Header */}
          <div className="text-center relative">
            {currentStep < 4 && currentStep > 1 && (
              <button
                onClick={handleBack}
                className="absolute left-0 top-0 p-2 rounded-xl text-[#0e0e0e] hover:bg-[#f0f4f5] border-2 border-[#0e0e0e] hover:border-[#cc001e] transition-all cursor-pointer"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}

            {/* Exit (X) Button */}
            <button
              onClick={onClose || onComplete}
              className="absolute right-0 top-0 p-2 rounded-xl text-[#0e0e0e] hover:bg-[#f0f4f5] border-2 border-[#0e0e0e] hover:border-[#cc001e] transition-all cursor-pointer"
              aria-label="Exit"
              title="Exit Setup"
              id="btn-close-profile-setup"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            <p className="text-[11px] font-extrabold text-[#cc001e] uppercase tracking-widest mb-1">Profile Setup</p>
            {currentStep < 4 && (
              <div>
                <h2 className="text-2xl font-extrabold text-[#0e0e0e] tracking-tight">
                  {currentStep === 1 && "You're doing great! 🎉"}
                  {currentStep === 2 && 'Add a profile photo 📸'}
                  {currentStep === 3 && 'Almost there! ✅'}
                </h2>
                <p className="text-xs text-[#555555] font-bold mt-1">
                  {currentStep === 1 && 'Just a few more details to complete your account setup'}
                  {currentStep === 2 && 'A photo helps personalize your vault experience'}
                  {currentStep === 3 && 'Review your details before we finalize'}
                </p>
              </div>
            )}
          </div>

          {/* Progress Section */}
          {currentStep < 4 && (
            <div className="bg-[#f0f4f5] rounded-2xl p-4 border-2 border-[#0e0e0e]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-extrabold text-[#0e0e0e]">Setup Progress</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-extrabold text-[#cc001e]">{progress}%</span>
                  <span className="text-xs">🔥</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-[#0e0e0e] mb-3.5">
                <div
                  className="h-full bg-[#cc001e] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Step Indicators */}
              <div className="flex items-center justify-between">
                {STEPS.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isComplete = idx < currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div key={step.key} className="flex flex-col items-center gap-1">
                      <div className={`
                        w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 border-2
                        ${isComplete ? 'bg-[#0e0e0e] text-white border-[#0e0e0e]' : ''}
                        ${isCurrent ? 'bg-[#cc001e] text-white border-[#0e0e0e] shadow-sm scale-110' : ''}
                        ${!isComplete && !isCurrent ? 'bg-white text-[#555555] border-[#0e0e0e]' : ''}
                      `}>
                        {isComplete ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : (
                          <StepIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                        )}
                      </div>
                      <span className={`text-[10px] font-extrabold transition-colors duration-200 ${
                        isCurrent ? 'text-[#cc001e]' : isComplete ? 'text-[#0e0e0e]' : 'text-[#555555]'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 rounded-2xl bg-white border-2 border-[#cc001e] text-[#cc001e] text-xs font-extrabold animate-shake">
              {error}
            </div>
          )}

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation Buttons */}
          {currentStep < 4 && (
            <button
              onClick={handleNext}
              disabled={!canGoNext() || loading}
              className="w-full py-4 rounded-2xl neon-button text-white font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all border-2 border-[#0e0e0e] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              id="profile-setup-continue"
            >
              <span>
                {loading ? 'Saving...' :
                  currentStep === 2 ? (avatarUrl ? 'Continue →' : 'Skip for now →') :
                  currentStep === 3 ? 'Confirm & Save →' :
                  'Continue →'}
              </span>
            </button>
          )}

          {/* Skip photo step */}
          {currentStep === 2 && avatarUrl && (
            <button
              onClick={() => { setAvatarUrl(''); setCurrentStep(3); }}
              className="w-full text-center text-xs text-[#555555] hover:text-[#cc001e] font-extrabold transition-colors cursor-pointer py-1"
            >
              Remove photo & skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
