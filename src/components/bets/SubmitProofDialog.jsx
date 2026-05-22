import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  AlertOctagon,
  Send,
  Paperclip,
  X,
  FileImage,
  FileVideo,
  FileText,
  Loader2,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { PROOF_MULTIPLIERS } from '@/lib/gameConfig';
import { db } from '@/api/base44Client';
import { toast } from 'sonner';

const PROOF_ACCEPT_BY_TYPE = {
  photo: 'image/*',
  video: 'video/*',
  steps_km: 'image/*',
  any: 'image/*,video/*,application/pdf',
};

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export default function SubmitProofDialog({ open, bet, onClose, onConfirm }) {
  const { lang } = useLang();
  const [note, setNote] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const proofType = bet?.proof_type || 'any';
  const proofConfig = PROOF_MULTIPLIERS[proofType];
  const proofLabel = proofConfig
    ? lang === 'ru'
      ? proofConfig.labelRu
      : proofConfig.labelEn
    : proofType;
  const proofHint = proofConfig ? (lang === 'ru' ? proofConfig.hintRu : proofConfig.hintEn) : '';
  const accept = PROOF_ACCEPT_BY_TYPE[proofType] || PROOF_ACCEPT_BY_TYPE.any;

  useEffect(() => {
    if (open) {
      setNote('');
      setFile(null);
      setUploading(false);
      setSubmitting(false);
    }
  }, [open, bet?.id]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      toast.error(lang === 'ru' ? 'Файл больше 25 МБ' : 'File is larger than 25 MB');
      return;
    }
    setFile(f);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error(
        lang === 'ru' ? 'Прикрепите файл с доказательством' : 'Attach a proof file',
      );
      return;
    }
    setSubmitting(true);
    try {
      setUploading(true);
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      setUploading(false);
      if (!file_url) {
        toast.error(lang === 'ru' ? 'Не удалось загрузить файл' : 'File upload failed');
        setSubmitting(false);
        return;
      }
      await onConfirm({ note, url: file_url });
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const FileIcon = file?.type?.startsWith('video/')
    ? FileVideo
    : file?.type?.startsWith('image/')
    ? FileImage
    : FileText;

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
              ? 'Опиши, как ты выполнил цель. Модератор рассмотрит в течение 12 часов.'
              : 'Describe how you completed the goal. A moderator will review within 12 hours.'}
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
              placeholder={
                lang === 'ru'
                  ? 'Например: пробежал 5 км по парку, прикрепил скрин трекера'
                  : 'e.g. ran 5km in the park, tracker screenshot attached'
              }
              className="bg-secondary border-border/50 h-20 resize-none"
              maxLength={500}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">
              {lang === 'ru' ? 'Файл с доказательством (обязательно)' : 'Proof file (required)'}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="rounded-lg border border-neon-cyan/30 bg-neon-cyan/5 px-3 py-2.5 flex items-center gap-2">
                <FileIcon className="w-4 h-4 text-neon-cyan shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">{file.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={clearFile}
                  className="w-7 h-7 rounded-md bg-secondary text-muted-foreground hover:text-destructive flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-lg border border-dashed border-border/60 bg-secondary/40 px-3 py-4 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
              >
                <Paperclip className="w-5 h-5" />
                <p className="text-xs font-medium">
                  {lang === 'ru' ? 'Прикрепить файл' : 'Attach file'}
                </p>
                <p className="text-[10px]">{lang === 'ru' ? 'до 25 МБ' : 'up to 25 MB'}</p>
              </button>
            )}
          </div>

          <div className="rounded-lg bg-destructive/10 border border-destructive/40 px-3 py-2 flex items-start gap-2">
            <AlertOctagon className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-[11px] text-destructive leading-snug">
              {lang === 'ru'
                ? 'Модератор вправе аннулировать или отклонить любую ставку без указания причин без возврата средств.'
                : 'A moderator may void or reject any bet without explanation and without refund.'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} className="flex-1 text-muted-foreground">
            {lang === 'ru' ? 'Отмена' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || uploading || !file}
            className="flex-1 bg-gradient-to-r from-primary to-neon-cyan text-white font-heading gap-1.5"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {lang === 'ru' ? 'Загрузка...' : 'Uploading...'}
              </>
            ) : submitting ? (
              lang === 'ru' ? (
                'Отправка...'
              ) : (
                'Sending...'
              )
            ) : (
              <>
                <Send className="w-4 h-4" />
                {lang === 'ru' ? 'Отправить' : 'Send'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
