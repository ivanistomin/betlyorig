import { db } from '@/api/base44Client';
import { useState, useEffect, useCallback } from 'react';

function getInviterTgId() {
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
  const startParam = tg?.initDataUnsafe?.start_param || '';
  if (startParam.startsWith('ref_')) {
    return startParam.replace('ref_', '');
  }
  return null;
}

export function useProfile(tgUser = null) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    let me;
    try {
      me = await db.auth.me();
    } catch {
      setLoading(false);
      return;
    }
    setUser(me);

    const profiles = await db.entities.UserProfile.filter({ user_email: me.email });

    if (profiles.length > 0) {
      const existing = profiles[0];
      if (tgUser) {
        const updates = {};
        if (tgUser.id && existing.tg_id !== tgUser.id) updates.tg_id = tgUser.id;
        if (tgUser.username && existing.tg_username !== tgUser.username) updates.tg_username = tgUser.username;
        if (tgUser.photoUrl && existing.tg_photo_url !== tgUser.photoUrl) updates.tg_photo_url = tgUser.photoUrl;
        if (tgUser.displayName && !existing.display_name) updates.display_name = tgUser.displayName;

        if (Object.keys(updates).length > 0) {
          const updated = await db.entities.UserProfile.update(existing.id, updates);
          setProfile(updated);
        } else {
          setProfile(existing);
        }
      } else {
        setProfile(existing);
      }
    } else {
      const newProfile = await db.entities.UserProfile.create({
        user_email: me.email,
        tg_id: tgUser?.id || me.tg_id || null,
        tg_username: tgUser?.username || me.tg_username || null,
        tg_photo_url: tgUser?.photoUrl || me.tg_photo_url || null,
        gems_balance: 500,
        total_gems_earned: 0,
        total_gems_lost: 0,
        bets_won: 0,
        bets_lost: 0,
        current_streak: 0,
        best_streak: 0,
        level: 1,
        xp: 0,
        achievements: [],
        display_name: tgUser?.displayName || me.full_name || 'Player',
        avatar_emoji: '🎮',
        tg_friends_ids: [],
      });
      setProfile(newProfile);

      const inviterTgId = getInviterTgId();
      if (inviterTgId && tgUser?.id && inviterTgId !== tgUser.id) {
        db.functions.invoke('handleInviteRef', { inviter_tg_id: inviterTgId }).catch(() => {});
      }
    }
    setLoading(false);
  }, [tgUser?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const profiles = await db.entities.UserProfile.filter({ user_email: user.email });
    if (profiles.length > 0) setProfile(profiles[0]);
  }, [user]);

  return { profile, user, loading, refreshProfile, loadProfile };
}
