import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThinkOverlayProps {
  duration: number;
  onComplete: () => void;
}

export default function ThinkOverlay({ duration, onComplete }: ThinkOverlayProps) {
  const [remaining, setRemaining] = useState(duration);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setVisible(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleExitComplete = () => {
    onComplete();
  };

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={`Think period: ${remaining} seconds remaining`}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <p className="text-2xl font-bold text-white mb-4" id="think-overlay-label">Think...</p>
            <p
              className="text-6xl font-black text-white tabular-nums"
              role="timer"
              aria-live="assertive"
              aria-atomic="true"
              aria-label={`${remaining} seconds remaining`}
            >
              {remaining}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
