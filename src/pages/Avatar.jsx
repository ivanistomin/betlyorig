import { motion } from 'framer-motion';
import { User, Sparkles } from 'lucide-react';
import { useLang } from '@/lib/i18n';

export default function Avatar() {
  const { lang } = useLang();
  return (
    <div className="px-4 pt-6 pb-28 space-y-5">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <span className="text-3xl">🧬</span>
          {lang === 'ru' ? 'Аватар' : 'Avatar'}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {lang === 'ru'
            ? 'Скоро здесь появится твой персональный аватар.'
            : 'Your personal avatar will live here soon.'}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 text-center relative overflow-hidden"
        style={{
          background:
            'linear-gradient(160deg, hsl(265 60% 18%) 0%, hsl(258 35% 9%) 70%, hsl(250 20% 6%) 100%)',
          border: '1px solid rgba(124,92,252,0.25)',
          boxShadow: '0 0 32px rgba(124,92,252,0.18)',
        }}
      >
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at top, hsl(265 90% 60% / 0.35) 0%, transparent 60%)',
          }}
        />
        <div className="relative space-y-3">
          <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, hsl(265 90% 60%), hsl(180 80% 50%))',
              boxShadow: '0 0 28px hsl(265 90% 60% / 0.6)',
            }}
          >
            <User className="w-9 h-9 text-white" />
          </div>
          <p className="font-heading font-bold text-foreground text-lg">
            {lang === 'ru' ? 'Скоро будет' : 'Coming soon'}
          </p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
            {lang === 'ru'
              ? 'Прокачивай уровень — открывай новых героев, рамки и эффекты.'
              : 'Level up to unlock heroes, frames and effects.'}
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-heading font-semibold text-neon-gold"
            style={{ background: 'rgba(245,200,66,0.12)', border: '1px solid rgba(245,200,66,0.3)' }}
          >
            <Sparkles className="w-3 h-3" />
            {lang === 'ru' ? 'В разработке' : 'In development'}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
