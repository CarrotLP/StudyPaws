import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Points } from '@/components/points';
import { Popup } from '@/components/popup';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';


export default function BreaktimeScreen() {
  const router = useRouter();
  const [showReadyPopup, setShowReadyPopup] = useState(false);
  const [showWellDonePoints, setShowWellDonePoints] = useState(false);

  return (
    <Pressable style={{ flex: 1 }} onPress={() => router.push('/breaktime')}>
      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scroll}>
        <ThemedView type="background" style={styles.safeArea}>
            <View style={styles.heroSection}>
              <ThemedText type="title" style={styles.title}>
                Study Time!
              </ThemedText>

              <ThemedText type="subtitle" style={styles.time}>
                5:46
              </ThemedText>

              <ThemedText type="subtitle" style={styles.code}>
                Finish this and get 10 points!
              </ThemedText>
            </View>

            {(
              <>
                <View style={styles.actions}> 
                  <Pressable onPress={() => setShowReadyPopup(true)} style={styles.actionButton}>
                    <ThemedText style={styles.actionText}>.</ThemedText>
                  </Pressable>

                  <Pressable onPress={() => setShowWellDonePoints(true)} style={styles.actionButton}>
                    <ThemedText style={styles.actionText}>.</ThemedText>
                  </Pressable>
                </View>
              </>
            )}

            <Modal visible={showReadyPopup} transparent animationType="fade">
              <ThemedView style={styles.overlay}>
                <Popup
                  title="Ready to take a break?"
                  buttons={[
                    { label: 'Yes!', onPress: () => setShowReadyPopup(false) },
                    { label: '5 minutes to finish', onPress: () => setShowReadyPopup(false) },
                  ]}
                />
              </ThemedView>
            </Modal>

            <Modal visible={showWellDonePoints} transparent animationType="fade">
              <ThemedView style={styles.overlay}>
                <Points
                  title="Well Done!"
                  points="+60 points"
                  onPress={() => setShowWellDonePoints(false)}
                />
              </ThemedView>
            </Modal>
        </ThemedView>
      </ScrollView>
    </Pressable>
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
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    paddingTop: Spacing.six,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    gap: Spacing.four,
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  code: {
    textAlign: 'center',
  },
  time: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  actionText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    width: '100%',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});