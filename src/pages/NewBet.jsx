import { db } from '@/api/base44Client';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Zap,
  ShieldAlert,
  PenLine,
  LockKeyhole,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
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

// ─── Multi-step flow ──────────────────────────────────────────────────────────
// 1. category   — pick category (one of CATEGORIES, includes 'custom')
// 2. activity   — pick a concrete activity template (proof_type is locked by the
//                  template). For 'custom' category the user writes their own
//                  goal and picks the proof format manually.
// 3. stake      — stake amount + duration (+ optional details)
// 4. summary    — final review and place bet
const STEPS = ['category', 'activity', 'stake', 'summary'];

export default function NewBet() {
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const { profile, user } = useProfile();
  const [submitting, setSubmitting] = useState(false);
  const [goalError, setGoalError] = useState('');
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    category: '',
    title: '',
    description: '',
    proof_type: '',
    stake_amount: 50,
    duration_days: 7,
    close_mode: 'medium',
  });

  const update = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (field === 'title') setGoalError('');
  };

  const isCustomCat = form.category === 'custom';
  const templates = useMemo(() => BET_TEMPLATES[form.category] || [], [form.category]);
  const allowedProofTypes = getAllowedProofTypes(form.category || 'custom');
  const proofConfig = PROOF_MULTIPLIERS[form.proof_type];
  const reward = calculateReward(form.stake_amount, form.duration_days, form.proof_type || 'any');
  const durMult = DURATION_MULTIPLIERS[form.duration_days]?.multiplier || 1;
  const proofMult = PROOF_MULTIPLIERS[form.proof_type]?.multiplier || 0.8;
  const totalMult = (durMult * proofMult).toFixed(2);

  // ── Navigation helpers ──────────────────────────────────────────────────────
  const goBack = () => {
    if (step === 0) {
      navigate(-1);
      return;
    }
    setGoalError('');
    setStep((s) => Math.max(0, s - 1));
  };

  const canContinue = () => {
    if (step === 0) return !!form.category;
    if (step === 1) {
      if (!form.title.trim()) return false;
      if (!form.proof_type) return false;
      return true;
    }
    if (step === 2) {
      return form.stake_amount >= 10 && form.duration_days > 0;
    }
    return true;
  };

  const goNext = () => {
    if (step === 1) {
      const validation = validateGoalTitle(form.title);
      if (!validation.valid) {
        setGoalError(lang === 'ru' ? validation.reason_ru : validation.reason_en);
        return;
      }
    }
    if (step === 2) {
      if (form.stake_amount > profile.gems_balance) {
        toast.error(lang === 'ru' ? 'Недостаточно GEMS!' : 'Not enough GEMS!');
        return;
      }
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  // ── Step actions ────────────────────────────────────────────────────────────
  const pickCategory = (key) => {
    setForm((p) => ({
      ...p,
      category: key,
      title: '',
      proof_type: key === 'custom' ? normalizeProofType('custom', 'photo') : '',
    }));
    setGoalError('');
  };

  const pickTemplate = (tpl) => {
    setForm((p) => ({
      ...p,
      title: lang === 'ru' ? tpl.titleRu : tpl.titleEn,
      proof_type: tpl.proof_type,
    }));
    setGoalError('');
  };

  const pickCustomInTemplates = () => {
    setForm((p) => ({
      ...p,
      title: '',
      proof_type:
        p.proof_type && allowedProofTypes.includes(p.proof_type)
          ? p.proof_type
          : allowedProofTypes[0],
    }));
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.title.trim() || !form.proof_type || !form.category) return;
    const validation = validateGoalTitle(form.title);
    if (!validation.valid) {
      setGoalError(lang === 'ru' ? validation.reason_ru : validation.reason_en);
      setStep(1);
      return;
    }
    if (form.stake_amount > profile.gems_balance) {
      toast.error(lang === 'ru' ? 'Недостаточно GEMS!' : 'Not enough GEMS!');
      setStep(2);
      return;
    }
    if (form.stake_amount < 10) {
      toast.error(lang === 'ru' ? 'Минимальная ставка — 10 GEMS' : 'Minimum stake is 10 GEMS');
      setStep(2);
      return;
    }

    setSubmitting(true);
    try {
      const deadline = addDays(new Date(), form.duration_days).toISOString();
      await db.entities.Bet.create({
        title: form.title.trim(),
        description: form.description?.trim() || null,
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

      toast.success(
        lang === 'ru'
          ? `Ставка сделана! ${form.stake_amount} 💎 поставлено`
          : `Bet placed! ${form.stake_amount} 💎 staked`,
      );
      navigate('/bets');
    } catch (e) {
      toast.error(e.message || 'Failed to place bet');
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="px-4 pt-4 space-y-5 pb-28">
      <div className="flex items-center gap-3">
        <button
          onClick={goBack}
          className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <h1 className="text-xl font-heading font-bold text-foreground">{t('new_bet')}</h1>
        <div className="ml-auto">
          <GemsBadge amount={profile.gems_balance} />
        </div>
      </div>

      <StepProgress current={step} total={STEPS.length} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.22 }}
          className="space-y-5"
        >
          {step === 0 && (
            <StepCategory lang={lang} value={form.category} onPick={pickCategory} />
          )}

          {step === 1 && (
            <StepActivity
              lang={lang}
              t={t}
              category={form.category}
              templates={templates}
              form={form}
              update={update}
              pickTemplate={pickTemplate}
              pickCustomInTemplates={pickCustomInTemplates}
              isCustomCat={isCustomCat}
              allowedProofTypes={allowedProofTypes}
              goalError={goalError}
            />
          )}

          {step === 2 && (
            <StepStake
              lang={lang}
              t={t}
              form={form}
              update={update}
              profile={profile}
              reward={reward}
              durMult={durMult}
              proofMult={proofMult}
              totalMult={totalMult}
            />
          )}

          {step === 3 && (
            <StepSummary
              lang={lang}
              form={form}
              proofConfig={proofConfig}
              reward={reward}
              totalMult={totalMult}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 pt-3 bg-gradient-to-t from-background via-background to-transparent">
        {step < STEPS.length - 1 ? (
          <Button
            onClick={goNext}
            disabled={!canContinue()}
            className="w-full h-12 bg-gradient-to-r from-primary to-neon-cyan text-white font-heading font-semibold text-base rounded-xl gap-2"
          >
            {lang === 'ru' ? 'Продолжить' : 'Continue'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-12 bg-gradient-to-r from-primary to-neon-cyan text-white font-heading font-semibold text-base rounded-xl"
          >
            {submitting
              ? t('placing')
              : `${t('place_bet_btn')} — ${form.stake_amount} GEMS`}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepProgress({ current, total }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            i <= current ? 'bg-gradient-to-r from-primary to-neon-cyan' : 'bg-secondary'
          }`}
        />
      ))}
    </div>
  );
}

function StepCategory({ lang, value, onPick }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {lang === 'ru' ? 'Шаг 1' : 'Step 1'}
        </p>
        <h2 className="text-lg font-heading font-bold text-foreground mt-1">
          {lang === 'ru' ? 'Выберите категорию цели' : 'Pick a goal category'}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {lang === 'ru'
            ? 'От категории зависит, какие задания и тип проверки будут доступны.'
            : 'The category determines available activities and proof types.'}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {Object.entries(CATEGORIES).map(([key, cat]) => {
          const selected = value === key;
          return (
            <motion.button
              key={key}
              whileTap={{ scale: 0.96 }}
              onClick={() => onPick(key)}
              className={`rounded-xl p-4 text-left border transition-all flex items-center gap-3 ${
                selected
                  ? 'border-primary bg-primary/10 glow-purple'
                  : 'border-border/50 bg-card'
              }`}
            >
              <span className="text-2xl shrink-0">{cat.emoji}</span>
              <div className="min-w-0">
                <p
                  className={`text-sm font-heading font-semibold ${
                    selected ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {lang === 'ru' ? cat.labelRu : cat.label}
                </p>
                {key === 'custom' && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {lang === 'ru' ? 'Своя цель' : 'Your own goal'}
                  </p>
                )}
              </div>
              {selected && <CheckCircle2 className="w-4 h-4 text-primary ml-auto shrink-0" />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function StepActivity({
  lang,
  t,
  category,
  templates,
  form,
  update,
  pickTemplate,
  pickCustomInTemplates,
  isCustomCat,
  allowedProofTypes,
  goalError,
}) {
  const cat = CATEGORIES[category];
  const selectedTemplate = templates.find(
    (tpl) => tpl.titleRu === form.title || tpl.titleEn === form.title,
  );
  const customMode = !selectedTemplate;
  const proofConfig = PROOF_MULTIPLIERS[form.proof_type];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {lang === 'ru' ? 'Шаг 2' : 'Step 2'}
        </p>
        <h2 className="text-lg font-heading font-bold text-foreground mt-1 flex items-center gap-2">
          <span className="text-2xl">{cat?.emoji}</span>
          {isCustomCat
            ? lang === 'ru'
              ? 'Опишите свою цель'
              : 'Describe your goal'
            : lang === 'ru'
            ? 'Что именно делаем?'
            : 'What exactly will you do?'}
        </h2>
        {!isCustomCat && (
          <p className="text-xs text-muted-foreground mt-1">
            {lang === 'ru'
              ? 'Каждое задание привязано к подходящему типу проверки.'
              : 'Each activity is tied to a matching proof type.'}
          </p>
        )}
      </div>

      {!isCustomCat && templates.length > 0 && (
        <div className="grid grid-cols-1 gap-2">
          {templates.map((tpl, i) => {
            const label = lang === 'ru' ? tpl.titleRu : tpl.titleEn;
            const isSelected = form.title === label;
            const pm = PROOF_MULTIPLIERS[tpl.proof_type];
            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.98 }}
                onClick={() => pickTemplate(tpl)}
                className={`rounded-xl p-3 text-left border transition-all flex items-center gap-3 ${
                  isSelected ? 'border-primary bg-primary/10' : 'border-border/50 bg-card'
                }`}
              >
                <span className="text-2xl shrink-0">{tpl.icon}</span>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-heading font-semibold leading-tight ${
                      isSelected ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {label}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <LockKeyhole className="w-3 h-3" />
                    {lang === 'ru' ? pm?.labelRu : pm?.labelEn}
                  </p>
                </div>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
              </motion.button>
            );
          })}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={pickCustomInTemplates}
            className={`rounded-xl p-3 text-left border border-dashed transition-all flex items-center gap-3 ${
              customMode && !selectedTemplate
                ? 'border-neon-cyan bg-neon-cyan/10'
                : 'border-border/50 bg-card'
            }`}
          >
            <PenLine
              className={`w-5 h-5 shrink-0 ${
                customMode && !selectedTemplate ? 'text-neon-cyan' : 'text-muted-foreground'
              }`}
            />
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-heading font-semibold ${
                  customMode && !selectedTemplate
                    ? 'text-neon-cyan'
                    : 'text-muted-foreground'
                }`}
              >
                {lang === 'ru' ? 'Своя цель в этой категории' : 'Custom goal in this category'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {lang === 'ru'
                  ? 'Напиши свою цель и выбери формат проверки.'
                  : 'Write your goal and pick the proof format.'}
              </p>
            </div>
          </motion.button>
        </div>
      )}

      {(isCustomCat || (customMode && !selectedTemplate)) && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {lang === 'ru' ? 'Название цели' : 'Goal title'}
            </label>
            <Input
              placeholder={t('goal_placeholder')}
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              autoFocus={isCustomCat}
              className={`bg-card border-border/50 text-foreground placeholder:text-muted-foreground ${
                goalError ? 'border-destructive' : ''
              }`}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {lang === 'ru' ? 'Как будешь доказывать?' : 'How will you prove it?'}
            </label>
            <div
              className={`grid gap-2 ${
                allowedProofTypes.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
              }`}
            >
              {allowedProofTypes.map((key) => {
                const pm = PROOF_MULTIPLIERS[key];
                if (!pm) return null;
                return (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => update('proof_type', key)}
                    className={`rounded-xl p-3 text-center border transition-all ${
                      form.proof_type === key
                        ? 'border-neon-cyan bg-neon-cyan/10'
                        : 'border-border/50 bg-card'
                    }`}
                  >
                    <p
                      className={`text-sm font-medium ${
                        form.proof_type === key ? 'text-neon-cyan' : 'text-foreground'
                      }`}
                    >
                      {lang === 'ru' ? pm.labelRu : pm.labelEn}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {lang === 'ru' ? pm.hintRu : pm.hintEn}
                    </p>
                    <p className="text-[11px] text-neon-gold font-bold mt-1">
                      ×{pm.multiplier}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedTemplate && proofConfig && (
        <div className="rounded-xl p-3 border border-neon-cyan/30 bg-gradient-to-r from-neon-cyan/10 to-primary/10 flex items-start gap-3">
          <LockKeyhole className="w-5 h-5 text-neon-cyan mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-heading font-semibold text-foreground">
              {lang === 'ru' ? proofConfig.labelRu : proofConfig.labelEn}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {lang === 'ru' ? proofConfig.hintRu : proofConfig.hintEn}
            </p>
            <p className="text-[11px] text-neon-gold font-bold mt-1">
              ×{proofConfig.multiplier}
            </p>
          </div>
        </div>
      )}

      {goalError && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30">
          <ShieldAlert className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-xs text-destructive">{goalError}</p>
        </div>
      )}
    </div>
  );
}

function StepStake({ lang, t, form, update, profile, reward, durMult, proofMult, totalMult }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {lang === 'ru' ? 'Шаг 3' : 'Step 3'}
        </p>
        <h2 className="text-lg font-heading font-bold text-foreground mt-1">
          {lang === 'ru' ? 'Сумма, срок и детали' : 'Stake, duration & details'}
        </h2>
      </div>

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
              <div>
                {d}
                {lang === 'ru' ? 'д' : 'd'}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {DURATION_MULTIPLIERS[d]?.label}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{t('details_optional')}</label>
        <Textarea
          placeholder={t('details_placeholder')}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          className="bg-card border-border/50 text-foreground placeholder:text-muted-foreground h-20 resize-none"
        />
      </div>

      <div className="rounded-xl bg-gradient-to-r from-primary/10 to-neon-cyan/10 border border-primary/20 p-4 space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {t('potential_reward')}
        </p>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-neon-gold" />
              <span className="text-2xl font-heading font-bold text-neon-gold">
                {reward} GEMS
              </span>
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
    </div>
  );
}

function StepSummary({ lang, form, proofConfig, reward, totalMult }) {
  const cat = CATEGORIES[form.category];
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {lang === 'ru' ? 'Шаг 4' : 'Step 4'}
        </p>
        <h2 className="text-lg font-heading font-bold text-foreground mt-1 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-neon-gold" />
          {lang === 'ru' ? 'Подтвердите ставку' : 'Review your bet'}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {lang === 'ru'
            ? 'Проверьте всё перед подтверждением — после ставки GEMS блокируются до проверки.'
            : 'Double-check everything — GEMS get locked until the bet is resolved.'}
        </p>
      </div>

      <div className="rounded-xl bg-card border border-border/50 p-4 space-y-3">
        <SummaryRow
          label={lang === 'ru' ? 'Категория' : 'Category'}
          value={
            <span className="flex items-center gap-2">
              <span className="text-lg">{cat?.emoji}</span>
              <span className="font-medium text-foreground">
                {lang === 'ru' ? cat?.labelRu : cat?.label}
              </span>
            </span>
          }
        />
        <SummaryRow
          label={lang === 'ru' ? 'Цель' : 'Goal'}
          value={<span className="font-medium text-foreground text-right">{form.title}</span>}
        />
        {form.description?.trim() && (
          <SummaryRow
            label={lang === 'ru' ? 'Детали' : 'Details'}
            value={
              <span className="text-foreground/80 text-right whitespace-pre-wrap">
                {form.description}
              </span>
            }
          />
        )}
        <SummaryRow
          label={lang === 'ru' ? 'Тип доказательства' : 'Proof type'}
          value={
            <span className="font-medium text-neon-cyan">
              {proofConfig
                ? lang === 'ru'
                  ? proofConfig.labelRu
                  : proofConfig.labelEn
                : form.proof_type}
            </span>
          }
        />
        <SummaryRow
          label={lang === 'ru' ? 'Срок' : 'Duration'}
          value={
            <span className="font-medium text-foreground">
              {form.duration_days} {lang === 'ru' ? 'дн.' : 'd'}
            </span>
          }
        />
        <SummaryRow
          label={lang === 'ru' ? 'Ставка' : 'Stake'}
          value={
            <span className="font-medium text-foreground">{form.stake_amount} 💎</span>
          }
        />
      </div>

      <div className="rounded-xl bg-gradient-to-r from-neon-gold/10 to-amber-400/10 border border-neon-gold/30 p-4 space-y-1.5">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {lang === 'ru' ? 'Если выполнишь' : 'If you succeed'}
        </p>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-neon-gold" />
          <span className="text-3xl font-heading font-bold text-neon-gold">+{reward} GEMS</span>
          <span className="text-[11px] text-muted-foreground ml-auto">×{totalMult}</span>
        </div>
        <p className="text-[11px] text-destructive mt-1">
          {lang === 'ru'
            ? `Если провалишь — потеряешь ${form.stake_amount} GEMS.`
            : `If you fail — you lose ${form.stake_amount} GEMS.`}
        </p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-right min-w-0">{value}</span>
    </div>
  );
}
