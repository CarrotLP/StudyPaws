import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  BodyFontSize,
  Border,
  HavenColors,
  HavenFonts,
  HavenSpacing,
  ShadowOffset,
} from '@/constants/havenTheme';
import { getStudyQuotes, type MochiPersonality } from '@/services/mochiQuotes.services';

// Fixed nudge Mochi gives during break — pushing the daily quest.
const BREAK_LINE =
  'Oh, paws for a second… you’re not gonna leave that daily quest undone, are you? I’d be fur-ious';

// How often a fresh study quote pops up (cosmetic only — not a source of truth
// for time, so a plain interval is fine here).
const REPEAT_MS = 25000;
// Every bubble auto-closes after this long.
const AUTO_CLOSE_MS = 15000;

type Mode = 'study' | 'break' | null;

export function MochiSpeech({
  mode,
  personality,
  tapSignal,
}: {
  mode: Mode;
  // Which personality's study quotes to show. Omit for all (until a selector exists).
  personality?: MochiPersonality;
  // Increment this (e.g. on every cat tap) to make Mochi blurt a random quote.
  tapSignal?: number;
}) {
  const [text, setText] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<string[]>([]);

  // Load the study quotes once (re-loads if the chosen personality changes).
  useEffect(() => {
    let mounted = true;
    getStudyQuotes(personality)
      .then((q) => mounted && setQuotes(q))
      .catch(() => mounted && setQuotes([]));
    return () => {
      mounted = false;
    };
  }, [personality]);

  // Break: show the fixed daily-quest nudge. Leaving break clears it.
  useEffect(() => {
    if (mode === 'break') setText(BREAK_LINE);
    else if (mode !== 'study') setText(null);
  }, [mode]);

  // Study: periodically pop a random quote. Depending on `tapSignal` means a cat
  // tap re-runs this effect, restarting the interval — so the next AUTOMATIC
  // quote is a full REPEAT_MS after the tap (the timer is reset on tap).
  useEffect(() => {
    if (mode !== 'study') return;
    const pick = () => {
      if (quotes.length === 0) return;
      setText(quotes[Math.floor(Math.random() * quotes.length)]);
    };
    const interval = setInterval(pick, REPEAT_MS);
    return () => clearInterval(interval);
  }, [mode, quotes, tapSignal]);

  // Tapping the cat blurts a random quote (works in any phase).
  useEffect(() => {
    if (!tapSignal) return; // ignore the initial 0/undefined
    const pool = quotes.length > 0 ? quotes : ['Meow! 🐾'];
    setText(pool[Math.floor(Math.random() * pool.length)]);
  }, [tapSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-close any bubble after AUTO_CLOSE_MS. Resets whenever the text changes
  // (e.g. a new quote / a tap), so each bubble gets its own full 7 seconds.
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(() => setText(null), AUTO_CLOSE_MS);
    return () => clearTimeout(t);
  }, [text]);

  if (!text) return null;

  return (
    <Pressable
      accessibilityLabel="Dismiss Mochi"
      onPress={() => setText(null)}
      style={styles.wrap}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{text}</Text>
      </View>
      {/* little pointer tail under the bubble */}
      <View style={styles.tail} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  bubble: {
    maxWidth: 260,
    paddingVertical: HavenSpacing.md,
    paddingHorizontal: HavenSpacing.lg,
    backgroundColor: HavenColors.parchment,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
    boxShadow: `${ShadowOffset.two}px ${ShadowOffset.two}px 0px ${HavenColors.leatherShadow}`,
  },
  text: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.lg,
    color: HavenColors.ink,
    textAlign: 'center',
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: HavenColors.ink,
  },
});
