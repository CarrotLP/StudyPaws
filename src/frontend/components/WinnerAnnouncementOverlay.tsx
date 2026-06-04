import { useEffect, useState } from 'react';
import { AppState, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  BodyFontSize,
  Border,
  HavenColors,
  HavenFonts,
  HavenSpacing,
  PixelFontSize,
  ShadowOffset,
} from '@/constants/havenTheme';
import { QUEST_WINDOWS, isWithinWindow } from '@/constants/questWindows';
import { getWinnerItems, type WinnerOutput } from '@/services/winner.services';

export function WinnerAnnouncementOverlay() {
  const [visible, setVisible] = useState(false);
  const [winner, setWinner] = useState<WinnerOutput | null>(null);

  useEffect(() => {
    const showWinnerAfterVoting = () => {
      if (!isWithinWindow(QUEST_WINDOWS.submission)) {
        return;
      }

      getWinnerItems()
        .then((result) => {
          setWinner(result);
          setVisible(true);
        })
        .catch(() => setWinner(null));
    };

    showWinnerAfterVoting();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        showWinnerAfterVoting();
      }
    });

    return () => subscription.remove();
  }, []);

  if (!winner) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => setVisible(false)}>
      <View style={styles.scrim}>
        <View style={styles.wrapper}>
          <Pressable
            accessibilityLabel="Close winner announcement"
            style={styles.closeButton}
            onPress={() => setVisible(false)}>
            <Text style={styles.closeText}>X</Text>
          </Pressable>

          <View style={styles.card}>
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>
                The winner is: {winner.winnerName}
              </Text>

              <Image
                source={{ uri: winner.winnerPhotoUri }}
                style={styles.photo}
                resizeMode="cover"
              />

              <Text style={styles.explanation}>{winner.questExplanation}</Text>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: HavenSpacing.xxl,
    backgroundColor: HavenColors.overlayScrim,
  },
  wrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
  },
  closeButton: {
    position: 'absolute',
    top: -14,
    right: -10,
    zIndex: 1,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HavenColors.ink,
    borderWidth: Border.base,
    borderColor: HavenColors.gold,
  },
  closeText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.lg,
    color: HavenColors.gold,
  },
  card: {
    maxHeight: '100%',
    backgroundColor: HavenColors.parchment,
    borderWidth: Border.frame,
    borderColor: HavenColors.ink,
    boxShadow: `${ShadowOffset.four}px ${ShadowOffset.four}px 0px ${HavenColors.leatherShadow}`,
  },
  content: {
    alignItems: 'center',
    gap: HavenSpacing.lg,
    padding: HavenSpacing.xl,
  },
  title: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.lg,
    color: HavenColors.leather,
    textAlign: 'center',
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: HavenColors.cellInset,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
  },
  explanation: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.lg,
    lineHeight: BodyFontSize.lg * 1.4,
    color: HavenColors.ink,
    textAlign: 'center',
  },
});
