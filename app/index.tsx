import * as Device from 'expo-device';
import { Modal, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Points } from '@/components/points';
import { Popup } from '@/components/popup';
import { RecommendedActivities } from '@/components/recommended-activities';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useState } from 'react';

function getDevMenuHint() {
  if (Platform.OS === 'web') {
    return <ThemedText type="small">use browser devtools</ThemedText>;
  }
  if (Device.isDevice) {
    return (
      <ThemedText type="small">
        shake device or press <ThemedText type="code">m</ThemedText> in terminal
      </ThemedText>
    );
  }
  const shortcut = Platform.OS === 'android' ? 'cmd+m (or ctrl+m)' : 'cmd+d';
  return (
    <ThemedText type="small">
      press <ThemedText type="code">{shortcut}</ThemedText>
    </ThemedText>
  );
}


export default function HomeScreen() {

  const [showReadyToStudyPopup, setShowReadyToStudyPopup] = useState(false);
  const [showWellDonePoints, setShowWellDonePoints] = useState(false);

  return (
    <>
      {/* Ready to Study Popup Overlay */}
      <Modal visible={showReadyToStudyPopup} transparent animationType="fade">
        <ThemedView style={styles.overlay}>
          <Popup
            title="Ready to Study?"
            buttons={[
              {
                label: 'Yes!',
                onPress: () => setShowReadyToStudyPopup(false)
              },
              {
                label: 'Snooze\nlose 25%',
                onPress: () => setShowReadyToStudyPopup(false)
              },
            ]}
          />
        </ThemedView>
      </Modal>

      {/* Well Done Points Overlay 
          Press the overlay to dismiss for demo */}
      <Modal visible={showWellDonePoints} transparent animationType="fade">
        <ThemedView style={styles.overlay}>
          <Points
            title="Well Done!"
            points="45 points"
            onPress={() => setShowWellDonePoints(false)}
          />
        </ThemedView>
      </Modal>

      {/* MAIN SCROLL CONTENT */}
      <ScrollView>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.heroSection}>
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
          </ThemedView>

          {Platform.OS === 'web' && <WebBadge />}
        </SafeAreaView>
      </ThemedView>

      
      {/* Temporary button to trigger ready to study popup for prototype */}
      <ThemedText onPress={() => setShowReadyToStudyPopup(true)}>
        Open Popup
      </ThemedText>
      <ThemedText onPress={() => setShowWellDonePoints(true)}>
        Open Well Done Points
      </ThemedText>


      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.heroSection}>
            {/* <AnimatedIcon /> */}
            <ThemedText type="subtitle" style={styles.subtitle}>
              Some recommended activities...
            </ThemedText>

            <RecommendedActivities />

            {/* <HintRow
              title="Try editing"
              hint={<ThemedText type="code">src/app/index.tsx</ThemedText>}
            />
            <HintRow title="Dev tools" hint={getDevMenuHint()} />
            <HintRow
              title="Fresh start"
              hint={<ThemedText type="code">npm run reset-project</ThemedText>}
            /> */}

          </ThemedView>

          

          {/* <ThemedView type="backgroundElement" style={styles.stepContainer}>
            <HintRow
              title="Try editing"
              hint={<ThemedText type="code">src/app/index.tsx</ThemedText>}
            />
            <HintRow title="Dev tools" hint={getDevMenuHint()} />
            <HintRow
              title="Fresh start"
              hint={<ThemedText type="code">npm run reset-project</ThemedText>}
            />
          </ThemedView> */}

          {Platform.OS === 'web' && <WebBadge />}
        </SafeAreaView>
      </ThemedView>

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
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
});
