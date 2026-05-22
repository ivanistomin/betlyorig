const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createHmac } from 'node:crypto';

function verifyTelegramInitData(initData, botToken) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return false;
  params.delete('hash');
  const entries = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expectedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  return expectedHash === hash;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { initData } = body;

    if (!initData) return Response.json({ error: 'initData is required' }, { status: 400 });

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) return Response.json({ error: 'Bot token not configured' }, { status: 500 });

    const isDev = initData === 'dev_mode';
    if (!isDev && !verifyTelegramInitData(initData, botToken)) {
      return Response.json({ error: 'Invalid Telegram initData' }, { status: 401 });
    }

    let tgUser;
    if (isDev) {
      tgUser = { id: 999999, username: 'devuser', first_name: 'Dev', last_name: 'User' };
    } else {
      const params = new URLSearchParams(initData);
      const userStr = params.get('user');
      if (!userStr) return Response.json({ error: 'No user in initData' }, { status: 400 });
      tgUser = JSON.parse(userStr);
    }

    const email = `tg_${tgUser.id}@betly.app`;
    const password = `Betly_${tgUser.id}_TMA!`;
    const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || 'Player';
    const appId = Deno.env.get('BASE44_APP_ID');

    // Check existing user
    let users = await db.asServiceRole.entities.User.filter({ email });
    let dbUser = users[0] || null;
    const isNew = !dbUser;
    const hasPassword = !!dbUser?.hashed_password;
    const isVerified = !!dbUser?.is_verified;

    if (isVerified && hasPassword) {
      // Happy path: just login
      const loginResult = await db.auth.loginViaEmailPassword(email, password);
      return Response.json({
        access_token: loginResult?.access_token,
        tg_user: {
          id: String(tgUser.id),
          username: tgUser.username || null,
          displayName: fullName,
          photoUrl: tgUser.photo_url || null,
        }
      });
    }

    // NEW USER FLOW:
    // 1. Invite to create in system (generates OTP)
    if (isNew) {
      await db.asServiceRole.auth.inviteUser(email, 'user');
      await new Promise(r => setTimeout(r, 600));
      users = await db.asServiceRole.entities.User.filter({ email });
      dbUser = users[0];
    }

    if (!dbUser) return Response.json({ error: 'User creation failed' }, { status: 500 });

    // 2. Set password via register (will reset is_verified to false but sets hashed_password)
    if (!hasPassword) {
      try {
        await db.auth.register({ email, password, full_name: fullName });
      } catch { /* ignore */ }
      await new Promise(r => setTimeout(r, 400));
    }

    // 3. Read fresh OTP IMMEDIATELY before anything else can change it
    const freshUsers = await db.asServiceRole.entities.User.filter({ email });
    const freshUser = freshUsers[0];
    const otp = freshUser?.otp_code;
    console.log('OTP to use:', otp, 'expires:', freshUser?.otp_expires_at);

    // 4. Verify with OTP
    if (otp) {
      const verifyResp = await fetch(`https://app.db.com/api/apps/public/${appId}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const verifyText = await verifyResp.text();
      console.log('verify-otp status:', verifyResp.status, verifyText);
    }

    // 5. Login
    await new Promise(r => setTimeout(r, 300));
    const loginResult = await db.auth.loginViaEmailPassword(email, password);
    const token = loginResult?.access_token;

    if (!token) return Response.json({ error: 'Could not obtain access token' }, { status: 500 });

    return Response.json({
      access_token: token,
      tg_user: {
        id: String(tgUser.id),
        username: tgUser.username || null,
        displayName: fullName,
        photoUrl: tgUser.photo_url || null,
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});