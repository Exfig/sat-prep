import { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../contexts/AuthContext';
import { getLevelForXP } from '../utils/xp';

const baseNavItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/practice', label: 'Practice' },
  { to: '/mock-test', label: 'Mock Test' },
  { to: '/progress', label: 'Progress' },
  { to: '/profile', label: 'Profile' },
  { to: '/activity', label: 'Activity' },
  { to: '/settings', label: 'Settings' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const xp = useAppStore((s) => s.xp);
  const { user, signOut, role } = useAuth();
  const navItems = useMemo(
    () => role === 'admin'
      ? [...baseNavItems, { to: '/admin', label: 'Admin' }]
      : baseNavItems,
    [role],
  );
  const level = useMemo(() => getLevelForXP(xp), [xp]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
      isActive
        ? 'bg-indigo-700 text-white'
        : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-indigo-900 shadow-lg" role="banner">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center gap-2 text-white font-bold text-lg shrink-0" aria-label="SAT Prep - Home">
            <span className="text-2xl" role="img" aria-label="memo">📝</span>
            <span className="hidden sm:inline">SAT Prep</span>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass} end={item.to === '/'}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* XP/Level pill + User info (desktop) */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <div className="flex items-center bg-indigo-800 rounded-full px-3 py-1 text-sm" aria-label={`Level ${level.level}, ${xp} experience points`}>
              <span className="text-indigo-200 font-medium">
                Lv.{level.level}
              </span>
              <span className="text-indigo-400 mx-1.5" aria-hidden="true">•</span>
              <span className="text-indigo-200 font-medium">{xp} XP</span>
            </div>
            {user && (
              <button
                onClick={signOut}
                className="text-indigo-200 hover:text-white text-sm font-medium px-3 py-1.5
                  bg-indigo-800 hover:bg-indigo-700 rounded-full transition-colors"
                aria-label={`Sign out ${user.email ?? ''}`}
              >
                Sign Out
              </button>
            )}
          </div>

          {/* Mobile: XP pill + hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <div className="flex items-center bg-indigo-800 rounded-full px-2.5 py-1 text-xs" aria-label={`Level ${level.level}, ${xp} experience points`}>
              <span className="text-indigo-200 font-medium">Lv.{level.level}</span>
              <span className="text-indigo-400 mx-1" aria-hidden="true">•</span>
              <span className="text-indigo-200 font-medium">{xp}</span>
            </div>
            <button
              className="text-indigo-100 hover:text-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
        <nav id="mobile-nav-menu" className="lg:hidden bg-indigo-800 border-t border-indigo-700 px-4 py-2 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto" aria-label="Mobile navigation">
          {user && (
            <div className="text-indigo-300 text-xs px-3 py-1 truncate" aria-label={`Signed in as ${user.email}`}>
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
              className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium
                text-indigo-100 hover:bg-indigo-500 hover:text-white transition-all duration-200
                min-h-[44px]"
            >
              Sign Out
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
