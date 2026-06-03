import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChestOpenOverlay, type ChestStage } from '@/components/ChestOpenOverlay';
import { DevAddPointsButton } from '@/components/DevAddPointsButton';
import { ItemIcon } from '@/components/ItemIcon';
import { Toast } from '@/components/Toast';
import { ALL_ITEMS, type ItemId } from '@/components/itemSprites';
import { PixelChest } from '@/components/PixelChest';
import {
  BodyFontSize,
  Border,
  ChestColors,
  Durations,
  HavenColors,
  HabitColors,
  HavenFonts,
  HavenSpacing,
  PixelFontSize,
  PixelScale,
  ShadowOffset,
} from '@/constants/havenTheme';
import { useEconomy } from '@/hooks/use-economy';
import { useOutfit } from '@/hooks/use-outfit';
import { type ChestId } from '@/lib/haven-storage';

type Chest = {
  id: ChestId;
  name: string;
  cost: number;
  color: string;
  pool: ItemId[];
};

// Defined in the prototype's CHESTS array. The pool is fully visible (hard rule 2).
const CHESTS: Chest[] = [
  { id: 'small', name: 'Small Chest', cost: 100, color: ChestColors.small, pool: ['scarf', 'bowtie', 'glasses', 'bandana'] },
  { id: 'ornate', name: 'Ornate Chest', cost: 250, color: ChestColors.ornate, pool: ['beret', 'flower', 'sweater', 'monocle', 'crown'] },
];

const DUPLICATE_REFUND = 25;

type Opening = { chest: Chest; stage: ChestStage; reward: ItemId };

