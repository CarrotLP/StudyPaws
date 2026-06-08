import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export const LAYER_ORDER = [
  'back_body',
  'back_accessory',
  'body',
  'front_accessory',
  'front_body',
] as const;

export type MochiLayerCategory = (typeof LAYER_ORDER)[number];

export interface MochiLayer {
  source: any;
  category: MochiLayerCategory;
  x: number;
  y: number;
}

// Assets
const c3_body = require('./mochis/character1/c3_body.png');
const c3_rarm = require('./mochis/character1/c3_rarm.png');
const lvest = require('./accessories/lvest.png');

const DEFAULT_LAYERS: MochiLayer[] = [
  { source: c3_body, category: 'body', x: 0, y: 0 },
  { source: c3_rarm, category: 'front_body', x: 0, y: 0 },
  { source: lvest, category: 'front_accessory', x: 0, y: 0 },
];

interface MochiProps {
  id?: string;
  scale?: number;
  silhouette?: boolean;
}

export function Mochi({ id, scale = 1, silhouette = false }: MochiProps) {
  const sortedLayers = [...DEFAULT_LAYERS].sort((a, b) => {
    return LAYER_ORDER.indexOf(a.category) - LAYER_ORDER.indexOf(b.category);
  });

  // Base size for the Mochi. We can adjust this as needed.
  // Using a fixed size for the container to hold the absolute-positioned layers.
  const baseSize = 64;
  const size = baseSize * scale;

  return (
    <View style={{ width: size, height: size }}>
      {sortedLayers.map((layer, index) => (
        <Image
          key={index}
          source={layer.source}
          style={[
            StyleSheet.absoluteFill,
            {
              left: layer.x * scale,
              top: layer.y * scale,
              width: '100%',
              height: '100%',
              resizeMode: 'contain',
              tintColor: silhouette ? '#3A2418' : undefined,
            },
          ]}
        />
      ))}
    </View>
  );
}
