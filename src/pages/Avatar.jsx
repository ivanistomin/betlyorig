import { motion } from 'framer-motion';
import { Sparkles, Check, Lock } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { useAvatar } from '@/lib/useAvatar';
import AvatarCanvas from '@/components/avatar/AvatarCanvas';
import { CHARACTERS } from '@/components/avatar/AvatarCharacters';
import { ITEMS, SLOTS } from '@/components/avatar/AvatarItems';

const SLOT_LABELS = {
  body: { ru: 'Одежда', en: 'Body' },
  head: { ru: 'Голова', en: 'Head' },
};

export default function Avatar() {
  const { lang } = useLang();
  const { avatar, setCharacter, equip, unequip, isUnlocked } = useAvatar();

  return (
    <div className="px-4 pt-6 pb-28 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <span className="text-3xl">🧬</span>
          {lang === 'ru' ? 'Аватар' : 'Avatar'}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {lang === 'ru'
            ? 'Выбери своего героя и собери образ из открытых вещей.'
            : 'Pick your hero and dress them up with unlocked gear.'}
        </p>
      </div>

      {/* Preview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-4 flex items-center justify-center relative overflow-hidden"
        style={{
          background:
            'linear-gradient(160deg, hsl(265 60% 18%) 0%, hsl(258 35% 9%) 70%, hsl(250 20% 6%) 100%)',
          border: '1px solid rgba(124,92,252,0.25)',
          boxShadow: '0 0 32px rgba(124,92,252,0.18)',
        }}
      >
        <AvatarCanvas avatar={avatar} size={220} />
      </motion.div>

      {/* Character picker */}
      <section className="space-y-2">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-heading">
          {lang === 'ru' ? 'Персонаж' : 'Character'}
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          {Object.values(CHARACTERS).map((c) => {
            const active = avatar.character === c.id;
            const unlocked = isUnlocked(c.id);
            return (
              <button
                key={c.id}
                onClick={() => unlocked && setCharacter(c.id)}
                disabled={!unlocked}
                className="relative rounded-xl p-2 flex flex-col items-center gap-1 transition-all disabled:opacity-50"
                style={{
                  background: active
                    ? 'linear-gradient(135deg, hsl(265 90% 60% / 0.25), hsl(180 80% 50% / 0.18))'
                    : 'rgba(255,255,255,0.04)',
                  border: active
                    ? '1.5px solid hsl(265 90% 60%)'
                    : '1.5px solid rgba(255,255,255,0.08)',
                  boxShadow: active ? '0 0 16px hsl(265 90% 60% / 0.45)' : 'none',
                }}
              >
                <div className="w-full" style={{ aspectRatio: '200 / 300' }}>
                  <AvatarCanvas avatar={{ character: c.id, equipped: {} }} size={undefined} showBackground={false} className="w-full h-full" />
                </div>
                <p className="text-[11px] font-heading font-semibold text-foreground">
                  {lang === 'ru' ? c.name : c.nameEn}
                </p>
                {!unlocked && (
                  <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                    <Lock className="w-2.5 h-2.5 text-white/70" />
                  </span>
                )}
                {active && (
                  <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Wardrobe per slot */}
      {SLOTS.map((slot) => {
        const slotItems = Object.values(ITEMS).filter((it) => it.slot === slot);
        const equippedId = avatar.equipped[slot];
        return (
          <section key={slot} className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-heading">
                {lang === 'ru' ? SLOT_LABELS[slot].ru : SLOT_LABELS[slot].en}
              </h2>
              {equippedId && (
                <button
                  onClick={() => unequip(slot)}
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  {lang === 'ru' ? 'Снять' : 'Unequip'}
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {slotItems.map((it) => {
                const unlocked = isUnlocked(it.id);
                const active = equippedId === it.id;
                return (
                  <button
                    key={it.id}
                    onClick={() => unlocked && equip(it.id)}
                    disabled={!unlocked}
                    className="relative rounded-xl p-2 flex flex-col items-center gap-1 transition-all disabled:opacity-50"
                    style={{
                      background: active
                        ? 'linear-gradient(135deg, hsl(180 80% 50% / 0.22), hsl(265 90% 60% / 0.18))'
                        : 'rgba(255,255,255,0.04)',
                      border: active
                        ? '1.5px solid hsl(180 80% 50%)'
                        : '1.5px solid rgba(255,255,255,0.08)',
                      boxShadow: active ? '0 0 16px hsl(180 80% 50% / 0.45)' : 'none',
                    }}
                  >
                    <div className="w-full relative" style={{ aspectRatio: '200 / 300' }}>
                      <div className="absolute inset-0 opacity-50">
                        <AvatarCanvas
                          avatar={{ character: avatar.character, equipped: {} }}
                          size={undefined}
                          showBackground={false}
                          className="w-full h-full"
                        />
                      </div>
                      <div className="absolute inset-0">
                        <AvatarCanvas
                          avatar={{ character: avatar.character, equipped: { [slot]: it.id } }}
                          size={undefined}
                          showBackground={false}
                          className="w-full h-full"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] font-heading font-semibold text-foreground text-center leading-tight">
                      {lang === 'ru' ? it.name : it.nameEn}
                    </p>
                    {!unlocked && (
                      <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                        <Lock className="w-2.5 h-2.5 text-white/70" />
                      </span>
                    )}
                    {active && (
                      <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-neon-cyan flex items-center justify-center">
                        <Check className="w-3 h-3 text-black" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="rounded-xl px-3 py-2 flex items-center gap-2 text-[11px] text-muted-foreground"
        style={{ background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.25)' }}
      >
        <Sparkles className="w-3.5 h-3.5 text-neon-gold" />
        {lang === 'ru'
          ? 'Новые персонажи и вещи открываются через Боевой Пропуск.'
          : 'Unlock more characters and gear via the Battle Pass.'}
      </div>
    </div>
  );
}
