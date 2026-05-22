import { useLang } from '@/lib/i18n';
import { Camera, Footprints, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const PROOF_TYPES = [
  { key: 'photo', icon: Camera, labelKey: 'proof_photo' },
  { key: 'steps_km', icon: Footprints, labelKey: 'proof_steps' },
  { key: 'any', icon: FileText, labelKey: 'proof_any' },
];

export default function ProofTypeSelector({ value, onChange }) {
  const { t } = useLang();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{t('proof_type')}</label>
      <div className="grid grid-cols-3 gap-2">
        {PROOF_TYPES.map(({ key, icon: Icon, labelKey }) => (
          <motion.button
            key={key}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(key)}
            className={`rounded-xl p-3 text-center border transition-all flex flex-col items-center gap-1.5 ${
              value === key
                ? 'border-neon-cyan bg-neon-cyan/10'
                : 'border-border/50 bg-card'
            }`}
          >
            <Icon className={`w-5 h-5 ${value === key ? 'text-neon-cyan' : 'text-muted-foreground'}`} />
            <p className={`text-[10px] font-medium ${value === key ? 'text-neon-cyan' : 'text-muted-foreground'}`}>
              {t(labelKey)}
            </p>
          </motion.button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{t('proof_hint')}</p>
    </div>
  );
}