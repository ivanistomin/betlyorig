const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock } from 'lucide-react';
import GemIcon from '@/components/common/GemIcon.jsx';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTelegram } from '@/lib/useTelegram';
import { useProfile } from '@/lib/useProfile';
import { useLang } from '@/lib/i18n';
import { toast } from 'sonner';

const BUILT_IN_MISSIONS = [
  { id: 'daily_login',    title: 'Ежедневный вход',       titleEn: 'Daily Check-in',       description: 'Открой Betly сегодня',          descEn: 'Open Betly today',                    type: 'daily',    reward_gems: 10,  icon: '📅', requirement_type: 'login',         requirement_value: 1  },
  { id: 'place_bet_today',title: 'Сделать ставку',         titleEn: 'Place a Bet',          description: 'Поставь любую ставку сегодня', descEn: 'Place any bet today',                 type: 'daily',    reward_gems: 25,  icon: '🎯', requirement_type: 'place_bet',     requirement_value: 1  },
  { id: 'win_a_bet',      title: 'Победить в ставке',      titleEn: 'Win a Bet',            description: 'Успешно закрой ставку',        descEn: 'Complete a bet successfully',         type: 'daily',    reward_gems: 50,  icon: '🏆', requirement_type: 'win_bet',       requirement_value: 1  },
  { id: 'streak_3',       title: 'Серия из 3',             titleEn: '3-Win Streak',         description: 'Получи серию из 3 побед',      descEn: 'Get a 3-win streak',                  type: 'weekly',   reward_gems: 150, icon: '🔥', requirement_type: 'streak',        requirement_value: 3  },
  { id: 'streak_7',       title: 'Воин недели',            titleEn: 'Week Warrior',         description: 'Серия из 7 побед',             descEn: 'Get a 7-win streak',                  type: 'weekly',   reward_gems: 500, icon: '⚡', requirement_type: 'streak',        requirement_value: 7  },
  { id: 'invite_friend',  title: 'Пригласить друга',       titleEn: 'Invite a Friend',      description: 'Пригласи 1 друга в Betly',     descEn: 'Invite 1 friend to Betly',            type: 'one_time', reward_gems: 200, icon: '👥', requirement_type: 'invite_friend', requirement_value: 1  },
  { id: 'invite_3_friends',title: 'Команда мечты',          titleEn: 'Squad Goals',          description: 'Пригласи 3 друзей',            descEn: 'Invite 3 friends',                    type: 'one_time', reward_gems: 500, icon: '🤝', requirement_type: 'invite_friend', requirement_value: 3  },
  { id: 'total_5_bets',   title: 'Начало пути',            titleEn: 'Getting Started',      description: 'Сделай 5 ставок всего',        descEn: 'Place 5 bets total',                  type: 'one_time', reward_gems: 100, icon: '🚀', requirement_type: 'total_bets',    requirement_value: 5  },
  { id: 'total_20_bets',  title: 'Ветеран',                titleEn: 'Veteran Player',       description: 'Сделай 20 ставок всего',       descEn: 'Place 20 bets total',                 type: 'one_time', reward_gems: 300, icon: '👑', requirement_type: 'total_bets',    requirement_value: 20 },
];

// Key for daily reset — store as "YYYY-MM-DD"
const today = () => new Date().toISOString().slice(0, 10);
const DAILY_RESET_KEY = 'betly_daily_missions_reset';

function isDailyClaimExpired(claimDate) {
  // claim is from today if claimDate starts with today's date string
  if (!claimDate) return true;
  return claimDate.slice(0, 10) !== today();
}

function getMissionProgress(mission, profile, bets = []) {
  if (!profile) return { progress: 0, target: mission.requirement_value };
  switch (mission.requirement_type) {
    case 'login':         return { progress: 1, target: 1 };
    case 'streak':        return { progress: profile.current_streak || 0, target: mission.requirement_value };
    case 'invite_friend': return { progress: (profile.tg_friends_ids || []).length, target: mission.requirement_value };
    case 'total_bets':    return { progress: (profile.bets_won || 0) + (profile.bets_lost || 0), target: mission.requirement_value };
    case 'place_bet':     return { progress: bets.length > 0 ? 1 : 0, target: 1 };
    case 'win_bet':       return { progress: bets.filter(b => b.status === 'completed').length > 0 ? 1 : 0, target: 1 };
    default:              return { progress: 0, target: mission.requirement_value };
  }
}

