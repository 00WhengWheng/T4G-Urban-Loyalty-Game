import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Navigation, 
  Filter, 
  Search, 
  Star, 
  Clock, 
  Phone,
  Globe,
  X,
  Zap,
  Coffee,
  Utensils,
  ShoppingBag,
  Heart,
  Info
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

// Mock data for merchants
const mockMerchants = [
  {
    id: '1',
    business_name: 'Bar Central',
    business_type: 'cafe',
    latitude: 40.7128,
    longitude: -74.0060,
    address: 'Via Roma 123, Centro',
    description: 'Il miglior caffè in città con Wi-Fi gratuito',
    rating: 4.5,
    distance: 0.2,
    isOpen: true,
    phone: '+39 123 456 7890',
    website: 'www.barcentral.it',
    nfc_tags: 2,
    active_tokens: [
      { name: 'Caffè Gratis', points: 100 },
      { name: '10% Sconto', points: 50 }
    ],
    photos: ['/api/placeholder/300/200']
  },
  {
    id: '2',
    business_name: 'Pizzeria Roma',
    business_type: 'restaurant',
    latitude: 40.7589,
    longitude: -73.9851,
    address: 'Piazza Garibaldi 45',
    description: 'Pizza napoletana autentica',
    rating: 4.8,
    distance: 0.5,
    isOpen: true,
    phone: '+39 321 654 0987',
    website: 'www.pizzeriaroma.com',
    nfc_tags: 1,
    active_tokens: [
      { name: 'Pizza 20% Off', points: 200 }
    ],
    photos: ['/api/placeholder/300/200']
  },
  {
    id: '3',
    business_name: 'Gelateria Luna',
    business_type: 'dessert',
    latitude: 40.7505,
    longitude: -73.9934,
    address: 'Via del Corso 88',
    description: 'Gelato artigianale dal 1950',
    rating: 4.6,
    distance: 0.8,
    isOpen: false,
    phone: '+39 456 789 0123',
    website: 'www.gelaterialuna.it',
    nfc_tags: 1,
    active_tokens: [
      { name: 'Gelato Gratis', points: 150 }
    ],
    photos: ['/api/placeholder/300/200']
  },
  {
    id: '4',
    business_name: 'TechStore Plus',
    business_type: 'electronics',
    latitude: 40.7282,
    longitude: -74.0776,
    address: 'Corso Vittorio 200',
    description: 'Tecnologia e accessori',
    rating: 4.2,
    distance: 1.2,
    isOpen: true,
    phone: '+39 789 012 3456',
    website: 'www.techstoreplus.com',
    nfc_tags: 3,
    active_tokens: [
      { name: 'Sconto 15%', points: 300 },
      { name: 'Accessorio Gratis', points: 500 }
    ],
    photos: ['/api/placeholder/300/200']
  }
];

