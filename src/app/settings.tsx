import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Border,
  HavenColors,
  HavenFonts,
  HavenSpacing,
  PixelFontSize,
} from '@/constants/havenTheme';

// Settings chapter — replaces Buddies in the ribbon. Intentionally empty for now;
// content TBD. (The buddies screen/file is kept, just no longer surfaced.)
export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>settings</Text>
        <View style={styles.rule} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HavenColors.parchment,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: HavenSpacing.xxl,
    paddingTop: HavenSpacing.xl,
    paddingBottom: HavenSpacing.xxl,
    backgroundColor: HavenColors.parchment,
    gap: HavenSpacing.lg,
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
  },
});
