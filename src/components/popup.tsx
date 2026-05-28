import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

type PopupProps = {
  title?: string;
  buttons?: {
    label: any;
    onPress?: () => void;
  }[];
};

export function Popup({
  title = 'Centered Title',
  buttons = [],
}: PopupProps) {
  return (
    <View style={styles.container}>
      <ThemedView type="backgroundSelected" style={styles.card}>
        {/* Text */}
        <ThemedText type="small" style={styles.title}>
          {title}
        </ThemedText>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          {buttons.map((btn, index) => (
            <Pressable
              key={index}
              onPress={btn.onPress}
              style={styles.button}>
              <ThemedText>{btn.label}</ThemedText>
            </Pressable>
          ))}
        </View>
      </ThemedView>
    </View>
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