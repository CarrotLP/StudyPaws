import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ItemIcon } from '@/components/ItemIcon';
import { ALL_ITEMS, type Item } from '@/components/itemSprites';
import { PixelCat } from '@/components/PixelCat';
import {
    BodyFontSize,
    Border,
    Control,
    HavenColors,
    HavenFonts,
    HavenSpacing,
    PixelFontSize,
    PixelScale,
    ShadowOffset,
} from '@/constants/havenTheme';
import { useOutfit } from '@/hooks/use-outfit';

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function DressScreen() {
  const { owned, outfit, equip } = useOutfit();
  const items = ALL_ITEMS.filter((item) => owned.includes(item.id));
  const rows = chunk(items, 3);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>dress mochi</Text>
        <View style={styles.rule} />

        <View style={styles.catStage}>
          <PixelCat outfit={outfit} scale={PixelScale.catDress} />
          <View style={styles.floorShadow} />
        </View>

        {items.length === 0 ? (
          <Text style={styles.emptyMsg}>— nothing equipped yet —</Text>
        ) : (
          <View style={styles.grid}>
            {rows.map((row, ri) => (
              <View key={ri} style={styles.row}>
                {row.map((item) => (
                  <DressCell
                    key={item.id}
                    item={item}
                    active={outfit[item.slot] === item.id}
                    onPress={() => equip(item)}
                  />
                ))}
                {/* Pad the final row so cells keep a consistent width. */}
                {row.length < 3 &&
                  Array.from({ length: 3 - row.length }).map((_, i) => (
                    <View key={`spacer-${i}`} style={styles.spacer} />
                  ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DressCell({ item, active, onPress }: { item: Item; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.cell, active && styles.cellActive]}>
      <View style={styles.iconBox}>
        <ItemIcon id={item.id} scale={PixelScale.itemSmall} />
      </View>
      <Text style={styles.name}>{item.name}</Text>
      {active && (
        <View style={styles.wornBadge}>
          <Text style={styles.wornText}>worn</Text>
        </View>
      )}
    </Pressable>
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
    textAlign: 'center',
  },
  rule: {
    height: Border.thick,
    backgroundColor: HavenColors.ink,
  },

  catStage: {
    alignItems: 'center',
    paddingTop: HavenSpacing.base,
  },
  floorShadow: {
    width: '70%',
    height: HavenSpacing.base,
    marginTop: -HavenSpacing.base,
    borderRadius: HavenSpacing.base,
    backgroundColor: HavenColors.floorShadow,
  },

  emptyMsg: {
    textAlign: 'center',
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.md,
    color: HavenColors.inkSoft,
    paddingVertical: HavenSpacing.xxl,
  },

  grid: {
    gap: HavenSpacing.base,
  },
  row: {
    flexDirection: 'row',
    gap: HavenSpacing.base,
  },
  spacer: {
    flex: 1,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: HavenSpacing.xs,
    paddingVertical: HavenSpacing.md,
    paddingHorizontal: HavenSpacing.sm,
    backgroundColor: HavenColors.cellFill,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
    boxShadow: `${ShadowOffset.two}px ${ShadowOffset.two}px 0px ${HavenColors.parchmentShadow}`,
  },
  cellActive: {
    backgroundColor: HavenColors.wornCell,
    borderColor: HavenColors.ink,
  },
  iconBox: {
    width: Control.itemIconBox,
    height: Control.itemIconBox,
    alignItems: 'center',
    justifyContent: 'center',
    padding: HavenSpacing.xs,
    backgroundColor: HavenColors.cellInset,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
  },
  name: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.sm,
    color: HavenColors.ink,
    textAlign: 'center',
    lineHeight: PixelFontSize.sm * 1.4,
  },
  wornBadge: {
    position: 'absolute',
    top: HavenSpacing.xs,
    right: HavenSpacing.xs,
    backgroundColor: HavenColors.ink,
    paddingVertical: HavenSpacing.xxs,
    paddingHorizontal: HavenSpacing.xs,
  },
  wornText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.xs,
    color: HavenColors.gold,
  },
});
