import React from 'react';
import {
  Shield, Lock, Unlock, Layers, FileText, Image as ImageIcon, KeyRound,
  ShieldAlert, Plus, Settings, LogOut, ChevronLeft, ChevronRight, User, Edit3, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar({
  selectedCategory,
  onSelectCategory,
  stats,
  onOpenAdd,
  onOpenSettings,
  onOpenProfile,
  isOpen,
  onToggle
}) {
  const { user, logout, lockSession, isSessionLocked } = useAuth();

  const categories = [
    { id: 'all', label: 'All Items', icon: Layers, count: stats?.total || 0 },
    { id: 'document', label: 'Documents', icon: FileText, count: stats?.docs || 0 },
    { id: 'photo', label: 'Photos', icon: ImageIcon, count: stats?.photos || 0 },
    { id: 'credential', label: 'Passwords', icon: KeyRound, count: stats?.creds || 0 },
    { id: 'secret', label: 'Secret Files', icon: ShieldAlert, count: stats?.secrets || 0 },
  ];

  const handleCategoryClick = (catId) => {
    onSelectCategory(catId);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onToggle();
    }
  };

  const handleActionClick = (actionFn) => {
    actionFn();
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container with crisp right border */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r-2 border-[#0e0e0e] transition-all duration-300 ease-in-out flex flex-col justify-between overflow-y-auto ${
          isOpen ? 'w-72 sm:w-72 translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
        {/* Top section */}
        <div className="p-4 sm:p-5 space-y-6">
          {/* Logo & Toggle */}
          {isOpen ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#0e0e0e] border-2 border-[#0e0e0e] flex items-center justify-center text-[#cc001e] shrink-0 shadow-sm">
                  <Shield className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="min-w-0 pr-1">
                  <span className="text-lg font-extrabold tracking-tight text-[#0e0e0e] block leading-tight whitespace-nowrap">
                    Secure<span className="text-[#cc001e]">Vault</span>
                  </span>
                  <span className="text-[10px] text-[#0e0e0e]/70 uppercase tracking-wider block font-extrabold">
                    Personal Storage
                  </span>
                </div>
              </div>

              <button
                onClick={onToggle}
                className="p-2 rounded-xl text-[#0e0e0e] hover:bg-[#f0f4f5] border-2 border-[#0e0e0e] hover:border-[#cc001e] transition-colors cursor-pointer flex items-center justify-center shrink-0 ml-auto"
                title="Collapse Sidebar"
              >
                <span className="lg:hidden">
                  <X className="w-4 h-4 stroke-[2.5]" />
                </span>
                <span className="hidden lg:inline">
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </span>
              </button>
            </div>
          ) : (
            <div className="flex justify-center items-center">
              <button
                onClick={onToggle}
                className="relative group w-11 h-11 rounded-2xl bg-[#0e0e0e] border-2 border-[#0e0e0e] hover:border-[#cc001e] flex items-center justify-center text-[#cc001e] hover:text-white transition-all cursor-pointer shadow-sm hover:scale-105"
                title="Expand Sidebar"
                aria-label="Expand Sidebar"
              >
                <Shield className="w-5 h-5 stroke-[2.5] group-hover:hidden transition-all" />
                <ChevronRight className="w-5 h-5 stroke-[2.5] hidden group-hover:block transition-all" />
              </button>
            </div>
          )}

          {/* User Profile Card with crisp border */}
          {isOpen ? (
            <div
              onClick={() => handleActionClick(onOpenProfile)}
              className="p-3.5 rounded-2xl bg-[#f0f4f5] hover:bg-white border-2 border-[#0e0e0e] hover:border-[#cc001e] transition-all cursor-pointer flex items-center justify-between group"
              title="Edit Profile"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#0e0e0e] border-2 border-[#0e0e0e] flex items-center justify-center text-[#cc001e] shrink-0">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 stroke-[2.5]" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#0e0e0e] block truncate">
                    {user?.name || 'Set Your Name'}
                  </span>
                  <span className="text-[10px] text-[#0e0e0e]/70 font-semibold block truncate">
                    {user?.email}
                  </span>
                </div>
              </div>
              <Edit3 className="w-4 h-4 text-[#0e0e0e]/60 group-hover:text-[#cc001e] transition-colors shrink-0" />
            </div>
          ) : (
            <div
              onClick={() => handleActionClick(onOpenProfile)}
              className="flex justify-center cursor-pointer"
              title="Edit Profile"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#0e0e0e] border-2 border-[#0e0e0e] flex items-center justify-center text-[#cc001e]">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 stroke-[2.5]" />
                )}
              </div>
            </div>
          )}

          {/* Quick Add Button */}
          <button
            onClick={() => handleActionClick(onOpenAdd)}
            id="btn-sidebar-add"
            className={`w-full neon-button py-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all border-2 border-[#0e0e0e] ${
              !isOpen ? 'px-0' : 'px-4'
            }`}
            title="Add Item"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            {isOpen && <span>New Item</span>}
          </button>

          {/* Categories */}
          <nav className="space-y-2 pt-2">
            {isOpen && (
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#0e0e0e] px-3 mb-2">
                Categories
              </p>
            )}

            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer border-2 ${
                    isActive
                      ? 'bg-[#cc001e] text-white border-[#0e0e0e]'
                      : 'bg-white text-[#0e0e0e] hover:bg-[#f0f4f5] border-[#0e0e0e] hover:border-[#cc001e]'
                  } ${!isOpen ? 'justify-center' : ''}`}
                  title={cat.label}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#cc001e]'}`} />
                    {isOpen && <span className="truncate">{cat.label}</span>}
                  </div>

                  {isOpen && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-lg font-bold border ${
                        isActive
                          ? 'bg-[#0e0e0e] text-white border-[#0e0e0e]'
                          : 'bg-[#f0f4f5] text-[#0e0e0e] border-[#0e0e0e]'
                      }`}
                    >
                      {cat.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section with top border */}
        <div className="p-5 space-y-2 border-t-2 border-[#0e0e0e]">
          {/* Quick Actions with crisp borders */}
          <button
            onClick={() => handleActionClick(lockSession)}
            id="btn-sidebar-lock"
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold text-[#0e0e0e] hover:text-[#cc001e] bg-[#f0f4f5] hover:bg-white border-2 border-[#0e0e0e] hover:border-[#cc001e] transition-colors cursor-pointer ${
              !isOpen ? 'justify-center' : ''
            }`}
            title={isSessionLocked ? 'Vault Locked' : 'Lock Vault'}
          >
            {isSessionLocked ? (
              <Lock className="w-4 h-4 text-[#cc001e]" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
            {isOpen && <span>{isSessionLocked ? 'Vault Locked' : 'Lock Vault'}</span>}
          </button>

          <button
            onClick={() => handleActionClick(onOpenSettings)}
            id="btn-sidebar-settings"
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold text-[#0e0e0e] hover:text-[#cc001e] bg-[#f0f4f5] hover:bg-white border-2 border-[#0e0e0e] hover:border-[#cc001e] transition-colors cursor-pointer ${
              !isOpen ? 'justify-center' : ''
            }`}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
            {isOpen && <span>Settings</span>}
          </button>

          <button
            onClick={() => handleActionClick(logout)}
            id="btn-sidebar-logout"
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold text-white bg-[#0e0e0e] hover:bg-[#cc001e] border-2 border-[#0e0e0e] hover:border-[#cc001e] transition-colors cursor-pointer ${
              !isOpen ? 'justify-center' : ''
            }`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            {isOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
