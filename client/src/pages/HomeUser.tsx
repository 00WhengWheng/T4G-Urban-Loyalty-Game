import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Gamepad2, 
  Trophy, 
  Coins, 
  QrCode, 
  Star,
  TrendingUp,
  Award,
  Users,
  Zap
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StatsCard } from '../components/ui/StatsCard';
import { WelcomeHeader } from '../components/dashboard/WelcomeHeader';
import { QuickActions } from '../components/dashboard/QuickActions';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { LeaderboardPreview } from '../components/dashboard/LeaderboardPreview';

export const HomeUser: React.FC = () => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    weeklyPoints: 0,
    dailyStreak: 0,
    nextLevelPoints: 0,
    activeTokens: 0,
    completedChallenges: 0,
    recentActivities: [],
    topUsers: [],
  });

  useEffect(() => {
    // Simulate loading dashboard data
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      // Mock data - replace with actual API calls
      setTimeout(() => {
        setDashboardData({
          weeklyPoints: 250,
          dailyStreak: 7,
          nextLevelPoints: 150,
          activeTokens: 3,
          completedChallenges: 12,
          recentActivities: [
            { id: 1, type: 'nfc_scan', description: 'Scansione NFC da Bar Central', points: 10, timestamp: new Date() },
            { id: 2, type: 'quiz_completed', description: 'Quiz completato', points: 25, timestamp: new Date() },
            { id: 3, type: 'challenge_joined', description: 'Iscritto al Treasure Hunt', points: 0, timestamp: new Date() },
          ],
          topUsers: [
            { id: 1, username: 'GamerPro', points: 2450, level: 8 },
            { id: 2, username: 'UrbanExplorer', points: 2350, level: 7 },
            { id: 3, username: 'ChallengeKing', points: 2250, level: 7 },
          ],
        });
        setIsLoading(false);
      }, 1000);
    };

    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const userLevel = user?.level || 1;
  const userPoints = user?.total_points || 0;
  const progressToNextLevel = Math.min((userPoints % 500) / 500 * 100, 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Welcome Header */}
      <WelcomeHeader 
        user={user}
        level={userLevel}
        points={userPoints}
        progressToNextLevel={progressToNextLevel}
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Punti Settimana"
          value={dashboardData.weeklyPoints}
          icon={<TrendingUp className="w-5 h-5" />}
          color="blue"
          trend="+12%"
        />
        <StatsCard
          title="Giorni Consecutivi"
          value={dashboardData.dailyStreak}
          icon={<Zap className="w-5 h-5" />}
          color="yellow"
          trend="🔥"
        />
        <StatsCard
          title="Token Attivi"
          value={dashboardData.activeTokens}
          icon={<Coins className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Challenge Completate"
          value={dashboardData.completedChallenges}
          icon={<Award className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Main Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interactive Map Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Esplora la Mappa</h3>
                    <p className="text-blue-100">
                      Scopri commercianti vicino a te e guadagna punti
                    </p>
                  </div>
                  <MapPin className="w-8 h-8 text-blue-200" />
                </div>
                <Link 
                  to="/map"
                  className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
                >
                  Apri Mappa
                  <MapPin className="ml-2 w-4 h-4" />
                </Link>
              </div>
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
            </Card>
          </motion.div>

          {/* Quick Games Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Quick Games</h3>
                  <Link 
                    to="/games"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Vedi tutti
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Quiz Game */}
                  <Link 
                    to="/games?type=quiz"
                    className="group block p-4 rounded-lg border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all"
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <Award className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-medium text-gray-900">Quiz Challenge</h4>
                        <p className="text-sm text-gray-500">25 punti</p>
                      </div>
                    </div>
                  </Link>

                  {/* Reaction Game */}
                  <Link 
                    to="/games?type=reaction"
                    className="group block p-4 rounded-lg border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all"
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                        <Zap className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-medium text-gray-900">Reaction Time</h4>
                        <p className="text-sm text-gray-500">15 punti</p>
                      </div>
                    </div>
                  </Link>

                  {/* Memory Game */}
                  <Link 
                    to="/games?type=memory"
                    className="group block p-4 rounded-lg border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all"
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <Star className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-medium text-gray-900">Memory Match</h4>
                        <p className="text-sm text-gray-500">20 punti</p>
                      </div>
                    </div>
                  </Link>

                  {/* NFC Scan */}
                  <Link 
                    to="/scan"
                    className="group block p-4 rounded-lg border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all"
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <QrCode className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-medium text-gray-900">Scansiona NFC</h4>
                        <p className="text-sm text-gray-500">10+ punti</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Active Challenges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Challenge Attive</h3>
                  <Link 
                    to="/challenges"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Vedi tutte
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {/* Sample Active Challenge */}
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Urban Treasure Hunt</h4>
                      <Badge variant="success">Attiva</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Trova 5 location segrete in città per vincere 500 punti
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="w-4 h-4 mr-1" />
                        <span>47 partecipanti</span>
                      </div>
                      <div className="text-sm font-medium text-purple-600">
                        2/5 completati
                      </div>
                    </div>
                    <ProgressBar progress={40} className="mt-2" />
                  </div>

                  {/* Another Challenge */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Social Media Champion</h4>
                      <Badge variant="warning">2 giorni rimanenti</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Condividi la tua esperienza T4G sui social per 200 punti
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <Trophy className="w-4 h-4 mr-1" />
                        <span>200 punti</span>
                      </div>
                      <Link 
                        to="/challenges/social-champion"
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        Partecipa →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* User Level Progress */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <div className="p-6">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-2">
                    {userLevel}
                  </div>
                  <h3 className="font-semibold text-gray-900">Livello {userLevel}</h3>
                  <p className="text-sm text-gray-500">Urban Explorer</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progresso</span>
                    <span className="font-medium">{userPoints % 500}/500</span>
                  </div>
                  <ProgressBar progress={progressToNextLevel} />
                  <p className="text-xs text-gray-500 text-center">
                    {500 - (userPoints % 500)} punti al prossimo livello
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Active Tokens */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">I Tuoi Token</h3>
                  <Link 
                    to="/tokens"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Vedi tutti
                  </Link>
                </div>
                
                <div className="space-y-3">
                  {/* Sample Token */}
                  <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Coins className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="ml-3 flex-1">
                      <h4 className="text-sm font-medium text-gray-900">Caffè Gratis</h4>
                      <p className="text-xs text-gray-500">Bar Central</p>
                    </div>
                    <Badge variant="success" size="sm">Attivo</Badge>
                  </div>

                  <div className="flex items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Coins className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="ml-3 flex-1">
                      <h4 className="text-sm font-medium text-gray-900">Pizza 20% Off</h4>
                      <p className="text-xs text-gray-500">Pizzeria Roma</p>
                    </div>
                    <Badge variant="warning" size="sm">2 giorni</Badge>
                  </div>

                  <div className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Coins className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="ml-3 flex-1">
                      <h4 className="text-sm font-medium text-gray-900">Gelato Gratis</h4>
                      <p className="text-xs text-gray-500">Gelateria Luna</p>
                    </div>
                    <Badge variant="success" size="sm">Attivo</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Leaderboard Preview */}
          <LeaderboardPreview topUsers={dashboardData.topUsers} />

          {/* Recent Activity */}
          <RecentActivity activities={dashboardData.recentActivities} />
        </div>
      </div>
    </div>
  );
};