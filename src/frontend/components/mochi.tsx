import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { supabase } from '@/backend/lib/supabase';

import { useAuth } from '../hooks/use-auth';

export const LAYER_ORDER = [
  'back_body',
  'back_accessory',
  'headgear',
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
  part?: string; // body-part key (body/larm/rfoot/shadow/...) used to pick its walk animation
}

// Vertical body "bob" used by the walk cycle (shared by every moving part so the
// cat rises/falls as one). Must be a worklet so it can run on the UI thread.
function bobY(phase: number): number {
  'worklet';
  return -3 * (0.5 + 0.5 * Math.sin(phase * 2));
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
  scale?: number;
  silhouette?: boolean;
  // Increment this (e.g. on every cat tap) to make the cat walk for WALK_MS.
  walkSignal?: number;
  // Walk continuously (until unmounted), independent of taps.
  animate?: boolean;
}

export function Mochi({ id, scale = 1, silhouette = false }: MochiProps) {
// How long the cat walks after a tap.
const WALK_MS = 2500;

export function Mochi({
  id,
  outfit,
  scale = 1,
  silhouette = false,
  walkSignal,
  animate = false,
}: MochiProps) {
  const { user } = useAuth();
  const [layers, setLayers] = useState<MochiAsset[]>([]);
  const finalScale = scale * GLOBAL_MOCHI_SCALE;

  // Walk for WALK_MS whenever `walkSignal` changes (i.e. the cat is tapped).
  const [isWalking, setIsWalking] = useState(false);
  const walkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!walkSignal) return; // ignore initial 0/undefined
    if (walkTimer.current) clearTimeout(walkTimer.current);
    setIsWalking(true);
    walkTimer.current = setTimeout(() => setIsWalking(false), WALK_MS);
  }, [walkSignal]);
  useEffect(() => () => {
    if (walkTimer.current) clearTimeout(walkTimer.current);
  }, []);

  // Continuous `animate` OR the timed tap walk.
  const walking = animate || isWalking;

  // Tier 2 walk cycle: a single phase 0 → 2π driving every limb. sin(2π)=sin(0)
  // so the linear loop is seamless. Hooks run unconditionally (before early returns).
  const phase = useSharedValue(0);
  useEffect(() => {
    if (!walking) {
      phase.value = withTiming(0, { duration: 300 }); // ease back to rest pose
      return;
    }
    phase.value = 0;
    phase.value = withRepeat(
      withTiming(2 * Math.PI, { duration: 800, easing: Easing.linear }),
      -1,
      false,
    );
  }, [phase, walking]);

  const LIFT = 6; // px a foot rises at the top of its step
  const STRIDE = 7; // px a foot travels forward/back through its step
  const SWING = 8; // deg the arms swing
  const TAIL = 6; // deg the tail sways

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobY(phase.value) }, { translateX: 1.5 * Math.sin(phase.value) }],
  }));
  const footLeftStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bobY(phase.value) + Math.max(0, Math.sin(phase.value)) * -LIFT },
      { translateX: STRIDE * Math.sin(phase.value) },
    ],
  }));
  const footRightStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bobY(phase.value) + Math.max(0, Math.sin(phase.value + Math.PI)) * -LIFT },
      { translateX: STRIDE * Math.sin(phase.value + Math.PI) },
    ],
  }));
  const armLeftStyle = useAnimatedStyle(() => ({
    transformOrigin: 'center top',
    transform: [{ translateY: bobY(phase.value) }, { rotate: `${SWING * Math.sin(phase.value)}deg` }],
  }));
  const armRightStyle = useAnimatedStyle(() => ({
    transformOrigin: 'center top',
    transform: [
      { translateY: bobY(phase.value) },
      { rotate: `${SWING * Math.sin(phase.value + Math.PI)}deg` },
    ],
  }));
  const tailStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobY(phase.value) }, { rotate: `${TAIL * Math.sin(phase.value * 1.5)}deg` }],
  }));

  // Shadow stays planted; unmapped parts (accessories) just bob with the body.
  const styleForPart = (part?: string) => {
    switch (part) {
      case 'lfoot':
        return footLeftStyle;
      case 'rfoot':
        return footRightStyle;
      case 'larm':
        return armLeftStyle;
      case 'rarm':
        return armRightStyle;
      case 'tail':
        return tailStyle;
      default:
        return bodyStyle;
    }
  };

  // Refetch on focus (not just on mount/login) so outfit changes made on the
  // Dress tab show up when returning to a screen whose Mochi stayed mounted.
  useFocusEffect(
    useCallback(() => {
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
              part: key,
            };
          }
          return null;
        });

        const resolvedBodyLayers = (await Promise.all(bodyPromises)).filter(
          (l): l is MochiAsset => !!l,
        );

        // 3. Load any accessories associated with the user
        const { data: userAccessories, error: accError } = await supabase
          .from('users_accessories')
          .select('accessory')
          .eq('user', user.id)
          .eq('chosen', true);

        const accessoryLayers: MochiAsset[] = [];
        if (!accError && userAccessories && userAccessories.length > 0) {
          const accessoryNames = userAccessories.map((ua) => ua.accessory);

          const { data: components, error: compError } = await supabase
            .from('accessories_components')
            .select('components')
            .in('accessory_name', accessoryNames);

          if (!compError && components && components.length > 0) {
            const componentNames = components
              .map((c) => c.components)
              .filter((c): c is string => !!c);

            const { data: compData, error: compDataError } = await supabase
              .from('components')
              .select('image, x, y, layer, image_name')
              .in('image_name', componentNames);

            if (!compDataError && compData) {
              const accPromises = compData.map(async (c): Promise<MochiAsset | null> => {
                const size = await getImageSize(c.image);
                if (!size) return null; // missing file → skip
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

        setLayers([...resolvedBodyLayers, ...accessoryLayers]);
      } catch (err) {
        console.error('Error fetching Mochi data:', err);
      }
    }

      fetchMochiData();
    }, [user]),
  );

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

        const imageStyle = {
          width,
          height,
          tintColor: silhouette ? '#3A2418' : undefined,
        } as const;

        // Static when not walking, and the shadow is always static (stays planted).
        if (!walking || layer.part === 'shadow') {
          return (
            <Image
              key={`${index}-${layer.category}-${layer.source.uri || index}`}
              source={layer.source}
              style={{ position: 'absolute', left: x, top: y, ...imageStyle }}
            />
          );
        }

        // Each moving part sits in an Animated.View at its own position, so its
        // transform pivots around the limb, not the whole cat.
        return (
          <Animated.View
            key={`${index}-${layer.category}-${layer.source.uri || index}`}
            style={[{ position: 'absolute', left: x, top: y, width, height }, styleForPart(layer.part)]}>
            <Image source={layer.source} style={imageStyle} />
          </Animated.View>
        );
      })}
    </View>
  );
}
