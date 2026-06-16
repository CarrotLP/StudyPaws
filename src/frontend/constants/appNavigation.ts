export type AppMenuItem = {
  id: string;
  href: string;
  label: string;
  title: string;
  // MaterialCommunityIcons glyph name shown to the right of the label.
  icon: string;
};

export const APP_MENU_ITEMS: AppMenuItem[] = [
  { id: 'index', href: '/', label: 'Study', title: 'Study', icon: 'pencil' },
  { id: 'daily_quest', href: '/daily_quest', label: 'Daily quest', title: 'Daily quest', icon: 'script-text' },
  { id: 'teams', href: '/teams', label: 'Team', title: 'Team', icon: 'account-multiple' },
  { id: 'community', href: '/community', label: 'Community', title: 'Community', icon: 'account-group' },
  { id: 'dress', href: '/dress', label: 'Dress Your Pet', title: 'Dress Your Pet', icon: 'cat' },
  { id: 'treasure', href: '/treasure', label: 'Treasure chest', title: 'Treasure chest', icon: 'treasure-chest' },
  { id: 'settings', href: '/settings', label: 'Settings', title: 'Settings', icon: 'cog' },
];
