import { useState, useMemo, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../contexts/AuthContext';
import { getLevelForXP } from '../utils/xp';
import { getActiveNotifications } from '../utils/notifications';

const IS_CALIBER = import.meta.env.VITE_THEME === 'caliber';

const fullNavItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/practice', label: 'Practice' },
  { to: '/mock-test', label: 'Mock Test' },
  { to: '/progress', label: 'Progress' },
  { to: '/strategy-guide', label: 'Strategy Guide' },
  { to: '/profile', label: 'Profile' },
  { to: '/activity', label: 'Activity' },
  { to: '/settings', label: 'Settings' },
];

const onboardingNavItems = [
  { to: '/strategy-guide', label: 'Strategy Guide' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const xp = useAppStore((s) => s.xp);
  const strategyGuideCompleted = useAppStore((s) => s.strategyGuideCompleted);
  const psatScores = useAppStore((s) => s.psatScores);
  const mockTestHistory = useAppStore((s) => s.mockTestHistory);
  const dismissedNotifications = useAppStore((s) => s.dismissedNotifications);
  const dismissNotification = useAppStore((s) => s.dismissNotification);
  const { user, signOut, role } = useAuth();

  const themeMode = useAppStore((s) => s.themeMode);
  const notifications = useMemo(
    () => getActiveNotifications(
      { psatScores, mockTestHistory, strategyGuideCompleted, themeMode },
      dismissedNotifications,
    ),
    [psatScores, mockTestHistory, strategyGuideCompleted, themeMode, dismissedNotifications],
  );

  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);
  const navItems = useMemo(() => {
    if (!strategyGuideCompleted) return onboardingNavItems;
    return role === 'admin'
      ? [...fullNavItems, { to: '/admin', label: 'Admin' }]
      : fullNavItems;
  }, [role, strategyGuideCompleted]);
  const level = useMemo(() => getLevelForXP(xp), [xp]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
      isActive
        ? IS_CALIBER ? 'bg-[rgba(200,162,78,0.15)] text-[#e4c36e]' : 'bg-indigo-700 text-white'
        : IS_CALIBER ? 'text-white/55 hover:bg-white/[0.06] hover:text-white' : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
    }`;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 shadow-lg ${
        IS_CALIBER ? 'bg-[#08090d] border-b border-white/[0.06]' : 'bg-indigo-900'
      }`}
      role="banner"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center gap-2 text-white font-bold text-lg shrink-0" aria-label={IS_CALIBER ? 'Caliber - Home' : 'SAT Prep - Home'}>
            {IS_CALIBER
              ? <img src={`${import.meta.env.BASE_URL}caliber-icon.png`} className="w-7 h-7 rounded" alt="" />
              : <span className="text-2xl" role="img" aria-label="memo">📝</span>
            }
            <span className="hidden sm:inline">{IS_CALIBER ? 'Caliber' : 'SAT Prep'}</span>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass} end={item.to === '/'}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Notifications + XP/Level pill + User info (desktop) */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {notifications.length > 0 && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen((o) => !o)}
                  className={`relative p-2 rounded-full transition-colors ${
                    IS_CALIBER ? 'text-white/55 hover:text-white hover:bg-white/[0.06]' : 'text-indigo-200 hover:text-white hover:bg-indigo-700'
                  }`}
                  aria-label={`${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {notifications.length}
                  </span>
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                    <div className="p-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-800">Notifications</p>
                    </div>
                    {notifications.map((n) => (
                      <div key={n.id} className="p-3 border-b border-slate-50 last:border-0">
                        <div className="flex items-start gap-2">
                          <span className="text-lg shrink-0">{n.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{n.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {n.actionLabel && n.actionRoute && (
                                <button
                                  onClick={() => { setNotifOpen(false); navigate(n.actionRoute!); }}
                                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                                >
                                  {n.actionLabel}
                                </button>
                              )}
                              <button
                                onClick={() => dismissNotification(n.id)}
                                className="text-xs text-slate-400 hover:text-slate-600 ml-auto"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div
              className={`flex items-center rounded-full px-3 py-1 text-sm ${
                IS_CALIBER ? 'bg-white/[0.06] border border-white/[0.06]' : 'bg-indigo-800'
              }`}
              aria-label={`Level ${level.level}, ${xp} experience points`}
            >
              <span className={IS_CALIBER ? 'text-[#e4c36e] font-medium' : 'text-indigo-200 font-medium'}>
                Lv.{level.level}
              </span>
              <span className={`mx-1.5 ${IS_CALIBER ? 'text-white/30' : 'text-indigo-400'}`} aria-hidden="true">•</span>
              <span className={IS_CALIBER ? 'text-white/70 font-medium' : 'text-indigo-200 font-medium'}>{xp} XP</span>
            </div>
            {user && (
              <button
                onClick={signOut}
                className={`text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
                  IS_CALIBER
                    ? 'text-white/55 hover:text-white bg-white/[0.06] hover:bg-white/[0.1]'
                    : 'text-indigo-200 hover:text-white bg-indigo-800 hover:bg-indigo-700'
                }`}
                aria-label={`Sign out ${user.email ?? ''}`}
              >
                Sign Out
              </button>
            )}
          </div>

          {/* Mobile: XP pill + hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <div
              className={`flex items-center rounded-full px-2.5 py-1 text-xs ${
                IS_CALIBER ? 'bg-white/[0.06] border border-white/[0.06]' : 'bg-indigo-800'
              }`}
              aria-label={`Level ${level.level}, ${xp} experience points`}
            >
              <span className={IS_CALIBER ? 'text-[#e4c36e] font-medium' : 'text-indigo-200 font-medium'}>Lv.{level.level}</span>
              <span className={`mx-1 ${IS_CALIBER ? 'text-white/30' : 'text-indigo-400'}`} aria-hidden="true">•</span>
              <span className={IS_CALIBER ? 'text-white/70 font-medium' : 'text-indigo-200 font-medium'}>{xp}</span>
            </div>
            <button
              className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center ${
                IS_CALIBER ? 'text-white/55 hover:text-white' : 'text-indigo-100 hover:text-white'
              }`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav
          id="mobile-nav-menu"
          className={`lg:hidden px-4 py-2 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto ${
            IS_CALIBER ? 'bg-[#111318] border-t border-white/[0.06]' : 'bg-indigo-800 border-t border-indigo-700'
          }`}
          aria-label="Mobile navigation"
        >
          {user && (
            <div className={`text-xs px-3 py-1 truncate ${IS_CALIBER ? 'text-white/40' : 'text-indigo-300'}`} aria-label={`Signed in as ${user.email}`}>
              {user.email}
            </div>
          )}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={linkClass}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          {user && (
            <button
              onClick={() => { setMobileOpen(false); signOut(); }}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 min-h-[44px] ${
                IS_CALIBER
                  ? 'text-white/55 hover:bg-white/[0.06] hover:text-white'
                  : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
              }`}
            >
              Sign Out
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
