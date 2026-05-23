import { db } from '@/api/base44Client';
import { toast } from 'sonner';

export async function applyGameResult({ profile, refreshProfile, stake, winAmount, lang }) {
  const delta = (winAmount || 0) - stake;
  const nextBalance = Math.max(0, (profile.gems_balance || 0) + delta);

  try {
    await db.entities.UserProfile.update(profile.id, { gems_balance: nextBalance });
    await refreshProfile?.();
  } catch (e) {
    toast.error(e.message || (lang === 'ru' ? 'Ошибка операции' : 'Operation error'));
    return false;
  }
  return true;
}

export function validateStake({ profile, stake, lang }) {
  if (!Number.isFinite(stake) || stake < 1) {
    toast.error(lang === 'ru' ? 'Минимальная ставка — 1 GEM' : 'Minimum stake is 1 GEM');
    return false;
  }
  if (stake > (profile?.gems_balance || 0)) {
    toast.error(lang === 'ru' ? 'Недостаточно GEMS' : 'Not enough GEMS');
    return false;
  }
  return true;
}
