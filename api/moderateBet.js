import { getSupabaseAdmin, isCallerAdmin, readBody, sendJson } from './_utils.js';
import { calculateReward, getXpForLevel } from './_gameMath.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

  const { admin: isAdmin, user } = await isCallerAdmin(req);
  if (!isAdmin) return sendJson(res, 403, { error: 'Admin only' });

  const { betId, action, reason } = await readBody(req);
  if (!betId || !['approve', 'reject'].includes(action)) {
    return sendJson(res, 400, { error: 'betId and action ("approve"|"reject") are required' });
  }
  if (action === 'reject' && (!reason || !String(reason).trim())) {
    return sendJson(res, 400, { error: 'Rejection reason is required' });
  }

  const sb = getSupabaseAdmin();
  const { data: bet, error: betErr } = await sb.from('bets').select('*').eq('id', betId).maybeSingle();
  if (betErr || !bet) return sendJson(res, 404, { error: 'Bet not found' });
  if (bet.status !== 'pending_review') {
    return sendJson(res, 409, { error: `Bet is not awaiting review (status=${bet.status})` });
  }

  const nowIso = new Date().toISOString();

  if (action === 'reject') {
    // Rejected proofs are recorded as plain failures — the user's stake is
    // lost, the streak resets and the bet shows up in the "Lost" list with
    // the moderator's note attached.
    const { error } = await sb
      .from('bets')
      .update({
        status: 'failed',
        rejection_reason: String(reason).trim().slice(0, 500),
        reviewed_by: user.email,
        reviewed_at: nowIso,
        proof_url: null,
        proof_note: null,
      })
      .eq('id', betId);
    if (error) return sendJson(res, 500, { error: error.message });

    await deleteProofFile(sb, bet.proof_url);
    await applyFailureToProfile(sb, bet);
    return sendJson(res, 200, { ok: true, status: 'failed' });
  }

  // Approve.
  const reward = computeReward(bet);
  const { error } = await sb
    .from('bets')
    .update({
      status: 'completed',
      reward_amount: reward,
      reviewed_by: user.email,
      reviewed_at: nowIso,
      proof_url: null,
      proof_note: null,
    })
    .eq('id', betId);
  if (error) return sendJson(res, 500, { error: error.message });

  await deleteProofFile(sb, bet.proof_url);
  await applyRewardToProfile(sb, bet, reward);
  return sendJson(res, 200, { ok: true, status: 'completed', reward });
}

function extractStoragePath(publicUrl) {
  if (!publicUrl) return null;
  try {
    const url = new URL(publicUrl);
    // Supabase public URL pattern: /storage/v1/object/public/<bucket>/<path>
    const match = url.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function deleteProofFile(sb, proofUrl) {
  const path = extractStoragePath(proofUrl);
  if (!path) return;
  try {
    await sb.storage.from('public').remove([path]);
  } catch (err) {
    console.warn('[moderateBet] Failed to delete proof file:', err.message);
  }
}

function computeReward(bet) {
  if (bet.reward_amount && bet.reward_amount > 0) return bet.reward_amount;
  return calculateReward(bet.stake_amount, bet.duration_days, bet.proof_type);
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

async function applyFailureToProfile(sb, bet) {
  const { data: profile } = await sb
    .from('user_profiles')
    .select('*')
    .eq('user_email', bet.user_email)
    .maybeSingle();
  if (!profile) return;
  await sb
    .from('user_profiles')
    .update({
      total_gems_lost: (profile.total_gems_lost || 0) + Number(bet.stake_amount || 0),
      bets_lost: (profile.bets_lost || 0) + 1,
      current_streak: 0,
    })
    .eq('id', profile.id);
}
