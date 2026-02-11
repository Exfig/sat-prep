import { motion } from 'framer-motion';
import type { LevelInfo } from '../types';

interface XPBarProps {
  xp: number;
  level: LevelInfo;
  xpToNext: { current: number; needed: number; progress: number };
}

export default function XPBar({ xp, level, xpToNext }: XPBarProps) {
  const isMaxLevel = xpToNext.needed === 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4" aria-label={`Level ${level.level}: ${level.title}. ${xp} total XP. ${isMaxLevel ? 'Max level reached' : `${xpToNext.current} of ${xpToNext.needed} XP to next level`}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm" aria-hidden="true">
          {level.level}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800">{level.title}</span>
            <span className="text-sm text-slate-500">{xp} XP</span>
          </div>
          <div
            className="w-full h-2.5 bg-slate-100 rounded-full mt-1 overflow-hidden"
            role="progressbar"
            aria-valuenow={isMaxLevel ? 100 : Math.round(xpToNext.progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`XP progress: ${isMaxLevel ? '100' : Math.round(xpToNext.progress * 100)}%`}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: isMaxLevel ? '100%' : `${xpToNext.progress * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-400 text-right">
        {isMaxLevel ? 'Max Level!' : `${xpToNext.current} / ${xpToNext.needed} XP to next level`}
      </p>
    </div>
  );
}
