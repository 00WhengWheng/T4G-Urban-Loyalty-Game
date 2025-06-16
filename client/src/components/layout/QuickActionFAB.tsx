import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Gamepad2, MapPin, Target, X } from 'lucide-react';
// Quick Action Floating Button (Alternative to bottom nav)
export const QuickActionFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const quickActions = [
    {
      label: 'Scan NFC',
      icon: QrCode,
      action: () => navigate('/scan'),
      color: 'bg-blue-500',
    },
    {
      label: 'Quick Game',
      icon: Gamepad2,
      action: () => navigate('/games'),
      color: 'bg-purple-500',
    },
    {
      label: 'Mappa',
      icon: MapPin,
      action: () => navigate('/map'),
      color: 'bg-green-500',
    },
    {
      label: 'Challenge',
      icon: Target,
      action: () => navigate('/challenges'),
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Quick action buttons */}
      <AnimatePresence>
        {isOpen && (
          <div className="absolute bottom-16 right-0 space-y-3">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  action.action();
                  setIsOpen(false);
                }}
                className={`flex items-center space-x-3 ${action.color} text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all`}
              >
                <action.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{action.label}</span>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center ${
          isOpen ? 'rotate-45' : ''
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <QrCode className="w-6 h-6" />}
      </motion.button>
    </div>
  );
};