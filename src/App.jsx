import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { LangProvider } from '@/lib/i18n';

import AppLayout from '@/components/layout/AppLayout';
import WelcomeModal from '@/components/onboarding/WelcomeModal';
import Dashboard from '@/pages/Dashboard';
import NewBet from '@/pages/NewBet';
import MyBets from '@/pages/MyBets';
import Leaderboard from '@/pages/Leaderboard';
import Profile from '@/pages/Profile';
import Missions from '@/pages/Missions';
import Exchange from '@/pages/Exchange';
import CommunityBets from '@/pages/CommunityBets';
import BattlePass from '@/pages/BattlePass';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-heading">Loading...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // In Telegram Mini App context — avoid redirect loop, just show content
      const isTMA = !!window?.Telegram?.WebApp?.initData;
      if (isTMA) {
        // Let it through — TMA handles auth differently
      } else {
        navigateToLogin();
        return null;
      }
    }
  }

  return (
    <>
      <WelcomeModal />
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new-bet" element={<NewBet />} />
        <Route path="/bets" element={<MyBets />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/missions" element={<Missions />} />
        <Route path="/exchange" element={<Exchange />} />
        <Route path="/community" element={<CommunityBets />} />
        <Route path="/battle-pass" element={<BattlePass />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <LangProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
      </LangProvider>
    </AuthProvider>
  )
}

export default App