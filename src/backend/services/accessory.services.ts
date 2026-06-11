import { supabase } from '@/backend/lib/supabase';

export type UserAccessory = {
  accessory: string;
  chosen: boolean;
  image: string;
  // ALL layers this accessory occupies (an accessory can span several, e.g. a
  // vest covers both back_accessory and front_accessory). Used so equipping it
  // unwears anything that overlaps ANY of these layers.
  categories: string[];
};

export async function getUserAccessories(userUid: string): Promise<UserAccessory[]> {
  const { data, error } = await supabase
    .from('users_accessories')
    .select(`
      accessory,
      chosen,
      accessories:accessory (
        accessories_components (
          components:components (
            image,
            layer
          )
        )
      )
    `)
    .eq('user', userUid)
    // Stable, deterministic order so the dress grid doesn't reshuffle on toggle.
    .order('accessory', { ascending: true });

  if (error) {
    console.error('Error in getUserAccessories:', error);
    throw error;
  }

  return (data || []).map((item: any) => {
    const accessoryData = item.accessories;
    const components = accessoryData?.accessories_components || [];
    const compArray = Array.isArray(components) ? components : [components];

    // First component's image is used as the grid thumbnail.
    const image = compArray[0]?.components?.image || '';
    // Every distinct layer this accessory occupies.
    const categories = Array.from(
      new Set(
        compArray
          .map((c: any) => c?.components?.layer)
          .filter((layer: any): layer is string => !!layer),
      ),
    ) as string[];

    return {
      accessory: item.accessory,
      chosen: item.chosen,
      image,
      categories,
    };
  });
}

export async function toggleAccessory(userUid: string, accessoryName: string, chosen: boolean): Promise<void> {
  const { error } = await supabase
    .from('users_accessories')
    .upsert({
      user: userUid,
      accessory: accessoryName,
      chosen: chosen
    }, {
      onConflict: 'user,accessory'
    });

  if (error) {
    console.error('Error in toggleAccessory:', error);
    throw error;
  }
}

export async function addAccessoryToUser(userUid: string, accessoryName: string): Promise<void> {
  const { error } = await supabase
    .from('users_accessories')
    .insert({
      user: userUid,
      accessory: accessoryName,
      chosen: false
    });

  if (error && error.code !== '23505') { // Ignore unique constraint violation (already owned)
    console.error('Error in addAccessoryToUser:', error);
    throw error;
  }
}

export async function removeAccessoryFromUser(userUid: string, accessoryName: string): Promise<void> {
  const { error } = await supabase
    .from('users_accessories')
    .delete()
    .eq('user', userUid)
    .eq('accessory', accessoryName);

  if (error) {
    console.error('Error in removeAccessoryFromUser:', error);
    throw error;
  }
}
