import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';

import { supabase } from '@/backend/lib/supabase';

import { useAuth } from '../hooks/use-auth';
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
  width?: number;
  height?: number;
}

const shiftUp: number = 0;
const shiftRight: number = 50;

// Config for body parts - x, y, and category
// These are used to position the images fetched from the characters table
export const MOCHI_BODY: Record<string, { category: MochiLayerCategory; x: number; y: number }> = {
  shadow: { category: 'back_body', x: shiftRight + 0, y: shiftUp + 150 },
  tail: { category: 'back_body', x: shiftRight + -60, y: shiftUp + 120 },
  body: { category: 'body', x: shiftRight + 0, y: shiftUp + 0 },
  eyes: { category: 'front_body', x: shiftRight + 80, y: shiftUp + 50 },
  larm: { category: 'back_body', x: shiftRight + 115, y: shiftUp + 90 },
  rarm: { category: 'front_body', x: shiftRight + 20, y: shiftUp + 100 },
  rfoot: { category: 'body', x: shiftRight + 20, y: shiftUp + 160 },
  lfoot: { category: 'back_body', x: shiftRight + 90, y: shiftUp + 160 },
//   whirly_eyes: { category: 'front_body', x: shiftRight + 0, y: shiftUp + 0 },
};

// The base scale factor for all Mochi assets.
const GLOBAL_MOCHI_SCALE = 0.7;

interface MochiProps {
  id?: string; // If provided, render just this single asset (icon mode)
  outfit?: OutfitState; // If provided, render the full layered character
  scale?: number;
  silhouette?: boolean;
}

export function Mochi({ id, outfit, scale = 1, silhouette = false }: MochiProps) {
  const { user } = useAuth();
  const [layers, setLayers] = useState<MochiAsset[]>([]);
  const finalScale = scale * GLOBAL_MOCHI_SCALE;

  useEffect(() => {
    async function fetchMochiData() {
      if (!user) return;

      try {
        // Returns null if the image can't be loaded (e.g. the file is missing in
        // the bucket) so the caller can SKIP that layer rather than rendering a
        // giant 512x512 fallback box that throws off the whole composite.
        const getImageSize = (
          uri: string,
        ): Promise<{ width: number; height: number } | null> => {
          return new Promise((resolve) => {
            Image.getSize(
              uri,
              (width, height) => resolve({ width, height }),
              () => resolve({ width: 512, height: 512 }), // Fallback
            );
          });
        };

        // 1. Find the character the user has chosen. maybeSingle() returns null
        //    (instead of throwing) when the users row doesn't exist yet.
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('character')
          .eq('user_uid', user.id)
          .maybeSingle();

        if (userError) throw userError;
        if (!userData?.character) {
          console.warn('Mochi: no users row / character for this user yet.');
          return;
        }

        // 2. Get the images for that character's body component images
        const { data: charData, error: charError } = await supabase
          .from('characters')
          .select('*')
          .eq('name', userData.character)
          .maybeSingle();

        if (charError) throw charError;
        if (!charData) {
          console.warn(`Mochi: no characters row named "${userData.character}".`);
          return;
        }

        const bodyLayers: MochiAsset[] = [];
        const bodyPromises: Promise<MochiAsset | null>[] = Object.entries(MOCHI_BODY).map(async ([key, config]) => {
          const imageUrl = charData[key];
          if (imageUrl) {
            const size = await getImageSize(imageUrl);
            if (!size) return null; // missing file → skip this layer
            return {
              source: { uri: imageUrl },
              category: config.category,
              x: config.x,
              y: config.y,
              width: size.width,
              height: size.height,
            };
          }
          return null;
        });

        const resolvedBodyLayers = (await Promise.all(bodyPromises)).filter(
          (l): l is MochiAsset => !!l,
        );
        console.log('Body layers loaded:', resolvedBodyLayers.length);

        // 3. Load any accessories associated with the user
        const { data: userAccessories, error: accError } = await supabase
          .from('users_accessories')
          .select('accessory')
          .eq('user', user.id)
          .eq('chosen', true);

        console.log('DEBUG: User ID:', user.id);
        console.log('DEBUG: User accessories response:', JSON.stringify(userAccessories), 'Error:', accError);

        const accessoryLayers: MochiAsset[] = [];
        if (!accError && userAccessories && userAccessories.length > 0) {
          const accessoryNames = userAccessories.map((ua) => ua.accessory);
          console.log('DEBUG: Accessory names:', accessoryNames);

          const { data: components, error: compError } = await supabase
            .from('accessories_components')
            .select('components')
            .in('accessory_name', accessoryNames);

          console.log('DEBUG: Components response:', JSON.stringify(components), 'Error:', compError);

          if (!compError && components && components.length > 0) {
            const componentNames = components
              .map((c) => c.components)
              .filter((c): c is string => !!c);

            console.log('DEBUG: Component names to fetch:', componentNames);

            const { data: compData, error: compDataError } = await supabase
              .from('components')
              .select('image, x, y, layer, image_name')
              .in('image_name', componentNames);

            console.log('DEBUG: Component metadata response:', JSON.stringify(compData), 'Error:', compDataError);

            if (!compDataError && compData) {
              const accPromises = compData.map(async (c): Promise<MochiAsset | null> => {
                const size = await getImageSize(c.image);
                if (!size) return null; // missing file → skip
                console.log(`DEBUG: Accessory component ${c.image_name} - x:${c.x}, y:${c.y}, layer:${c.layer}`);
                return {
                  source: { uri: c.image },
                  category: c.layer as MochiLayerCategory,
                  x: Number(c.x) + shiftRight,
                  y: Number(c.y) + shiftUp, // Apply the same vertical offset as body parts
                  width: size.width,
                  height: size.height,
                };
              });
              const resolvedAccLayers = (await Promise.all(accPromises)).filter(
                (l): l is MochiAsset => !!l,
              );
              accessoryLayers.push(...resolvedAccLayers);
            }
          }
        }

        console.log('DEBUG: Total accessory layers to render:', accessoryLayers.length);
        setLayers([...resolvedBodyLayers, ...accessoryLayers]);
      } catch (err) {
        console.error('Error fetching Mochi data:', err);
      }
    }

    fetchMochiData();
  }, [user]);

  const sortedLayers = [...layers].sort((a, b) => {
    return LAYER_ORDER.indexOf(a.category) - LAYER_ORDER.indexOf(b.category);
  });

  if (layers.length === 0) return null;

  // Tight bounding box across ALL layers (in design pixels). Using min AND max
  // lets us shift the artwork so it sits centered in the container with equal
  // padding on every side — otherwise positive x/y offsets push it off-centre.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  sortedLayers.forEach((layer) => {
    const w = layer.width ?? 512;
    const h = layer.height ?? 512;
    const x = layer.x ?? 0;
    const y = layer.y ?? 0;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x + w > maxX) maxX = x + w;
    if (y + h > maxY) maxY = y + h;
  });

  const padding = 20 * finalScale;
  const containerWidth = (maxX - minX) * finalScale + padding * 2;
  const containerHeight = (maxY - minY) * finalScale + padding * 2;

  return (
    <View style={{ width: containerWidth, height: containerHeight }}>
      {sortedLayers.map((layer, index) => {
        const width = (layer.width ?? 512) * finalScale;
        const height = (layer.height ?? 512) * finalScale;

        // Position relative to the tight bounding box's top-left, plus padding.
        const x = ((layer.x ?? 0) - minX) * finalScale + padding;
        const y = ((layer.y ?? 0) - minY) * finalScale + padding;

        return (
          <Image
            key={`${index}-${layer.category}-${layer.source.uri || index}`}
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
