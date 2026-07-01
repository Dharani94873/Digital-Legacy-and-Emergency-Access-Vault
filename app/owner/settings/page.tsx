'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Lock, Bell, Trash2, Save, Loader2,
  Eye, EyeOff, Shield, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

type Section = 'profile' | 'security' | 'notifications' | 'danger';

interface ProfileData {
  fullName: string;
  phone: string;
  bio: string;
}

interface NotifPrefs {
  emailNotifications: boolean;
  twoFactorEnabled: boolean;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeSection, setActiveSection] = useState<Section>('profile');

  // Profile state
  const [profile, setProfile]       = useState<ProfileData>({ fullName: '', phone: '', bio: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  // Security state
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw,     setNewPw]       = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [showPw,    setShowPw]      = useState(false);
  const [pwLoading, setPwLoading]   = useState(false);

  // Notifications state
  const [notifPrefs, setNotifPrefs]     = useState<NotifPrefs>({ emailNotifications: true, twoFactorEnabled: false });
  const [notifLoading, setNotifLoading] = useState(false);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    // Load profile
    fetch('/api/profile')
      .then((r) => r.json())
      .then((j) => { if (j.success && j.data) setProfile(j.data); })
      .catch(() => {});
    // Load settings
    fetch('/api/settings')
      .then((r) => r.json())
      .then((j) => { if (j.success && j.data) setNotifPrefs(j.data); })
      .catch(() => {});
  }, []);

  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      const res  = await fetch('/api/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(profile),
      });
      const json = await res.json();
      if (json.success) toast.success('Profile updated');
      else toast.error(json.error ?? 'Update failed');
    } catch { toast.error('Failed to save profile'); }
    finally { setProfileLoading(false); }
  };

  const handlePasswordChange = async () => {
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    if (newPw.length < 8)    { toast.error('Password must be at least 8 characters'); return; }
    setPwLoading(true);
    try {
      const res  = await fetch('/api/auth/change-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Password changed successfully');
        setCurrentPw(''); setNewPw(''); setConfirmPw('');
      } else {
        toast.error(json.error ?? 'Password change failed');
      }
    } catch { toast.error('Failed to change password'); }
    finally { setPwLoading(false); }
  };

  const handleNotifSave = async () => {
    setNotifLoading(true);
    try {
      const res  = await fetch('/api/settings', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(notifPrefs),
      });
      const json = await res.json();
      if (json.success) toast.success('Preferences saved');
      else toast.error(json.error ?? 'Save failed');
    } catch { toast.error('Failed to save preferences'); }
    finally { setNotifLoading(false); }
  };

  const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: 'profile',       label: 'Profile',        icon: User },
    { id: 'security',      label: 'Security',        icon: Lock },
    { id: 'notifications', label: 'Notifications',   icon: Bell },
    { id: 'danger',        label: 'Danger Zone',     icon: Trash2 },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account, security, and notification preferences.</p>
      </motion.div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <motion.nav
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="w-48 flex-shrink-0 space-y-1"
        >
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`settings-nav-${id}`}
              onClick={() => setActiveSection(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                activeSection === id
                  ? 'bg-indigo-50 text-indigo-700'
                  : id === 'danger'
                    ? 'text-red-500 hover:bg-red-50'
                    : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </motion.nav>

        {/* Content */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5"
        >

          {/* ── Profile ── */}
          {activeSection === 'profile' && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
                <p className="text-sm text-slate-500 mt-1">Update your name, phone, and bio.</p>
              </div>
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {(profile.fullName || session?.user?.email || 'U').slice(0, 1).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{profile.fullName || 'Your Name'}</p>
                  <p className="text-xs text-slate-400">{session?.user?.email}</p>
                </div>
              </div>
              <div className="space-y-4">
                <Field label="Full Name" id="profile-name">
                  <input
                    id="profile-name"
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="Your full name"
                    className={inputCls}
                  />
                </Field>
                <Field label="Phone" id="profile-phone">
                  <input
                    id="profile-phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className={inputCls}
                  />
                </Field>
                <Field label="Bio" id="profile-bio">
                  <textarea
                    id="profile-bio"
                    value={profile.bio}
                    onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="A short bio about yourself"
                    rows={3}
                    className={`${inputCls} resize-none`}
                  />
                </Field>
              </div>
              <PrimaryButton onClick={handleProfileSave} loading={profileLoading} icon={Save}>
                Save Profile
              </PrimaryButton>
            </>
          )}

          {/* ── Security ── */}
          {activeSection === 'security' && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Security</h2>
                <p className="text-sm text-slate-500 mt-1">Change your password to keep your account secure.</p>
              </div>
              <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl">
                <Shield className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <p className="text-sm text-indigo-700">
                  Your documents are encrypted with AES-256-GCM. Use a strong, unique password.
                </p>
              </div>
              <div className="space-y-4">
                <Field label="Current Password" id="current-pw">
                  <PasswordInput id="current-pw" value={currentPw} onChange={setCurrentPw} show={showPw} onToggle={() => setShowPw((v) => !v)} placeholder="Current password" />
                </Field>
                <Field label="New Password" id="new-pw">
                  <PasswordInput id="new-pw" value={newPw} onChange={setNewPw} show={showPw} onToggle={() => setShowPw((v) => !v)} placeholder="At least 8 characters" />
                </Field>
                <Field label="Confirm Password" id="confirm-pw">
                  <PasswordInput id="confirm-pw" value={confirmPw} onChange={setConfirmPw} show={showPw} onToggle={() => setShowPw((v) => !v)} placeholder="Re-enter new password" />
                </Field>
              </div>
              {newPw && confirmPw && (
                <div className={`flex items-center gap-2 text-sm ${newPw === confirmPw ? 'text-emerald-600' : 'text-red-500'}`}>
                  {newPw === confirmPw ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {newPw === confirmPw ? 'Passwords match' : 'Passwords do not match'}
                </div>
              )}
              <PrimaryButton onClick={handlePasswordChange} loading={pwLoading} icon={Lock}>
                Change Password
              </PrimaryButton>
            </>
          )}

          {/* ── Notifications ── */}
          {activeSection === 'notifications' && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Notification Preferences</h2>
                <p className="text-sm text-slate-500 mt-1">Control how and when you receive alerts.</p>
              </div>
              <div className="space-y-4">
                <Toggle
                  id="email-notifs"
                  label="Email Notifications"
                  description="Receive email alerts for emergency requests, approvals, and security events"
                  checked={notifPrefs.emailNotifications}
                  onChange={(v) => setNotifPrefs((p) => ({ ...p, emailNotifications: v }))}
                />
                <Toggle
                  id="two-factor"
                  label="Two-Factor Authentication"
                  description="Add an extra layer of security when signing in (coming soon)"
                  checked={notifPrefs.twoFactorEnabled}
                  onChange={(v) => setNotifPrefs((p) => ({ ...p, twoFactorEnabled: v }))}
                  disabled
                />
              </div>
              <PrimaryButton onClick={handleNotifSave} loading={notifLoading} icon={Save}>
                Save Preferences
              </PrimaryButton>
            </>
          )}

          {/* ── Danger Zone ── */}
          {activeSection === 'danger' && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
                <p className="text-sm text-slate-500 mt-1">These actions are irreversible. Please be certain.</p>
              </div>
              <div className="border border-red-200 rounded-xl p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Delete Account</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Permanently delete your account, all uploaded documents, nominees, and audit logs. This cannot be undone.
                    </p>
                  </div>
                </div>
                <Field label={`Type "DELETE" to confirm`} id="delete-confirm">
                  <input
                    id="delete-confirm"
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                    className="w-full px-4 py-2.5 rounded-xl border border-red-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50"
                  />
                </Field>
                <button
                  disabled={deleteConfirm !== 'DELETE'}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                  onClick={() => toast.error('Account deletion is disabled in this environment')}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete My Account
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ── Helper sub-components ──

const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white';

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function PasswordInput({ id, value, onChange, show, onToggle, placeholder }: {
  id: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; placeholder?: string;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputCls} pr-10`}
      />
      <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function Toggle({ id, label, description, checked, onChange, disabled }: {
  id: string; label: string; description: string;
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 p-4 rounded-xl border ${disabled ? 'border-slate-100 opacity-50' : 'border-slate-100 hover:border-slate-200'} transition-colors`}>
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-indigo-500' : 'bg-slate-200'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function PrimaryButton({ onClick, loading, icon: Icon, children }: {
  onClick: () => void; loading: boolean;
  icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}
