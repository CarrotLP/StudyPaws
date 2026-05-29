import { View } from 'react-native';

import { ChestColors, PixelScale } from '@/constants/havenTheme';

// Sprites ported verbatim from haven_prototype.html (PixelChest). 16 x 14 grid.
const CLOSED = [
  '...kkkkkkkkkkk..',
  '..kggggggggggk..',
  '.kgGGGGGGGGGGgk.',
  'kgGGGGGGGGGGGGgk',
  'kgGGkkkkkkkkGGgk',
  'kgGGkYYYYYYkGGgk',
  'kgGGkYykkyYkGGgk',
  'kgGGkYkkkkYkGGgk',
  'kgGGkYYYYYYkGGgk',
  'kgGGkkkkkkkkGGgk',
  'kgGGGGGGGGGGGGgk',
  'kgGGGGGGGGGGGGgk',
  '.kkkkkkkkkkkkkk.',
  '................',
];

const OPEN = [
  '.kkkkkkkkkkkk...',
  'kggggggggggggk..',
  'kgGGGGGGGGGGGgk.',
  'kbbbbbbbbbbbbbk.',
  'kbBBBBBBBBBBBbk.',
  '................',
  '..kkkkkkkkkkkk..',
  '.kgGGGYYYYYGGgk.',
  'kgGGGYY**YYGGgk.',
  'kgGGGGYYYYYGGgk.',
  'kgGGGGGGGGGGGgk.',
  'kgGGGGGGGGGGGgk.',
  '.kkkkkkkkkkkkk..',
  '................',
];

// Shift a hex colour by `amt` per channel (matches the prototype's `adjust`).
function adjust(hex: string, amt: number) {
  const num = parseInt(hex.replace('#', ''), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp((num >> 16) + amt);
  const g = clamp(((num >> 8) & 0x00ff) + amt);
  const b = clamp((num & 0x0000ff) + amt);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

type PixelChestProps = {
  color?: string;
  scale?: number;
  open?: boolean;
};

export function PixelChest({
  color = ChestColors.small,
  scale = PixelScale.chestCard,
  open = false,
}: PixelChestProps) {
  const sprite = open ? OPEN : CLOSED;
  const palette: Record<string, string> = {
    k: '#1A0F08',
    g: adjust(color, -30),
    G: color,
    Y: '#D4A82C',
    y: '#8C6B14',
    b: '#FFE9A3',
    B: '#FFF6C8',
    '*': '#FFFFFF',
  };
  return (
    <View>
      {sprite.map((row, y) => (
        <View key={y} style={{ flexDirection: 'row' }}>
          {row.split('').map((ch, x) => {
            const fill = ch === '.' ? undefined : (palette[ch] ?? 'transparent');
            return <View key={`${y}-${x}`} style={{ width: scale, height: scale, backgroundColor: fill }} />;
          })}
        </View>
      ))}
    </View>
  );
}
