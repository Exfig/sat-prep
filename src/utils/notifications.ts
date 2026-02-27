export interface AppNotification {
  id: string;
  title: string;
  description: string;
  icon: string;
  actionLabel?: string;
  actionRoute?: string;
}

// Condition functions take a minimal state slice
interface NotifState {
  psatScores: unknown | null;
  mockTestHistory: unknown[];
  strategyGuideCompleted: boolean;
  themeMode: 'dark' | 'light';
}

interface NotifDef extends AppNotification {
  condition: (state: NotifState) => boolean;
}

export const NOTIFICATION_DEFINITIONS: NotifDef[] = [
  {
    id: 'psat-import',
    title: 'Import your PSAT scores',
    description: 'Upload your PSAT/NMSQT score report for personalized study recommendations.',
    icon: '\u{1F4CA}',
    actionLabel: 'Go to Settings',
    actionRoute: '/settings',
    condition: (s) => s.psatScores === null,
  },
  {
    id: 'light-mode-hint',
    title: 'Too dark?',
    description: 'Switch to light mode in Settings.',
    icon: '\u2600\uFE0F',
    actionLabel: 'Go to Settings',
    actionRoute: '/settings',
    condition: (s) => s.themeMode === 'dark',
  },
  {
    id: 'first-mock',
    title: 'Take a practice test',
    description: 'Simulate the real SAT experience with a full-length mock test.',
    icon: '\u{1F4DD}',
    actionLabel: 'Start Mock Test',
    actionRoute: '/mock-test',
    condition: (s) => s.mockTestHistory.length === 0 && s.strategyGuideCompleted,
  },
];

export function getActiveNotifications(
  state: NotifState,
  dismissedIds: string[],
): AppNotification[] {
  return NOTIFICATION_DEFINITIONS
    .filter((n) => n.condition(state) && !dismissedIds.includes(n.id))
    .map((n) => ({ id: n.id, title: n.title, description: n.description, icon: n.icon, actionLabel: n.actionLabel, actionRoute: n.actionRoute }));
}
