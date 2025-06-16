import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Coins, 
  Gift, 
  Clock, 
  QrCode, 
  Check, 
  X,
  Star,
  MapPin,
  Calendar,
  Coffee,
  Pizza,
  ShoppingBag,
  Percent,
  Award,
  TrendingUp,
  Users,
  Filter,
  Search,
  ArrowLeft,
  Share2,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'sonner';

// Mock tokens data
const mockUserTokens = [
  {
    id: '1',
    token_name: 'Caffè Gratis',
    token_description: 'Un caffè espresso gratuito',
    token_value: 2.50,
    token_type: 'drink',
    required_points: 100,
    claim_code: 'CF2024001',
    claimed_at: new Date('2024-12-10'),
    expires_at: new Date('2024-12-31'),
    redeemed_at: null,
    status: 'claimed',
    tenant: {
      id: '1',
      business_name: 'Bar Central',
      address: 'Via Roma 123',
      phone: '+39 123 456 7890'
    }
  },
  {
    id: '2',
    token_name: 'Pizza 20% Sconto',
    token_description: 'Sconto del 20% su tutte le pizze',
    token_value: 0,
    token_type: 'discount',
    required_points: 200,
    claim_code: 'PZ2024045',
    claimed_at: new Date('2024-12-08'),
    expires_at: new Date('2024-12-25'),
    redeemed_at: new Date('2024-12-09'),
    status: 'redeemed',
    tenant: {
      id: '2',
      business_name: 'Pizzeria Roma',
      address: 'Piazza Garibaldi 45',
      phone: '+39 321 654 0987'
    }
  },
  {
    id: '3',
    token_name: 'Gelato Gratis',
    token_description: 'Un gelato artigianale a scelta',
    token_value: 4.00,
    token_type: 'product',
    required_points: 150,
    claim_code: 'GL2024078',
    claimed_at: new Date('2024-12-12'),
    expires_at: new Date('2025-01-15'),
    redeemed_at: null,
    status: 'claimed',
    tenant: {
      id: '3',
      business_name: 'Gelateria Luna',
      address: 'Via del Corso 88',
      phone: '+39 456 789 0123'
    }
  }
];

const mockAvailableTokens = [
  {
    id: '4',
    token_name: 'Aperitivo per Due',
    token_description: 'Aperitivo completo per 2 persone',
    token_value: 25.00,
    token_type: 'drink',
    required_points: 500,
    quantity_available: 20,
    quantity_claimed: 3,
    expiry_date: new Date('2024-12-31'),
    is_active: true,
    tenant: {
      id: '4',
      business_name: 'Cocktail Lounge',
      address: 'Via Veneto 200',
      city: 'Roma'
    }
  },
  {
    id: '5',
    token_name: 'Cena Romantica',
    token_description: 'Menu degustazione per 2 persone',
    token_value: 80.00,
    token_type: 'food',
    required_points: 1000,
    quantity_available: 10,
    quantity_claimed: 7,
    expiry_date: new Date('2024-12-31'),
    is_active: true,
    tenant: {
      id: '2',
      business_name: 'Ristorante Elegante',
      address: 'Via delle Belle Arti 15',
      city: 'Roma'
    }
  },
  {
    id: '6',
    token_name: 'Smartphone Case',
    token_description: 'Cover protettiva per smartphone',
    token_value: 15.00,
    token_type: 'product',
    required_points: 300,
    quantity_available: 50,
    quantity_claimed: 12,
    expiry_date: new Date('2025-01-31'),
    is_active: true,
    tenant: {
      id: '4',
      business_name: 'TechStore Plus',
      address: 'Corso Vittorio 200',
      city: 'Roma'
    }
  }
];

