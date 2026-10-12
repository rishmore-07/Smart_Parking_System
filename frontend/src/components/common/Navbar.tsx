import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { 
  Car, 
  LogOut, 
  Sparkles,
  MapPin,
  CalendarDays,
  Heart,
  User as UserIcon,
  Menu,
  X
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">Admin</span>;
      case 'operator':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">Operator</span>;
      case 'driver':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">Driver</span>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0F766E] to-[#14B8A6] flex items-center justify-center text-white shadow-sm group-hover:shadow transition-all">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-display font-bold text-lg text-slate-900 tracking-tight">Smart Parking</span>
              <span className="text-xs px-1.5 py-0.5 font-medium rounded bg-[#0F766E]/10 text-[#0F766E]">Finder</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Urban Mobility Assistant</p>
          </div>
        </Link>

        {/* Desktop Navigation items */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/' ? 'text-[#0F766E] bg-[#0F766E]/5 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Home
          </Link>

          <Link
            to="/parking"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
              location.pathname.startsWith('/parking')
                ? 'text-[#0F766E] bg-[#0F766E]/5 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4 text-[#0F766E]" />
            <span>Find Parking</span>
          </Link>


          {isAuthenticated ? (
            <>
              <Link
                to="/vehicles"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                  location.pathname === '/vehicles' ? 'text-[#0F766E] bg-[#0F766E]/5 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Car className="w-4 h-4 text-[#0F766E]" />
                <span>My Vehicles</span>
              </Link>

              <div 
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 flex items-center space-x-1.5 cursor-not-allowed"
                title="Bookings management will be available in Phase 3"
              >
                <CalendarDays className="w-4 h-4 text-slate-300" />
                <span>My Bookings</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-400 font-normal">Phase 3</span>
              </div>

              <div 
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 flex items-center space-x-1.5 cursor-not-allowed"
                title="Saved facilities will be available in Phase 3"
              >
                <Heart className="w-4 h-4 text-slate-300" />
                <span>Favourites</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-400 font-normal">Phase 3</span>
              </div>

              <Link
                to="/profile"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                  location.pathname === '/profile' ? 'text-[#0F766E] bg-[#0F766E]/5 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>Profile</span>
              </Link>
            </>
          ) : (
            <>
              <div 
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 flex items-center space-x-1.5 cursor-not-allowed"
                title="Sign in required to view bookings"
              >
                <CalendarDays className="w-4 h-4 text-slate-300" />
                <span>My Bookings</span>
              </div>
              <div 
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 flex items-center space-x-1.5 cursor-not-allowed"
                title="Sign in required to view favourites"
              >
                <Heart className="w-4 h-4 text-slate-300" />
                <span>Favourites</span>
              </div>
            </>
          )}
        </nav>

        {/* Right Auth / Profile actions */}
        <div className="flex items-center space-x-3">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-3">
              <Link
                to="/profile"
                className="flex items-center space-x-2.5 py-1 px-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center font-semibold text-sm">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-800 leading-tight flex items-center space-x-1.5">
                    <span>{user.full_name}</span>
                    {getRoleBadge(user.role)}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate max-w-[120px]">{user.email}</div>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-2 text-sm font-medium text-white bg-[#0F766E] hover:bg-[#0D655E] rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Get Started</span>
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-2 pb-4 space-y-1">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-medium ${
              location.pathname === '/' ? 'text-[#0F766E] bg-[#0F766E]/5 font-semibold' : 'text-slate-600'
            }`}
          >
            Home
          </Link>
          <Link
            to="/parking"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-[#0F766E]"
          >
            Find Parking
          </Link>


          {isAuthenticated ? (
            <>
              <Link
                to="/vehicles"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  location.pathname === '/vehicles' ? 'text-[#0F766E] bg-[#0F766E]/5 font-semibold' : 'text-slate-600'
                }`}
              >
                My Vehicles
              </Link>
              <div className="px-3 py-2 text-sm font-medium text-slate-400 flex items-center justify-between">
                <span>My Bookings</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100">Phase 3</span>
              </div>
              <div className="px-3 py-2 text-sm font-medium text-slate-400 flex items-center justify-between">
                <span>Favourites</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100">Phase 3</span>
              </div>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  location.pathname === '/profile' ? 'text-[#0F766E] bg-[#0F766E]/5 font-semibold' : 'text-slate-600'
                }`}
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-[#0F766E] font-semibold"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
