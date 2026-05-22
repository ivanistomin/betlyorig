export default function GemIcon({ className = 'w-4 h-4' }) {
  return (
    <span
      role="img"
      aria-label="gem"
      className={`inline-flex items-center justify-center leading-none ${className}`}
      style={{ fontSize: 'inherit' }}
    >
      💎
    </span>
  );
}
