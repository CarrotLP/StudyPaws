import { useEffect } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import {
    Border,
    Durations,
    HavenColors,
    HavenFonts,
    HavenSpacing,
    PixelFontSize,
    PixelScale,
    ShadowOffset,
} from '../constants/havenTheme';
import { Mochi } from './mochi';
import { ALL_ITEMS, type ItemId } from './itemSprites';
import { PixelChest } from './PixelChest';

export type ChestStage = 'opening' | 'reveal';

type ChestOpenOverlayProps = {
  visible: boolean;
  stage: ChestStage;
  chestColor: string;
  reward: { name: string; image: string } | null;
  onClaim: () => void;
};

export function ChestOpenOverlay({ visible, stage, chestColor, reward, onClaim }: ChestOpenOverlayProps) {
  const chestScale = useSharedValue(1);
  const itemScale = useSharedValue(0);
  const dots = useSharedValue(0.4);

  // Blinking dots during the "opening" stage.
  useEffect(() => {
    dots.value = withRepeat(
      withTiming(1, { duration: Durations.blink / 2, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [dots]);

  // glow-pulse on the chest + reveal-pop on the item when the reveal lands.
  useEffect(() => {
    if (stage === 'reveal') {
      chestScale.value = 0.8;
      chestScale.value = withSequence(
        withTiming(1.1, { duration: Durations.glowPulse / 2, easing: Easing.out(Easing.ease) }),
        withTiming(1.0, { duration: Durations.glowPulse / 2, easing: Easing.out(Easing.ease) }),
      );
      itemScale.value = 0;
      itemScale.value = withSequence(
        withTiming(1.15, { duration: Durations.revealPop * 0.6, easing: Easing.out(Easing.ease) }),
        withTiming(1.0, { duration: Durations.revealPop * 0.4, easing: Easing.out(Easing.ease) }),
      );
    } else {
      chestScale.value = 1;
      itemScale.value = 0;
    }
  }, [stage, chestScale, itemScale]);

  const chestStyle = useAnimatedStyle(() => ({ transform: [{ scale: chestScale.value }] }));
  const itemStyle = useAnimatedStyle(() => ({ transform: [{ scale: itemScale.value }] }));
  const dotsStyle = useAnimatedStyle(() => ({ opacity: dots.value }));

  const rewardName = reward?.name ?? '';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClaim}>
      <View style={styles.scrim}>
        <View style={styles.card}>
          {stage === 'opening' && (
            <>
              <View style={styles.chestPad}>
                <PixelChest color={chestColor} scale={PixelScale.chestOverlay} open={false} />
              </View>
              <Text style={styles.section}>opening...</Text>
              <Animated.Text style={[styles.dots, dotsStyle]}>. . .</Animated.Text>
            </>
          )}

          {stage === 'reveal' && (
            <>
              <Animated.View style={[styles.chestPad, styles.glow, chestStyle]}>
                <PixelChest color={chestColor} scale={PixelScale.chestOverlay} open />
              </Animated.View>
              <Text style={styles.section}>obtained!</Text>
              {reward && (
                <Animated.View style={[styles.revealItem, itemStyle]}>
                  <Image source={{ uri: reward.image }} style={{ width: 120, height: 120 }} />
                </Animated.View>
              )}
              <Text style={styles.itemName}>{rewardName}</Text>
              <Pressable
                onPress={onClaim}
                style={({ pressed }) => [styles.claimBtn, pressed && styles.claimBtnPressed]}>
                <Text style={styles.claimText}>claim</Text>
              </Pressable>
            </>
          )}
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
    backgroundColor: HavenColors.overlayScrim,
  },
  card: {
    alignItems: 'center',
    gap: HavenSpacing.lg,
    minWidth: 280,
    paddingVertical: HavenSpacing.xxl,
    paddingHorizontal: HavenSpacing.xxl,
    backgroundColor: HavenColors.parchment,
    borderWidth: Border.thick,
    borderColor: HavenColors.ink,
    boxShadow: `0px 0px 0px ${Border.base}px ${HavenColors.gold}, ${ShadowOffset.four}px ${ShadowOffset.four}px 0px ${HavenColors.leatherShadow}`,
  },
  chestPad: {
    padding: HavenSpacing.lg,
  },
  glow: {
    boxShadow: `0px 0px 16px ${HavenColors.gold}`,
  },
  section: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.xl,
    color: HavenColors.leather,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dots: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.dots,
    color: HavenColors.inkSoft,
    letterSpacing: 4,
  },
  revealItem: {
    padding: HavenSpacing.lg,
    backgroundColor: HavenColors.revealItem,
    borderWidth: Border.base,
    borderColor: HavenColors.gold,
  },
  itemName: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.title,
    color: HavenColors.ink,
  },
  claimBtn: {
    alignSelf: 'center',
    backgroundColor: HavenColors.leather,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
    paddingVertical: HavenSpacing.lg,
    paddingHorizontal: HavenSpacing.xxl,
    boxShadow: `${ShadowOffset.three}px ${ShadowOffset.three}px 0px ${HavenColors.leatherShadow}`,
  },
  claimBtnPressed: {
    transform: [{ translateX: ShadowOffset.two }, { translateY: ShadowOffset.two }],
    boxShadow: `${ShadowOffset.one}px ${ShadowOffset.one}px 0px ${HavenColors.leatherShadow}`,
  },
  claimText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.xl,
    color: HavenColors.gold,
    letterSpacing: 0.5,
  },
});
