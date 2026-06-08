import { Pressable, StyleSheet, Text } from 'react-native';

/**
 * DEV/DEMO affordance — intentionally NOT themed. Plain white circle with a
 * black border so it reads as obviously out-of-place against the pixel-art
 * aesthetic (a marker should be able to tell it's a dev tool). Colours/sizes
 * are hardcoded on purpose; do not swap these for design tokens.
 */
export function DevSkipButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityLabel="dev: skip timer"
      style={({ pressed }) => [styles.btn, pressed && styles.btnActive]}>
      <Text style={styles.glyph}>○</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    bottom: 56,
    left: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    opacity: 0.65,
    boxShadow: '0px 2px 4px rgba(0,0,0,0.5)',
    zIndex: 250,
  },
  btnActive: {
    opacity: 1,
  },
  glyph: {
    fontSize: 12,
    color: '#000000',
  },
});
