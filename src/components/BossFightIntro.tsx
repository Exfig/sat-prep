import { motion } from 'framer-motion';

interface BossFightIntroProps {
  domainName: string;
  onBegin: () => void;
}

export default function BossFightIntro({ domainName, onBegin }: BossFightIntroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-slate-900 rounded-xl shadow-lg p-8 text-center"
    >
      <motion.h1
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, type: 'spring', stiffness: 200 }}
        className="text-4xl font-black text-red-500 mb-3"
      >
        BOSS FIGHT
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-lg font-semibold text-slate-300 mb-2"
      >
        {domainName}
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-sm text-slate-400 mb-8"
      >
        Score &ge;75% to win!
      </motion.p>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onBegin}
        className="relative py-3 px-8 rounded-lg bg-red-500 text-white font-bold text-lg
          hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
      >
        <motion.span
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="inline-block"
        >
          Begin
        </motion.span>
      </motion.button>
    </motion.div>
  );
}
