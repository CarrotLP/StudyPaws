import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DailyQuestOverlay } from '@/components/DailyQuestOverlay';
import { DevSkipButton } from '@/components/DevSkipButton';
import { Mochi } from '@/components/mochi';
import { MochiSpeech } from '@/components/MochiSpeech';
import { Toast } from '@/components/Toast';
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
import { minutesToTime, questWindowsFromDeadlines } from '@/constants/questWindows';
import { useDailyQuest } from '@/hooks/use-daily-quest';
import { useOutfit } from '@/hooks/use-outfit';
import { useWithinWindow } from '@/hooks/use-quest-window';
import { type BreakHabit, useStudySession } from '@/hooks/use-study-session';
import { useUser } from '@/hooks/use-user';
import { fmt, fmtMinutes } from '@/lib/haven-format';

export default function HomeScreen() {
  const session = useStudySession();
  const [catTaps, setCatTaps] = useState(0);
  const { outfit } = useOutfit();
  const { petName, personality } = useUser();
  const { deadlines, hasSubmittedToday } = useDailyQuest();
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

  // Local-clock gate: the daily quest is only offered during the submission window.
  const submissionOpen = useWithinWindow(
    questWindowsFromDeadlines(
      deadlines.submissionDeadlineMinutes,
      deadlines.votingDeadlineMinutes,
    ).submission,
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {toast && <Toast key={toast.key} message={toast.msg} />}

      <DailyQuestOverlay
        visible={phase === 'break_active' && activeBreakHabit?.id === 'dailyquest'}
        onCancel={session.closeBreakActivity}
        onComplete={session.completeBreakActivity}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.catStage}>
          <Pressable onPress={() => setCatTaps((c) => c + 1)}>
            <Mochi outfit={outfit as any} scale={2} walkSignal={catTaps} />
          </Pressable>
          <View style={styles.floorShadow} />
          <MochiSpeech
            tapSignal={catTaps}
            personality={personality ?? undefined}
            mode={
              phase === 'studying'
                ? 'study'
                : phase === 'break_active' || phase === 'break_intro'
                  ? 'break'
                  : phase === 'idle'
                    ? 'idle'
                    : null
            }
          />
        </View>

        {/* This View wraps the rest of the contents to ensure they stack below the catStage */}
        <View style={styles.mainContent}>
          <Text style={styles.petName}>{petName ?? 'Mochi'}</Text>

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
            <Text style={styles.statsCaption}>
              Earn study points from focused study and healthy breaks. Use them to dress {petName ?? 'Mochi'}.
            </Text>
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

          {phase === 'break_intro' && (
            <BreakIntroCard onStart={session.startBreak} onSkip={session.stopSession} />
          )}

          {phase === 'break_active' &&
            (activeBreakHabit && activeBreakHabit.id !== 'dailyquest' ? (
              <BreakActivityView
                habit={activeBreakHabit}
                onComplete={session.completeBreakActivity}
                onBack={session.closeBreakActivity}
              />
            ) : (
              <>
                <Text style={styles.section}>break · {fmt(secondsLeft)}</Text>
                <View style={styles.habitList}>
                  {session.habits.map((habit) => (
                    <HabitRow
                      key={habit.id}
                      habit={habit}
                      done={
                        session.completedBreakHabits.includes(habit.id) ||
                        (habit.id === 'dailyquest' && hasSubmittedToday)
                      }
                      disabled={habit.id === 'dailyquest' && (!submissionOpen || hasSubmittedToday)}
                      disabledHint={
                        hasSubmittedToday
                          ? 'Daily quest completed. Come back tomorrow.'
                          : `Submissions close at ${minutesToTime(deadlines.submissionDeadlineMinutes)} UTC. Come back tomorrow.`
                      }
                      onPress={() => session.openBreakActivity(habit)}
                    />
                  ))}
                </View>
                <InkButton label="end break early" variant="small" onPress={session.endBreak} />
              </>
            ))}

          {phase === 'break_expired_prompt' && (
            <>
              <Text style={styles.section}>Break's over.</Text>
              {/* TODO: Add "Extend 5 min" button here. On tap:
                    - Add 300 seconds to the break duration
                    - Reset break_expired_prompt state
                    - Transition back to break_active list view
                    - Optionally cap the number of extensions per break (e.g. max 2) */}
              <InkButton label="End break" variant="primary" onPress={session.endBreak} />
            </>
          )}

          {phase === 'finished' && (
            <>
              <Text style={styles.section}>complete</Text>
              <InkButton label="begin another" variant="primary" onPress={session.startStudy} />
            </>
          )}
        </View>
      </ScrollView>

      {(phase === 'studying' || (phase === 'break_active' && !activeBreakHabit)) && (
        <DevSkipButton onPress={session.devSkip} />
      )}
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

function HabitRow({
  habit,
  done = false,
  disabled = false,
  disabledHint,
  onPress,
}: {
  habit: BreakHabit;
  done?: boolean;
  disabled?: boolean;
  disabledHint?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.habitRow, (done || disabled) && styles.habitRowDone]}
      onPress={onPress}
      disabled={done || disabled}>
      <View style={[styles.habitIcon, { backgroundColor: habit.color }]} />
      <View style={styles.habitMid}>
        <Text style={styles.habitName}>{habit.name}</Text>
        <Text style={styles.habitDesc}>{disabled && disabledHint ? disabledHint : habit.desc}</Text>
      </View>
      <Text style={styles.habitPts}>{done ? '✓' : `+${habit.pts}`}</Text>
    </Pressable>
  );
}

