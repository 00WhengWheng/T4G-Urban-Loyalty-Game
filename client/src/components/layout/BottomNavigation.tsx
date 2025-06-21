import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, MapPin, QrCode, Gamepad2, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

// Bottom Navigation Component (Mobile-first)
export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { user } = useAuthStore();

  const navItems = [
    {
      path: '/dashboard',
      label: 'Home',
      icon: Home,
      isActive: location.pathname === '/dashboard',
    },
    {
      path: '/map',
      label: 'Mappa',
      icon: MapPin,
      isActive: location.pathname === '/map',
    },
    {
      path: '/scan',
      label: 'Scan',
      icon: QrCode,
      isActive: location.pathname === '/scan',
      special: true, // Special styling for scan button
    },
    {
      path: '/games',
      label: 'Games',
      icon: Gamepad2,
      isActive: location.pathname === '/games',
    },
    {
      path: '/profile',
      label: 'Profilo',
      icon: User,
      isActive: location.pathname === '/profile',
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ${
              item.special
                ? 'bg-primary-600 text-white scale-110 shadow-lg'
                : item.isActive
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <item.icon className={`w-5 h-5 ${item.special ? 'w-6 h-6' : ''}`} />
            <span className={`text-xs mt-1 font-medium ${item.special ? 'text-xs' : ''}`}>
              {item.label}
            </span>
            
            {/* Active indicator */}
            {item.isActive && !item.special && (
              <motion.div
                layoutId="activeTab"
                className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full"
              />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};