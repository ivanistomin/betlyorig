import { useLang } from '@/lib/i18n';
import { motion } from 'framer-motion';

export default function LangToggle() {
  const { lang, setLang } = useLang();

  return (
    <div className="flex rounded-lg overflow-hidden border border-border/50 bg-secondary h-8">
      {['ru', 'en'].map((l) => (
        <motion.button
          key={l}
          whileTap={{ scale: 0.95 }}
          onClick={() => setLang(l)}
          className={`px-3 text-xs font-heading font-bold transition-all uppercase ${
            lang === l
              ? 'bg-primary text-white'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {l}
        </motion.button>
      ))}
    </div>
  );
}