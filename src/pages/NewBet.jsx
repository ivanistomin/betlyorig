
import { db } from '@/api/base44Client';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Zap, ShieldAlert, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useProfile } from '@/lib/useProfile';
import {
  CATEGORIES,
  DURATION_MULTIPLIERS,
  PROOF_MULTIPLIERS,
  calculateReward,
  validateGoalTitle,
  getAllowedProofTypes,
  normalizeProofType,
} from '@/lib/gameConfig';
import { BET_TEMPLATES } from '@/lib/betTemplates';
import GemsBadge from '@/components/common/GemsBadge';
import { useLang } from '@/lib/i18n';
import { toast } from 'sonner';
import { addDays } from 'date-fns';

const STAKE_PRESETS = [25, 50, 100, 200, 500];
const DURATION_PRESETS = [1, 3, 7, 14, 30];

export default function NewBet() {
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const { profile, user } = useProfile();
  const [submitting, setSubmitting] = useState(false);
  const [goalError, setGoalError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'fitness',
    stake_amount: 50,
    duration_days: 7,
    proof_type: 'any',
    close_mode: 'medium',
  });

  // whether user is typing custom goal (for "custom" category or clicked "other")
  const [customMode, setCustomMode] = useState(false);

  const update = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (field === 'title') setGoalError('');
  };

  const handleCategoryChange = (cat) => {
    setForm((p) => ({
      ...p,
      category: cat,
      title: '',
      proof_type: normalizeProofType(cat, p.proof_type),
    }));
    setGoalError('');
    setCustomMode(cat === 'custom');
  };

  const handleTemplate = (tpl) => {
    setForm((p) => ({
      ...p,
      title: lang === 'ru' ? tpl.titleRu : tpl.titleEn,
      proof_type: normalizeProofType(p.category, tpl.proof_type),
    }));
    setGoalError('');
    setCustomMode(false);
  };

  const allowedProofTypes = getAllowedProofTypes(form.category);

  const reward = calculateReward(form.stake_amount, form.duration_days, form.proof_type);
  const durMult = DURATION_MULTIPLIERS[form.duration_days]?.multiplier || 1;
  const proofMult = PROOF_MULTIPLIERS[form.proof_type]?.multiplier || 0.8;
  const totalMult = (durMult * proofMult).toFixed(2);

  const handleSubmit = async () => {
    const validation = validateGoalTitle(form.title);
    if (!validation.valid) {
      setGoalError(lang === 'ru' ? validation.reason_ru : validation.reason_en);
      return;
    }
    if (form.stake_amount > profile.gems_balance) {
      toast.error(lang === 'ru' ? 'Недостаточно GEMS!' : 'Not enough GEMS!');
      return;
    }
    if (form.stake_amount < 10) {
      toast.error(lang === 'ru' ? 'Минимальная ставка — 10 GEMS' : 'Minimum stake is 10 GEMS');
      return;
    }

    setSubmitting(true);
    const deadline = addDays(new Date(), form.duration_days).toISOString();
    await db.entities.Bet.create({
      title: form.title,
      description: form.description,
      category: form.category,
      stake_amount: form.stake_amount,
      duration_days: form.duration_days,
      deadline,
      status: 'active',
      user_email: user.email,
      proof_type: form.proof_type,
      close_mode: form.close_mode,
      reward_amount: reward,
      difficulty: 'medium',
    });

    await db.entities.UserProfile.update(profile.id, {
      gems_balance: profile.gems_balance - form.stake_amount,
    });

    toast.success(lang === 'ru' ? `Ставка сделана! ${form.stake_amount} 💎 поставлено` : `Bet placed! ${form.stake_amount} 💎 staked`);
    navigate('/bets');
  };

  if (!profile) return null;

  const templates = BET_TEMPLATES[form.category] || [];
  const isCustomCat = form.category === 'custom';

  return (
    <div className="px-4 pt-4 space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <h1 className="text-xl font-heading font-bold text-foreground">{t('new_bet')}</h1>
        <div className="ml-auto">
          <GemsBadge amount={profile.gems_balance} />
        </div>
      </div>

      {/* Step 1: Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{t('category')}</label>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <motion.button
              key={key}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCategoryChange(key)}
              className={`rounded-xl p-3 text-center border transition-all ${
                form.category === key ? 'border-primary bg-primary/10' : 'border-border/50 bg-card'
              }`}
            >
              <span className="text-xl">{cat.emoji}</span>
              <p className="text-[10px] text-muted-foreground mt-1">{lang === 'ru' ? cat.labelRu : cat.label}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Step 2: Goal selection */}
      <AnimatePresence mode="wait">
        <motion.div
          key={form.category}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="space-y-2"
        >
          <label className="text-sm font-medium text-foreground">
            {isCustomCat
              ? (lang === 'ru' ? 'Опишите свою цель' : 'Describe your goal')
              : t('goal_question')}
          </label>

          {/* Template grid (not for custom) */}
          {!isCustomCat && templates.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {templates.map((tpl, i) => {
                const label = lang === 'ru' ? tpl.titleRu : tpl.titleEn;
                const isSelected = form.title === label;
                return (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleTemplate(tpl)}
                    className={`rounded-xl p-3 text-left border transition-all flex items-center gap-2 ${
                      isSelected ? 'border-primary bg-primary/10' : 'border-border/50 bg-card'
                    }`}
                  >
                    <span className="text-lg shrink-0">{tpl.icon}</span>
                    <span className={`text-xs font-medium leading-tight ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {label}
                    </span>
                  </motion.button>
                );
              })}

              {/* "Write your own" option */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => { setCustomMode(true); update('title', ''); }}
                className={`rounded-xl p-3 text-left border transition-all flex items-center gap-2 ${
                  customMode ? 'border-neon-cyan bg-neon-cyan/10' : 'border-border/50 bg-card border-dashed'
                }`}
              >
                <PenLine className={`w-5 h-5 shrink-0 ${customMode ? 'text-neon-cyan' : 'text-muted-foreground'}`} />
                <span className={`text-xs font-medium ${customMode ? 'text-neon-cyan' : 'text-muted-foreground'}`}>
                  {lang === 'ru' ? 'Своя цель...' : 'Custom goal...'}
                </span>
              </motion.button>
            </div>
          )}

          {/* Custom input shown when customMode or custom category */}
          {(customMode || isCustomCat) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <Input
                placeholder={t('goal_placeholder')}
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                autoFocus
                className={`bg-card border-border/50 text-foreground placeholder:text-muted-foreground ${goalError ? 'border-destructive' : ''}`}
              />
            </motion.div>
          )}

          {/* Show selected template name */}
          {!customMode && !isCustomCat && form.title && (
            <div className="px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-primary font-medium">✓ {form.title}</p>
            </div>
          )}

          {goalError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30">
              <ShieldAlert className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-destructive">{goalError}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{t('details_optional')}</label>
        <Textarea
          placeholder={t('details_placeholder')}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          className="bg-card border-border/50 text-foreground placeholder:text-muted-foreground h-16 resize-none"
        />
      </div>

      {/* Stake */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{t('stake_amount')}</label>
        <div className="flex gap-2 flex-wrap">
          {STAKE_PRESETS.map((amount) => (
            <motion.button
              key={amount}
              whileTap={{ scale: 0.95 }}
              onClick={() => update('stake_amount', amount)}
              className={`rounded-lg px-4 py-2 text-sm font-medium border transition-all ${
                form.stake_amount === amount
                  ? 'border-neon-gold bg-neon-gold/10 text-neon-gold'
                  : 'border-border/50 bg-card text-foreground'
              }`}
            >
              💎 {amount}
            </motion.button>
          ))}
        </div>
        <Input
          type="number"
          min={10}
          max={profile.gems_balance}
          value={form.stake_amount}
          onChange={(e) => update('stake_amount', Number(e.target.value))}
          className="bg-card border-border/50 text-foreground mt-1"
        />
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{t('duration_days')}</label>
        <div className="flex gap-2">
          {DURATION_PRESETS.map((d) => (
            <motion.button
              key={d}
              whileTap={{ scale: 0.95 }}
              onClick={() => update('duration_days', d)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium border transition-all ${
                form.duration_days === d
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/50 bg-card text-foreground'
              }`}
            >
              <div>{d}{lang === 'ru' ? 'д' : 'd'}</div>
              <div className="text-[10px] text-muted-foreground">{DURATION_MULTIPLIERS[d]?.label}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Proof type */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{t('proof_type')}</label>
        <div className={`grid gap-2 ${allowedProofTypes.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {allowedProofTypes.map((key) => {
            const pm = PROOF_MULTIPLIERS[key];
            if (!pm) return null;
            return (
              <motion.button
                key={key}
                whileTap={{ scale: 0.95 }}
                onClick={() => update('proof_type', key)}
                className={`rounded-xl p-3 text-center border transition-all ${
                  form.proof_type === key ? 'border-neon-cyan bg-neon-cyan/10' : 'border-border/50 bg-card'
                }`}
              >
                <p className={`text-sm font-medium ${form.proof_type === key ? 'text-neon-cyan' : 'text-foreground'}`}>
                  {lang === 'ru' ? pm.labelRu : pm.labelEn}
                </p>
                <p className="text-[11px] text-neon-gold font-bold mt-1">×{pm.multiplier}</p>
              </motion.button>
            );
          })}
        </div>
        {form.category !== 'fitness' && (
          <p className="text-[11px] text-muted-foreground">
            {lang === 'ru'
              ? '«Шаги/км» доступны только для категории «Фитнес».'
              : 'Steps/km is available only for the Fitness category.'}
          </p>
        )}
      </div>

      {/* Reward preview */}
      <div className="rounded-xl bg-gradient-to-r from-primary/10 to-neon-cyan/10 border border-primary/20 p-4 space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('potential_reward')}</p>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-neon-gold" />
              <span className="text-2xl font-heading font-bold text-neon-gold">{reward} GEMS</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {form.stake_amount} × {durMult} × {proofMult} = ×{totalMult}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{t('if_fail')}</p>
            <p className="text-sm font-semibold text-destructive">-{form.stake_amount} GEMS</p>
          </div>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={submitting || !form.title.trim()}
        className="w-full h-12 bg-gradient-to-r from-primary to-neon-cyan text-white font-heading font-semibold text-base rounded-xl"
      >
        {submitting ? t('placing') : `${t('place_bet_btn')} — ${form.stake_amount} GEMS`}
      </Button>
    </div>
  );
}
