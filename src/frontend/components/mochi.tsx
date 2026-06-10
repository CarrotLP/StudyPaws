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

export function Mochi({
  id,
  scale = 1,
  silhouette = false,
  walkSignal,
  animate = false,
}: MochiProps) {
  // How long the cat walks after a tap.
  const WALK_MS = 2500;
  const { user } = useAuth();
  const [layers, setLayers] = useState<MochiAsset[]>([]);
  const finalScale = scale * GLOBAL_MOCHI_SCALE;
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Walk for WALK_MS whenever `walkSignal` changes (i.e. the cat is tapped).
  const [isWalking, setIsWalking] = useState(false);
  const walkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!walkSignal) return; // ignore initial 0/undefined
    if (walkTimer.current) clearTimeout(walkTimer.current);
    if (isMounted.current) setIsWalking(true);
    walkTimer.current = setTimeout(() => {
      if (isMounted.current) setIsWalking(false);
    }, WALK_MS);
  }, [walkSignal]);
  useEffect(() => () => {
    if (walkTimer.current) clearTimeout(walkTimer.current);
  }, []);

  // Continuous `animate` OR the timed tap walk.
  const walking = animate || isWalking;

  // Tier 2 walk cycle: a single phase 0 → 2π driving every limb.
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

  const LIFT = 6;
  const STRIDE = 7;
  const SWING = 8;
  const TAIL = 6;

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

  const styleForPart = (part?: string) => {
    switch (part) {
      case 'lfoot': return footLeftStyle;
      case 'rfoot': return footRightStyle;
      case 'larm': return armLeftStyle;
      case 'rarm': return armRightStyle;
      case 'tail': return tailStyle;
      default: return bodyStyle;
    }
  };

  const fetchMochiData = useCallback(async () => {
    if (!user) return;

    try {
      const getImageSize = (uri: string): Promise<{ width: number; height: number } | null> => {
        return new Promise((resolve) => {
          Image.getSize(uri, (width, height) => resolve({ width, height }), () => resolve({ width: 512, height: 512 }));
        });
      };

      const { data: userData } = await supabase.from('users').select('character').eq('user_uid', user.id).maybeSingle();
      if (!userData?.character) return;

      const { data: charData } = await supabase.from('characters').select('*').eq('name', userData.character).maybeSingle();
      if (!charData) return;

      const bodyPromises = Object.entries(MOCHI_BODY).map(async ([key, config]): Promise<MochiAsset | null> => {
        const imageUrl = charData[key];
        if (imageUrl) {
          const size = await getImageSize(imageUrl);
          return {
            source: { uri: imageUrl },
            category: config.category,
            x: config.x,
            y: config.y,
            width: size?.width,
            height: size?.height,
            part: key,
          };
        }
        return null;
      });

      const bodyResults = await Promise.all(bodyPromises);
      const resolvedBodyLayers = bodyResults.filter((l): l is MochiAsset => l !== null);

      const { data: userAccessories } = await supabase.from('users_accessories').select('accessory').eq('user', user.id).eq('chosen', true);
      const accessoryLayers: MochiAsset[] = [];
      if (userAccessories && userAccessories.length > 0) {
        const accessoryNames = userAccessories.map((ua) => ua.accessory);
        const { data: components } = await supabase.from('accessories_components').select('components').in('accessory_name', accessoryNames);
        if (components && components.length > 0) {
          const componentNames = components.map((c) => c.components).filter((c): c is string => !!c);
          const { data: compData } = await supabase.from('components').select('image, x, y, layer, image_name').in('image_name', componentNames);
          if (compData) {
            const accPromises = compData.map(async (c): Promise<MochiAsset | null> => {
              const size = await getImageSize(c.image);
              return { source: { uri: c.image }, category: c.layer as MochiLayerCategory, x: Number(c.x) + shiftRight, y: Number(c.y) + shiftUp, width: size?.width, height: size?.height };
            });
            const accResults = await Promise.all(accPromises);
            const resolvedAcc = accResults.filter((l): l is MochiAsset => l !== null);
            accessoryLayers.push(...resolvedAcc);
          }
        }
      }

      if (isMounted.current) {
        setLayers([...resolvedBodyLayers, ...accessoryLayers]);
      }
    } catch (err) {
      console.error('Error fetching Mochi data:', err);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void fetchMochiData();
    }, [fetchMochiData]),
  );

  const sortedLayers = [...layers].sort((a, b) => LAYER_ORDER.indexOf(a.category) - LAYER_ORDER.indexOf(b.category));
  if (layers.length === 0) return null;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  sortedLayers.forEach((layer) => {
    const w = layer.width ?? 512, h = layer.height ?? 512, x = layer.x ?? 0, y = layer.y ?? 0;
    if (x < minX) minX = x; if (y < minY) minY = y;
    if (x + w > maxX) maxX = x + w; if (y + h > maxY) maxY = y + h;
  });

  const padding = 20 * finalScale;
  const containerWidth = (maxX - minX) * finalScale + padding * 2;
  const containerHeight = (maxY - minY) * finalScale + padding * 2;

  return (
    <View style={{ width: containerWidth, height: containerHeight }}>
      {sortedLayers.map((layer, index) => {
        const width = (layer.width ?? 512) * finalScale;
        const height = (layer.height ?? 512) * finalScale;
        const x = ((layer.x ?? 0) - minX) * finalScale + padding;
        const y = ((layer.y ?? 0) - minY) * finalScale + padding;
        const imageStyle = { width, height, tintColor: silhouette ? '#3A2418' : undefined } as const;

        if (!walking || layer.part === 'shadow') {
          return <Image key={`${index}-${layer.category}-${layer.source.uri || index}`} source={layer.source} style={{ position: 'absolute', left: x, top: y, ...imageStyle }} />;
        }

        return (
          <Animated.View key={`${index}-${layer.category}-${layer.source.uri || index}`} style={[{ position: 'absolute', left: x, top: y, width, height }, styleForPart(layer.part)]}>
            <Image source={layer.source} style={imageStyle} />
          </Animated.View>
        );
      })}
    </View>
  );
}
