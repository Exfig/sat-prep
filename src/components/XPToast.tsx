import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface XPToastProps {
  amount: number;
  reason: string;
  onDone: () => void;
}

export default function XPToast({ amount, reason, onDone }: XPToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white rounded-lg shadow-lg px-4 py-3 pointer-events-none"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      role="status"
      aria-live="polite"
      aria-label={`Earned ${amount} experience points: ${reason}`}
    >
      <span className="text-lg font-bold">+{amount} XP</span>
      <span className="text-emerald-100 text-sm ml-2">{reason}</span>
    </motion.div>
  );
}
