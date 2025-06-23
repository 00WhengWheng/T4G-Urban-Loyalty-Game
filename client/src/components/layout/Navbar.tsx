import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, Settings, LogOut, Bell, Search, Coins } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Badge } from '../ui/Badge';

// Top Navbar Component
export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications] = useState(3); // Mock notification count

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T4G</span>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">
              T4G Social
            </span>
          </Link>

          {/* Center - Search (Desktop only) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cerca commercianti, sfide..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Points Display */}
            <div className="hidden sm:flex items-center space-x-2 bg-primary-50 px-3 py-1 rounded-full">
              <Coins className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-700">
                {user?.total_points?.toLocaleString() || '0'}
              </span>
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {false ? (
                  <img 
                    src="" 
                    alt="Avatar" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user?.first_name || user?.username || 'Utente'}
                </span>
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                  >
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-4 h-4 mr-3" />
                      Il Mio Profilo
                    </Link>
                    <Link
                      to="/neon-auth"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      🚀 Neon Auth Demo
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Impostazioni
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </nav>
  );
};