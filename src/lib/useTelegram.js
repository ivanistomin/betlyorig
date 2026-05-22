import { useEffect, useState } from 'react';

/**
 * Hook to access Telegram WebApp data.
 * Works both inside real TMA and in browser (dev fallback).
 */
export function useTelegram() {
  const [tgUser, setTgUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const tg = window?.Telegram?.WebApp;

    if (tg) {
      tg.ready();
      tg.expand();

      const user = tg.initDataUnsafe?.user;
      if (user) {
        setTgUser({
          id: String(user.id),
          username: user.username || null,
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          photoUrl: user.photo_url || null,
          languageCode: user.language_code || 'en',
          displayName: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'Player',
        });
      } else {
        // Running in browser without TG context — use mock
        setTgUser(getMockUser());
      }
    } else {
      // TG SDK not loaded — use mock
      setTgUser(getMockUser());
    }

    setIsReady(true);
  }, []);

  return { tgUser, isReady, webApp: window?.Telegram?.WebApp || null };
}

function getMockUser() {
  return {
    id: 'dev_user_001',
    username: 'dev_player',
    firstName: 'Dev',
    lastName: 'Player',
    photoUrl: null,
    languageCode: 'en',
    displayName: 'Dev Player',
  };
}