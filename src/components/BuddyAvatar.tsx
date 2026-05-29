import { View } from 'react-native';

import { PixelScale } from '@/constants/havenTheme';

// Dark outline + pink nose are fixed; fur/accent come from buddy data.
const DARK = '#1A0F08';
const NOSE = '#E89878';

// 12x12 cat head, ported verbatim from haven_prototype.html (BuddyAvatar),
// including the original padEnd/slice that squares off each row.
const SPRITE = [
  '....kkkk....',
  '..kkffffkk..',
  '.kkffaaffkk.',
  '.kfffffffk..',
  'kffffffffkf.',
  'kffkffkffff.',
  'kffffffffff.',
  '.kffpkpfff..',
  '.kfffpfffk..',
  '..kffffffk..',
  '...kkkkkk...',
  '............',
].map((r) => r.padEnd(12, '.').slice(0, 12));

type BuddyAvatarProps = {
  fur: string;
  accent: string;
  scale?: number;
};

export function BuddyAvatar({ fur, accent, scale = PixelScale.buddy }: BuddyAvatarProps) {
  return (
    <View>
      {SPRITE.map((row, y) => (
        <View key={y} style={{ flexDirection: 'row' }}>
          {row.split('').map((ch, x) => {
            const color =
              ch === 'k' ? DARK : ch === 'f' ? fur : ch === 'a' ? accent : ch === 'p' ? NOSE : undefined;
            return <View key={`${y}-${x}`} style={{ width: scale, height: scale, backgroundColor: color }} />;
          })}
        </View>
      ))}
    </View>
  );
}
