import { useEffect, useRef, useState } from 'react';
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

// Fixed supportive line shown while the user is setting up a focus block (idle).
const IDLE_LINE = 'Time to study!';

// How often a fresh study quote pops up (cosmetic only — not a source of truth
// for time, so a plain interval is fine here).
const REPEAT_MS = 25000;
// A part of a multi-`|` quote auto-advances to the next part after this long.
const AUTO_PART_MS = 3500;

// Typewriter / single-line dialogue tuning.

// Author manual line breaks by putting this delimiter in the quote text, e.g.
//   "Focus, hooman.|This is no time|to be kitten around."
const LINE_DELIM = '|';

/**
 * Turns a quote into the lines to type out. If the author put `|` breaks in the
 * text, each segment is its own typed line. Otherwise the whole quote is one
 * entry that simply wraps in a taller box (no auto-splitting).
 */
function toLines(text: string): string[] {
  if (text.includes(LINE_DELIM)) {
    return text
      .split(LINE_DELIM)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }
  return [text.trim()];
}

type Mode = 'study' | 'break' | 'idle' | null;

export function MochiSpeech({
  mode,
  personality,
  tapSignal,
}: {
  mode: Mode;
  // Which personality's study quotes to show. Omit for all (until a selector exists).
  personality?: MochiPersonality;
  // Increment this (e.g. on every cat tap) to advance / summon a quote.
  tapSignal?: number;
}) {
  const [text, setText] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<string[]>([]);
  // Which part of the current (possibly multi-`|`) quote is showing.
  const [partIndex, setPartIndex] = useState(0);

  // The current quote split into parts on `|` (each part is its own bubble).
  const parts = text ? toLines(text) : [];
  const isLastPart = partIndex >= parts.length - 1;

  // Latest values readable inside the tap handler (which only depends on tapSignal).
  const partIndexRef = useRef(partIndex);
  const partsRef = useRef<string[]>(parts);
  const quotesRef = useRef<string[]>(quotes);
  const textRef = useRef<string | null>(text);
  partIndexRef.current = partIndex;
  partsRef.current = parts;
  quotesRef.current = quotes;
  textRef.current = text;

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

  // Fixed-line modes: break shows the daily-quest nudge, idle shows the
  // "Time to study!" prompt. Study has its own periodic effect; null clears.
  useEffect(() => {
    if (mode === 'break') setText(BREAK_LINE);
    else if (mode === 'idle') setText(IDLE_LINE);
    else if (mode !== 'study') setText(null);
  }, [mode]);

  // Study: periodically pop a random quote.
  useEffect(() => {
    if (mode !== 'study') return;
    const pick = () => {
      if (quotes.length === 0) return;
      setText(quotes[Math.floor(Math.random() * quotes.length)]);
    };
    const interval = setInterval(pick, REPEAT_MS);
    return () => clearInterval(interval);
  }, [mode, quotes, tapSignal]);

  // Each new quote starts at its first part.
  useEffect(() => {
    setPartIndex(0);
  }, [text]);

  // Cat tap: advance to the next part, or — on the last part / when nothing is
  // showing — summon a NEW random quote. (Spam is buffered by the caller.)
  useEffect(() => {
    if (!tapSignal) return; // ignore initial 0/undefined
    const curParts = partsRef.current;
    if (partIndexRef.current < curParts.length - 1) {
      setPartIndex((i) => i + 1);
      return;
    }
    const pool = quotesRef.current.length > 0 ? quotesRef.current : ['Meow! 🐾'];
    let next = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1) {
      while (next === textRef.current) next = pool[Math.floor(Math.random() * pool.length)];
    }
    setText(next);
  }, [tapSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Every part ticks on the same timer: non-last parts advance to the next, and
  // the last part auto-closes the quote (so the whole thing dismisses on its own
  // with consistent timing).
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(() => {
      if (isLastPart) setText(null);
      else setPartIndex((i) => i + 1);
    }, AUTO_PART_MS);
    return () => clearTimeout(t);
  }, [text, partIndex, isLastPart]);

  if (!text) return null;

  const displayed = parts[partIndex] ?? '';

  // Pressing the bubble closes the quote.
  const onPressBubble = () => setText(null);

  return (
    <Pressable
      accessibilityLabel="Close"
      onPress={onPressBubble}
      style={styles.wrap}>
      <View style={styles.bubbleColumn}>
        <View style={styles.bubble}>
          <Text style={styles.text}>{displayed}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // Left-anchor past the top-left menu button (44px + inset) and let the
    // bubble grow into the open space on the right.
    alignItems: 'flex-start',
    paddingLeft: 64,
    paddingRight: HavenSpacing.md,
    zIndex: 50,
  },
  // Keeps the tail centered under the bubble while the column itself is left-anchored.
  bubbleColumn: {
    alignItems: 'center',
  },
  bubble: {
    // Hug the content (no fixed width) and cap with maxWidth so the FULL line
    // always shows — never truncated to "...". Lines are pre-chunked short
    // enough (MAX_LINE_CHARS) to stay on one line within this width.
    maxWidth: 400,
    paddingVertical: HavenSpacing.sm,
    paddingHorizontal: HavenSpacing.md,
    backgroundColor: HavenColors.parchment,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
    boxShadow: `${ShadowOffset.two}px ${ShadowOffset.two}px 0px ${HavenColors.leatherShadow}`,
  },
  text: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.md,
    color: HavenColors.ink,
    textAlign: 'center',
  },
});
