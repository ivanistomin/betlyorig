const BOT_USERNAME = 'betlyy_bot';
const REF_PREFIX = 'ref_';

function normalizeReferralValue(value, { addPrefix = false } = {}) {
  if (!value) return null;
  const normalized = decodeURIComponent(String(value)).trim();
  if (!normalized) return null;
  if (normalized.startsWith(REF_PREFIX)) return normalized;
  return addPrefix ? `${REF_PREFIX}${normalized}` : null;
}

function getUrlParam(names) {
  if (typeof window === 'undefined') return null;

  const searchParams = new URLSearchParams(window.location.search);
  for (const name of names) {
    const value = searchParams.get(name);
    if (value) return value;
  }

  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : hash;
  const hashParams = new URLSearchParams(hashQuery);
  for (const name of names) {
    const value = hashParams.get(name);
    if (value) return value;
  }

  return null;
}

export function getReferralStartParam() {
  if (typeof window === 'undefined') return null;

  const tgStartParam = window['Telegram']?.WebApp?.initDataUnsafe?.start_param;
  const telegramReferral = normalizeReferralValue(tgStartParam);
  if (telegramReferral) return telegramReferral;

  const directStartParam = getUrlParam(['startapp', 'tgWebAppStartParam', 'start']);
  const directReferral = normalizeReferralValue(directStartParam);
  if (directReferral) return directReferral;

  const refParam = getUrlParam(['ref']);
  return normalizeReferralValue(refParam, { addPrefix: true });
}

export function getInviterTgId() {
  const referralStartParam = getReferralStartParam();
  if (!referralStartParam?.startsWith(REF_PREFIX)) return null;
  return referralStartParam.slice(REF_PREFIX.length);
}

export function createTelegramReferralLink(tgId) {
  const referralStartParam = normalizeReferralValue(tgId, { addPrefix: true });
  return `https://t.me/${BOT_USERNAME}?startapp=${encodeURIComponent(referralStartParam || `${REF_PREFIX}user`)}`;
}
