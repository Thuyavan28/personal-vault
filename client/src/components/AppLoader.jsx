import React, { useState, useEffect } from 'react';
import { Shield, Lock } from 'lucide-react';

export function AppLoader({ onFinish }) {
  const [progress, setProgress] = useState(15);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setProgress(55), 300);
    const timer2 = setTimeout(() => setProgress(90), 650);
    const timer3 = setTimeout(() => {
      setProgress(100);
      setIsFading(true);
    }, 1000);
    const timer4 = setTimeout(() => {
      onFinish();
    }, 1250);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f0f4f5] transition-opacity duration-300 ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-[#0e0e0e] border-2 border-[#0e0e0e] flex items-center justify-center">
          <Shield className="w-10 h-10 text-[#cc001e] animate-pulse stroke-[2.5]" />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#cc001e] border-2 border-[#0e0e0e] rounded-full flex items-center justify-center">
            <Lock className="w-3.5 h-3.5 text-white stroke-[2.5]" />
          </div>
        </div>
      </div>

      <div className="text-center space-y-1 mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#0e0e0e]">
          Secure<span className="text-[#cc001e]">Vault</span>
        </h1>
        <p className="text-xs text-[#0e0e0e] font-bold tracking-wide">
          Initializing Secure Environment...
        </p>
      </div>

      {/* Sleek loading bar with border */}
      <div className="w-48 h-2.5 bg-white border-2 border-[#0e0e0e] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#cc001e] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
