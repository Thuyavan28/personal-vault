import React, { useState, useEffect } from 'react';
import {
  X, ShieldCheck, KeyRound, Clock, AlertTriangle,
  History, CheckCircle2, XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_PATHS } from '../utils/apiPath';

export function SettingsModal({ isOpen, onClose, showToast }) {
  const { token, logout, autoLockMinutes, setAutoLockPreference } = useAuth();
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'pin' | 'preferences' | 'danger'

  // Change PIN states
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');

  // Audit Logs states
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Delete Account states
  const [deletePin, setDeletePin] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (isOpen && activeTab === 'audit') {
      fetchLogs();
    }
  }, [isOpen, activeTab]);

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch(API_PATHS.AUDIT.GET_LOGS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      // Ignore
    } finally {
      setLogsLoading(false);
    }
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    setPinError('');

    if (newPin.length !== 4) {
      setPinError('New PIN must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setPinError('New PIN and confirmation do not match.');
      return;
    }

    setPinLoading(true);
    try {
      const res = await fetch(API_PATHS.PIN.CHANGE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPin, newPin, confirmNewPin })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update PIN');

      showToast({ message: 'Security PIN changed successfully', type: 'success' });
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
      fetchLogs();
    } catch (err) {
      setPinError(err.message);
    } finally {
      setPinLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePin) return;

    setDeleteLoading(true);
    setDeleteError('');
    try {
      const res = await fetch(API_PATHS.AUDIT.EXPORT_ACCOUNT, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ pin: deletePin })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete account');

      showToast({ message: 'Account erased permanently', type: 'success' });
      logout();
      onClose();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatLogAction = (action) => {
    switch (action) {
      case 'unlock_attempt': return 'Unlock Attempt';
      case 'unlock_success': return 'Item Accessed';
      case 'item_created': return 'Item Added';
      case 'item_deleted': return 'Item Removed';
      case 'pin_changed': return 'Security PIN Changed';
      case 'lockout': return 'Vault Lockout Triggered';
      case 'account_created': return 'Vault Initialized';
      case 'login_success': return 'Session Started';
      default: return action.replace(/_/g, ' ');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white border-2 border-[#0e0e0e] rounded-3xl p-8 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0e0e0e] border-2 border-[#0e0e0e] flex items-center justify-center text-[#cc001e]">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-[#0e0e0e]">Vault Settings</h3>
              <p className="text-xs text-[#0e0e0e]/70 font-bold">Security preferences, PIN controls, and activity history</p>
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

        {/* Tab Navigation with Crisp Borders */}
        <div className="flex items-center gap-2 my-5 overflow-x-auto pb-1">
          {[
            { id: 'audit', label: 'Activity Logs', icon: History },
            { id: 'pin', label: 'Change PIN', icon: KeyRound },
            { id: 'preferences', label: 'Auto-Lock', icon: Clock },
            { id: 'danger', label: 'Danger Zone', icon: AlertTriangle }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 shrink-0 transition-all cursor-pointer border-2 ${
                activeTab === tab.id
                  ? 'bg-[#cc001e] text-white border-[#0e0e0e]'
                  : 'bg-white text-[#0e0e0e] border-[#0e0e0e] hover:border-[#cc001e] hover:bg-[#f0f4f5]'
              }`}
            >
              <tab.icon className="w-4 h-4 stroke-[2.5]" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* 1. Activity Logs */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#0e0e0e] mb-2 font-extrabold">
                <span>Record of all unlock attempts and vault actions</span>
                <button
                  onClick={fetchLogs}
                  className="text-[#cc001e] hover:underline cursor-pointer"
                >
                  Refresh
                </button>
              </div>

              {logsLoading ? (
                <div className="py-12 text-center text-xs text-[#0e0e0e] font-bold">Loading activity entries...</div>
              ) : logs.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#0e0e0e] font-bold">No activity events recorded yet.</div>
              ) : (
                <div className="rounded-2xl overflow-hidden bg-white border-2 border-[#0e0e0e]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#f0f4f5] border-b-2 border-[#0e0e0e] text-[#0e0e0e] uppercase text-[10px] font-extrabold tracking-wider">
                        <tr>
                          <th className="p-3">Status</th>
                          <th className="p-3">Action</th>
                          <th className="p-3">Item</th>
                          <th className="p-3">Device / IP</th>
                          <th className="p-3">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#0e0e0e] font-bold">
                        {logs.map((log) => (
                          <tr key={log.id} className="border-b border-[#0e0e0e]/20 hover:bg-[#f0f4f5] transition-colors">
                            <td className="p-3">
                              {log.status === 'success' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#cc001e]">
                                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" /> OK
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#0e0e0e]">
                                  <XCircle className="w-3.5 h-3.5 stroke-[2.5]" /> FAILED
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-extrabold text-[#0e0e0e]">
                              {formatLogAction(log.action)}
                            </td>
                            <td className="p-3 truncate max-w-[140px] text-[#0e0e0e]">
                              {log.item_title || '—'}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-[#0e0e0e]">
                              {log.ip_address}
                            </td>
                            <td className="p-3 text-[11px] text-[#0e0e0e] whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Change PIN */}
          {activeTab === 'pin' && (
            <form onSubmit={handleChangePin} className="space-y-4 max-w-md mx-auto py-4">
              {pinError && (
                <div className="p-3 rounded-2xl bg-white border-2 border-[#cc001e] text-[#cc001e] text-xs font-extrabold">
                  {pinError}
                </div>
              )}

              <div>
                <label className="text-xs font-extrabold text-[#0e0e0e] block mb-1.5">
                  Current 4-Digit PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-[#0e0e0e] focus:border-[#cc001e] outline-none text-center text-xl tracking-widest text-[#0e0e0e] font-extrabold shadow-sm"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-[#0e0e0e] block mb-1.5">
                  New 4-Digit PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-[#0e0e0e] focus:border-[#cc001e] outline-none text-center text-xl tracking-widest text-[#0e0e0e] font-extrabold shadow-sm"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-[#0e0e0e] block mb-1.5">
                  Confirm New PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-[#0e0e0e] focus:border-[#cc001e] outline-none text-center text-xl tracking-widest text-[#0e0e0e] font-extrabold shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={pinLoading}
                className="w-full neon-button py-3.5 rounded-2xl text-sm font-extrabold cursor-pointer disabled:opacity-50 border-2 border-[#0e0e0e]"
              >
                {pinLoading ? 'Updating PIN...' : 'Update Security PIN'}
              </button>
            </form>
          )}

          {/* 3. Auto-Lock Preferences */}
          {activeTab === 'preferences' && (
            <div className="space-y-4 py-4 max-w-md mx-auto">
              <div>
                <h4 className="text-base font-extrabold text-[#0e0e0e] mb-1">Inactivity Lock</h4>
                <p className="text-xs text-[#0e0e0e]/80 font-bold mb-5">
                  Automatically lock the vault after a period of inactivity to prevent unauthorized access.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: '1 Minute', value: 1 },
                    { label: '5 Minutes', value: 5 },
                    { label: '15 Minutes', value: 15 },
                    { label: 'Disabled', value: 0 }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAutoLockPreference(opt.value)}
                      className={`p-4 rounded-2xl text-xs font-extrabold flex flex-col items-center justify-center transition-all cursor-pointer border-2 ${
                        autoLockMinutes === opt.value
                          ? 'bg-[#cc001e] text-white border-[#0e0e0e]'
                          : 'bg-white text-[#0e0e0e] border-[#0e0e0e] hover:border-[#cc001e] hover:bg-[#f0f4f5]'
                      }`}
                    >
                      <Clock className="w-4 h-4 mb-1.5 stroke-[2.5]" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. Danger Zone */}
          {activeTab === 'danger' && (
            <div className="space-y-5 py-4 max-w-md mx-auto">
              <div className="p-6 rounded-3xl bg-white border-2 border-[#0e0e0e]">
                <div className="flex items-center gap-2 text-[#cc001e] font-extrabold text-sm mb-1">
                  <AlertTriangle className="w-4 h-4 shrink-0 stroke-[2.5]" />
                  Erase Entire Vault
                </div>
                <p className="text-xs text-[#0e0e0e]/80 font-bold mb-4 leading-relaxed">
                  Permanently delete your account and all stored documents, photos, and passwords. This cannot be recovered.
                </p>

                {deleteError && (
                  <div className="mb-3 p-3 rounded-2xl bg-white border-2 border-[#cc001e] text-[#cc001e] text-xs font-extrabold">
                    {deleteError}
                  </div>
                )}

                <form onSubmit={handleDeleteAccount} className="space-y-3">
                  <div>
                    <label className="text-xs font-extrabold text-[#0e0e0e] block mb-1">
                      Enter Security PIN to Confirm
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      placeholder="••••"
                      value={deletePin}
                      onChange={(e) => setDeletePin(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-[#0e0e0e] focus:border-[#cc001e] outline-none text-center text-base tracking-widest text-[#0e0e0e] font-extrabold shadow-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={deleteLoading}
                    className="w-full py-3.5 rounded-2xl bg-[#0e0e0e] hover:bg-[#cc001e] border-2 border-[#0e0e0e] hover:border-[#cc001e] text-white font-extrabold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {deleteLoading ? 'Erasing Vault Data...' : 'Permanently Delete Account'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
