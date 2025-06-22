import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  Trophy, 
  Users, 
  Clock, 
  MapPin, 
  Star,
  Calendar,
  Award,
  TrendingUp,
  CheckCircle,
  XCircle,
  Play,
  UserPlus,
  UserMinus,
  ArrowLeft,
  Share2,
  Flag,
  Coins,
  Zap,
  Filter,
  Search
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ProgressBar } from '../components/ui/ProgressBar';
import { toast } from 'sonner';

// Mock challenges data
const mockChallenges = [
  {
    id: '1',
    title: 'Urban Treasure Hunt',
    description: 'Trova 5 location segrete in città per vincere 500 punti',
    challenge_type: 'open',
    challenge_category: 'treasure_hunt',
    localization: 'Centro Storico',
    start_date: new Date('2024-12-01'),
    end_date: new Date('2024-12-31'),
    max_participants: 100,
    entry_fee_points: 0,
    geofence_radius: 1000,
    status: 'active',
    tenant_owner: {
      id: '1',
      business_name: 'Bar Central',
      city: 'Roma'
    },
    rules: {
      objectives: [
        'Scannerizza il tag NFC al Colosseo',
        'Fai check-in alla Fontana di Trevi', 
        'Completa il quiz su Piazza Navona',
        'Trova il tag segreto a Trastevere',
        'Scatta una foto al Pantheon'
      ],
      rewards: [
        { position: 1, points: 500, description: 'Primo posto' },
        { position: 2, points: 300, description: 'Secondo posto' },
        { position: 3, points: 200, description: 'Terzo posto' }
      ]
    },
    participants_count: 47,
    completion_count: 12,
    user_progress: {
      is_participating: true,
      completed_objectives: 2,
      total_objectives: 5,
      current_ranking: 8,
      points_earned: 100
    }
  },
  {
    id: '2',
    title: 'Social Media Champion',
    description: 'Condividi la tua esperienza T4G sui social per vincere premi',
    challenge_type: 'open',
    challenge_category: 'social',
    localization: 'Citywide',
    start_date: new Date('2024-12-15'),
    end_date: new Date('2024-12-22'),
    max_participants: 200,
    entry_fee_points: 0,
    status: 'active',
    tenant_owner: {
      id: '2',
      business_name: 'TechStore Plus',
      city: 'Roma'
    },
    rules: {
      objectives: [
        'Condividi 3 post su Instagram con #T4GRoma',
        'Tagga 5 amici nei tuoi post',
        'Ottieni almeno 20 like totali',
        'Crea una storia con geotag T4G'
      ],
      rewards: [
        { position: 1, points: 300, description: 'Influencer del mese' },
        { position: 2, points: 200, description: 'Social Star' },
        { position: 3, points: 100, description: 'Content Creator' }
      ]
    },
    participants_count: 89,
    completion_count: 23,
    user_progress: {
      is_participating: false,
      completed_objectives: 0,
      total_objectives: 4,
      current_ranking: null,
      points_earned: 0
    }
  },
  {
    id: '3',
    title: 'Pizza Master Challenge',
    description: 'Visita le migliori pizzerie della città e diventa il Pizza Master',
    challenge_type: 'open',
    challenge_category: 'food',
    localization: 'Roma Centro',
    start_date: new Date('2024-11-01'),
    end_date: new Date('2024-11-30'),
    max_participants: 50,
    entry_fee_points: 50,
    status: 'completed',
    tenant_owner: {
      id: '3',
      business_name: 'Pizzeria Roma',
      city: 'Roma'
    },
    rules: {
      objectives: [
        'Visita 5 pizzerie partner',
        'Lascia una recensione per ogni pizzeria',
        'Completa il quiz sulla pizza napoletana',
        'Scatta foto delle tue pizze preferite'
      ],
      rewards: [
        { position: 1, points: 800, description: 'Pizza Master Supremo' },
        { position: 2, points: 500, description: 'Pizza Connoisseur' },
        { position: 3, points: 300, description: 'Pizza Lover' }
      ]
    },
    participants_count: 45,
    completion_count: 41,
    user_progress: {
      is_participating: true,
      completed_objectives: 4,
      total_objectives: 4,
      current_ranking: 5,
      points_earned: 300
    }
  }
];

