import { Pressable, StyleSheet, Text } from 'react-native';

/**
 * DEV/DEMO affordance on Inventory — intentionally NOT themed, matching the
 * other dev buttons (plain white circle, black border). Positioned bottom-LEFT
 * so it can't be confused with the bottom-right +100 points button on Treasure.
 * Uses a "↺" glyph. Colours/sizes are hardcoded on purpose; not design tokens.
 */
export function DevResetButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityLabel="dev: reset to defaults"
      style={({ pressed }) => [styles.btn, pressed && styles.btnActive]}>
      <Text style={styles.glyph}>↺</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    bottom: 8,
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
