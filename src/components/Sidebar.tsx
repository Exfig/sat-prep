import { useState, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  Compass,
  User,
  History,
  Settings,
  ShieldCheck,
  LogOut,
  Sparkles,
  LifeBuoy,
} from 'lucide-react';
import SupportModal from './SupportModal';
import { cn } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../contexts/AuthContext';
import { getLevelForXP } from '../utils/xp';

const sidebarVariants = {
  open: { width: '15rem' },
  closed: { width: '3.05rem' },
};

const contentVariants = {
  open: { display: 'block' as const, opacity: 1 },
  closed: { display: 'block' as const, opacity: 1 },
};

const labelVariants = {
  open: { x: 0, opacity: 1, transition: { x: { stiffness: 1000, velocity: -100 } } },
  closed: { x: -20, opacity: 0, transition: { x: { stiffness: 100 } } },
};

const transitionProps = {
  type: 'tween' as const,
  ease: 'easeOut' as const,
  duration: 0.2,
  staggerChildren: 0.1,
};

const staggerVariants = {
  open: { transition: { staggerChildren: 0.03, delayChildren: 0.02 } },
};

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/practice', label: 'Practice', icon: BookOpen },
  { to: '/mock-test', label: 'Mock Test', icon: ClipboardCheck },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/strategy-guide', label: 'Strategy', icon: Compass },
];

const bottomNavItems = [
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/activity', label: 'Activity', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [supportOpen, setSupportOpen] = useState(false);
  const location = useLocation();
  const xp = useAppStore((s) => s.xp);
  const strategyGuideCompleted = useAppStore((s) => s.strategyGuideCompleted);
  const { user, signOut, role } = useAuth();
  const level = useMemo(() => getLevelForXP(xp), [xp]);

  const allBottomItems = useMemo(() => {
    if (role === 'admin') {
      return [...bottomNavItems, { to: '/admin', label: 'Admin', icon: ShieldCheck }];
    }
    return bottomNavItems;
  }, [role]);

  const visibleNavItems = strategyGuideCompleted
    ? navItems
    : [{ to: '/strategy-guide', label: 'Strategy Guide', icon: Compass }];

  const visibleBottomItems = strategyGuideCompleted
    ? allBottomItems
    : [{ to: '/settings', label: 'Settings', icon: Settings }];

  return (
    <motion.div
      className="sidebar fixed left-0 z-40 h-full shrink-0"
      initial="closed"
      animate={isCollapsed ? 'closed' : 'open'}
      variants={sidebarVariants}
      transition={transitionProps}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <motion.div
        className="relative z-40 flex h-full shrink-0 flex-col bg-[#08090d] border-r border-white/[0.06]"
        variants={contentVariants}
      >
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          <div className="flex grow flex-col">
            {/* Logo */}
            <div className="flex h-[54px] w-full shrink-0 border-b border-white/[0.06] items-center px-2 gap-2">
              <img
                src={`${import.meta.env.BASE_URL}caliber-icon.png`}
                className="w-7 h-7 rounded shrink-0"
                alt="Caliber"
              />
              <motion.li variants={labelVariants} className="list-none flex-1">
                {!isCollapsed && (
                  <span className="text-white font-bold text-sm whitespace-nowrap">Caliber</span>
                )}
              </motion.li>
            </div>

            {/* XP pill */}
            <div className="px-2 pt-3 pb-1">
              <div className={cn(
                'flex items-center gap-2 rounded-lg px-2 py-1.5 bg-white/[0.04] border border-white/[0.06]',
                isCollapsed && 'justify-center',
              )}>
                <Sparkles className="h-4 w-4 shrink-0 text-[#e4c36e]" />
                <motion.li variants={labelVariants} className="list-none">
                  {!isCollapsed && (
                    <span className="text-xs font-medium text-white/60 whitespace-nowrap">
                      Lv.{level.level} &middot; {xp} XP
                    </span>
                  )}
                </motion.li>
              </div>
            </div>

            {/* Main nav */}
            <div className="flex grow flex-col overflow-y-auto p-2">
              <div className="flex w-full flex-col gap-0.5">
                {visibleNavItems.map((item) => {
                  const isActive = item.to === '/'
                    ? location.pathname === '/' || location.pathname === '/dashboard'
                    : location.pathname.startsWith(item.to);
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={cn(
                        'flex h-9 w-full items-center rounded-md px-2 py-1.5 transition-colors',
                        'text-white/50 hover:bg-white/[0.06] hover:text-white/80',
                        isActive && 'bg-[rgba(200,162,78,0.12)] text-[#e4c36e] hover:text-[#e4c36e]',
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <motion.li variants={labelVariants} className="list-none">
                        {!isCollapsed && (
                          <p className="ml-2 text-sm font-medium whitespace-nowrap">{item.label}</p>
                        )}
                      </motion.li>
                    </NavLink>
                  );
                })}
              </div>
            </div>

            {/* Bottom section */}
            <div className="flex flex-col p-2 border-t border-white/[0.06]">
              {visibleBottomItems.map((item) => {
                const isActive = location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex h-9 w-full items-center rounded-md px-2 py-1.5 transition-colors',
                      'text-white/50 hover:bg-white/[0.06] hover:text-white/80',
                      isActive && 'bg-[rgba(200,162,78,0.12)] text-[#e4c36e] hover:text-[#e4c36e]',
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <motion.li variants={labelVariants} className="list-none">
                      {!isCollapsed && (
                        <p className="ml-2 text-sm font-medium whitespace-nowrap">{item.label}</p>
                      )}
                    </motion.li>
                  </NavLink>
                );
              })}

              {/* Support */}
              <button
                onClick={() => setSupportOpen(true)}
                className="flex h-9 w-full items-center rounded-md px-2 py-1.5 transition-colors text-white/50 hover:bg-white/[0.06] hover:text-white/80"
              >
                <LifeBuoy className="h-4 w-4 shrink-0" />
                <motion.li variants={labelVariants} className="list-none">
                  {!isCollapsed && (
                    <p className="ml-2 text-sm font-medium whitespace-nowrap">Support</p>
                  )}
                </motion.li>
              </button>

              {/* Sign out */}
              {user && (
                <button
                  onClick={signOut}
                  className="flex h-9 w-full items-center rounded-md px-2 py-1.5 transition-colors text-white/50 hover:bg-white/[0.06] hover:text-white/80"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <motion.li variants={labelVariants} className="list-none">
                    {!isCollapsed && (
                      <p className="ml-2 text-sm font-medium whitespace-nowrap">Sign Out</p>
                    )}
                  </motion.li>
                </button>
              )}

              {/* User email */}
              {user && !isCollapsed && (
                <motion.div
                  variants={labelVariants}
                  className="px-2 pt-2 pb-1"
                >
                  <p className="text-[10px] text-white/30 truncate">{user.email}</p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.ul>
      </motion.div>
      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
    </motion.div>
  );
}
