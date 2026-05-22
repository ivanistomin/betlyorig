import { motion } from 'framer-motion';
import GemIcon from '@/components/common/GemIcon.jsx';

export default function GemsBadge({ amount, size = 'md', showPlus = false, animate = false }) {
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-lg px-4 py-1.5 font-bold',
    xl: 'text-2xl px-5 py-2 font-black',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-7 h-7',
  };

  const Wrapper = animate ? motion.div : 'div';
  const animProps = animate ? { animate: { scale: [1, 1.05, 1] }, transition: { duration: 2, repeat: Infinity } } : {};

  return (
    <Wrapper
      {...animProps}
      className={`inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 font-heading ${sizes[size]}`}
    >
      <GemIcon className={iconSizes[size]} />
      <span>{showPlus && amount > 0 ? '+' : ''}{typeof amount === 'number' ? amount.toLocaleString() : amount}</span>
    </Wrapper>
  );
}