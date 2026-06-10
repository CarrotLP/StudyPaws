export type AppMenuItem = {
  id: string;
  href: string;
  label: string;
  title: string;
};

export const APP_MENU_ITEMS: AppMenuItem[] = [
  { id: 'index', href: '/', label: 'Study', title: 'Study' },
  { id: 'daily_quest', href: '/daily_quest', label: 'Daily quest', title: 'Daily quest' },
  { id: 'teams', href: '/teams', label: 'Team', title: 'Team' },
  { id: 'community', href: '/community', label: 'Community', title: 'Community' },
  { id: 'dress', href: '/dress', label: 'Dress mochi', title: 'Dress mochi' },
  { id: 'treasure', href: '/treasure', label: 'Treasure chest', title: 'Treasure chest' },
  { id: 'settings', href: '/settings', label: 'Settings', title: 'Settings' },
];
