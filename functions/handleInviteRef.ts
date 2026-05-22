const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Called when a user joins via referral link.
 * Payload: { inviter_tg_id: string }
 * Adds the new user's tg_id to the inviter's tg_friends_ids array.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { inviter_tg_id } = await req.json();
    if (!inviter_tg_id) return Response.json({ error: 'Missing inviter_tg_id' }, { status: 400 });

    // Find current user's profile to get their tg_id
    const myProfiles = await db.entities.UserProfile.filter({ user_email: user.email });
    if (myProfiles.length === 0) return Response.json({ error: 'Profile not found' }, { status: 404 });
    const myProfile = myProfiles[0];
    const myTgId = myProfile.tg_id;
    if (!myTgId) return Response.json({ error: 'No TG ID on profile' }, { status: 400 });

    // Find inviter profile by tg_id
    const allProfiles = await db.asServiceRole.entities.UserProfile.list();
    const inviterProfile = allProfiles.find(p => p.tg_id === inviter_tg_id);
    if (!inviterProfile) return Response.json({ error: 'Inviter not found' }, { status: 404 });

    // Check not already friends
    const friends = inviterProfile.tg_friends_ids || [];
    if (friends.includes(myTgId)) {
      return Response.json({ ok: true, message: 'Already registered as friend' });
    }

    // Add to inviter's friends list
    await db.asServiceRole.entities.UserProfile.update(inviterProfile.id, {
      tg_friends_ids: [...friends, myTgId],
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});