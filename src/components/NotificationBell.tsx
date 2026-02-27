import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { getActiveNotifications } from '../utils/notifications';

function AnimatedBell({ hasNotifications }: { hasNotifications: boolean }) {
  const [ring, setRing] = useState(false);

  // Ring the bell periodically when there are notifications
  useEffect(() => {
    if (!hasNotifications) return;
    const id = setInterval(() => setRing((v) => !v), 3000);
    return () => { clearInterval(id); setRing(false); };
  }, [hasNotifications]);

  return (
    <motion.svg
      viewBox="0 0 40 40"
      fill="none"
      className="h-5 w-5 shrink-0"
      animate={ring ? { rotate: [0, 8, -8, 6, -6, 3, 0] } : { rotate: 0 }}
      transition={{ duration: 0.6 }}
      style={{ transformOrigin: '20px 6px' }}
    >
      <path
        d="M28 16a8 8 0 00-16 0c0 8-4 10-4 10h24s-4-2-4-10"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 30a3 3 0 005 0"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <motion.circle
        cx="28"
        cy="10"
        r="4"
        fill="#EF4444"
        animate={
          hasNotifications
            ? { scale: [0, 1.3, 1], opacity: 1 }
            : { scale: 0, opacity: 0 }
        }
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      />
    </motion.svg>
  );
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const psatScores = useAppStore((s) => s.psatScores);
  const mockTestHistory = useAppStore((s) => s.mockTestHistory);
  const strategyGuideCompleted = useAppStore((s) => s.strategyGuideCompleted);
  const themeMode = useAppStore((s) => s.themeMode);
  const dismissedNotifications = useAppStore((s) => s.dismissedNotifications);
  const dismissNotification = useAppStore((s) => s.dismissNotification);

  const notifications = useMemo(
    () =>
      getActiveNotifications(
        { psatScores, mockTestHistory, strategyGuideCompleted, themeMode },
        dismissedNotifications,
      ),
    [psatScores, mockTestHistory, strategyGuideCompleted, themeMode, dismissedNotifications],
  );

  const count = notifications.length;

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (count === 0) return null;

  return (
    <div className="fixed bottom-5 left-[3.5rem] z-50" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center w-10 h-10 rounded-full
          bg-[#1a1c24] border border-white/10 shadow-lg shadow-black/40
          text-white/70 hover:bg-[#22252e] hover:text-white hover:border-white/20
          transition-all duration-200 cursor-pointer"
        aria-label={`${count} notification${count !== 1 ? 's' : ''}`}
      >
        <AnimatedBell hasNotifications={count > 0} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 bottom-full mb-2 w-72 bg-[#12141a] rounded-xl shadow-xl border border-white/10 z-50 overflow-hidden">
          <div className="p-3 border-b border-white/[0.06]">
            <p className="text-sm font-semibold text-white/90">Notifications</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((n) => (
              <div key={n.id} className="p-3 border-b border-white/[0.04] last:border-0">
                <div className="flex items-start gap-2">
                  <span className="text-lg shrink-0">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/90">{n.title}</p>
                    <p className="text-xs text-white/50 mt-0.5">{n.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {n.actionLabel && n.actionRoute && (
                        <button
                          onClick={() => {
                            setOpen(false);
                            navigate(n.actionRoute!);
                          }}
                          className="text-xs font-medium text-[#e4c36e] hover:text-[#c8a24e]"
                        >
                          {n.actionLabel}
                        </button>
                      )}
                      <button
                        onClick={() => dismissNotification(n.id)}
                        className="text-xs text-white/30 hover:text-white/60 ml-auto"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