// Tokens Page Component
export const TokensPage: React.FC = () => {
  const { user, updateUserPoints } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'my-tokens' | 'available'>('my-tokens');
  const [userTokens, setUserTokens] = useState(mockUserTokens);
  const [availableTokens, setAvailableTokens] = useState(mockAvailableTokens);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter user tokens
  const filteredUserTokens = userTokens.filter(token => {
    const matchesSearch = token.token_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         token.tenant.business_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || token.token_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || token.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Filter available tokens
  const filteredAvailableTokens = availableTokens.filter(token => {
    const matchesSearch = token.token_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         token.tenant.business_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || token.token_type === typeFilter;
    const canAfford = user ? user.total_points >= token.required_points : false;
    return matchesSearch && matchesType && token.is_active && (statusFilter !== 'affordable' || canAfford);
  });

  const getTokenIcon = (type: string) => {
    switch (type) {
      case 'drink': return Coffee;
      case 'food': return Pizza;
      case 'product': return ShoppingBag;
      case 'discount': return Percent;
      default: return Gift;
    }
  };

  const getTokenColor = (type: string) => {
    switch (type) {
      case 'drink': return 'text-amber-600 bg-amber-100';
      case 'food': return 'text-red-600 bg-red-100';
      case 'product': return 'text-blue-600 bg-blue-100';
      case 'discount': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'claimed': return 'text-blue-600 bg-blue-100';
      case 'redeemed': return 'text-green-600 bg-green-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'claimed': return 'Attivo';
      case 'redeemed': return 'Utilizzato';
      case 'expired': return 'Scaduto';
      default: return status;
    }
  };

  const handleClaimToken = async (token: any) => {
    if (!user || user.total_points < token.required_points) {
      toast.error('Punti insufficienti');
      return;
    }

    try {
      // Simulate API call
      const newToken = {
        ...token,
        id: `claimed_${Date.now()}`,
        claim_code: `T4G${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        claimed_at: new Date(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: 'claimed'
      };

      setUserTokens(prev => [newToken, ...prev]);
      updateUserPoints(-token.required_points);
      
      // Update available token quantities
      setAvailableTokens(prev => prev.map(t => 
        t.id === token.id ? { ...t, quantity_claimed: t.quantity_claimed + 1 } : t
      ));

      toast.success(`Token "${token.token_name}" riscattato!`);
    } catch (error) {
      toast.error('Errore durante il riscatto');
    }
  };

  const calculateDaysUntilExpiry = (expiryDate: Date) => {
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">I Tuoi Token</h1>
        <p className="text-gray-600">Riscatta premi e gestisci i tuoi token</p>
      </div>

      {/* User Points */}
      <Card className="text-center p-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <Coins className="w-8 h-8" />
          <span className="text-3xl font-bold">{user?.total_points?.toLocaleString() || '0'}</span>
        </div>
        <p className="text-primary-100">Punti Disponibili</p>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('my-tokens')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'my-tokens'
              ? 'bg-white text-primary-600 shadow'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          I Miei Token ({userTokens.length})
        </button>
        <button
          onClick={() => setActiveTab('available')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'available'
              ? 'bg-white text-primary-600 shadow'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Disponibili ({availableTokens.length})
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Cerca token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Type Filters */}
          {[
            { value: 'all', label: 'Tutti i tipi' },
            { value: 'drink', label: 'Bevande' },
            { value: 'food', label: 'Cibo' },
            { value: 'product', label: 'Prodotti' },
            { value: 'discount', label: 'Sconti' }
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setTypeFilter(filter.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                typeFilter === filter.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
          
          {/* Status Filters */}
          {activeTab === 'my-tokens' ? (
            [
              { value: 'all', label: 'Tutti' },
              { value: 'claimed', label: 'Attivi' },
              { value: 'redeemed', label: 'Utilizzati' }
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === filter.value
                    ? 'bg-secondary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))
          ) : (
            [
              { value: 'all', label: 'Tutti' },
              { value: 'affordable', label: 'Posso permettermeli' }
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === filter.value
                    ? 'bg-secondary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'my-tokens' ? (
          <motion.div
            key="my-tokens"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="text-center p-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Gift className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{userTokens.length}</h3>
                <p className="text-sm text-gray-600">Token Totali</p>
              </Card>
              <Card className="text-center p-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {userTokens.filter(t => t.status === 'claimed').length}
                </h3>
                <p className="text-sm text-gray-600">Attivi</p>
              </Card>
              <Card className="text-center p-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  €{userTokens.reduce((sum, t) => sum + (t.token_value || 0), 0).toFixed(2)}
                </h3>
                <p className="text-sm text-gray-600">Valore Totale</p>
              </Card>
            </div>

            {/* User Tokens Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUserTokens.map((token, index) => {
                const IconComponent = getTokenIcon(token.token_type);
                const daysUntilExpiry = calculateDaysUntilExpiry(token.expires_at);
                
                return (
                  <motion.div
                    key={token.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <div className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getTokenColor(token.token_type)}`}>
                              <IconComponent className={`w-6 h-6 ${getTokenColor(token.token_type).split(' ')[0]}`} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{token.token_name}</h3>
                              <p className="text-sm text-gray-500">{token.tenant.business_name}</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(token.status)} size="sm">
                            {getStatusLabel(token.status)}
                          </Badge>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-4">{token.token_description}</p>

                        {/* Value */}
                        {token.token_value > 0 && (
                          <div className="text-lg font-bold text-green-600 mb-3">
                            Valore: €{token.token_value.toFixed(2)}
                          </div>
                        )}

                        {/* Expiry */}
                        <div className="flex items-center space-x-2 mb-4 text-sm">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className={`${daysUntilExpiry <= 7 ? 'text-red-600' : 'text-gray-600'}`}>
                            {daysUntilExpiry === 0 ? 'Scade oggi' :
                             daysUntilExpiry === 1 ? 'Scade domani' :
                             `Scade tra ${daysUntilExpiry} giorni`}
                          </span>
                        </div>

                        {/* Claim Code */}
                        {token.status === 'claimed' && (
                          <div className="p-3 bg-gray-50 rounded-lg mb-4">
                            <div className="text-xs text-gray-600 mb-1">Codice di Riscatto</div>
                            <div className="font-mono text-lg font-bold text-gray-900">{token.claim_code}</div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="space-y-2">
                          {token.status === 'claimed' && (
                            <>
                              <Button className="w-full" size="sm">
                                <QrCode className="w-4 h-4 mr-2" />
                                Mostra QR Code
                              </Button>
                              <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" size="sm">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  Dove usare
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Share2 className="w-4 h-4 mr-1" />
                                  Condividi
                                </Button>
                              </div>
                            </>
                          )}
                          {token.status === 'redeemed' && (
                            <div className="text-center text-sm text-gray-500">
                              Utilizzato il {token.redeemed_at?.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {filteredUserTokens.length === 0 && (
              <div className="text-center py-12">
                <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun token trovato</h3>
                <p className="text-gray-500 mb-4">Inizia a guadagnare punti per riscattare i primi token!</p>
                <Button onClick={() => setActiveTab('available')}>
                  Esplora Token Disponibili
                </Button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="available"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Available Tokens Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAvailableTokens.map((token, index) => {
                const IconComponent = getTokenIcon(token.token_type);
                const canAfford = user ? user.total_points >= token.required_points : false;
                const availability = ((token.quantity_available - token.quantity_claimed) / token.quantity_available) * 100;
                
                return (
                  <motion.div
                    key={token.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <div className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getTokenColor(token.token_type)}`}>
                              <IconComponent className={`w-6 h-6 ${getTokenColor(token.token_type).split(' ')[0]}`} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{token.token_name}</h3>
                              <p className="text-sm text-gray-500">{token.tenant.business_name}</p>
                            </div>
                          </div>
                          {!canAfford && (
                            <Badge variant="warning" size="sm">
                              Punti insufficienti
                            </Badge>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-4">{token.token_description}</p>

                        {/* Value and Points */}
                        <div className="flex items-center justify-between mb-4">
                          {token.token_value > 0 && (
                            <div className="text-lg font-bold text-green-600">
                              €{token.token_value.toFixed(2)}
                            </div>
                          )}
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary-600">
                              {token.required_points} punti
                            </div>
                            {user && (
                              <div className="text-xs text-gray-500">
                                Hai {user.total_points} punti
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Availability */}
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Disponibilità</span>
                            <span className="font-medium">
                              {token.quantity_available - token.quantity_claimed}/{token.quantity_available}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${availability > 50 ? 'bg-green-500' : availability > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${availability}%` }}
                            />
                          </div>
                        </div>

                        {/* Expiry */}
                        <div className="flex items-center space-x-2 mb-4 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            Scade il {token.expiry_date.toLocaleDateString()}
                          </span>
                        </div>

                        {/* Action Button */}
                        <Button
                          onClick={() => handleClaimToken(token)}
                          disabled={!canAfford || token.quantity_available <= token.quantity_claimed}
                          className="w-full"
                          variant={canAfford ? 'primary' : 'outline'}
                        >
                          {!canAfford ? (
                            `Servono ${token.required_points - (user?.total_points || 0)} punti`
                          ) : token.quantity_available <= token.quantity_claimed ? (
                            'Esaurito'
                          ) : (
                            <>
                              <Coins className="w-4 h-4 mr-2" />
                              Riscatta ({token.required_points} punti)
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {filteredAvailableTokens.length === 0 && (
              <div className="text-center py-12">
                <Coins className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun token disponibile</h3>
                <p className="text-gray-500">Prova a cambiare i filtri di ricerca</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// QR Code Modal Component
interface QRCodeModalProps {
  token: any;
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ token, isOpen, onClose }) => {
  const qrRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl max-w-md w-full"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Token QR Code</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Token Info */}
          <div className="text-center mb-6">
            <h3 className="font-semibold text-gray-900 mb-1">{token.token_name}</h3>
            <p className="text-sm text-gray-600">{token.tenant.business_name}</p>
          </div>

          {/* QR Code */}
          <div className="bg-gray-100 rounded-lg p-8 mb-6">
            <div ref={qrRef} className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center">
              {/* Mock QR Code */}
              <div className="grid grid-cols-8 gap-1">
                {Array.from({ length: 64 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Claim Code */}
          <div className="text-center mb-6">
            <div className="text-xs text-gray-600 mb-1">Codice di Riscatto</div>
            <div className="font-mono text-lg font-bold text-gray-900 bg-gray-100 rounded-lg py-2">
              {token.claim_code}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">Come utilizzare:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Mostra questo QR code al commerciante</li>
              <li>2. Oppure comunica il codice di riscatto</li>
              <li>3. Il commerciante convaliderà il token</li>
            </ol>
          </div>

          {/* Contact Info */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-2">Dove utilizzare:</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{token.tenant.address}</span>
              </div>
              {token.tenant.phone && (
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-4 text-center">📞</span>
                  <span>{token.tenant.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Salva
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Condividi
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};