export default function Missions() {
  const [tab, setTab] = useState('daily');
  const { tgUser } = useTelegram();
  const { profile, user, refreshProfile } = useProfile(tgUser);
  const { lang, t } = useLang();
  const qc = useQueryClient();

  const { data: claimedMissions = [], refetch: refetchClaimed } = useQuery({
    queryKey: ['user-missions', user?.email],
    queryFn: () => db.entities.UserMission.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const { data: todayBets = [] } = useQuery({
    queryKey: ['today-bets', user?.email],
    queryFn: async () => {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const all = await db.entities.Bet.filter({ user_email: user.email });
      return all.filter(b => new Date(b.created_date) >= todayStart);
    },
    enabled: !!user,
  });

  const claimMutation = useMutation({
    mutationFn: async (mission) => {
      // For daily missions: delete old record if it exists and is from a previous day, then create new
      if (mission.type === 'daily') {
        const existing = claimedMissions.find(m => m.mission_id === mission.id);
        if (existing) {
          await db.entities.UserMission.delete(existing.id);
        }
      }
      await db.entities.UserMission.create({
        user_email: user.email,
        mission_id: mission.id,
        progress: mission.requirement_value,
        completed: true,
        claimed: true,
        completed_at: new Date().toISOString(),
      });
      await db.entities.UserProfile.update(profile.id, {
        gems_balance: profile.gems_balance + mission.reward_gems,
        total_gems_earned: (profile.total_gems_earned || 0) + mission.reward_gems,
      });
    },
    onSuccess: (_, mission) => {
      toast.success(`+${mission.reward_gems} GEMS ${lang === 'ru' ? 'получено!' : 'claimed!'}`);
      qc.invalidateQueries({ queryKey: ['user-missions'] });
      refreshProfile();
    },
  });

  const filtered = BUILT_IN_MISSIONS.filter(m => m.type === tab);

  // Check claimed — for daily missions check if claimed TODAY
  const isClaimedToday = (missionId, type) => {
    const record = claimedMissions.find(m => m.mission_id === missionId && m.claimed);
    if (!record) return false;
    if (type === 'daily') {
      return !isDailyClaimExpired(record.completed_at);
    }
    return true; // one_time / weekly always claimed once done
  };

  const tabLabels = {
    daily:    lang === 'ru' ? '📅 Ежедневные' : '📅 Daily',
    weekly:   lang === 'ru' ? '📆 Недельные'  : '📆 Weekly',
    one_time: lang === 'ru' ? '⭐ Разовые'    : '⭐ One-Time',
  };

  return (
    <div className="px-4 pt-6 space-y-5 pb-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          {lang === 'ru' ? 'Миссии' : 'Missions'}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
          {lang === 'ru' ? 'Выполняй миссии — получай GEMS' : 'Complete missions — earn GEMS'} <GemIcon className="w-4 h-4" />
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full bg-secondary">
          {Object.entries(tabLabels).map(([key, label]) => (
            <TabsTrigger key={key} value={key} className="flex-1 text-xs">{label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {filtered.map((mission, i) => {
              const claimed = isClaimedToday(mission.id, mission.type);
              const { progress, target } = getMissionProgress(mission, profile, todayBets);
              const isReady = progress >= target && !claimed;
              const pct = Math.min((progress / target) * 100, 100);
              const title = lang === 'ru' ? mission.title : mission.titleEn;
              const desc = lang === 'ru' ? mission.description : mission.descEn;

              return (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-xl border p-4 space-y-3 transition-all ${
                    claimed ? 'bg-muted/30 border-border/20 opacity-50' :
                    isReady ? 'bg-neon-gold/5 border-neon-gold/30' :
                    'bg-card border-border/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl ${claimed ? 'bg-success/10' : 'bg-secondary'}`}>
                        {claimed ? '✅' : mission.icon}
                      </div>
                      <div>
                        <p className="font-heading font-semibold text-foreground text-sm">{title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-400/20">
                      <span className="text-xs font-heading font-bold text-blue-300">+{mission.reward_gems}</span>
                      <GemIcon className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {target > 1 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{lang === 'ru' ? 'Прогресс' : 'Progress'}</span>
                        <span>{Math.min(progress, target)} / {target}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-neon-cyan transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {!claimed && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      disabled={!isReady || claimMutation.isPending}
                      onClick={() => claimMutation.mutate(mission)}
                      className={`w-full py-2 rounded-lg text-sm font-heading font-semibold transition-all ${
                        isReady
                          ? 'bg-gradient-to-r from-neon-gold to-amber-400 text-black'
                          : 'bg-secondary text-muted-foreground cursor-not-allowed'
                      }`}
                    >
                      {isReady
                        ? (lang === 'ru' ? '🎁 Забрать награду' : '🎁 Claim Reward')
                        : <span className="flex items-center justify-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {lang === 'ru' ? 'В процессе' : 'In Progress'}</span>
                      }
                    </motion.button>
                  )}
                  {claimed && (
                    <div className="flex items-center justify-center gap-1.5 text-success text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" /> {lang === 'ru' ? 'Получено' : 'Claimed'}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}