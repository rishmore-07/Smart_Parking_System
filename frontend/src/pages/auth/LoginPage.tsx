import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/authService';
import { Car, Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both your email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login({ email: email.trim(), password });
      if (response.success && response.data) {
        setAuth(response.data.user, response.data.access_token);
        const userRole = response.data.user.role;
        // Role-based navigation
        if (from) {
          navigate(from, { replace: true });
        } else if (userRole === 'admin' || userRole === 'operator') {
          navigate('/profile', { replace: true });
        } else {
          navigate('/vehicles', { replace: true });
        }
      } else {
        setError(response.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoRole: string) => {
    setEmail(demoEmail);
    setPassword(`${demoRole.charAt(0).toUpperCase() + demoRole.slice(1)}@123456`);
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0F766E] to-[#14B8A6] text-white shadow-md mb-4">
          <Car className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to access your parking reservations and vehicle garage
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10 space-y-6">
          {/* Quick Demo Fill Buttons */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Quick Fill Seeded Accounts:
            </p>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleFillDemo('driver@smartparking.io', 'driver')}
                className="py-1.5 px-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 font-medium transition-colors"
              >
                🚗 Driver
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('operator@smartparking.io', 'operator')}
                className="py-1.5 px-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-700 font-medium transition-colors"
              >
                🏢 Operator
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('admin@smartparking.io', 'admin')}
                className="py-1.5 px-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-purple-500 hover:text-purple-700 font-medium transition-colors"
              >
                🛡️ Admin
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-[#0F766E] hover:underline">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
