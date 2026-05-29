// Item data + pixel-art sprite arrays, ported verbatim from haven_prototype.html
// (ALL_ITEMS and ItemIcon). Data only — no JSX.

export type OutfitSlot = 'head' | 'face' | 'neck' | 'body';
export type ItemId =
  | 'scarf'
  | 'beret'
  | 'glasses'
  | 'bowtie'
  | 'flower'
  | 'sweater'
  | 'monocle'
  | 'crown'
  | 'bandana';

export type Item = {
  id: ItemId;
  name: string;
  slot: OutfitSlot;
};

export const ALL_ITEMS: Item[] = [
  { id: 'scarf', name: 'Knit Scarf', slot: 'neck' },
  { id: 'beret', name: 'Forest Beret', slot: 'head' },
  { id: 'glasses', name: 'Spectacles', slot: 'face' },
  { id: 'bowtie', name: 'Plum Bow', slot: 'neck' },
  { id: 'flower', name: 'Daisy Crown', slot: 'head' },
  { id: 'sweater', name: 'Cozy Sweater', slot: 'body' },
  { id: 'monocle', name: 'Monocle', slot: 'face' },
  { id: 'crown', name: 'Tiny Crown', slot: 'head' },
  { id: 'bandana', name: 'Red Bandana', slot: 'neck' },
];

export const ITEM_SPRITES: Record<ItemId, string[]> = {
  scarf: [
    '........',
    '.RRRRRR.',
    'RRRRRRRR',
    '..RR....',
    '..RrR...',
    '..RrR...',
    '..RrR...',
    '..RRR...',
  ],
  beret: [
    '........',
    '.gggggg.',
    'ggGGGGgg',
    'gGGGGGGg',
    '.gGGGGg.',
    '..gggg..',
    '........',
    '........',
  ],
  glasses: [
    '........',
    'kk....kk',
    'kCk..kCk',
    'kCkkkkCk',
    'kCk..kCk',
    'kCk..kCk',
    'kk....kk',
    '........',
  ],
  bowtie: [
    '........',
    'p.....p.',
    'pp...pp.',
    'pPp.pPp.',
    'pPpPpPp.',
    'pPp.pPp.',
    'pp...pp.',
    'p.....p.',
  ],
  flower: [
    '..w..w..',
    '.wWwwWw.',
    'wWYYYYWw',
    'wWYyyYWw',
    'wWYYYYWw',
    '.wWwwWw.',
    '..w..w..',
    '........',
  ],
  sweater: [
    '.m....m.',
    '.mm..mm.',
    '.mMMMMm.',
    'mMMMMMMm',
    'mMMMMMMm',
    'mMMMMMMm',
    '.mmmmmm.',
    '........',
  ],
  monocle: [
    '........',
    '..YYYY..',
    '.YssssY.',
    '.YsccsY.',
    '.YsccsY.',
    '.YssssY.',
    '..YYYY..',
    '....YY..',
  ],
  crown: [
    '........',
    'Y..YY..Y',
    'YYYYYYYY',
    'YRYbYrYY',
    'YYYYYYYY',
    'yyyyyyyy',
    '........',
    '........',
  ],
  bandana: [
    '........',
    '.BBBBBB.',
    'BCBCBCBB',
    'BBBBBBBB',
    '..BB....',
    '..BbB...',
    '..BBB...',
    '........',
  ],
};

export const ITEM_PALETTE: Record<string, string> = {
  R: '#A14444',
  r: '#7A2E2E',
  g: '#3E5444',
  G: '#536B5A',
  k: '#1A0F08',
  C: '#FFFFFF',
  p: '#7E5990',
  P: '#5E3F70',
  w: '#FFFAF0',
  W: '#F0E0B8',
  Y: '#F2C94C',
  y: '#8C6B14',
  m: '#8E5C7C',
  M: '#6E4361',
  s: '#5A3F2A',
  c: '#7BC9E8',
  b: '#4A8FBC',
  B: '#B73838',
};

// Single dark fill used for unowned (locked) item silhouettes.
export const SILHOUETTE_COLOR = '#3A2418';
