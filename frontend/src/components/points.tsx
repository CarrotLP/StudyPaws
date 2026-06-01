import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '../constants/theme';

type PointsProps = {
  title?: string;
  points?: string;
  onPress?: () => void;
};

export function Points({
  title = 'Centered Title',
  points = '50 points',
  onPress,
}: PointsProps) {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <ThemedView type="backgroundSelected" style={styles.card}>
        {/* Text */}
        <ThemedText type="smallBold" style={styles.title}>
          {title}
        </ThemedText>
        {/* Text */}
        <ThemedText type="small" style={styles.title}>
          {points}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    width: '80%',
    padding: 20,
    borderRadius: Spacing.two,
    alignItems: 'center',
    gap: 16,
  },

  title: {
    textAlign: 'center',
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },

  button: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 10,
  },
});