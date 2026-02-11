import { motion, useReducedMotion } from 'framer-motion';

interface BossFightIntroProps {
  domainName: string;
  onBegin: () => void;
}

export default function BossFightIntro({ domainName, onBegin }: BossFightIntroProps) {
  const prefersReducedMotion = useReducedMotion();

  const animationProps = prefersReducedMotion
    ? { initial: {}, animate: {}, transition: {} }
    : undefined;

  return (
    <motion.div
      initial={animationProps?.initial ?? { opacity: 0, y: 20 }}
      animate={animationProps?.animate ?? { opacity: 1, y: 0 }}
      transition={animationProps?.transition ?? { duration: 0.5 }}
      className="bg-slate-900 rounded-xl shadow-lg p-8 text-center"
      role="region"
      aria-label="Boss Fight Challenge"
    >
      <motion.h1
        initial={prefersReducedMotion ? {} : { scale: 0.5, opacity: 0 }}
        animate={prefersReducedMotion ? {} : { scale: 1, opacity: 1 }}
        transition={prefersReducedMotion ? {} : { duration: 0.6, delay: 0.2, type: 'spring', stiffness: 200 }}
        className="text-4xl font-black text-red-500 mb-3"
      >
        BOSS FIGHT
      </motion.h1>

      <motion.p
        initial={prefersReducedMotion ? {} : { opacity: 0 }}
        animate={prefersReducedMotion ? {} : { opacity: 1 }}
        transition={prefersReducedMotion ? {} : { delay: 0.5 }}
        className="text-lg font-semibold text-slate-300 mb-2"
      >
        {domainName}
      </motion.p>

      <motion.p
        initial={prefersReducedMotion ? {} : { opacity: 0 }}
        animate={prefersReducedMotion ? {} : { opacity: 1 }}
        transition={prefersReducedMotion ? {} : { delay: 0.7 }}
        className="text-sm text-slate-400 mb-8"
      >
        Score &ge;75% to win!
      </motion.p>

      <motion.button
        initial={prefersReducedMotion ? {} : { opacity: 0 }}
        animate={prefersReducedMotion ? {} : { opacity: 1 }}
        transition={prefersReducedMotion ? {} : { delay: 0.9 }}
        whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
        onClick={onBegin}
        className="relative py-3 px-8 rounded-lg bg-red-500 text-white font-bold text-lg
          hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
      >
        <motion.span
          animate={prefersReducedMotion ? {} : { opacity: [1, 0.7, 1] }}
          transition={prefersReducedMotion ? {} : { duration: 1.5, repeat: Infinity }}
          className="inline-block"
        >
          Begin
        </motion.span>
      </motion.button>
    </motion.div>
  );
}
