import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ItemIcon } from '@/components/ItemIcon';
import { ALL_ITEMS } from '@/components/itemSprites';
import {
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

export default function InventoryScreen() {
  const { owned, outfit, equip } = useOutfit();
  const rows = chunk(ALL_ITEMS, 3);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>inventory</Text>
        <View style={styles.rule} />

        <View style={styles.grid}>
          {rows.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map((item) => {
                const isOwned = owned.includes(item.id);
                const isWorn = isOwned && outfit[item.slot] === item.id;
                return (
                  <Pressable
                    key={item.id}
                    disabled={!isOwned}
                    onPress={() => equip(item)}
                    style={[styles.cell, !isOwned && styles.cellLocked, isWorn && styles.cellWorn]}>
                    <View style={[styles.iconBox, !isOwned && styles.iconBoxLocked]}>
                      <ItemIcon id={item.id} scale={PixelScale.itemSmall} silhouette={!isOwned} />
                    </View>
                    <Text style={[styles.name, !isOwned && styles.nameLocked]}>
                      {isOwned ? item.name : '?????'}
                    </Text>
                    {isWorn && (
                      <View style={styles.wornBadge}>
                        <Text style={styles.wornText}>worn</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
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
  grid: {
    gap: HavenSpacing.base,
    marginTop: HavenSpacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: HavenSpacing.base,
  },
  cell: {
    flex: 1,
    minHeight: Control.itemCellMinHeight,
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
  cellLocked: {
    backgroundColor: HavenColors.lockedCell,
  },
  cellWorn: {
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
  iconBoxLocked: {
    backgroundColor: HavenColors.lockedIcon,
    borderColor: HavenColors.ink,
  },
  name: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.sm,
    color: HavenColors.ink,
    textAlign: 'center',
    lineHeight: PixelFontSize.sm * 1.4,
  },
  nameLocked: {
    color: HavenColors.inkSoft,
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
