import { readBody, sendJson, getUserFromAuthHeader } from './_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
  try {
    const user = await getUserFromAuthHeader(req);
    if (!user) return sendJson(res, 401, { error: 'Unauthorized' });

    const { tg_id, message } = await readBody(req);
    if (!tg_id || !message) return sendJson(res, 400, { error: 'Missing tg_id or message' });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return sendJson(res, 500, { error: 'TELEGRAM_BOT_TOKEN not set' });

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: tg_id, text: message, parse_mode: 'HTML' }),
    });
    const data = await tgRes.json();
    if (!data.ok) return sendJson(res, 400, { error: data.description || 'Telegram API error' });
    return sendJson(res, 200, { success: true });
  } catch (err) {
    return sendJson(res, 500, { error: err.message });
  }
}
