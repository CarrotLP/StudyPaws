import { View } from 'react-native';

import { PixelScale } from '../constants/havenTheme';
import { ITEM_PALETTE, ITEM_SPRITES, type ItemId, SILHOUETTE_COLOR } from './itemSprites';

type ItemIconProps = {
  id: ItemId;
  scale?: number;
  silhouette?: boolean;
};

export function ItemIcon({ id, scale = PixelScale.itemSmall, silhouette = false }: ItemIconProps) {
  const grid = ITEM_SPRITES[id];
  if (!grid) return null;
  return (
    <View>
      {grid.map((row, y) => (
        <View key={y} style={{ flexDirection: 'row' }}>
          {row.split('').map((ch, x) => {
            const color =
              ch === '.'
                ? undefined
                : silhouette
                  ? SILHOUETTE_COLOR
                  : (ITEM_PALETTE[ch] ?? 'transparent');
            return <View key={`${y}-${x}`} style={{ width: scale, height: scale, backgroundColor: color }} />;
          })}
        </View>
      ))}
    </View>
  );
}
