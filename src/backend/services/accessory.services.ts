import { supabase } from '@/backend/lib/supabase';

export type UserAccessory = {
  accessory: string;
  chosen: boolean;
  image: string;
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
            image
          )
        )
      )
    `)
    .eq('user', userUid);

  if (error) {
    console.error('Error in getUserAccessories:', error);
    throw error;
  }

  return (data || []).map((item: any) => {
    const accessoryData = item.accessories;
    const components = accessoryData?.accessories_components || [];

    // Get the first component's image
    const firstComp = Array.isArray(components) ? components[0] : components;
    const image = firstComp?.components?.image || '';

    return {
      accessory: item.accessory,
      chosen: item.chosen,
      image,
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
