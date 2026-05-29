import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { type Item, type ItemId, type OutfitSlot } from '@/components/itemSprites';
import {
  DEFAULT_OWNED,
  loadOutfit,
  loadOwned,
  saveOutfit,
  saveOwned,
} from '@/lib/haven-storage';

export type OutfitState = Record<OutfitSlot, ItemId | null>;

const INITIAL_OUTFIT: OutfitState = { head: null, face: 'glasses', neck: 'scarf', body: null };

type OutfitContextValue = {
  hydrated: boolean;
  owned: ItemId[];
  outfit: OutfitState;
  /** Toggle an item in its slot (equip, or unequip if already worn). */
  equip: (item: Item) => void;
  /** Add an item to the wardrobe (used by Treasure chest rewards). */
  addOwned: (id: ItemId) => void;
  isOwned: (id: ItemId) => boolean;
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
        head: (loadedOutfit.head as ItemId | null) ?? null,
        face: (loadedOutfit.face as ItemId | null) ?? null,
        neck: (loadedOutfit.neck as ItemId | null) ?? null,
        body: (loadedOutfit.body as ItemId | null) ?? null,
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

  return (
    <OutfitContext.Provider value={{ hydrated, owned, outfit, equip, addOwned, isOwned }}>
      {children}
    </OutfitContext.Provider>
  );
}

export function useOutfit() {
  const ctx = useContext(OutfitContext);
  if (!ctx) throw new Error('useOutfit must be used within OutfitProvider');
  return ctx;
}
