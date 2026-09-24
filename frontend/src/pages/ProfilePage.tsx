import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/authService';
import { 
  Mail, 
  ShieldCheck, 
  Calendar, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await authService.updateProfile({
        full_name: fullName,
        phone_number: phoneNumber,
      });

      if (res.success && res.data) {
        setUser(res.data);
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
          Account Profile
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Review your mobility credentials, role authorization, and contact preferences.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center space-x-2 border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-[#0F766E]/10 via-[#14B8A6]/10 to-transparent p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 border-b border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-[#0F766E] text-white flex items-center justify-center font-display font-bold text-3xl shadow-sm">
            {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-display font-bold text-slate-900">{user.full_name}</h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 capitalize">
                {user.role}
              </span>
              {user.is_verified && (
                <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-50 text-blue-700 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified</span>
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 flex items-center justify-center sm:justify-start space-x-1.5">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{user.email}</span>
            </p>
          </div>
        </div>

        {/* Form Details */}
        <div className="p-6 sm:p-8">
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address (Fixed)
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="block w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  disabled={!isEditing}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 9876543210"
                  className="block w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Account Created
                </label>
                <div className="flex items-center space-x-2 px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFullName(user.full_name);
                      setPhoneNumber(user.phone_number || '');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] rounded-xl shadow-xs transition-all disabled:opacity-60"
                  >
                    {isSaving ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] rounded-xl shadow-xs transition-all"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
