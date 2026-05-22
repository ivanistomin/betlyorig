const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useLang } from '@/lib/i18n';

const STORAGE_KEY = 'betly_welcome_seen_v2';

const PRIZES = [
  { emoji: '📱', labelRu: 'iPhone 17 Pro Max', labelEn: 'iPhone 17 Pro Max', color: 'from-slate-400/20 to-slate-600/10', border: 'border-slate-400/30' },
  { emoji: '💻', labelRu: 'MacBook Pro', labelEn: 'MacBook Pro', color: 'from-slate-300/20 to-slate-500/10', border: 'border-slate-300/30' },
  { emoji: '💎', labelRu: '1 TON', labelEn: '1 TON', color: 'from-neon-cyan/20 to-neon-cyan/5', border: 'border-neon-cyan/40' },
  { emoji: '🎁', labelRu: 'TG Подарки', labelEn: 'TG Gifts', color: 'from-primary/20 to-primary/5', border: 'border-primary/30' },
];

export default function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const { lang } = useLang();

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setTimeout(() => setOpen(true), 800);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-t-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, hsl(258 35% 7%) 0%, hsl(250 20% 5%) 100%)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderBottom: 'none',
            }}
          >
            {/* Close */}
            <div className="flex justify-end pt-4 px-4">
              <button onClick={handleClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Hero image — full width, tall */}
            <div className="relative mx-0 overflow-hidden" style={{ height: 260 }}>
              <img
                src="https://media.db.com/images/public/6a099ea78cf8bfef98f1b03d/2c945b172_generated_image.png"
                alt="Betly rewards"
                className="w-full h-full object-cover object-top"
              />
              {/* Gradient overlay bottom */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, hsl(258 35% 7%) 100%)' }} />

              {/* Badge overlay */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2">
                <div className="px-4 py-1.5 rounded-full text-xs font-heading font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, hsl(265 90% 55%), hsl(180 80% 45%))', boxShadow: '0 0 20px hsl(265 90% 55% / 0.5)' }}>
                  🚀 {lang === 'ru' ? 'ДОБРО ПОЖАЛОВАТЬ В BETLY' : 'WELCOME TO BETLY'}
                </div>
              </div>

              {/* Gems badge */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <motion.div
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="px-5 py-2 rounded-2xl text-center"
                  style={{ background: 'rgba(12,9,22,0.82)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,215,0,0.3)' }}
                >
                  <p className="text-[10px] text-white/50 uppercase tracking-widest mb-0.5">
                    {lang === 'ru' ? 'Стартовый баланс' : 'Starting balance'}
                  </p>
                  <div className="flex items-center gap-2">
                    <img src="https://media.db.com/images/public/6a099ea78cf8bfef98f1b03d/9dcad51e4_gem.png" alt="gem" className="w-6 h-6" />
                    <span className="text-xl font-heading font-black text-blue-300">500 GEMS</span>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Title */}
            <div className="px-6 pt-1 pb-2 text-center">
              <h2 className="text-xl font-heading font-black text-white leading-snug">
                {lang === 'ru' ? (
                  <>Обменяй GEMS на<br /><span className="bg-gradient-to-r from-neon-gold via-amber-300 to-neon-gold bg-clip-text text-transparent">реальные призы!</span></>
                ) : (
                  <>Exchange GEMS for<br /><span className="bg-gradient-to-r from-neon-gold via-amber-300 to-neon-gold bg-clip-text text-transparent">real prizes!</span></>
                )}
              </h2>
            </div>

            {/* CTA */}
            <div className="px-4 pb-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleClose}
                className="w-full py-3.5 rounded-2xl font-heading font-bold text-base text-white"
                style={{
                  background: 'linear-gradient(135deg, hsl(265 90% 55%) 0%, hsl(200 80% 50%) 50%, hsl(45 95% 55%) 100%)',
                  boxShadow: '0 0 30px hsl(265 90% 55% / 0.4)',
                }}
              >
                {lang === 'ru' ? '🚀 Начать и зарабатывать' : '🚀 Start Earning'}
              </motion.button>
            </div>

            {/* Policy */}
            <p className="text-[10px] text-muted-foreground text-center px-6 pt-2 pb-6 leading-relaxed">
              {lang === 'ru' ? 'Нажимая, вы принимаете ' : 'By tapping you agree to our '}
              <a href="https://telegra.ph/Betly-Usloviya-ispolzovaniya-05-19" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                {lang === 'ru' ? 'Условия' : 'Terms'}
              </a>
              {lang === 'ru' ? ' и ' : ' & '}
              <a href="https://telegra.ph/Betly-Politika-konfidencialnosti-05-19" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                {lang === 'ru' ? 'Политику конфиденциальности' : 'Privacy Policy'}
              </a>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}