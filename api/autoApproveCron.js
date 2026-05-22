import { getSupabaseAdmin, isCallerAdmin, sendJson } from './_utils.js';
import { calculateReward, getXpForLevel } from './_gameMath.js';

const AUTO_APPROVE_AFTER_MS = 12 * 60 * 60 * 1000; // 12 hours

// Hit by Vercel Cron (configured in vercel.json). Vercel calls cron paths
// with a fixed Authorization: Bearer <CRON_SECRET> header. We also accept
// manual invocation by an authenticated admin from the moderation UI so the
// 12-hour rule still works when Vercel's free-tier cron isn't running often.
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers?.authorization || '';
  const isVercelCron = cronSecret && auth === `Bearer ${cronSecret}`;

  if (!isVercelCron) {
    const { admin: isAdmin } = await isCallerAdmin(req);
    if (!isAdmin && process.env.VERCEL_ENV === 'production') {
      return sendJson(res, 401, { error: 'Unauthorized' });
    }
  }

  const sb = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - AUTO_APPROVE_AFTER_MS).toISOString();
  const { data: ripe, error } = await sb
    .from('bets')
    .select('*')
    .eq('status', 'pending_review')
    .lte('proof_submitted_at', cutoff);
  if (error) return sendJson(res, 500, { error: error.message });

  const results = [];
  for (const bet of ripe || []) {
    const reward = bet.reward_amount && bet.reward_amount > 0
      ? bet.reward_amount
      : calculateReward(bet.stake_amount, bet.duration_days, bet.proof_type);
    const { error: updErr } = await sb
      .from('bets')
      .update({
        status: 'completed',
        reward_amount: reward,
        reviewed_by: 'auto:12h-timeout',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', bet.id);
    if (updErr) {
      results.push({ id: bet.id, ok: false, error: updErr.message });
      continue;
    }
    await applyRewardToProfile(sb, bet, reward);
    results.push({ id: bet.id, ok: true, reward });
  }

  return sendJson(res, 200, { processed: results.length, results });
}

async function applyRewardToProfile(sb, bet, reward) {
  const { data: profile } = await sb
    .from('user_profiles')
    .select('*')
    .eq('user_email', bet.user_email)
    .maybeSingle();
  if (!profile) return;
  const newStreak = (profile.current_streak || 0) + 1;
  const xpGain = Math.floor(bet.stake_amount * 0.5) + 25;
  let newXp = (profile.xp || 0) + xpGain;
  let newLevel = profile.level || 1;
  while (newXp >= getXpForLevel(newLevel)) {
    newXp -= getXpForLevel(newLevel);
    newLevel++;
  }
  await sb
    .from('user_profiles')
    .update({
      gems_balance: (profile.gems_balance || 0) + reward,
      total_gems_earned: (profile.total_gems_earned || 0) + reward,
      bets_won: (profile.bets_won || 0) + 1,
      current_streak: newStreak,
      best_streak: Math.max(profile.best_streak || 0, newStreak),
      xp: newXp,
      level: newLevel,
    })
    .eq('id', profile.id);
}
