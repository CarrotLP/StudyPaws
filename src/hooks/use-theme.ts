/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';

// Force the app to always use the light theme (white background, black text)
export function useTheme() {
  return Colors.light;
}
