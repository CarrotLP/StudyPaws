import { View } from 'react-native';

import { PixelCat, type OutfitState } from '@/components/PixelCat';
import { HavenColors } from '@/constants/havenTheme';

// TEMPORARY debug screen — verifies the PixelCat port renders. Delete when done.
const EMPTY_OUTFIT: OutfitState = { head: null, face: null, neck: null, body: null };

export default function DebugPixelCat() {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        backgroundColor: HavenColors.backdropEdge,
      }}>
      <PixelCat outfit={EMPTY_OUTFIT} sleeping={false} scale={5} />
      <PixelCat outfit={EMPTY_OUTFIT} sleeping={true} scale={5} />
    </View>
  );
}
