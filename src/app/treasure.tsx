import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChestOpenOverlay, type ChestStage } from '@/components/ChestOpenOverlay';
import { DevAddPointsButton } from '@/components/DevAddPointsButton';
import { DevRemoveCrownButton } from '@/components/DevRemoveCrownButton';
import { type ItemId } from '@/components/itemSprites';
import { PixelChest } from '@/components/PixelChest';
import { Toast } from '@/components/Toast';
import {
    BodyFontSize,
    Border,
    ChestColors,
    Durations,
    HabitColors,
    HavenColors,
    HavenFonts,
    HavenSpacing,
    PixelFontSize,
    PixelScale,
    ShadowOffset,
} from '@/constants/havenTheme';
import { useEconomy } from '@/hooks/use-economy';
import { useAccessories } from '@/hooks/use-accessories';
import { useAuth } from '@/hooks/use-auth';
import { getChests, type ChestReward } from '@/backend/services/chest.services';
import { removeAccessoryFromUser } from '@/backend/services/accessory.services';

type Chest = {
  name: string;
  cost: number;
  color: string;
  pool: ChestReward[];
};

const DUPLICATE_REFUND = 25;

type Opening = { chest: Chest; stage: ChestStage; reward: ChestReward };

export default function TreasureScreen() {
  const { user } = useAuth();
  const { points, addPoints, refreshPoints } = useEconomy();
  const { owned, addOwned, refreshOwned } = useAccessories();

  const [opening, setOpening] = useState<Opening | null>(null);
  const [chestList, setChestList] = useState<Chest[]>([]);
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null);

  const stageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getChests().then(data => {
      const mapped = data.map(c => ({
        name: c.name,
        cost: c.price,
        color: ChestColors.small,
        pool: c.pool
      }));
      setChestList(mapped);
    });
  }, []);

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

  const openChest = (chest: Chest) => {
    if (opening) return;
    if (points < chest.cost) return;
    addPoints(-chest.cost);

    // Roll: prefer unowned items; only fall back to the full pool if the user
    // already owns everything in it. Uniform pick — no weighting (hard rule 2).
    const unowned = chest.pool.filter((item) => !owned.includes(item.name));
    const pickFrom = unowned.length ? unowned : chest.pool;
    const reward = pickFrom[Math.floor(Math.random() * pickFrom.length)];

    setOpening({ chest, stage: 'opening', reward });
    if (stageTimer.current) clearTimeout(stageTimer.current);
    stageTimer.current = setTimeout(() => {
      setOpening((prev) => (prev ? { ...prev, stage: 'reveal' } : null));
    }, Durations.chestOpenToReveal);
  };

  const claimReward = async () => {
    if (!opening) return;
    const { reward } = opening;
    if (!owned.includes(reward.name)) {
      await addOwned(reward.name);
      showToast(`Obtained · ${reward.name}`);
    } else {
      await addPoints(DUPLICATE_REFUND);
      showToast(`Duplicate · +${DUPLICATE_REFUND} ✦ refund`);
    }
    setOpening(null);
  };

  const onRemoveCrown = async () => {
    if (!user) return;
    try {
      await removeAccessoryFromUser(user.id, 'crown');
      await refreshOwned();
      showToast('Crown removed from database');
    } catch (err) {
      console.error('Failed to remove crown:', err);
    }
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

        {chestList.map((chest) => {
          const canBuy = points >= chest.cost;
          return (
            <View key={chest.name} style={styles.chestCard}>
              <View style={styles.chestRow}>
                <View style={styles.chestArt}>
                  <PixelChest color={chest.color} scale={PixelScale.chestCard} />
                </View>
                <View style={styles.chestInfo}>
                  <Text style={styles.chestName}>{chest.name}</Text>
                  <Text style={styles.poolLabel}>contains one of:</Text>
                  <View style={styles.pool}>
                    {chest.pool.map((item) => (
                      <View key={item.name} style={styles.poolItem}>
                        <Image source={{ uri: item.image }} style={{ width: 40, height: 40 }} />
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.actions}>
                <Pressable
                  disabled={!canBuy}
                  style={({ pressed }) => [styles.btn, !canBuy && styles.btnMuted, pressed && styles.btnPressed]}
                  onPress={() => openChest(chest)}>
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
        reward={opening?.reward ?? null}
        onClaim={claimReward}
      />

      <DevAddPointsButton onPress={() => addPoints(100)} />
      <DevRemoveCrownButton onPress={onRemoveCrown} />
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
    position: 'relative',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
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

  statPill: {
    position: 'absolute',
    right: 0,
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
