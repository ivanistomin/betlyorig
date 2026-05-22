import { getSupabaseAdmin, verifyTelegramInitData, readBody, sendJson } from './_utils.js';

const DEV_USER = {
  id: 999999,
  username: 'devuser',
  first_name: 'Dev',
  last_name: 'User',
  photo_url: null,
};

function deterministicPassword(tgId) {
  const seed = process.env.TG_AUTH_SECRET || 'betly-default-secret';
  return `tg_${tgId}_${seed}_Aa1!`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }
  try {
    const { initData } = await readBody(req);
    if (!initData) return sendJson(res, 400, { error: 'initData required' });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const allowDev = process.env.ALLOW_DEV_LOGIN === 'true' || process.env.VERCEL_ENV !== 'production';

    let tgUser = null;
    if (initData === 'dev_mode') {
      if (!allowDev) return sendJson(res, 401, { error: 'Dev login disabled' });
      tgUser = DEV_USER;
    } else {
      if (!botToken) return sendJson(res, 500, { error: 'TELEGRAM_BOT_TOKEN not configured' });
      tgUser = verifyTelegramInitData(initData, botToken);
      if (!tgUser) return sendJson(res, 401, { error: 'Invalid Telegram initData' });
    }

    const admin = getSupabaseAdmin();
    const email = `tg_${tgUser.id}@betly.app`;
    const password = deterministicPassword(tgUser.id);
    const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || tgUser.username || 'Player';

    // Try to sign in first.
    let signIn = await admin.auth.signInWithPassword({ email, password });

    if (signIn.error) {
      // Create user if missing.
      const created = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          tg_id: String(tgUser.id),
          tg_username: tgUser.username || null,
          tg_photo_url: tgUser.photo_url || null,
        },
      });
      if (created.error && !String(created.error.message || '').toLowerCase().includes('already')) {
        return sendJson(res, 500, { error: `User create failed: ${created.error.message}` });
      }
      signIn = await admin.auth.signInWithPassword({ email, password });
      if (signIn.error) {
        return sendJson(res, 500, { error: `Sign-in failed: ${signIn.error.message}` });
      }
    } else {
      // Keep metadata fresh.
      const existing = signIn.data?.user;
      if (existing?.id) {
        const meta = existing.user_metadata || {};
        const newMeta = {
          ...meta,
          full_name: fullName,
          tg_id: String(tgUser.id),
          tg_username: tgUser.username || meta.tg_username || null,
          tg_photo_url: tgUser.photo_url || meta.tg_photo_url || null,
        };
        const changed =
          meta.tg_id !== newMeta.tg_id ||
          meta.tg_username !== newMeta.tg_username ||
          meta.tg_photo_url !== newMeta.tg_photo_url ||
          meta.full_name !== newMeta.full_name;
        if (changed) {
          await admin.auth.admin.updateUserById(existing.id, { user_metadata: newMeta });
        }
      }
    }

    const session = signIn.data?.session;
    if (!session) return sendJson(res, 500, { error: 'No session returned' });

    return sendJson(res, 200, {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      tg_user: {
        id: String(tgUser.id),
        username: tgUser.username || null,
        displayName: fullName,
        photoUrl: tgUser.photo_url || null,
      },
    });
  } catch (err) {
    return sendJson(res, 500, { error: err.message || 'Unknown error' });
  }
}
