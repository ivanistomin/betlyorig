export default function StatCard({ icon, label, value, subtext, glowClass }) {
  return (
    <div className={`rounded-xl bg-card border border-border/50 p-4 ${glowClass || ''}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-heading font-bold text-foreground">{value}</div>
      {subtext && <div className="text-xs text-muted-foreground mt-1">{subtext}</div>}
    </div>
  );
}