import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PixelCat, type OutfitState } from '@/components/PixelCat';
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
import { type BreakHabit, useStudySession } from '@/hooks/use-study-session';
import { fmt, fmtMinutes } from '@/lib/haven-format';

// Placeholder until the Dress screen + shared outfit store are ported; matches
// the prototype's starting outfit. PixelCat ignores it while sleeping.
const HOME_OUTFIT: OutfitState = { head: null, face: 'glasses', neck: 'scarf', body: null };

export default function HomeScreen() {
  const session = useStudySession();
  const {
    phase,
    points,
    todayMinutes,
    studyDuration,
    breakDuration,
    secondsLeft,
    activeBreakHabit,
    toast,
  } = session;

  const sleeping = phase === 'break_doing' && activeBreakHabit?.id === 'phoneoff';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {toast && (
        <View style={styles.toast} key={toast.key}>
          <Text style={styles.toastText}>{toast.msg}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.catStage}>
          <PixelCat outfit={HOME_OUTFIT} scale={PixelScale.catHome} sleeping={sleeping} />
          <View style={styles.floorShadow} />
        </View>

        <Text style={styles.petName}>Mochi</Text>

        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.leaf}>✦</Text>
            <Text style={styles.statText}>{points}</Text>
          </View>
          <View style={[styles.statPill, styles.statPillAlt]}>
            <Text style={styles.statText}>today · {fmtMinutes(todayMinutes)}</Text>
          </View>
        </View>

        <PageRule />

        {phase === 'idle' && (
          <>
            <View style={styles.dialRow}>
              <Dial
                label="study"
                minutes={Math.floor(studyDuration / 60)}
                onMinus={session.decStudy}
                onPlus={session.incStudy}
              />
              <Dial
                label="break"
                minutes={Math.floor(breakDuration / 60)}
                onMinus={session.decBreak}
                onPlus={session.incBreak}
              />
            </View>
            <InkButton label="begin focus block" variant="primary" onPress={session.startStudy} />
          </>
        )}

        {phase === 'studying' && (
          <>
            <Text style={styles.section}>studying</Text>
            <Text style={styles.timerBig}>{fmt(secondsLeft)}</Text>
            <BlinkingDots />
            <InkButton label="give up" variant="small" onPress={session.stopSession} />
          </>
        )}

        {phase === 'break_choosing' && (
          <>
            <Text style={styles.section}>pick one break activity</Text>
            <View style={styles.habitList}>
              {session.habits.map((habit) => (
                <HabitRow key={habit.id} habit={habit} onPress={() => session.chooseBreakHabit(habit)} />
              ))}
            </View>
          </>
        )}

        {phase === 'break_doing' && activeBreakHabit && (
          <>
            <Text style={styles.section}>
              {activeBreakHabit.name} · {fmt(secondsLeft)}
            </Text>
            <Text style={styles.breakMsg}>{activeBreakHabit.guidance.join('\n')}</Text>
            <InkButton label="end early" variant="small" onPress={session.stopSession} />
          </>
        )}

        {phase === 'finished' && (
          <>
            <Text style={styles.section}>complete</Text>
            <InkButton label="begin another" variant="primary" onPress={session.startStudy} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PageRule() {
  return (
    <View style={styles.pageRuleWrap}>
      <View style={styles.pageRuleLine} />
      <Text style={styles.pageRuleDiamond}>◆</Text>
    </View>
  );
}

function Dial({
  label,
  minutes,
  onMinus,
  onPlus,
}: {
  label: string;
  minutes: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View style={styles.dial}>
      <Text style={styles.dialLabel}>{label}</Text>
      <Text style={styles.dialValue}>
        {minutes}
        <Text style={styles.dialValueUnit}>m</Text>
      </Text>
      <View style={styles.dialBtns}>
        <Pressable style={styles.dotBtn} onPress={onMinus}>
          <Text style={styles.dotBtnText}>−</Text>
        </Pressable>
        <Pressable style={styles.dotBtn} onPress={onPlus}>
          <Text style={styles.dotBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function HabitRow({ habit, onPress }: { habit: BreakHabit; onPress: () => void }) {
  return (
    <Pressable style={styles.habitRow} onPress={onPress}>
      <View style={[styles.habitIcon, { backgroundColor: habit.color }]} />
      <View style={styles.habitMid}>
        <Text style={styles.habitName}>{habit.name}</Text>
        <Text style={styles.habitDesc}>{habit.desc}</Text>
      </View>
      <Text style={styles.habitPts}>+{habit.pts}</Text>
    </Pressable>
  );
}

function InkButton({
  label,
  onPress,
  variant = 'default',
}: {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'small';
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btnInk,
        variant === 'primary' && styles.btnInkPrimary,
        variant === 'small' && styles.btnInkSmall,
        pressed && styles.btnInkPressed,
      ]}>
      <Text
        style={[
          styles.btnInkText,
          variant === 'primary' && styles.btnInkTextPrimary,
          variant === 'small' && styles.btnInkTextSmall,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function BlinkingDots() {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.Text style={[styles.dots, style]}>. . .</Animated.Text>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HavenColors.parchment,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: HavenSpacing.xxl,
    paddingTop: HavenSpacing.xl,
    paddingBottom: HavenSpacing.xxl,
    gap: HavenSpacing.md,
  },

  catStage: {
    alignItems: 'center',
    paddingTop: HavenSpacing.lg,
  },
  floorShadow: {
    width: '70%',
    height: HavenSpacing.base,
    marginTop: -HavenSpacing.base,
    borderRadius: HavenSpacing.base,
    backgroundColor: HavenColors.floorShadow,
  },

  petName: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.title,
    color: HavenColors.ink,
    marginTop: HavenSpacing.sm,
  },

  statsRow: {
    flexDirection: 'row',
    gap: HavenSpacing.base,
    marginTop: HavenSpacing.sm,
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
  statPillAlt: {
    backgroundColor: HavenColors.leather,
  },
  statText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.md,
    color: HavenColors.gold,
  },
  leaf: {
    fontSize: PixelFontSize.md,
    color: HavenColors.gold,
  },

  pageRuleWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: HavenSpacing.md,
  },
  pageRuleLine: {
    width: '100%',
    height: Border.thick,
    backgroundColor: HavenColors.ink,
  },
  pageRuleDiamond: {
    position: 'absolute',
    color: HavenColors.gold,
    fontSize: PixelFontSize.xxl,
  },

  section: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.xl,
    color: HavenColors.leather,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  timerBig: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.timer,
    color: HavenColors.ink,
    letterSpacing: 1.5,
    marginVertical: HavenSpacing.md,
    textShadowColor: HavenColors.parchmentShadow,
    textShadowOffset: { width: ShadowOffset.three, height: ShadowOffset.three },
    textShadowRadius: 0,
  },
  dots: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.dots,
    color: HavenColors.inkSoft,
    letterSpacing: 4,
    marginVertical: HavenSpacing.base,
  },

  dialRow: {
    flexDirection: 'row',
    gap: HavenSpacing.lg,
    width: '100%',
    marginVertical: HavenSpacing.xs,
  },
  dial: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: HavenColors.cellFill,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
    paddingVertical: HavenSpacing.md,
    paddingHorizontal: HavenSpacing.lg,
  },
  dialLabel: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.base,
    color: HavenColors.inkSoft,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  dialValue: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.dial,
    color: HavenColors.ink,
    marginVertical: HavenSpacing.sm,
  },
  dialValueUnit: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.xl,
    color: HavenColors.inkSoft,
  },
  dialBtns: {
    flexDirection: 'row',
    gap: HavenSpacing.sm,
  },
  dotBtn: {
    width: Control.dialButton,
    height: Control.dialButton,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HavenColors.ink,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
    boxShadow: `${ShadowOffset.one}px ${ShadowOffset.one}px 0px ${HavenColors.leatherShadow}`,
  },
  dotBtnText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.lg,
    color: HavenColors.parchment,
  },

  habitList: {
    width: '100%',
    gap: HavenSpacing.base,
    marginTop: HavenSpacing.xs,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: HavenSpacing.md,
    backgroundColor: HavenColors.cellFill,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
    paddingVertical: HavenSpacing.base,
    paddingHorizontal: HavenSpacing.md,
  },
  habitIcon: {
    width: Control.habitIcon,
    height: Control.habitIcon,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
  },
  habitMid: {
    flex: 1,
  },
  habitName: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.md,
    color: HavenColors.ink,
    marginBottom: HavenSpacing.xs,
  },
  habitDesc: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.base,
    color: HavenColors.inkSoft,
  },
  habitPts: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.xl,
    color: HavenColors.leather,
  },

  breakMsg: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.lg,
    color: HavenColors.ink,
    textAlign: 'center',
    lineHeight: BodyFontSize.lg * 1.4,
    marginVertical: HavenSpacing.md,
  },

  btnInk: {
    alignSelf: 'center',
    backgroundColor: HavenColors.ink,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
    paddingVertical: HavenSpacing.md,
    paddingHorizontal: HavenSpacing.xl,
    marginVertical: HavenSpacing.xs,
    boxShadow: `${ShadowOffset.three}px ${ShadowOffset.three}px 0px ${HavenColors.leatherShadow}`,
  },
  btnInkPrimary: {
    backgroundColor: HavenColors.leather,
    paddingVertical: HavenSpacing.lg,
    paddingHorizontal: HavenSpacing.xxl,
  },
  btnInkSmall: {
    paddingVertical: HavenSpacing.sm,
    paddingHorizontal: HavenSpacing.lg,
  },
  btnInkPressed: {
    transform: [{ translateX: ShadowOffset.two }, { translateY: ShadowOffset.two }],
    boxShadow: `${ShadowOffset.one}px ${ShadowOffset.one}px 0px ${HavenColors.leatherShadow}`,
  },
  btnInkText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.lg,
    color: HavenColors.gold,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  btnInkTextPrimary: {
    fontSize: PixelFontSize.xl,
  },
  btnInkTextSmall: {
    fontSize: PixelFontSize.base,
  },

  toast: {
    position: 'absolute',
    top: HavenSpacing.xxl,
    alignSelf: 'center',
    zIndex: 150,
    backgroundColor: HavenColors.ink,
    borderWidth: Border.base,
    borderColor: HavenColors.gold,
    paddingVertical: HavenSpacing.md,
    paddingHorizontal: HavenSpacing.xl,
    boxShadow: `${ShadowOffset.four}px ${ShadowOffset.four}px 0px ${HavenColors.leatherShadow}`,
  },
  toastText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.md,
    color: HavenColors.gold,
  },
});
