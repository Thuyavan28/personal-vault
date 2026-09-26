import React, { useState, useEffect } from 'react';
import { Lock, Unlock, AlertCircle, X, ShieldAlert, Clock, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { PinKeypad } from './PinKeypad';
import { useAuth } from '../context/AuthContext';
import { API_PATHS } from '../utils/apiPath';

export function PinModal({
  item,
  isOpen,
  onClose,
  onUnlocked,
  title = 'Enter Security PIN',
  description = 'Enter your 4-digit PIN to access this item'
}) {
  const { token, unlockSession } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setLoading(false);
      setSuccess(false);
      checkPinStatus();
    }
  }, [isOpen]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  const checkPinStatus = async () => {
    try {
      const res = await fetch(API_PATHS.PIN.STATUS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.isLocked && data.remainingSeconds > 0) {
        setLockoutRemaining(data.remainingSeconds);
        setError(`Vault is temporarily locked. Retry in ${data.remainingSeconds}s.`);
      }
    } catch {
      // Ignore
    }
  };

  const handleUnlock = async (enteredPin) => {
    if (lockoutRemaining > 0) return;

    setLoading(true);
    setError('');

    try {
      if (item) {
        const res = await fetch(API_PATHS.VAULT.UNLOCK_ITEM(item.id), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ pin: enteredPin })
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.isLocked) {
            setLockoutRemaining(data.remainingSeconds || 30);
          }
          throw new Error(data.error || 'Failed to unlock item');
        }

        setLoading(false);
        setSuccess(true);
        setTimeout(() => {
          onUnlocked(data.item);
          if (onClose) onClose();
        }, 300);
      } else {
        const res = await fetch(API_PATHS.PIN.VERIFY, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ pin: enteredPin })
        });

        const data = await res.json();
        if (!res.ok) {
          if (data.isLocked) {
            setLockoutRemaining(data.remainingSeconds || 30);
          }
          throw new Error(data.error || 'Incorrect security PIN');
        }

        setLoading(false);
        setSuccess(true);
        setTimeout(() => {
          unlockSession();
          if (onUnlocked) onUnlocked();
          if (onClose) onClose();
        }, 300);
      }
    } catch (err) {
      setError(err.message);
      setPin('');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-sm bg-white border-2 rounded-3xl p-7 shadow-2xl relative transition-all duration-300 ${
        success
          ? 'border-[#cc001e] animate-success-glow'
          : loading
          ? 'border-[#cc001e]'
          : 'border-[#0e0e0e]'
      }`}>
        {onClose && !loading && !success && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-[#0e0e0e] hover:bg-[#f0f4f5] border-2 border-[#0e0e0e] hover:border-[#cc001e] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}

        <div className="text-center mb-4">
          <div className="relative inline-block mx-auto mb-3">
            {/* Outer animated rings during Loading & Success */}
            {loading && (
              <div
                className="absolute -inset-2.5 rounded-3xl border-2 border-dashed border-[#cc001e] animate-spin pointer-events-none"
                style={{ animationDuration: '3s' }}
              />
            )}
            {success && (
              <>
                <div className="absolute -inset-3 rounded-3xl border-2 border-[#cc001e] animate-ripple-ring pointer-events-none" />
                <div
                  className="absolute -inset-6 rounded-3xl border border-[#cc001e]/60 animate-ripple-ring pointer-events-none"
                  style={{ animationDelay: '200ms' }}
                />
              </>
            )}

            <div
              className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border-2 transition-all duration-300 relative z-10 ${
                success
                  ? 'bg-[#cc001e] border-[#0e0e0e] text-white animate-unlock-pop shadow-xl'
                  : loading
                  ? 'bg-[#cc001e] border-[#0e0e0e] text-white shadow-lg'
                  : lockoutRemaining > 0
                  ? 'bg-[#0e0e0e] border-[#0e0e0e] text-[#cc001e]'
                  : 'bg-[#0e0e0e] border-[#0e0e0e] text-[#cc001e]'
              }`}
            >
              {success ? (
                <div className="relative flex items-center justify-center">
                  <Unlock className="w-8 h-8 stroke-[2.5] animate-unlock-pop" />
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300 absolute -top-1.5 -right-1.5 animate-ping" />
                </div>
              ) : loading ? (
                <div className="relative flex items-center justify-center">
                  <Lock className="w-7 h-7 stroke-[2.5] animate-pulse text-white" />
                  <Loader2 className="w-9 h-9 animate-spin text-white absolute -inset-1" />
                </div>
              ) : lockoutRemaining > 0 ? (
                <ShieldAlert className="w-8 h-8 stroke-[2.5]" />
              ) : (
                <Lock className="w-8 h-8 stroke-[2.5]" />
              )}
            </div>
          </div>

          <h3 className="text-2xl font-extrabold text-[#0e0e0e] transition-all">
            {success
              ? 'Access Granted!'
              : loading
              ? 'Verifying Security PIN...'
              : item
              ? item.title
              : title}
          </h3>

          <div className="flex items-center justify-center mt-1 min-h-[22px]">
            {success ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#cc001e] bg-[#cc001e]/10 px-3 py-1 rounded-full border border-[#cc001e]/30 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                PIN Verified • Opening vault...
              </span>
            ) : loading ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0e0e0e] animate-pulse">
                <span className="w-2 h-2 rounded-full bg-[#cc001e] animate-ping" />
                Validating security credentials...
              </span>
            ) : lockoutRemaining > 0 ? (
              <span className="text-xs text-[#0e0e0e] font-bold">
                Security Lockout active to prevent unauthorized access.
              </span>
            ) : (
              <p className="text-xs text-[#0e0e0e] font-bold">
                {item ? 'Protected Item • Enter PIN to view' : description}
              </p>
            )}
          </div>
        </div>

        {/* Lockout countdown */}
        {lockoutRemaining > 0 && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[#0e0e0e] border-2 border-[#0e0e0e] text-white text-xs flex items-center gap-3 font-extrabold">
            <Clock className="w-5 h-5 text-[#cc001e] shrink-0 stroke-[2.5]" />
            <div>
              <p className="font-extrabold">Temporarily Locked</p>
              <p className="text-[11px] text-white/80">Please wait {lockoutRemaining}s before trying again.</p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && lockoutRemaining <= 0 && (
          <div className="mb-4 p-3 rounded-2xl bg-white border-2 border-[#cc001e] text-[#cc001e] text-xs flex items-center gap-2 font-extrabold animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#cc001e] stroke-[2.5]" />
            <span>{error}</span>
          </div>
        )}

        {/* Keypad */}
        <PinKeypad
          pin={pin}
          onChange={setPin}
          onComplete={handleUnlock}
          disabled={loading || success || lockoutRemaining > 0}
          error={!!error}
          loading={loading}
          success={success}
        />

        {/* Cancellation Button */}
        {onClose && !loading && !success && (
          <div className="mt-4 flex items-center justify-center">
            <button
              type="button"
              onClick={onClose}
              id="btn-cancel-pin-modal"
              className="w-full py-3 rounded-2xl bg-white border-2 border-[#0e0e0e] hover:bg-[#f0f4f5] hover:border-[#cc001e] text-xs font-extrabold text-[#0e0e0e] hover:text-[#cc001e] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
              <span>Cancel</span>
            </button>
          </div>
        )}

        <div className="mt-4 text-center">
          <span className="text-xs text-[#0e0e0e] font-extrabold">
            5 incorrect attempts will temporarily lock the vault
          </span>
        </div>
      </div>
    </div>
  );
}
