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

// Fixed supportive line shown while the user is setting up a focus block (idle).
const IDLE_LINE = 'Time to study!';

// How often a fresh study quote pops up (cosmetic only — not a source of truth
// for time, so a plain interval is fine here).
const REPEAT_MS = 25000;

// Typewriter / single-line dialogue tuning.
const TYPE_MS = 25; // delay between each character appearing
const LINE_PAUSE_MS = 550; // pause after a line is fully typed before the next one
const HOLD_MS = 2500; // how long the final line lingers before auto-closing

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
  onSpeakingChange,
}: {
  mode: Mode;
  // Which personality's study quotes to show. Omit for all (until a selector exists).
  personality?: MochiPersonality;
  // Increment this (e.g. on every cat tap) to make Mochi blurt a random quote.
  tapSignal?: number;
  // Reports whether a quote is currently showing/typing (so the cat can be made
  // untappable while it runs).
  onSpeakingChange?: (speaking: boolean) => void;
}) {
  const [text, setText] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<string[]>([]);

  // Typewriter state: the quote split into single lines, plus which line and how
  // many of its characters are currently revealed.
  const [lines, setLines] = useState<string[]>([]);
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

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

  // Tell the parent whether a quote is currently up (so the cat can ignore taps
  // while one is running).
  useEffect(() => {
    onSpeakingChange?.(text !== null);
  }, [text, onSpeakingChange]);

  // Whenever the quote changes, split it into single lines and restart at the top.
  useEffect(() => {
    if (!text) {
      setLines([]);
      setLineIndex(0);
      setCharIndex(0);
      return;
    }
    setLines(toLines(text));
    setLineIndex(0);
    setCharIndex(0);
  }, [text]);

  // Typewriter driver: reveal the current line one char at a time, pause, then
  // advance to the next line; after the last line, hold briefly and close.
  useEffect(() => {
    if (lines.length === 0) return;
    const line = lines[lineIndex] ?? '';

    if (charIndex < line.length) {
      const t = setTimeout(() => setCharIndex((c) => c + 1), TYPE_MS);
      return () => clearTimeout(t);
    }
    if (lineIndex < lines.length - 1) {
      const t = setTimeout(() => {
        setLineIndex((i) => i + 1);
        setCharIndex(0);
      }, LINE_PAUSE_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setText(null), HOLD_MS);
    return () => clearTimeout(t);
  }, [lines, lineIndex, charIndex]);

  if (!text || lines.length === 0) return null;

  const displayed = (lines[lineIndex] ?? '').slice(0, charIndex);

  return (
    <Pressable
      accessibilityLabel="Dismiss Mochi"
      onPress={() => setText(null)}
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