export default function TreasureScreen() {
  const { points, chests, addPoints, addChest } = useEconomy();
  const { owned, addOwned } = useOutfit();

  const [opening, setOpening] = useState<Opening | null>(null);
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null);

  const stageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (stageTimer.current) clearTimeout(stageTimer.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = (msg: string) => {
    setToast({ msg, key: Date.now() });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), Durations.toastVisible);
  };

  const openChest = (chest: Chest, source: 'earned' | 'purchase') => {
    if (opening) return;
    if (source === 'earned') {
      if ((chests[chest.id] ?? 0) <= 0) return;
      addChest(chest.id, -1);
    } else {
      if (points < chest.cost) return;
      addPoints(-chest.cost);
    }

    // Roll: prefer unowned items; only fall back to the full pool if the user
    // already owns everything in it. Uniform pick — no weighting (hard rule 2).
    const unowned = chest.pool.filter((id) => !owned.includes(id));
    const pickFrom = unowned.length ? unowned : chest.pool;
    const reward = pickFrom[Math.floor(Math.random() * pickFrom.length)];

    setOpening({ chest, stage: 'opening', reward });
    if (stageTimer.current) clearTimeout(stageTimer.current);
    stageTimer.current = setTimeout(() => {
      setOpening((prev) => (prev ? { ...prev, stage: 'reveal' } : null));
    }, Durations.chestOpenToReveal);
  };

  const claimReward = () => {
    if (!opening) return;
    const { reward } = opening;
    if (!owned.includes(reward)) {
      addOwned(reward);
      showToast(`Obtained · ${ALL_ITEMS.find((i) => i.id === reward)?.name ?? ''}`);
    } else {
      addPoints(DUPLICATE_REFUND);
      showToast(`Duplicate · +${DUPLICATE_REFUND} ✦ refund`);
    }
    setOpening(null);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {toast && <Toast key={toast.key} message={toast.msg} />}

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.section}>treasure</Text>
          <View style={styles.statPill}>
            <Text style={styles.leaf}>✦</Text>
            <Text style={styles.statText}>{points}</Text>
          </View>
        </View>
        <View style={styles.rule} />

        {CHESTS.map((chest) => {
          const earned = chests[chest.id] ?? 0;
          const canBuy = points >= chest.cost;
          return (
            <View key={chest.id} style={styles.chestCard}>
              <View style={styles.chestRow}>
                <View style={styles.chestArt}>
                  <PixelChest color={chest.color} scale={PixelScale.chestCard} />
                </View>
                <View style={styles.chestInfo}>
                  <Text style={styles.chestName}>{chest.name}</Text>
                  <Text style={styles.poolLabel}>contains one of:</Text>
                  <View style={styles.pool}>
                    {chest.pool.map((itemId) => (
                      <View key={itemId} style={styles.poolItem}>
                        <ItemIcon id={itemId} scale={PixelScale.itemTiny} />
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.actions}>
                {earned > 0 && (
                  <Pressable
                    style={({ pressed }) => [styles.btn, styles.btnEarned, pressed && styles.btnPressed]}
                    onPress={() => openChest(chest, 'earned')}>
                    <Text style={styles.btnText}>open ({earned})</Text>
                  </Pressable>
                )}
                <Pressable
                  disabled={!canBuy}
                  style={({ pressed }) => [styles.btn, !canBuy && styles.btnMuted, pressed && styles.btnPressed]}
                  onPress={() => openChest(chest, 'purchase')}>
                  <Text style={styles.btnText}>✦ {chest.cost}</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <ChestOpenOverlay
        visible={opening !== null}
        stage={opening?.stage ?? 'opening'}
        chestColor={opening?.chest.color ?? ChestColors.small}
        rewardId={opening?.reward ?? null}
        onClaim={claimReward}
      />

      <DevAddPointsButton onPress={() => addPoints(100)} />
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
    gap: HavenSpacing.lg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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

  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: HavenSpacing.sm,
    backgroundColor: HavenColors.ink,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
    paddingVertical: HavenSpacing.sm,
    paddingHorizontal: HavenSpacing.lg,
    boxShadow: `${ShadowOffset.two}px ${ShadowOffset.two}px 0px ${HavenColors.leatherShadow}`,
  },
  leaf: {
    fontSize: PixelFontSize.md,
    color: HavenColors.gold,
  },
  statText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.md,
    color: HavenColors.gold,
  },

  chestCard: {
    backgroundColor: HavenColors.cellFill,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
    padding: HavenSpacing.lg,
    boxShadow: `${ShadowOffset.two}px ${ShadowOffset.two}px 0px ${HavenColors.parchmentShadow}`,
  },
  chestRow: {
    flexDirection: 'row',
    gap: HavenSpacing.lg,
    alignItems: 'flex-start',
  },
  chestArt: {
    padding: HavenSpacing.sm,
    backgroundColor: HavenColors.cellInset,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
  },
  chestInfo: {
    flex: 1,
  },
  chestName: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.lg,
    color: HavenColors.ink,
  },
  poolLabel: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.sm,
    color: HavenColors.inkSoft,
    marginVertical: HavenSpacing.sm,
  },
  pool: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: HavenSpacing.sm,
  },
  poolItem: {
    padding: HavenSpacing.xxs,
    backgroundColor: HavenColors.cellInset,
    borderWidth: Border.thin,
    borderColor: HavenColors.inkSoft,
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: HavenSpacing.base,
    marginTop: HavenSpacing.md,
  },
  btn: {
    backgroundColor: HavenColors.ink,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
    paddingVertical: HavenSpacing.sm,
    paddingHorizontal: HavenSpacing.lg,
    boxShadow: `${ShadowOffset.two}px ${ShadowOffset.two}px 0px ${HavenColors.leatherShadow}`,
  },
  btnEarned: {
    backgroundColor: HabitColors.stretch,
  },
  btnMuted: {
    opacity: 0.5,
  },
  btnPressed: {
    transform: [{ translateX: ShadowOffset.one }, { translateY: ShadowOffset.one }],
  },
  btnText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.base,
    color: HavenColors.gold,
    letterSpacing: 0.5,
  },

});
