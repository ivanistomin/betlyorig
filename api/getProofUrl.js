import { getSupabaseAdmin, isCallerAdmin, readBody, sendJson } from './_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

  const { admin: isAdmin, user } = await isCallerAdmin(req);
  if (!isAdmin) return sendJson(res, 403, { error: 'Admin only' });

  const { betId } = await readBody(req);
  if (!betId) return sendJson(res, 400, { error: 'betId is required' });

  const sb = getSupabaseAdmin();
  const { data: bet, error } = await sb
    .from('bets')
    .select('proof_url')
    .eq('id', betId)
    .maybeSingle();

  if (error || !bet || !bet.proof_url) {
    return sendJson(res, 404, { error: 'Proof not found' });
  }

  const { data: signed, error: signedErr } = await sb.storage
    .from('proofs')
    .createSignedUrl(bet.proof_url, 300); // 5 min expiry

  if (signedErr) {
    return sendJson(res, 500, { error: signedErr.message });
  }

  return sendJson(res, 200, { url: signed.signedUrl });
}
