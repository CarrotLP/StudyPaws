// New Mochi-based item data.
// In the final solution, these will be requested from the database.

export type OutfitSlot =
  | 'back_body'
  | 'back_accessory'
  | 'body'
  | 'front_accessory'
  | 'front_body';

export type ItemId = string;

export type Item = {
  id: ItemId;
  name: string;
  slot: OutfitSlot;
};

export const ALL_ITEMS: Item[] = [
  { id: 'c3_body', name: 'Body', slot: 'body' },
  { id: 'c3_rarm', name: 'Right Arm', slot: 'front_body' },
  { id: 'lvest', name: 'Left Vest', slot: 'front_accessory' },
];

// Placeholder for compatibility during transition
export const ITEM_SPRITES: Record<ItemId, string[]> = {} as any;
export const ITEM_PALETTE: Record<string, string> = {};
export const SILHOUETTE_COLOR = '#3A2418';
