import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
import { useDailyQuest } from '@/hooks/use-daily-quest';

const STEP_MINUTES = 30;

// Settings chapter — replaces Buddies in the ribbon. Intentionally empty for now;
// content TBD. (The buddies screen/file is kept, just no longer surfaced.)
export default function SettingsScreen() {
  const { deadlines, updateDeadlines } = useDailyQuest();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>settings</Text>
        <View style={styles.rule} />
        <DeadlineControl
          label="Quest submission deadline"
          minutes={deadlines.submissionDeadlineMinutes}
          minMinutes={0}
          maxMinutes={deadlines.votingDeadlineMinutes - STEP_MINUTES}
          onChange={(minutes) =>
            updateDeadlines({ ...deadlines, submissionDeadlineMinutes: minutes })
          }
        />
        <DeadlineControl
          label="Voting deadline"
          minutes={deadlines.votingDeadlineMinutes}
          minMinutes={deadlines.submissionDeadlineMinutes + STEP_MINUTES}
          maxMinutes={24 * 60}
          onChange={(minutes) => updateDeadlines({ ...deadlines, votingDeadlineMinutes: minutes })}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function DeadlineControl({
  label,
  minutes,
  minMinutes,
  maxMinutes,
  onChange,
}: {
  label: string;
  minutes: number;
  minMinutes: number;
  maxMinutes: number;
  onChange: (minutes: number) => Promise<void>;
}) {
  const [hour, setHour] = useState(String(Math.floor(minutes / 60)));
  const [minute, setMinute] = useState(String(minutes % 60).padStart(2, '0'));

  useEffect(() => {
    setHour(String(Math.floor(minutes / 60)));
    setMinute(String(minutes % 60).padStart(2, '0'));
  }, [minutes]);

  const save = (nextMinutes: number) => {
    void onChange(Math.max(minMinutes, Math.min(maxMinutes, nextMinutes)));
  };

  const saveInputs = () => {
    const nextHour = Number(hour);
    const nextMinute = Number(minute);
    if (!Number.isInteger(nextHour) || !Number.isInteger(nextMinute) || nextMinute < 0 || nextMinute > 59) {
      setHour(String(Math.floor(minutes / 60)));
      setMinute(String(minutes % 60).padStart(2, '0'));
      return;
    }
    save(nextHour * 60 + nextMinute);
  };

  return (
    <View style={styles.deadlineCard}>
      <Text style={styles.deadlineLabel}>{label}</Text>
      <View style={styles.deadlineRow}>
        <Pressable style={styles.stepButton} onPress={() => save(minutes - STEP_MINUTES)}>
          <Text style={styles.stepButtonText}>-</Text>
        </Pressable>
        <View style={styles.timeInputs}>
          <TextInput
            accessibilityLabel={`${label} hour`}
            keyboardType="number-pad"
            value={hour}
            onChangeText={setHour}
            onEndEditing={saveInputs}
            style={styles.timeInput}
            maxLength={2}
          />
          <Text style={styles.colon}>:</Text>
          <TextInput
            accessibilityLabel={`${label} minute`}
            keyboardType="number-pad"
            value={minute}
            onChangeText={setMinute}
            onEndEditing={saveInputs}
            style={styles.timeInput}
            maxLength={2}
          />
        </View>
        <Pressable style={styles.stepButton} onPress={() => save(minutes + STEP_MINUTES)}>
          <Text style={styles.stepButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
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
    textAlign: 'center',
  },
  rule: {
    height: Border.thick,
    backgroundColor: HavenColors.ink,
  },
  deadlineCard: {
    alignItems: 'center',
    gap: HavenSpacing.md,
    padding: HavenSpacing.lg,
    backgroundColor: HavenColors.cellFill,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
  },
  deadlineLabel: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.lg,
    color: HavenColors.ink,
    textAlign: 'center',
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: HavenSpacing.lg,
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    width: 52,
    paddingVertical: HavenSpacing.sm,
    backgroundColor: HavenColors.parchment,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.xl,
    color: HavenColors.ink,
    textAlign: 'center',
  },
  colon: {
    marginHorizontal: HavenSpacing.xs,
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.xl,
    color: HavenColors.ink,
  },
  stepButton: {
    width: Control.dialButton,
    height: Control.dialButton,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HavenColors.ink,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
    boxShadow: `${ShadowOffset.one}px ${ShadowOffset.one}px 0px ${HavenColors.leatherShadow}`,
  },
  stepButtonText: {
    fontFamily: HavenFonts.pixel,
    fontSize: BodyFontSize.lg,
    color: HavenColors.parchment,
    lineHeight: Control.dialButton,
    includeFontPadding: false,
  },
});
