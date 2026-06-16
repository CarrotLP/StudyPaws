import { Image } from 'react-native';

import { supabase } from '@/backend/lib/supabase';
import { MOCHI_BODY, shiftRight, shiftUp } from '@/components/mochi';
import type { MochiAsset, MochiLayerCategory } from '@/components/mochi';

const getImageSize = (uri: string): Promise<{ width: number; height: number } | null> =>
  new Promise((resolve) => {
    Image.getSize(
      uri,
      (w, h) => resolve({ width: w, height: h }),
      () => resolve({ width: 512, height: 512 }),
    );
  });

/**
 * Fetches and resolves all Mochi layers for a given character + user.
 *
 * @param characterName - the character row name (e.g. "tabby_orange"); if null
 *   the user's own character is looked up from the `users` table.
 * @param accessoryUserId - whose worn accessories to draw.
 */
export async function fetchMochiLayers(
  characterName: string | null,
  accessoryUserId: string | null,
): Promise<MochiAsset[]> {
  let targetCharacter = characterName ?? null;
  if (!targetCharacter) return [];

  const { data: charData } = await supabase
    .from('characters')
    .select('*')
    .eq('name', targetCharacter)
    .maybeSingle();
  if (!charData) return [];

  const bodyPromises = Object.entries(MOCHI_BODY).map(async ([key, config]): Promise<MochiAsset | null> => {
    const imageUrl = charData[key];
    if (!imageUrl) return null;
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
  });
  const resolvedBodyLayers = (await Promise.all(bodyPromises)).filter(
    (l): l is MochiAsset => l !== null,
  );

  const accessoryLayers: MochiAsset[] = [];
  const { data: userAccessories } = accessoryUserId
    ? await supabase
        .from('users_accessories')
        .select('accessory')
        .eq('user', accessoryUserId)
        .eq('chosen', true)
    : { data: null };

  if (userAccessories && userAccessories.length > 0) {
    const accessoryNames = userAccessories.map((ua) => ua.accessory);
    const { data: components } = await supabase
      .from('accessories_components')
      .select('components')
      .in('accessory_name', accessoryNames);
    if (components && components.length > 0) {
      const componentNames = components.map((c) => c.components).filter((c): c is string => !!c);
      const { data: compData } = await supabase
        .from('components')
        .select('image, x, y, layer, image_name')
        .in('image_name', componentNames);
      if (compData) {
        const accPromises = compData.map(async (c): Promise<MochiAsset | null> => {
          const size = await getImageSize(c.image);
          return {
            source: { uri: c.image },
            category: c.layer as MochiLayerCategory,
            x: Number(c.x) + shiftRight,
            y: Number(c.y) + shiftUp,
            width: size?.width,
            height: size?.height,
          };
        });
        accessoryLayers.push(
          ...(await Promise.all(accPromises)).filter((l): l is MochiAsset => l !== null),
        );
      }
    }
  }

  return [...resolvedBodyLayers, ...accessoryLayers];
}
