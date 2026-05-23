import { useCallback, useEffect, useState } from 'react';
import { CHARACTERS, CHARACTER_IDS } from '@/components/avatar/AvatarCharacters';
import { ITEMS, SLOTS } from '@/components/avatar/AvatarItems';

const STORAGE_KEY = 'betly:avatar:v1';

/*
 * Avatar shape:
 *   { character: 'capybara' | 'raccoon' | 'monkey',
 *     equipped:  { body: itemId|null, head: itemId|null },
 *     unlocked:  string[]  // ids the user owns (characters + items) }
 *
 * Auto-equip rule: equipping any item replaces whatever was in that slot.
 * (One slot can only hold one item — guaranteed by the lookup on ITEMS.slot.)
 *
 * State currently persists to localStorage. A DB-backed UserProfile column can
 * later replace `load`/`save` without touching the rest of the app.
 */

const DEFAULT_AVATAR = {
  character: 'capybara',
  equipped: { body: null, head: null },
  // Capybara + a starter tee are available from the get-go so the user has
  // something to dress up immediately. Everything else comes from Battle Pass.
  unlocked: ['capybara', 'tee_cyan'],
};

function loadAvatar() {
  if (typeof window === 'undefined') return DEFAULT_AVATAR;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AVATAR;
    const parsed = JSON.parse(raw);
    return normalize(parsed);
  } catch {
    return DEFAULT_AVATAR;
  }
}

function normalize(avatar) {
  const next = { ...DEFAULT_AVATAR, ...avatar };
  next.equipped = { body: null, head: null, ...(avatar?.equipped || {}) };
  next.unlocked = Array.isArray(avatar?.unlocked) ? [...avatar.unlocked] : [];
  if (!CHARACTER_IDS.includes(next.character)) next.character = 'capybara';
  if (!next.unlocked.includes(next.character)) next.unlocked.push(next.character);
  // Strip equipped items the user doesn't actually own anymore.
  for (const slot of SLOTS) {
    const id = next.equipped[slot];
    if (id && !next.unlocked.includes(id)) next.equipped[slot] = null;
    if (id && ITEMS[id]?.slot !== slot) next.equipped[slot] = null;
  }
  return next;
}

function saveAvatar(avatar) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(avatar));
  } catch {
    // ignore quota errors
  }
}

export function useAvatar() {
  const [avatar, setAvatar] = useState(loadAvatar);

  useEffect(() => {
    saveAvatar(avatar);
  }, [avatar]);

  const setCharacter = useCallback((id) => {
    if (!CHARACTER_IDS.includes(id)) return;
    setAvatar((prev) => {
      const next = { ...prev, character: id };
      if (!next.unlocked.includes(id)) next.unlocked = [...next.unlocked, id];
      return next;
    });
  }, []);

  const unlock = useCallback((id) => {
    setAvatar((prev) => {
      if (prev.unlocked.includes(id)) return prev;
      return { ...prev, unlocked: [...prev.unlocked, id] };
    });
  }, []);

  // Auto-equip: replaces the slot's previous occupant in a single state update.
  const equip = useCallback((id) => {
    const item = ITEMS[id];
    if (!item) return;
    setAvatar((prev) => {
      if (!prev.unlocked.includes(id)) return prev;
      return {
        ...prev,
        equipped: { ...prev.equipped, [item.slot]: id },
      };
    });
  }, []);

  const unequip = useCallback((slot) => {
    if (!SLOTS.includes(slot)) return;
    setAvatar((prev) => ({
      ...prev,
      equipped: { ...prev.equipped, [slot]: null },
    }));
  }, []);

  const isUnlocked = useCallback((id) => avatar.unlocked.includes(id), [avatar.unlocked]);

  return { avatar, setAvatar, setCharacter, unlock, equip, unequip, isUnlocked, CHARACTERS, ITEMS };
}
