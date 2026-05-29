import { StyleSheet, Text, View } from 'react-native';

import { BodyFontSize, Border, HavenColors, HavenFonts, HavenSpacing, PixelFontSize } from '@/constants/havenTheme';
import { fmtDayLabel, fmtMinutes } from '@/lib/haven-format';

type SelectedDayPanelProps = {
  dateKey: string;
  minutes: number;
};

export function SelectedDayPanel({ dateKey, minutes }: SelectedDayPanelProps) {
  return (
    <View style={styles.panel}>
      <Text style={styles.date}>{fmtDayLabel(dateKey)}</Text>
      <Text style={styles.minutes}>{minutes > 0 ? fmtMinutes(minutes) : 'no study logged'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: HavenColors.cellFill,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
    paddingVertical: HavenSpacing.md,
    paddingHorizontal: HavenSpacing.lg,
  },
  date: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.md,
    color: HavenColors.ink,
  },
  minutes: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.md,
    color: HavenColors.inkSoft,
  },
});
