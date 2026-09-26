import React, { useState, useEffect, useCallback } from 'react';
import { Delete, RotateCcw, Check } from 'lucide-react';

export function PinKeypad({
  pin,
  onChange,
  onComplete,
  maxLength = 4,
  disabled = false,
  error = false,
  loading = false,
  success = false,
  theme = 'default' // 'default' | 'orange'
}) {
  const [activeKey, setActiveKey] = useState(null);

  const isOrange = theme === 'orange';
  const primaryColor = isOrange ? '#f97316' : '#cc001e';
  const primaryGlow = isOrange ? 'rgba(249, 115, 22, 0.3)' : 'rgba(204, 0, 30, 0.3)';

  const handleDigit = useCallback((digit) => {
    if (disabled) return;
    setActiveKey(digit);
    setTimeout(() => setActiveKey(null), 120);

    if (pin.length < maxLength) {
      const nextPin = pin + digit;
      onChange(nextPin);
      if (nextPin.length === maxLength && onComplete) {
        onComplete(nextPin);
      }
    }
  }, [pin, maxLength, onChange, onComplete, disabled]);

  const handleBackspace = useCallback(() => {
    if (disabled) return;
    setActiveKey('back');
    setTimeout(() => setActiveKey(null), 120);
    onChange(pin.slice(0, -1));
  }, [pin, onChange, disabled]);

  const handleClear = useCallback(() => {
    if (disabled) return;
    setActiveKey('clear');
    setTimeout(() => setActiveKey(null), 120);
    onChange('');
  }, [onChange, disabled]);

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (disabled) return;
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, handleDigit, handleBackspace, handleClear]);

  return (
    <div className="flex flex-col items-center select-none w-full max-w-[280px] mx-auto">
      {/* 4 Animated PIN Dot Indicators */}
      <div className={`relative flex flex-col items-center my-4 transition-transform ${error ? 'animate-shake' : ''}`}>
        <div className="flex items-center justify-center gap-4">
          {Array.from({ length: maxLength }).map((_, idx) => {
            const isFilled = idx < pin.length;
            const isCurrent = idx === pin.length;

            if (success) {
              return (
                <div
                  key={idx}
                  className="relative flex items-center justify-center w-6 h-6 rounded-full border-2 border-[#0e0e0e] text-white shadow-md animate-unlock-pop"
                  style={{
                    backgroundColor: primaryColor,
                    animationDelay: `${idx * 60}ms`
                  }}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3] animate-check-draw" />
                </div>
              );
            }

            if (loading) {
              return (
                <div key={idx} className="relative flex items-center justify-center">
                  <div
                    className={`w-4 h-4 rounded-full border-2 border-[#0e0e0e] animate-pin-wave-${idx}`}
                    style={{ backgroundColor: primaryColor }}
                  />
                </div>
              );
            }

            return (
              <div key={idx} className="relative flex items-center justify-center">
                {isFilled && (
                  <div
                    className="absolute w-6 h-6 rounded-full animate-ping opacity-60 pointer-events-none"
                    style={{ backgroundColor: primaryGlow }}
                  />
                )}
                <div
                  className={`w-4 h-4 rounded-full transition-all duration-200 transform border-2 ${
                    isFilled
                      ? 'border-[#0e0e0e] scale-125'
                      : isCurrent
                      ? 'bg-white scale-110'
                      : 'bg-[#f0f4f5] border-[#0e0e0e]'
                  }`}
                  style={{
                    backgroundColor: isFilled ? primaryColor : undefined,
                    borderColor: isCurrent ? primaryColor : undefined
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Scan Line during Loading / Status text */}
        <div className="h-3 mt-2.5 flex items-center justify-center">
          {loading ? (
            <div className="w-32 h-1 rounded-full bg-[#0e0e0e]/10 overflow-hidden relative">
              <div
                className="w-1/2 h-full rounded-full animate-pin-scanner shadow-sm"
                style={{ backgroundColor: primaryColor }}
              />
            </div>
          ) : success ? (
            <div
              className="text-[10px] font-extrabold uppercase tracking-widest animate-fade-in flex items-center gap-1"
              style={{ color: primaryColor }}
            >
              • Access Granted •
            </div>
          ) : null}
        </div>
      </div>

      {/* Tactile Keypad Grid with Distinct Borders */}
      <div className={`grid grid-cols-3 gap-3 w-full transition-opacity duration-200 ${loading || success ? 'opacity-40 pointer-events-none' : ''}`}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const strNum = String(num);
          const isPressed = activeKey === strNum;

          return (
            <button
              key={num}
              type="button"
              disabled={disabled}
              onClick={() => handleDigit(strNum)}
              style={isPressed ? { backgroundColor: primaryColor, borderColor: '#0e0e0e', color: '#fff' } : {}}
              className={`h-14 rounded-2xl bg-white hover:bg-[#f0f4f5] active:scale-90 text-[#0e0e0e] text-2xl font-extrabold transition-all duration-150 flex items-center justify-center border-2 border-[#0e0e0e] ${
                isOrange ? 'hover:border-[#f97316]' : 'hover:border-[#cc001e]'
              } shadow-sm cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${
                isPressed ? 'scale-90' : ''
              }`}
            >
              {num}
            </button>
          );
        })}

        {/* Clear Button */}
        <button
          type="button"
          disabled={disabled || pin.length === 0}
          onClick={handleClear}
          title="Clear"
          className={`h-14 rounded-2xl bg-[#f0f4f5] hover:bg-white active:scale-90 text-[#0e0e0e] ${
            isOrange ? 'hover:text-[#f97316] hover:border-[#f97316]' : 'hover:text-[#cc001e] hover:border-[#cc001e]'
          } transition-all flex items-center justify-center cursor-pointer border-2 border-[#0e0e0e] shadow-sm disabled:opacity-30 disabled:pointer-events-none`}
        >
          <RotateCcw className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Zero */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleDigit('0')}
          style={activeKey === '0' ? { backgroundColor: primaryColor, borderColor: '#0e0e0e', color: '#fff' } : {}}
          className={`h-14 rounded-2xl bg-white hover:bg-[#f0f4f5] active:scale-90 text-[#0e0e0e] text-2xl font-extrabold transition-all duration-150 flex items-center justify-center border-2 border-[#0e0e0e] ${
            isOrange ? 'hover:border-[#f97316]' : 'hover:border-[#cc001e]'
          } shadow-sm cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${
            activeKey === '0' ? 'scale-90' : ''
          }`}
        >
          0
        </button>

        {/* Backspace Button */}
        <button
          type="button"
          disabled={disabled || pin.length === 0}
          onClick={handleBackspace}
          title="Backspace"
          className={`h-14 rounded-2xl bg-[#f0f4f5] hover:bg-white active:scale-90 text-[#0e0e0e] ${
            isOrange ? 'hover:text-[#f97316] hover:border-[#f97316]' : 'hover:text-[#cc001e] hover:border-[#cc001e]'
          } transition-all flex items-center justify-center cursor-pointer border-2 border-[#0e0e0e] shadow-sm disabled:opacity-30 disabled:pointer-events-none`}
        >
          <Delete className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
