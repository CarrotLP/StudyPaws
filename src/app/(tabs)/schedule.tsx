import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function ScheduleScreen() {
  const router = useRouter();
  const [showStudyBreakBlock, setShowStudyBreakBlock] = useState(false);
  const [showStudyBlock, setShowStudyBlock] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scroll}>
      <ThemedView type="background" style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            Schedule
          </ThemedText>
        </View>

        <View style={styles.content}>
          {showStudyBreakBlock && (
            <ThemedView type="backgroundSelected" style={styles.blockCard}>
              <ThemedText style={styles.blockLabel}>Study</ThemedText>
              <View style={styles.row}>
                <TextInput placeholder="TextBox" style={styles.input} defaultValue="HH" />
                <TextInput placeholder="TextBox" style={styles.input} defaultValue="MM" />
                <TextInput placeholder="TextBox" style={styles.input} defaultValue="SS" />
              </View>

              <ThemedText style={styles.blockLabel}>Break</ThemedText>
              <View style={styles.row}>
                <TextInput placeholder="TextBox" style={styles.input} defaultValue="HH" />
                <TextInput placeholder="TextBox" style={styles.input} defaultValue="MM" />
                <TextInput placeholder="TextBox" style={styles.input} defaultValue="SS" />
              </View>
            </ThemedView>
          )}

          {showStudyBlock && (
            <ThemedView type="backgroundSelected" style={styles.blockCard}>
              <ThemedText style={styles.blockLabel}>Study</ThemedText>
              <View style={styles.row}>
                <TextInput placeholder="TextBox" style={styles.input} defaultValue="HH" />
                <TextInput placeholder="TextBox" style={styles.input} defaultValue="MM" />
                <TextInput placeholder="TextBox" style={styles.input} defaultValue="SS" />
              </View>
            </ThemedView>
          )}

          <Pressable
            style={styles.primaryButton}
            onPress={() => setShowStudyBreakBlock((value) => !value)}
          >
            <ThemedText style={styles.buttonText}>Add Study and Break Block</ThemedText>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => setShowStudyBlock((value) => !value)}>
            <ThemedText style={styles.secondaryButtonText}>Add Study Block</ThemedText>
          </Pressable>

          <View style={styles.gap} />

          <Pressable style={styles.startButton} onPress={() => router.push('/studytime')}>
            <ThemedText style={styles.buttonText}>Start Study</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
  },
  header: {
    width: '100%',
  },
  title: {
    textAlign: 'left',
  },
  content: {
    flex: 1,
    width: '100%',
    gap: Spacing.four,
    paddingTop: Spacing.four,
  },
  blockCard: {
    width: '100%',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.three,
  },
  blockLabel: {
    fontWeight: '700',
    fontSize: 18,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#000',
    fontWeight: '700',
  },
  startButton: {
    backgroundColor: '#007AFF',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: '700',
  },
  gap: {
    height: Spacing.four,
  },
});
