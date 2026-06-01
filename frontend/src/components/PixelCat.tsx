import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

import { CatPalette, HavenFonts, PixelScale, SpriteSize } from '../constants/havenTheme';

export type OutfitSlot = 'head' | 'face' | 'neck' | 'body';
export type OutfitState = Record<OutfitSlot, string | null>;

// Awake cat (eyes softly open) — ported verbatim from haven_prototype.html.
const CAT_SPRITE_AWAKE = [
  '................................',
  '................................',
  '....kk........................kk',
  '...kKKk......................kKKk'.padEnd(32, '.'),
  '..kKOOKk....................kKOOKk'.padEnd(32, '.'),
  '..kKOoOKk..................kKOoOKk'.padEnd(32, '.'),
  '..kKOoooKkk..............kkKoooOKk'.padEnd(32, '.'),
  '..kKOooooKKKkkkkkkkkkkKKKKooooOKk'.substring(0, 32),
  '..kKOoooopKKoooooooooooKKpoooOKk.'.substring(0, 32),
  '..kKOoolooKooooooollooooKoooooKk.'.substring(0, 32),
  '...kKollllooollllllllllooolllKk..',
  '....kollllolllmmmmmmmmlllollllk..',
  '....kollllllmmmmmmmmmmmmllllllk..',
  '....kKllllmmwwmmmmmmwwmmllllllKk.',
  '....kKlllmmwekmmmmmmkewmmlllllKk.',
  '....kKlllmmEekmppppmkeEmmlllllKk.',
  '.....kKllmmmmmppppppmmmmmmlllKk..',
  '.....kKlllmmmmmpPPPpmmmmmmlllKk..',
  '......kKllllllmmmmmmmmmlllllKk...',
  '.......kKlllllllllllllllllllKk...',
  '.......kKoooollllllllllllooooKk..',
  '......kKooosossooooooossossoooKk.',
  '......kKoossssoooooooossssooooKk.',
  '.....kKooosssooooooocooosssoooKk.',
  '.....kKoooosoooooocccccooosoooKk.',
  '.....kKoooooooooocccccccoooooooKk',
  '.....kKooooooooocccccccccoooooKk.',
  '......kKoooooooocccccccccoooKk...',
  '......kKKoooooooocccccccoooKKk...',
  '.......kKKoooooooooooooooKKk.....',
  '.........kKKKKKKKKKKKKKKKk.......',
  '...........kkkkkkkkkkkkk.........',
];

// Sleeping cat: curled up, eyes shut, head down — ported verbatim.
const CAT_SPRITE_SLEEP = [
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '..............kk....kk..........',
  '.............kKKkkkkKKk.........',
  '............kKOOOOOOOOKk........',
  '...........kKOooooooooOKk.......',
  '..........kKOolllllllooOKk......',
  '.........kKollmmmmmmmmlloKk.....',
  '.........kollmmmmmmmmmmllok.....',
  '........kKollmmmmmmmmmmllOKk....',
  '........kKollmkkkkkkkkmllOKk....',
  '........kKollmmmppppmmmllOKk....',
  '.........kKllmmmmmmmmmmllKk.....',
  '..........kKllllllllllllKk......',
  '........kKKooolllllllllooKKk....',
  '.......kKoooollllllllllllooKk...',
  '......kKooossossooooooossossoKk.',
  '.....kKooossssoooooooossssoooKk.',
  '.....kKoooosoooocccccccoosoooKk.',
  '....kKoooooooooccccccccccoooooK.',
  '....kKooooooooocccccccccccoooKk.',
  '.....kKoooooooocccccccccccoooKk.',
  '.....kKKoooooooocccccccccoooKKk.',
  '......kKKoooooooooccccccooKKk...',
  '.......kKKooooooooooooooKKk.....',
  '........kKKKoooooooooooKKKk.....',
  '..........kKKKKKKKKKKKKKk.......',
  '............kkkkkkkkkkkk........',
  '................................',
];

