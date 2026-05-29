import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BodyFontSize,
  Border,
  CalendarHeat,
  Control,
  HavenColors,
  HavenSpacing,
  HavenFonts,
  PixelFontSize,
  ShadowOffset,
} from '@/constants/havenTheme';
import { useStudyHistory } from '@/hooks/use-study-history';
import { dateKey, fmtMinutes } from '@/lib/haven-format';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const HIGH_CONTRAST_MINUTES = 75; // above this, cell text flips to light

function heatColor(mins: number): string | null {
  if (mins <= 0) return null;
  let color: string | null = null;
  for (const step of CalendarHeat.ramp) {
    if (mins >= step.minThreshold) color = step.color;
  }
  return color;
}

function buildMonthCells(year: number, month: number): (number | null)[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
  const startOffset = (firstWeekday + 6) % 7; // shift to Monday-start

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarScreen() {
  const { history } = useStudyHistory();

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const todayDate = today.getDate();
  const monthName = today.toLocaleString('default', { month: 'long' });
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  const cells = buildMonthCells(year, month);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const totalMonth = Object.entries(history).reduce(
    (acc, [key, mins]) => (key.startsWith(monthPrefix) ? acc + mins : acc),
    0,
  );
  const todayMinutes = history[dateKey(today)] ?? 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>
          {monthName} {year}
        </Text>
        <View style={styles.rule} />

        <View style={styles.summaryRow}>
          <SummaryBox value={fmtMinutes(totalMonth)} label="this month" />
          <SummaryBox value={fmtMinutes(todayMinutes)} label="today" />
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((d, i) => (
            <Text key={i} style={styles.weekday}>
              {d}
            </Text>
          ))}
        </View>

        {weeks.map((week, wi) => (
          <View key={wi} style={styles.weekRow}>
            {week.map((day, di) => {
              if (day === null) return <View key={di} style={styles.cellEmpty} />;
              const mins = history[dateKey(new Date(year, month, day))] ?? 0;
              const heat = heatColor(mins);
              const isToday = day === todayDate;
              return (
                <View
                  key={di}
                  style={[
                    styles.cell,
                    heat ? { backgroundColor: heat } : null,
                    isToday ? styles.cellToday : null,
                  ]}>
                  <Text
                    style={[styles.cellText, mins > HIGH_CONTRAST_MINUTES ? styles.cellTextLight : null]}>
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}

        <View style={styles.legend}>
          <Text style={styles.legendLabel}>less</Text>
          {CalendarHeat.ramp.map((step) => (
            <View key={step.color} style={[styles.legendSwatch, { backgroundColor: step.color }]} />
          ))}
          <Text style={styles.legendLabel}>more</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryBox({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
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

  summaryRow: {
    flexDirection: 'row',
    gap: HavenSpacing.md,
  },
  summaryBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: HavenColors.cellFill,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
    paddingVertical: HavenSpacing.md,
  },
  summaryValue: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.stat,
    color: HavenColors.ink,
  },
  summaryLabel: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.sm,
    color: HavenColors.inkSoft,
    marginTop: HavenSpacing.xs,
  },

  weekdayRow: {
    flexDirection: 'row',
    gap: HavenSpacing.xs,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.base,
    color: HavenColors.inkSoft,
    paddingVertical: HavenSpacing.xs,
  },

  weekRow: {
    flexDirection: 'row',
    gap: HavenSpacing.xs,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HavenColors.cellFill,
    borderWidth: Border.thin,
    borderColor: HavenColors.inkSoft,
  },
  cellEmpty: {
    flex: 1,
    aspectRatio: 1,
  },
  cellToday: {
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
    boxShadow: `0px 0px 0px ${Border.thin}px ${HavenColors.gold}, ${ShadowOffset.one}px ${ShadowOffset.one}px 0px ${HavenColors.leatherShadow}`,
  },
  cellText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.md,
    color: HavenColors.ink,
  },
  cellTextLight: {
    color: HavenColors.white,
  },

  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: HavenSpacing.xs,
    marginTop: HavenSpacing.lg,
  },
  legendLabel: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.sm,
    color: HavenColors.inkSoft,
    marginHorizontal: HavenSpacing.xs,
  },
  legendSwatch: {
    width: Control.legendSwatch,
    height: Control.legendSwatch,
    borderWidth: Border.thin,
    borderColor: HavenColors.inkSoft,
  },
});
