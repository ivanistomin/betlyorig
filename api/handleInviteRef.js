import { getSupabaseAdmin, readBody, sendJson, getUserFromAuthHeader } from './_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
  try {
    const user = await getUserFromAuthHeader(req);
    if (!user) return sendJson(res, 401, { error: 'Unauthorized' });

    const { inviter_tg_id } = await readBody(req);
    if (!inviter_tg_id) return sendJson(res, 400, { error: 'Missing inviter_tg_id' });

    const admin = getSupabaseAdmin();
    const { data: myProfiles } = await admin
      .from('user_profiles')
      .select('*')
      .eq('user_email', user.email)
      .limit(1);
    const myProfile = myProfiles?.[0];
    const myTgId = myProfile?.tg_id || user.user_metadata?.tg_id;
    if (!myTgId) return sendJson(res, 400, { error: 'No TG ID on profile' });
    if (String(myTgId) === String(inviter_tg_id)) {
      return sendJson(res, 200, { ok: true, message: 'Cannot invite yourself' });
    }

    const { data: inviterRows } = await admin
      .from('user_profiles')
      .select('*')
      .eq('tg_id', String(inviter_tg_id))
      .limit(1);
    const inviter = inviterRows?.[0];
    if (!inviter) return sendJson(res, 404, { error: 'Inviter not found' });

    const friends = inviter.tg_friends_ids || [];
    if (friends.includes(String(myTgId))) {
      return sendJson(res, 200, { ok: true, message: 'Already friends' });
    }

    const { error } = await admin
      .from('user_profiles')
      .update({ tg_friends_ids: [...friends, String(myTgId)] })
      .eq('id', inviter.id);
    if (error) return sendJson(res, 500, { error: error.message });

    return sendJson(res, 200, { ok: true });
  } catch (err) {
    return sendJson(res, 500, { error: err.message });
  }
}
