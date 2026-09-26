import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Shield, Search, Plus, FileText, Image as ImageIcon, KeyRound, ShieldAlert,
  Lock, RefreshCw, Sparkles, AlertCircle, Trash2, CheckCircle2, ArrowRight, Layers
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { API_PATHS } from './utils/apiPath';
import { AppLoader } from './components/AppLoader';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { VaultCard } from './components/VaultCard';
import { PinSetup } from './components/PinSetup';
import { PinModal } from './components/PinModal';
import { UnlockedItemModal } from './components/UnlockedItemModal';
import { AddItemModal } from './components/AddItemModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ProfileSetup } from './components/ProfileSetup';
import { ShareModal } from './components/ShareModal';
import { Toast } from './components/Toast';

export function App() {
  const { isAuthenticated, token, hasPin, isSessionLocked, unlockSession, profileCompleted, updateUser } = useAuth();

  // App loader state
  const [appReady, setAppReady] = useState(false);

  // Data state
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const itemsCacheRef = useRef(new Map());
  const [vaultStats, setVaultStats] = useState({ total: 0, docs: 0, photos: 0, creds: 0, secrets: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Sidebar state - open on desktop (>=1024px), closed on mobile by default
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth >= 1024) {
          setSidebarOpen(true);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Modal controls
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [itemToUnlock, setItemToUnlock] = useState(null);
  const [unlockedItem, setUnlockedItem] = useState(null);
  const [itemToShare, setItemToShare] = useState(null);

  // Profile setup flow state
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  // Security PIN setup flow state (mandatory for users without a 4-digit PIN)
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinDismissed, setPinDismissed] = useState(false);

  // Delete item with PIN state
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deletePin, setDeletePin] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast notification
  const [toast, setToast] = useState(null);
  const showToast = (t) => setToast(t);

  // URL routing synchronization for onboarding & vault
  useEffect(() => {
    if (showProfileSetup || showPinSetup) {
      if (window.location.pathname !== '/onboarding') {
        window.history.pushState(null, '', '/onboarding');
      }
    } else if (isAuthenticated && window.location.pathname === '/onboarding') {
      window.history.pushState(null, '', '/');
    }
  }, [showProfileSetup, showPinSetup, isAuthenticated]);

  // Show profile setup or PIN setup after login if not completed
  useEffect(() => {
    if (isAuthenticated && appReady) {
      if (!profileCompleted) {
        setShowProfileSetup(true);
      } else if (!hasPin) {
        setShowPinSetup(true);
      }
    }
  }, [isAuthenticated, profileCompleted, hasPin, appReady]);

  // When app finishes loading, if guest, automatically prompt auth modal
  const handleAppLoaderFinish = () => {
    setAppReady(true);
    if (!isAuthenticated) {
      setIsAuthOpen(true);
    }
  };

  // Fetch items with instant local SWR caching + background refresh
  const fetchVaultItems = async (forceRefresh = false) => {
    if (!token) return;

    // SWR Pattern: Immediately render cached data if available for 0ms user perceived latency
    if (!forceRefresh && itemsCacheRef.current.has(selectedCategory)) {
      setItems(itemsCacheRef.current.get(selectedCategory));
    } else if (!forceRefresh && selectedCategory !== 'all' && itemsCacheRef.current.has('all')) {
      // Derive subset instantly from cached 'all' items for instant 0ms category switching
      const allCached = itemsCacheRef.current.get('all') || [];
      const subset = allCached.filter(i => i.type === selectedCategory);
      setItems(subset);
      itemsCacheRef.current.set(selectedCategory, subset);
    } else if (items.length === 0) {
      setLoading(true);
    }

    try {
      const url = API_PATHS.VAULT.GET_ITEMS(selectedCategory);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const freshItems = data.items || [];
      if (data.stats) {
        setVaultStats(data.stats);
      }
      itemsCacheRef.current.set(selectedCategory, freshItems);
      setItems(freshItems);
    } catch (err) {
      console.error('Failed to fetch vault items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchVaultItems();
    } else {
      setItems([]);
      itemsCacheRef.current.clear();
    }
  }, [isAuthenticated, token, selectedCategory]);

  // Client-side fuzzy search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item => {
      const titleMatch = item.title?.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      const tagsMatch = item.tags?.some(tag => tag.toLowerCase().includes(q));
      const fileMatch = item.fileName?.toLowerCase().includes(q);
      return titleMatch || descMatch || tagsMatch || fileMatch;
    });
  }, [items, searchQuery]);

  // Statistics: use overall vaultStats if available, otherwise calculate from loaded items
  const stats = useMemo(() => {
    if (vaultStats && vaultStats.total > 0) {
      return vaultStats;
    }
    const docs = items.filter(i => i.type === 'document').length;
    const photos = items.filter(i => i.type === 'photo').length;
    const creds = items.filter(i => i.type === 'credential').length;
    const secrets = items.filter(i => i.type === 'secret').length;
    return { total: items.length, docs, photos, creds, secrets };
  }, [items, vaultStats]);

  // Handle item deletion confirmation
  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    if (!itemToDelete || !deletePin) return;

    setDeleteLoading(true);
    setDeleteError('');

    try {
      const url = API_PATHS.VAULT.DELETE_ITEM(itemToDelete.id);
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ pin: deletePin })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete item');

      showToast({ message: 'Item deleted permanently', type: 'success' });
      setItemToDelete(null);
      setDeletePin('');
      setUnlockedItem(null);
      itemsCacheRef.current.clear(); // invalidate cache
      fetchVaultItems(true);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getCategoryTitle = () => {
    switch (selectedCategory) {
      case 'document': return 'Documents';
      case 'photo': return 'Photos';
      case 'credential': return 'Passwords';
      case 'secret': return 'Secret Files';
      default: return 'All Saved Items';
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f5] text-[#0e0e0e] flex flex-col font-sans selection:bg-accent selection:text-white font-bold">
      {/* Initial App Entry Loader */}
      {!appReady && <AppLoader onFinish={handleAppLoaderFinish} />}

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Profile Setup Flow (shown after signup/Google sign-in if profile not completed) */}
      {showProfileSetup && isAuthenticated && (
        <ProfileSetup
          onClose={() => setShowProfileSetup(false)}
          onComplete={() => {
            setShowProfileSetup(false);
            if (!hasPin) {
              setShowPinSetup(true);
            }
            fetchVaultItems();
          }}
          showToast={showToast}
        />
      )}

      {/* 4-Digit Security PIN Setup Flow (Prompted for all authenticated users who have not set a 4-digit PIN) */}
      {(showPinSetup || (isAuthenticated && !hasPin && !pinDismissed && !showProfileSetup && appReady)) && (
        <PinSetup
          onCancel={() => {
            setShowPinSetup(false);
            setPinDismissed(true);
          }}
          onComplete={() => {
            setShowPinSetup(false);
            setPinDismissed(false);
            fetchVaultItems();
          }}
          showToast={showToast}
        />
      )}

      {/* Interactive Sidebar (when authenticated) */}
      {isAuthenticated && (
        <Sidebar
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          stats={stats}
          onOpenAdd={() => setIsAddOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isAuthenticated ? (sidebarOpen ? 'lg:pl-72' : 'lg:pl-20') : ''
      }`}>
        {/* Top Navbar */}
        <Navbar
          onOpenAdd={() => setIsAddOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Page Body with Generous Spacing and Crisp Borders */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
          {!isAuthenticated ? (
            /* Guest Landing Screen */
            <div className="py-20 text-center max-w-3xl mx-auto space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border-2 border-[#0e0e0e] text-[#cc001e] text-xs font-extrabold shadow-sm">
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>Personal Document & Password Manager</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight text-[#0e0e0e]">
                One Clean Place For All Your <br className="hidden sm:inline" />
                <span className="text-accent">
                  Documents & Passwords
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#0e0e0e] font-bold max-w-2xl mx-auto leading-relaxed">
                Retrieve your certificates, images, and saved credentials protected by your 4-digit security PIN.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => setIsAuthOpen(true)}
                  id="btn-hero-start"
                  className="neon-button px-8 py-3.5 rounded-2xl text-base font-extrabold cursor-pointer flex items-center gap-2"
                >
                  <span>Open Your Vault</span>
                  <ArrowRight className="w-5 h-5 stroke-[3]" />
                </button>
              </div>

              {/* Feature Cards with Distinct #0e0e0e Borders */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 text-left">
                <div className="p-8 rounded-3xl bg-white border-2 border-[#0e0e0e] hover:border-accent shadow-card hover:shadow-card-hover transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-[#0e0e0e] text-accent flex items-center justify-center mb-4 border-2 border-[#0e0e0e]">
                    <Shield className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <h3 className="text-lg font-extrabold text-[#0e0e0e] mb-1.5">Confidentiality</h3>
                  <p className="text-xs text-[#0e0e0e] font-bold leading-relaxed">
                    No one can access your stored documents or passwords without your verified 4-digit security PIN.
                  </p>
                </div>

                <div className="p-8 rounded-3xl bg-white border-2 border-[#0e0e0e] hover:border-accent shadow-card hover:shadow-card-hover transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-[#0e0e0e] text-accent flex items-center justify-center mb-4 border-2 border-[#0e0e0e]">
                    <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <h3 className="text-lg font-extrabold text-[#0e0e0e] mb-1.5">Integrity</h3>
                  <p className="text-xs text-[#0e0e0e] font-bold leading-relaxed">
                    Tamper-proof storage ensures files and credentials cannot be altered unnoticed.
                  </p>
                </div>

                <div className="p-8 rounded-3xl bg-white border-2 border-[#0e0e0e] hover:border-accent shadow-card hover:shadow-card-hover transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-[#0e0e0e] text-accent flex items-center justify-center mb-4 border-2 border-[#0e0e0e]">
                    <KeyRound className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <h3 className="text-lg font-extrabold text-[#0e0e0e] mb-1.5">Convenience</h3>
                  <p className="text-xs text-[#0e0e0e] font-bold leading-relaxed">
                    Instant fuzzy search by title or tags. One-tap unlock, copy, and share to any third-party app.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Authenticated Vault Dashboard */
            <div className="space-y-8 animate-fade-in">
              {/* Header Bar: Category Title, Search Bar & Quick Add */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-extrabold text-[#0e0e0e] tracking-tight">
                    {getCategoryTitle()}
                  </h2>
                  <p className="text-xs text-[#0e0e0e] font-bold mt-1">
                    {filteredItems.length} item{filteredItems.length === 1 ? '' : 's'} in safe storage
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  {/* Search Input with Crisp #0e0e0e Border */}
                  <div className="relative flex-1 md:w-80">
                    <input
                      type="text"
                      id="vault-search-input"
                      placeholder="Search items by title or tag..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-14 py-3 rounded-2xl bg-white border-2 border-[#0e0e0e] focus:border-accent outline-none text-xs sm:text-sm text-[#0e0e0e] placeholder:text-[#0e0e0e]/50 font-bold shadow-sm transition-all"
                    />
                    <Search className="w-4 h-4 text-[#0e0e0e] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-xs font-extrabold text-accent hover:text-accent-hover absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setIsAddOpen(true)}
                    className="neon-button px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span className="hidden sm:inline">Add Item</span>
                  </button>
                </div>
              </div>

              {/* Responsive Category Slidebar (Quick Horizontal Sliding Tabs for Mobile & Desktop) */}
              <div className="w-full overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex items-center gap-2.5 min-w-max py-0.5">
                  {[
                    { id: 'all', label: 'All Items', icon: Layers, count: stats?.total || 0 },
                    { id: 'credential', label: 'Passwords', icon: KeyRound, count: stats?.creds || 0 },
                    { id: 'document', label: 'Documents', icon: FileText, count: stats?.docs || 0 },
                    { id: 'photo', label: 'Photos', icon: ImageIcon, count: stats?.photos || 0 },
                    { id: 'secret', label: 'Secret Files', icon: ShieldAlert, count: stats?.secrets || 0 },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3.5 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer border-2 shadow-sm ${
                          isActive
                            ? 'bg-[#cc001e] text-white border-[#0e0e0e] shadow-md scale-[1.02]'
                            : 'bg-white text-[#0e0e0e] hover:bg-[#f0f4f5] border-[#0e0e0e] hover:border-[#cc001e]'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#cc001e]'}`} />
                        <span>{cat.label}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold border ${
                            isActive
                              ? 'bg-[#0e0e0e] text-white border-[#0e0e0e]'
                              : 'bg-[#f0f4f5] text-[#0e0e0e] border-[#0e0e0e]/30'
                          }`}
                        >
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Items Grid with Generous Spacing */}
              {loading ? (
                <div className="py-24 text-center">
                  <RefreshCw className="w-8 h-8 text-accent animate-spin mx-auto mb-3" />
                  <p className="text-sm text-[#0e0e0e] font-extrabold">Loading items...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="py-20 text-center bg-white border-2 border-[#0e0e0e] rounded-3xl p-10 max-w-md mx-auto shadow-card">
                  <div className="w-16 h-16 rounded-2xl bg-[#0e0e0e] text-accent flex items-center justify-center mx-auto mb-4 border-2 border-[#0e0e0e] shadow-sm">
                    <Lock className="w-8 h-8 stroke-[2.5]" />
                  </div>
                  <h3 className="text-xl font-extrabold text-[#0e0e0e] mb-1">
                    {searchQuery ? 'No matching items found' : 'Your Vault is Empty'}
                  </h3>
                  <p className="text-xs text-[#0e0e0e] font-bold mb-6 leading-relaxed">
                    {searchQuery
                      ? `No items matched "${searchQuery}". Try a different keyword.`
                      : 'Add your first document, image, or password to keep it safe and accessible.'}
                  </p>
                  <button
                    onClick={() => setIsAddOpen(true)}
                    className="neon-button px-6 py-3 rounded-2xl text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Add First Item</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map(item => (
                    <VaultCard
                      key={item.id}
                      item={item}
                      onSelect={(target) => setItemToUnlock(target)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals & Popups */}
      {/* 1. First-Time PIN Setup */}
      {isAuthenticated && !hasPin && !showProfileSetup && (
        <PinSetup
          showToast={showToast}
          onComplete={() => fetchVaultItems()}
        />
      )}

      {/* 2. Auto-Lock Session PIN Prompt */}
      {isAuthenticated && isSessionLocked && (
        <PinModal
          isOpen={true}
          title="Vault Auto-Locked"
          description="Enter your 4-digit PIN to resume your session"
          onUnlocked={() => unlockSession()}
        />
      )}

      {/* 3. Item Unlock PIN Modal */}
      {itemToUnlock && (
        <PinModal
          isOpen={true}
          item={itemToUnlock}
          onClose={() => setItemToUnlock(null)}
          onUnlocked={(decrypted) => {
            setItemToUnlock(null);
            setUnlockedItem(decrypted);
          }}
        />
      )}

      {/* 4. Decrypted Item Modal */}
      {unlockedItem && (
        <UnlockedItemModal
          item={unlockedItem}
          onClose={() => setUnlockedItem(null)}
          onDeleteRequested={(target) => {
            setItemToDelete(target);
            setUnlockedItem(null);
          }}
          onShareRequested={(target) => {
            setItemToShare(target);
          }}
          showToast={showToast}
        />
      )}

      {/* 5. Document Sharing Modal */}
      {itemToShare && (
        <ShareModal
          item={itemToShare}
          isOpen={true}
          onClose={() => setItemToShare(null)}
          showToast={showToast}
        />
      )}

      {/* 6. User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        showToast={showToast}
      />

      {/* 7. Add Item Modal */}
      <AddItemModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        initialCategory={selectedCategory}
        onItemAdded={() => {
          itemsCacheRef.current.clear();
          fetchVaultItems(true);
        }}
        showToast={showToast}
      />

      {/* 8. Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        showToast={showToast}
      />

      {/* 9. Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        showToast={showToast}
      />

      {/* 10. Delete Confirmation PIN Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white border-2 border-[#0e0e0e] rounded-3xl p-7 shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-[#0e0e0e] text-accent border-2 border-[#0e0e0e] flex items-center justify-center mx-auto mb-2 shadow-soft">
                <Trash2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h3 className="text-xl font-extrabold text-[#0e0e0e]">Delete Item?</h3>
              <p className="text-xs text-[#0e0e0e] font-bold mt-1">
                Permanently erase "{itemToDelete.title}". This cannot be undone.
              </p>
            </div>

            {deleteError && (
              <div className="mb-3 p-3 rounded-2xl bg-red-50 border-2 border-accent text-accent text-xs font-extrabold">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleConfirmDelete} className="space-y-4">
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
                  className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-[#0e0e0e] focus:border-accent outline-none text-center text-lg tracking-widest text-[#0e0e0e] font-extrabold shadow-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setItemToDelete(null); setDeletePin(''); }}
                  className="flex-1 py-3 rounded-2xl bg-white border-2 border-[#0e0e0e] hover:border-accent text-xs font-extrabold text-[#0e0e0e] hover:text-accent transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="flex-1 py-3 rounded-2xl bg-accent hover:bg-accent-hover border-2 border-accent text-white text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {deleteLoading ? 'Erasing...' : 'Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
