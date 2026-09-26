import React, { useState, useEffect } from 'react';
import {
  X, Copy, Check, Eye, EyeOff, ShieldCheck, Download, Trash2,
  ExternalLink, Clock, KeyRound, FileText, Image as ImageIcon, ShieldAlert,
  Share2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function UnlockedItemModal({ item, onClose, onDeleteRequested, onShareRequested, showToast }) {
  const { token } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(30);

  // Auto-lock countdown timer (30s)
  useEffect(() => {
    if (!item) return;

    setSecondsRemaining(30);
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowPassword(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [item]);

  if (!item) return null;

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast({ message: `${fieldName} copied to clipboard`, type: 'success' });
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handleDownload = () => {
    if (!item.dataUrl) return;
    const a = document.createElement('a');
    a.href = item.dataUrl;
    a.download = item.fileName || `${item.title}.bin`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast({ message: 'File downloaded successfully', type: 'success' });
  };

  const isPassword = item.type === 'credential';
  const progressPercent = (secondsRemaining / 30) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-white border-2 border-[#0e0e0e] rounded-3xl p-8 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b-2 border-[#0e0e0e]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0e0e0e] border-2 border-[#0e0e0e] flex items-center justify-center text-[#cc001e] shrink-0">
              {isPassword ? (
                <KeyRound className="w-6 h-6 stroke-[2.5]" />
              ) : item.type === 'photo' ? (
                <ImageIcon className="w-6 h-6 stroke-[2.5]" />
              ) : item.type === 'secret' ? (
                <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <FileText className="w-6 h-6 stroke-[2.5]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-extrabold text-[#0e0e0e]">{item.title}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#cc001e] border border-[#0e0e0e] text-white uppercase tracking-wider">
                  Unlocked
                </span>
              </div>
              <p className="text-xs text-[#0e0e0e]/70 font-bold mt-0.5">
                {isPassword ? 'Saved Login Credential' : item.fileName || 'Verified Document'}
              </p>
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

        {/* Auto-lock countdown bar */}
        <div className="py-3">
          <div className="flex items-center justify-between text-xs text-[#0e0e0e] font-bold mb-1.5">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#cc001e] stroke-[2.5]" />
              Auto-locks in: <strong className="text-[#cc001e] font-extrabold">{secondsRemaining}s</strong>
            </span>
            <span className="text-[11px] text-[#0e0e0e]/70 font-bold">Protected Session</span>
          </div>
          <div className="w-full h-2.5 bg-[#f0f4f5] border-2 border-[#0e0e0e] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#cc001e] transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Integrity Check Banner */}
          <div className="p-3.5 rounded-2xl bg-[#f0f4f5] border-2 border-[#0e0e0e] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 text-[#0e0e0e] font-bold">
              <ShieldCheck className="w-4 h-4 text-[#cc001e] stroke-[2.5] shrink-0" />
              <span>Security Check: Verified & Original</span>
            </div>
            <span className="text-[10px] font-extrabold text-white uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#0e0e0e] border border-[#0e0e0e]">
              Verified
            </span>
          </div>

          {/* Conditional Content: Credential or File */}
          {isPassword ? (
            <div className="space-y-3">
              {/* Username / Email */}
              {item.username && (
                <div className="p-4 rounded-2xl bg-[#f0f4f5] border-2 border-[#0e0e0e] flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <label className="text-[10px] uppercase font-extrabold text-[#0e0e0e]/70 tracking-wider block mb-1">
                      Username / Email
                    </label>
                    <div className="text-sm font-bold text-[#0e0e0e] truncate font-mono">
                      {item.username}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(item.username, 'Username')}
                    className="p-2 rounded-xl bg-white hover:bg-[#f0f4f5] border-2 border-[#0e0e0e] hover:border-[#cc001e] text-[#0e0e0e] hover:text-[#cc001e] transition-all cursor-pointer shadow-sm shrink-0"
                    title="Copy Username"
                  >
                    {copiedField === 'Username' ? <Check className="w-4 h-4 text-[#cc001e] stroke-[2.5]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {/* Password */}
              <div className="p-4 rounded-2xl bg-white border-2 border-[#0e0e0e] flex items-center justify-between">
                <div className="min-w-0 pr-2 flex-1">
                  <label className="text-[10px] uppercase font-extrabold text-[#cc001e] tracking-wider block mb-1">
                    Password
                  </label>
                  <div className="text-lg font-mono font-extrabold tracking-wider text-[#0e0e0e] truncate select-all">
                    {showPassword ? item.password : '••••••••••••••••'}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 rounded-xl bg-[#f0f4f5] hover:bg-white border-2 border-[#0e0e0e] hover:border-[#cc001e] text-[#0e0e0e] transition-all cursor-pointer shadow-sm"
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleCopy(item.password, 'Password')}
                    className="neon-button p-2 rounded-xl cursor-pointer border-2 border-[#0e0e0e]"
                    title="Copy Password"
                  >
                    {copiedField === 'Password' ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4 stroke-[2.5]" />}
                  </button>
                </div>
              </div>

              {/* Website URL */}
              {item.url && (
                <div className="p-3.5 rounded-2xl bg-[#f0f4f5] border-2 border-[#0e0e0e] flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <span className="text-[#0e0e0e]/70 text-[10px] font-bold uppercase block mb-0.5">Website</span>
                    <a
                      href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#cc001e] hover:underline flex items-center gap-1 font-bold truncate"
                    >
                      {item.url}
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>
                </div>
              )}

              {/* Notes */}
              {item.notes && (
                <div className="p-4 rounded-2xl bg-[#f0f4f5] border-2 border-[#0e0e0e]">
                  <label className="text-[10px] uppercase font-extrabold text-[#0e0e0e]/70 tracking-wider block mb-1">
                    Saved Notes
                  </label>
                  <p className="text-xs text-[#0e0e0e] font-semibold whitespace-pre-wrap leading-relaxed">
                    {item.notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Photo preview */}
              {item.mimeType?.startsWith('image/') && item.dataUrl && (
                <div className="rounded-2xl overflow-hidden bg-[#f0f4f5] border-2 border-[#0e0e0e] flex items-center justify-center max-h-72 p-2">
                  <img
                    src={item.dataUrl}
                    alt={item.title}
                    className="max-h-64 object-contain rounded-xl"
                  />
                </div>
              )}

              {/* Text / Certificate content preview */}
              {item.textContent && (
                <div className="p-4 rounded-2xl bg-[#f0f4f5] border-2 border-[#0e0e0e]">
                  <label className="text-[10px] uppercase font-extrabold text-[#0e0e0e]/70 tracking-wider block mb-2">
                    Document Content
                  </label>
                  <pre className="text-xs text-[#0e0e0e] font-semibold whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto bg-white p-3 rounded-xl border-2 border-[#0e0e0e]">
                    {item.textContent}
                  </pre>
                </div>
              )}

              {/* File details */}
              <div className="p-4 rounded-2xl bg-[#f0f4f5] border-2 border-[#0e0e0e] grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#0e0e0e]/70 text-[10px] font-bold block">File Name</span>
                  <span className="text-[#0e0e0e] font-bold truncate block">{item.fileName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[#0e0e0e]/70 text-[10px] font-bold block">Format</span>
                  <span className="text-[#0e0e0e] font-bold">{item.mimeType || 'Document'}</span>
                </div>
              </div>

              {/* Download button */}
              {item.dataUrl && (
                <button
                  onClick={handleDownload}
                  className="w-full neon-button py-3.5 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer border-2 border-[#0e0e0e]"
                >
                  <Download className="w-4 h-4 stroke-[3]" />
                  <span>Download File</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions with border */}
        <div className="pt-4 border-t-2 border-[#0e0e0e] flex items-center justify-between gap-2 mt-2">
          <button
            onClick={() => onDeleteRequested(item)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white bg-[#0e0e0e] hover:bg-[#cc001e] border-2 border-[#0e0e0e] hover:border-[#cc001e] text-xs font-bold transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Share Document Button */}
            <button
              onClick={() => onShareRequested(item)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f0f4f5] hover:bg-white border-2 border-[#0e0e0e] hover:border-[#cc001e] text-[#0e0e0e] text-xs font-bold transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#cc001e] stroke-[2.5]" />
              <span>Share</span>
            </button>

            <button
              onClick={onClose}
              className="neon-button px-5 py-2 rounded-xl text-xs font-extrabold cursor-pointer border-2 border-[#0e0e0e]"
            >
              Done & Lock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
