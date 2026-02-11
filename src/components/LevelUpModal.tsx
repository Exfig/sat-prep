import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { LevelInfo } from '../types';

interface LevelUpModalProps {
  newLevel: LevelInfo;
  onClose: () => void;
}

export default function LevelUpModal({ newLevel, onClose }: LevelUpModalProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // WCAG 2.4.3 - Focus the primary action when modal opens
  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  // WCAG 2.1.2 - Allow Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-up-title"
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 text-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="text-5xl mb-3" aria-hidden="true">🎉</div>
        <h2 id="level-up-title" className="text-2xl font-bold text-amber-600 mb-1">Level Up!</h2>
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center text-2xl font-bold mx-auto my-4 shadow-lg" aria-hidden="true">
          {newLevel.level}
        </div>
        <p className="text-lg font-semibold text-slate-800 mb-1">{newLevel.title}</p>
        <p className="text-sm text-slate-500 mb-6">You reached level {newLevel.level}!</p>
        <button
          ref={buttonRef}
          onClick={onClose}
          className="w-full py-3 bg-amber-500 text-white rounded-lg font-semibold
            hover:bg-amber-600 transition-all duration-200"
        >
          Continue
        </button>
      </motion.div>
    </div>
  );
}
