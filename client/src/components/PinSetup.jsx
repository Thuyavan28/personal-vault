import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, CheckCircle2, Loader2, Sparkles, X } from 'lucide-react';
import { PinKeypad } from './PinKeypad';
import { useAuth } from '../context/AuthContext';
import { API_PATHS } from '../utils/apiPath';

export function PinSetup({ onComplete, onCancel, onClose, showToast }) {
  const { token, updateUser } = useAuth();
  const handleCancel = onCancel || onClose;
  const [step, setStep] = useState('enter'); // 'enter' | 'confirm'
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFirstPinComplete = (enteredPin) => {
    setFirstPin(enteredPin);
    setError('');
    setStep('confirm');
  };

  const handleConfirmPinComplete = async (enteredConfirmPin) => {
    if (firstPin !== enteredConfirmPin) {
      setError('PINs do not match. Please try setting your PIN again.');
      setFirstPin('');
      setConfirmPin('');
      setStep('enter');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(API_PATHS.PIN.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ pin: firstPin, confirmPin: enteredConfirmPin })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize PIN');
      }

      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        updateUser({ hasPin: true });
        showToast({ message: 'Security PIN configured successfully! Vault unlocked 🚀', type: 'success' });
        if (onComplete) onComplete();
      }, 350);
    } catch (err) {
      setError(err.message);
      setFirstPin('');
      setConfirmPin('');
      setStep('enter');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
      <div className={`w-full max-w-md bg-white border-2 rounded-3xl p-8 shadow-2xl relative transition-all duration-300 ${
        success
          ? 'border-[#cc001e] shadow-lg shadow-[#cc001e]/20'
          : loading
          ? 'border-[#cc001e]'
          : 'border-[#0e0e0e]'
      }`}>
        {handleCancel && !loading && !success && (
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 p-2 rounded-xl text-[#0e0e0e] hover:bg-[#f0f4f5] border-2 border-[#0e0e0e] hover:border-[#cc001e] transition-colors cursor-pointer"
            aria-label="Cancel PIN Setup"
            title="Cancel PIN Setup"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}

        <div className="text-center mb-6">
          <div className="relative inline-block mx-auto mb-4">
            {loading && (
              <div
                className="absolute -inset-2.5 rounded-3xl border-2 border-dashed border-[#cc001e] animate-spin pointer-events-none"
                style={{ animationDuration: '2s' }}
              />
            )}
            {success && (
              <>
                <div className="absolute -inset-3 rounded-3xl border-2 border-[#cc001e] animate-ripple-ring pointer-events-none" />
                <div
                  className="absolute -inset-6 rounded-3xl border border-[#cc001e]/60 animate-ripple-ring pointer-events-none"
                  style={{ animationDelay: '150ms' }}
                />
              </>
            )}

            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border-2 transition-all duration-300 relative z-10 ${
              success
                ? 'bg-[#cc001e] border-[#0e0e0e] text-white animate-unlock-pop shadow-xl'
                : loading
                ? 'bg-[#cc001e] border-[#0e0e0e] text-white shadow-lg'
                : 'bg-[#0e0e0e] border-[#0e0e0e] text-[#cc001e]'
            }`}>
              {success ? (
                <div className="relative flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5] animate-unlock-pop" />
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300 absolute -top-1.5 -right-1.5 animate-ping" />
                </div>
              ) : loading ? (
                <div className="relative flex items-center justify-center">
                  <Lock className="w-7 h-7 stroke-[2.5] animate-pulse text-white" />
                  <Loader2 className="w-9 h-9 animate-spin text-white absolute -inset-1" />
                </div>
              ) : (
                <Lock className="w-8 h-8 stroke-[2.5]" />
              )}
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold bg-[#cc001e] border-2 border-[#0e0e0e] text-white mb-2 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
            First-Time Security PIN Setup
          </div>

          <h2 className="text-2xl font-extrabold text-[#0e0e0e]">
            {success
              ? 'PIN Created Successfully!'
              : loading
              ? 'Securing Your Vault...'
              : step === 'enter'
              ? 'Enter 4-Digit Security PIN'
              : 'Confirm 4-Digit Security PIN'}
          </h2>
          <p className="text-xs text-[#0e0e0e] font-bold mt-1.5 max-w-xs mx-auto">
            {success
              ? 'Your master security PIN has been configured.'
              : loading
              ? 'Setting up your security PIN...'
              : step === 'enter'
              ? 'Choose a 4-digit PIN to protect your vault (Step 1 of 2).'
              : 'Re-enter your 4-digit PIN to confirm (Step 2 of 2).'}
          </p>

          {/* Step indicator pills */}
          {!loading && !success && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className={`h-2.5 rounded-full transition-all duration-300 border border-[#0e0e0e] ${
                step === 'enter' ? 'w-8 bg-[#cc001e]' : 'w-3 bg-white'
              }`} />
              <div className={`h-2.5 rounded-full transition-all duration-300 border border-[#0e0e0e] ${
                step === 'confirm' ? 'w-8 bg-[#cc001e]' : 'w-3 bg-white'
              }`} />
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-white border-2 border-[#cc001e] text-[#cc001e] text-xs flex items-center gap-2 font-extrabold animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 stroke-[2.5]" />
            <span>{error}</span>
          </div>
        )}

        {/* PIN Entry Area */}
        {step === 'enter' ? (
          <PinKeypad
            pin={firstPin}
            onChange={setFirstPin}
            onComplete={handleFirstPinComplete}
            disabled={loading || success}
            error={!!error}
            loading={loading}
            success={success}
            theme="default"
          />
        ) : (
          <PinKeypad
            pin={confirmPin}
            onChange={setConfirmPin}
            onComplete={handleConfirmPinComplete}
            disabled={loading || success}
            error={!!error}
            loading={loading}
            success={success}
            theme="default"
          />
        )}

        {/* Cancellation Button */}
        {handleCancel && !loading && !success && (
          <div className="mt-4 flex items-center justify-center">
            <button
              type="button"
              onClick={handleCancel}
              id="btn-cancel-pin-setup"
              className="w-full py-3 rounded-2xl bg-white border-2 border-[#0e0e0e] hover:bg-[#f0f4f5] hover:border-[#cc001e] text-xs font-extrabold text-[#0e0e0e] hover:text-[#cc001e] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
              <span>Cancel PIN Setup</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
