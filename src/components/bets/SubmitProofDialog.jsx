import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Hourglass, Send } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { PROOF_MULTIPLIERS } from '@/lib/gameConfig';

export default function SubmitProofDialog({ open, bet, onClose, onConfirm }) {
  const { lang } = useLang();
  const [note, setNote] = useState('');
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const proofType = bet?.proof_type || 'any';
  const proofConfig = PROOF_MULTIPLIERS[proofType];
  const proofLabel = proofConfig ? (lang === 'ru' ? proofConfig.labelRu : proofConfig.labelEn) : proofType;
  const proofHint = proofConfig ? (lang === 'ru' ? proofConfig.hintRu : proofConfig.hintEn) : '';
  const requiresProofUrl = ['photo', 'video', 'steps_km'].includes(proofType);

  useEffect(() => {
    if (open) {
      setNote('');
      setUrl('');
      setSubmitting(false);
    }
  }, [open, bet?.id]);

  const handleSubmit = async () => {
    if (requiresProofUrl && !url.trim()) return;
    if (!requiresProofUrl && !note.trim() && !url.trim()) return;
    setSubmitting(true);
    try {
      await onConfirm({ note, url });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-primary/30 max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-foreground flex items-center gap-2">
            <span>📤</span>
            {lang === 'ru' ? 'Отправить на проверку' : 'Submit proof'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {lang === 'ru'
              ? 'Опиши, как ты выполнил цель. Модератор рассмотрит в течение 12 часов — иначе награда начислится автоматически.'
              : 'Describe how you completed the goal. A moderator will review within 12h, otherwise the reward is granted automatically.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {bet?.title && (
            <div className="rounded-lg bg-secondary/60 border border-border/50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {lang === 'ru' ? 'Ставка' : 'Bet'}
              </p>
              <p className="font-heading text-base text-foreground">{bet.title}</p>
            </div>
          )}

          {proofConfig && (
            <div className="rounded-lg bg-neon-cyan/5 border border-neon-cyan/20 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {lang === 'ru' ? 'Нужный формат доказательства' : 'Required proof format'}
              </p>
              <p className="font-heading text-sm text-neon-cyan mt-0.5">{proofLabel}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{proofHint}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">
              {lang === 'ru' ? 'Описание выполнения' : 'How you completed it'}
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={lang === 'ru'
                ? 'Например: пробежал 5 км по парку, ссылка на пруф ниже'
                : 'e.g. ran 5km in the park, proof link below'}
              className="bg-secondary border-border/50 h-24 resize-none"
              maxLength={500}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">
              {requiresProofUrl
                ? (lang === 'ru' ? 'Ссылка на пруф (обязательно)' : 'Proof URL (required)')
                : (lang === 'ru' ? 'Ссылка на пруф (необязательно)' : 'Proof URL (optional)')}
            </label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={
                proofType === 'steps_km'
                  ? 'Strava / Apple Fitness / Google Fit / Garmin'
                  : 'https://...'
              }
              className="bg-secondary border-border/50"
            />
          </div>

          <div className="rounded-lg bg-neon-gold/5 border border-neon-gold/20 px-3 py-2 flex items-start gap-2">
            <Hourglass className="w-4 h-4 text-neon-gold mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-snug">
              {lang === 'ru'
                ? 'Если модератор не ответит за 12 часов, ставка будет автоматически зачтена и награда начислена.'
                : 'If a moderator does not respond within 12h the bet is auto-approved and the reward is granted.'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 text-muted-foreground"
          >
            {lang === 'ru' ? 'Отмена' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || (requiresProofUrl ? !url.trim() : (!note.trim() && !url.trim()))}
            className="flex-1 bg-gradient-to-r from-primary to-neon-cyan text-white font-heading gap-1.5"
          >
            <Send className="w-4 h-4" />
            {submitting
              ? (lang === 'ru' ? 'Отправка...' : 'Sending...')
              : (lang === 'ru' ? 'Отправить' : 'Send')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
