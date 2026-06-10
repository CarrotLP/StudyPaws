import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DevResetButton } from '@/components/DevResetButton';
import { Mochi } from '@/components/mochi';
import { Toast } from '@/components/Toast';
import {
    Border,
    Durations,
    HavenColors,
    HavenFonts,
    HavenSpacing,
    PixelFontSize,
    ShadowOffset,
} from '@/constants/havenTheme';
import { useOutfit } from '@/hooks/use-outfit';
import { useResetToDefaults } from '@/hooks/use-reset-to-defaults';

export default function InventoryScreen() {
  const { outfit } = useOutfit();
  const resetToDefaults = useResetToDefaults();

  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const onReset = () => {
    resetToDefaults();
    setToast({ msg: 'Reset to defaults · history preserved', key: Date.now() });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), Durations.toastVisible);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {toast && <Toast key={toast.key} message={toast.msg} />}

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>inventory</Text>
        <View style={styles.rule} />

        {/* Character Preview with Mochi PNGs */}
        <View style={styles.previewStage}>
          <Mochi outfit={outfit as any} scale={2} />
          <View style={styles.floorShadow} />
        </View>
      </ScrollView>

      <DevResetButton onPress={onReset} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HavenColors.parchment,
  },
  content: {
    paddingHorizontal: HavenSpacing.xxl,
    paddingTop: HavenSpacing.xl,
    paddingBottom: HavenSpacing.xxl,
    gap: HavenSpacing.md,
  },
  section: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.xl,
    color: HavenColors.leather,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  rule: {
    height: Border.thick,
    backgroundColor: HavenColors.ink,
    marginBottom: HavenSpacing.md, // Add spacing below the rule
  },
  previewStage: {
    alignItems: 'center',
    paddingVertical: HavenSpacing.lg,
    backgroundColor: HavenColors.cellFill,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
    marginBottom: HavenSpacing.md, // Ensure spacing below the preview stage
  },
  floorShadow: {
    width: 80,
    height: 8,
    borderRadius: 4,
    backgroundColor: HavenColors.floorShadow,
    marginTop: -4,
  },
});