type PixelCatProps = {
  outfit: OutfitState;
  scale?: number;
  sleeping?: boolean;
};

export function PixelCat({ outfit, scale = PixelScale.catDefault, sleeping = false }: PixelCatProps) {
  const sprite = sleeping ? CAT_SPRITE_SLEEP : CAT_SPRITE_AWAKE;

  const breathe = useSharedValue(0);
  const zzz = useSharedValue(0);

  // breathe: 0 -> peak -> 0 yoyo. Awake matches CSS `breathe` 4s (-2px);
  // sleeping matches `breathe-slow` 5s (-1px + 1.015 scale).
  useEffect(() => {
    breathe.value = 0;
    breathe.value = withRepeat(
      withTiming(1, { duration: sleeping ? 2500 : 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [sleeping, breathe]);

  // zzz: one-directional 3s loop matching CSS `zzz-float`.
  useEffect(() => {
    if (!sleeping) return;
    zzz.value = 0;
    zzz.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [sleeping, zzz]);

  const breatheStyle = useAnimatedStyle(() => {
    const translateY = sleeping ? -breathe.value : breathe.value * -2;
    const scaleValue = sleeping ? 1 + breathe.value * 0.015 : 1;
    return { transform: [{ translateY }, { scale: scaleValue }] };
  });

  const zzzStyle = useAnimatedStyle(() => {
    const opacity = interpolate(zzz.value, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
    const translateX = interpolate(zzz.value, [0, 1], [0, 8]);
    const translateY = interpolate(zzz.value, [0, 1], [0, -16]);
    return { opacity, transform: [{ translateX }, { translateY }] };
  });

  return (
    <Animated.View
      style={[
        { width: SpriteSize.cat.cols * scale, height: SpriteSize.cat.rows * scale },
        breatheStyle,
      ]}>
      {sprite.map((row, y) => (
        <View key={y} style={styles.row}>
          {row.split('').map((ch, x) => {
            const color = ch === '.' ? undefined : CatPalette[ch as keyof typeof CatPalette] ?? 'transparent';
            return <View key={`${y}-${x}`} style={{ width: scale, height: scale, backgroundColor: color }} />;
          })}
        </View>
      ))}

      {!sleeping && <CatOutfitLayers outfit={outfit} scale={scale} />}

      {sleeping && <Animated.Text style={[styles.zzz, zzzStyle]}>Z z z</Animated.Text>}
    </Animated.View>
  );
}

function CatOutfitLayers({ outfit, scale }: { outfit: OutfitState; scale: number }) {
  const px = (x: number, y: number, w: number, h: number, color: string) => (
    <View
      key={`${x}-${y}-${w}-${h}-${color}`}
      style={{
        position: 'absolute',
        left: x * scale,
        top: y * scale,
        width: w * scale,
        height: h * scale,
        backgroundColor: color,
      }}
    />
  );
  return (
    <>
      {outfit.body === 'sweater' && (
        <>
          {px(6, 21, 20, 6, '#8E5C7C')}{px(7, 20, 18, 1, '#6E4361')}{px(6, 27, 20, 1, '#6E4361')}
          {px(10, 22, 1, 4, '#6E4361')}{px(15, 22, 1, 4, '#6E4361')}{px(20, 22, 1, 4, '#6E4361')}
        </>
      )}
      {outfit.neck === 'scarf' && (
        <>
          {px(7, 19, 18, 3, '#A14444')}{px(8, 18, 16, 1, '#C45757')}
          {px(13, 22, 6, 6, '#A14444')}
          {px(14, 23, 1, 4, '#7A2E2E')}{px(16, 23, 1, 4, '#7A2E2E')}{px(18, 23, 1, 4, '#7A2E2E')}
        </>
      )}
      {outfit.neck === 'bowtie' && (
        <>
          {px(11, 19, 4, 3, '#7E5990')}{px(17, 19, 4, 3, '#7E5990')}{px(15, 19, 2, 3, '#5E3F70')}
        </>
      )}
      {outfit.neck === 'bandana' && (
        <>
          {px(7, 19, 18, 3, '#B73838')}{px(8, 18, 16, 1, '#D45050')}
          {px(10, 19, 2, 1, '#FFF')}{px(15, 20, 2, 1, '#FFF')}{px(20, 19, 2, 1, '#FFF')}
          {px(22, 22, 4, 4, '#B73838')}
        </>
      )}
      {outfit.face === 'glasses' && (
        <>
          {px(10, 13, 5, 1, '#2A1810')}{px(10, 16, 5, 1, '#2A1810')}
          {px(10, 14, 1, 2, '#2A1810')}{px(14, 14, 1, 2, '#2A1810')}
          {px(17, 13, 5, 1, '#2A1810')}{px(17, 16, 5, 1, '#2A1810')}
          {px(17, 14, 1, 2, '#2A1810')}{px(21, 14, 1, 2, '#2A1810')}
          {px(15, 14, 2, 1, '#2A1810')}
          {px(11, 14, 3, 2, 'rgba(180,220,255,0.18)')}
          {px(18, 14, 3, 2, 'rgba(180,220,255,0.18)')}
        </>
      )}
      {outfit.face === 'monocle' && (
        <>
          {px(17, 12, 5, 1, '#D4A82C')}{px(17, 17, 5, 1, '#D4A82C')}
          {px(17, 13, 1, 4, '#D4A82C')}{px(21, 13, 1, 4, '#D4A82C')}
          {px(18, 13, 3, 4, 'rgba(255,220,140,0.25)')}
          {px(22, 17, 1, 1, '#D4A82C')}{px(23, 18, 1, 1, '#D4A82C')}{px(23, 19, 1, 1, '#D4A82C')}
        </>
      )}
      {outfit.head === 'beret' && (
        <>
          {px(7, 3, 18, 3, '#3E5444')}{px(8, 2, 16, 1, '#536B5A')}{px(9, 1, 14, 1, '#3E5444')}
          {px(20, 0, 3, 2, '#2D3F34')}{px(21, 1, 1, 1, '#536B5A')}
        </>
      )}
      {outfit.head === 'flower' && (
        <>
          {px(6, 4, 2, 2, '#FFFAF0')}{px(7, 5, 1, 1, '#F2C94C')}
          {px(10, 2, 2, 2, '#FFFAF0')}{px(11, 3, 1, 1, '#F2C94C')}
          {px(14, 1, 2, 2, '#FFFAF0')}{px(15, 2, 1, 1, '#F2C94C')}
          {px(18, 1, 2, 2, '#FFFAF0')}{px(19, 2, 1, 1, '#F2C94C')}
          {px(22, 2, 2, 2, '#FFFAF0')}{px(23, 3, 1, 1, '#F2C94C')}
          {px(25, 4, 2, 2, '#FFFAF0')}{px(26, 5, 1, 1, '#F2C94C')}
          {px(9, 5, 1, 1, '#7BA05B')}{px(17, 3, 1, 1, '#7BA05B')}{px(24, 4, 1, 1, '#7BA05B')}
        </>
      )}
      {outfit.head === 'crown' && (
        <>
          {px(10, 3, 12, 2, '#D4A82C')}
          {px(11, 2, 1, 1, '#D4A82C')}{px(15, 1, 2, 1, '#D4A82C')}{px(20, 2, 1, 1, '#D4A82C')}
          {px(11, 1, 1, 1, '#D4A82C')}{px(20, 1, 1, 1, '#D4A82C')}
          {px(13, 3, 1, 1, '#C45757')}{px(18, 3, 1, 1, '#4A8FBC')}
          {px(15, 3, 2, 1, '#7BC9E8')}
          {px(10, 5, 12, 1, '#8C6B14')}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  zzz: {
    position: 'absolute',
    top: -10,
    right: -10,
    fontFamily: HavenFonts.pixel,
    fontSize: 14,
    color: 'rgba(26, 15, 8, 0.7)',
    letterSpacing: 2.8,
  },
});
