// Application static constants, categories, and helpers

export const VAULT_CATEGORIES = [
  { id: 'all', label: 'All Items', icon: 'FolderLock' },
  { id: 'credential', label: 'Passwords & Logins', icon: 'KeyRound' },
  { id: 'document', label: 'Encrypted Documents', icon: 'FileText' },
  { id: 'photo', label: 'Secure Photos', icon: 'Image' },
  { id: 'secret', label: 'Private Keys & Secrets', icon: 'Lock' },
];

export const SUGGESTED_TAGS = [
  'personal',
  'work',
  'finance',
  'taxes',
  'passwords',
  'crypto',
  'health',
  'legal',
  'backup',
];

export const AUTO_LOCK_OPTIONS = [
  { label: 'Immediate (1 minute)', value: 1 },
  { label: '5 minutes (Standard)', value: 5 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: 'Disabled (Manual lock)', value: 0 },
];
