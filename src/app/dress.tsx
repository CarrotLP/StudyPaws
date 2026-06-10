import { useState, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { Mochi } from '@/components/mochi';
import {
    BodyFontSize,
    Border,
    Control,
    HavenColors,
    HavenFonts,
    HavenSpacing,
    PixelFontSize,
    ShadowOffset,
} from '@/constants/havenTheme';
import { useAuth } from '@/frontend/hooks/use-auth';
import { getUserAccessories, toggleAccessory, type UserAccessory } from '@/backend/services/accessory.services';

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function DressScreen() {
  const { user } = useAuth();
  const [accessories, setAccessories] = useState<UserAccessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchAccessories = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getUserAccessories(user.id);
      setAccessories(data);
    } catch (err) {
      console.error('Error fetching accessories:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchAccessories();
      setRefreshKey(prev => prev + 1);
    }, [fetchAccessories])
  );

  const onEquip = async (item: UserAccessory) => {
    if (!user) return;
    const equipping = !item.chosen;
    try {
      // Mutual exclusion: when putting something on, take off anything already
      // worn in the SAME category (only one item per category at a time).
      if (equipping && item.category) {
        const sameCategoryWorn = accessories.filter(
          (a) => a.chosen && a.category === item.category && a.accessory !== item.accessory,
        );
        for (const worn of sameCategoryWorn) {
          await toggleAccessory(user.id, worn.accessory, false);
        }
      }

      await toggleAccessory(user.id, item.accessory, equipping);
      await fetchAccessories();
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Error toggling accessory:', err);
    }
  };

  const rows = chunk(accessories, 3);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>dress mochi</Text>
        <View style={styles.rule} />

        <View style={styles.catStage}>
          <Mochi key={refreshKey} scale={2} />
          <View style={styles.floorShadow} />
        </View>

        {loading ? (
          <ActivityIndicator color={HavenColors.ink} style={{ marginTop: HavenSpacing.xxl }} />
        ) : accessories.length === 0 ? (
          <Text style={styles.emptyMsg}>— nothing owned yet —</Text>
        ) : (
          <View style={styles.grid}>
            {rows.map((row, ri) => (
              <View key={ri} style={styles.row}>
                {row.map((item) => (
                  <DressCell
                    key={item.accessory}
                    item={item}
                    active={item.chosen}
                    onPress={() => onEquip(item)}
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

function DressCell({ item, active, onPress }: { item: UserAccessory; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.cell, active && styles.cellActive]}>
      <View style={styles.iconBox}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.accessoryImage} />
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
      <Text style={styles.name}>{item.accessory}</Text>
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
    marginTop: HavenSpacing.base,
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
    width: Control.itemIconBox * 1.5,
    height: Control.itemIconBox * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: HavenSpacing.xs,
    backgroundColor: HavenColors.cellInset,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
  },
  accessoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  placeholder: {
    width: '80%',
    height: '80%',
    backgroundColor: HavenColors.inkSoft,
    opacity: 0.2,
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
