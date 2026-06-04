import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type Href, usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    Border,
    HavenColors,
    HavenSpacing,
    Layout,
    PixelFontSize,
    RibbonColors,
    ShadowOffset,
} from '../constants/havenTheme';

// Chapters + colours + glyphs. `id` is the route name; home is the index ('/').
// `href` is typed as `string` (rather than `Href`) so a freshly-added route
// works before Expo Router regenerates `.expo/types/router.d.ts` on next dev
// server start; the cast at navigate-time below is the single boundary check.
// A ribbon shows either a vector `icon` (MaterialCommunityIcons — reliable
// monochrome glyphs that honour the tint colour) or a text `glyph` symbol.
type IconName = keyof typeof MaterialCommunityIcons.glyphMap;
type RibbonDef = {
  id: string;
  href: string;
  color: string;
  glyph?: string;
  icon?: IconName;
};

const RIBBONS: RibbonDef[] = [
  // Home = book with pen; Daily Quest = image stack; Settings = gear.
  // Home = book with pen; Daily Quest = image stack; Dress = cat silhouette;
  // Treasure = treasure chest; Settings = gear.
  { id: 'index', href: '/', color: RibbonColors.home, icon: 'book-edit-outline' },
  { id: 'daily_quest', href: '/daily_quest', color: RibbonColors.calendar, icon: 'image-multiple-outline' },
  { id: 'dress', href: '/dress', color: RibbonColors.dress, icon: 'cat' },
  { id: 'treasure', href: '/treasure', color: RibbonColors.treasure, icon: 'treasure-chest-outline' },
  // Inventory and Buddies routes/files are kept (not deleted) — just no longer
  // surfaced in the ribbon.
  { id: 'settings', href: '/settings', color: RibbonColors.buddies, icon: 'cog-outline' },
];

const W = Layout.ribbonWidth;
const H = Layout.ribbonHeight;
const BODY = Math.round(H * 0.8);
const TIP = H - BODY;
const B = Border.thick;

// A bookmark shape: rectangle body with a downward-pointing tip at the BOTTOM —
// the RN equivalent of the prototype's clip-path polygon, built from a rect View
// plus a border-triangle View (apex pointing down).
function Pentagon({
  width,
  bodyHeight,
  tipHeight,
  color,
}: {
  width: number;
  bodyHeight: number;
  tipHeight: number;
  color: string;
}) {
  return (
    <View>
      <View style={{ width, height: bodyHeight, backgroundColor: color }} />
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: width / 2,
          borderRightWidth: width / 2,
          borderTopWidth: tipHeight,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
        }}
      />
    </View>
  );
}

function Ribbon({
  color,
  glyph,
  icon,
  active,
  onPress,
}: {
  color: string;
  glyph?: string;
  icon?: IconName;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.ribbon, active ? styles.ribbonActive : styles.ribbonIdle]}>
      {/* Ink outline pentagon behind, colour pentagon inset on top. */}
      <Pentagon width={W} bodyHeight={BODY} tipHeight={TIP} color={HavenColors.ink} />
      <View style={styles.front}>
        <Pentagon width={W - 2 * B} bodyHeight={BODY - B} tipHeight={Math.max(0, TIP - B)} color={color} />
      </View>
      <View style={styles.glyphWrap}>
        {icon ? (
          <MaterialCommunityIcons name={icon} size={PixelFontSize.stat} color={HavenColors.parchment} />
        ) : (
          <Text style={styles.glyph}>{glyph}</Text>
        )}
      </View>
    </Pressable>
  );
}

export function RibbonBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const activeId = pathname === '/' ? 'index' : pathname.replace(/^\//, '');

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + HavenSpacing.base }]}>
      {RIBBONS.map((ribbon) => (
        <Ribbon
          key={ribbon.id}
          color={ribbon.color}
          glyph={ribbon.glyph}
          icon={ribbon.icon}
          active={ribbon.id === activeId}
          onPress={() => router.navigate(ribbon.href as Href)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingTop: HavenSpacing.md,
    backgroundColor: HavenColors.leather,
    borderTopWidth: Border.frame,
    borderTopColor: HavenColors.ink,
  },
  ribbon: {
    width: W,
    height: H,
  },
  ribbonIdle: {
    boxShadow: `${ShadowOffset.two}px ${ShadowOffset.two}px 0px ${HavenColors.leatherShadow}`,
  },
  ribbonActive: {
    // Bottom-bar equivalent of the old left-shift: the active tab lifts UP.
    transform: [{ translateY: -HavenSpacing.sm }],
    boxShadow: `${ShadowOffset.two}px ${ShadowOffset.four}px 0px ${HavenColors.leatherShadow}`,
  },
  front: {
    position: 'absolute',
    left: B,
    top: B,
  },
  glyphWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: B,
    bottom: TIP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontSize: PixelFontSize.stat,
    color: HavenColors.parchment,
  },
});
