import { sendJson } from './_utils.js';

// Auto-approval was retired — moderation is now fully manual. Bets sit in
// `pending_review` until a human moderator approves or rejects them. We keep
// this endpoint as a no-op so any existing Vercel Cron schedule or external
// caller gets a clean 200 response without changing state.
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }
  return sendJson(res, 200, {
    processed: 0,
    disabled: true,
    note: 'Auto-approval disabled — moderation is fully manual.',
  });
}
