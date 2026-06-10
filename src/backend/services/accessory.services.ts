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


  // Using upsert as it's often more robust against RLS issues
  // and handles the "user" reserved word well via the object key.
  const { data, error } = await supabase
    .from('users_accessories')
    .upsert({
      user: userUid,
      accessory: accessoryName,
      chosen: chosen
    }, {
      onConflict: 'user,accessory'
    })
    .select();

  if (error) {
    console.error('DEBUG: Supabase toggle error:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.error('DEBUG: Toggle failed. This is likely a Supabase RLS Policy issue.');
  } else {
  }
}
