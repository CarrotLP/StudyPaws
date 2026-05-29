/**
 * Haven design tokens, ported 1:1 from haven_prototype_7.html.
 * Colors come from the prototype's CSS `:root` variables and inline styles;
 * sizes/durations come from its inline pixel scales and @keyframes timings.
 */

export const HavenColors = {
  // Book frame (leather + ink + gold)
  ink: '#1A0F08',
  inkSoft: '#5A3F2A',
  leather: '#1F3A5F',
  leatherLight: '#2D4F7A',
  leatherShadow: '#0F1F38',
  gold: '#D4A82C',

  // Page (parchment)
  parchment: '#F0E0B8',
  parchmentDark: '#D9C28F',
  parchmentShadow: '#B89B5E',

  // World backdrop (sage radial gradient endpoints)
  backdropCenter: '#B0BFA8',
  backdropEdge: '#8A9C80',

  white: '#FFFFFF',
  // Translucent fills reused across cards/cells
  cellFill: 'rgba(255, 240, 200, 0.5)',
  cellInset: 'rgba(31, 58, 95, 0.15)',
  // Soft drop shadow under the cat (.floor-shadow)
  floorShadow: 'rgba(26, 15, 8, 0.3)',
} as const;

/**
 * Pixel-cat sprite palette, keyed by the single characters used in the
 * sprite arrays (CAT_PALETTE in the prototype). `k` and `w` reuse existing
 * HavenColors; the rest are the prototype's fur/shading/face hues.
 */
export const CatPalette = {
  k: HavenColors.ink, // #1A0F08
  K: '#3A2418',
  o: '#A88060',
  O: '#7A5A3E',
  l: '#C9A684',
  s: '#5C3D24',
  c: '#F2E1C2',
  m: '#FBEED4',
  e: '#7BA052',
  E: '#4A6B30',
  p: '#E89878',
  P: '#B85F45',
  w: HavenColors.white, // #FFFFFF
} as const;

/** Break-activity accent colors, keyed by HABITS id. */
export const HabitColors = {
  phoneoff: '#4A6FA5',
  stretch: '#7BA05B',
  steps: '#C97B3F',
  water: '#5BA8C9',
} as const;

/** Ribbon-bookmark colors, keyed by chapter id. */
export const RibbonColors = {
  home: '#C97B3F',
  calendar: '#5BA8C9',
  dress: '#8E5C7C',
  treasure: '#D4A82C',
  inventory: '#7BA05B',
  buddies: '#4A6FA5',
} as const;

/** Chest body colors, keyed by CHESTS id. */
export const ChestColors = {
  small: '#A0764B',
  ornate: '#8E5C7C',
} as const;

/**
 * Calendar heatmap ramp. `minThreshold` is inclusive lower bound of study
 * minutes; first entry (0) renders as the empty `cellFill`.
 */
export const CalendarHeat = {
  empty: HavenColors.cellFill,
  ramp: [
    { minThreshold: 1, color: '#D9E4C4' },
    { minThreshold: 30, color: '#9CC080' },
    { minThreshold: 75, color: '#5F8C4A' },
    { minThreshold: 130, color: '#3F6B2C' },
  ],
} as const;

/**
 * Font families. Values match the export keys from @expo-google-fonts/*,
 * which become the loaded `fontFamily` strings (see foundation step 2).
 */
export const HavenFonts = {
  pixel: 'PressStart2P_400Regular',
  body: 'VT323_400Regular',
} as const;

/** Press Start 2P sizes seen in the prototype (px). */
export const PixelFontSize = {
  xs: 6,
  sm: 7,
  base: 8,
  md: 9,
  lg: 10,
  xl: 11,
  xxl: 12,
  title: 13,
  dots: 18,
  stat: 16,
  dial: 22,
  timer: 34,
} as const;

/** Interactive control sizes (px) that don't map to the spacing scale. */
export const Control = {
  dialButton: 24,
  habitIcon: 28,
  legendSwatch: 14,
} as const;

/** VT323 (body) sizes seen in the prototype (px). */
export const BodyFontSize = {
  sm: 14,
  base: 15,
  md: 18,
  lg: 20,
  xl: 22,
} as const;

/** Default px-per-cell scale for each pixel sprite. */
export const PixelScale = {
  catDefault: 7,
  catHome: 6,
  catDress: 5,
  itemTiny: 2,
  itemSmall: 3,
  itemLarge: 6,
  chestCard: 3,
  chestOverlay: 6,
  buddy: 3,
} as const;

/** Sprite grid dimensions (cols x rows) for layout math. */
export const SpriteSize = {
  cat: { cols: 32, rows: 32 },
  item: { cols: 8, rows: 8 },
  chest: { cols: 16, rows: 14 },
  buddy: { cols: 12, rows: 12 },
} as const;

/** Structural sizes (px). */
export const Layout = {
  bookWidth: 460,
  bookMinHeight: 740,
  bookPadding: 14,
  ribbonWidth: 36,
  ribbonHeight: 40,
  devSkipSize: 22,
} as const;

/** Border widths (px) — pixel-art look leans on chunky 2-4px borders. */
export const Border = {
  thin: 1,
  base: 2,
  thick: 3,
  frame: 4,
} as const;

/** Hard pixel-shadow offsets (px). */
export const ShadowOffset = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
} as const;

/** Spacing scale (px) approximated from the prototype's gaps/padding. */
export const HavenSpacing = {
  xs: 4,
  sm: 6,
  base: 8,
  md: 10,
  lg: 12,
  xl: 18,
  xxl: 22,
} as const;

/** Animation/timing durations (ms), from @keyframes and setTimeout calls. */
export const Durations = {
  breathe: 4000,
  breatheSlow: 5000,
  zzzFloat: 3000,
  blink: 2000,
  toastPop: 2400,
  toastVisible: 2400,
  glowPulse: 1400,
  revealPop: 500,
  fadeIn: 300,
  chestOpenToReveal: 900,
} as const;