// break_intro card — points/chest/today's minutes have ALREADY been awarded by
// the session hook before this renders. This is just the gating UX to start
// the break timer; closing the app here keeps everything already earned.
function BreakIntroCard({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <>
      <Text style={styles.section}>Study block complete.</Text>
      <Text style={styles.breakMsg}>Ready to take a break?</Text>
      <InkButton label="Yes, let's take a break" variant="primary" onPress={onStart} />
      {/* Secondary, border-only — focus points + chest were already awarded at
          study end, so this just skips the break flow and returns to idle. */}
      <InkButton label="I'm done studying for the day" variant="secondary" onPress={onSkip} />
    </>
  );
}

// Sub-activity view inside break_active. NO timer here — the parent break
// timer keeps ticking in the background via the session hook; the user does
// the activity at their own pace.
function BreakActivityView({
  habit,
  onComplete,
  onBack,
}: {
  habit: BreakHabit;
  onComplete: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <Text style={styles.section}>{habit.name}</Text>
      <Text style={styles.breakMsg}>{habit.guidance.join('\n')}</Text>
      <InkButton label="Complete" variant="primary" onPress={onComplete} />
      <InkButton label="back" variant="small" onPress={onBack} />
    </>
  );
}

function InkButton({
  label,
  onPress,
  variant = 'default',
}: {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'small' | 'secondary';
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btnInk,
        variant === 'primary' && styles.btnInkPrimary,
        variant === 'small' && styles.btnInkSmall,
        variant === 'secondary' && styles.btnInkSecondary,
        pressed && styles.btnInkPressed,
      ]}>
      <Text
        style={[
          styles.btnInkText,
          variant === 'primary' && styles.btnInkTextPrimary,
          variant === 'small' && styles.btnInkTextSmall,
          variant === 'secondary' && styles.btnInkTextSecondary,
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
    width: '100%',
    alignItems: 'center',
    paddingTop: HavenSpacing.lg,
    paddingBottom: HavenSpacing.xl,
  },
  mainContent: {
    width: '100%',
    alignItems: 'center',
    gap: HavenSpacing.md,
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
  statsCaption: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.xl,
    color: HavenColors.inkSoft,
    textAlign: 'center',
    marginTop: HavenSpacing.sm,
    paddingHorizontal: HavenSpacing.lg,
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
    // Explicit large display size (deliberately decoupled from the two-size
    // app scale) so the running timer fills the screen.
    fontSize: 96,
    lineHeight: 104,
    textAlign: 'center',
    color: HavenColors.ink,
    letterSpacing: 1.5,
    marginVertical: HavenSpacing.xl,
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
    // Centre the glyph within the small square button: pin line height to the
    // box, centre both axes, and drop Android's extra font padding.
    width: Control.dialButton,
    height: Control.dialButton,
    lineHeight: Control.dialButton,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
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
  habitRowDone: {
    opacity: 0.5,
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
    fontSize: PixelFontSize.title, // important → 22
    color: HavenColors.ink,
    marginBottom: HavenSpacing.xs,
  },
  habitDesc: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.md, // minor → 16
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
  // Border-only secondary: same footprint as primary so the two buttons stack
  // with equal weight, but transparent fill keeps primary visually dominant.
  btnInkSecondary: {
    backgroundColor: 'transparent',
    borderColor: HavenColors.ink,
    paddingVertical: HavenSpacing.lg,
    paddingHorizontal: HavenSpacing.xxl,
    boxShadow: `${ShadowOffset.two}px ${ShadowOffset.two}px 0px ${HavenColors.parchmentShadow}`,
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
  btnInkTextSecondary: {
    fontSize: PixelFontSize.xl,
    color: HavenColors.ink,
  },

});
