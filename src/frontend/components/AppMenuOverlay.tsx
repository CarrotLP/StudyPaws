import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type Href, usePathname, useRouter } from 'expo-router';
import { type ComponentProps, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_MENU_ITEMS } from '@/constants/appNavigation';
import {
  Border,
  HavenColors,
  HavenFonts,
  HavenSpacing,
  PixelFontSize,
  ShadowOffset,
} from '@/constants/havenTheme';

const MENU_ICON_SIZE = 28;
const MENU_ITEM_ICON_SIZE = 22;

function routeIdFromPathname(pathname: string) {
  return pathname === '/' ? 'index' : pathname.replace(/^\//, '');
}

export function AppMenuOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const slide = useRef(new Animated.Value(0)).current;
  const panelWidth = width / 2;
  const activeId = routeIdFromPathname(pathname);

  useEffect(() => {
    Animated.timing(slide, {
      toValue: open ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [open, slide]);

  const translateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [-panelWidth, 0],
  });

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {!open && (
        <Pressable
          accessibilityLabel="Open menu"
          accessibilityRole="button"
          onPress={() => setOpen(true)}
          style={[
            styles.menuButton,
            {
              top: insets.top + HavenSpacing.sm,
              left: HavenSpacing.md,
            },
          ]}>
          <MaterialCommunityIcons name="menu" size={MENU_ICON_SIZE} color={HavenColors.gold} />
        </Pressable>
      )}

      {open && (
        <View style={styles.overlay}>
          <Pressable
            accessibilityLabel="Close menu"
            style={[styles.dismissArea, { left: panelWidth }]}
            onPress={() => setOpen(false)}
          />
          <Animated.View
            style={[
              styles.panel,
              {
                width: panelWidth,
                paddingTop: insets.top + HavenSpacing.xl,
                paddingBottom: insets.bottom + HavenSpacing.lg,
                transform: [{ translateX }],
              },
            ]}>
            <Text style={styles.menuTitle}>Menu</Text>
            <View style={styles.rule} />
            {APP_MENU_ITEMS.map((item) => {
              const active = item.id === activeId;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() => {
                    setOpen(false);
                    router.navigate(item.href as Href);
                  }}
                  style={({ pressed }) => [
                    styles.menuItem,
                    active && styles.menuItemActive,
                    pressed && styles.menuItemPressed,
                  ]}>
                  <Text style={[styles.menuItemText, active && styles.menuItemTextActive]}>
                    {item.label}
                  </Text>
                  <MaterialCommunityIcons
                    name={item.icon as ComponentProps<typeof MaterialCommunityIcons>['name']}
                    size={MENU_ITEM_ICON_SIZE}
                    color={active ? HavenColors.gold : HavenColors.inkSoft}
                  />
                </Pressable>
              );
            })}
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    position: 'absolute',
    zIndex: 300,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HavenColors.ink,
    borderWidth: Border.base,
    borderColor: HavenColors.gold,
    boxShadow: `${ShadowOffset.two}px ${ShadowOffset.two}px 0px ${HavenColors.leatherShadow}`,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 299,
    backgroundColor: HavenColors.overlayScrim,
  },
  dismissArea: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
  },
  panel: {
    minHeight: '100%',
    gap: HavenSpacing.base,
    paddingHorizontal: HavenSpacing.md,
    backgroundColor: HavenColors.parchment,
    borderRightWidth: Border.frame,
    borderRightColor: HavenColors.ink,
    boxShadow: `${ShadowOffset.four}px 0px 0px ${HavenColors.leatherShadow}`,
  },
  menuTitle: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.lg,
    color: HavenColors.leather,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  rule: {
    height: Border.thick,
    marginBottom: HavenSpacing.sm,
    backgroundColor: HavenColors.ink,
  },
  menuItem: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: HavenSpacing.sm,
    paddingVertical: HavenSpacing.md,
    paddingHorizontal: HavenSpacing.md,
    backgroundColor: HavenColors.cellFill,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
  },
  menuItemActive: {
    backgroundColor: HavenColors.leather,
    borderColor: HavenColors.ink,
  },
  menuItemPressed: {
    transform: [{ translateX: ShadowOffset.one }, { translateY: ShadowOffset.one }],
  },
  menuItemText: {
    flex: 1,
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.base,
    color: HavenColors.ink,
    textAlign: 'left',
    lineHeight: PixelFontSize.base * 1.5,
  },
  menuItemTextActive: {
    color: HavenColors.gold,
  },
});
