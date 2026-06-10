import { Pressable, StyleSheet, Text } from 'react-native';

/**
 * DEV button to remove the 'crown' accessory from the database.
 */
export function DevRemoveCrownButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityLabel="dev: remove crown"
      style={({ pressed }) => [styles.btn, pressed && styles.btnActive]}>
      <Text style={styles.glyph}>X</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    bottom: 70,
    right: 48, // Shifted left from DevAddPointsButton
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFCCCC',
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
    fontWeight: 'bold',
    color: '#CC0000',
  },
});
