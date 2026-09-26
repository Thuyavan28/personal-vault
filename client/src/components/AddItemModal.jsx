import React, { useState, useRef, useEffect } from 'react';
import {
  X, UploadCloud, KeyRound, FileText, Image as ImageIcon, ShieldAlert,
  Sparkles, RefreshCw, Eye, EyeOff, Check, File, Trash2, CheckCircle2,
  ShieldCheck, ArrowRight, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_PATHS } from '../utils/apiPath';

export function AddItemModal({
  isOpen,
  onClose,
  initialCategory = 'all',
  onItemAdded,
  showToast
}) {
  const { token } = useAuth();

  // Normalize initial category
  const isCategoryLocked = initialCategory && initialCategory !== 'all';

  // Current item type: 'document' | 'photo' | 'credential' | 'secret'
  const [selectedType, setSelectedType] = useState(() => {
    if (initialCategory && initialCategory !== 'all') return initialCategory;
    return 'document';
  });

  // Document / Photo / Secret file fields
  const [docTitle, setDocTitle] = useState('');
  const [docDesc, setDocDesc] = useState('');
  const [docTags, setDocTags] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Credential fields
  const [credTitle, setCredTitle] = useState('');
  const [credUsername, setCredUsername] = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [credUrl, setCredUrl] = useState('');
  const [credNotes, setCredNotes] = useState('');
  const [credTags, setCredTags] = useState('');
  const [showCredPassword, setShowCredPassword] = useState(false);

  // Password Generator State
  const [showGenerator, setShowGenerator] = useState(false);
  const [passLength, setPassLength] = useState(16);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Animated Success State
  const [successItem, setSuccessItem] = useState(null);

  // Synchronize category selection when modal is opened or initialCategory changes
  useEffect(() => {
    if (isOpen) {
      if (initialCategory && initialCategory !== 'all') {
        setSelectedType(initialCategory);
      } else {
        setSelectedType('document');
      }
      handleResetForm();
    }
  }, [isOpen, initialCategory]);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setSuccessItem(null);
    setDocTitle('');
    setDocDesc('');
    setDocTags('');
    setSelectedFile(null);
    setCredTitle('');
    setCredUsername('');
    setCredPassword('');
    setCredUrl('');
    setCredNotes('');
    setCredTags('');
    setError('');
    setShowGenerator(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDoneClose = () => {
    handleResetForm();
    onClose();
  };

  // Generate strong password
  const generatePassword = () => {
    const lowers = 'abcdefghijklmnopqrstuvwxyz';
    const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    let chars = lowers + uppers;
    if (includeNumbers) chars += numbers;
    if (includeSymbols) chars += symbols;

    let result = '';
    const array = new Uint32Array(passLength);
    crypto.getRandomValues(array);
    for (let i = 0; i < passLength; i++) {
      result += chars[array[i] % chars.length];
    }
    setCredPassword(result);
    setShowCredPassword(true);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!docTitle) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      if (!isCategoryLocked && file.type.startsWith('image/')) {
        setSelectedType('photo');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!docTitle) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      if (!isCategoryLocked && file.type.startsWith('image/')) {
        setSelectedType('photo');
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Category Configuration Details
  const getCategoryDetails = () => {
    switch (selectedType) {
      case 'photo':
        return {
          title: 'Add Photo',
          subtitle: 'Upload and encrypt personal photos and images',
          titleLabel: 'Photo Title *',
          titlePlaceholder: 'e.g., Passport Photo, ID Card, Vacation Photo',
          fileLabel: 'Selected Photo *',
          dropzoneText: 'Drag & drop your photo here, or browse',
          dropzoneHint: 'JPG, PNG, WebP, GIF, SVG up to 25MB',
          accept: 'image/*',
          tagsPlaceholder: 'id, personal, memory',
          submitText: 'Save Photo to Vault',
          icon: ImageIcon
        };
      case 'secret':
        return {
          title: 'Add Secret File',
          subtitle: 'Store encrypted private keys, tokens, and confidential archives',
          titleLabel: 'Secret File Title *',
          titlePlaceholder: 'e.g., SSH Private Key, Backup Seed, Recovery Archive',
          fileLabel: 'Selected Secret File *',
          dropzoneText: 'Drag & drop secret file here, or browse',
          dropzoneHint: 'Keys, PEM, Archives, Credentials up to 25MB',
          accept: '*',
          tagsPlaceholder: 'key, private, backup, recovery',
          submitText: 'Save Secret File to Vault',
          icon: ShieldAlert
        };
      case 'credential':
        return {
          title: 'Add Password / Login',
          subtitle: 'Secure credential and account password storage',
          titleLabel: 'Title / Service Name *',
          titlePlaceholder: 'e.g., Google Account, GitHub, Online Banking',
          tagsPlaceholder: 'work, personal, banking',
          submitText: 'Save Password to Vault',
          icon: KeyRound
        };
      case 'document':
      default:
        return {
          title: isCategoryLocked ? 'Add Document' : 'Add Vault Item',
          subtitle: isCategoryLocked
            ? 'Secure personal PDF, Word, and text document storage'
            : 'Secure personal document and credential storage',
          titleLabel: 'Document Title *',
          titlePlaceholder: 'e.g., Certificate, Contract, Passport, Medical Record',
          fileLabel: 'Selected Document *',
          dropzoneText: 'Drag & drop your document here, or browse',
          dropzoneHint: 'PDF, Word, Excel, CSV, Text up to 25MB',
          accept: '.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.rtf',
          tagsPlaceholder: 'cert, academic, official, legal',
          submitText: 'Save Document to Vault',
          icon: FileText
        };
    }
  };

  const details = getCategoryDetails();

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (selectedType === 'credential') {
        if (!credTitle.trim()) throw new Error('Please enter a credential title.');
        if (!credPassword) throw new Error('Please enter or generate a password.');

        const res = await fetch(API_PATHS.VAULT.CREATE_CREDENTIAL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title: credTitle.trim(),
            username: credUsername.trim(),
            password: credPassword,
            url: credUrl.trim(),
            notes: credNotes.trim(),
            tags: credTags.trim()
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save credential');

        setSuccessItem({
          title: credTitle.trim(),
          type: 'credential',
          username: credUsername.trim(),
          isDocument: false
        });
        showToast({ message: 'Password encrypted & saved to vault! 🛡️', type: 'success' });
        onItemAdded();
      } else {
        if (!docTitle.trim()) throw new Error('Please enter an item title.');
        if (!selectedFile) throw new Error('Please select a file to store.');

        const formData = new FormData();
        formData.append('title', docTitle.trim());
        formData.append('type', selectedType);
        formData.append('description', docDesc.trim());
        formData.append('tags', docTags.trim());
        formData.append('file', selectedFile);

        const res = await fetch(API_PATHS.VAULT.UPLOAD_ITEM, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to upload item');

        setSuccessItem({
          title: docTitle.trim(),
          type: selectedType,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          isDocument: true
        });

        const label = selectedType === 'photo' ? 'Photo' : selectedType === 'secret' ? 'Secret file' : 'Document';
        showToast({ message: `${label} encrypted & saved to vault! 🛡️`, type: 'success' });
        onItemAdded();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-white border-2 border-[#0e0e0e] rounded-3xl p-7 sm:p-8 shadow-2xl relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0e0e0e] border-2 border-[#0e0e0e] flex items-center justify-center text-[#cc001e] shrink-0">
              <details.icon className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#0e0e0e]">{details.title}</h3>
              <p className="text-xs text-[#0e0e0e]/70 font-bold mt-0.5">
                {details.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={successItem ? handleDoneClose : onClose}
            className="p-2 rounded-xl text-[#0e0e0e] hover:bg-[#f0f4f5] border-2 border-[#0e0e0e] hover:border-[#cc001e] transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {successItem ? (
          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center animate-fade-in relative overflow-hidden">
            {/* Ambient Festive Glowing Blobs */}
            <div className="absolute top-4 left-6 w-40 h-40 rounded-full bg-[#cc001e]/10 blur-2xl pointer-events-none" />
            <div className="absolute bottom-4 right-6 w-40 h-40 rounded-full bg-red-100 blur-2xl pointer-events-none" />

            {/* Pulsing Animated Shield & Checkmark Badge */}
            <div className="relative my-4">
              <div className="w-20 h-20 rounded-3xl bg-[#0e0e0e] border-2 border-[#0e0e0e] text-[#cc001e] flex items-center justify-center shadow-xl animate-unlock-pop relative z-10">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>
              <div className="absolute -inset-3 rounded-3xl border-2 border-[#cc001e] animate-ripple-ring pointer-events-none" />
            </div>

            <h3 className="text-2xl font-extrabold text-[#0e0e0e] mt-1">
              {successItem.type === 'photo'
                ? 'Photo Secured Successfully!'
                : successItem.type === 'secret'
                ? 'Secret File Secured Successfully!'
                : successItem.isDocument
                ? 'Document Uploaded Successfully!'
                : 'Password Saved Successfully!'}
            </h3>
            <p className="text-xs text-[#0e0e0e]/70 font-bold max-w-sm mt-1">
              Your item has been encrypted client-side and saved into your secure personal vault.
            </p>

            {/* Item Preview Card */}
            <div className="w-full max-w-sm my-5 p-4 rounded-2xl bg-[#f0f4f5] border-2 border-[#0e0e0e] text-left flex items-center gap-3.5 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-[#0e0e0e] text-white flex items-center justify-center shrink-0 border border-[#0e0e0e]">
                {successItem.type === 'photo' ? (
                  <ImageIcon className="w-6 h-6 stroke-[2.5] text-[#cc001e]" />
                ) : successItem.type === 'secret' ? (
                  <ShieldAlert className="w-6 h-6 stroke-[2.5] text-[#cc001e]" />
                ) : successItem.isDocument ? (
                  <FileText className="w-6 h-6 stroke-[2.5] text-[#cc001e]" />
                ) : (
                  <KeyRound className="w-6 h-6 stroke-[2.5] text-[#cc001e]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-[#0e0e0e] truncate">{successItem.title}</p>
                <p className="text-[11px] text-[#0e0e0e]/60 font-bold truncate">
                  {successItem.fileName || successItem.username || 'Encrypted record'}
                  {successItem.fileSize ? ` • ${(successItem.fileSize / 1024).toFixed(1)} KB` : ''}
                </p>
              </div>
              <div className="shrink-0">
                <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-white border border-[#0e0e0e] text-[#cc001e]">
                  ✓ Secured
                </span>
              </div>
            </div>

            {/* Interactive Actions */}
            <div className="flex items-center gap-3 w-full max-w-sm pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="flex-1 py-3.5 rounded-2xl bg-white border-2 border-[#0e0e0e] hover:border-[#cc001e] hover:text-[#cc001e] text-xs font-extrabold text-[#0e0e0e] transition-colors cursor-pointer"
              >
                + Add Another
              </button>
              <button
                type="button"
                onClick={handleDoneClose}
                className="flex-1 py-3.5 rounded-2xl bg-[#0e0e0e] hover:bg-[#cc001e] border-2 border-[#0e0e0e] text-white text-xs font-extrabold transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <span>View Vault</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* If opened from "All Items", show a single unified 4-option category switcher */}
            {!isCategoryLocked && (
              <div className="grid grid-cols-4 gap-1.5 my-4 p-1.5 rounded-2xl bg-[#f0f4f5] border-2 border-[#0e0e0e]">
                {[
                  { id: 'document', label: 'Document', icon: FileText },
                  { id: 'photo', label: 'Photo', icon: ImageIcon },
                  { id: 'credential', label: 'Password', icon: KeyRound },
                  { id: 'secret', label: 'Secret File', icon: ShieldAlert },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedType(cat.id);
                      setError('');
                    }}
                    className={`py-2 px-1 sm:px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer border-2 ${
                      selectedType === cat.id
                        ? 'bg-[#cc001e] text-white border-[#0e0e0e] shadow-sm'
                        : 'bg-white text-[#0e0e0e] border-transparent hover:border-[#0e0e0e] hover:bg-white'
                    }`}
                  >
                    <cat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] shrink-0" />
                    <span className="truncate">{cat.label}</span>
                  </button>
                ))}
              </div>
            )}

            {error && (
              <div className="my-3 p-3 rounded-2xl bg-white border-2 border-[#cc001e] text-[#cc001e] text-xs font-extrabold">
                {error}
              </div>
            )}

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1 mt-2">
              {selectedType === 'credential' ? (
                <>
                  {/* Credential Fields */}
                  <div>
                    <label className="text-xs font-extrabold text-[#0e0e0e] block mb-1.5">
                      {details.titleLabel}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={details.titlePlaceholder}
                      value={credTitle}
                      onChange={(e) => setCredTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-[#0e0e0e] focus:border-[#cc001e] outline-none text-sm text-[#0e0e0e] font-bold transition-all shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-[#0e0e0e] block mb-1.5">
                      Username or Email
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., user@example.com"
                      value={credUsername}
                      onChange={(e) => setCredUsername(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-[#0e0e0e] focus:border-[#cc001e] outline-none text-sm text-[#0e0e0e] font-bold transition-all shadow-sm"
                    />
                  </div>

                  {/* Password with generator */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-extrabold text-[#0e0e0e]">
                        Password *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowGenerator(!showGenerator);
                          if (!credPassword) generatePassword();
                        }}
                        className="text-xs font-extrabold text-[#cc001e] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {showGenerator ? 'Close Generator' : 'Generate Strong Password'}
                      </button>
                    </div>

                    <div className="relative flex items-center">
                      <input
                        type={showCredPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter or generate password"
                        value={credPassword}
                        onChange={(e) => setCredPassword(e.target.value)}
                        className="w-full pl-4 pr-20 py-3 rounded-2xl bg-white border-2 border-[#0e0e0e] focus:border-[#cc001e] outline-none text-sm text-[#0e0e0e] font-mono font-bold transition-all shadow-sm"
                      />
                      <div className="absolute right-2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowCredPassword(!showCredPassword)}
                          className="p-1.5 rounded-lg text-[#0e0e0e] hover:text-[#cc001e] transition-colors cursor-pointer"
                        >
                          {showCredPassword ? <EyeOff className="w-4 h-4 stroke-[2.5]" /> : <Eye className="w-4 h-4 stroke-[2.5]" />}
                        </button>
                        {showGenerator && (
                          <button
                            type="button"
                            onClick={generatePassword}
                            className="p-1.5 rounded-lg text-[#cc001e] hover:bg-[#f0f4f5] transition-colors cursor-pointer"
                            title="Re-generate"
                          >
                            <RefreshCw className="w-4 h-4 stroke-[2.5]" />
                          </button>
                        )}
                      </div>
                    </div>

                    {showGenerator && (
                      <div className="mt-2.5 p-4 rounded-2xl bg-[#f0f4f5] border-2 border-[#0e0e0e] space-y-2.5 text-xs animate-fade-in shadow-sm">
                        <div className="flex items-center justify-between font-extrabold">
                          <span className="text-[#0e0e0e]">Length: <strong className="text-[#cc001e]">{passLength}</strong></span>
                          <input
                            type="range"
                            min="10"
                            max="32"
                            value={passLength}
                            onChange={(e) => { setPassLength(Number(e.target.value)); generatePassword(); }}
                            className="w-32 accent-[#cc001e] cursor-pointer"
                          />
                        </div>
                        <div className="flex items-center gap-4 text-[#0e0e0e] font-extrabold">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={includeNumbers}
                              onChange={(e) => { setIncludeNumbers(e.target.checked); generatePassword(); }}
                              className="accent-[#cc001e] rounded"
                            />
                            Numbers (0-9)
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={includeSymbols}
                              onChange={(e) => { setIncludeSymbols(e.target.checked); generatePassword(); }}
                              className="accent-[#cc001e] rounded"
                            />
                            Symbols (!@#$)
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Website URL */}
                  <div>
                    <label className="text-xs font-extrabold text-[#0e0e0e] block mb-1.5">
                      Website URL (optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={credUrl}
                      onChange={(e) => setCredUrl(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-[#0e0e0e] focus:border-[#cc001e] outline-none text-sm text-[#0e0e0e] font-bold transition-all shadow-sm"
                    />
                  </div>

                  {/* Notes & Tags */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-extrabold text-[#0e0e0e] block mb-1.5">
                        Tags (optional)
                      </label>
                      <input
                        type="text"
                        placeholder={details.tagsPlaceholder}
                        value={credTags}
                        onChange={(e) => setCredTags(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-white border-2 border-[#0e0e0e] focus:border-[#cc001e] outline-none text-xs text-[#0e0e0e] font-bold transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-[#0e0e0e] block mb-1.5">
                        Notes / Recovery (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Recovery codes, PIN, etc."
                        value={credNotes}
                        onChange={(e) => setCredNotes(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-white border-2 border-[#0e0e0e] focus:border-[#cc001e] outline-none text-xs text-[#0e0e0e] font-bold transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* File Upload Fields: Document / Photo / Secret */}
                  <div>
                    <label className="text-xs font-extrabold text-[#0e0e0e] block mb-1.5">
                      {details.titleLabel}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={details.titlePlaceholder}
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-[#0e0e0e] focus:border-[#cc001e] outline-none text-sm text-[#0e0e0e] font-bold transition-all shadow-sm"
                    />
                  </div>

                  {/* Dedicated Visual File Upload Area */}
                  <div>
                    <label className="text-xs font-extrabold text-[#0e0e0e] block mb-1.5">
                      {details.fileLabel}
                    </label>

                    {selectedFile ? (
                      <div className="p-4 rounded-2xl bg-[#f0f4f5] border-2 border-[#0e0e0e] flex items-center justify-between gap-3 animate-fade-in">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-[#0e0e0e] border-2 border-[#0e0e0e] flex items-center justify-center text-[#cc001e] shrink-0">
                            {selectedType === 'photo' ? (
                              <ImageIcon className="w-6 h-6 stroke-[2.5]" />
                            ) : selectedType === 'secret' ? (
                              <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
                            ) : (
                              <FileText className="w-6 h-6 stroke-[2.5]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-extrabold text-[#0e0e0e] truncate">
                              {selectedFile.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-[#0e0e0e] font-bold mt-0.5">
                              <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                              <span>•</span>
                              <span className="text-[#cc001e] uppercase text-[10px] tracking-wider font-extrabold">
                                Ready to Save
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#f0f4f5] border-2 border-[#0e0e0e] hover:border-[#cc001e] text-xs font-extrabold text-[#0e0e0e] hover:text-[#cc001e] transition-colors cursor-pointer shadow-sm"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="p-2 rounded-xl text-white bg-[#0e0e0e] hover:bg-[#cc001e] border-2 border-[#0e0e0e] hover:border-[#cc001e] transition-colors cursor-pointer"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4 stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleFileDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-8 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all border-2 border-dashed ${
                          dragOver
                            ? 'bg-[#cc001e]/10 border-[#cc001e] scale-[1.01]'
                            : 'bg-white border-[#0e0e0e] hover:border-[#cc001e] hover:bg-[#f0f4f5]'
                        }`}
                      >
                        {selectedType === 'photo' ? (
                          <ImageIcon className="w-10 h-10 text-[#cc001e] mb-2.5 stroke-[2.5]" />
                        ) : selectedType === 'secret' ? (
                          <ShieldAlert className="w-10 h-10 text-[#cc001e] mb-2.5 stroke-[2.5]" />
                        ) : (
                          <UploadCloud className="w-10 h-10 text-[#cc001e] mb-2.5 stroke-[2.5]" />
                        )}
                        <p className="text-sm font-extrabold text-[#0e0e0e]">
                          {details.dropzoneText}
                        </p>
                        <p className="text-xs text-[#0e0e0e]/70 font-bold mt-1">
                          {details.dropzoneHint}
                        </p>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={details.accept}
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>

                  {/* Description & Tags */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-extrabold text-[#0e0e0e] block mb-1.5">
                        Tags (optional)
                      </label>
                      <input
                        type="text"
                        placeholder={details.tagsPlaceholder}
                        value={docTags}
                        onChange={(e) => setDocTags(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-white border-2 border-[#0e0e0e] focus:border-[#cc001e] outline-none text-xs text-[#0e0e0e] font-bold transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-[#0e0e0e] block mb-1.5">
                        Description (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Short summary notes"
                        value={docDesc}
                        onChange={(e) => setDocDesc(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-white border-2 border-[#0e0e0e] focus:border-[#cc001e] outline-none text-xs text-[#0e0e0e] font-bold transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  id="btn-submit-add-item"
                  className="w-full neon-button py-3.5 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border-2 border-[#0e0e0e]"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving to Vault...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{details.submitText}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
