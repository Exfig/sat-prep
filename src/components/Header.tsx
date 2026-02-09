import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../contexts/AuthContext';
import { getLevelForXP } from '../utils/xp';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/practice', label: 'Practice' },
  { to: '/mock-test', label: 'Mock Test' },
  { to: '/progress', label: 'Progress' },
  { to: '/profile', label: 'Profile' },
  { to: '/activity', label: 'Activity Log' },
  { to: '/settings', label: 'Settings' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { xp } = useAppStore();
  const { user, signOut } = useAuth();
  const level = getLevelForXP(xp);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-indigo-700 text-white'
        : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-indigo-900 shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center gap-2 text-white font-bold text-lg">
            <span className="text-2xl" role="img" aria-label="memo">📝</span>
            SAT Prep
          </NavLink>

          {/* XP/Level pill + User info */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center bg-indigo-800 rounded-full px-3 py-1 text-sm">
              <span className="text-indigo-200 font-medium">
                Lv.{level.level}
              </span>
              <span className="text-indigo-400 mx-1.5">•</span>
              <span className="text-indigo-200 font-medium">{xp} XP</span>
            </div>
            {user && (
              <button
                onClick={signOut}
                className="text-indigo-200 hover:text-white text-sm font-medium px-3 py-1.5
                  bg-indigo-800 hover:bg-indigo-700 rounded-full transition-colors"
                title={user.email ?? ''}
              >
                Sign Out
              </button>
            )}
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass} end={item.to === '/'}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-indigo-100 hover:text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="md:hidden bg-indigo-800 border-t border-indigo-700 px-4 py-2 space-y-1">
          {/* Mobile XP pill */}
          <div className="flex items-center bg-indigo-700 rounded-full px-3 py-1.5 text-sm mb-2 w-fit">
            <span className="text-indigo-200 font-medium">Lv.{level.level}</span>
            <span className="text-indigo-400 mx-1.5">•</span>
            <span className="text-indigo-200 font-medium">{xp} XP</span>
          </div>
          {user && (
            <div className="text-indigo-300 text-xs px-3 py-1 truncate">
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
              <div className="block">{item.label}</div>
            </NavLink>
          ))}
          {user && (
            <button
              onClick={() => { setMobileOpen(false); signOut(); }}
              className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium
                text-indigo-100 hover:bg-indigo-500 hover:text-white transition-all duration-200"
            >
              Sign Out
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
