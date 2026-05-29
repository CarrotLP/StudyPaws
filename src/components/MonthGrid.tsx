import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Border, CalendarHeat, HavenColors, HavenFonts, HavenSpacing, PixelFontSize, ShadowOffset } from '@/constants/havenTheme';
import { dateKey } from '@/lib/haven-format';

const HIGH_CONTRAST_MINUTES = 75; // above this, cell text flips to light

function heatColor(mins: number): string | null {
  if (mins <= 0) return null;
  let color: string | null = null;
  for (const step of CalendarHeat.ramp) {
    if (mins >= step.minThreshold) color = step.color;
  }
  return color;
}

// Monday-start cells for a month, padded with nulls before the 1st / after the
// last so the grid is whole weeks. Null cells are not tappable.
function buildWeeks(year: number, month: number): (number | null)[][] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
  const startOffset = (firstWeekday + 6) % 7; // shift to Monday-start

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

type MonthGridProps = {
  year: number;
  month: number; // 0-11
  width: number;
  history: Record<string, number>;
  selectedKey: string | null;
  isCurrentMonth: boolean; // gold "today" ring only shows on the current month
  todayDate: number;
  onSelectDay: (key: string) => void;
};

export function MonthGrid({
  year,
  month,
  width,
  history,
  selectedKey,
  isCurrentMonth,
  todayDate,
  onSelectDay,
}: MonthGridProps) {
  const weeks = buildWeeks(year, month);
  return (
    <View style={{ width }}>
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            if (day === null) return <View key={di} style={styles.cellEmpty} />;
            const key = dateKey(new Date(year, month, day));
            const mins = history[key] ?? 0;
            const heat = heatColor(mins);
            const isToday = isCurrentMonth && day === todayDate;
            const isSelected = key === selectedKey;
            return (
              <Pressable
                key={di}
                onPress={() => onSelectDay(key)}
                style={[
                  styles.cell,
                  heat ? { backgroundColor: heat } : null,
                  isToday ? styles.cellToday : null,
                  isSelected ? styles.cellSelected : null,
                ]}>
                <Text
                  style={[
                    styles.cellText,
                    mins > HIGH_CONTRAST_MINUTES ? styles.cellTextLight : null,
                    isSelected ? styles.cellTextSelected : null,
                  ]}>
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  weekRow: {
    flexDirection: 'row',
    gap: HavenSpacing.xs,
    marginBottom: HavenSpacing.xs,
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
  cellSelected: {
    borderWidth: Border.thick,
    borderColor: HavenColors.leather,
    backgroundColor: HavenColors.selectedCell,
  },
  cellText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.md,
    color: HavenColors.ink,
  },
  cellTextLight: {
    color: HavenColors.white,
  },
  cellTextSelected: {
    color: HavenColors.ink,
  },
});
