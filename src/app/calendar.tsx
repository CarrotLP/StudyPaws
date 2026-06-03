import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MonthGrid } from '@/components/MonthGrid';
import { SelectedDayPanel } from '@/components/SelectedDayPanel';
import {
    BodyFontSize,
    Border,
    CalendarHeat,
    Control,
    HavenColors,
    HavenFonts,
    HavenSpacing,
    PixelFontSize,
} from '@/constants/havenTheme';
import { useStudyHistory } from '@/hooks/use-study-history';
import { dateKey, fmtMinutes } from '@/lib/haven-format';

const WEEKDAYS = ['T', 'T', 'W', 'T', 'F', 'S', 'S'];
// Window of past months kept mounted at fixed positions. Data only exists ~5
// weeks back; swiping further legitimately shows empty months (caption shows).
const MONTHS_BACK = 12;

type YearMonth = { year: number; month: number };

function addMonths(year: number, month: number, delta: number): YearMonth {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

function monthPrefix(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function sumMonth(history: Record<string, number>, year: number, month: number) {
  const prefix = monthPrefix(year, month);
  return Object.entries(history).reduce((acc, [k, v]) => (k.startsWith(prefix) ? acc + v : acc), 0);
}

function monthHasStudy(history: Record<string, number>, year: number, month: number) {
  const prefix = monthPrefix(year, month);
  return Object.entries(history).some(([k, v]) => k.startsWith(prefix) && v > 0);
}

export default function CalendarScreen() {
  const { history } = useStudyHistory();

  const today = useMemo(() => new Date(), []);
  const currentY = today.getFullYear();
  const currentM = today.getMonth();
  const todayKey = dateKey(today);
  const todayDate = today.getDate();

  // Oldest -> current, all mounted at fixed positions. Because each page's month
  // never changes, there is no recycle/content-swap on commit (the source of the
  // old flicker).
  const months = useMemo<YearMonth[]>(() => {
    const arr: YearMonth[] = [];
    for (let i = MONTHS_BACK; i >= 0; i--) arr.push(addMonths(currentY, currentM, -i));
    return arr;
  }, [currentY, currentM]);
  const lastIndex = months.length - 1; // current month sits at the right edge

  // React state mirrors the centred index for the header/stats/selection only;
  // the transform is driven by the shared values below, so a lag here never
  // moves the grid.
  const [activeIndex, setActiveIndex] = useState(lastIndex);
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [pageWidth, setPageWidth] = useState(0);

  const indexSV = useSharedValue(lastIndex);
  const drag = useSharedValue(0);

  const defaultSelection = useCallback(
    (m: YearMonth) =>
      m.year === currentY && m.month === currentM ? todayKey : dateKey(new Date(m.year, m.month, 1)),
    [currentY, currentM, todayKey],
  );

  const syncIndex = useCallback(
    (idx: number) => {
      setActiveIndex(idx);
      setSelectedKey(defaultSelection(months[idx]));
    },
    [months, defaultSelection],
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-15, 15])
        .failOffsetY([-20, 20])
        .onUpdate((e) => {
          'worklet';
          let d = e.translationX;
          // Rubber-band at the oldest page (swipe right) and the current month
          // (swipe left -> future, not allowed).
          if (indexSV.value === 0 && d > 0) d *= 0.25;
          if (indexSV.value === lastIndex && d < 0) d *= 0.25;
          drag.value = d;
        })
        .onEnd((e) => {
          'worklet';
          const threshold = pageWidth * 0.22;
          const goPrev = (e.translationX > threshold || e.velocityX > 600) && indexSV.value > 0;
          const goNext = (e.translationX < -threshold || e.velocityX < -600) && indexSV.value < lastIndex;
          if (goPrev) {
            // Slide to the previous (left) page, then shift index+offset together
            // on the UI thread so translateX stays continuous (no jump).
            drag.value = withTiming(pageWidth, { duration: 220 }, (f) => {
              if (f) {
                indexSV.value -= 1;
                drag.value = 0;
                runOnJS(syncIndex)(indexSV.value);
              }
            });
          } else if (goNext) {
            drag.value = withTiming(-pageWidth, { duration: 220 }, (f) => {
              if (f) {
                indexSV.value += 1;
                drag.value = 0;
                runOnJS(syncIndex)(indexSV.value);
              }
            });
          } else {
            drag.value = withSpring(0, { damping: 22, stiffness: 220 });
          }
        }),
    [pageWidth, lastIndex, syncIndex, drag, indexSV],
  );

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -(indexSV.value * pageWidth) + drag.value }],
  }));

  const displayed = months[activeIndex];
  const monthName = new Date(displayed.year, displayed.month, 1).toLocaleString('default', { month: 'long' });
  const totalMonth = sumMonth(history, displayed.year, displayed.month);
  const todayMinutes = history[todayKey] ?? 0;
  const selectedMinutes = history[selectedKey] ?? 0;
  const hasStudyThisMonth = monthHasStudy(history, displayed.year, displayed.month);

  return (
    <GestureHandlerRootView style={styles.screen}>
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.section}>
            {monthName} {displayed.year}
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

          <View style={styles.viewport} onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}>
            <GestureDetector gesture={pan}>
              <Animated.View style={[styles.pagerRow, { width: pageWidth * months.length }, rowStyle]}>
                {months.map((m) => (
                  <View key={`${m.year}-${m.month}`} style={{ width: pageWidth }}>
                    <MonthGrid
                      year={m.year}
                      month={m.month}
                      width={pageWidth}
                      history={history}
                      selectedKey={selectedKey}
                      isCurrentMonth={m.year === currentY && m.month === currentM}
                      todayDate={todayDate}
                      onSelectDay={setSelectedKey}
                    />
                  </View>
                ))}
              </Animated.View>
            </GestureDetector>
          </View>

          <SelectedDayPanel dateKey={selectedKey} minutes={selectedMinutes} />

          {!hasStudyThisMonth && <Text style={styles.emptyCaption}>— no study logged this month —</Text>}

          <View style={styles.legend}>
            <Text style={styles.legendLabel}>less</Text>
            {CalendarHeat.ramp.map((step) => (
              <View key={step.color} style={[styles.legendSwatch, { backgroundColor: step.color }]} />
            ))}
            <Text style={styles.legendLabel}>more</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
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

  viewport: {
    width: '100%',
    overflow: 'hidden',
  },
  pagerRow: {
    flexDirection: 'row',
  },

  emptyCaption: {
    textAlign: 'center',
    fontFamily: HavenFonts.body,
    fontStyle: 'italic',
    fontSize: BodyFontSize.md,
    color: HavenColors.inkSoft,
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
