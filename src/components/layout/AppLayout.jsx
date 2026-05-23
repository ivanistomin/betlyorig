import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Trophy, Sword, Gem, Plus, Shield, User, Gamepad2 } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { useProfile } from '@/lib/useProfile';

const NAV_ITEMS = [
  { path: '/game',       icon: Gamepad2,labelKey: 'game' },
  { path: '/missions',   icon: Sword,   labelKey: 'missions' },
  { path: '/bets',       icon: Target,  labelKey: 'bets' },
  { path: '/new-bet',    icon: Plus,    isCenter: true },
  { path: '/avatar',     icon: User,    labelKey: 'avatar' },
  { path: '/leaderboard',icon: Trophy,  labelKey: 'rank' },
  { path: '/exchange',   icon: Gem,     labelKey: 'exchange' },
];

function BottomNav() {
  const location = useLocation();
  const { t } = useLang();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* LiquidGlass pill */}
      <div className="flex justify-center pb-3 px-2">
        <div
          className="flex items-center gap-0.5 px-1.5 h-[62px] rounded-[28px]"
          style={{
            background: 'rgba(22, 16, 38, 0.45)',
            backdropFilter: 'blur(40px) saturate(200%) brightness(1.15)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%) brightness(1.15)',
            border: '1px solid rgba(255,255,255,0.13)',
            boxShadow:
              '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.3)',
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            if (item.isCenter) {
              return (
                <Link key={item.path} to={item.path} className="mx-1">
                  <motion.div
                    whileTap={{ scale: 0.88 }}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, hsl(265 90% 60%), hsl(180 80% 50%))',
                      boxShadow: '0 0 20px hsl(265 90% 60% / 0.6), 0 4px 12px rgba(0,0,0,0.4)',
                    }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </motion.div>
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center justify-center gap-0.5 px-1.5 h-full rounded-2xl transition-all"
                style={{
                  minWidth: 42,
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  boxShadow: isActive ? 'inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
                }}
              >
                <motion.div whileTap={{ scale: 0.85 }}>
                  <Icon
                    className="w-5 h-5 transition-all"
                    style={{ color: isActive ? 'hsl(265 90% 70%)' : 'rgba(255,255,255,0.4)' }}
                  />
                </motion.div>
                <span
                  className="text-[9px] font-heading font-semibold transition-all"
                  style={{ color: isActive ? 'hsl(265 90% 70%)' : 'rgba(255,255,255,0.35)' }}
                >
                  {t(item.labelKey)}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="liquid-indicator"
                    className="absolute bottom-1.5 w-1 h-1 rounded-full"
                    style={{ background: 'hsl(265 90% 70%)' }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function TopBar() {
  const { profile } = useProfile();
  const isAdmin = !!profile?.is_admin;

  return (
    <div
      className="sticky top-0 z-40 flex items-center justify-center px-4 h-12 relative"
      style={{
        background: 'rgba(18, 14, 30, 0.6)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <Link to="/">
        <motion.span
          whileTap={{ scale: 0.95 }}
          className="font-heading font-black text-xl tracking-tight bg-gradient-to-r from-primary via-neon-cyan to-neon-gold bg-clip-text text-transparent select-none"
        >
          Betly
        </motion.span>
      </Link>

      {isAdmin && (
        <Link
          to="/moderation"
          aria-label="Moderation"
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, hsl(265 90% 60% / 0.25), hsl(180 80% 50% / 0.25))',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 0 12px hsl(265 90% 60% / 0.35)',
            }}
          >
            <Shield className="w-4 h-4 text-primary" />
          </motion.div>
        </Link>
      )}
    </div>
  );
}

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground betly-bg-mesh">
      <TopBar />
      <main className="pb-28 max-w-lg mx-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}