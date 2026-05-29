import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';

import {
  Border,
  HavenColors,
  HavenFonts,
  HavenSpacing,
  PixelFontSize,
  ShadowOffset,
} from '@/constants/havenTheme';

/**
 * Gold-on-ink pill toast, pinned to the BOTTOM of the screen (clears the notch /
 * Dynamic Island). It sits a fixed gap above the ribbon tab bar — the bar
 * already pads for the bottom safe-area inset, so the toast clears the home
 * indicator without double-counting the inset. Enters by sliding up from below
 * (FadeInUp) and exits by sliding back down (FadeOutDown).
 */
export function Toast({ message }: { message: string }) {
  return (
    <Animated.View
      entering={FadeInUp.duration(280)}
      exiting={FadeOutDown.duration(220)}
      pointerEvents="none"
      style={styles.toast}>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: HavenSpacing.xl,
    alignSelf: 'center',
    zIndex: 150,
    backgroundColor: HavenColors.ink,
    borderWidth: Border.base,
    borderColor: HavenColors.gold,
    paddingVertical: HavenSpacing.md,
    paddingHorizontal: HavenSpacing.xl,
    boxShadow: `${ShadowOffset.four}px ${ShadowOffset.four}px 0px ${HavenColors.leatherShadow}`,
  },
  toastText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.md,
    color: HavenColors.gold,
  },
});
