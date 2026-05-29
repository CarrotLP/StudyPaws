import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BuddyAvatar } from '@/components/BuddyAvatar';
import {
  BodyFontSize,
  Border,
  HavenColors,
  HavenFonts,
  HavenSpacing,
  PixelFontSize,
  PixelScale,
  ShadowOffset,
} from '@/constants/havenTheme';

type Buddy = {
  name: string;
  pet: string;
  habits: number;
  fur: string;
  accent: string;
};

// Static demo data from the prototype's BUDDIES array, pre-sorted by habits.
// Ranking is habits-only — never points or items (hard rule 5).
const BUDDIES: Buddy[] = [
  { name: 'Mira', pet: 'Yuzu', habits: 21, fur: '#3A2418', accent: '#1A0F08' },
  { name: 'Sana', pet: 'Pickle', habits: 18, fur: '#E8E0CC', accent: '#C9C0A8' },
  { name: 'Jules', pet: 'Biscuit', habits: 12, fur: '#C9A684', accent: '#A88060' },
];

const RANKS = ['I', 'II', 'III'];

export default function BuddiesScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>buddies</Text>
        <View style={styles.rule} />

        <View style={styles.board}>
          {BUDDIES.map((buddy, i) => (
            <View key={buddy.name} style={styles.row}>
              <Text style={styles.rank}>{RANKS[i]}</Text>
              <View style={styles.avatar}>
                <BuddyAvatar fur={buddy.fur} accent={buddy.accent} scale={PixelScale.buddy} />
              </View>
              <View style={styles.mid}>
                <Text style={styles.name}>{buddy.pet}</Text>
                <Text style={styles.sub}>
                  {buddy.name} · {buddy.habits} habits
                </Text>
              </View>
              <Pressable style={({ pressed }) => [styles.visit, pressed && styles.visitPressed]}>
                <Text style={styles.visitText}>visit</Text>
              </Pressable>
            </View>
          ))}
        </View>
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
  },

  board: {
    gap: HavenSpacing.base,
    marginTop: HavenSpacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: HavenSpacing.md,
    backgroundColor: HavenColors.cellFill,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
    paddingVertical: HavenSpacing.base,
    paddingHorizontal: HavenSpacing.md,
    boxShadow: `${ShadowOffset.two}px ${ShadowOffset.two}px 0px ${HavenColors.parchmentShadow}`,
  },
  rank: {
    width: HavenSpacing.xxl,
    textAlign: 'center',
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.xxl,
    color: HavenColors.leather,
  },
  avatar: {
    padding: HavenSpacing.xs,
    backgroundColor: HavenColors.cellInset,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
  },
  mid: {
    flex: 1,
  },
  name: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.md,
    color: HavenColors.ink,
  },
  sub: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.sm,
    color: HavenColors.inkSoft,
    marginTop: HavenSpacing.xxs,
  },
  visit: {
    backgroundColor: HavenColors.leather,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
    paddingVertical: HavenSpacing.xs,
    paddingHorizontal: HavenSpacing.base,
    boxShadow: `${ShadowOffset.one}px ${ShadowOffset.one}px 0px ${HavenColors.leatherShadow}`,
  },
  visitPressed: {
    transform: [{ translateX: ShadowOffset.one }, { translateY: ShadowOffset.one }],
  },
  visitText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.sm,
    color: HavenColors.parchment,
  },
});
