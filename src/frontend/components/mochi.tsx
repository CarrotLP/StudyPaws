import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { type OutfitState } from '../hooks/use-outfit';

export const LAYER_ORDER = [
  'back_body',
  'back_accessory',
  'body',
  'front_accessory',
  'front_body',
] as const;

export type MochiLayerCategory = (typeof LAYER_ORDER)[number];

export interface MochiAsset {
  source: any;
  category: MochiLayerCategory;
  x?: number; // Offset in "design pixels"
  y?: number;
}

const shiftUp: number = 20;

// Registry of all mochi-related assets
// x and y are offsets relative to the Mochi's top-left origin.
export const MOCHI_ASSETS: Record<string, MochiAsset> = {
  // Body parts (Character 1 / c3)
  c3_shadow: { source: require('./mochis/character1/c3_shadow.png'), category: 'back_body', x: 0, y: shiftUp +  0 },
  c3_tail: { source: require('./mochis/character1/c3_tail.png'), category: 'back_body', x: 0, y: shiftUp + 0 },
  c3_body: { source: require('./mochis/character1/c3_body.png'), category: 'body', x: 0, y: shiftUp + 0 },
  c3_eyes: { source: require('./mochis/character1/c3_eyes.png'), category: 'front_body', x: 0, y: shiftUp + 0 },
  c3_larm: { source: require('./mochis/character1/c3_larm.png'), category: 'front_body', x: 100, y: shiftUp + 80 },
  c3_rarm: { source: require('./mochis/character1/c3_rarm.png'), category: 'front_body', x: 20, y: shiftUp + 100 },
  c3_lfoot: { source: require('./mochis/character1/c3_lfoot.png'), category: 'front_body', x: 0, y: shiftUp + 0 },
  c3_rfoot: { source: require('./mochis/character1/c3_rfoot.png'), category: 'front_body', x: 0, y: shiftUp + 0 },
  c3_whirly_eyes: { source: require('./mochis/character1/c3_whirly_eyes.png'), category: 'front_body', x: 0, y: shiftUp + 0 },

  // Accessories (PNG versions)
  lvest: { source: require('./accessories/lvest.png'), category: 'front_accessory', x: 0, y: shiftUp + 80 },
  rvest: { source: require('./accessories/rvest.png'), category: 'front_accessory', x: 0, y: shiftUp + 0 },
  kid_cap: { source: require('./accessories/kid_cap.png'), category: 'front_accessory', x: 0, y: shiftUp + 0 },

  // Temporary Mappings for pixel items to show on Mochi - TODO: DELETE
  scarf: { source: require('./accessories/lvest.png'), category: 'front_accessory', x: 0, y: 0 },
  glasses: { source: require('./accessories/kid_cap.png'), category: 'front_accessory', x: 0, y: 0 },
  beret: { source: require('./accessories/kid_cap.png'), category: 'front_accessory', x: 0, y: 0 },
  bowtie: { source: require('./accessories/lvest.png'), category: 'front_accessory', x: 0, y: 0 },
  flower: { source: require('./accessories/kid_cap.png'), category: 'front_accessory', x: 0, y: 0 },
  sweater: { source: require('./accessories/rvest.png'), category: 'front_accessory', x: 0, y: 0 },
  monocle: { source: require('./accessories/kid_cap.png'), category: 'front_accessory', x: 0, y: 0 },
  crown: { source: require('./accessories/kid_cap.png'), category: 'front_accessory', x: 0, y: 0 },
  bandana: { source: require('./accessories/lvest.png'), category: 'front_accessory', x: 0, y: 0 },
};

// The base scale factor for all Mochi assets.
const GLOBAL_MOCHI_SCALE = 0.33;

interface MochiProps {
  id?: string; // If provided, render just this single asset (icon mode)
  outfit?: OutfitState; // If provided, render the full layered character
  scale?: number;
  silhouette?: boolean;
}

export function Mochi({ id, outfit, scale = 1, silhouette = false }: MochiProps) {
  const finalScale = scale * GLOBAL_MOCHI_SCALE;
  const layers: MochiAsset[] = [];


    // TODO: instead, load all of body, and chosen accessories
    // body
    layers.push(MOCHI_ASSETS.c3_body);
    layers.push(MOCHI_ASSETS.c3_rarm);

    // accessories
    layers.push(MOCHI_ASSETS.lvest);


  const sortedLayers = [...layers].sort((a, b) => {
    return LAYER_ORDER.indexOf(a.category) - LAYER_ORDER.indexOf(b.category);
  });

  // Calculate actual bounding box to prevent overlap with other UI elements
  let maxWidth = 0;
  let maxHeight = 0;

  sortedLayers.forEach((layer) => {
    const resolved = Image.resolveAssetSource ? Image.resolveAssetSource(layer.source) : { width: 64, height: 64 };
    const w = ((resolved?.width ?? 64) + (layer.x ?? 0)) * finalScale;
    const h = ((resolved?.height ?? 64) + (layer.y ?? 0)) * finalScale;
    if (w > maxWidth) maxWidth = w;
    if (h > maxHeight) maxHeight = h;
  });

  return (
    <View style={{ width: maxWidth, height: maxHeight }}>
      {sortedLayers.map((layer, index) => {
        const resolved = Image.resolveAssetSource ? Image.resolveAssetSource(layer.source) : { width: 64, height: 64 };
        const width = (resolved?.width ?? 64) * finalScale;
        const height = (resolved?.height ?? 64) * finalScale;

        const x = (layer.x ?? 0) * finalScale;
        const y = (layer.y ?? 0) * finalScale;

        return (
          <Image
            key={`${index}-${layer.category}-${layer.source}`}
            source={layer.source}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: width,
              height: height,
              tintColor: silhouette ? '#3A2418' : undefined,
            }}
          />
        );
      })}
    </View>
  );
}