// Business type icons and colors
const businessTypeConfig = {
  cafe: { icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-100' },
  restaurant: { icon: Utensils, color: 'text-red-600', bg: 'bg-red-100' },
  dessert: { icon: Heart, color: 'text-pink-600', bg: 'bg-pink-100' },
  electronics: { icon: Zap, color: 'text-blue-600', bg: 'bg-blue-100' },
  retail: { icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-100' },
  default: { icon: MapPin, color: 'text-gray-600', bg: 'bg-gray-100' }
};

function getBusinessIcon(type: string) {
  const config = businessTypeConfig[type as keyof typeof businessTypeConfig] || businessTypeConfig.default;
  return config;
}

export const MapPage: React.FC = () => {
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [merchants, setMerchants] = useState(mockMerchants);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapRef = useRef<any>(null);

  // Mock geolocation
  useEffect(() => {
    // Simulate getting user location
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation([latitude, longitude]);
            setMapCenter([latitude, longitude]);
          },
          (error) => {
            console.log('Geolocation error:', error);
            // Use default location (New York for demo)
            setUserLocation([40.7128, -74.0060]);
          }
        );
      }
    };

    getUserLocation();
  }, []);

  // Filter merchants based on search and type
  const filteredMerchants = merchants.filter(merchant => {
    const matchesSearch = merchant.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         merchant.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || merchant.business_type === filterType;
    return matchesSearch && matchesType;
  });

  // Simulate map loading (replace with actual Leaflet implementation)
  useEffect(() => {
    const timer = setTimeout(() => setIsMapLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleMerchantClick = (merchant: any) => {
    setSelectedMerchant(merchant);
    setMapCenter([merchant.latitude, merchant.longitude]);
  };

  const getBusinessIcon = (type: string) => {
    const config = businessTypeConfig[type as keyof typeof businessTypeConfig] || businessTypeConfig.default;
    return config;
  };

  const centerOnUserLocation = () => {
    if (userLocation) {
      setMapCenter(userLocation);
    }
  };

  return (
    <div className="h-screen relative bg-gray-100 overflow-hidden">
      {/* Search and Filter Bar */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex space-x-2">
          {/* Search Input */}
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Cerca commercianti..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="bg-white shadow-lg border-0"
            />
          </div>
          
          {/* Filter Button */}
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? 'primary' : 'outline'}
            className="bg-white shadow-lg"
          >
            <Filter className="w-4 h-4" />
          </Button>

          {/* Location Button */}
          <Button
            onClick={centerOnUserLocation}
            variant="outline"
            className="bg-white shadow-lg"
          >
            <Navigation className="w-4 h-4" />
          </Button>
        </div>

        {/* Filter Options */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 p-4 bg-white rounded-lg shadow-lg"
            >
              <h3 className="text-sm font-medium text-gray-900 mb-3">Filtra per categoria</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'Tutti' },
                  { value: 'cafe', label: 'Bar & Caffè' },
                  { value: 'restaurant', label: 'Ristoranti' },
                  { value: 'dessert', label: 'Dolci' },
                  { value: 'electronics', label: 'Elettronica' },
                  { value: 'retail', label: 'Negozi' }
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setFilterType(type.value)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filterType === type.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map Container */}
      <div className="h-full w-full relative">
        {!isMapLoaded ? (
          <div className="h-full w-full flex items-center justify-center bg-gray-200">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Caricamento mappa...</p>
            </div>
          </div>
        ) : (
          <div className="h-full w-full bg-gray-200 relative">
            {/* Mock Map Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100">
              <div className="absolute inset-0 opacity-20">
                {/* Mock street pattern */}
                <svg className="w-full h-full">
                  <defs>
                    <pattern id="streets" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                      <path d="M 0 50 L 100 50" stroke="#333" strokeWidth="2" opacity="0.3"/>
                      <path d="M 50 0 L 50 100" stroke="#333" strokeWidth="2" opacity="0.3"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#streets)" />
                </svg>
              </div>
            </div>

            {/* User Location Marker */}
            {userLocation && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg">
                  <div className="w-8 h-8 bg-blue-200 rounded-full absolute -top-2 -left-2 animate-pulse opacity-50"></div>
                </div>
              </div>
            )}

            {/* Merchant Markers */}
            {filteredMerchants.map((merchant, index) => {
              const config = getBusinessIcon(merchant.business_type);
              const IconComponent = config.icon;
              
              return (
                <motion.div
                  key={merchant.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="absolute z-10 cursor-pointer"
                  style={{
                    top: `${20 + (index % 3) * 20}%`,
                    left: `${20 + (index % 4) * 20}%`,
                  }}
                  onClick={() => handleMerchantClick(merchant)}
                >
                  <div className={`w-10 h-10 ${config.bg} rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition-transform ${
                    selectedMerchant?.id === merchant.id ? 'ring-2 ring-primary-500' : ''
                  }`}>
                    <IconComponent className={`w-5 h-5 ${config.color}`} />
                  </div>
                  
                  {/* Status Indicator */}
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white ${
                    merchant.isOpen ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Merchant List (Bottom Sheet) */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <motion.div
          initial={{ y: '60%' }}
          animate={{ y: selectedMerchant ? '0%' : '60%' }}
          className="bg-white rounded-t-xl shadow-2xl"
        >
          {/* Handle */}
          <div className="flex justify-center py-2">
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
          </div>

          {/* Merchant List */}
          <div className="px-4 pb-safe-bottom">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {filteredMerchants.length} commercianti trovati
              </h2>
              {selectedMerchant && (
                <button
                  onClick={() => setSelectedMerchant(null)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {selectedMerchant ? (
              /* Selected Merchant Detail */
              <MerchantDetail merchant={selectedMerchant} />
            ) : (
              /* Merchant List */
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {filteredMerchants.map((merchant) => (
                  <MerchantCard
                    key={merchant.id}
                    merchant={merchant}
                    onClick={() => handleMerchantClick(merchant)}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Merchant Card Component
const MerchantCard: React.FC<{ merchant: any; onClick: () => void }> = ({ merchant, onClick }) => {
  const config = getBusinessIcon(merchant.business_type);
  const IconComponent = config.icon;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <div className="p-4" onClick={onClick}>
        <div className="flex items-start justify-between">
          <div className="flex space-x-3 flex-1">
            <div className={`w-12 h-12 ${config.bg} rounded-lg flex items-center justify-center`}>
              <IconComponent className={`w-6 h-6 ${config.color}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {merchant.business_name}
                </h3>
                <Badge 
                  variant={merchant.isOpen ? 'success' : 'error'}
                  size="sm"
                >
                  {merchant.isOpen ? 'Aperto' : 'Chiuso'}
                </Badge>
              </div>
              
              <p className="text-xs text-gray-500 mb-2">{merchant.address}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-gray-600">{merchant.rating}</span>
                  </div>
                  <span className="text-xs text-gray-500">{merchant.distance}km</span>
                </div>
                
                <div className="text-xs text-primary-600 font-medium">
                  {merchant.active_tokens.length} reward attivi
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Merchant Detail Component
const MerchantDetail: React.FC<{ merchant: any }> = ({ merchant }) => {
  const config = getBusinessIcon(merchant.business_type);
  const IconComponent = config.icon;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start space-x-4">
        <div className={`w-16 h-16 ${config.bg} rounded-xl flex items-center justify-center`}>
          <IconComponent className={`w-8 h-8 ${config.color}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{merchant.business_name}</h3>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant={merchant.isOpen ? 'success' : 'error'} size="sm">
              {merchant.isOpen ? 'Aperto' : 'Chiuso'}
            </Badge>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">{merchant.rating}</span>
            </div>
            <span className="text-xs text-gray-500">{merchant.distance}km</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">{merchant.address}</p>
        </div>
      </div>
      {/* Description */}
      <p className="text-gray-700 text-sm">{merchant.description}</p>
      {/* Contact Info */}
      <div className="flex items-center space-x-4 text-sm text-gray-600">
        <div className="flex items-center space-x-1">
          <Phone className="w-4 h-4" />
          <span>{merchant.phone}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Globe className="w-4 h-4" />
          <a href={`https://${merchant.website}`} target="_blank" rel="noopener noreferrer" className="underline">{merchant.website}</a>
        </div>
      </div>
      {/* Rewards */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">Reward attivi</h4>
        <div className="flex flex-wrap gap-2">
          {merchant.active_tokens.map((token: any, idx: number) => (
            <Badge key={idx} variant="info" size="sm">
              {token.name} - {token.points} punti
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
