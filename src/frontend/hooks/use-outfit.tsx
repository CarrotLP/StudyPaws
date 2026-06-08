import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { type Item, type ItemId, type OutfitSlot } from '../components/itemSprites';
import {
    DEFAULT_OWNED,
    loadOutfit,
    loadOwned,
    saveOutfit,
    saveOwned,
} from '../lib/haven-storage';

export type OutfitState = Record<OutfitSlot, ItemId | null>;

const INITIAL_OUTFIT: OutfitState = {
  body: 'c3_body',
  front_body: 'c3_rarm',
  front_accessory: 'lvest',
  back_body: null,
  back_accessory: null,
};

type OutfitContextValue = {
  hydrated: boolean;
  owned: ItemId[];
  outfit: OutfitState;
  /** Toggle an item in its slot (equip, or unequip if already worn). */
  equip: (item: Item) => void;
  /** Add an item to the wardrobe (used by Treasure chest rewards). */
  addOwned: (id: ItemId) => void;
  isOwned: (id: ItemId) => boolean;
  /** Reset owned items + outfit to first-launch defaults (dev reset). */
  resetOutfit: () => void;
};

const OutfitContext = createContext<OutfitContextValue | null>(null);

export function OutfitProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [owned, setOwned] = useState<ItemId[]>(DEFAULT_OWNED as ItemId[]);
  const [outfit, setOutfit] = useState<OutfitState>(INITIAL_OUTFIT);

  useEffect(() => {
    let mounted = true;
    Promise.all([loadOwned(), loadOutfit()]).then(([loadedOwned, loadedOutfit]) => {
      if (!mounted) return;
      setOwned(loadedOwned as ItemId[]);
      setOutfit({
        body: (loadedOutfit.body as ItemId | null) ?? 'c3_body',
        front_body: (loadedOutfit.front_body as ItemId | null) ?? 'c3_rarm',
        front_accessory: (loadedOutfit.front_accessory as ItemId | null) ?? 'lvest',
        back_body: (loadedOutfit.back_body as ItemId | null) ?? null,
        back_accessory: (loadedOutfit.back_accessory as ItemId | null) ?? null,
      });
      setHydrated(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (hydrated) saveOwned(owned);
  }, [hydrated, owned]);

  useEffect(() => {
    if (hydrated) saveOutfit(outfit);
  }, [hydrated, outfit]);

  const equip = useCallback((item: Item) => {
    setOutfit((o) => ({ ...o, [item.slot]: o[item.slot] === item.id ? null : item.id }));
  }, []);

  const addOwned = useCallback((id: ItemId) => {
    setOwned((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const isOwned = useCallback((id: ItemId) => owned.includes(id), [owned]);

  const resetOutfit = useCallback(() => {
    setOwned(DEFAULT_OWNED as ItemId[]);
    setOutfit(INITIAL_OUTFIT);
  }, []);

  return (
    <OutfitContext.Provider value={{ hydrated, owned, outfit, equip, addOwned, isOwned, resetOutfit }}>
      {children}
    </OutfitContext.Provider>
  );
}

export function useOutfit() {
  const ctx = useContext(OutfitContext);
  if (!ctx) throw new Error('useOutfit must be used within OutfitProvider');
  return ctx;
}
