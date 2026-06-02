import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { Points } from '@/components/points';
import { Popup } from '@/components/popup';
import { RecommendedActivities } from '@/components/recommended-activities';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type BreaktimeProps = {
  hideActions?: boolean;
};

export function Breaktime({ hideActions = false }: BreaktimeProps) {
  const [showReadyPopup, setShowReadyPopup] = useState(false);
  const [showWellDonePoints, setShowWellDonePoints] = useState(false);

  return (
    <View style={styles.container}>
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

      {!hideActions && (
        <>
          <View style={styles.actions}> 
            <View style={styles.actionButton}>
              <ThemedText style={styles.actionText}>Ready to take a break?</ThemedText>
            </View>

            <View style={styles.actionButton}>
              <ThemedText style={styles.actionText}>Well done! +60 points</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.subtitle}>
              Some recommended activities...
            </ThemedText>
            <RecommendedActivities />
          </View>
        </>
      )}

      <Modal visible={showReadyPopup} transparent animationType="fade">
        <ThemedView style={styles.overlay}>
          <Popup
            title="Ready to take a break?"
            objects={[
              { label: 'Yes!' },
              { label: '5 minutes to finish' },
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
    </View>
  );
}

const styles = StyleSheet.create({
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
    gap: Spacing.three,
    alignItems: 'stretch',
    flexDirection: 'column',
  },
  actionButton: {
    width: '100%',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  actionText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
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