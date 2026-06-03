import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Border, HavenColors, HavenFonts, HavenSpacing, PixelFontSize, ShadowOffset } from '@/constants/havenTheme';

type PopupProps = {
  /** Array of arbitrary items to render inside the popup. Each item may be any React node. */
  title?: string;
  objects?: any[];
};

export function Popup({ title, objects = [] }: PopupProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ScrollView contentContainerStyle={styles.cardContent}>
          <View style={styles.objectColumn}>
            {title && <Text style={styles.title}>{title}</Text>}
            {objects.map((obj, index) => (
              <View key={index} style={styles.object}>
                {obj}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: HavenSpacing.xxl,
    backgroundColor: HavenColors.parchment,
  },

  card: {
    width: '100%',
    maxHeight: '100%',
    backgroundColor: HavenColors.cellFill,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
    padding: HavenSpacing.lg,
    //boxShadow: `${ShadowOffset.two}px ${ShadowOffset.two}px 0px ${HavenColors.parchmentShadow}`,
    shadowColor: HavenColors.parchmentShadow,
    shadowOffset: { width: ShadowOffset.two, height: ShadowOffset.two },
    shadowOpacity: 1,
    shadowRadius: 0,

  },

  objectColumn: {
    width: '100%',
    flexDirection: 'column',
    gap: HavenSpacing.lg,
  },

  object: {
    width: '100%',
    alignItems: 'stretch',
  },

  cardContent: {
    width: '100%',
    paddingBottom: HavenSpacing.lg,
    flexGrow: 1,
  },

  title: {
    fontSize: PixelFontSize.lg,
    fontFamily: HavenFonts.pixel,
    color: HavenColors.ink,
    textAlign: 'center',
    marginBottom: HavenSpacing.md,
  },
});