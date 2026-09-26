import React from 'react';
import { Shield, Lock, Unlock, Settings, Plus, Menu, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Navbar({ onOpenAdd, onOpenSettings, onOpenAuth, onOpenProfile, onToggleSidebar }) {
  const { isAuthenticated, user, lockSession, isSessionLocked } = useAuth();

  return (
    <header className="sticky top-0 z-20 w-full bg-white border-b-2 border-[#0e0e0e] transition-all">
      <div className="w-full px-4 sm:px-8 h-20 flex items-center justify-between gap-4">
        {/* Left: Mobile Sidebar Toggle & Brand */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {isAuthenticated && (
            <button
              onClick={onToggleSidebar}
              id="btn-mobile-sidebar-toggle"
              title="Open Navigation"
              aria-label="Open Navigation"
              className="lg:hidden p-2.5 rounded-2xl bg-white hover:bg-surface-alt border-2 border-[#0e0e0e] hover:border-accent text-[#0e0e0e] hover:text-accent transition-all cursor-pointer shadow-soft flex items-center justify-center shrink-0"
            >
              <Menu className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0e0e0e] border-2 border-[#0e0e0e] flex items-center justify-center text-accent shadow-soft shrink-0">
              <Shield className="w-5 h-5 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-xl font-extrabold tracking-tight text-[#0e0e0e]">
                Secure<span className="text-accent">Vault</span>
              </span>
              <p className="text-[11px] text-[#0e0e0e] font-bold hidden sm:block">
                Personal Document & Password Manager
              </p>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Add Item Button */}
              <button
                onClick={onOpenAdd}
                id="btn-add-item-header"
                className="neon-button flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline">Add Item</span>
              </button>

              {/* Quick Lock Session */}
              <button
                onClick={lockSession}
                id="btn-lock-session"
                title="Lock Vault Now"
                className="p-2.5 rounded-2xl bg-white hover:bg-surface-alt border-2 border-[#0e0e0e] hover:border-accent text-[#0e0e0e] hover:text-accent transition-all cursor-pointer shadow-soft"
              >
                {isSessionLocked ? (
                  <Lock className="w-4 h-4 text-accent stroke-[2.5]" />
                ) : (
                  <Unlock className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>

              {/* Settings button */}
              <button
                onClick={onOpenSettings}
                id="btn-settings-header"
                title="Vault Settings"
                className="p-2.5 rounded-2xl bg-white hover:bg-surface-alt border-2 border-[#0e0e0e] hover:border-accent text-[#0e0e0e] hover:text-accent transition-all cursor-pointer shadow-soft"
              >
                <Settings className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* User Avatar Button -> Opens Profile */}
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2.5 p-1.5 pl-3 rounded-2xl bg-white hover:bg-surface-alt border-2 border-[#0e0e0e] hover:border-accent transition-all cursor-pointer shadow-soft"
                title="View Profile"
              >
                <span className="text-xs font-extrabold text-[#0e0e0e] hidden md:inline truncate max-w-[130px]">
                  {user?.name || user?.email}
                </span>
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#0e0e0e] border-2 border-[#0e0e0e] flex items-center justify-center text-accent shrink-0">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 stroke-[2.5]" />
                  )}
                </div>
              </button>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              id="btn-signin-header"
              className="neon-button px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold cursor-pointer"
            >
              Sign In to Vault
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
