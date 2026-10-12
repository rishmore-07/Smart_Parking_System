import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/authService';
import { 
  Car, 
  MapPin, 
  Sparkles, 
  ShieldCheck, 
  CreditCard, 
  ArrowRight,
  TrendingUp,
  Layers
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [quickLoginLoading, setQuickLoginLoading] = React.useState<string | null>(null);

  const handleQuickLogin = async (email: string, role: string) => {
    try {
      setQuickLoginLoading(role);
      const res = await authService.login({
        email,
        password: `${role.charAt(0).toUpperCase() + role.slice(1)}@123456`,
      });
      if (res.success && res.data) {
        setAuth(res.data.user, res.data.access_token);
        navigate(role === 'driver' ? '/vehicles' : '/profile');
      }
    } catch (err) {
      alert(`Login failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setQuickLoginLoading(null);
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-[#0F766E] text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
            <span>Phase 1 Architecture Live • System Ready</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Intelligent Parking for the <span className="text-[#0F766E]">Next-Gen Smart City</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Eliminate parking friction with real-time simulated occupancy, AI-assisted availability predictions,
            spot reservation, digital payments, and parked vehicle navigation.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/parking"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white font-medium shadow-sm transition-all flex items-center justify-center space-x-2"
            >
              <Car className="w-4 h-4" />
              <span>Find Nearby Parking</span>
            </Link>

            {!isAuthenticated ? (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-medium shadow-xs transition-all flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4 text-[#0F766E]" />
                  <span>Create Account</span>
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-5 py-3 rounded-xl hover:bg-slate-100 text-slate-700 font-medium transition-all flex items-center justify-center space-x-1"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              </>
            ) : (
              <Link
                to="/vehicles"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-medium shadow-xs transition-all flex items-center justify-center space-x-2"
              >
                <span>My Vehicles</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            )}
          </div>


          {/* Quick Interactive Role Switcher Banner */}
          <div className="pt-6">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm max-w-xl mx-auto text-left">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  ⚡ 1-Click Test Login (Seeded Roles)
                </span>
                <span className="text-[11px] text-[#0F766E] font-medium">Ready to test</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={!!quickLoginLoading}
                  onClick={() => handleQuickLogin('driver@smartparking.io', 'driver')}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center justify-center space-x-1.5"
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>{quickLoginLoading === 'driver' ? 'Signing in...' : 'Driver Account'}</span>
                </button>
                <button
                  type="button"
                  disabled={!!quickLoginLoading}
                  onClick={() => handleQuickLogin('operator@smartparking.io', 'operator')}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 transition-all flex items-center justify-center space-x-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{quickLoginLoading === 'operator' ? 'Signing in...' : 'Operator Account'}</span>
                </button>
                <button
                  type="button"
                  disabled={!!quickLoginLoading}
                  onClick={() => handleQuickLogin('admin@smartparking.io', 'admin')}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200 transition-all flex items-center justify-center space-x-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{quickLoginLoading === 'admin' ? 'Signing in...' : 'Admin Account'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#0F766E] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-900 mb-2">Simulated Live Occupancy</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Database-driven real-time spot occupancy simulator designed with an extensible service layer
              ready to connect physical IoT sensors in future phases.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#14B8A6] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-900 mb-2">AI Predictive Availability</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Machine learning models trained on historical occupancy, time, weather, and day factors to
              forecast spot availability with confidence indicators.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-900 mb-2">Guaranteed Booking & Payment</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Double-booking prevention locks, Razorpay test payment gateway integration, instant booking QR codes,
              and automated digital receipts.
            </p>
          </div>
        </div>

        {/* Phase Roadmap Overview */}
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-[#14B8A6]">Incremental Engineering Plan</span>
              <h2 className="text-2xl font-display font-bold mt-1 text-white">Project Implementation Phases</h2>
              <p className="text-sm text-slate-300 mt-2 max-w-xl">
                Built strictly step-by-step with clean architecture, test coverage, and documentation integrity.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm">
                <div className="text-xs text-emerald-400 font-semibold">Phase 1</div>
                <div className="text-sm font-bold text-white mt-1">Core & Auth</div>
                <div className="text-[10px] text-emerald-300 mt-0.5">● Complete</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="text-xs text-slate-400 font-semibold">Phase 2</div>
                <div className="text-sm font-bold text-slate-200 mt-1">Map & Search</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Upcoming</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="text-xs text-slate-400 font-semibold">Phase 3</div>
                <div className="text-sm font-bold text-slate-200 mt-1">Booking & Pay</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Upcoming</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="text-xs text-slate-400 font-semibold">Phase 4</div>
                <div className="text-sm font-bold text-slate-200 mt-1">AI & Dashboards</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Upcoming</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
