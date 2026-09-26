import React from 'react';
import { FileText, Image as ImageIcon, KeyRound, ShieldAlert, Lock, ArrowUpRight, Hash } from 'lucide-react';

export function VaultCard({ item, onSelect }) {
  const getItemIcon = (type) => {
    switch (type) {
      case 'document':
        return <FileText className="w-5 h-5 text-[#cc001e]" />;
      case 'photo':
        return <ImageIcon className="w-5 h-5 text-[#cc001e]" />;
      case 'credential':
        return <KeyRound className="w-5 h-5 text-[#cc001e]" />;
      case 'secret':
        return <ShieldAlert className="w-5 h-5 text-[#cc001e]" />;
      default:
        return <FileText className="w-5 h-5 text-[#cc001e]" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'document': return 'Document';
      case 'photo': return 'Photo';
      case 'credential': return 'Password';
      case 'secret': return 'Secret File';
      default: return 'Vault Item';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return null;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div
      onClick={() => onSelect(item)}
      className="group bg-white border-2 border-[#0e0e0e] hover:border-[#cc001e] rounded-3xl p-6 shadow-sm hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Header: Icon, Type & Locked pill with borders */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0e0e0e] border-2 border-[#0e0e0e] flex items-center justify-center text-[#cc001e] group-hover:scale-105 transition-transform">
              {getItemIcon(item.type)}
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#0e0e0e] group-hover:text-[#cc001e] transition-colors">
              {getTypeLabel(item.type)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0f4f5] border-2 border-[#0e0e0e] text-[#0e0e0e] font-extrabold group-hover:border-[#cc001e] group-hover:text-[#cc001e] transition-all text-xs">
            <Lock className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold tracking-wide">Locked</span>
          </div>
        </div>

        {/* Title in bold black */}
        <h3 className="text-lg font-extrabold text-[#0e0e0e] group-hover:text-[#cc001e] transition-colors line-clamp-1 mb-2">
          {item.title}
        </h3>

        {/* Masked Preview Area with border */}
        <div className="my-3 p-3.5 rounded-2xl bg-[#f0f4f5] border-2 border-[#0e0e0e] group-hover:border-[#cc001e] flex items-center justify-between text-xs transition-colors">
          <div className="flex items-center gap-2 text-[#0e0e0e] font-bold">
            <Lock className="w-3.5 h-3.5 text-[#cc001e]" />
            <span className="font-mono tracking-widest text-[#cc001e] text-sm font-extrabold">••••••••</span>
          </div>
          <span className="text-[11px] text-[#0e0e0e] uppercase tracking-wider font-extrabold group-hover:text-[#cc001e] transition-colors">
            Tap to Unlock
          </span>
        </div>

        {/* Description in readable black */}
        {item.description && (
          <p className="text-xs text-[#0e0e0e]/80 font-bold line-clamp-2 mb-2 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Tags with clean border */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {item.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-[#f0f4f5] text-[#0e0e0e] border-2 border-[#0e0e0e]"
              >
                <Hash className="w-2.5 h-2.5 text-[#cc001e]" />
                {tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-[10px] text-[#0e0e0e]/70 py-1 font-bold">
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer info with top border effect */}
      <div className="mt-5 pt-3 border-t-2 border-[#0e0e0e] flex items-center justify-between text-[11px] text-[#0e0e0e] font-extrabold">
        <span>{formattedDate}</span>
        <div className="flex items-center gap-1 text-[#cc001e] font-extrabold group-hover:translate-x-0.5 transition-transform">
          <span>{item.fileSize ? formatFileSize(item.fileSize) : 'PIN Protected'}</span>
          <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      </div>
    </div>
  );
}
