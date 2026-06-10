import { supabase } from '@/backend/lib/supabase';

export type ChestReward = {
  name: string;
  image: string;
};

export type ChestData = {
  name: string;
  price: number;
  pool: ChestReward[];
};

export async function getChests(): Promise<ChestData[]> {
  // Fetch chests and join with accessories through the junction table.
  // Note: we're following the naming conventions seen in other services.
  const { data, error } = await supabase
    .from('chests')
    .select(`
      name,
      price,
      chests_accessories (
        accessories (
          accessory_name,
          accessories_components (
            components (
              image
            )
          )
        )
      )
    `);

  if (error) {
    console.error('Error fetching chests:', error);
    throw error;
  }

  return (data || []).map((chest: any) => ({
    name: chest.name,
    price: chest.price,
    pool: (chest.chests_accessories || []).map((ca: any) => {
      const accessory = ca.accessories;
      // accessories_components might be a single object or an array depending on the schema
      const components = accessory?.accessories_components || [];
      const firstComp = Array.isArray(components) ? components[0] : components;
      const image = firstComp?.components?.image || '';
      return {
        name: accessory?.accessory_name || '',
        image: image,
      };
    }),
  }));
}
