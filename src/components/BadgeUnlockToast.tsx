import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface BadgeUnlockToastProps {
  badge: { name: string; icon: string; description: string };
  onDone: () => void;
}

export default function BadgeUnlockToast({ badge, onDone }: BadgeUnlockToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      className="fixed top-20 right-6 z-50 bg-white border-2 border-amber-400 rounded-xl shadow-xl px-5 py-4 flex items-center gap-3"
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80 }}
      transition={{ duration: 0.35 }}
      role="status"
      aria-live="polite"
      aria-label={`Badge unlocked: ${badge.name}. ${badge.description}`}
    >
      <span className="text-3xl" aria-hidden="true">{badge.icon}</span>
      <div>
        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Badge Unlocked!</p>
        <p className="font-bold text-slate-800">{badge.name}</p>
        <p className="text-xs text-slate-500">{badge.description}</p>
      </div>
    </motion.div>
  );
}
