import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { toast } from 'sonner';

// Register Page
export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) clearError();
  };

  const validateForm = () => {
    if (!formData.email || !formData.username || !formData.password) {
      toast.error('Compila tutti i campi obbligatori');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Le password non coincidono');
      return false;
    }

    if (formData.password.length < 6) {
      toast.error('La password deve essere di almeno 6 caratteri');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Inserisci un indirizzo email valido');
      return false;
    }

    if (formData.username.length < 3) {
      toast.error('Il username deve essere di almeno 3 caratteri');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      toast.success('Registrazione completata con successo!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Errore durante la registrazione');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">T4G</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Crea Account</h1>
          <p className="text-gray-600">Unisciti alla community T4G</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Email Input */}
            <Input
              label="Email *"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              leftIcon={<Mail className="w-4 h-4" />}
              placeholder="nome@esempio.com"
              required
            />

            {/* Username Input */}
            <Input
              label="Username *"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              leftIcon={<User className="w-4 h-4" />}
              placeholder="Il tuo username"
              required
            />

            {/* Name Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Nome"
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Nome"
              />
              <Input
                label="Cognome"
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Cognome"
              />
            </div>

            {/* Phone Input */}
            <Input
              label="Telefono"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              leftIcon={<Phone className="w-4 h-4" />}
              placeholder="+39 123 456 7890"
            />

            {/* Password Input */}
            <Input
              label="Password *"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              placeholder="Crea una password"
              required
            />

            {/* Confirm Password Input */}
            <Input
              label="Conferma Password *"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              placeholder="Ripeti la password"
              required
            />

            {/* Password Requirements */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>La password deve contenere:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li className={formData.password.length >= 6 ? 'text-green-600' : ''}>
                  Almeno 6 caratteri
                </li>
                <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}>
                  Una lettera maiuscola
                </li>
                <li className={/[0-9]/.test(formData.password) ? 'text-green-600' : ''}>
                  Un numero
                </li>
              </ul>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Terms Checkbox */}
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                Accetto i{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-700">
                  Termini di Servizio
                </Link>{' '}
                e la{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-700">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Crea Account
            </Button>
          </form>
        </Card>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Hai già un account?{' '}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Accedi ora
            </Link>
          </p>
        </div>

        {/* Features Preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 grid grid-cols-3 gap-4 text-center"
        >
          <div className="text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xs text-gray-600">Esplora la città</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-xs text-gray-600">Guadagna punti</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-xs text-gray-600">Sblocca reward</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};