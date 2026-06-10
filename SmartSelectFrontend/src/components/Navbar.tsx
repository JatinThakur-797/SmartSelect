import {
  Cpu,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const isActive = (path: string) =>
    location.pathname === path
      ? 'text-emerald-600 font-semibold'
      : 'text-gray-600 hover:text-emerald-600';

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center
                            group-hover:bg-emerald-700 transition-colors shadow-md">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-gray-900 text-base">SmartSelect</span>
              <span className="text-emerald-600 text-xs font-semibold tracking-wider">AI</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <Link to="/category" className={`text-sm transition-colors ${isActive('/category')}`}>
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Get Recommendations
                  </span>
                </Link>
                <Link to="/dashboard" className={`text-sm transition-colors ${isActive('/dashboard')}`}>
                  <span className="flex items-center gap-1.5">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </span>
                </Link>

                {/* User pill */}
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-emerald-700" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {user?.name?.split(' ')[0]}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700
                               hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm py-2 px-5"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3 animate-fade-in">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-emerald-700" />
                </div>
                <span className="font-medium text-gray-700">{user?.name}</span>
              </div>
              <Link
                to="/category"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 py-2 text-gray-700 hover:text-emerald-600"
              >
                <Sparkles className="w-4 h-4" /> Get Recommendations
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 py-2 text-gray-700 hover:text-emerald-600"
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 py-2 text-red-500 w-full"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-gray-700 font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="btn-primary block text-center text-sm"
              >
                Get Started Free
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}