// Challenges Page Component
export const ChallengesPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState(mockChallenges);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Filter challenges
  const filteredChallenges = challenges.filter(challenge => {
    const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challenge.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || challenge.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || challenge.challenge_category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'treasure_hunt': return Target;
      case 'social': return Share2;
      case 'food': return Award;
      case 'quiz': return Trophy;
      default: return Flag;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'treasure_hunt': return 'text-blue-600 bg-blue-100';
      case 'social': return 'text-green-600 bg-green-100';
      case 'food': return 'text-orange-600 bg-orange-100';
      case 'quiz': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Attiva';
      case 'completed': return 'Completata';
      case 'draft': return 'Bozza';
      case 'cancelled': return 'Annullata';
      default: return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'treasure_hunt': return 'Caccia al Tesoro';
      case 'social': return 'Social Media';
      case 'food': return 'Gastronomia';
      case 'quiz': return 'Quiz';
      default: return category;
    }
  };

  const calculateDaysRemaining = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sfide & Challenges</h1>
        <p className="text-gray-600">Partecipa alle sfide e vinci premi esclusivi</p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Cerca sfide..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Status Filters */}
          <div className="flex space-x-2">
            {[
              { value: 'all', label: 'Tutte' },
              { value: 'active', label: 'Attive' },
              { value: 'completed', label: 'Completate' }
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === filter.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          
          {/* Category Filters */}
          <div className="flex space-x-2">
            {[
              { value: 'all', label: 'Tutte le categorie' },
              { value: 'treasure_hunt', label: 'Caccia al Tesoro' },
              { value: 'social', label: 'Social' },
              { value: 'food', label: 'Food' }
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setCategoryFilter(filter.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  categoryFilter === filter.value
                    ? 'bg-secondary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="text-center p-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">8</h3>
          <p className="text-sm text-gray-600">Partecipazioni</p>
        </Card>
        <Card className="text-center p-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Trophy className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">3</h3>
          <p className="text-sm text-gray-600">Completate</p>
        </Card>
        <Card className="text-center p-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Award className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">1,200</h3>
          <p className="text-sm text-gray-600">Punti Guadagnati</p>
        </Card>
        <Card className="text-center p-4">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Star className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">#12</h3>
          <p className="text-sm text-gray-600">Ranking Globale</p>
        </Card>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredChallenges.map((challenge, index) => {
          const IconComponent = getCategoryIcon(challenge.challenge_category);
          const daysRemaining = calculateDaysRemaining(challenge.end_date);
          
          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getCategoryColor(challenge.challenge_category)}`}>
                        <IconComponent className={`w-6 h-6 ${getCategoryColor(challenge.challenge_category).split(' ')[0]}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
                        <p className="text-sm text-gray-500">{challenge.tenant_owner.business_name}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Badge className={getStatusColor(challenge.status)} size="sm">
                        {getStatusLabel(challenge.status)}
                      </Badge>
                      <Badge variant="default" size="sm">
                        {getCategoryLabel(challenge.challenge_category)}
                      </Badge>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4">{challenge.description}</p>

                  {/* Progress for participating challenges */}
                  {challenge.user_progress.is_participating && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-900">Il tuo progresso</span>
                        <span className="text-sm text-blue-700">
                          {challenge.user_progress.completed_objectives}/{challenge.user_progress.total_objectives}
                        </span>
                      </div>
                      <ProgressBar 
                        progress={(challenge.user_progress.completed_objectives / challenge.user_progress.total_objectives) * 100}
                        color="blue"
                      />
                      {challenge.user_progress.current_ranking && (
                        <div className="mt-2 text-xs text-blue-700">
                          Posizione: #{challenge.user_progress.current_ranking} • {challenge.user_progress.points_earned} punti
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {challenge.participants_count}/{challenge.max_participants || '∞'} partecipanti
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600">{challenge.completion_count} completati</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600">{challenge.localization}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="text-gray-600">
                        {challenge.status === 'active' ? 
                          `${daysRemaining} giorni rimanenti` : 
                          'Terminata'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Entry fee */}
                  {challenge.entry_fee_points > 0 && (
                    <div className="flex items-center space-x-2 mb-4 text-sm">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="text-gray-600">
                        Costo partecipazione: {challenge.entry_fee_points} punti
                      </span>
                    </div>
                  )}

                  {/* Action Button */}
                  <Link to={`/challenges/${challenge.id}`}>
                    <Button 
                      className="w-full"
                      variant={challenge.user_progress.is_participating ? 'outline' : 'primary'}
                    >
                      {challenge.user_progress.is_participating ? (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Continua Sfida
                        </>
                      ) : challenge.status === 'completed' ? (
                        <>
                          <Trophy className="w-4 h-4 mr-2" />
                          Vedi Risultati
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Partecipa
                        </>
                      )}
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredChallenges.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna sfida trovata</h3>
          <p className="text-gray-500">Prova a cambiare i filtri di ricerca</p>
        </div>
      )}
    </div>
  );
};

// Challenge Detail Page Component
export const ChallengeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, updateUserPoints } = useAuthStore();
  const [challenge, setChallenge] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, username: 'UrbanExplorer92', points: 450, completed: 5 },
    { rank: 2, username: 'TreasureHunter', points: 400, completed: 4 },
    { rank: 3, username: 'CityNinja', points: 350, completed: 4 },
    { rank: 4, username: 'AdventureSeeker', points: 300, completed: 3 },
    { rank: 5, username: 'QuestMaster', points: 250, completed: 3 },
  ]);

  useEffect(() => {
    // Find challenge by ID
    const foundChallenge = mockChallenges.find(c => c.id === id);
    setChallenge(foundChallenge);
  }, [id]);

  const handleJoinChallenge = async () => {
    if (!challenge) return;

    if (challenge.entry_fee_points > 0 && user && user.total_points < challenge.entry_fee_points) {
      toast.error('Punti insufficienti per partecipare');
      return;
    }

    try {
      // Simulate API call
      setChallenge((prev: any) => ({
        ...prev,
        user_progress: {
          ...prev.user_progress,
          is_participating: true,
          completed_objectives: 0,
          current_ranking: null,
          points_earned: 0
        },
        participants_count: prev.participants_count + 1
      }));

      if (challenge.entry_fee_points > 0) {
        updateUserPoints(-challenge.entry_fee_points);
      }

      toast.success('Ti sei iscritto alla sfida!');
    } catch (error) {
      toast.error('Errore durante l\'iscrizione');
    }
  };

  const handleLeaveChallenge = async () => {
    if (!challenge) return;

    try {
      setChallenge((prev: any) => ({
        ...prev,
        user_progress: {
          ...prev.user_progress,
          is_participating: false,
          completed_objectives: 0,
          current_ranking: null,
          points_earned: 0
        },
        participants_count: prev.participants_count - 1
      }));

      toast.success('Hai abbandonato la sfida');
    } catch (error) {
      toast.error('Errore durante l\'abbandono');
    }
  };

  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento sfida...</p>
        </div>
      </div>
    );
  }

  const IconComponent = getCategoryIcon(challenge.challenge_category);
  const daysRemaining = calculateDaysRemaining(challenge.end_date);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Back Button */}
      <Button 
        onClick={() => navigate('/challenges')} 
        variant="outline" 
        size="sm"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Torna alle Sfide
      </Button>

      {/* Challenge Header */}
      <Card>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${getCategoryColor(challenge.challenge_category)}`}>
                <IconComponent className={`w-8 h-8 ${getCategoryColor(challenge.challenge_category).split(' ')[0]}`} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{challenge.title}</h1>
                <p className="text-gray-600">{challenge.tenant_owner.business_name} • {challenge.localization}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Badge className={getStatusColor(challenge.status)}>
                {getStatusLabel(challenge.status)}
              </Badge>
              <Badge variant="default">
                {getCategoryLabel(challenge.challenge_category)}
              </Badge>
            </div>
          </div>

          <p className="text-gray-700 mb-6">{challenge.description}</p>

          {/* Challenge Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{challenge.participants_count}</div>
              <div className="text-sm text-gray-600">Partecipanti</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{challenge.completion_count}</div>
              <div className="text-sm text-gray-600">Completate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{daysRemaining}</div>
              <div className="text-sm text-gray-600">Giorni Rimanenti</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{challenge.rules.rewards[0].points}</div>
              <div className="text-sm text-gray-600">Punti Max</div>
            </div>
          </div>

          {/* User Progress */}
          {challenge.user_progress.is_participating && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-blue-900">Il tuo progresso</h3>
                {challenge.user_progress.current_ranking && (
                  <Badge variant="info">
                    Posizione #{challenge.user_progress.current_ranking}
                  </Badge>
                )}
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-blue-700">Obiettivi completati</span>
                  <span className="font-medium text-blue-900">
                    {challenge.user_progress.completed_objectives}/{challenge.user_progress.total_objectives}
                  </span>
                </div>
                <ProgressBar 
                  progress={(challenge.user_progress.completed_objectives / challenge.user_progress.total_objectives) * 100}
                  color="blue"
                />
              </div>
              <div className="text-sm text-blue-700">
                Punti guadagnati: {challenge.user_progress.points_earned}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {challenge.status === 'active' && (
              <>
                {challenge.user_progress.is_participating ? (
                  <Button onClick={handleLeaveChallenge} variant="outline" className="flex-1">
                    <UserMinus className="w-4 h-4 mr-2" />
                    Abbandona Sfida
                  </Button>
                ) : (
                  <Button onClick={handleJoinChallenge} className="flex-1">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Partecipa {challenge.entry_fee_points > 0 && `(${challenge.entry_fee_points} punti)`}
                  </Button>
                )}
              </>
            )}
            <Button variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Condividi
            </Button>
          </div>
        </div>
      </Card>

      {/* Challenge Details Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Objectives */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Obiettivi</h2>
              <div className="space-y-3">
                {challenge.rules.objectives.map((objective: string, index: number) => {
                  const isCompleted = challenge.user_progress.is_participating && 
                                    index < challenge.user_progress.completed_objectives;
                  
                  return (
                    <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      isCompleted ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : (
                          <span className="text-white text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      <span className={`flex-1 ${isCompleted ? 'text-green-800' : 'text-gray-700'}`}>
                        {objective}
                      </span>
                      {isCompleted && (
                        <Badge variant="success" size="sm">Completato</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Rewards */}
          <Card className="mt-6">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Premi</h2>
              <div className="space-y-3">
                {challenge.rules.rewards.map((reward: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                      }`}>
                        <span className="text-white text-sm font-bold">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{reward.description}</div>
                        <div className="text-sm text-gray-600">{reward.position}° posto</div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-orange-600">
                      {reward.points} punti
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Challenge Info */}
          <Card>
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Informazioni</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Inizio:</span>
                  <span className="font-medium">{challenge.start_date.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fine:</span>
                  <span className="font-medium">{challenge.end_date.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-medium">{challenge.challenge_type === 'open' ? 'Aperta' : 'Privata'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Area:</span>
                  <span className="font-medium">{challenge.geofence_radius}m</span>
                </div>
                {challenge.entry_fee_points > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Costo:</span>
                    <span className="font-medium">{challenge.entry_fee_points} punti</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Leaderboard */}
          <Card>
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Classifica</h3>
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {player.rank}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{player.username}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{player.points}p</div>
                      <div className="text-xs text-gray-500">{player.completed}/5</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link to={`/challenges/${challenge.id}/leaderboard`}>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  Vedi Classifica Completa
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Helper functions (moved outside to avoid recreation)
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'treasure_hunt': return Target;
    case 'social': return Share2;
    case 'food': return Award;
    case 'quiz': return Trophy;
    default: return Flag;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'treasure_hunt': return 'text-blue-600 bg-blue-100';
    case 'social': return 'text-green-600 bg-green-100';
    case 'food': return 'text-orange-600 bg-orange-100';
    case 'quiz': return 'text-purple-600 bg-purple-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'text-green-600 bg-green-100';
    case 'completed': return 'text-gray-600 bg-gray-100';
    case 'draft': return 'text-yellow-600 bg-yellow-100';
    case 'cancelled': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return 'Attiva';
    case 'completed': return 'Completata';
    case 'draft': return 'Bozza';
    case 'cancelled': return 'Annullata';
    default: return status;
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'treasure_hunt': return 'Caccia al Tesoro';
    case 'social': return 'Social Media';
    case 'food': return 'Gastronomia';
    case 'quiz': return 'Quiz';
    default: return category;
  }
};

const calculateDaysRemaining = (endDate: Date) => {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};