import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  BodyFontSize,
  Border,
  HavenColors,
  HavenFonts,
  HavenSpacing,
  PixelFontSize,
  ShadowOffset,
} from '@/constants/havenTheme';
import { dailyQuest, saveDailyQuestPhoto } from '@/lib/daily-quest';

type DailyQuestOverlayProps = {
  visible: boolean;
  /** Called when the user backs out (top-left X) WITHOUT completing the quest. */
  onCancel: () => void;
  /** Called when the user closes the congratulations card (top-right X)
   *  AFTER the photo was captured — this is what marks the habit done. */
  onComplete: () => void;
};

export function DailyQuestOverlay({ visible, onCancel, onComplete }: DailyQuestOverlayProps) {
  const [completed, setCompleted] = useState(false);
  const [takingPhoto, setTakingPhoto] = useState(false);

  // Reset internal state when the overlay closes so reopening starts fresh.
  useEffect(() => {
    if (!visible) {
      setCompleted(false);
      setTakingPhoto(false);
    }
  }, [visible]);

  // We're not using <Modal>, so wire Android's back button manually.
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (completed) onComplete();
      else onCancel();
      return true;
    });
    return () => sub.remove();
  }, [visible, completed, onCancel, onComplete]);

  const takePhoto = async () => {
    try {
      setTakingPhoto(true);
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera permission needed', 'Allow camera access to complete this daily quest.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (result.canceled) return;
      const photoUri = result.assets[0]?.uri;
      if (!photoUri) {
        Alert.alert('Photo unavailable', 'The captured photo could not be read. Please try again.');
        return;
      }
      await saveDailyQuestPhoto(photoUri);
      setCompleted(true);
    } catch {
      Alert.alert('Camera unavailable', 'The camera could not be opened. Please try again.');
    } finally {
      setTakingPhoto(false);
    }
  };

  // Plain absolute <View> rather than <Modal>: on iOS, presenting the camera
  // (UIImagePickerController) from inside an RN <Modal> — itself a separate
  // UIViewController — causes a stack collision that hard-crashes the app the
  // moment "Take photo" is tapped. A regular View lets the camera present over
  // the normal RN view tree with no conflict.
  if (!visible) return null;
  return (
    <View style={styles.scrim} pointerEvents="auto">
      <View style={styles.card}>
        {completed ? (
          <>
            {/* Top-RIGHT X — closes the congrats popup AND marks the quest complete. */}
            <Pressable
              accessibilityLabel="Close congratulations"
              hitSlop={HavenSpacing.md}
              onPress={onComplete}
              style={[styles.closeButton, styles.closeRight]}>
              <Text style={styles.closeText}>X</Text>
            </Pressable>
            <Text style={styles.title}>Quest Complete</Text>
            <Text style={styles.description}>
              Congratulations, you've completed your daily quest!
            </Text>
          </>
        ) : (
          <>
            {/* Top-LEFT X — cancels without marking the quest complete. */}
            <Pressable
              accessibilityLabel="Close daily quest"
              hitSlop={HavenSpacing.md}
              onPress={onCancel}
              style={[styles.closeButton, styles.closeLeft]}>
              <Text style={styles.closeText}>X</Text>
            </Pressable>
            <Text style={styles.title}>{dailyQuest.title}</Text>
            <Text style={styles.description}>{dailyQuest.description}</Text>
            <Pressable
              accessibilityLabel="Take photo"
              disabled={takingPhoto}
              onPress={takePhoto}
              style={({ pressed }) => [
                styles.cameraButton,
                pressed && styles.buttonPressed,
                takingPhoto && styles.buttonDisabled,
              ]}>
              {/* Inline pixel-art-style camera glyph — matches Haven's aesthetic
                  without pulling in an icon font. */}
              <View accessibilityElementsHidden style={styles.cameraIcon}>
                <View style={styles.cameraBump} />
                <View style={styles.cameraLens} />
              </View>
              <Text style={styles.cameraText}>{takingPhoto ? 'Opening camera...' : 'Take photo'}</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
    alignItems: 'center',
    justifyContent: 'center',
    padding: HavenSpacing.xxl,
    backgroundColor: HavenColors.overlayScrim,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: HavenSpacing.xl,
    padding: HavenSpacing.xxl,
    backgroundColor: HavenColors.parchment,
    borderWidth: Border.frame,
    borderColor: HavenColors.ink,
    boxShadow: `${ShadowOffset.four}px ${ShadowOffset.four}px 0px ${HavenColors.leatherShadow}`,
  },
  closeButton: {
    position: 'absolute',
    top: HavenSpacing.md,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HavenColors.ink,
    borderWidth: Border.base,
    borderColor: HavenColors.gold,
  },
  closeLeft: {
    left: HavenSpacing.md,
  },
  closeRight: {
    right: HavenSpacing.md,
  },
  closeText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.lg,
    color: HavenColors.gold,
  },
  title: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.xl,
    color: HavenColors.leather,
    lineHeight: PixelFontSize.xl * 1.8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  description: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.xl,
    color: HavenColors.ink,
    lineHeight: BodyFontSize.xl * 1.3,
    textAlign: 'center',
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: HavenSpacing.base,
    paddingVertical: HavenSpacing.md,
    paddingHorizontal: HavenSpacing.xl,
    backgroundColor: HavenColors.leather,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
    boxShadow: `${ShadowOffset.three}px ${ShadowOffset.three}px 0px ${HavenColors.leatherShadow}`,
  },
  cameraIcon: {
    width: 22,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: Border.base,
    borderColor: HavenColors.gold,
  },
  cameraBump: {
    position: 'absolute',
    top: -5,
    width: 9,
    height: 5,
    borderWidth: Border.base,
    borderBottomWidth: 0,
    borderColor: HavenColors.gold,
  },
  cameraLens: {
    width: 7,
    height: 7,
    borderWidth: Border.base,
    borderColor: HavenColors.gold,
  },
  cameraText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.md,
    color: HavenColors.gold,
    textTransform: 'uppercase',
  },
  buttonPressed: {
    transform: [{ translateX: ShadowOffset.two }, { translateY: ShadowOffset.two }],
    boxShadow: `${ShadowOffset.one}px ${ShadowOffset.one}px 0px ${HavenColors.leatherShadow}`,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
