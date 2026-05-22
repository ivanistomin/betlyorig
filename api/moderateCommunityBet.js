import { getSupabaseAdmin, isCallerAdmin, readBody, sendJson } from './_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

  const { admin: isAdmin, user } = await isCallerAdmin(req);
  if (!isAdmin) return sendJson(res, 403, { error: 'Admin only' });

  const { communityBetId, action, reason } = await readBody(req);
  if (!communityBetId || !['approve', 'reject'].includes(action)) {
    return sendJson(res, 400, { error: 'communityBetId and action ("approve"|"reject") are required' });
  }
  if (action === 'reject' && (!reason || !String(reason).trim())) {
    return sendJson(res, 400, { error: 'Rejection reason is required' });
  }

  const sb = getSupabaseAdmin();
  const { data: cb, error: cbErr } = await sb
    .from('community_bets')
    .select('*')
    .eq('id', communityBetId)
    .maybeSingle();
  if (cbErr || !cb) return sendJson(res, 404, { error: 'Community bet not found' });

  const update =
    action === 'approve'
      ? { status: 'approved' }
      : { status: 'rejected', description: appendRejection(cb.description, reason) };

  const { error } = await sb.from('community_bets').update(update).eq('id', communityBetId);
  if (error) return sendJson(res, 500, { error: error.message });
  return sendJson(res, 200, { ok: true, reviewed_by: user.email });
}

function appendRejection(description, reason) {
  const tag = `\n\n— Отклонено модерацией: ${String(reason).trim().slice(0, 500)}`;
  return `${description || ''}${tag}`;
}
