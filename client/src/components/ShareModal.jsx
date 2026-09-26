import React, { useState } from 'react';
import { X, Share2, Copy, Check, MessageSquare, Mail, Send } from 'lucide-react';

export function ShareModal({ item, isOpen, onClose, showToast }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !item) return null;

  const shareText = item.type === 'credential'
    ? `SecureVault Credential:\nService: ${item.title}\nUsername: ${item.username || 'N/A'}\nPassword: ${item.password || 'N/A'}`
    : `SecureVault Document: ${item.title} (${item.fileName || 'File'})`;

  // Native Web Share API
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: shareText
        });
        showToast({ message: 'Shared successfully', type: 'success' });
        onClose();
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    showToast({ message: 'Details copied to clipboard', type: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleEmail = () => {
    const url = `mailto:?subject=${encodeURIComponent(item.title)}&body=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white border-2 border-[#0e0e0e] rounded-3xl p-7 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0e0e0e] border-2 border-[#0e0e0e] flex items-center justify-center text-[#cc001e]">
              <Share2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#0e0e0e]">Share Item</h3>
              <p className="text-xs text-[#0e0e0e] font-bold">Send to third-party applications</p>
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

        {/* Item preview card with crisp border */}
        <div className="my-5 p-4 rounded-2xl bg-[#f0f4f5] border-2 border-[#0e0e0e] flex flex-col gap-1">
          <span className="text-sm font-extrabold text-[#0e0e0e]">{item.title}</span>
          <span className="text-xs text-[#0e0e0e] font-bold">
            {item.type === 'credential' ? `Username: ${item.username || 'N/A'}` : item.fileName || 'Attached Document'}
          </span>
        </div>

        {/* Share buttons with crisp borders */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {navigator.share && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="col-span-2 py-3 px-4 rounded-2xl bg-[#cc001e] text-white border-2 border-[#0e0e0e] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4 stroke-[2.5]" />
              <span>Share via System Dialog</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleWhatsApp}
            className="py-3 px-4 rounded-2xl bg-white hover:bg-[#f0f4f5] border-2 border-[#0e0e0e] text-[#0e0e0e] text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <MessageSquare className="w-4 h-4 stroke-[2.5] text-[#25D366]" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleTelegram}
            className="py-3 px-4 rounded-2xl bg-white hover:bg-[#f0f4f5] border-2 border-[#0e0e0e] text-[#0e0e0e] text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Send className="w-4 h-4 stroke-[2.5] text-[#0088cc]" />
            <span>Telegram</span>
          </button>

          <button
            type="button"
            onClick={handleEmail}
            className="py-3 px-4 rounded-2xl bg-white hover:bg-[#f0f4f5] border-2 border-[#0e0e0e] hover:border-[#cc001e] text-[#0e0e0e] text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Mail className="w-4 h-4 stroke-[2.5] text-[#cc001e]" />
            <span>Email</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="py-3 px-4 rounded-2xl bg-white hover:bg-[#f0f4f5] border-2 border-[#0e0e0e] hover:border-[#cc001e] text-[#0e0e0e] text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-[#cc001e] stroke-[2.5]" /> : <Copy className="w-4 h-4 text-[#0e0e0e] stroke-[2.5]" />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-white border-2 border-[#0e0e0e] hover:border-[#cc001e] text-xs font-extrabold text-[#0e0e0e] hover:text-[#cc001e] transition-colors cursor-pointer shadow-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}
