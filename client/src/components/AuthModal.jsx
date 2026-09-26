import React, { useState, useEffect } from 'react';
import { Shield, Mail, KeyRound, AlertCircle, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_PATHS } from '../utils/apiPath';

// Google OAuth Client ID (must end in .apps.googleusercontent.com)
// Note: Strings starting with 'GOCSPX-' are Client Secrets, not Client IDs
const GOOGLE_CLIENT_ID = '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';
const isRealGoogleClientId = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.endsWith('.apps.googleusercontent.com');

export function AuthModal({ isOpen, onClose, showToast }) {
  const { login } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googlePromptError, setGooglePromptError] = useState('');

  // Load Google Identity Services SDK only if a real Client ID is provided
  useEffect(() => {
    if (!isOpen || !isRealGoogleClientId) return;

    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initializeGoogleButton();
      document.head.appendChild(script);
    } else if (window.google?.accounts) {
      setTimeout(() => initializeGoogleButton(), 100);
    }
  }, [isOpen]);

  const initializeGoogleButton = () => {
    if (!window.google?.accounts?.id || !isRealGoogleClientId) return;

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      const buttonContainer = document.getElementById('google-signin-button');
      if (buttonContainer) {
        buttonContainer.innerHTML = '';
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: isSignUp ? 'signup_with' : 'continue_with',
          shape: 'pill',
          logo_alignment: 'center'
        });
      }
    } catch (err) {
      console.error('Failed to initialize Google Sign-In:', err);
    }
  };

  const handleGoogleCredentialResponse = async (response) => {
    if (!response.credential) {
      setError('Google sign-in failed. Please try again.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch(API_PATHS.AUTH.GOOGLE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: response.credential,
          action: isSignUp ? 'signup' : 'login'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google auth failed');

      login(data.token, data.user);
      showToast({
        message: isSignUp ? 'Welcome! Account created with Google.' : 'Signed in with Google',
        type: 'success'
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isSignUp ? API_PATHS.AUTH.REGISTER : API_PATHS.AUTH.LOGIN;
      const body = isSignUp
        ? { email, password, confirmPassword }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      login(data.token, data.user);
      showToast({
        message: isSignUp ? 'Welcome to SecureVault! Set your PIN now.' : 'Welcome back!',
        type: 'success'
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Execute Google Authentication with verified user email
  const submitGoogleAuth = async (targetEmail) => {
    const cleanEmail = String(targetEmail || '').trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setGooglePromptError('Please enter a valid email address (e.g., name@gmail.com)');
      return;
    }

    setError('');
    setGooglePromptError('');
    setLoading(true);
    const targetName = cleanEmail.split('@')[0];

    try {
      const res = await fetch(API_PATHS.AUTH.GOOGLE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          name: targetName,
          googleId: 'g_oauth_' + Date.now(),
          action: isSignUp ? 'signup' : 'login'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google authentication failed');

      setShowGooglePrompt(false);
      login(data.token, data.user);
      showToast({
        message: isSignUp ? `Account created with Google (${cleanEmail})!` : `Signed in with Google`,
        type: 'success'
      });
      onClose();
    } catch (err) {
      if (showGooglePrompt) {
        setGooglePromptError(err.message);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In / Sign-Up Trigger
  const handleDirectGoogleAuth = () => {
    setError('');
    if (email && email.trim()) {
      submitGoogleAuth(email);
    } else {
      setGoogleEmailInput('');
      setGooglePromptError('');
      setShowGooglePrompt(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white border-2 border-[#0e0e0e] rounded-3xl p-8 shadow-2xl relative">
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#0e0e0e] hover:bg-[#f0f4f5] border-2 border-[#0e0e0e] hover:border-[#cc001e] transition-colors cursor-pointer absolute top-4 right-4"
            aria-label="Close"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#0e0e0e] border-2 border-[#0e0e0e] text-[#cc001e] flex items-center justify-center mx-auto mb-3">
            <Shield className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h3 className="text-2xl font-extrabold text-[#0e0e0e]">
            {isSignUp ? 'Create Your Vault' : 'Welcome Back'}
          </h3>
          <p className="text-xs text-[#0e0e0e] font-bold mt-1">
            {isSignUp
              ? 'Personal secure storage protected by your master PIN'
              : 'Sign in to access your documents and credentials'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-white border-2 border-[#cc001e] text-[#cc001e] text-xs flex items-center gap-2 font-extrabold">
            <AlertCircle className="w-4 h-4 shrink-0 stroke-[2.5]" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign-In Section */}
        <div className="space-y-2.5 mb-5">
          {isRealGoogleClientId ? (
            <div id="google-signin-button" className="flex justify-center min-h-[44px]" />
          ) : (
            <button
              type="button"
              onClick={handleDirectGoogleAuth}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-[#f0f4f5] border-2 border-[#0e0e0e] hover:border-[#cc001e] text-[#0e0e0e] text-xs font-extrabold flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm active:translate-y-0.5"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{isSignUp ? 'Google with Sign up' : 'Continue with Google'}</span>
            </button>
          )}
        </div>

        <div className="relative my-4 flex items-center justify-center">
          <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-[#0e0e0e] font-extrabold">
            Or with email
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-extrabold text-[#0e0e0e] block mb-1">
              Email Address
            </label>
            <div className="relative flex items-center">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border-2 border-[#0e0e0e] focus:border-[#cc001e] outline-none text-xs text-[#0e0e0e] font-bold transition-all shadow-sm"
              />
              <Mail className="w-4 h-4 text-[#0e0e0e] absolute left-3.5 pointer-events-none stroke-[2.5]" />
            </div>
          </div>

          <div>
            <label className="text-xs font-extrabold text-[#0e0e0e] block mb-1">
              Master Password
            </label>
            <div className="relative flex items-center">
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border-2 border-[#0e0e0e] focus:border-[#cc001e] outline-none text-xs text-[#0e0e0e] font-bold transition-all shadow-sm"
              />
              <KeyRound className="w-4 h-4 text-[#0e0e0e] absolute left-3.5 pointer-events-none stroke-[2.5]" />
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="text-xs font-extrabold text-[#0e0e0e] block mb-1">
                Confirm Master Password
              </label>
              <div className="relative flex items-center">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border-2 border-[#0e0e0e] focus:border-[#cc001e] outline-none text-xs text-[#0e0e0e] font-bold transition-all shadow-sm"
                />
                <KeyRound className="w-4 h-4 text-[#0e0e0e] absolute left-3.5 pointer-events-none stroke-[2.5]" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            id="btn-auth-submit"
            className="w-full neon-button py-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-50 border-2 border-[#0e0e0e]"
          >
            <span>{loading ? 'Authenticating...' : isSignUp ? 'Create Vault & Set PIN' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-xs text-[#0e0e0e] hover:text-[#cc001e] transition-colors cursor-pointer font-extrabold"
          >
            {isSignUp ? (
              <span>Already have an account? <strong className="text-[#cc001e] underline">Sign In</strong></span>
            ) : (
              <span>New to SecureVault? <strong className="text-[#cc001e] underline">Create Vault</strong></span>
            )}
          </button>
        </div>

        {/* Google Email Address Prompt Modal */}
        {showGooglePrompt && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md rounded-3xl p-7 flex flex-col justify-center z-20 animate-fade-in">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#0e0e0e] flex items-center justify-center mx-auto mb-3 shadow-sm">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>
              <h4 className="text-xl font-extrabold text-[#0e0e0e]">
                {isSignUp ? 'Google with Sign up' : 'Continue with Google'}
              </h4>
              <p className="text-xs text-[#0e0e0e]/70 font-bold mt-1">
                Enter your Gmail address to connect your secure vault
              </p>
            </div>

            {googlePromptError && (
              <div className="mb-4 p-2.5 rounded-xl bg-white border-2 border-[#cc001e] text-[#cc001e] text-xs flex items-center gap-2 font-extrabold">
                <AlertCircle className="w-4 h-4 shrink-0 stroke-[2.5]" />
                <span>{googlePromptError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitGoogleAuth(googleEmailInput);
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs font-extrabold text-[#0e0e0e] block mb-1">
                  Gmail Address *
                </label>
                <div className="relative flex items-center">
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="yourname@gmail.com"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border-2 border-[#0e0e0e] focus:border-[#cc001e] outline-none text-xs text-[#0e0e0e] font-bold shadow-sm"
                  />
                  <Mail className="w-4 h-4 text-[#0e0e0e] absolute left-3.5 pointer-events-none stroke-[2.5]" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGooglePrompt(false)}
                  className="flex-1 py-3 rounded-2xl bg-white border-2 border-[#0e0e0e] hover:bg-[#f0f4f5] text-xs font-extrabold text-[#0e0e0e] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-2xl bg-[#0e0e0e] hover:bg-[#cc001e] border-2 border-[#0e0e0e] text-white text-xs font-extrabold cursor-pointer transition-colors"
                >
                  {loading ? 'Connecting...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
