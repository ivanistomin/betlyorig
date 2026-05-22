import { getXpForLevel } from '@/lib/gameConfig';
import { Progress } from '@/components/ui/progress';

export default function LevelProgress({ level, xp }) {
  const xpNeeded = getXpForLevel(level);
  const pct = Math.min((xp / xpNeeded) * 100, 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-neon-cyan flex items-center justify-center text-sm font-bold font-heading text-white">
            {level}
          </div>
          <span className="text-sm font-medium text-foreground">Level {level}</span>
        </div>
        <span className="text-xs text-muted-foreground">{xp} / {xpNeeded} XP</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-neon-cyan transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}