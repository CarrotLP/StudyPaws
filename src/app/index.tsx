import { useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Points } from '@/components/points';
import { Popup } from '@/components/popup';
import { RecommendedActivities } from '@/components/recommended-activities';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

export default function HomeScreen() {
  const [showReadyToStudyPopup, setShowReadyToStudyPopup] = useState(false);
  const [showWellDonePoints, setShowWellDonePoints] = useState(false);

  return (
    <ThemedView type="background" style={{ flex: 1 }}>
      
      {/* OVERLAYS */}
      <Modal visible={showReadyToStudyPopup} transparent animationType="fade">
        <ThemedView style={styles.overlay}>
          <Popup
            title="Ready to Study?"
            buttons={[
              { label: 'Yes!', onPress: () => setShowReadyToStudyPopup(false) },
              { label: 'Snooze\nlose 25%', onPress: () => setShowReadyToStudyPopup(false) },
            ]}
          />
        </ThemedView>
      </Modal>

      <Modal visible={showWellDonePoints} transparent animationType="fade">
        <ThemedView style={styles.overlay}>
          <Points
            title="Well Done!"
            points="45 points"
            onPress={() => setShowWellDonePoints(false)}
          />
        </ThemedView>
      </Modal>

      {/* MAIN CONTENT */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
  <View style={styles.container}>
    <SafeAreaView style={styles.safeArea}>

      {/* HERO SECTION */}
      <View style={styles.section}>
        <View style={styles.heroSection}>
          <ThemedText type="title" style={styles.title}>
            Break Time!
          </ThemedText>

          <ThemedText type="code" style={styles.code}>
            You have
          </ThemedText>

          <ThemedText type="subtitle" style={styles.time}>
            5:46
          </ThemedText>

          <ThemedText type="code" style={styles.code}>
            left of break
          </ThemedText>
        </View>
      </View>

      {Platform.OS === 'web' && <WebBadge />}

      {/* ACTIONS SECTION */}
      <View style={styles.subtleSection}>
        <ThemedText
          onPress={() => setShowReadyToStudyPopup(true)}
          style={styles.actionText}
        >
          Open Popup
        </ThemedText>

        <ThemedText
          onPress={() => setShowWellDonePoints(true)}
          style={styles.actionText}
        >
          Open Well Done Points
        </ThemedText>
      </View>

      {/* ACTIVITIES SECTION */}
      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.subtitle}>
          Some recommended activities...
        </ThemedText>

        <RecommendedActivities />
      </View>

    </SafeAreaView>
  </View>
</ScrollView>

    </ThemedView>
  );
}
const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  section: {
    width: '100%',
    marginBottom: Spacing.six,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  code: {
    textAlign: 'center'
  },
  subtitle: {
    textAlign: 'center',
  },
  time: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // dim background
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  actionText: {
    fontSize: 11,
    marginBottom: Spacing.one,
    textAlign: 'center',
  },
  subtleSection: {
    width: '100%',
    marginBottom: Spacing.four,   // smaller than other sections
    opacity: 0.4,                // key: de-emphasis
    alignItems: 'center',
  },
});
